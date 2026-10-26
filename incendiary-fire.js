// Existing painted fabric fire; anchor the hot root rather than the atlas centre.
// Presentation only: no particles, simulation timers or random calls.
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
let art;
export const incendiaryArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.onload=()=>{art=im;resolve(true);};im.onerror=()=>resolve(false);
 im.src=new URL('./wwi-equipment-atlas.webp',import.meta.url).href;
});
const POSES=[{key:'burn0',x:210,y:120},{key:'burn1',x:211,y:126}];
export function drawIncendiaryFire(c,x,y,direction,length,age,alpha=1){
 if(!art?.naturalWidth||![x,y,direction,length,age,alpha].every(Number.isFinite)||length<=0||alpha<=0)return false;
 const phase=Math.max(0,age)*8,index=Math.floor(phase)%2,mix=(1-Math.cos((phase%1)*Math.PI))/2;
 c.save();c.translate(x,y);c.rotate(direction+2.65);c.scale(length/240,length/240);c.imageSmoothingEnabled=true;
 for(let i=0;i<2;i++){
  const weight=i?mix:1-mix;if(weight<=0)continue;
  const pose=POSES[(index+i)%2],f=WWI_FRAMES[pose.key];
  c.save();c.globalAlpha*=Math.min(1,alpha)*weight;
  c.drawImage(art,f.x,f.y,f.w,f.h,-pose.x,-pose.y,f.w,f.h);c.restore();
 }
 c.restore();return true;
}
