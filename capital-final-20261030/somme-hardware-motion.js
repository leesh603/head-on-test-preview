import {SOMME_FRAMES} from './somme-boss-atlas.js?v=capital-final-20261030';

// Measured barrel-to-carriage joints in the existing production sheets.
export const SOMME_GUN_JOINTS=Object.freeze({'gun-twin-aa':240,'gun-heavy':180,'gun-mg':90,'mark1-gun-heavy':244,'mark1-gun-mg':248});
export function sommeWeaponPose(key,state,p){
 const normal=SOMME_FRAMES[key+'-normal'];
 return {frame:SOMME_FRAMES[key+'-'+state],scale:p.muzzleLength/normal.reach,joint:SOMME_GUN_JOINTS[key],recoil:state==='wreck'?0:Math.max(0,Math.min(1,(p.recoil||0)/.28))*p.muzzleLength*.075};
}
export function drawSommeWeapon(c,key,state,p,image){
 if(!image?.naturalWidth)return false;
 const pose=sommeWeaponPose(key,state,p),[sx,sy,sw,sh]=pose.frame.rect,[px,py]=pose.frame.pivot,k=pose.scale,x=-px*k,y=-py*k,w=sw*k,h=sh*k;
 c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);c.imageSmoothingEnabled=true;
 if(pose.recoil>0){
  const cut=pose.joint*k;
  c.save();c.beginPath();c.rect(x,y,w,cut);c.clip();c.drawImage(image,sx,sy,sw,sh,x,y+pose.recoil,w,h);c.restore();
  // Full-frame sampling keeps lower carriage pixels identical at rest/fire.
  c.save();c.beginPath();c.rect(x,y+cut,w,h-cut);c.clip();c.drawImage(image,sx,sy,sw,sh,x,y,w,h);c.restore();
 }else c.drawImage(image,sx,sy,sw,sh,x,y,w,h);
 c.restore();return true;
}

export const SOMME_TREAD_FRAMES=12;
const pitch=28,sourceY=80,width=68,profiles={left:192,right:169};
let ribbons=new WeakMap();const travel=new Map();
export function releaseSommeHardware(){ribbons=new WeakMap();travel.clear();}
export function sommeTreadPose(b){
 const key=b.id??b,s=b.sommeScale||1,old=travel.get(key),yaw=b.hullYaw||0;
 if(!old){const p={x:b.x,y:b.y,yaw,left:0,right:0};travel.set(key,p);return p;}
 const dx=b.x-old.x,dy=b.y-old.y,turn=Math.atan2(Math.sin(yaw-old.yaw),Math.cos(yaw-old.yaw));
 if(!b.destroying&&!b.parts?.find(p=>p.id==='engine-deck')?.destroyed&&Math.hypot(dx,dy)<100*s&&Math.abs(turn)<.45){
  const forward=(dx*Math.sin(yaw)-dy*Math.cos(yaw))/s;
  for(const side of ['left','right'])if(!b.parts?.find(p=>p.id==='track-'+side)?.destroyed)old[side]+=forward+(side==='left'?1:-1)*turn*49;
 }
 // Refresh even when disabled: stopped intervals can never accumulate travel.
 old.x=b.x;old.y=b.y;old.yaw=yaw;return old;
}
export function sommeTreadFrame(distance=0){return ((Math.floor(distance/(pitch*184/344)*SOMME_TREAD_FRAMES)%SOMME_TREAD_FRAMES)+SOMME_TREAD_FRAMES)%SOMME_TREAD_FRAMES;}
export function prepareSommeTreads(image,makeCanvas){
 if(!image?.naturalWidth)return null;
 if(!makeCanvas){if(typeof OffscreenCanvas==='undefined'&&typeof document==='undefined')return null;makeCanvas=()=>typeof OffscreenCanvas==='function'?new OffscreenCanvas(1,1):document.createElement('canvas');}
 const cached=ribbons.get(image);if(cached)return cached;const result={};
 for(const side of ['left','right']){
  const normal=SOMME_FRAMES['track-'+side+'-normal'],x=profiles[side],native=makeCanvas();native.width=width*SOMME_TREAD_FRAMES;native.height=724;const c=native.getContext('2d');if(!c)return null;
  for(let state=0;state<2;state++)for(let frame=0;frame<SOMME_TREAD_FRAMES;frame++)for(const [start,end]of state?[[25,120],[235,342]]:[[20,345]])for(let y=start;y<end;y++){
   const phase=((y-20-frame*pitch/SOMME_TREAD_FRAMES)%pitch+pitch)%pitch;
   c.drawImage(image,normal.rect[0]+x,sourceY+phase,width,1,frame*width,state*362+y,width,1);
  }
  const compact=makeCanvas();compact.width=34*SOMME_TREAD_FRAMES;compact.height=362;const target=compact.getContext('2d');if(!target)return null;
  for(let state=0;state<2;state++)for(let frame=0;frame<SOMME_TREAD_FRAMES;frame++)target.drawImage(native,frame*width,state*362,width,362,frame*34,state*181,34,181);
  result[side]={image:compact,x,width,frameWidth:34,frameHeight:181};
 }
 ribbons.set(image,result);return result;
}
export function drawSommeTread(c,b,p,image,pose){
 if(b.destroying||p.destroyed)return false;const atlas=prepareSommeTreads(image);if(!atlas)return false;
 const side=p.id==='track-left'?'left':'right',r=atlas[side],damaged=p.hp<=p.maxHp*.5,f=SOMME_FRAMES[p.art+'-'+(damaged?'damaged':'normal')],n=SOMME_FRAMES[p.art+'-normal'],kx=p.drawWidth/n.solid[2],ky=p.drawHeight/n.solid[3],[px,py]=f.pivot,s=b.sommeScale||1;
 c.drawImage(r.image,sommeTreadFrame(pose[side])*r.frameWidth,damaged?r.frameHeight:0,r.frameWidth,r.frameHeight,p.localX*s+(r.x-px)*kx,p.localY*s-py*ky,r.width*kx,362*ky);return true;
}
