import {livensFlameSpan,livensFlameHalfWidth} from './livens-fire195.js?v=523';

// A whole pressure-fed flame field, never a chain of stretched plume sprites.
// 18 prewarmed RGBA frames = 2.25 MiB. One image draw per beam on both devices.
export const LIVENS_FIRE_BUDGET=Object.freeze({width:256,height:128,frames:18,bytes:256*128*18*4,draws:1,period:.6});
const {width:W,height:H,frames:COUNT}=LIVENS_FIRE_BUDGET;
const clamp=v=>Math.max(0,Math.min(1,v));
import {FXS,fxsFlameDressing} from './fx-sample-preview.js?v=523';
// Painted FX palette (fx layer on): same ramp as the atlas fire, cream top instead of white.
const stops=FXS?[[74,28,16],[156,50,24],[220,94,36],[244,154,62],[248,184,98],[255,217,152],[255,226,170]]:[[82,27,12],[167,47,10],[233,85,7],[255,141,12],[255,203,53],[255,243,161],[255,253,222]];
const noise=new Float32Array(64*64);
let seed=382;
for(let i=0;i<noise.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=seed/4294967296;}
function field(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const a=noise[((iy&63)<<6)+(ix&63)],b=noise[((iy&63)<<6)+((ix+1)&63)],d=noise[(((iy+1)&63)<<6)+(ix&63)],e=noise[(((iy+1)&63)<<6)+((ix+1)&63)];
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 return a+(b-a)*sx+(d-a)*sy+(a-b-d+e)*sx*sy;
}
// Offline startup bake. Flow is periodic in space and time, including last→first frame.
export function bakeLivensFrame(frame){
 const pixels=new Uint8ClampedArray(W*H*4),travel=64*frame/COUNT;
 for(let x=0;x<W;x++){
  const q=x/(W-1),half=H/2*(.5+2.1*q)/2.6*.84;
  for(let y=0;y<H;y++){
   const dy=y-H/2;
   const broad=field(x*.15-travel,y*.11)*.62+field(x*.31-travel*2,y*.23)*.28+field(x*.67-travel*4,y*.49)*.1;
   const curl=field(x*.12-travel,y*.065+19)-.5;
   const across=Math.abs(dy+curl*half*.34)/half;
   // Ragged, cooling edges and entrained dark gaps; coherent white-hot fuel core.
   const grain=field(x*1.37-travel*4,y*1.19);
   const energy=1-across+(.5-broad)*(.4+q*1.25)+(grain-.5)*(.06+q*.2);
   const tip=clamp((1-q)*8),alpha=clamp(energy*5)*tip;
   if(alpha<=0)continue;
   const hot=clamp(energy*.78+(1-q)*.22+field(x*.44-travel*2,y*.34)*.12);
   const offset=(y*W+x)*4;
   const value=hot*(stops.length-1),lo=Math.floor(value),hi=Math.min(stops.length-1,lo+1),mix=value-lo;
   const texture=.89+grain*.15;
   const r=(stops[lo][0]+(stops[hi][0]-stops[lo][0])*mix)*texture;
   const g=(stops[lo][1]+(stops[hi][1]-stops[lo][1])*mix)*texture;
   const b=(stops[lo][2]+(stops[hi][2]-stops[lo][2])*mix)*texture;
   pixels[offset]=r;pixels[offset+1]=g;pixels[offset+2]=b;pixels[offset+3]=Math.round(alpha*255);
  }
 }
 return pixels;
}
const atlas=[];
let queued=false,bakeMs=0,epoch=0;
const clock=()=>typeof performance!=='undefined'?performance.now():0;
function bakeOne(){
 const start=clock(),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(W,H);data.data.set(bakeLivensFrame(atlas.length));ctx.putImageData(data,0,0);atlas.push(canvas);bakeMs+=clock()-start;
}
function warm(token){
 if(token!==epoch||atlas.length>=COUNT)return;
 bakeOne();
 if(atlas.length<COUNT){if(typeof requestIdleCallback==='function')requestIdleCallback(()=>warm(token),{timeout:100});else setTimeout(()=>warm(token),0);}
}
export function prepareLivensFlame(){
 if(queued||typeof document==='undefined')return;queued=true;const token=epoch;
 // First frame exists before play; remaining frames prepare between startup frames.
 bakeOne();if(typeof requestIdleCallback==='function')requestIdleCallback(()=>warm(token),{timeout:100});else setTimeout(()=>warm(token),0);
}
export function releaseLivensFlame(){
 epoch++;queued=false;for(const frame of atlas){frame.width=0;frame.height=0;}atlas.length=0;
}
const probe=typeof location!=='undefined'&&new URLSearchParams(location.search).has('headonTest');
let samples=0,totalMs=0,maxMs=0,lastDraw=0,frameMs=0,frameSamples=0,lastReport=0;
function report(start,c){
 if(!probe)return;const now=clock(),cost=now-start;totalMs+=cost;maxMs=Math.max(maxMs,cost);samples++;
 const gap=start-lastDraw;if(gap>0&&gap<100){frameMs+=gap;frameSamples++;}lastDraw=start;
 if(now-lastReport>1000){lastReport=now;c.canvas.setAttribute?.('data-livens-fx',JSON.stringify({version:393,frames:atlas.length,cacheBytes:atlas.length*W*H*4,draws:1,samples,meanMs:+(totalMs/samples).toFixed(3),maxMs:+maxMs.toFixed(3),activeFrameMs:frameSamples?+(frameMs/frameSamples).toFixed(2):null,bakeMs:+bakeMs.toFixed(2)}));}
}
export function drawLivensFlame(c,h){
 const start=probe?clock():0,span=livensFlameSpan(h),{front,tail,t}=span;
 if(front<=tail)return;
 if(!atlas.length)prepareLivensFlame();
 if(!atlas.length)return;
 const frame=atlas[Math.floor((t%LIVENS_FIRE_BUDGET.period)/LIVENS_FIRE_BUDGET.period*COUNT)%atlas.length];
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.imageSmoothingEnabled=true;
 // Only the lifecycle envelope is clipped; the flow never stretches when it starts/stops.
 c.beginPath();const n=32;
 for(let i=0;i<=n;i++){const d=tail+(front-tail)*i/n;c.lineTo(d,-livensFlameHalfWidth(h,d,span));}
 for(let i=n;i>=0;i--){const d=tail+(front-tail)*i/n;c.lineTo(d,livensFlameHalfWidth(h,d,span));}
 c.closePath();c.clip();c.drawImage(frame,0,-h.thickness*2.6,h.length,h.thickness*5.2);c.restore();
 if(FXS)fxsFlameDressing(c,h,span,d=>livensFlameHalfWidth(h,d,span),frame);
 report(start,c);
}
