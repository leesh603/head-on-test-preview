import {hasSecretWeapon,secretWeaponEffect} from './secret-weapons.js';
import {hasAceWingProfile,tickAceWingPilot,aceWingDefensiveSkill,aceWingFireProfile} from './ace-wingman-pilots.js';

const ownerId=p=>p.id||'p1';
const worldOf=p=>p.combatWorld?.()||p.world||p;
const live=e=>e&&e.hp>0&&!e.crashing&&!e.expired&&!e.dead;
const ownerLive=p=>live(p)&&p.status!=='downed'&&p.state!=='lost';
const time=p=>worldOf(p).t||0;
const activeWing=w=>w.permanent&&!w.aceWingman&&w.life>0&&!w.carrierHidden;
const hitTimers=new WeakMap();
const wakes=new WeakMap();
const clip=(n,a,b)=>Math.min(b,Math.max(a,n));
export const SECRET_COMBAT=Object.freeze({cooperDamage:70,cooperRadius:66,signalDelay:2.65,chainInterval:6,wakeDelay:.35,wakeLife:.6,ramDelay:.8,armorDelay:15,bomberInterval:10});

function cue(p,kind,origin=p,extra={}){
 const g=worldOf(p),items=g.secretWeaponFx??=[];
 items.push({kind,x:origin.x,y:origin.y,a:origin.a??p.a,ownerId:ownerId(p),at:g.t||0,...extra});
 if(items.length>32)items.shift();
}
function sound(p,kind){p.event?.('bossSound',kind);}
function emit(p,round){(worldOf(p).bullets??=[]).push({...round,enemy:false,ownerId:ownerId(p),hit:new Set()});}
const mgDamage=p=>(p.damage||1)*(p.normalGunMultiplier?.()||1)/Math.sqrt(Math.max(1,p.shots||1));
function sameTargetReady(p,e,key,delay){
 let map=hitTimers.get(p);if(!map){map=new WeakMap();hitTimers.set(p,map);}
 let state=map.get(e);if(!state){state={};map.set(e,state);}
 const now=time(p);if((state[key]??-Infinity)>now)return false;
 state[key]=now+delay;return true;
}
function direct(p,e,damage,id,point=e){
 emit(p,{x:point.x,y:point.y,vx:0,vy:0,life:.12,blast:true,pierce:true,damage,secretWeapon:id,identityDotTarget:e.stageBossBody?undefined:e});
}

export function secretCannonInterval(p){return hasSecretWeapon(p,'vickersPomPom') ? .35 : 1;}
export function secretCannonShot(p,heading){
 if(!hasSecretWeapon(p,'vickersPomPom'))return false;
 cue(p,'pom',p,{a:heading});sound(p,'secretPom');return true;
}
export function secretCannonImpact(p,b){
 if(b.secretWeapon==='vickersPomPom')cue(p,'pomImpact',b);
}
export const secretRotaryMountSide=p=>p.cow37?-8:0;
export function secretRotaryRound(p,round){
 const state=secretWeaponEffect(p,'fokkerLeimberger'),now=time(p),a=p.gunDirection?.(round.gun??0)??p.a;
 const slot=(state.rounds=(state.rounds||0)+1)%4,dx=Math.cos(a),dy=Math.sin(a),speed=Math.hypot(round.vx,round.vy),h=a+(slot-1.5)*.028;
 const side=secretRotaryMountSide(p),lane=side+(slot-1.5)*2;
 state.lastShotAt=now;state.shotHeading=a;
 if((state.soundAt??-Infinity)<=now){state.soundAt=now+.16;cue(p,'rotary',{x:p.x-dy*side,y:p.y+dx*side,a});sound(p,'secretRotary');}
 return {...round,x:p.x+dx*29-dy*lane,y:p.y+dy*29+dx*lane,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed,hit:new Set(),secretWeapon:'fokkerLeimberger'};
}
export function tickSecretRotary(p,dt,input,fire){
 if(!p.cow37||!hasSecretWeapon(p,'fokkerLeimberger')||!ownerLive(p))return;
 const s=secretWeaponEffect(p,'fokkerLeimberger'),base=p.equipmentLedger?.baseline?.weapon||{belt:24,reload:2.4},belt=Math.round(base.belt*(p.upgrades.maximBelt?1.75:1));
 const reload=Math.max(.45,base.reload*(p.equipmentReloadMultiplier?.()||1));
 s.belt=belt;s.reload=reload;s.ammo=Math.min(s.ammo??belt,belt);
 if(s.reloading>0){s.reloading=Math.max(0,s.reloading-dt);if(!s.reloading)s.ammo=belt;return;}
 if(input?.inputMode==='gamepad'&&!input.fireHeld||p.bishopTime>0||p.isBomberEntering?.()||p.pilotPrimaryAutomaticBlocked?.())return;
 s.fire=(s.fire??0)-dt;
 if(s.fire>0)return;
 s.fire+=Math.max(.045,p.rate||.15);
 for(let i=0;i<Math.min(4,s.ammo);i++){
  const heading=p.a+(i-1.5)*.028,round={gun:0,vx:Math.cos(heading)*520,vy:Math.sin(heading)*520,life:p.shotLifetime?.(520)||1.35,damage:mgDamage(p),secretIndependentGun:true};
  fire(secretRotaryRound(p,round));
 }
 const spent=Math.min(4,s.ammo);s.ammo-=spent;p.roundsFired+=spent;
 if(s.ammo<=0)s.reloading=reload;
}

