// Host-authoritative experimental encounter. No campaign registration.
// All coordinates are local world units (authoring pixels * 0.5, pivot 512/768).
export const FACTORY_LIMITS=Object.freeze({hazards:28,units:4,events:32,effects:24,step:1/60});
export const FACTORY_PARTS=Object.freeze([
 {id:'production-left',x:4,y:-114,r:36,role:'production',maxHp:220},
 {id:'production-right',x:79,y:-71,r:36,role:'production',maxHp:220},
 {id:'boiler',x:104,y:-224,r:58,role:'boiler',maxHp:300},
 {id:'turret-left',x:-174.5,y:-241,r:30,role:'turret',maxHp:180},
 {id:'turret-right',x:203,y:-31,r:30,role:'turret',maxHp:180},
 {id:'turret-rear-left',x:-154.5,y:166.5,r:30,role:'turret',maxHp:180},
 {id:'turret-rear-right',x:149,y:245,r:30,role:'turret',maxHp:180},
 {id:'crane',x:75,y:-196,r:30,role:'crane',maxHp:180},
 {id:'track-left',x:-215,y:80,r:50,role:'track',maxHp:220},
 {id:'track-right',x:215.5,y:80,r:50,role:'track',maxHp:220}
].map(Object.freeze));
export const FACTORY_BALANCE=Object.freeze({aimTolerance:.075,muzzle:45,recoilTravel:3,magazine:4,manualReload:11,craneRefill:3,railClearance:.85,launchInterval:7.5,launchSpeed:145});
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const turn=(a,b,n)=>a+clamp(delta(b,a),-n,n);
const point=(s,p)=>({x:s.x+p.x*Math.cos(s.a)-p.y*Math.sin(s.a),y:s.y+p.x*Math.sin(s.a)+p.y*Math.cos(s.a)});
const part=(s,id)=>s.parts.find(p=>p.id===id);
const alive=(s,id)=>part(s,id)?.hp>0;
const livePlayer=p=>p.alive!==false&&(p.hp==null||p.hp>0)&&!['downed','dead','defeated'].includes(p.status)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&(p.id??p.playerId)!=null;
const playerId=p=>p.id??p.playerId;
export function factoryMuzzleLocal(p){const reach=FACTORY_BALANCE.muzzle-FACTORY_BALANCE.recoilTravel*(p.recoil||0);return{x:p.x+Math.cos(p.angle)*reach,y:p.y+Math.sin(p.angle)*reach};}
export function factoryMuzzle(s,p){return{...point(s,factoryMuzzleLocal(p)),angle:p.angle+s.a};}
export function createBoss({entityId='factory-test',token='factory-test',x=0,y=0,a=0,anchors={}}={}){
 return {version:2,entityId,token,variant:'factory',x,y,a,homeX:x,homeY:y,homeA:a,time:0,velocity:0,angularVelocity:0,coreHp:2000,maxCoreHp:2000,coreExposed:false,pressure:1,phase:'production',sequence:0,targetCursor:0,supplyCount:0,parts:FACTORY_PARTS.map((p,i)=>({...p,...anchors[p.id],hp:p.maxHp,angle:Math.PI/2,cooldown:2+i*.55,recoil:0,cycle:0,trackDistance:0,active:true,hitFlash:0,damageFlash:0,activity:'idle',magazine:p.role==='turret'?FACTORY_BALANCE.magazine:0,manualReload:0,task:null})),hazards:[],effects:[],damageEvents:[],defeat:null};
}
export function listParts(s){return s.parts.map(p=>({...p,...point(s,p)})).concat(s.coreExposed?[{id:'core',x:s.x,y:s.y,r:65,hp:s.coreHp,maxHp:s.maxCoreHp,role:'core'}]:[]);}
function refresh(s){
 const powered=alive(s,'boiler');
 s.coreExposed=!powered||!s.parts.some(p=>p.hp>0&&(p.role==='production'||p.role==='turret'));
 for(const p of s.parts){p.active=p.hp>0&&(!['production','crane'].includes(p.role)||powered);if(!p.active){p.task=null;p.activity=p.hp<=0?'destroyed':'unpowered';}}
 s.phase=s.coreExposed?'core-exposed':s.parts.some(p=>p.hp<=0)?'partial-operation':'production';
}
function effect(s,kind,p,position={}){if(s.effects.length>=FACTORY_LIMITS.effects)s.effects.shift();s.effects.push({kind,sourcePartId:p.id,...point(s,p),...position,age:0,life:kind==='supply'? .65:.32});}
export function damagePart(s,id,amount){
 if(s.coreHp<=0||!Number.isFinite(amount)||amount<=0)return 0;
 if(id==='core'){
  if(!s.coreExposed)return 0;
  const dealt=Math.min(amount,s.coreHp);s.coreHp-=dealt;
  if(s.coreHp<=0){s.phase='defeated';s.pressure=0;s.velocity=0;s.angularVelocity=0;s.defeat={token:s.token+':'+s.entityId,elapsed:0};s.hazards=[];s.effects=[];s.damageEvents=[];for(const p of s.parts){p.active=false;p.recoil=0;p.task=null;p.activity='destroyed';}}return dealt;
 }
 const p=part(s,id);if(!p||p.hp<=0)return 0;
 const dealt=Math.min(amount,p.hp);p.hp-=dealt;p.hitFlash=.16;p.damageFlash=.5;effect(s,'hit',p);s.coreHp=Math.max(Math.min(400,s.coreHp),s.coreHp-dealt*.65);
 if(p.hp===0){p.active=false;p.recoil=0;p.task=null;refresh(s);
  // Cancel only queued attacks. Launched aircraft/bullets survive their source.
  s.hazards=s.hazards.filter(h=>h.fired||part(s,h.sourcePartId)?.active);
  for(const q of s.parts)if(q.task?.targetPartId===p.id)q.task=null;
  if(p.role==='track'&&!s.parts.some(q=>q.role==='track'&&q.hp>0)){s.velocity=0;s.angularVelocity=0;}
 }return dealt;
}
function queue(s,p,target,kind){
 if(s.hazards.length>=FACTORY_LIMITS.hazards||s.hazards.some(h=>!h.fired&&h.sourcePartId===p.id))return false;
 if(kind==='unit'&&s.hazards.filter(h=>h.kind==='unit').length>=FACTORY_LIMITS.units)return false;
 const at=kind==='projectile'?factoryMuzzle(s,p):point(s,p),angle=p.angle+s.a;
 s.hazards.push({id:s.entityId+':'+(++s.sequence),kind,sourcePartId:p.id,targetId:playerId(target),x:at.x,y:at.y,tx:target.x,ty:target.y,angle,warning:kind==='shell'?1.4:kind==='unit'?1.2:.65,life:kind==='unit'?12:kind==='shell'?.3:3.5,fired:false,age:0,r:kind==='shell'?58:kind==='unit'?17:6,damage:kind==='shell'?22:kind==='unit'?14:10,speed:kind==='unit'?FACTORY_BALANCE.launchSpeed:230,hitIds:[]});
 p.activity='telegraph';return true;
}
function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-t*dx,y-ay-t*dy);}
function motion(s,dt){
 const boiler=part(s,'boiler'),pressureTarget=boiler.hp>0?.2+.8*boiler.hp/boiler.maxHp:0;
 const pressureRate=pressureTarget>s.pressure?.18:.8;s.pressure+=clamp(pressureTarget-s.pressure,-pressureRate*dt,pressureRate*dt);
 const left=part(s,'track-left'),right=part(s,'track-right'),tracks=Number(left.hp>0)+Number(right.hp>0),drive=tracks/2;
 const desiredSpeed=Math.cos(s.time*.12)*8*drive*s.pressure;
 s.velocity+=clamp(desiredSpeed-s.velocity,-3*drive*dt,3*drive*dt);
 if(!tracks){s.velocity=0;s.angularVelocity=0;return;}
 // Low-frequency course correction and a weak damaged-track yaw, never a charge.
 const desiredHeading=s.homeA+Math.sin(s.time*.065)*.08+(left.hp<=0?-.04:right.hp<=0?.04:0);
 const desiredTurn=clamp(delta(desiredHeading,s.a)*.18,-.012,.012)*drive*s.pressure;
 s.angularVelocity+=clamp(desiredTurn-s.angularVelocity,-.008*dt,.008*dt);
 s.a+=s.angularVelocity*dt;s.x+=Math.sin(s.a)*s.velocity*dt;s.y-=Math.cos(s.a)*s.velocity*dt;
 if(left.hp>0)left.trackDistance+=(s.velocity+s.angularVelocity*215)*dt;
 if(right.hp>0)right.trackDistance+=(s.velocity-s.angularVelocity*215)*dt;
}
function serviceCrane(s,p,dt,players){
 if(p.task){
  const target=part(s,p.task.targetPartId);if(!target?.active||target.hp<=0){p.task=null;return;}
  const wanted=Math.atan2(target.y-p.y,target.x-p.x);p.angle=turn(p.angle,wanted,dt*.5*s.pressure);p.activity='resupplying';
  if(Math.abs(delta(wanted,p.angle))>.12)return;
  p.task.remaining-=dt*s.pressure;p.task.progress=1-clamp(p.task.remaining/.9,0,1);
  if(p.task.remaining<=0){const add=Math.min(FACTORY_BALANCE.craneRefill,FACTORY_BALANCE.magazine-target.magazine);target.magazine+=add;target.manualReload=0;if(add>0){s.supplyCount++;effect(s,'supply',target);}p.task=null;p.cooldown=4.2;p.activity='idle';}
  return;
 }
 p.cooldown-=dt*s.pressure;if(p.cooldown>0||!players.length)return;
 const needy=s.parts.filter(q=>q.role==='turret'&&q.active&&q.magazine<=1).sort((a,b)=>a.magazine-b.magazine)[0];
 if(needy){p.task={kind:'resupply',targetPartId:needy.id,remaining:.9,progress:0};p.activity='resupplying';return;}
 const target=players[s.targetCursor%players.length],at=point(s,p),wanted=Math.atan2(target.y-at.y,target.x-at.x)-s.a;
 p.angle=turn(p.angle,wanted,dt*.5*s.pressure);p.activity='aiming';
 if(Math.abs(delta(wanted,p.angle))<=.14&&queue(s,p,target,'shell')){p.cooldown=6.5;s.targetCursor++;}
}
function step(s,dt,players){
 s.time+=dt;motion(s,dt);
 for(const e of s.effects)e.age+=dt;s.effects=s.effects.filter(e=>e.age<e.life);
 for(const p of s.parts){
  p.recoil=Math.max(0,p.recoil-dt*3);p.hitFlash=Math.max(0,p.hitFlash-dt);p.damageFlash=Math.max(0,p.damageFlash-dt);if(!p.active)continue;
  if(p.role==='production')p.cycle=(p.cycle+dt*s.pressure*.4)%1;
  if(p.role==='turret'&&p.magazine===0){p.manualReload+=dt*(alive(s,'boiler')?1:.7);p.activity='manual-reload';if(p.manualReload>=FACTORY_BALANCE.manualReload){p.magazine=1;p.manualReload=0;}}
  const pending=s.hazards.find(h=>!h.fired&&h.sourcePartId===p.id);
  if(pending){
   if(p.role==='turret'||p.role==='crane'){const at=point(s,p),aim=Math.atan2(pending.ty-at.y,pending.tx-at.x)-s.a;p.angle=turn(p.angle,aim,dt*(p.role==='turret'?.4+.45*s.pressure:.5*s.pressure));}p.activity='telegraph';continue;
  }
  if(p.role==='crane'){serviceCrane(s,p,dt,players);continue;}
  if(!players.length)continue;
  const target=players[s.targetCursor%players.length],at=point(s,p);
  if(p.role==='turret'){
   const wanted=Math.atan2(target.y-at.y,target.x-at.x)-s.a;p.angle=turn(p.angle,wanted,dt*(.4+.45*s.pressure)*(.65+.35*p.hp/p.maxHp));
   p.cooldown-=dt*(alive(s,'boiler')?.55+.45*s.pressure:.45);
   if(p.magazine<=0)continue;p.activity='aiming';
   if(p.cooldown<=0&&Math.abs(delta(wanted,p.angle))<=FACTORY_BALANCE.aimTolerance&&queue(s,p,target,'projectile')){p.cooldown=2.8;s.targetCursor++;}
  }else if(p.role==='production'){
   p.cooldown-=dt*s.pressure;p.activity='assembling';
   if(p.cooldown<=0&&queue(s,p,target,'unit')){p.cooldown=FACTORY_BALANCE.launchInterval;s.targetCursor++;}
  }
 }
 for(const h of s.hazards){
  if(!h.fired){
   const p=part(s,h.sourcePartId),target=players.find(t=>playerId(t)===h.targetId);
   if(!p?.active||!target){h.life=0;continue;}
   const at=h.kind==='projectile'?factoryMuzzle(s,p):point(s,p);h.x=at.x;h.y=at.y;if(h.kind==='projectile')h.angle=p.angle+s.a;h.warning-=dt;if(h.warning>0)continue;
   if(h.kind==='projectile'){
    const center=point(s,p),wanted=Math.atan2(h.ty-center.y,h.tx-center.x),aligned=Math.abs(delta(wanted,p.angle+s.a))<=FACTORY_BALANCE.aimTolerance;
    if(!aligned||p.magazine<=0){h.life=0;p.cooldown=Math.min(p.cooldown,.5);continue;}
    p.magazine--;p.recoil=1;const muzzle=factoryMuzzle(s,p);h.x=muzzle.x;h.y=muzzle.y;h.angle=muzzle.angle;effect(s,'muzzle',p,muzzle);
   }else if(h.kind==='shell'){h.x=h.tx;h.y=h.ty;p.recoil=.6;}
   else {h.angle=s.a-Math.PI/2;h.launchAngle=h.angle;s.pressure=Math.max(0,s.pressure-.055);p.cycle=0;}
   h.fired=true;p.activity='firing';
  }
  const ox=h.x,oy=h.y;h.age=(h.age||0)+dt;
  if(h.kind==='unit'&&h.age>=FACTORY_BALANCE.railClearance&&h.age<8.25)h.angle=turn(h.angle,Math.atan2(h.ty-h.y,h.tx-h.x),dt*.85);
  if(h.kind!=='shell'){const speed=h.kind==='unit'?h.speed*clamp(.45+h.age*.55,.45,1):h.speed;h.x+=Math.cos(h.angle)*speed*dt;h.y+=Math.sin(h.angle)*speed*dt;}
  for(const target of players){const id=playerId(target);if(h.hitIds.includes(id)||h.kind==='unit'&&h.age<.45)continue;
   if(segmentDistance(target.x,target.y,ox,oy,h.x,h.y)>h.r+(target.radius??16))continue;
   h.hitIds.push(id);if(s.damageEvents.length<FACTORY_LIMITS.events)s.damageEvents.push({playerId:id,damage:h.damage,x:target.x,y:target.y,source:h.sourcePartId});
   if(h.kind!=='shell'){h.life=0;break;}
  }h.life-=dt;
 }
 s.hazards=s.hazards.filter(h=>h.life>0);
}
// Host consumes damageEvents once. Guests only render the plain JSON snapshot.
export function updateBoss(s,dt,{players=[],paused=false}={}){
 if(paused||!Number.isFinite(dt)||dt<=0)return s;
 s.damageEvents=[];
 if(s.coreHp<=0){if(s.defeat)s.defeat.elapsed=Math.min(7,s.defeat.elapsed+dt);return s;}
 const live=players.filter(livePlayer);
 // At 4 FPS and above all elapsed simulation time is retained; long tab stalls
 // are bounded to .25 s to prevent hidden-tab catch-up attacks.
 let left=Math.min(dt,.25);while(left>1e-8){const d=Math.min(left,FACTORY_LIMITS.step);step(s,d,live);left-=d;}return s;
}
