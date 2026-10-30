// Authored cloth and flechette airflow; no simulated cloth, particles or RNG.
import {DETAIL_ATLAS,DETAIL_FRAMES} from './equipment-detail-art-data.js';
const images=Object.create(null),finite=(v,f=0)=>Number.isFinite(v)?v:f;
export const equipmentDetailArtReady=Promise.all([
 ['cloth','equipment-detail-atlas.webp',DETAIL_ATLAS.width,DETAIL_ATLAS.height],
 ['wind','fx-wind-streak.webp',256,144]
].map(([key,file,w,h])=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.decoding='async';im.onload=()=>{const valid=im.naturalWidth===w&&im.naturalHeight===h;if(valid)images[key]=im;im.onload=im.onerror=null;resolve(valid);};im.onerror=()=>{im.onload=im.onerror=null;resolve(false);};im.src=new URL('./'+file,import.meta.url).href;
}))).then(result=>result.every(Boolean));
export function drawRedScarf(c,p,x,y,{low=false,local=false}={}){
 if(!(p?.hp>0)||p.status==='downed'||p.heineckeEscape>0||!p.upgrades?.redScarf||p.bomberTransfer||!images.cloth||!Number.isFinite(x)||!Number.isFinite(y))return;
 const phase=Math.floor(Math.max(0,finite(p.t,finite(p.world?.t)))*(low?7:10))%3,f=DETAIL_FRAMES['scarf'+phase],a=local?0:finite(p.a),scale=29/f.visualHeight;
 // Native cloth falls down from its fixed knot. Game forward is +X, so rotate
 // that direction toward the tail; bank/scale may be supplied by the caller.
 c.save();c.translate(x+9*Math.cos(a),y+9*Math.sin(a));c.rotate(a+Math.PI/2);c.imageSmoothingEnabled=true;
 c.drawImage(images.cloth,f.x,f.y,f.w,f.h,-f.pivotX*scale,-f.pivotY*scale,f.w*scale,f.h*scale);c.restore();
}
export function drawFlechetteTrail(c,b,x,y,{scale=1,low=false}={}){
 if(!b?.flechette||!(b.life>0)||!images.wind||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(b.vx)||!Number.isFinite(b.vy))return;
 const speed=Math.hypot(b.vx,b.vy);if(!(speed>0))return;
 const z=Math.max(.1,Math.min(4,finite(scale,1))),a=Math.atan2(b.vy,b.vx),length=10*z,height=2*z;
 // This source is dense on its left and fades right: turn it backward so its
 // dense end meets the dart and the painted wisps trail behind, never ahead.
 c.save();c.translate(x-Math.cos(a)*7*z,y-Math.sin(a)*7*z);c.rotate(a+Math.PI);
 c.globalAlpha*=Math.min(1,b.life/.06)*(low?.45:.62);c.imageSmoothingEnabled=true;
 c.drawImage(images.wind,0,0,256,144,-length/2,-height/2,length,height);c.restore();
}
