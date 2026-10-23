import {SOMME_FRAMES} from './somme-boss-atlas.js?v=headon-quality-20261023-7d8a4756';
import {TREFFAS_ART} from './cambrai-layout.js?v=headon-quality-20261023-7d8a4756&cambrai=20261021';
export const CAMBRAI_DETAIL_SOURCES=Object.freeze({hull:'./boss-cambrai-hull-20261021.webp',hardware:'./boss-cambrai-hardware-20261021.webp',cars:'./boss-cambrai-cars-20261021.webp',mg:'./boss-mark1-guns-r3.webp',aa:'./boss-schwaben-guns-r2.webp'});
const HW=[[178,20,156,472],[102,149,308,214],[197,99,117,313]],CAR=[[71,10,114,236],[62,10,131,236],[61,10,133,236],[59,10,137,236],[53,10,150,236]];
let images={},pending=null,wheelFrames=[];
export function cambraiDetailReady(){return Object.keys(CAMBRAI_DETAIL_SOURCES).every(k=>images[k]?.naturalWidth>0);}
export function prepareCambraiDetailArt(){if(pending)return pending;pending=Promise.all(Object.entries(CAMBRAI_DETAIL_SOURCES).map(([key,url])=>new Promise(resolve=>{const im=new Image();im.decoding='async';images[key]=im;im.addEventListener('load',()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im)),{once:true});im.addEventListener('error',()=>resolve(im),{once:true});im.src=url;}))).then(result=>{if(cambraiDetailReady())bakeWheelFrames();return result;});return pending;}
export function releaseCambraiDetailArt(){images={};pending=null;wheelFrames=[];}
const part=(b,id)=>b.parts?.find?.(p=>p.id===id)||b.parts?.get?.(id);
export const cambraiPartState=(p,dead=false)=>dead||p?.destroyed?2:p?.hp<=p?.maxHp*.5?1:0;
function component(c,row,state,w,h){const [x,y,bw,bh]=HW[row];c.drawImage(images.hardware,state*512,row*512,512,512,(-x-bw/2)*w/bw,(-y-bh/2)*h/bh,512*w/bw,512*h/bh);}
function bakeWheelFrames(){
 if(!globalThis.document?.createElement)return;
 // Eight small wheel surfaces are baked once. Runtime scrolling allocates no
 // canvases or masks; rims, hubs, end caps and collision mounts stay fixed.
 for(let phase=0;phase<8;phase++){
  const cv=document.createElement('canvas');cv.width=160;cv.height=578;const c=cv.getContext('2d');if(!c?.drawImage||!c.createLinearGradient){wheelFrames=[];return;}
  c.scale(2,2);c.save();c.translate(40,144.5);component(c,0,0,80,289);c.restore();
  const x=17,y=45,w=29,h=200,offset=phase*2;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  // The authored front tread repeats under the stationary rim. Keep a clear
  // margin at both ends, where its round cap carries the lighting.
  c.drawImage(images.hardware,210,100+offset*2,56,320-offset*2,x,y,w,h*(160-offset)/160);
  if(offset)c.drawImage(images.hardware,210,100,56,offset*2,x,y+h*(160-offset)/160,w,h*offset/160);
  c.restore();wheelFrames.push(cv);
 }
}
function weapon(c,p,key,x,y,angle,length,dead=false,recoil=0){
 const f=SOMME_FRAMES[key+'-'+(dead||p.destroyed?'wreck':p.hp<=p.maxHp*.5?'damaged':'normal')],n=SOMME_FRAMES[key+'-normal'],im=images[key.startsWith('mark1')?'mg':'aa'],k=length/n.reach;
 c.save();c.translate(x-Math.cos(angle)*recoil,y-Math.sin(angle)*recoil);c.rotate(angle+Math.PI/2);c.drawImage(im,...f.rect,-f.pivot[0]*k,-f.pivot[1]*k,f.rect[2]*k,f.rect[3]*k);c.restore();
}
export function drawAuthoredTreffas(c,b){
 if(!cambraiDetailReady())return false;
 const dead=b.destroying,state=dead?2:b.hp<b.maxHp*.55?1:0,heading=b.heading||0;
 c.save();c.rotate(heading);c.imageSmoothingEnabled=true;
 // This registration maps the generated socket and axle to the original
 // cannon pivot and +/-112,-8 wheel mounts, without scaling the boss itself.
 c.drawImage(images.hull,state*512,0,512,512,-256*.522,-274*.522,512*.522,512*.522);
 for(const [id,side]of [['wheel-left',-1],['wheel-right',1]]){
  const p=part(b,id),st=cambraiPartState(p,dead),roll=(side<0?b.wheelRollLeft:b.wheelRollRight)??b.wheelRoll??0;
  c.save();c.translate(side*112,-8);if(side>0)c.scale(-1,1);
  if(st===0&&wheelFrames.length===8)c.drawImage(wheelFrames[Math.floor(Math.abs(roll)*8)%8],-40,-144.5,80,289);else component(c,0,st,80,289);c.restore();
 }
 c.save();c.translate(0,124);component(c,1,cambraiPartState(part(b,'rudder'),dead),80,56);c.restore();
 const p=part(b,'turret'),st=cambraiPartState(p,dead),s=TREFFAS_ART.worldWidth/TREFFAS_ART.width,k=TREFFAS_ART.gunLength*s/272;
 c.save();c.translate((TREFFAS_ART.gunX-TREFFAS_ART.width/2)*s,(TREFFAS_ART.gunY-TREFFAS_ART.height/2)*s);c.rotate((b.gunAngle??-Math.PI/2)-heading+Math.PI/2);c.translate(0,dead||p?.destroyed?0:(p?.recoil||0)*4);c.drawImage(images.hardware,st*512,1024,512,512,-256*k,-391*k,512*k,512*k);c.restore();
 c.restore();
 for(const id of ['mg-left','mg-right']){const p=part(b,id);if(p)weapon(c,p,'mark1-gun-mg',p.x,p.y,p.aimAngle??heading+(id==='mg-left'?Math.PI:0),20,dead,Math.min(.18,p.recoil||0)*8);}
 return true;
}
export function drawCambraiTrainCar(c,b,p,id){
 if(!cambraiDetailReady())return false;
 const row=id==='engine'?0:id==='car-flak'?1:id.startsWith('car-launch')?2:id==='car-supply'?3:4,st=p?cambraiPartState(p,b.destroying):b.destroying?2:b.hp<b.maxHp*.5?1:0;
 const [x,y,w,h]=CAR[row],k=Math.min(140/w,239/h);
 c.drawImage(images.cars,st*256,row*256,256,256,(-x-w/2)*k,(-y-h/2)*k,256*k,256*k);
 if(p&&(id==='car-flak'||id==='car-rear')){
  const a=(p.shotAngle??((p.angle||0)-Math.PI/2))-(p.angle||0),recoil=st===2?0:Math.min(1,(p.gunFlash||0)/.16)*2;
  weapon(c,p,id==='car-flak'?'gun-twin-aa':'gun-mg',0,id==='car-flak'?-8:-3,a,id==='car-flak'?60:30,b.destroying,recoil);
 }
 return true;
}