export function secretVerySignal(p,point,prepare){
 if(!point||!hasSecretWeapon(p,'sn1650'))return;
 const state=secretWeaponEffect(p,'sn1650');
 state.count=(state.count||0)+1;
 if(state.count<3)return;
 state.count=0;
 const {x,y}=point,g=worldOf(p),duration=SECRET_COMBAT.signalDelay,dx=Math.cos(p.a),dy=Math.sin(p.a);
 const b=prepare(p,{x,y,sx:x-dx*520,sy:y-dy*520,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius*3,damage:(p.payloadPower?.(SECRET_COMBAT.cooperDamage)??SECRET_COMBAT.cooperDamage)*20,sprite:'puw',secretWeapon:'sn1650',releaseAngle:p.a,pilotSupport:true});
 (g.friendlyBombs??=[]).push(b);state.activeUntil=time(p)+duration;
 cue(p,'heavyApproach',point,{life:duration});sound(p,'secretHeavyApproach');
}
export function secretBombImpact(p,b){
 if(b.secretWeapon==='sn1650'){
  const water=[1,7,16,17].includes(worldOf(p).worldRegion?.());
  cue(p,'heavyImpact',b,{radius:p.explosionRadius?.(b.radius)??b.radius,life:1.65,water});sound(p,'secretHeavyImpact');
  const g=worldOf(p);g.shake=Math.max(g.shake||0,9);
 }else if(b.secretWeapon==='explosiveArmor'){cue(p,'armorImpact',b);sound(p,'secretArmorImpact');}
}
export function secretCooperRelease(p,b){
 if(!hasSecretWeapon(p,'fliegerpfeil'))return;
 const state=secretWeaponEffect(p,'fliegerpfeil');state.count=(state.count||0)+1;
 if(state.count<3)return;
 state.count=0;const x=b.x+(b.vx||0)*b.life,y=b.y+(b.vy||0)*b.life;
 state.rain={x,y,a:p.a,next:time(p)+.22,index:0};sound(p,'secretSteelRain');
 state.activeUntil=time(p)+.72;
 cue(p,'steelRain',state.rain,{life:.72});
}
function tickSteelRain(p,state,f){
 const r=state.rain,now=time(p);if(!r||now<r.next)return;
 const c=Math.cos(r.a),s=Math.sin(r.a),group=state.rainGroup??={attempts:new Set(),explosions:3,explodedTargets:new Set()};
 const gun=1+Math.max(0,p.gunUpgradeBonus||0),u=p.upgrades;
 while(r.index<24&&r.next<=now){
  for(let n=0;n<6;n++){
   const i=r.index++,lane=((i%8)-3.5)*16,front=-26+Math.floor(i/8)*32,x=r.x+c*front-s*lane,y=r.y+s*front+c*lane;
   emit(p,{x,y,previousX:x,previousY:y,vx:c*480,vy:s*480,life:.20,damage:(f.minDamage+(f.maxDamage-f.minDamage)*(i%3)/2)*gun,pierce:true,flechette:true,sweptProjectile:true,collisionRadius:f.collisionRadius,heavyTargetMultiplier:f.heavyMultiplier,synthesisPayloadDart:true,synthesisGroup:group,synthesisPayload:{incendiary:!!u.buckinghamBelt,explosive:!!u.amatolCharge,burnScale:gun},secretWeapon:'fliegerpfeil'});
  }
  r.next+=.07;
 }
 if(r.index===24){delete state.rain;delete state.rainGroup;}
}
export function secretGasProfile(p,b,radius,life){
 if(!b.synthesisPayload?.gas||!hasSecretWeapon(p,'grunkreuzBarrage'))return {radius,life,enhanced:false};
 const size=radius*Math.sqrt(1.5),duration=Math.max(5,life),state=secretWeaponEffect(p,'grunkreuzBarrage');
 state.activeUntil=time(p)+duration;state.duration=duration;
 cue(p,'gasBarrage',b,{radius:size,life:duration});sound(p,'secretGas');
 return {radius:size,life:duration,enhanced:true};
}
export function secretGrapnelContact(p,target,round,targets,point){
 if(round.secretWeapon||!hasSecretWeapon(p,'farnboroughFirechain'))return;
 const state=secretWeaponEffect(p,'farnboroughFirechain'),now=time(p);if(state.readyAt>now)return;
 const nearby=targets.filter(e=>e!==target&&live(e)&&p.canHitTarget?.(e)!==false&&Math.hypot(e.x-point.x,e.y-point.y)<=145).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,2);
 if(!nearby.length)return;
 state.readyAt=now+SECRET_COMBAT.chainInterval;state.activeUntil=now+1.4;
 for(const e of nearby){
  const a=Math.atan2(e.y-point.y,e.x-point.x),speed=980;
  emit(p,{x:point.x,y:point.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.18,damage:round.damage,collisionRadius:8,sweptProjectile:true,fieryGrapnel:true,secretWeapon:'farnboroughFirechain'});
 }
 cue(p,'firechain',point,{links:nearby.map(e=>({x:e.x,y:e.y,id:e.id??e.tailId})),life:1.4});sound(p,'secretChain');
}
function tickWake(p,dt,previous){
 const speed=(p.equipmentCruiseSpeed||p.baseSpeed||p.speed||0)*(p.airframeSpeed??1);
 if((p.equipmentStraight||0)<.99||speed<(p.baseSpeed||p.speed||1)*1.08)return;
 const g=worldOf(p),state=secretWeaponEffect(p,'badinBreakthrough'),now=time(p),x=previous?.x??p.x,y=previous?.y??p.y;
 let trail=wakes.get(p);if(!trail){trail=[];wakes.set(p,trail);}
 trail.push({x,y,nx:p.x,ny:p.y,at:now});
 while(trail.length&&(now-trail[0].at>SECRET_COMBAT.wakeLife||trail.length>32))trail.shift();
 const width=(p.playerCollisionRadius??20)*2.5;
 for(const e of g.enemies||[]){
  if(!live(e)||e.surface||e.stationary||e.stageBossBody||Math.hypot(e.x-p.x,e.y-p.y)>speed*.65+width)continue;
  if(!trail.some(s=>{
   const dx=s.nx-s.x,dy=s.ny-s.y,k=clip(((e.x-s.x)*dx+(e.y-s.y)*dy)/(dx*dx+dy*dy||1),0,1);
   return Math.hypot(e.x-s.x-k*dx,e.y-s.y-k*dy)<=width/2;
  })||!sameTargetReady(p,e,'wake',SECRET_COMBAT.wakeDelay))continue;
  direct(p,e,mgDamage(p)*2,'badinBreakthrough');
  if(e.formationLeader)g.breakEnemyFormation?.(e,1.2);
  else if(!e.bossPilot&&!e.bossMinion)e.a+=.16*Math.sign(Math.sin((e.a||0)-p.a)||1);
  cue(p,'wake',e,{life:.6});
 }
 if(!(state.soundAt>now)){state.soundAt=now+.6;cue(p,'breakthrough',p,{life:.4});sound(p,'secretWake');}
}
export function secretRam(p,target,damage){
 if(!hasSecretWeapon(p,'nesterovRam')||!live(target)||target.surface||target.stationary)return damage;
 const speed=secretRamSpeed(p);
 if(speed<0||!sameTargetReady(p,target,'ram',SECRET_COMBAT.ramDelay))return damage;
 direct(p,target,mgDamage(p)*(8+8*speed),'nesterovRam');
 cue(p,'ram',target,{a:p.a});sound(p,'secretRam');return damage*.3;
}
export function secretRamSpeed(p){
 const max=p.equipmentCruiseSpeed||p.baseSpeed||p.speed||1,speed=max*(p.airframeSpeed??1),min=(p.baseSpeed||p.speed||1)*.86;
 if(speed<min||p.invuln>0||p.isBomberEntering?.())return -1;
 return clip((speed-min)/Math.max(1,max-min),0,1);
}
export function secretArmorHit(p,before,prepare){
 if(!(before>p.hp)||!ownerLive(p)||!hasSecretWeapon(p,'explosiveArmor'))return;
 const s=secretWeaponEffect(p,'explosiveArmor'),now=time(p);if(s.readyAt>now)return;
 s.readyAt=now+SECRET_COMBAT.armorDelay;
 const g=worldOf(p),damage=(p.payloadPower?.(SECRET_COMBAT.cooperDamage)??SECRET_COMBAT.cooperDamage)*.5;
 for(let i=0;i<6;i++){
  const a=p.a+i*Math.PI/3,duration=.40+i*.07,x=p.x+Math.cos(a)*76,y=p.y+Math.sin(a)*76;
  (g.friendlyBombs??=[]).push(prepare(p,{x,y,sx:p.x,sy:p.y,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius*.6,damage,secretWeapon:'explosiveArmor',sprite:'cooper',releaseAngle:a}));
 }
 cue(p,'armorLaunch');sound(p,'secretArmor');
}
export function tickSecretWeapons(p,dt,previous,flechette){
 if(!p.secretWeaponState)return;
 if(!ownerLive(p)){clearSecretWeaponTransient(p);return;}
 const g=worldOf(p),items=g.secretWeaponFx;
 if(items?.length&&time(p)-items[0].at>6)g.secretWeaponFx=items.filter(v=>time(p)-v.at<6);
 if(hasSecretWeapon(p,'fliegerpfeil'))tickSteelRain(p,secretWeaponEffect(p,'fliegerpfeil'),flechette);
 if(hasSecretWeapon(p,'badinBreakthrough'))tickWake(p,dt,previous);
}
export function clearSecretWeaponTransient(p,stage=false){
 const state=p.secretWeaponState;
 if(!state)return;
 const rain=state.effects.fliegerpfeil;
 if(rain){delete rain.rain;delete rain.rainGroup;delete rain.activeUntil;}
 wakes.delete(p);
 if(stage){
  const heavy=state.effects.sn1650,gas=state.effects.grunkreuzBarrage;
  if(heavy)delete heavy.activeUntil;
  if(gas)delete gas.activeUntil;
  for(const wing of worldOf(p).allies||[])if(wing.ownerId===ownerId(p))delete wing.secretBombSecond;
 }
}

