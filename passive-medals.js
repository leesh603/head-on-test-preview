// Passive medal effects observe the final authored hooks shared by Game/PlayerState.
// Equipment ownership is the gate, so replay/removal cannot leave a permanent buff.
import {combatImpactResult} from './combat-impact-result.js';
import {pilotHeadOn} from './pilot-identities.js';
import {isFiveAceAirship} from './pilot-five-combat.js';
import {signatureCue} from './pilot-signature-state.js';
import {navarreOutnumbered} from './navarre-frommherz-combat.js';
const states=new WeakMap(),shotContacts=new WeakMap(),impactDetails=new WeakMap(),roundTargets=new WeakMap();
const world=p=>p.combatWorld?.()||p.world||p,owner=p=>p.id??'p1';
const now=p=>world(p).t||0;
const alive=e=>e&&e.hp>0&&!e.dead&&!e.destroyed&&!e.crashed&&!e.expired&&!e.rivalEscaped;
const enabled=p=>!!p.upgrades?.passiveMedal&&p.state==='playing'&&p.hp>0&&p.status!=='downed'&&!p.mission?.unarmed;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const body=e=>e.stageBossBody||(e.finalArenaTarget?`arena:${e.finalArenaBossId}:${e.finalArenaFormToken}`:e);
const boss=e=>e.stageBossBody||e.finalArenaTarget||e.bossPilot||e.heavyBomber||['boss','zeppelin'].includes(e.type);
const ordinary=e=>alive(e)&&!boss(e)&&!e.surface&&!e.fieldUnit&&!e.stationary;
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId??'p1')===owner(p)&&!['enemy','ally','patrol','formation','transferGun','rocket','motorCannon','cow37','mauserRound','actualExplosion','blast','identityDot','identityChain','tacticalRound','passiveMedalSecondary'].some(k=>b[k]);
const friendly=(p,b)=>b&&!b.enemy&&(b.ownerId??'p1')===owner(p)&&!!b.ally&&!b.patrol;
function state(p){let s=states.get(p);if(!s||now(p)<s.at){s={at:now(p),cooldowns:{},targets:new Map(),contacts:0,counts:{},charges:0};states.set(p,s);}s.at=now(p);return s;}
const ready=(p,s,key,seconds)=>{if(now(p)<(s.cooldowns[key]??-Infinity))return false;s.cooldowns[key]=now(p)+seconds;return true;};
const wings=p=>(world(p).allies||[]).filter(a=>(a.ownerId??'p1')===owner(p)&&a.life>0&&!a.aceWingman&&!a.weaponModFormation);
function ammo(p,fraction,gun){if(p.reloadTime>0||p.unlimitedAmmo)return;for(let i=0;i<p.ammo.length;i++)if(gun===undefined||gun===i)p.ammo[i]=Math.min(p.weapon.belt,p.ammo[i]+Math.ceil(p.weapon.belt*fraction));}
function jam(p,e,seconds){if(!ordinary(e))return false;e.fire=Math.max(e.fire||0,seconds);e.burstLeft=0;e.burstDelay=Math.max(e.burstDelay||0,seconds);return true;}
function charge(p,s,n,seconds=2,target=null,power=1){s.charges=n;s.chargeUntil=now(p)+seconds;s.chargeTarget=target;s.chargePower=power;}
function cue(p,e=p,kind='hit'){
 // Authored raster frames retain the pilot's existing overrides and silhouettes.
 const keys={baron:'muzzle',fonck:'armorSpark',voss:'gunSmoke',boelcke:'muzzleTwin',collishaw:'gunSmoke',baracca:'armorSpark',guynemer:'fireFlash',bishop:'muzzleHeavy',goering:'muzzleTwin',immelmann:'muzzle',mannock:'gunSmoke',huffzky:'muzzleRear',mckeever:'muzzleRear',wolff:'armorSpark',loewenhardt:'muzzleTwin',mccudden:'gunSmoke',nungesser:'armorSpark',jacobs:'armorSpark',hawker:'muzzle',berthold:'metalShard0',brumowski:'armorSpark',rickenbacker:'spark',ball:'gunSmoke',barker:'metalShard0',gontermann:'fireEngine',luke:'fireFlash',sachsenberg:'gunSmoke',lothar:'muzzleTwin',proctor:'gunSmoke',schleich:'ricochet',lufbery:'muzzleTwin',navarre:'armorSpark',frommherz:'muzzleTwin'};
 if(p.pilot==='udet'){signatureCue(p,'udetGraze',{x:e.x,y:e.y,a:p.a,life:.48,count:3});for(const side of [-1,1])signatureCue(p,'udetBrass',{x:p.x+Math.cos(p.a)*18-Math.sin(p.a)*side*8,y:p.y+Math.sin(p.a)*18+Math.cos(p.a)*side*8,a:p.a,side,life:.4});}
 else p.identityFx?.(keys[p.pilot]||'armorSpark',e.x,e.y,e.a??p.a,['guynemer','luke'].includes(p.pilot)?56:32,.32,{height:kind==='cover'?28:20,alpha:.85,passiveMedal:true});
 if(['boelcke','collishaw','goering','mannock','brumowski','lufbery','frommherz'].includes(p.pilot))for(const a of wings(p).slice(0,2))p.identityFx?.('muzzleTwin',a.x,a.y,a.a,26,.18,{height:12,passiveMedal:true});
 sCount(p);
}
function sCount(p){const s=state(p);s.activations=(s.activations||0)+1;}
export function passiveMedalStatus(p){const s=states.get(p);return {activations:s?.activations||0,charges:enabled(p)&&s?.chargeUntil>now(p)?s.charges:0};}
function hits(s,key,e,t,gap=1.2){let c=s.counts[key];if(!c||c.target!==body(e)||t-c.at>gap)c=s.counts[key]={target:body(e),n:0,at:t};if(t-(c.counted??-Infinity)>=.075){c.n++;c.counted=t;}c.at=t;return c.n;}
function burn(p,e,target,pos,seconds,fraction){if(!alive(target))return;const map=p.identityState().burns;if(map.has(target))return;map.set(target,{enemy:e,target,position:{x:pos.x,y:pos.y},time:seconds,tick:0,damage:p.damage*fraction,part:!!e.stageBossBody&&target!==e.stageBossBody,body:e.stageBossBody,passiveMedal:true});}
export function installPassiveMedals(Game){
 const q=Game.prototype;
 q.resetPassiveMedal=function(){states.delete(this);};
 // Called from actual near-miss/second-penetration/upgrade success branches.
 q.passiveMedalEvent=function(kind,data={}){
  if(!(kind==='engineering'&&this.upgrades?.passiveMedal&&this.hp>0)&&!enabled(this))return;const s=state(this);
  if(kind==='graze'&&this.pilot==='udet'&&this.udetAcrobat?.stacks>=3&&ready(this,s,kind,3)){
   this.evadeCooldown=Math.max(0,this.evadeCooldown-1.5);charge(this,s,1);cue(this);
  }
  if(kind==='penetration'&&this.pilot==='navarre'&&ready(this,s,kind,4)){
   this.evadeCooldown=Math.max(0,this.evadeCooldown-1);s.navTurn=now(this)+2;cue(this,data.target);
  }
  if(kind==='engineering'&&this.pilot==='mccudden'&&s.engineeringDraft!==data.serial){
   s.engineeringDraft=data.serial;this.hp=Math.min(this.maxHp,this.hp+this.maxHp*.05);this.reloadTime*=.7;cue(this);
  }
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){
  const s=enabled(this)?state(this):null,oldEagle=this.eagleTime||0,oldCannon=this.passiveCannonTimer,oldPetals=this.wolffStacks||0,oldHeading=s?.heading??this.a;
  const start=this.bullets?.length||0,result=begin.call(this,dt,input);
  if(!enabled(this)){states.delete(this);return result;}
  const r=state(this),t=now(this);r.framePetals=Math.max(oldPetals,this.wolffStacks||0);r.heading=this.a;
  if(this.pilot==='guynemer'&&oldCannon!==this.passiveCannonTimer)for(const b of this.bullets.slice(start))if(b.motorCannon&&b.pierce&&b.collisionRadius===18&&!b.enemy&&(b.ownerId??'p1')===owner(this))b.passiveMedalCannon=true;
  if(this.pilot==='immelmann'&&oldEagle<=dt&&this.eagleTime>dt&&!this.immelmannTurn&&!(this.skillTime>0))r.eagleReady=t+1.5;
  if(this.pilot==='baron'&&this.isRedHunter?.()){
   r.redTurn=(r.redTurn||0)+Math.abs(wrap(this.a-oldHeading));if(r.redTurn>=Math.PI/2){r.redTurn=0;r.redEntry=t+2;}
  }
  if(this.pilot==='baron'&&r.prey&&body(r.prey).hp<=0&&this.huntBoost>0){if(ready(this,r,'huntKill',1)){this.huntBoost=Math.min(6,this.huntBoost+2);cue(this,r.prey);}r.prey=null;}
  if(r.fireUntil>t)this.rate/=this.pilot==='rickenbacker'?1.3:1.25;
  if(r.exitUntil>t){this.speed*=1.2;this.baseSpeed*=1.2;}
  if(r.wolffTurn>t)this.turn*=1.35;
  if(r.navTurn>t)this.turn*=1.3;
  if(r.redReload>t&&this.reloadTime>0)this.reloadTime=Math.max(0,this.reloadTime-dt*.5);
  if(r.escapeUntil>t){const yaw=Math.abs(wrap(this.a-oldHeading))/Math.max(.001,dt);if(yaw<.35){this.speed*=1.25;this.baseSpeed*=1.25;}}
  if(r.designated&&(!alive(r.designated)||r.designatedUntil<=t))r.designated=null;
  return result;
 };
 const evade=q.evade;q.evade=function(...args){const used=evade.apply(this,args);if(used&&enabled(this)&&this.pilot==='immelmann')state(this).eagleReady=now(this)+1.5;
 if(used&&enabled(this)&&this.pilot==='voss'){
  const s=state(this),near=(world(this).enemies||[]).filter(e=>alive(e)&&distance(e,this)<400).length;
  if(near>=3&&ready(this,s,'pressureEvade',6)){this.evadeCooldown=Math.max(0,this.evadeCooldown-2);s.fireUntil=now(this)+1.5;cue(this);}
 }return used;};
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){const result=apply.call(this,b,...args),shot=result||b;
  if(!enabled(this)||!personal(this,shot))return result;const s=state(this),t=now(this);
  if(this.pilot==='fonck'&&!shot.fiveAceRound&&this.pilotIdentity?.focus>=.8&&alive(this.pilotIdentity.target)&&ready(this,s,'focus',4)){
   charge(this,s,1,1.5,body(this.pilotIdentity.target),1.2);cue(this,this.pilotIdentity.target);
  }
  if(s.charges>0&&s.chargeUntil>t){s.charges--;shot.passiveMedalShot={target:s.chargeTarget,power:s.chargePower||1,until:s.chargeUntil,pierceWas:!!shot.pierce};shot.pierce=true;}
  if(this.pilot==='jacobs'&&this.pilotSignatureState?.jacobsAngle?.boostUntil>this.pilotSignatureState.clock)roundTargets.set(shot,s.angleTarget);
  if(this.pilot==='navarre'&&navarreOutnumbered(this))shot.passiveMedalOutnumbered=true;
  return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){let result=damage.call(this,b,e);if(!enabled(this))return result;const s=state(this),m=b.passiveMedalShot;
  if(personal(this,b)&&m&&m.until>now(this)&&(!m.target||m.target===body(e)))result*=m.power;
  if(personal(this,b)&&roundTargets.has(b)&&roundTargets.get(b)===body(e)&&s.angleUntil>now(this))result*=1.2;
  if(friendly(this,b)&&this.pilot==='boelcke'&&s.designated===e&&s.designatedUntil>now(this)&&!s.wingHit)result*=1.35;
  return result;
 };
 const identity=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){const prior={prepared:this.pilotIdentity?.five?.hits||0,proctor:this.pilotIdentity?.five?.proctorSeen?.get(e),lothar:this.lotharPursuit?.turnUntil||0};const result=identity.call(this,b,e,target,pos);let records=impactDetails.get(b);if(!records){records=new WeakMap();impactDetails.set(b,records);}records.set(this,{enemy:e,target,pos,prior});return result;};
 const special=q.specialRoundImpact;q.specialRoundImpact=function(b,e,...args){
  const before={prepared:this.pilotIdentity?.five?.hits||0,proctor:this.pilotIdentity?.five?.proctorSeen?.get(e),nungesser:this.pilotSignatureState?.nungesser?.boostUntil||0,angle:this.pilotSignatureState?.jacobsAngle?.count||0,lothar:this.lotharPursuit?.turnUntil||0};
  const result=special.call(this,b,e,...args);
  const hit=combatImpactResult(b,e);if(!enabled(this)||!(hit?.damage>0)||hit.blocked||(b.ownerId??'p1')!==owner(this)||b.passiveMedalSecondary)return result;
  let seen=shotContacts.get(b);if(!seen){seen=new WeakSet();shotContacts.set(b,seen);}if(seen.has(e))return result;seen.add(e);
  const s=state(this),t=now(this),detail=impactDetails.get(b)?.get(this),target=detail?.enemy===e?detail.target:e,pos=detail?.enemy===e?detail.pos:e;
  if(detail?.enemy===e)Object.assign(before,detail.prior);
  if(b.passiveMedalCannon&&!s.cannonSeen?.has(b)){
   s.cannonSeen??=new WeakSet();s.cannonSeen.add(b);this.queueExplosionDamage(e.x,e.y,60,this.payloadPower(27),{secondaryExplosion:true,passiveMedalSecondary:true,fxSource:'motorCannon'});this.combatBlast?.(e.x,e.y,60,'friendly','blast','ammoCookoff');cue(this,e);return result;
  }
  if(friendly(this,b)){
   if(this.pilot==='boelcke'&&s.designated===e&&s.designatedUntil>t&&!s.wingHit){s.wingHit=true;cue(this,e);}
   if(this.pilot==='collishaw'){
    if(s.wingTarget&&s.wingTarget!==e&&t-s.wingAt<=1&&ready(this,s,'distributed',5)){jam(this,s.wingTarget,.6);jam(this,e,.6);cue(this,e);}
    s.wingTarget=e;s.wingAt=t;
   }
   const pursuit=Math.abs(wrap(Math.atan2(this.y-e.y,this.x-e.x)-(e.a||0)))<.7;
   if(this.pilot==='goering'&&pursuit&&distance(this,e)<550&&ready(this,s,'whiteCover',5)){jam(this,e,.7);const a=wings(this).find(a=>a.permanent);if(a)a.fire=Math.min(a.fire,.1);cue(this,e);}
   if(this.pilot==='mannock'&&this.mannockCoverTarget(e)&&ready(this,s,'cover',5)){jam(this,e,.6);s.coverUntil=t+2;s.coverTarget=this.mannockCoverTarget(e);cue(this,e,'cover');}
   if(this.pilot==='lufbery'&&b.fiveLafayetteRound&&Math.abs(wrap(Math.atan2(e.y-this.y,e.x-this.x)-this.a))>Math.PI*.6&&pursuit&&ready(this,s,'rearCover',4)){
    jam(this,e,.8);for(const a of wings(this))if(a.slot===this.fiveLafayetteSlot)a.invuln=Math.max(a.invuln||0,1);cue(this,e);
   }
   if(this.pilot==='frommherz'&&s.instructor===e&&s.instructorUntil>t&&ready(this,s,'instructor',4)){charge(this,s,2,2,body(e),1.35);for(const a of wings(this))if(distance(a,this)<400)a.fire=Math.min(a.fire,.12);cue(this,e);}
   return result;
  }
  if(!personal(this,b))return result;
  // Target-specific charge pierces only its designated victim, not a free global buff.
  if(b.passiveMedalShot?.target&&b.passiveMedalShot.target!==body(e)&&!b.passiveMedalShot.pierceWas)b.pierce=false;
  switch(this.pilot){
   case 'baron':if(this.isRedHunter?.()){if(s.redEntry>t&&ready(this,s,'redEntry',5)){s.redReload=t+2;cue(this,e);}}else if(this.huntTarget===e&&this.huntTier()>=3)s.prey=e;break;
   case 'boelcke':{const o=b.identityOrigin||this,flank=Math.abs(wrap(Math.atan2(o.y-e.y,o.x-e.x)-(e.a||0)))>=Math.PI/3;if(flank&&ready(this,s,'dicta',4)){s.designated=e;s.designatedUntil=t+3;s.wingHit=false;this.passiveMedalCommand={target:e,until:t+3};cue(this,e);}break;}
   case 'baracca':if(pilotHeadOn(b.identityOrigin||this,e)&&ready(this,s,'headon',5)){s.frontUntil=t+2;charge(this,s,1);cue(this,e);}break;
   case 'bishop':if(distance(b.identityOrigin||this,e)<180&&hits(s,'close',e,t)>=3&&ready(this,s,'close',4)){jam(this,e,.5);ammo(this,.05);cue(this,e);}break;
   case 'immelmann':if(s.eagleReady>t&&ready(this,s,'eagle',4)){s.eagleReady=0;this.evadeCooldown=Math.max(0,this.evadeCooldown-1);ammo(this,.05);cue(this,e);}break;
   case 'huffzky':if(b.pilotRear&&hits(s,'rear',e,t)>=3&&ready(this,s,'rear',4)){jam(this,e,.65);if(ordinary(e))e.pilotSuppressedUntil=Math.max(e.pilotSuppressedUntil||0,t+1.2);cue(this,e);}break;
   case 'mckeever':{const lane=b.gun===1||b.pilotRear?'rear':'front',other=s[lane==='rear'?'front':'rear'];s[lane]={target:e,at:t};if(other&&other.target!==e&&t-other.at<=1&&ready(this,s,'crossfire',4)){jam(this,lane==='rear'?e:other.target,.6);ammo(this,.08,1);cue(this,e);}break;}
   case 'loewenhardt':{const d=distance(this,e),a=Math.abs(wrap(Math.atan2(e.y-this.y,e.x-this.x)-this.a));if(!e.surface&&d<=420&&a<Math.PI/3&&hits(s,'frontal',e,t)>=3&&ready(this,s,'frontal',5)){charge(this,s,2);cue(this,e);}break;}
   case 'nungesser':{const n=this.pilotSignatureState?.nungesser;if(n?.boostUntil>before.nungesser){n.boostUntil+=1;charge(this,s,1,3);cue(this,e);}break;}
   case 'jacobs':if((this.pilotSignatureState?.jacobsAngle?.count||0)>before.angle){s.angleTarget=body(e);s.angleUntil=t+1.2;charge(this,s,1,1.2,body(e));cue(this,e);}break;
   case 'hawker':if(this.hawkerNext===e&&this.hawkerLinkTime>0&&ready(this,s,'link',3)){ammo(this,.08);charge(this,s,1);cue(this,e);}break;
   case 'brumowski':if(wings(this).filter(a=>distance(a,this)<180).length>=2&&ready(this,s,'skullCover',6)){s.coverUntil=t+2;cue(this,e,'cover');}break;
   case 'rickenbacker':{const near=(world(this).enemies||[]).filter(e=>alive(e)&&!e.surface&&distance(e,this)<700).length;if(near>=3&&s.lastTarget&&s.lastTarget!==e&&t-s.lastTargetAt<2&&ready(this,s,'switch',4)){s.fireUntil=t+1.5;ammo(this,.05);cue(this,e);}s.lastTarget=e;s.lastTargetAt=t;break;}
   case 'ball':{const alone=this.ballAlone??this.pilotIdentity?.alone;if(alone&&Math.abs(wrap(Math.atan2(this.y-e.y,this.x-e.x)-(e.a||0)))>Math.PI*.72&&ready(this,s,'lone',5)){s.exitUntil=t+2;s.guardUntil=t+2;cue(this);}break;}
   case 'gontermann':if(!b.fiveAceRound&&before.prepared>=3&&this.pilotIdentity?.five?.prepared===target&&alive(target)){const last=s.targets.get(body(e))??-Infinity;if(t-last>=5){if(s.targets.size>=32)s.targets.delete(s.targets.keys().next().value);s.targets.set(body(e),t);burn(this,e,target,pos,2,.12);cue(this,e);}}break;
   case 'luke':if(isFiveAceAirship(e)&&hits(s,'airship',target,t,1.5)>=6){const last=s.targets.get(body(e))??-Infinity;if(t-last>=6){if(s.targets.size>=32)s.targets.delete(s.targets.keys().next().value);s.targets.set(body(e),t);burn(this,e,target,pos,3,.15);cue(this,e);}}break;
   case 'lothar':if((this.lotharPursuit?.turnUntil||0)>before.lothar){charge(this,s,2,1.5,body(e),1.3);cue(this,e);}break;
   case 'proctor':if(this.pilotIdentity?.five?.proctorSeen?.get(e)!==before.proctor&&ordinary(e)){jam(this,e,.4);const other=(world(this).enemies||[]).find(v=>v!==e&&ordinary(v)&&distance(v,e)<180);if(other)jam(this,other,.4);cue(this,e);}break;
   case 'frommherz':s.instructor=e;s.instructorUntil=t+2;break;
  }
  return result;
 };
 const received=q.buildReceivedDamage;q.buildReceivedDamage=function(before,...args){const result=received.call(this,before,...args);
  if(!enabled(this)){if(this.hp<=0||this.status==='downed')states.delete(this);return result;}if(!(before>this.hp))return result;const s=state(this),t=now(this),taken=before-this.hp,source=this.damageSource,bullet=source?.bullet;
  if(this.pilot==='berthold'&&taken>=this.maxHp*.09&&ready(this,s,'iron',6)){charge(this,s,2,3,null,1.5);cue(this);}
  if(this.pilot==='barker'&&this.barkerStacks>=3&&ready(this,s,'lastBelt',12)){ammo(this,.15);s.barkerGuard=t+2;cue(this);}
  if(this.pilot==='wolff'&&s.framePetals>=6&&ready(this,s,'petals',12)){this.wolffStacks=Math.min(6,(this.wolffStacks||0)+1);this.wolffSafeTime=this.wolffStacks*3;s.wolffTurn=t+1.5;cue(this);}
  if(this.pilot==='sachsenberg'&&ready(this,s,'escape',8)){s.escapeUntil=t+2;cue(this);}
  const front=source&&Math.abs(wrap(Math.atan2((source.sourceY??source.y)-this.y,(source.sourceX??source.x)-this.x)-this.a))<Math.PI/2;
  if(this.pilot==='schleich'&&front&&bullet&&!['heavy','flak','rocket','bomb','fieldShell','actualExplosion','blast','shell','raidHeavy','signatureAttack','navalShell','hostileRocket'].some(k=>bullet[k])&&ready(this,s,'armoredCounter',7)){charge(this,s,1,2,null,1.6);s.frontUntil=t+1.5;cue(this);}
  return result;
 };
 const incoming=q.incomingDamageMultiplier;q.incomingDamageMultiplier=function(source){let result=incoming.call(this,source),t=now(this);
  for(const p of world(this).players||[])if(p!==this&&enabled(p)&&p.pilot==='mannock'&&states.get(p)?.coverUntil>t&&states.get(p)?.coverTarget===this&&distance(p,this)<700)result*=.8;
  if(!enabled(this))return result;const s=state(this);
  const a=source?Math.abs(wrap(Math.atan2((source.sourceY??source.y)-this.y,(source.sourceX??source.x)-this.x)-this.a)):Infinity;
  if(s.frontUntil>t&&a<=Math.PI/2)result*=this.pilot==='baracca'?.7:.8;
  if(s.guardUntil>t)result*=.8;if(s.barkerGuard>t)result*=.75;if(s.coverUntil>t)result*=.8;
  if(s.escapeUntil>t&&a>Math.PI/2&&a<=Math.PI)result*=.75;
  return result;
 };
 const patrol=q.hitPatrol;q.hitPatrol=function(a,n,...args){const cover=(world(this).players||[this]).some(p=>enabled(p)&&p.pilot==='mannock'&&states.get(p)?.coverUntil>now(p)&&states.get(p)?.coverTarget===a&&distance(p,a)<700);return patrol.call(this,a,n*(cover?.8:1),...args);};
 const ally=q.hitFormationAlly;q.hitFormationAlly=function(a,n,...args){const p=(world(this).players||[]).find(p=>owner(p)===(a.ownerId??'p1'))||this,s=states.get(p),cover=enabled(p)&&p.pilot==='brumowski'&&s?.coverUntil>now(p)&&(a.ownerId??'p1')===owner(p)&&distance(a,p)<180;return ally.call(this,a,n*(cover?.8:1),...args);};
}
