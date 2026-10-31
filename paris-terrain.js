// Paris scenery only. All positions are relative to the existing battle origin.
// Architecture is drawn below its native atlas resolution; no mirrored city tiles.
export const PARIS_GROUND=Object.freeze({cell:448,block:400,plaza:{x:-672,y:-908,w:1344,h:896},river:{north:500,south:800},hospital:{x:-780,y:330,w:488,h:352},rail:{x:680,y:230,w:552,h:328}});
let materialSource=null,tiles=null,patterns=new WeakMap();
export function releaseParisTerrain(){materialSource=null;tiles=null;patterns=new WeakMap();}
const ready=im=>im?.complete&&im.naturalWidth>0;
function makeCanvas(size){
 if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(size,size);
 const canvas=globalThis.document?.createElement?.('canvas');if(!canvas)return null;
 canvas.width=canvas.height=size;return canvas;
}
function getPatterns(c,im){
 if(typeof c.createPattern!=='function')return null;
 if(materialSource!==im){
  const next=[];
  for(let i=0;i<4;i++){
   const size=[48,192,48,96][i],cv=makeCanvas(size);if(!cv)return null;
   const q=cv.getContext('2d');q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';
   q.drawImage(im,(i%2)*im.naturalWidth/2,Math.floor(i/2)*im.naturalHeight/2,im.naturalWidth/2,im.naturalHeight/2,0,0,size,size);next.push(cv);
  }
  tiles=next;materialSource=im;patterns=new WeakMap();
 }
 if(!patterns.has(c))patterns.set(c,tiles.map(tile=>c.createPattern(tile,'repeat')));
 return patterns.get(c);
}
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const centered=r=>({x:r.x-r.w/2,y:r.y-r.h/2,w:r.w,h:r.h});
export function paintParisTerrain(c,g,cx,cy,w,h,images){
 const origin=g?.parisBattle?.origin;
 if(!origin||![images.materials,images.blocks,images.landmarks].every(ready))return false;
 const p=getPatterns(c,images.materials);if(!p)return false;
 const left=cx-w/2-origin.x,top=cy-h/2-origin.y,right=left+w,bottom=top+h;
 const view={x:left,y:top,w,h},layout=PARIS_GROUND,plaza=layout.plaza;
 const hospital=centered(layout.hospital),rail=centered(layout.rail),river={x:left-600,y:424,w:w+1200,h:452};
 const visible=r=>overlaps(view,r);
 const surface=(r,pattern)=>{if(!visible(r))return;c.fillStyle=pattern;c.fillRect(r.x,r.y,r.w,r.h);};
 const sprite=(im,frame,x,y,width,height=width,angle=0)=>{
  if(!visible({x:x-width/2,y:y-height/2,w:width,h:height}))return;
  const sw=im.naturalWidth/2,sh=im.naturalHeight/2;
  c.save();c.translate(x,y);if(angle)c.rotate(angle);
  const inset=im===images.blocks?14:0;
  c.drawImage(im,(frame%2)*sw+inset,Math.floor(frame/2)*sh+inset,sw-inset*2,sh-inset*2,-width/2,-height/2,width,height);c.restore();
 };
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.translate(-left,-top);
 c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 // The small material tiles repeat; streets and landmarks have one world layout.
 surface(view,p[0]);
 for(let row=Math.floor((top+684)/layout.cell)-1;row<=Math.ceil((bottom+684)/layout.cell)+1;row++){
  for(let col=Math.floor(left/layout.cell)-1;col<=Math.ceil(right/layout.cell)+1;col++){
   const x=col*layout.cell,y=row*layout.cell-684,foot={x:x-204,y:y-204,w:408,h:408};
   if(!visible(foot)||[plaza,hospital,rail,river].some(r=>overlaps(foot,r)))continue;
   const seed=((Math.imul(col,73856093)^Math.imul(row,19349663))>>>0);
   sprite(images.blocks,seed%4,x,y,layout.block,layout.block,((seed>>>4)%4)*Math.PI/2);
  }
 }
 surface({x:plaza.x-28,y:plaza.y-28,w:plaza.w+56,h:plaza.h+56},p[2]);
 surface(plaza,p[2]);
 sprite(images.landmarks,0,layout.hospital.x,layout.hospital.y,layout.hospital.w,layout.hospital.h);
 sprite(images.landmarks,1,layout.rail.x,layout.rail.y,layout.rail.w,layout.rail.h);
 // A single straight Seine: no duplicated river, folded banks or tile borders.
 surface({x:left,y:424,w,h:76},p[2]);
 surface({x:left,y:500,w,h:300},p[1]);
 surface({x:left,y:800,w,h:76},p[2]);
 for(const y of [450,850])for(let x=Math.floor(left/256)*256;x<=right+64;x+=256)sprite(images.landmarks,3,x,y,68,68,y===850?Math.PI:0);
 for(let col=Math.floor((left-128)/1536);col<=Math.ceil((right+128)/1536);col++)sprite(images.landmarks,2,col*1536,650,256,500);
 for(const y of [plaza.y-12,plaza.y+plaza.h+12])for(let x=plaza.x+64;x<plaza.x+plaza.w;x+=224)sprite(images.landmarks,3,x,y,64);
 for(const x of [plaza.x+32,plaza.x+plaza.w-32])for(let y=plaza.y+96;y<plaza.y+plaza.h;y+=224)sprite(images.landmarks,3,x,y,64);
 c.restore();return true;
}
