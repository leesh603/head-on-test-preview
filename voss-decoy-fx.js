import {vossDecoyFlightPose} from './voss-decoy-flight.js';
// Visual-only wake for the six/eight real Voss identity decoys. No particles or gameplay state.
// The existing vapor sheet contains unrelated pixels above its lower horizontal ribbon.
export const VOSS_TRAIL_CROP=Object.freeze({x:48,y:128,w:153,h:27});
const clamp=n=>Math.max(0,Math.min(1,n));
const entry=n=>{const t=clamp(n/.16);return t*t*(3-2*t)};
const decoyAge=d=>Math.max(0,(d.medalDecoy?1.6:1.2)-d.life);
let ribbon=null;
export const vossDecoyArtReady=new Promise(resolve=>{
 if(typeof Image==='undefined'){resolve(false);return}
 const im=new Image();im.onload=()=>{ribbon=im;resolve(true)};im.onerror=()=>resolve(false);
 im.src=new URL('./fx-pack-v189/gas-smoke/vapor-trail.webp',import.meta.url).href;
});
export function drawRevisionDecoy(c,d,x,y,{planeSprite,aircraftKey,visualAlpha=null,visualFade=null,visualAge=null}){
 const voss=d.pilot==='voss'&&d.identityDecoy;
 if(voss&&(!(d.life>0)||!(d.hp>0)))return false;
 c.save();
 try{
  if(voss&&ribbon){
   const age=visualAge??decoyAge(d),fade=visualFade??(Math.min(1,age/.09)*Math.min(1,d.life/.3));
   c.save();c.translate(x,y);c.rotate(d.a);c.globalAlpha*=.8*fade;
   const length=18+Math.min(1,age/.22)*8,b=VOSS_TRAIL_CROP;
   // Aircraft heading is local +X. Mirror the authored ribbon so its fine tip trails behind.
   for(const side of [-1,1])for(let i=0;i<3;i++){
    const breath=.94+.06*Math.sin(age*9+d.a*1.3+side*.8),width=length*(1-i*.22)*breath,height=5-i*.9;
    c.save();c.globalAlpha*=1-i*.26;
    const flight=d.vossFlight||d.flight;
    if(flight){const previous=vossDecoyFlightPose(flight,Math.max(0,age-i*.08)),dx=previous.x-d.x,dy=previous.y-d.y;
     c.translate(dx*Math.cos(d.a)+dy*Math.sin(d.a),-dx*Math.sin(d.a)+dy*Math.cos(d.a));c.rotate(previous.a-d.a);
    }
    c.translate(-5-(flight?0:i*12),side*(28+i*1.2));c.scale(-1,1);
    c.drawImage(ribbon,b.x,b.y,b.w,b.h,0,-height/2,width,height);c.restore();
   }
   c.restore();
  }
  // Unfold the silhouettes at launch; respect the caller's visibility/transition alpha.
  const alpha=visualAlpha??Math.min(.45,d.life*.4)*(voss?entry(visualAge??decoyAge(d)):1);
  if(voss)c.globalAlpha*=alpha;else c.globalAlpha=alpha;
  planeSprite(c,x,y,d.a,aircraftKey(d.plane,false,d.pilot),1);
 }finally{c.restore()}
 return true;
}

