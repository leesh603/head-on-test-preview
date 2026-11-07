// Two owner-local capital unlocks. All damage still uses the host's existing
// projectile/part/death pipeline; an accepted volley, not a collision, advances it.
import {combatImpactResult} from './combat-impact-result.js?v=09c75d146ae4289d';
import {isReplacementPrimary,replacementPrimaryVolley} from './pilot-primary.js?v=09c75d146ae4289d';
import {equipmentTargets,igniteSharedBurn,wwiProjectileDamageMultiplier} from './wwi-equipment.js?v=09c75d146ae4289d';
import {momentumDamage} from './ace-momentum.js?v=09c75d146ae4289d';

export const CAPITAL_PILOT_BALANCE=Object.freeze({
 karl:Object.freeze({markSeconds:7,medalMarkSeconds:9,focusCredit:.28,medalFocusCredit:.20,focusVolleys:2,hitGap:2.2,gunBonus:.08,supportBonus:.15,bossGunBonus:.04,bossSupportBonus:.08,medalGunBonus:.12,medalSupportBonus:.22,medalBossGunBonus:.06,medalBossSupportBonus:.12,activeSeconds:5,enhancedSeconds:6,cooldown:23,salvos:3,salvoCredit:.36,salvoGap:.65,salvoDelay:.45,salvoRadius:88,salvoDamage:70,salvoCap:210,bossSalvoCap:110,bossHealthFraction:.025,enhancedPower:1.25,enhancedBossPower:1.12,enhancedRadius:1.15}),
 robinson:Object.freeze({range:1100,approachDistance:100,approachCone:.85,speed:.12,turn:.15,medalSpeed:.18,medalTurn:.22,pursuitSeconds:6,medalPursuitSeconds:8,damage:.12,bossDamage:.06,medalDamage:.18,medalBossDamage:.09,redeploySeconds:2.5,medalRedeploySeconds:3.5,redeploySpeed:.20,activeSeconds:6,enhancedSeconds:7.2,cooldown:24,stageCredit:.6,enhancedStageCredit:.5,hitGap:1.6,stageBonus:.05,bossStageBonus:.025,ignitionPower:8,ignitionCap:192,bossIgnitionCap:96,bossHealthFraction:.025,ignitionPulses:3,ignitionInterval:.12,enhancedPower:1.3,enhancedBossPower:1.15}),
 maxVolleyCredit:.45,minVolleyCredit:.04,fxLimit:18
});
const states=new WeakMap(),shots=new WeakMap(),replacementGroups=new WeakMap(),handledImpacts=new WeakMap(),packetBudgets=new WeakMap(),packetTargets=new WeakMap();
const installed=Symbol.for('headon.capital-pilots.combat.v1');
const IDS=new Set(['friedrich_karl','robinson']);
const world=p=>p?.combatWorld?.()||p?.world||p;
const now=p=>Number.isFinite(world(p)?.t)?world(p).t:0;
const owner=p=>p?.id??'p1';
const alive=e=>!!e&&e.hp>0&&!e.dead&&!e.destroyed&&!e.crashed&&!e.crashing&&!e.expired&&!e.rivalEscaped&&e.alive!==false;
const live=p=>!!p&&p.state==='playing'&&p.hp>0&&p.status!=='downed'&&!p.mission?.unarmed&&!(p.heineckeEscape>0);
const finite=n=>Number.isFinite(n)&&Math.abs(n)<1e7;
const position=p=>p&&finite(p.x)&&finite(p.y)?{x:p.x,y:p.y}:null;
const delta=a=>Math.atan2(Math.sin(a),Math.cos(a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const key=e=>e?.laonPlane?e:e?.stageBossBody||(e?.finalArenaTarget?`arena:${e.finalArenaBossId}:${e.finalArenaFormToken}`:e);
const boss=e=>!!(e?.stageBossBody||e?.finalArenaTarget||e?.bossPilot||e?.heavyBomber||e?.ace||e?.type==='boss'||e?.type==='zeppelin');
const significant=e=>boss(e)||e?.type==='bomber'||!!(e?.elite||e?.eliteKind||e?.eventCommander||e?.formationLeader||e?.missionTarget||e?.fieldUnit==='balloon');
const owned=(p,b)=>!!b&&!b.enemy&&!b.patrol&&(b.ownerId??'p1')===owner(p);
const personal=(p,b)=>owned(p,b)&&!['capitalSecondary','identityDot','identityChain','secondaryExplosion','passiveMedalSecondary','synthesisChild','synthesisSupport','ally','formation','ghost','transferGun','tacticalRound','nungesserCounter','rocket','motorCannon','mauserRound','actualExplosion','blast'].some(k=>b[k])&&(isReplacementPrimary(p,b)||Number.isInteger(b.gun)&&!b.cow37);
const support=b=>!!(b.ally||b.formation||b.synthesisSupport||b.pilotSupport||b.actualExplosion||b.blast||b.rocket||b.motorCannon||b.cooperBomb||b.grenadeExplosion);
const region=p=>world(p)?.worldRegion?.()??world(p)?.region??0;
function targetMaxHp(p,e){
 if(e?.stageBossBody?.maxHp>0)return e.stageBossBody.maxHp;
 if(e?.finalArenaTarget){const id=key(e),core=equipmentTargets(world(p)).find(q=>q.finalArenaTarget==='core'&&key(q)===id);if(core?.maxHp>0)return core.maxHp;}
 return e?.maxHp>0?e.maxHp:Infinity;
}
function packetBudget(p,b,e){
 if(!b?.capitalSecondary||!['royalFlak','watchIgnition'].includes(b.capitalKind))return null;
 let budgets=packetBudgets.get(b);if(!budgets){budgets=new Map();packetBudgets.set(b,budgets);}
 const id=key(e);let budget=budgets.get(id);if(!budget){
  const B=b.capitalKind==='royalFlak'?CAPITAL_PILOT_BALANCE.karl:CAPITAL_PILOT_BALANCE.robinson,heavy=boss(e),pulses=b.capitalKind==='watchIgnition'?B.ignitionPulses:1;
  const ordinary=b.capitalKind==='royalFlak'?B.salvoCap:B.ignitionCap,heavyCap=b.capitalKind==='royalFlak'?B.bossSalvoCap:B.bossIgnitionCap;
  budget={limit:(heavy?Math.min(heavyCap,targetMaxHp(p,e)*B.bossHealthFraction):ordinary)/pulses,spent:0};budgets.set(id,budget);
 }return budget;
}
function limitedMultiplier(p,b,e,m){
 const budget=packetBudget(p,b,e);if(!budget)return m;
 const remaining=Math.max(0,budget.limit-budget.spent);
 // The host applies these factors outside roundDamageMultiplier. Limit the
 // final accepted packet, not just its unscaled seed or one visible boss part.
 const external=(p.globalDamageMult||1)*(p.legendaryDamageMultiplier?.()??1)*momentumDamage(world(p),b)*wwiProjectileDamageMultiplier(b,e,p);
 const denominator=Math.max(Number.MIN_VALUE,(b.damage||0)*external);
 // Co-op's legacy caller uses `multiplier || 1`; a zero would revive a spent
 // packet. The hit ledger below normally skips it, with this positive floor
 // covering proxies rebuilt between contacts without adding measurable damage.
 return Math.max(Number.MIN_VALUE,Math.min(m,remaining/denominator));
}
function consumePacketBudget(p,b,e,damage){
 const budget=packetBudget(p,b,e);if(!budget)return;
 budget.spent+=damage;
 if(budget.spent+1e-7>=budget.limit){const id=key(e);b.hit??=new Set();for(const q of equipmentTargets(world(p)))if(key(q)===id)b.hit.add(q);}
}
function state(p){
 let s=states.get(p);const t=now(p),w=world(p),r=region(p);
 if(!s||s.pilot!==p.pilot||s.world!==w||t<s.at||s.region!==r){
  s={pilot:p.pilot,world:w,region:r,at:t,focus:null,mark:null,watch:null,pursuit:null,redeployUntil:0,approaching:false,run:null,pending:[],effects:[],groups:new Map()};states.set(p,s);
 }s.at=t;return s;
}
function validTarget(p,e){return alive(e)&&position(e)&&!e.decoration&&!e.arrivalPending&&!e.airArrival&&!e.stageBossBody?.arrivalPending&&p.canHitTarget?.(e)!==false;}
function inWorld(p,e){return !!e&&equipmentTargets(world(p)).some(q=>q===e||key(q)===key(e));}
function currentTarget(p,e){return validTarget(p,e)&&inWorld(p,e);}
function nearest(p){
 let important=null,ordinary=null,importantDistance=Infinity,ordinaryDistance=Infinity;
 for(const e of equipmentTargets(world(p))){if(!validTarget(p,e))continue;const d=distance(p,e);if(d>CAPITAL_PILOT_BALANCE.robinson.range)continue;
  if(significant(e)){if(d<importantDistance){important=e;importantDistance=d;}}
  else if(d<ordinaryDistance){ordinary=e;ordinaryDistance=d;}
 }return important||ordinary;
}
function cue(p,s,kind,pos=p,size=36,stage=0){
 const at=now(p),point=position(pos);if(!point)return;
 s.effects.push({...point,a:Number.isFinite(p.a)?p.a:0,at,kind,size,stage});
 if(s.effects.length>CAPITAL_PILOT_BALANCE.fxLimit)s.effects.splice(0,s.effects.length-CAPITAL_PILOT_BALANCE.fxLimit);
}
function volleyCredit(p,b){
 const baseline=p.buildBaseline?.rate??p.equipmentLedger?.baseline?.rate??.15;
 const interval=b.cow37?Math.max(.1,Math.min(1,(p.rate||baseline)/baseline)):Math.max(.02,p.rate||60/(p.weapon?.rpm||450));
 return Math.max(CAPITAL_PILOT_BALANCE.minVolleyCredit,Math.min(CAPITAL_PILOT_BALANCE.maxVolleyCredit,interval));
}
function prepare(p,b,token=null){
 if(!IDS.has(p.pilot)||!live(p)||!personal(p,b)||shots.has(b))return b;
 const s=state(p),replacement=token||replacementPrimaryVolley(p,b),at=Number.isFinite(b.capitalVolleyAt)?b.capitalVolleyAt:now(p);let group;
 if(replacement&&typeof replacement==='object'){
  group=replacementGroups.get(replacement);if(!group){group={owner:p,state:s,at,credit:volleyCredit(p,b),accepted:false};replacementGroups.set(replacement,group);}
 }else{
  // A frame is one ordinary trigger. Every barrel and pellet, including the
  // staggered half copied from this trigger, shares its original firing time.
  const groupId=at.toFixed(7);group=s.groups.get(groupId);
  if(!group){group={owner:p,state:s,at,credit:volleyCredit(p,b),accepted:false};s.groups.set(groupId,group);}
  if(s.groups.size>96)for(const [id,g]of s.groups){if(now(p)-g.at>4)s.groups.delete(id);}
 }
 if(group.owner===p&&group.state===s)shots.set(b,{owner:p,state:s,group});
 return b;
}
function acceptedVolley(p,b,s){
 const shot=shots.get(b);if(!shot||shot.owner!==p||shot.state!==s||shot.group.accepted)return null;
 shot.group.accepted=true;return shot.group;
}
function pointFor(e,target=e,fallback=e){
 if(!alive(e)||target?.destroyed||target?.dead||target?.hp<=0)return null;
 const body=e.stageBossBody;if(!body)return position(e);
 if(target!==body){const raw=body.support129?.parts?.get?.(target.id);if(raw){const point=body.support129.world(raw.nx,raw.ny);if(position(point))return position(point);}
  if(finite(target.x)&&finite(target.y))return{x:body.x+target.x,y:body.y+target.y};}
 return position(fallback)||position(e);
}
function scheduleArtillery(p,s,e,pos){
 const B=CAPITAL_PILOT_BALANCE.karl,run=s.run,t=now(p);if(!run||run.fired>=B.salvos)return;
 const speed=e.stationary||e.stageBossBody?0:Math.min(220,Math.max(0,e.speed||0));
 const vx=Number.isFinite(e.vx)?Math.max(-220,Math.min(220,e.vx)):Math.cos(e.a||0)*speed,vy=Number.isFinite(e.vy)?Math.max(-220,Math.min(220,e.vy)):Math.sin(e.a||0)*speed;
 const x=pos.x+vx*B.salvoDelay*.75,y=pos.y+vy*B.salvoDelay*.75,index=run.fired++,baseRadius=B.salvoRadius*(run.enhanced?B.enhancedRadius:1);
 s.pending.push({kind:'flak',x,y,at:t,burstAt:t+B.salvoDelay,baseRadius,radius:p.explosionRadius?.(baseRadius)??baseRadius,index,run:run.id,enhanced:run.enhanced});
 run.credit=0;run.nextSalvo=t+B.salvoGap;cue(p,s,'order',p,32,index+1);
}
function noteKarl(p,s,e,group,pos){
 const B=CAPITAL_PILOT_BALANCE.karl,t=now(p),targetKey=key(e),medal=!!p.upgrades?.passiveMedal,wasMarked=s.mark?.key===targetKey&&s.mark.until>t;
 if(!s.focus||s.focus.key!==targetKey||t-s.focus.at>B.hitGap)s.focus={key:targetKey,credit:0,volleys:0,at:t};
 s.focus.credit+=group.credit;s.focus.volleys++;s.focus.at=t;
 if(alive(e)&&(wasMarked||s.focus.volleys>=B.focusVolleys&&s.focus.credit+1e-8>=(medal?B.medalFocusCredit:B.focusCredit))){
  if(!wasMarked)cue(p,s,'observe',pos,34);
  s.mark={key:targetKey,target:e,until:t+(medal?B.medalMarkSeconds:B.markSeconds)};
 }
 const run=s.run;if(wasMarked&&run&&run.until>t&&group.at>=run.started&&run.fired<B.salvos){
  run.credit+=group.credit;
  if(run.credit+1e-8>=B.salvoCredit&&t>=run.nextSalvo&&alive(e))scheduleArtillery(p,s,e,pos);
 }
}
function scheduleIgnition(p,s,e,target,pos){
 const B=CAPITAL_PILOT_BALANCE.robinson,run=s.run,t=now(p),strong=boss(e),power=run.enhanced?(strong?B.enhancedBossPower:B.enhancedPower):1;
 const cap=strong?Math.min(B.bossIgnitionCap,targetMaxHp(p,e)*B.bossHealthFraction):B.ignitionCap;
 const damage=Math.min(cap,Math.max(0,p.damage||12)*B.ignitionPower*(strong?.6:1)*power)/B.ignitionPulses;
 run.burst=true;run.stage=3;cue(p,s,'ignition',pos,64,3);p.event?.('motorCannonFire','');
 for(let i=0;i<B.ignitionPulses;i++)s.pending.push({kind:'ignition',enemy:e,target,targetKey:key(e),x:pos.x,y:pos.y,at:t,burstAt:t+i*B.ignitionInterval,damage,index:i,enhanced:run.enhanced,run:run.id});
}
function noteRobinson(p,s,e,target,group,pos){
 const B=CAPITAL_PILOT_BALANCE.robinson,t=now(p),targetKey=key(e);
 if(!s.watch)s.watch=nearest(p);
 if(s.watch&&key(s.watch)===targetKey&&(!s.pursuit||s.pursuit.until<=t||s.pursuit.key!==targetKey)){
  s.pursuit={key:targetKey,target:e,until:t+(p.upgrades?.passiveMedal?B.medalPursuitSeconds:B.pursuitSeconds)};cue(p,s,'watch',pos,32);
 }
 const run=s.run;if(!run||run.until<=t||run.burst||group.at<run.started)return;
 if(run.targetKey!==targetKey||t-run.lastHit>B.hitGap){run.targetKey=targetKey;run.credit=0;run.stage=1;}
 run.lastHit=t;run.credit+=group.credit;
 const threshold=run.enhanced?B.enhancedStageCredit:B.stageCredit;
 const stage=Math.min(3,1+Math.floor((run.credit+1e-8)/threshold));
 if(stage>run.stage){run.stage=stage;cue(p,s,'magazine',p,32,stage);}
 if(run.credit+1e-8>=threshold*3&&alive(e)&&!target?.destroyed&&target?.hp>0)scheduleIgnition(p,s,e,target,pos);
}
function noteKill(p,s,b,e){
 if(p.pilot!=='robinson'||!owned(p,b)||b.ally||b.formation||b.synthesisSupport||b.pilotSupport||!s.pursuit||s.pursuit.key!==key(e)||s.pursuit.until<=now(p)||e.hp>0||e.expired||e.rivalEscaped)return;
 const B=CAPITAL_PILOT_BALANCE.robinson;
 s.redeployUntil=now(p)+(p.upgrades?.passiveMedal?B.medalRedeploySeconds:B.redeploySeconds);s.pursuit=null;s.watch=null;cue(p,s,'redeploy',p,42);
}
function flush(p,s,t){
 const w=world(p),ready=s.pending.filter(q=>q.burstAt<=t);s.pending=s.pending.filter(q=>q.burstAt>t);
 for(const q of ready){
  if(q.kind==='flak'){
   const B=CAPITAL_PILOT_BALANCE.karl,start=w.bullets.length;
   const damage=Math.min(B.salvoCap,(p.payloadPower?.(B.salvoDamage)??B.salvoDamage)*(q.enhanced?B.enhancedPower:1));
   p.queueExplosionDamage(q.x,q.y,q.baseRadius,damage,{secondaryExplosion:true,fxSource:'groundShell'});
   for(const b of w.bullets.slice(start)){b.capitalSecondary=true;b.capitalKind='royalFlak';b.capitalEnhanced=q.enhanced;b.ownerId=owner(p);}
   const effect=w.combatFX?.at(-1);if(effect){effect.fxSource='groundShell';effect.capitalRoyal=true;}
   cue(p,s,'flak',q,q.radius*1.1,q.index+1);p.event?.('artilleryImpact','');
  }else{
   if(!currentTarget(p,q.enemy)||key(q.enemy)!==q.targetKey)continue;
   const pos=pointFor(q.enemy,q.target,q);if(!pos||!(q.damage>0))continue;
   // This finite, target-bound hit packet cannot hit a neighbour or charge a
   // second active. Part collision and boss shielding are still authoritative.
   const hit=new Set(equipmentTargets(w).filter(e=>e!==q.enemy));
   // Ordinary explosion collision reads explosionRadius, not collisionRadius.
   // The finite radius tolerates the target's same-frame movement; candidates
   // remain restricted to this exact aircraft/part, so it is never area damage.
   const packet={...pos,previousX:pos.x,previousY:pos.y,vx:0,vy:0,life:.12,damage:q.damage,ownerId:owner(p),enemy:false,hit,identityDotTarget:q.target,actualExplosion:true,explosionRadius:32,collisionRadius:2,pierce:false,capitalSecondary:true,capitalKind:'watchIgnition',capitalIgnite:q.index===0,capitalEnhanced:q.enhanced};
   packetTargets.set(packet,q.enemy);w.bullets.push(packet);
   cue(p,s,'ignitionHit',pos,40+q.index*7,3);
  }
 }
}
function advance(p,s){
 const t=now(p);s.effects=s.effects.filter(e=>t>=e.at&&t-e.at<1.3);
 if(s.mark&&(s.mark.until<=t||!currentTarget(p,s.mark.target)))s.mark=null;
 if(s.focus&&t-s.focus.at>CAPITAL_PILOT_BALANCE.karl.hitGap)s.focus=null;
 if(s.pursuit&&(s.pursuit.until<=t||!currentTarget(p,s.pursuit.target)))s.pursuit=null;
 if(s.run&&s.run.until<=t){s.run=null;}
 if(p.pilot==='robinson'){
  s.watch=s.pursuit?.target||nearest(p);
  const B=CAPITAL_PILOT_BALANCE.robinson,e=s.watch,d=e?distance(p,e):0;
  s.approaching=!!e&&d>B.approachDistance&&d<=B.range&&Math.abs(delta(Math.atan2(e.y-p.y,e.x-p.x)-p.a))<B.approachCone;
  if(s.run&&!s.run.burst&&t-s.run.lastHit>B.hitGap){s.run.credit=0;s.run.stage=1;s.run.targetKey=null;}
 }
 flush(p,s,t);
}

// Public read-only snapshots do not initialize state or consume simulation RNG.
export function capitalPilotsState(p){
 if(!IDS.has(p?.pilot)||!live(p))return null;
 const s=states.get(p),t=now(p);if(!s||s.pilot!==p.pilot||s.world!==world(p)||s.region!==region(p)||t<s.at)return null;
 const mark=p.pilot==='friedrich_karl'?s.mark:s.pursuit;
 return {pilot:s.pilot,mark:mark&&mark.until>t&&alive(mark.target)?{target:mark.target,until:mark.until,kind:p.pilot==='friedrich_karl'?'observation':'pursuit'}:null,watch:s.watch,activeUntil:s.run?.until>t?s.run.until:0,stage:s.run?.until>t?s.run.stage||0:0,progress:s.run?.until>t?Math.min(1,(s.run.credit||0)/((s.run.enhanced?CAPITAL_PILOT_BALANCE.robinson.enhancedStageCredit:CAPITAL_PILOT_BALANCE.robinson.stageCredit)*3)):0,salvosFired:s.run?.fired||0,approaching:!!s.approaching,redeployUntil:s.redeployUntil,salvos:s.pending.filter(q=>q.kind==='flak').map(({x,y,at,burstAt,radius,index})=>({x,y,at,burstAt,radius,index})),effects:s.effects.map(e=>({...e}))};
}
export function capitalPilotsFlightModifiers(p){
 const out={speed:1,turn:1};if(p?.pilot!=='robinson'||!live(p))return out;
 const w=world(p),s=w?.online&&!w?.host?(p.capitalPilotsVisual?.pilot===p.pilot?p.capitalPilotsVisual:null):capitalPilotsState(p);if(!s)return out;
 const B=CAPITAL_PILOT_BALANCE.robinson,medal=!!p.upgrades?.passiveMedal;
 if(s.approaching){out.speed+=medal?B.medalSpeed:B.speed;out.turn+=medal?B.medalTurn:B.turn;}
 if(s.redeployUntil>now(p))out.speed=Math.max(out.speed,1+B.redeploySpeed);
 return out;
}

export function installCapitalPilotsCombat(Game,PILOTS){
 const q=Game.prototype;if(Object.hasOwn(q,installed))return Game;Object.defineProperty(q,installed,{value:true});
 q.resetCapitalPilotsCombat=function(){states.delete(this);this.capitalPilotsVisual=null;};
 const duration=q.skillDuration;q.skillDuration=function(){if(!IDS.has(this.pilot))return duration.call(this);const B=this.pilot==='friedrich_karl'?CAPITAL_PILOT_BALANCE.karl:CAPITAL_PILOT_BALANCE.robinson;return this.skillEnhanced?B.enhancedSeconds:B.activeSeconds;};
 const skill=q.skill;q.skill=function(){
  if(!IDS.has(this.pilot))return skill.call(this);
  if(!live(this)||this.cooldown>0||this.skillTime>0)return false;
  this.ensureRevisionPilot?.();const s=state(this),t=now(this),seconds=this.skillDuration();
  s.run={id:(s.serial=(s.serial||0)+1),started:t,until:t+seconds,enhanced:!!this.skillEnhanced,credit:0,fired:0,nextSalvo:t,stage:this.pilot==='robinson'?1:0,lastHit:t,targetKey:null,burst:false};
  this.skillTime=seconds;this.cooldown=this.skillCooldown();cue(this,s,this.pilot==='friedrich_karl'?'order':'magazine',this,36,1);this.event?.('skill',PILOTS[this.pilot]?.skill||'');return true;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(!IDS.has(this.pilot)){states.delete(this);return prior;}
  if(!live(this)){states.delete(this);return prior;}
  if(Number.isFinite(dt)&&dt>0){advance(this,state(this));const mult=capitalPilotsFlightModifiers(this);this.speed*=mult.speed;this.baseSpeed*=mult.speed;this.turn*=mult.turn;}
  return prior;
 };
 const end=q.endRevisionFrame;q.endRevisionFrame=function(prior){
  if(IDS.has(this.pilot)&&live(this))for(const pending of this.synthesisGunPending||[])if(pending.round&&pending.round.capitalVolleyAt==null)pending.round.capitalVolleyAt=now(this);
  return end.call(this,prior);
 };
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){const result=apply.call(this,b,...args);prepare(this,result||b);return result;};
 const primary=q.preparePilotPrimaryRound;q.preparePilotPrimaryRound=function(b,volley){const result=primary.call(this,b,volley);prepare(this,result||b,volley);return result;};
 const candidates=q.projectileCandidates;q.projectileCandidates=function(b){const target=packetTargets.get(b),list=candidates.call(this,b);return target?list.filter(e=>e===target):list;};
 const canHit=q.canHitTarget;q.canHitTarget=function(e,b){const target=b&&packetTargets.get(b);return target&&target!==e?false:canHit.call(this,e,b);};
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){
  let m=damage.call(this,b,e);if(!owned(this,b))return m;
  if(!IDS.has(this.pilot)||!live(this))return limitedMultiplier(this,b,e,m);
  const s=state(this),t=now(this),heavy=boss(e),medal=!!this.upgrades?.passiveMedal;
  if(b.capitalKind==='royalFlak'&&heavy){const B=CAPITAL_PILOT_BALANCE.karl,plain=b.capitalEnhanced?B.enhancedBossPower/B.enhancedPower:1;m*=.65*plain;}
  if(this.pilot==='friedrich_karl'&&s.mark?.key===key(e)&&s.mark.until>t){
   const B=CAPITAL_PILOT_BALANCE.karl;
   if(personal(this,b))m*=1+(medal?(heavy?B.medalBossGunBonus:B.medalGunBonus):(heavy?B.bossGunBonus:B.gunBonus));
   else if(support(b)&&!b.identityDot)m*=1+(medal?(heavy?B.medalBossSupportBonus:B.medalSupportBonus):(heavy?B.bossSupportBonus:B.supportBonus));
  }
  if(this.pilot==='robinson'&&personal(this,b)){
   const B=CAPITAL_PILOT_BALANCE.robinson;
   if(s.pursuit?.key===key(e)&&s.pursuit.until>t)m*=1+(medal?(heavy?B.medalBossDamage:B.medalDamage):(heavy?B.bossDamage:B.damage));
   const shot=shots.get(b),run=s.run;if(run?.until>t&&shot?.group.at>=run.started)m*=1+(run.stage||1)*(heavy?B.bossStageBonus:B.stageBonus);
  }return limitedMultiplier(this,b,e,m);
 };
 function receiveImpact(p,b,e,target=e,pos=e){
  const accepted=combatImpactResult(b,e);if(!owned(p,b)||!(accepted?.damage>0))return;
  let seen=handledImpacts.get(b);if(!seen){seen=new WeakSet();handledImpacts.set(b,seen);}if(seen.has(accepted))return;seen.add(accepted);
  consumePacketBudget(p,b,e,accepted.damage);
  if(!IDS.has(p.pilot)||!live(p)||accepted.blocked||p.canHitTarget?.(e,b)===false)return;
  const s=state(p);
  // Native final-arena HP is not an ordinary burnable enemy field. Its three
  // ignition packets continue through the real fortress hit/part pipeline.
  if(b.capitalIgnite&&alive(e)&&!e.finalArenaTarget)igniteSharedBurn(p,e,{...b,synthesisPayload:{burnScale:b.capitalEnhanced?1.3:1}},accepted);
  if(personal(p,b)){
   const group=acceptedVolley(p,b,s);
   if(group){const point=position(pos)||position(e);if(point){if(p.pilot==='friedrich_karl')noteKarl(p,s,e,group,point);else noteRobinson(p,s,e,target,group,point);}}
  }
  noteKill(p,s,b,e);
 }
 const impact=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){const result=impact?.call(this,b,e,target,pos);receiveImpact(this,b,e,target,pos);return result;};
 const special=q.specialRoundImpact;q.specialRoundImpact=function(b,e){
  const result=special?.call(this,b,e);
  // Arena, facility and the dedicated elite bridge publish accepted damage but
  // bypass identityImpact. This fallback consumes that same result once only.
  receiveImpact(this,b,e,e,{x:b?.x??e?.x,y:b?.y??e?.y});return result;
 };
 return Game;
}
