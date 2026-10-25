import {fx} from './fx-art.js?v=tame3';
import {SOMME_FRAMES} from './somme-boss-atlas.js?v=tame3';
export const GOTHA_DETAIL_SOURCES=Object.freeze({
 hull:'./gotha-airframe-separated-20261022.webp?v=bomber-style20261024',
 parts:'./boss-alps-hardware-20261020.webp?v=muted1',guns:'./boss-mark1-guns-r3.webp'
});
let images={},pending;
export function prepareGothaDetailArt(){
 if(pending)return pending;
 pending=Promise.all(Object.entries(GOTHA_DETAIL_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();images[key]=im;im.decoding='async';
  im.onload=()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im));
  im.onerror=()=>resolve(im);im.src=url;
 })));return pending;
}
export function releaseGothaDetailArt(){images={};pending=null;}
export function gothaDetailReady(){return Object.keys(GOTHA_DETAIL_SOURCES).every(k=>images[k]?.naturalWidth>0);}
export const gothaPartState=(p,dead=false)=>dead||p?.destroyed?2:p?.hp<p?.maxHp*.55?1:0;
export function gothaPartLocal(b,p){
 const a=(b.a||0)+Math.PI/2,c=Math.cos(a),s=Math.sin(a);
 return{x:p.x*c+p.y*s,y:-p.x*s+p.y*c};
}
function tile(c,index,x,y,size,pivot=[96,96]){
 const k=size/192;
 c.drawImage(images.parts,index%3*192,Math.floor(index/3)*192,192,192,x-pivot[0]*k,y-pivot[1]*k,size,size);
}
function engine(c,p,x,y,time,phase){
 const state=gothaPartState(p),pivot=[[114,100],[97,100],[80,100]][state];
 c.save();c.translate(x,y+17);
 // The pusher disc is edge-on from above. A destroyed engine holds its blade.
 if(state===2)c.rotate(.2+phase*.1);else c.scale(.2+.8*Math.abs(Math.cos(time*41+phase)),1);
 tile(c,14,0,0,32,[88,87]);c.restore();tile(c,state,x,y,38.4,pivot);
 if(state===2){fx(c,'fireEngine',x,y,22,28,0,.7);fx(c,'smokeDark',x,y-23,35,45,0,.5);}
}
function bay(c,b,p,x,y){
 if(p.destroyed){tile(c,11,x,y,21,[80,96]);return;}
 const q=Math.max(0,Math.min(1,b.bayOpen||0)),k=21/192;
 tile(c,10,x,y,21,[97,96]);
 // Only the two authored leaves move; the open interior and hinge frame stay.
 for(const side of [-1,1]){
  const sx=side<0?56:114,hinge=(side<0?56:172)-114;
  c.save();c.translate(x+hinge*k+side*q*4,y);c.scale(1-q*.72,1);
  c.drawImage(images.parts,sx,576+32,58,136,(sx-114-hinge)*k,(32-96)*k,58*k,136*k);c.restore();
 }
}
function rearGun(c,p,x,y){
 const f=SOMME_FRAMES['mark1-gun-mg-'+['normal','damaged','wreck'][gothaPartState(p)]],k=5/f.reach;
 c.save();c.translate(x,y);c.rotate(Math.PI);
 c.drawImage(images.guns,...f.rect,-f.tip[0]*k,-f.tip[1]*k,f.rect[2]*k,f.rect[3]*k);c.restore();
 if(p.destroyed)fx(c,'smokeDark',x,y-15,24,29,0,.35);
}
export function drawDetailedGotha(c,b,legacy){
 if(!gothaDetailReady())return false;
 if(b.destroying&&!legacy?.naturalWidth)return false;
 const f=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
 c.save();c.translate(b.x,b.y+f*95);c.rotate((b.a||0)+Math.PI/2+f*.22);c.imageSmoothingEnabled=true;c.globalAlpha*=1-f*.85;
 if(b.destroying){c.drawImage(legacy,legacy.naturalWidth/2,0,legacy.naturalWidth/2,legacy.naturalHeight,-105,-105,210,210);c.restore();return true;}
 c.drawImage(images.hull,-105,-105,210,210);
 for(const p of b.parts||[]){
  const {x,y}=gothaPartLocal(b,p);
  if(p.id.startsWith('engine-'))engine(c,p,x,y,b.motionTime||0,p.id==='engine-left'?0:1.7);
  else if(p.id==='bomb-bay')bay(c,b,p,x,y);
  else if(p.id==='rear-gun')rearGun(c,p,x,y);
 }
 c.restore();return true;
}
