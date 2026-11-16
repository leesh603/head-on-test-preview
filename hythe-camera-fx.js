// Reuse the authored etched brass sight; no extra HUD, particles or render RNG.
import {SIGNATURE_ATLAS,SIGNATURE_FRAMES} from './equipment-signature-art-data.js';
let atlas;
export const hytheCameraArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.decoding='async';im.onload=()=>{
  const valid=im.naturalWidth===SIGNATURE_ATLAS.width&&im.naturalHeight===SIGNATURE_ATLAS.height;
  if(valid)atlas=im;im.onload=im.onerror=null;resolve(valid);
 };im.onerror=()=>{im.onload=im.onerror=null;resolve(false);};im.src=new URL('./equipment-signature-atlas.webp',import.meta.url).href;
});
export function drawHytheFocus(c,x,y,{hits=0,remaining=0,shutter=0,scale=1,radius=20,warning=false}={}){
 if(!atlas||![x,y,scale,radius].every(Number.isFinite)||!(scale>0)||!(remaining>0||hits>0||warning))return;
 const analyzed=remaining>0,frame=warning?0:analyzed?2:Math.min(1,Math.max(0,hits-1)),f=SIGNATURE_FRAMES['sight'+frame];
 const settle=analyzed?Math.min(1,Math.max(0,shutter)/.38):0;
 const width=(warning?25:Math.max(42,Math.min(68,radius*2+18)))*(1+settle*.12)*scale,s=width/f.visualWidth;
 const fade=analyzed?Math.min(1,remaining/.45)*(.58+.32*settle):warning?.45:.35+Math.min(2,hits)*.13;
 c.save();c.translate(x,y);c.globalAlpha*=fade;c.imageSmoothingEnabled=true;
 c.drawImage(atlas,f.x,f.y,f.w,f.h,-f.pivotX*s,-f.pivotY*s,f.w*s,f.h*s);c.restore();
}
