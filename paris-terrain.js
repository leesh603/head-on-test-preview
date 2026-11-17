import {applyTerrainAtmosphere} from './alps-terrain117.js?v=gal1&phoneperf=20261103&early=20261115';
// One authored Paris district. Scenery never owns combat coordinates or RNG.
// The surrounding city and Seine continue outside it; landmarks appear once.
export const PARIS_GROUND=Object.freeze({width:3200,left:-1600,top:-1700,bottom:1824,plaza:{x:-672,y:-790,w:1344,h:660},river:{north:500,south:800},hospital:{x:-780,y:330,w:488,h:352},rail:{x:680,y:230,w:552,h:328}});
const bands=Object.freeze([[0,.22,-1700,-790],[.22,.39,-790,-130],[.39,.59,-130,500],[.59,.75,500,800],[.75,1,800,1824]]);
const quayMargin=72;
const seineTop=PARIS_GROUND.river.north-quayMargin,seineBottom=PARIS_GROUND.river.south+quayMargin;
let source=null,citySource=null,cityTile=null,district=null,river=null,cityPatterns=new WeakMap();
export function releaseParisTerrain(){source=null;citySource=null;cityTile=null;district=null;river=null;cityPatterns=new WeakMap();}
const ready=im=>im?.complete&&im.naturalWidth>0;
function canvas(w,h){
 const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):globalThis.document?.createElement?.('canvas');
 if(cv){cv.width=w;cv.height=h;}return cv;
}
function feather(c,w,h,horizontal,vertical){
 c.globalCompositeOperation='destination-in';
 for(const [x0,y0,x1,y1,inset] of [[0,0,w,0,horizontal],[0,0,0,h,vertical]]){
  if(!inset)continue;
  const gradient=c.createLinearGradient(x0,y0,x1,y1);
  gradient.addColorStop(0,'#0000');gradient.addColorStop(inset*.3,'#0003');gradient.addColorStop(inset,'#000');
  gradient.addColorStop(1-inset,'#000');gradient.addColorStop(1-inset*.3,'#0003');gradient.addColorStop(1,'#0000');
  c.fillStyle=gradient;c.fillRect(0,0,w,h);
 }
 c.globalCompositeOperation='source-over';
}
function artwork(im){
 if(source===im)return true;
 const r=canvas(Math.round(im.naturalWidth*.09),seineBottom-seineTop);
 const d=canvas(im.naturalWidth,im.naturalHeight);
 if(!r||!d)return false;
 // Rasterize all adjoining strips into one district so browser filtering
 // samples across their joins at fractional camera coordinates.
 const dc=d.getContext('2d'),height=PARIS_GROUND.bottom-PARIS_GROUND.top;
 for(const [a,b,y0,y1] of bands){
  const start=Math.round((y0-PARIS_GROUND.top)*d.height/height),end=Math.round((y1-PARIS_GROUND.top)*d.height/height);
  dc.drawImage(im,0,a*im.naturalHeight,im.naturalWidth,(b-a)*im.naturalHeight,0,start,d.width,end-start);
 }
 feather(dc,d.width,d.height,.14,.13);
 // The district WebP includes the feathered boundary. Take the Seine
 // extension from inside that boundary, east of the last bridge.
 const rc=r.getContext('2d');
 for(const [a,b,y0,y1] of bands){
  const top=Math.max(y0,seineTop),bottom=Math.min(y1,seineBottom);if(top>=bottom)continue;
  const v=a+(b-a)*(top-y0)/(y1-y0),height=(b-a)*(bottom-top)/(y1-y0);
  rc.drawImage(im,im.naturalWidth*.82,im.naturalHeight*v,im.naturalWidth*.09,im.naturalHeight*height,0,top-seineTop,r.width,bottom-top);
 }
 feather(rc,r.width,r.height,0,.12);
 source=im;district=d;river=r;return true;
}
export function paintParisTerrain(c,g,cx,cy,w,h,images){
 const origin=g?.parisBattle?.origin;
 if(!origin||![images.map,images.surround].every(ready)||typeof c.createPattern!=='function'||!artwork(images.map))return false;
 if(citySource!==images.surround){
  citySource=images.surround;cityPatterns=new WeakMap();
  const size=512;
  cityTile=canvas(size*2,size*2);
  const q=cityTile.getContext('2d');
  q.filter='saturate(.58) brightness(.69) contrast(.90)';
  // Fold the existing city outskirts at both edges; facing street ends
  // meet instead of jumping from one block to another on a repeat.
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
   q.save();q.translate(col*size*2,row*size*2);q.scale(col?-1:1,row?-1:1);
   q.drawImage(citySource,0,0,size,size);q.restore();
  }
 }
 if(!cityPatterns.has(c)){
  const p=c.createPattern(cityTile,'repeat'),s=2304/cityTile.width;
  p.setTransform({a:s,b:0,c:0,d:s,e:0,f:0});cityPatterns.set(c,p);
 }
 const left=cx-w/2-origin.x,top=cy-h/2-origin.y,ground=PARIS_GROUND;
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.translate(-left,-top);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 // World-anchored texture, at native scale like the other HEAD-ON cities.
 c.fillStyle=cityPatterns.get(c);c.fillRect(left,top,w,h);
 // Exactly one river latitude, also outside the authored district.
 if(top<seineBottom&&top+h>seineTop){
  const step=288,overlap=16;
  for(let x=Math.floor(left/step)*step-step;x<left+w+step;x+=step){
   c.save();c.beginPath();c.rect(x,seineTop,step,seineBottom-seineTop);c.clip();
   if(Math.abs(x/step)%2){c.translate(2*x+step,0);c.scale(-1,1);}
   c.drawImage(river,0,0,river.width,river.height,x-overlap,seineTop,step+overlap*2,seineBottom-seineTop);c.restore();
  }
 }
 // The parade ground fits the existing fortress; scenery never moves a boss.
 if(left<ground.left+ground.width&&left+w>ground.left&&top<ground.bottom&&top+h>ground.top){
  c.drawImage(district,ground.left,ground.top,ground.width,ground.bottom-ground.top);
 }
 c.restore();applyTerrainAtmosphere(c,'london',w,h);return true;
}

