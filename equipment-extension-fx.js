// Three additional equipment signatures, painted assets only. Render clocks
// remain simulation-owned; no particles, random numbers or gameplay mutation.
import {EXTENSION_ATLAS,EXTENSION_FRAMES} from './equipment-extension-art-data.js';
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const clamp=(v)=>Math.max(0,Math.min(1,finite(v)));
const alive=p=>p?.hp>0&&p.status!=='downed'&&!(p.heineckeEscape>0);
const images=Object.create(null);
export const equipmentExtensionArtReady=Promise.all([
 ['extension','equipment-extension-atlas.webp',EXTENSION_ATLAS.width,EXTENSION_ATLAS.height],
 ['atmosphere','fx-role-split/atmosphere-smoke-gas-q92.webp',1024,1024]
].map(([key,file,width,height])=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.decoding='async';im.onload=()=>{const valid=im.naturalWidth===width&&im.naturalHeight===height;if(valid)images[key]=im;im.onload=im.onerror=null;resolve(valid);};
 im.onerror=()=>{im.onload=im.onerror=null;resolve(false);};im.src=new URL('./'+file,import.meta.url).href;
}))).then(values=>values.every(Boolean));
function sprite(c,image,f,x,y,width,height,angle,alpha){
 if(!image||!f||!Number.isFinite(x)||!Number.isFinite(y)||!(width>0&&height>0&&alpha>0))return;
 c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=clamp(alpha);c.imageSmoothingEnabled=true;
 c.drawImage(image,f.x,f.y,f.w,f.h,-(f.pivotX??f.w/2)*width/f.w,-(f.pivotY??f.h/2)*height/f.h,width,height);c.restore();
}
function authored(c,key,x,y,size,angle,alpha,vertical=false){
 const f=EXTENSION_FRAMES[key];if(!f)return;
 const scale=size/(vertical?f.visualHeight:f.visualWidth);
 sprite(c,images.extension,f,x,y,f.w*scale,f.h*scale,angle,alpha);
}
const WIND={x:512,y:0,w:256,h:256},VAPOR={x:768,y:512,w:256,h:256};
export function drawMercedesOutput(c,p,x,y,{low=false}={}){
 if(!alive(p)||!p.upgrades?.mercedesEngine||p.bomberTransfer)return;
 const output=clamp(p.mercedesOutput160);if(output<=0)return;
 const a=finite(p.a),t=finite(p.t,finite(p.world?.t));
 // Pale painted airflow grows with the actual stable-flight output. It is not
 // a new boost, an engine fire, or a permanent icon hovering over the aircraft.
 for(const side of [-1,1]){
  const dx=-36-output*12,dy=side*(8+Math.sin(t*8)*.5);
  sprite(c,images.atmosphere,low?VAPOR:WIND,x+dx*Math.cos(a)-dy*Math.sin(a),y+dx*Math.sin(a)+dy*Math.cos(a),36+output*34,9+output*4,a,.22+output*.36);
 }
}
export function drawTelescopeAcquisition(c,p,x,y,{low=false}={}){
 if(!alive(p)||!p.upgrades?.telescope||!(p.telescopeFocus156>0))return;
 const target=p.telescopeTarget156;if(!(target?.hp>0)||target.hidden||!Number.isFinite(target.x)||!Number.isFinite(target.y))return;
 const left=Math.min(.12,p.telescopeFocus156),phase=Math.min(2,Math.floor((1-left/.12)*3));
 // Only the actual steered bullet's selected target receives optical glints.
 // Single authored frames keep the clear center free of ghosted HUD brackets.
 authored(c,'telescope'+phase,x+target.x-finite(p.x),y+target.y-finite(p.y),42,0,Math.min(1,left/.035)*(low?.8:.95));
}
export function drawMaximReload(c,p,x,y,{low=false,local=false}={}){
 if(!alive(p)||!p.upgrades?.maximBelt||!(p.reloadTime>0)||p.bomberTransfer)return;
 const a=local?0:finite(p.a),t=Math.max(0,finite(p.t,finite(p.world?.t))),phase=Math.floor(t*(low?10:14))%3;
 // The top feed point stays fixed at the receiver across all painted phases.
 // Actual fired brass remains in the established weapon FX, not duplicated here.
 authored(c,'belt'+phase,x+12*Math.cos(a)-3*Math.sin(a),y+12*Math.sin(a)+3*Math.cos(a),20,a,Math.min(1,p.reloadTime/.08)*.95,true);
}
