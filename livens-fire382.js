import {livensFlameSpan,livensFlameHalfWidth} from './livens-fire195.js?v=381';

// A whole pressure-fed flame field, never a chain of stretched plume sprites.
// 24 prewarmed RGBA frames = 2.25 MiB. One image draw per beam on both devices.
export const LIVENS_FIRE_BUDGET=Object.freeze({width:192,height:128,frames:24,bytes:192*128*24*4,draws:1,period:.6});
const {width:W,height:H,frames:COUNT}=LIVENS_FIRE_BUDGET;
const clamp=v=>Math.max(0,Math.min(1,v));
const noise=new Float32Array(64*64);
let seed=382;
for(let i=0;i<noise.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise[i]=seed/4294967296;}
function field(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const a=noise[((iy&63)<<6)+(ix&63)],b=noise[((iy&63)<<6)+((ix+1)&63)],d=noise[(((iy+1)&63)<<6)+(ix&63)],e=noise[(((iy+1)&63)<<6)+((ix+1)&63)];
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 return a+(b-a)*sx+(d-a)*sy+(a-b-d+e)*sx*sy;
}
// Offline startup bake. Flow is periodic in space and time, including frame 23→0.
export function bakeLivensFrame(frame){
 const pixels=new Uint8ClampedArray(W*H*4),travel=64*frame/COUNT;
 for(let x=0;x<W;x++){
  const q=x/(W-1),half=H/2*(.5+2.1*q)/2.6;
  for(let y=0;y<H;y++){
   const dy=y-H/2;
   const broad=field(x*.15-travel,y*.11)*.62+field(x*.31-travel*2,y*.23)*.28+field(x*.67-travel*4,y*.49)*.1;
   const curl=field(x*.12-travel,y*.065+19)-.5;
   const across=Math.abs(dy+curl*half*.34)/half;
   // Ragged, cooling edges and entrained dark gaps; coherent white-hot fuel core.
   const energy=1-across+(.5-broad)*(.28+q*.95);
   const tip=clamp((1-q)*8),alpha=clamp(energy*5)*tip;
   if(alpha<=0)continue;
   const hot=clamp(energy*.86+(1-q)*.18+field(x*.44-travel*2,y*.34)*.16);
   const offset=(y*W+x)*4;
   let r,g,b;
   if(hot>.84){r=255;g=242;b=186;}
   else if(hot>.66){r=255;g=216;b=111;}
   else if(hot>.43){r=244;g=162;b=57;}
   else if(hot>.22){r=218;g=101;b=32;}
   else{r=151;g=57; b=28;}
   pixels[offset]=r;pixels[offset+1]=g;pixels[offset+2]=b;pixels[offset+3]=Math.round(alpha*255);
  }
 }
 return pixels;
}
const atlas=[];
let queued=false,bakeMs=0;
const clock=()=>typeof performance!=='undefined'?performance.now():0;
function bakeOne(){
 const start=clock(),canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d'),data=ctx.createImageData(W,H);data.data.set(bakeLivensFrame(atlas.length));ctx.putImageData(data,0,0);atlas.push(canvas);bakeMs+=clock()-start;
}
function warm(){
 if(atlas.length>=COUNT)return;
 bakeOne();
 if(atlas.length<COUNT){if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:100});else setTimeout(warm,0);}
}
export function prepareLivensFlame(){
 if(queued||typeof document==='undefined')return;queued=true;
 // First frame exists before play; remaining frames prepare between startup frames.
 bakeOne();if(typeof requestIdleCallback==='function')requestIdleCallback(warm,{timeout:100});else setTimeout(warm,0);
}
prepareLivensFlame();
const probe=typeof location!=='undefined'&&new URLSearchParams(location.search).has('headonTest');
let samples=0,totalMs=0,maxMs=0,lastDraw=0,frameMs=0,frameSamples=0,lastReport=0;
function report(start,c){
 if(!probe)return;const now=clock(),cost=now-start;totalMs+=cost;maxMs=Math.max(maxMs,cost);samples++;
 const gap=start-lastDraw;if(gap>0&&gap<100){frameMs+=gap;frameSamples++;}lastDraw=start;
 if(now-lastReport>1000){lastReport=now;c.canvas.setAttribute?.('data-livens-fx',JSON.stringify({version:382,frames:atlas.length,cacheBytes:atlas.length*W*H*4,draws:1,samples,meanMs:+(totalMs/samples).toFixed(3),maxMs:+maxMs.toFixed(3),activeFrameMs:frameSamples?+(frameMs/frameSamples).toFixed(2):null,bakeMs:+bakeMs.toFixed(2)}));}
}
export function drawLivensFlame(c,h){
 const start=probe?clock():0,span=livensFlameSpan(h),{front,tail,t}=span;
 if(front<=tail||!atlas.length)return;
 const frame=atlas[Math.floor((t%LIVENS_FIRE_BUDGET.period)/LIVENS_FIRE_BUDGET.period*COUNT)%atlas.length];
 c.save();c.translate(h.x,h.y);c.rotate(h.angle);c.imageSmoothingEnabled=false;
 // Only the lifecycle envelope is clipped; the flow never stretches when it starts/stops.
 c.beginPath();const n=32;
 for(let i=0;i<=n;i++){const d=tail+(front-tail)*i/n;c.lineTo(d,-livensFlameHalfWidth(h,d,span));}
 for(let i=n;i>=0;i--){const d=tail+(front-tail)*i/n;c.lineTo(d,livensFlameHalfWidth(h,d,span));}
 c.closePath();c.clip();c.drawImage(frame,0,-h.thickness*2.6,h.length,h.thickness*5.2);c.restore();report(start,c);
}
