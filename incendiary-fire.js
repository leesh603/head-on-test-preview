// Painted fabric fire: attached hot root, travelling flame and advecting smoke.
// Cached masks reuse the authored atlas. Rendering never changes combat state.
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
let art,flames=[],smoke=[];
const POSES=[{key:'burn0',x:210,y:120},{key:'burn1',x:211,y:126}];
function layer(pose,hot){
 const cv=typeof OffscreenCanvas==='function'?new OffscreenCanvas(280,192):typeof document!=='undefined'?document.createElement('canvas'):null;
 if(!cv)return null;cv.width=280;cv.height=192;
 const g=cv.getContext('2d');if(!g)return null;
 const f=WWI_FRAMES[pose.key];
 g.translate(24,96);g.rotate(2.65);g.drawImage(art,f.x,f.y,f.w,f.h,-pose.x,-pose.y,f.w,f.h);g.resetTransform();
 // Soft overlap keeps the painted edge; smoke no longer rotates with the fire.
 g.globalCompositeOperation='destination-in';
 const mask=g.createLinearGradient(24,0,124,0);
 if(hot){mask.addColorStop(0,'#fff');mask.addColorStop(.4,'#fff');mask.addColorStop(1,'#fff0');}
 else{mask.addColorStop(0,'#fff0');mask.addColorStop(.5,'#fff0');mask.addColorStop(1,'#fff');}
 g.fillStyle=mask;g.fillRect(0,0,280,192);return cv;
}
export const incendiaryArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.onload=()=>{art=im;flames=POSES.map(p=>layer(p,true));smoke=POSES.map(p=>layer(p,false));resolve(flames.every(Boolean)&&smoke.every(Boolean));};im.onerror=()=>resolve(false);
 im.src=new URL('./wwi-equipment-atlas.webp',import.meta.url).href;
});
export function drawIncendiaryFire(c,x,y,direction,length,age,alpha=1){
 if(!flames[0]||!smoke[0]||![x,y,direction,length,age,alpha].every(Number.isFinite)||length<=0||alpha<=0)return false;
 const t=Math.max(0,age),phase=t*11,index=Math.floor(phase)%2,mix=(1-Math.cos((phase%1)*Math.PI))/2;
 c.save();c.translate(x,y);c.rotate(direction);c.scale(length/240,length/240);c.imageSmoothingEnabled=true;c.globalAlpha*=Math.min(1,alpha);
 // Three bounded age phases move away from the impact instead of breathing in place.
 // Their zero-opacity endpoints hide recycling and need no per-target particles.
 for(let i=0;i<3;i++){
  const u=(t*.85+i/3)%1,fade=Math.sin(u*Math.PI)**2*Math.min(1,t*3),spread=.65+u*.55;
  if(fade<=0)continue;
  c.save();c.translate(u*104-30,Math.sin(t*2.1-i*1.7)*u*9);c.scale(spread,.68+u*.55);c.globalAlpha*=fade*.44;
  c.drawImage(smoke[i%2],-24,-96);c.restore();
 }
 for(let i=0;i<2;i++){
  const weight=i?mix:1-mix;if(weight<=0)continue;
  c.save();c.globalAlpha*=weight;
  // The root remains at (0,0); only the trailing flame stretches and curls.
  c.transform(1+Math.sin(t*17)*.12,Math.sin(t*13)*.07,0,.94+Math.sin(t*19+.8)*.09,0,0);
  c.drawImage(flames[(index+i)%2],-24,-96);c.restore();
 }
 c.restore();return true;
}
