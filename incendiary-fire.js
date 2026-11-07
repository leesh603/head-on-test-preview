// The attached hot root uses one atlas cell, with the existing painted wake.
import {fx,fxArtReady,fxReady} from './fx-art.js?v=09c75d146ae4289d';

const CELL=128,FRAME_SECONDS=.105;
let attachedArt;
const attachedArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'||new URLSearchParams(globalThis.location?.search).get('fx')==='0'){resolve();return;}
 const image=new Image();
 image.onload=()=>{
  if(image.naturalWidth===CELL*2&&image.naturalHeight===CELL*2)attachedArt=image;
  resolve();
 };
 image.onerror=()=>resolve();
 image.src=new URL('./fx-incendiary-attached.webp',import.meta.url).href;
});
export const incendiaryArtReady=Promise.all([fxArtReady,attachedArtReady])
 .then(()=>!!attachedArt||fxReady('fireEngine'));

export function drawIncendiaryFire(c,x,y,direction,length,age,alpha=1,style='attached'){
 if(![x,y,direction,length,age,alpha].every(Number.isFinite)||length<=0||alpha<=0)return false;
 c.save();
 const t=Math.max(0,age),opacity=Math.min(1,alpha);
 const dx=Math.cos(direction),dy=Math.sin(direction),rise=Math.min(1,t*4);
 for(let i=0;i<2;i++){
  const phase=(t*1.5+i*.5)%1;
  const travel=length*(.18+phase*.64);
  const drift=Math.sin(t*3+i*2)*length*phase*.09;
  const spread=length*(.3+phase*.36);
  fx(c,'profileOil',x+dx*travel-dy*drift,y+dy*travel+dx*drift,spread,spread,
   direction,(Math.sin(Math.PI*phase)**2)*rise*opacity*.42);
 }
 if(style==='attached'&&attachedArt){
  const frame=Math.floor(t%(4*FRAME_SECONDS)/FRAME_SECONDS);
  // The visible flame occupies 104 pixels of the 128-pixel tile.
  const size=length*(22/62)*(CELL/104);
  c.translate(x,y);c.rotate(direction);c.globalAlpha*=opacity;
  c.imageSmoothingEnabled=true;
  c.drawImage(attachedArt,(frame%2)*CELL,Math.floor(frame/2)*CELL,CELL,CELL,-size/2,-size/2,size,size);
  c.restore();
  return true;
 }
 const flicker=1+Math.sin(t*23)*.08;
 const tail=length*(.36+.035*Math.sin(t*15));
 // Ground fields and muzzle cues keep the original presentation.
 fx(c,'profileWing',x+dx*tail,y+dy*tail,length*.56*flicker,length*.38,
  direction+Math.PI/2,opacity*.70);
 const drawn=fx(c,'profileEngine',x+dx*length*.01,y+dy*length*.01,length*.46,length*.38*flicker,
  direction+Math.PI/2,opacity*.77);
 c.restore();
 return drawn;
}
