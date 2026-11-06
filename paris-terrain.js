// One authored Paris district. Scenery never owns combat coordinates or RNG.
// The surrounding city and Seine continue outside it; landmarks appear once.
export const PARIS_GROUND=Object.freeze({width:3200,left:-1600,top:-1700,bottom:1824,plaza:{x:-672,y:-790,w:1344,h:660},river:{north:500,south:800},hospital:{x:-780,y:330,w:488,h:352},rail:{x:680,y:230,w:552,h:328}});
const bands=Object.freeze([[0,.22,-1700,-790],[.22,.39,-790,-130],[.39,.59,-130,500],[.59,.75,500,800],[.75,1,800,1824]]);
let source=null,citySource=null,district=null,river=null,cityPatterns=new WeakMap();
export function releaseParisTerrain(){source=null;citySource=null;district=null;river=null;cityPatterns=new WeakMap();}
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
 const d=canvas(im.naturalWidth,im.naturalHeight),r=canvas(Math.round(im.naturalWidth*.13),Math.round(im.naturalHeight*.16));
 if(!d||!r)return false;
 const q=d.getContext('2d');q.drawImage(im,0,0);feather(q,d.width,d.height,.09,.075);
 // A quiet bank segment contains no bridge, plaza, hospital or station.
 const rc=r.getContext('2d');rc.drawImage(im,im.naturalWidth*.855,im.naturalHeight*.59,im.naturalWidth*.13,im.naturalHeight*.16,0,0,r.width,r.height);
 feather(rc,r.width,r.height,0,.09);
 source=im;district=d;river=r;return true;
}
export function paintParisTerrain(c,g,cx,cy,w,h,images){
 const origin=g?.parisBattle?.origin;
 if(!origin||![images.map,images.surround].every(ready)||typeof c.createPattern!=='function'||!artwork(images.map))return false;
 if(citySource!==images.surround){citySource=images.surround;cityPatterns=new WeakMap();}
 if(!cityPatterns.has(c)){const p=c.createPattern(citySource,'repeat');p.setTransform({a:3200/1254,b:0,c:0,d:3200/1254,e:0,f:0});cityPatterns.set(c,p);}
 const left=cx-w/2-origin.x,top=cy-h/2-origin.y,ground=PARIS_GROUND;
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.translate(-left,-top);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 // World-anchored texture, at native scale like the other HEAD-ON cities.
 c.fillStyle=cityPatterns.get(c);c.fillRect(left,top,w,h);
 // Exactly one river latitude, also outside the authored district.
 if(top<ground.river.south&&top+h>ground.river.north){
  const step=448,overlap=24;
  for(let x=Math.floor(left/step)*step-step;x<left+w+step;x+=step){
   c.save();c.beginPath();c.rect(x,ground.river.north,step,ground.river.south-ground.river.north);c.clip();
   if(Math.abs(x/step)%2){c.translate(2*x+step,0);c.scale(-1,1);}
   c.drawImage(river,0,0,river.width,river.height,x-overlap,ground.river.north,step+overlap*2,ground.river.south-ground.river.north);c.restore();
  }
 }
 // The parade ground fits the existing fortress; scenery never moves a boss.
 if(left<ground.left+ground.width&&left+w>ground.left){
  for(const [a,b,y0,y1] of bands){
   if(y0>=top+h||y1<=top)continue;
   c.drawImage(district,0,a*district.height,district.width,(b-a)*district.height,ground.left,y0,ground.width,y1-y0);
  }
 }
 c.restore();return true;
}

