import {ALPS_BOMBER_LAYOUT} from './alps-bomber-layout.js?v=gal1';
export const ALPS_ART_SOURCES=Object.freeze({gik:'./boss-alps-gik-states-20261020.webp?v=muted1',ca4:'./boss-alps-ca4-states-20261020.webp?v=muted1',hardware:'./boss-alps-hardware-20261020.webp?v=muted1'});
let images={},pending=null;
export function prepareAlpsBomberArt(){
 if(pending)return pending;
 pending=Promise.all(Object.entries(ALPS_ART_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;
  im.addEventListener('load',()=>Promise.resolve(im.decode?.()).catch(()=>{}).then(()=>resolve(im)),{once:true});
  im.addEventListener('error',()=>resolve(im),{once:true});im.src=url;
 })));return pending;
}
export function releaseAlpsBomberArt(){images={};pending=null;}
export function alpsBomberArtReady(kind){return !!(images[kind]?.naturalWidth&&images.hardware?.naturalWidth);}
export function alpsHullArtState(b){
 if(b.destroying)return 2;
 const engines=(b.parts||[]).filter(p=>p.kind==='engine'),lost=engines.filter(p=>p.destroyed).length,ratio=b.hp/Math.max(1,b.maxHp);
 return ratio<.3||(engines.length>0&&lost===engines.length)?2:ratio<.65||lost?1:0;
}
export function alpsHardwareArtCell(kind,p,defeat=false){
 const broken=defeat||p.destroyed,state=broken?2:p.hp<p.maxHp*.55?1:0;
 if(p.kind==='engine')return (kind==='ca4'?3:0)+state;
 if(p.id==='cannon')return 6+state;
 if(p.id==='bombBay')return broken?11:p.hittable?10:9;
 return broken?13:12;
}
function partSprite(c,cell,x,y,size,anchorY=.5){
 const im=images.hardware,cw=im.naturalWidth/3;
 c.drawImage(im,(cell%3)*cw,Math.floor(cell/3)*cw,cw,cw,x-size/2,y-size*anchorY,size,size);
}
export function drawAuthoredAlpsBomber(c,b,{effect=()=>{}}={}){
 if(!alpsBomberArtReady(b.assetKey))return false;
 const layout=ALPS_BOMBER_LAYOUT[b.assetKey],s=b.geometryScale||1,w=layout.width*s,h=layout.height*s,time=b.motionTime||0;
 const parts=b.parts||[],defeat=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0,im=images[b.assetKey],frame=alpsHullArtState(b),sw=im.naturalWidth/3;
 c.save();c.translate(b.x,b.y+defeat*130);c.rotate((b.hullYaw||0)+defeat*.8);c.globalAlpha*=1-defeat*.88;c.imageSmoothingEnabled=true;
 c.drawImage(im,frame*sw,0,sw,im.naturalHeight,-w/2,-h/2,w,h);
 let plumes=0;
 for(const p of parts){
  // localX/Y and radius are already scaled; world x/y are rotated copies.
  const x=p.localX??p.x,y=p.localY??p.y,r=p.radius,cell=alpsHardwareArtCell(b.assetKey,p,b.destroying);
  if(p.kind==='engine'){
   const pusher=p.id==='centerEngine';c.save();c.translate(x,y);if(pusher)c.rotate(Math.PI);
   partSprite(c,cell,0,0,r*3);
   if(!p.destroyed&&!b.destroying){c.save();c.translate(0,-r*.95);c.scale(1,.18+.82*Math.abs(Math.sin(time*37+x)));partSprite(c,14,0,0,r*2.65);c.restore();}
   c.restore();
   if(p.destroyed&&plumes++<2){const drift=(time*.48+plumes*.31)%1,age=Math.max(0,time-(p.destroyedAt??time));
    if(age<4)effect('fireEngine',x,y,r*1.8,r*1.8,0,.7*(1-age/4));
    effect('smokeDark',x,y+drift*40*s,r*(1.1+drift),r*(1.1+drift),0,(1-drift)*.4);
   }
  }else if(p.id==='bombBay'){
   const size=r*3.1;partSprite(c,cell,x,y,size);
   if(cell===10&&b.phase!==3){const left=b.bayExpose||0,alpha=left>3.08?(left-3.08)/.22:left>0&&left<.22?1-left/.22:0;
    if(alpha>0){c.save();c.globalAlpha*=Math.min(1,alpha);partSprite(c,9,x,y,size);c.restore();}
   }
  }else{
   const cannon=p.id==='cannon',size=r*(cannon?4:2.7),muzzle=(cannon?16:6)*s;
   c.save();c.translate(x,y);if(p.id==='rearGun')c.rotate(Math.PI);
   // Register the painted barrel tip to alpsMuzzle's existing physical offset.
   const recoil=p.destroyed||b.destroying?0:Math.min(1,(p.recoil||0)/(cannon?.22:.12))*(cannon?4:1.8)*s;
   partSprite(c,cell,0,recoil,size,.02+muzzle/size);c.restore();
  }
 }
 c.restore();return true;
}
