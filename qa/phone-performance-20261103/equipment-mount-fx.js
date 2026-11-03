// Tiny authored Scarff hardware and compass pickup wisps. Visual state only.
import {WWI_FRAMES} from './wwi-equipment-art-data.js';
// Visual reuse of the existing Lewis-shaped Hythe hardware; not a claim that
// the camera sprite is a historically exact Scarff gun. Preserve its full cell
// alpha, but size using the painted235px bbox and register the magazine pivot.
const MOUNT_FRAME={...WWI_FRAMES.hytheMount,pivotX:108,pivotY:129,visualWidth:235};
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const alive=p=>p?.hp>0&&p.status!=='downed'&&!(p.heineckeEscape>0);
const images=Object.create(null);
export const equipmentMountArtReady=Promise.all([
 ['mount','wwi-equipment-atlas.webp',1280,1024],
 ['wind','fx-wind-streak.webp',256,144]
].map(([key,file,w,h])=>new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return;}
 const im=new Image();im.decoding='async';im.onload=()=>{const valid=im.naturalWidth===w&&im.naturalHeight===h;if(valid)images[key]=im;im.onload=im.onerror=null;resolve(valid);};im.onerror=()=>{im.onload=im.onerror=null;resolve(false);};im.src=new URL('./'+file,import.meta.url).href;
}))).then(values=>values.every(Boolean));
export function drawScarffMount(c,p,x,y,{local=false}={}){
 if(!alive(p)||!p.scarffRing||!p.upgrades?.rearGunner||p.bomberTransfer||!images.mount||!Number.isFinite(x)||!Number.isFinite(y))return;
 const aim=finite(p.scarffAim,finite(p.a)),a=local?aim-finite(p.a):aim,f=MOUNT_FRAME,scale=14/f.visualWidth,base=local?0:finite(p.a);
 // A physical mount stays just behind the cockpit. Unlike the old directional
 // tick, it must not orbit the plane when the real gunner aim turns.
 c.save();c.translate(x-3*Math.cos(base),y-3*Math.sin(base));c.rotate(a);c.imageSmoothingEnabled=true;
 c.drawImage(images.mount,f.x,f.y,f.w,f.h,-f.pivotX*scale,-f.pivotY*scale,f.w*scale,f.h*scale);c.restore();
}
export function drawCompassPickupWisps(c,p,x,y,{low=false}={}){
 if(!alive(p)||!p.upgrades?.fogCompass||!images.wind||!Number.isFinite(x)||!Number.isFinite(y)||!(p.magnet>30))return;
 const world=p.combatWorld?.()||p,players=world.players;
 // Co-op physics assigns each drop to the nearest living player. A compass
 // must not show two contradictory attraction directions for the same drop.
 const living=players?(typeof world.living==='function'?world.living():players.filter(q=>q.hp>0&&q.status!=='downed')):null;
 let count=0;
 for(const d of world.drops||[]){
  if(d.supply||d.dead||(d.life!==undefined&&!(d.life>0))||!Number.isFinite(d.x)||!Number.isFinite(d.y))continue;
  const dx=d.x-finite(p.x),dy=d.y-finite(p.y),dist=Math.hypot(dx,dy);if(dist<30||dist>=p.magnet)continue;
  if(living){let owner=null,best=Infinity;for(const q of living){const qd=(d.x-q.x)**2+(d.y-q.y)**2;if(qd<best){best=qd;owner=q;}}if(owner!==p)continue;}
  if(count++>=(low?3:6))break;
  const ux=dx/dist,uy=dy/dist,a=Math.atan2(dy,dx),offset=d.heal?30:12;
  // The existing painted wisp is dense at its left; its light tail extends
 // outward behind the inward-moving non-supply pickup, not around the plane.
 // Heal art is46px wide: keep the same short wisp just beyond its23px edge.
  c.save();c.translate(x+dx+ux*offset,y+dy+uy*offset);c.rotate(a);c.globalAlpha*=.38;c.imageSmoothingEnabled=true;
  c.drawImage(images.wind,0,0,256,144,-7,-1.5,14,3);c.restore();
 }
}
