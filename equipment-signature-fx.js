// Render-only signatures made exclusively from authored raster artwork.
// Missing art draws nothing: never substitute temporary geometry. Simulation
// owns every clock/position; this module does not mutate it or consume RNG.
import {SIGNATURE_FRAMES,SIGNATURE_ATLAS} from './equipment-signature-art-data.js';
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number.isFinite(n)?n:lo));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const alive=p=>!!p&&p.hp>0&&p.status!=='downed'&&!(p.heineckeEscape>0);
const images=Object.create(null);
const sources={signature:['equipment-signature-atlas.webp',SIGNATURE_ATLAS.width,SIGNATURE_ATLAS.height],muzzle:['fx-muzzle-twin.webp',237,122],atmosphere:['fx-role-split/atmosphere-smoke-gas-q92.webp',1024,1024],combat:['combat-fx196-q92.webp',512,512],wwi:['wwi-equipment-atlas.webp',1280,1024]};
export const equipmentSignatureArtReady=Promise.all(Object.entries(sources).map(([key,[file,w,h]])=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const image=new Image();image.decoding='async';
 image.onload=()=>{const ok=image.naturalWidth===w&&image.naturalHeight===h;if(ok)images[key]=image;resolve(ok);};
 image.onerror=()=>resolve(false);image.src=new URL('./'+file,import.meta.url).href;
}))).then(results=>results.every(Boolean));
function paint(c,image,f,x,y,width,angle=0,alpha=1){
 if(!image||!f||!(width>0&&alpha>0)||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const scale=width/(f.visualWidth||f.w),w=f.w*scale,h=f.h*scale;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=clamp(alpha);c.imageSmoothingEnabled=true;
 c.drawImage(image,f.x,f.y,f.w,f.h,-(f.pivotX??f.w/2)*scale,-(f.pivotY??f.h/2)*scale,w,h);c.restore();return true;
}
const authored=(c,key,x,y,w,a=0,alpha=1)=>paint(c,images.signature,SIGNATURE_FRAMES[key],x,y,w,a,alpha);
const cell=(x,y,w,h=w)=>({x,y,w,h});
const SPARK=cell(0,384,128),GUST=cell(0,0,256),VAPOR=cell(768,512,256),MUZZLE=cell(0,0,237,122);
// Blend only between adjacent authored frames, with a maximum of two draw calls.
function phase(c,prefix,q,x,y,width,angle=0,alpha=1,low=false){
 const f=clamp(q)*2,index=Math.min(2,Math.floor(f)),mix=f-index;
 if(low||index===2)return authored(c,prefix+Math.round(f),x,y,width,angle,alpha);
 authored(c,prefix+index,x,y,width,angle,alpha*(1-mix));
 if(mix>0)authored(c,prefix+(index+1),x,y,width,angle,alpha*mix);
}
export function drawBrockConcealment(c,p,x,y,{low=false,scale=1}={}){
 if(!alive(p)||!(p.kaiserFogTime>0))return;
 const left=clamp(p.kaiserFogTime,0,3),age=3-left,fade=Math.min(1,age/.18,left/.25);
 // One whole-aircraft cloud in both quality modes. Only phase blending changes.
 const q=age<.5?age:age<2.25?.5:.5+(age-2.25)/1.5;
 phase(c,'brock',q,x,y,104*clamp(scale,.5,3),finite(p.a)+Math.PI/2,.83*fade,low);
}
export function drawRankinBurst(c,p,x,y,{low=false}={}){
 if(!alive(p)||!(p.rankinFlash>0))return;
 const q=clamp(1-p.rankinFlash/.5),record=p.equipmentRankinFx;
 const ox=x+(Number.isFinite(record?.x)?record.x-finite(p.x):0),oy=y+(Number.isFinite(record?.y)?record.y-finite(p.y):0),a=finite(record?.a,finite(p.a));
 // Native fan points down; in game forward is +X and rear is -X.
 const tailX=ox-Math.cos(a)*23,tailY=oy-Math.sin(a)*23;
 phase(c,'rankin',q,tailX,tailY,95+q*100,a+Math.PI/2,Math.pow(1-q,.3),low);
 if(q<.3&&Array.isArray(record?.clears))for(let i=0,n=Math.min(record.clears.length,low?6:12);i<n;i++){
  const hit=record.clears[i];if(Number.isFinite(hit?.x)&&Number.isFinite(hit?.y))paint(c,images.combat,SPARK,x+hit.x-finite(p.x),y+hit.y-finite(p.y),15+q*18,0,1-q/.3);
 }
}
export function drawRepairStitch(c,p,x,y,{low=false}={}){
 if(!alive(p)||!(p.repairFlash151>0))return;
 const q=clamp(1-p.repairFlash151/.75),a=finite(p.a),fade=Math.min(1,q*10,(1-q)*4);
 for(const side of [-1,1]){const sideOffset=side*(23-q*5);phase(c,'repair',q,x+Math.cos(a)*12-Math.sin(a)*sideOffset,y+Math.sin(a)*12+Math.cos(a)*sideOffset,14,a,fade,low);}
}
export function drawGloveCadence(c,p,x,y,{low=false}={}){
 if(!alive(p)||!p.upgrades?.flightGloves||!(p.bishopGlovesTime>0)||p.invuln>0||!(p.muzzleFlash>0)||p.reloadTime!==0)return;
 const a=finite(p.a),fade=clamp(p.muzzleFlash/.08);
 paint(c,images.muzzle,MUZZLE,x+Math.cos(a)*29,y+Math.sin(a)*29,low?28:32,a,fade);
}
export function drawWimperisSight(c,x,y,remaining,{low=false}={}){
 if(!(remaining>0)||!Number.isFinite(x)||!Number.isFinite(y))return;
 const q=clamp(1-remaining/.4),width=46,fade=Math.min(1,remaining/.1);
 // Authored sight frames already converge; single frames avoid double etched bars.
 phase(c,'sight',q,x,y,width,0,fade,true);
}
export function drawAirbrakePressure(c,p,x,y,{low=false,local=false}={}){
 if(!alive(p)||!p.upgrades?.strutterAirbrake||p.bomberTransfer||!Number.isFinite(p.strutterBrakeAge))return;
 const age=p.strutterBrakeAge;if(age<0||age>=.34)return;
 const a=local?0:finite(p.a),open=Math.min(1,age/.04)*clamp((.34-age)/.12);
 for(const side of [-1,1]){const dx=-12-age*12,dy=side*21;
  paint(c,images.atmosphere,low?VAPOR:GUST,x+dx*Math.cos(a)-dy*Math.sin(a),y+dx*Math.sin(a)+dy*Math.cos(a),26+age*28,a+Math.PI,.68*open);
 }
}
export function drawVeryDesignation(c,x,y,r,age,remaining,{low=false}={}){
 if(!(remaining>0)||!Number.isFinite(x)||!Number.isFinite(y))return;
 const settle=clamp(age/.4),offset=Math.max(18,finite(r,24))*.7,fade=Math.min(1,remaining/.35);
 // Authored coral flare and smoke identify the actual designated target.
 // A single drifting plume is distinct from the brass launch-only sight.
 paint(c,images.wwi,WWI_FRAMES.verySmoke,x,y-offset,27+(1-settle)*14,-Math.PI/2,.6*fade);
 if(!low||age<.35)paint(c,images.wwi,WWI_FRAMES.veryFlare,x,y-offset,18,-Math.PI/2,fade*(age<.4?1:.45));
}