export function secretWingState(p,wing,dt,acePool){
 if(!activeWing(wing))return;
 if(!hasSecretWeapon(p,'eliteAirWing')){if(wing.secretAce){delete wing.acePilot;delete wing.secretAce;delete wing._netAcePilotState;}return;}
 if(!wing.secretAce){
  const world=worldOf(p),own=(world.allies||[]).filter(a=>a.ownerId===ownerId(p)&&a!==wing&&a.life>0);
  const used=new Set([...(world.players||[p]).map(q=>q.pilot),p.aceWingmanPilotId,...own.map(a=>a.acePilot)]);
  const pilot=acePool().find(id=>hasAceWingProfile(id)&&!used.has(id));if(!pilot)return;
  wing.acePilot=pilot;wing.secretAce=true;
 }
 tickAceWingPilot(wing,dt,Math.max(8,Math.min(14,(wing.secretAceCooldown||15)*.65)));
 const state=wing._netAcePilotState;
 if(state.clock===dt){
  state.readyAt=Number.isFinite(wing.secretAceReady)?wing.secretAceReady:state.readyAt+Math.max(0,wing.slot||0)*.9;
 }
 const before=state.readyAt;
 aceWingDefensiveSkill(wing,wing.engagementTarget);
 if(state.readyAt!==before){cue(p,'wingSkill',wing,{mode:state.mode});sound(p,'secretWingSkill');}
 wing.secretAceReady=Math.max(0,state.readyAt-state.clock);
}
export function updateSecretWing(p,wing,dt,pilots,planes,prepare){
 if(!activeWing(wing))return;
 const faction=planes[p.plane]?.faction;
 secretWingState(p,wing,dt,()=>Object.keys(pilots).filter(id=>pilots[id].faction===faction));
 secretBomberWing(p,wing,()=>{
  let best=null,distance=430;
  for(const target of worldOf(p).enemies||[]){
   if(!live(target)||p.canHitTarget?.(target)===false)continue;
   const d=Math.hypot(target.x-wing.x,target.y-wing.y);if(d<distance){distance=d;best=target;}
  }
  return best;
 },prepare);
}
export function secretWingGun(p,wing,target,heading,damage,prepare){
 if(!wing.secretAce||!wing._netAcePilotState)return null;
 const state=wing._netAcePilotState,previous=state.readyAt;
 const profile=aceWingFireProfile(worldOf(p),p,wing,target,Math.hypot(target.x-wing.x,target.y-wing.y));
 if(state.readyAt!==previous){cue(p,'wingSkill',wing,{mode:state.mode});sound(p,'secretWingSkill');}
 const emitWing=(offset,power,rocket=false)=>{
  const a=heading+offset,speed=rocket?350:470;
  emit(p,{x:wing.x+Math.cos(a)*23,y:wing.y+Math.sin(a)*23,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.45,damage:damage*power,ally:true,rocket,pierce:!!profile.pierce,synthesisPayload:profile.ignite?{incendiary:true}:undefined,secretWeapon:'eliteAirWing'});
 };
 for(const offset of profile.volley)emitWing(offset,profile.airburst?1.7:.58,profile.airburst);
 if(profile.cannon)emitWing(0,1.75);
 if(profile.bomb&&prepare)dropWingBomb(p,wing,target.x,target.y,prepare,'eliteAirWing');
 return profile;
}
export function secretBomberWing(p,wing,targetFor,prepare){
 if(!activeWing(wing))return;
 if(!hasSecretWeapon(p,'longRangeBombers')){delete wing.secretBomber;delete wing.secretBombReadyAt;delete wing.secretBombSecond;return;}
 const g=worldOf(p),now=time(p);
 wing.secretBomber=true;wing.secretBombReadyAt??=now+1.5+Math.max(0,wing.slot||0)*.9;
 if(wing.secretBombSecond){
  const second=wing.secretBombSecond;if(now<second.at)return;
  delete wing.secretBombSecond;dropWingBomb(p,wing,second.x,second.y,prepare);return;
 }
 if(wing.secretBombReadyAt>now)return;
 const target=targetFor();if(!live(target)||Math.hypot(target.x-wing.x,target.y-wing.y)>430)return;
 const x=target.x,y=target.y;
 const bomb=dropWingBomb(p,wing,x,y,prepare);secretCooperRelease(p,bomb);
 wing.secretBombSecond={x:x-Math.sin(wing.a)*22,y:y+Math.cos(wing.a)*22,at:now+.30};
 wing.secretBombReadyAt=now+SECRET_COMBAT.bomberInterval;
 cue(p,'bomberRelease',wing);sound(p,'secretBomber');
}
function dropWingBomb(p,wing,x,y,prepare,id='longRangeBombers'){
 const g=worldOf(p),duration=.7,damage=p.payloadPower?.(SECRET_COMBAT.cooperDamage)??SECRET_COMBAT.cooperDamage;
 const bomb=prepare(p,{x,y,sx:wing.x,sy:wing.y,life:duration,maxLife:duration,radius:SECRET_COMBAT.cooperRadius,damage,secretWeapon:id,sprite:'cooper',pilotSupport:true,releaseAngle:wing.a});
 (g.friendlyBombs??=[]).push(bomb);
 return bomb;
}
