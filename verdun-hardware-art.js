import {VERDUN_PART_FRAMES} from './verdun-art-layout.js?v=headon-quality-20261023-7d8a4756';

// Measured barrel/receiver joints in the approved source crops. The lower
// carriage retains its pivot; only the steel above this joint recoils.
const JOINTS={douaumont:{heavy:[100,95],mg:[64,62],aa:[86,82]},souville:{bunker:[63],pit:[86]}};
export function drawVerdunWeapon(c,im,type,state,x,y,muzzle,angle,sou=false,recoil=0){
 if(!im?.naturalWidth)return;
 const key=sou?'souville':'douaumont',frames=VERDUN_PART_FRAMES[key].guns[type];if(!frames)return;
 const f=frames[state],[sx,sy,sw,sh]=f.rect,[px,py]=f.pivot,wreck=state===frames.length-1,k=muzzle/(wreck?frames[0].reach:f.reach);
 c.save();c.translate(x,y);c.rotate(angle+Math.PI/2);c.imageSmoothingEnabled=true;
 const joint=JOINTS[key][type]?.[state];
 if(!wreck&&recoil>0&&joint){
  // The receiver lip occludes the retracting barrel. No part of the mount,
  // ammunition feed or gun shield is translated with the shot.
  c.save();c.beginPath();c.rect(-px*k,-py*k,sw*k,joint*k);c.clip();
  c.drawImage(im,sx,sy,sw,joint,-px*k,-py*k+recoil,sw*k,joint*k);c.restore();
  c.drawImage(im,sx,sy+joint,sw,sh-joint,-px*k,(joint-py)*k,sw*k,(sh-joint)*k);
 }else c.drawImage(im,sx,sy,sw,sh,-px*k,-py*k,sw*k,sh*k);
 c.restore();
}

// A transition owns one reusable canvas per native component. It contains an
// alpha-weighted sum, avoiding the opaque healthy frame beneath a fading wreck.
let blends=new WeakMap();
export function releaseVerdunHardware(){blends=new WeakMap();}
function rawMount(c,im,set,state,kx,ky){const f=set.frames[state],[sx,sy,sw,sh]=f.rect,[px,py]=f.pivot;c.drawImage(im,sx,sy,sw,sh,-px*kx,-py*ky,sw*kx,sh*ky);}
export function drawVerdunMount(c,im,type,state,p,gun,sou=false,blend=1,from=0){
 if(!im?.naturalWidth)return;
 const set=VERDUN_PART_FRAMES[sou?'souville':'douaumont'].mounts[type];if(!set)return;
 const kx=p.drawWidth/set.size[0],ky=(gun?p.drawWidth*.76:p.drawHeight)/set.size[1],amount=Math.round(Math.max(0,Math.min(1,blend))*32)/32;
 c.save();c.translate(p.x,p.y);c.imageSmoothingEnabled=true;
 if(amount===1||from===state)rawMount(c,im,set,state,kx,ky);
 else if(amount===0)rawMount(c,im,set,from,kx,ky);
 else if(typeof document==='undefined'){
  const alpha=c.globalAlpha;c.globalAlpha=alpha*(1-amount);rawMount(c,im,set,from,kx,ky);c.globalAlpha=alpha*amount;rawMount(c,im,set,state,kx,ky);
 }else{
  let cache=blends.get(p);
  if(!cache||cache.source!==im||cache.set!==set){
   const left=Math.floor(Math.min(...set.frames.map(f=>-f.pivot[0]))),top=Math.floor(Math.min(...set.frames.map(f=>-f.pivot[1]))),right=Math.ceil(Math.max(...set.frames.map(f=>f.rect[2]-f.pivot[0]))),bottom=Math.ceil(Math.max(...set.frames.map(f=>f.rect[3]-f.pivot[1])));
   const canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=bottom-top;cache={source:im,set,canvas,left,top};blends.set(p,cache);
  }
  const signature=from+':'+state+':'+amount;
  if(cache.signature!==signature){const d=cache.canvas.getContext('2d');d.clearRect(0,0,cache.canvas.width,cache.canvas.height);d.save();d.translate(-cache.left,-cache.top);d.globalAlpha=1-amount;rawMount(d,im,set,from,1,1);d.globalCompositeOperation='lighter';d.globalAlpha=amount;rawMount(d,im,set,state,1,1);d.restore();cache.signature=signature;}
  c.drawImage(cache.canvas,cache.left*kx,cache.top*ky,cache.canvas.width*kx,cache.canvas.height*ky);
 }
 c.restore();
}

// The authored circular steel lid withdraws into its two receiver edges.
// The open well stays at the same measured mounting centre throughout.
export function drawVerdunPit(c,im,p){
 const amount=Math.max(0,Math.min(1,p.openAmount??(p.revealed?1:0))),damaged=p.hp<p.maxHp*.55,state=damaged?2:0,set=VERDUN_PART_FRAMES.souville.mounts.pit;
 const kx=p.drawWidth/set.size[0],ky=p.drawWidth*.76/set.size[1];
 drawVerdunMount(c,im,'pit',state,p,true,true,damaged?p.damageBlend??1:1);
 if(amount<=0)return;
 c.save();c.translate(p.x,p.y);c.scale(kx,ky);c.beginPath();c.ellipse(0,0,56,56,0,0,Math.PI*2);c.clip();
 rawMount(c,im,set,1,1,1);
 // Two source halves retain their original rivets, curved silhouette and alpha.
 // The cover foreshortens into fixed side pockets instead of fading away.
 if(amount<1){const f=set.frames[state],[sx,sy]=f.rect,[px,py]=f.pivot,width=56*Math.cos(amount*Math.PI/2);
  for(const side of [-1,1]){c.save();c.beginPath();c.ellipse(0,0,56,56,0,0,Math.PI*2);c.clip();c.drawImage(im,sx+px+(side<0?-56:0),sy+py-56,56,112,side<0?-56:56-width,-56,width,112);c.restore();}
 }
 c.restore();
}
