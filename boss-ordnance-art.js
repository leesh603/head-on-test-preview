import {drawOrdnance} from './ordnance-art.js?v=tame3&perf=1029';
// Painted WWI ordnance for hostile boss rounds (nose right). The painted body
// is untouched (no ink rim); a soft crimson under-glow, slightly toward the
// tail, is baked in so hostile rounds still read on sea, snow and dirt.
// Frames: [x,y,w,h,bodyLength] in fx-boss-ordnance-e.webp.
export const BOSS_ORDNANCE_FRAMES=Object.freeze({"ap-small": [0, 0, 136, 67, 112], "he-shell": [138, 0, 136, 67, 112], "he-big": [276, 0, 160, 84, 136], "ap-big": [438, 0, 160, 72, 136], "frag-shell": [600, 0, 136, 85, 112], "iron-bomb": [738, 0, 136, 96, 112], "mortar-small": [876, 0, 160, 79, 136], "mortar-big": [1038, 0, 160, 74, 136], "rifle-grenade": [1200, 0, 160, 48, 136], "pineapple": [1362, 0, 136, 90, 112], "stick-grenade": [1500, 0, 160, 58, 136], "dart": [1662, 0, 160, 58, 136]});
let image=null,ready=false,pending=null,generation=0;
const source=new URL('./fx-boss-ordnance-e.webp?v=e1',import.meta.url).href;
// Optional warmup is bounded, but a late successful image can still improve
// the current fight. A new retry owns a fresh image so old events cannot win.
export function prepareBossOrdnance(){
 if(ready)return Promise.resolve(true);if(pending)return pending;
 if(typeof Image==='undefined')return Promise.resolve(false);
 const epoch=++generation,request=new Image();image=request;
 let resolve;const attempt=new Promise(done=>{resolve=done});pending=attempt;
 let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(epoch===generation)pending=null;resolve(ok)};
 const timer=setTimeout(()=>finish(false),10000);timer.unref?.();
 request.decoding='async';
 request.onload=()=>{request.onload=request.onerror=null;if(epoch!==generation)return;ready=request.naturalWidth>0;finish(ready)};
 request.onerror=()=>{request.onload=request.onerror=null;if(epoch!==generation)return;ready=false;finish(false)};
 request.src=source;return attempt;
}
export const bossOrdnanceReady=prepareBossOrdnance();
export function bossOrdnanceLoaded(){return ready;}
// Draw a round centred on x,y, `length` px long along `angle` (frame aspect kept).
// Callers keep their historical `length`; rounds are drawn at a little over
// half of it (a 46 heavy reads as a 25 px shell), smaller and less sticker-like.
const ROUND_SCALE=.55;
export function drawBossOrdnance(c,name,x,y,length,angle=0,alpha=1){
 const f=BOSS_ORDNANCE_FRAMES[name];if(!f||!(length>0))return false;
 if(!ready){
  // Reuse the already warmed, authored metal body for the matching family.
  // Never turn an unavailable dart/mortar into an unrelated MG tracer here.
  const key=name==='he-shell'||name==='he-big'?'shellBody':name==='iron-bomb'?'bombBody':null;
  return key?drawOrdnance(c,key,x,y,length*ROUND_SCALE,length*ROUND_SCALE,angle,alpha):false;
 }
 const k=length*ROUND_SCALE/f[4];c.save();c.translate(x,y);if(angle)c.rotate(angle);c.globalAlpha*=alpha;c.imageSmoothingEnabled=true;
 c.drawImage(image,f[0],f[1],f[2],f[3],-f[2]*k*.5,-f[3]*k/2,f[2]*k,f[3]*k);c.restore();return true;
}
