// Visual-only wake for the six real Voss identity decoys. No particles or gameplay state.
// The existing vapor sheet contains unrelated pixels above its lower horizontal ribbon.
export const VOSS_TRAIL_CROP=Object.freeze({x:48,y:128,w:153,h:27});
let ribbon=null;
export const vossDecoyArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return}
 const im=new Image();im.onload=()=>{ribbon=im;resolve(true)};im.onerror=()=>resolve(false);
 im.src=new URL('./fx-pack-v189/gas-smoke/vapor-trail.webp',import.meta.url).href;
});
export function drawRevisionDecoy(c,d,x,y,{planeSprite,aircraftKey,visualAlpha=null,visualFade=null}){
 const voss=d.pilot==='voss'&&d.identityDecoy;
 if(voss&&(!(d.life>0)||!(d.hp>0)))return false;
 c.save();
 try{
  if(voss&&ribbon){
   const age=Math.max(0,1.2-d.life),fade=visualFade??(Math.min(1,age/.09)*Math.min(1,d.life/.3));
   c.save();c.translate(x,y);c.rotate(d.a);c.globalAlpha*=.8*fade;
   const length=14+Math.min(1,age/.22)*8,b=VOSS_TRAIL_CROP;
   // Aircraft heading is local +X. Mirror the authored ribbon so its fine tip trails behind.
   for(const side of [-1,1]){c.save();c.translate(-5,side*28);c.scale(-1,1);c.drawImage(ribbon,b.x,b.y,b.w,b.h,0,-2.5,length,5);c.restore()}
   c.restore();
  }
  // Preserve the existing silhouette opacity. The real player remains entirely untouched.
  c.globalAlpha=visualAlpha??Math.min(.45,d.life*.4);
  planeSprite(c,x,y,d.a,aircraftKey(d.plane,false,d.pilot),1);
 }finally{c.restore()}
 return true;
}

// Renderer-owned forward-flight echoes: never inserted into the combat world.
export const VOSS_ECHO_SECONDS=.75;
const histories=new WeakMap();
export function drawRevisionDecoys(c,world,{planeSprite,aircraftKey,offsetX=0,offsetY=0}){
 const now=Number.isFinite(world.t)?world.t:0;
 let h=histories.get(world);
 if(!h||now<h.clock){h={clock:now,records:new Map()};histories.set(world,h)}
 h.clock=now;
 const ended=['lost','won','menu'].includes(world.state);
 const owners=world.players||[world],alive=id=>!ended&&owners.some(p=>(p.id||'p1')===id&&p.pilot==='voss'&&p.hp>0&&p.status!=='downed');
 if(ended)h.records.clear();
 for(const [key,r] of h.records)if(!alive(r.ownerId))h.records.delete(key);
 const seen=new Set();let echoes=0;
 for(const d of world.revisionDecoys||[]){
  if(d.pilot!=='voss'||!d.identityDecoy){drawRevisionDecoy(c,d,d.x+offsetX,d.y+offsetY,{planeSprite,aircraftKey});continue}
  const owner=d.ownerId||'p1',key=owner+':'+d.a.toFixed(4);
  if(!(d.life>0&&d.hp>0)||!alive(owner)){h.records.delete(key);continue}
  seen.add(key);
  // Snapshot primitives only, not a new Game entity or a trail emitter.
  h.records.delete(key); // Keep activation/refresh order for the per-owner cap.
  h.records.set(key,{x:d.x,y:d.y,a:d.a,plane:d.plane,pilot:d.pilot,ownerId:owner,expires:now+d.life,sampledAt:now,speed:Math.max(0,(d.vx||0)*Math.cos(d.a)+(d.vy||0)*Math.sin(d.a))});
  const age=Math.max(0,1.2-d.life),remaining=d.life+VOSS_ECHO_SECONDS;
  drawRevisionDecoy(c,d,d.x+offsetX,d.y+offsetY,{planeSprite,aircraftKey,visualAlpha:.45*Math.min(1,remaining/1.2),visualFade:Math.min(1,age/.09)*Math.min(1,remaining/1.2)});
 }
 // Six final poses per owner, bounded even when a new activation changes heading.
 const perOwner=new Map();
 for(const [key,r] of [...h.records].reverse()){
  const count=perOwner.get(r.ownerId)||0;perOwner.set(r.ownerId,count+1);
  if(count>=6){h.records.delete(key);continue}
  if(seen.has(key))continue;
  // An unexpectedly removed record must not leave a phantom (death/reset/cleanup).
  if(now<r.expires-.05||now>=r.expires+VOSS_ECHO_SECONDS){h.records.delete(key);continue}
  const fade=Math.max(0,(r.expires+VOSS_ECHO_SECONDS-now)/1.2);
  // Continue along the last real heading in WORLD space, independent of camera motion.
  const travel=r.speed*Math.max(0,now-r.sampledAt),x=r.x+Math.cos(r.a)*travel,y=r.y+Math.sin(r.a)*travel;
  drawRevisionDecoy(c,{...r,identityDecoy:true,hp:1,life:.001},x+offsetX,y+offsetY,{planeSprite,aircraftKey,visualAlpha:.45*fade,visualFade:fade});echoes++;
 }
 return echoes;
}