// Renderer-owned flight continuation: never inserted into the combat world.
export const VOSS_ECHO_SECONDS=.75;
const histories=new WeakMap();
export function drawRevisionDecoys(c,world,{planeSprite,aircraftKey,offsetX=0,offsetY=0}){
 const now=Number.isFinite(world.t)?world.t:0;
 let h=histories.get(world);
 if(!h||now<h.clock){h={clock:now,records:new Map(),limits:new Map()};histories.set(world,h)}
 h.clock=now;
 const ended=['lost','won','menu'].includes(world.state);
 const owners=world.players||[world],alive=id=>!ended&&owners.some(p=>(p.id||'p1')===id&&p.pilot==='voss'&&p.hp>0&&p.status!=='downed');
 if(ended){h.records.clear();h.limits.clear();}
 for(const [key,r] of h.records)if(!alive(r.ownerId)){h.records.delete(key);h.limits.delete(r.ownerId);}
 // A medal emits eight real decoys. Do not truncate their visual continuation
 // to the base six, or retain an old eight-way fan when a new six-way one starts.
 const counts=new Map(),enhanced=new Set();
 for(const d of world.revisionDecoys||[])if(d.pilot==='voss'&&d.identityDecoy&&d.life>0&&d.hp>0&&alive(d.ownerId||'p1')){
  const owner=d.ownerId||'p1';counts.set(owner,(counts.get(owner)||0)+1);if(d.medalDecoy)enhanced.add(owner);
 }
 for(const [owner,count]of counts)h.limits.set(owner,enhanced.has(owner)||count>6?8:6);
 const seen=new Set();let echoes=0;
 for(const d of world.revisionDecoys||[]){
  if(d.pilot!=='voss'||!d.identityDecoy){drawRevisionDecoy(c,d,d.x+offsetX,d.y+offsetY,{planeSprite,aircraftKey});continue}
  const owner=d.ownerId||'p1',key=owner+':'+(d.vossFlight?.a??d.a).toFixed(4);
  if(!(d.life>0&&d.hp>0)||!alive(owner)){h.records.delete(key);continue}
  seen.add(key);
  // Snapshot primitives only, not a new Game entity or a trail emitter.
  h.records.delete(key); // Keep activation/refresh order for the per-owner cap.
  h.records.set(key,{x:d.x,y:d.y,a:d.a,plane:d.plane,pilot:d.pilot,ownerId:owner,medalDecoy:!!d.medalDecoy,flight:d.vossFlight?{...d.vossFlight}:null,expires:now+d.life,sampledAt:now,speed:Math.max(0,(d.vx||0)*Math.cos(d.a)+(d.vy||0)*Math.sin(d.a))});
  const age=decoyAge(d),remaining=d.life+VOSS_ECHO_SECONDS;
  drawRevisionDecoy(c,d,d.x+offsetX,d.y+offsetY,{planeSprite,aircraftKey,visualAge:age,visualAlpha:.45*entry(age)*Math.min(1,remaining/1.2),visualFade:Math.min(1,age/.09)*Math.min(1,remaining/1.2)});
 }
 // Six/eight final poses per owner, bounded across reactivation and co-op.
 const perOwner=new Map();
 for(const [key,r] of [...h.records].reverse()){
  const count=perOwner.get(r.ownerId)||0;perOwner.set(r.ownerId,count+1);
  if(count>=(h.limits.get(r.ownerId)||6)){h.records.delete(key);continue}
  if(seen.has(key))continue;
  // An unexpectedly removed record must not leave a phantom (death/reset/cleanup).
  if(now<r.expires-.05||now>=r.expires+VOSS_ECHO_SECONDS){h.records.delete(key);continue}
  const fade=Math.max(0,(r.expires+VOSS_ECHO_SECONDS-now)/1.2);
  // Finish the same banked flight in world space, without a straight-line tail
  // or a teleport when the combat target expires. Old/network records still fly forward.
  const travel=r.speed*Math.max(0,now-r.sampledAt),x=r.x+Math.cos(r.a)*travel,y=r.y+Math.sin(r.a)*travel;
  const age=Math.max(0,(r.medalDecoy?1.6:1.2)+now-r.expires);
  const pose=r.flight?vossDecoyFlightPose(r.flight,age):{x,y,a:r.a};
  drawRevisionDecoy(c,{...r,...pose,identityDecoy:true,hp:1,life:.001},pose.x+offsetX,pose.y+offsetY,{planeSprite,aircraftKey,visualAge:age,visualAlpha:.45*fade,visualFade:fade});echoes++;
 }
 return echoes;
}
