import {PILOT_IDENTITY_COPY} from './pilot-identity-copy.js';
import {installPilotFeedback} from './pilot-feedback.js';
import {headOnTarget} from './engagement-feedback.js?v=523';
// Final player-only pilot layer. Installed after every historical engine override.
// The same methods are inherited by cooperative PlayerState and CampaignGame.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const alive=e=>e&&e.hp>0&&!e.crashed&&!e.rivalEscaped&&!e.expired;
const own=p=>p.id||'p1';
const personal=b=>!b.enemy&&!b.ally&&!b.formation&&!b.patrol&&!b.actualExplosion&&!b.blast&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.mauserRound;
const commanders=new Set(['boelcke','goering','collishaw','brumowski']);
const durations={fonck:4,voss:2.4,boelcke:8,udet:.55,goering:5,immelmann:2.8,huffzky:5,berthold:5,jacobs:4,gontermann:5,brumowski:5,collishaw:6,bishop:3,mannock:5,mckeever:5,hawker:5,nungesser:3,rickenbacker:4,ball:1.5,barker:6,luke:6};
export const PILOT_IDENTITY_BALANCE=Object.freeze({durations:Object.freeze(durations),focusCone:.13,focusRange:780,focusTime:1.5,grazeInner:18,grazeOuter:42,grazeStacks:3,grazeDuration:3,delayedFraction:.4,debtSeconds:4,energySeconds:3,turnSeconds:2,switchWindow:2,switchStacks:3,igniteSeconds:3,igniteInterval:.25,chainRadius:110,chainDamage:36,fxCap:24});
export const pilotOwner=own;
export const pilotHeadOn=(p,e)=>headOnTarget({...p,hp:1},[e])===e;
export function installPilotIdentities(Game,PILOTS){
 for(const [id,copy]of Object.entries(PILOT_IDENTITY_COPY)){const p=PILOTS[id];if(!p)continue;const c=copy.ko;Object.assign(p,{passive:c.passive,skill:c.skill,passiveDesc:c.passiveDetail,desc:c.activeDetail});}
 PILOTS.berthold.name='루돌프 베르톨트';PILOTS.nungesser.name='샤를 넝제세르';PILOTS.guynemer.name='조르주 기네메르';
 const oldEnsure=Game.prototype.ensureRevisionPilot;
 Game.prototype.ensureRevisionPilot=function(){oldEnsure.call(this);if(this.pilotIdentityReady)return;this.pilotIdentityReady=true;this.pilotIdentity={fx:[],burns:new Map(),debts:[],clock:0,grazeSeen:new WeakSet(),grazePasses:new Map(),bombs:[],switchSeen:new Map()};if(['boelcke','brumowski'].includes(this.pilot))this.permanentWingman=(this.permanentWingman||0)+2;};
 Game.prototype.identityState=function(){this.ensureRevisionPilot();return this.pilotIdentity};
 Game.prototype.identityFx=function(key,x=this.x,y=this.y,a=this.a,size=48,life=.3,style={}){const s=this.identityState();s.fx.push({key,x,y,a,size,life,maxLife:life,...style});if(s.fx.length>PILOT_IDENTITY_BALANCE.fxCap)s.fx.shift()};
 Game.prototype.identityTarget=function(cone=.65,range=780,origin=this,heading=this.a){let picked=null,best=Infinity;for(const e of this.enemies||[]){if(!alive(e))continue;const d=distance(origin,e);if(d>range||Math.abs(delta(Math.atan2(e.y-origin.y,e.x-origin.x),heading))>cone)continue;if(d<best){best=d;picked=e}}return picked};
 Game.prototype.identityThreat=function(){const w=this.combatWorld(),friends=[...(w.players||[]).filter(p=>p!==this&&alive(p)),...(w.allies||[]).filter(a=>a.life>0),...(w.patrols||[]).filter(alive)];let target=null,best=Infinity;for(const e of this.enemies||[]){if(!alive(e)||e.surface)continue;for(const f of friends){const d=distance(e,f);if(d<400&&d<best&&Math.abs(delta(Math.atan2(f.y-e.y,f.x-e.x),e.a||0))<.65){best=d;target=e}}}return target};
 Game.prototype.identityShot=function(a,damage,extra={},origin=this){const speed=extra.speed||560,b={x:origin.x+Math.cos(a)*26,y:origin.y+Math.sin(a)*26,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1.4,damage,enemy:false,ownerId:own(this),hit:new Set(),...extra};this.bullets.push(b);this.identityFx(b.motorCannon?'muzzleHeavy':b.gun===1?'muzzleRear':'muzzle',b.x,b.y,a,b.motorCannon?62:28,.13);return b};
 const oldWingPlane=Game.prototype.permanentWingPlane;
 Game.prototype.permanentWingPlane=function(){if(!this.upgrades?.fighterSupply&&['boelcke','brumowski'].includes(this.pilot))return this.pilot==='boelcke'?'albatros_d2':'brumowski_albatros';return oldWingPlane.call(this)};
 const oldDuration=Game.prototype.skillDuration;
 Game.prototype.skillDuration=function(){if(this.pilot==='baron')return 4*(this.skillEnhanced?1.35:1);return durations[this.pilot]===undefined?oldDuration.call(this):durations[this.pilot]*(this.skillEnhanced?1.25:1)};
 const oldSkill=Game.prototype.skill;
 Game.prototype.skill=function(){
  if(!Object.hasOwn(durations,this.pilot))return oldSkill.call(this);
  this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0||this.status==='downed')return false;
  const s=this.identityState();this.cooldown=this.skillCooldown();this.skillTime=this.skillDuration();s.activeAge=0;
  if(this.pilot==='voss'){this.invuln=Math.max(this.invuln,.45);const w=this.combatWorld();w.revisionDecoys??=[];for(let i=0;i<6;i++){const a=this.a+i*Math.PI/3;w.revisionDecoys.push({x:this.x,y:this.y,a,plane:this.plane,pilot:this.pilot,ownerId:own(this),life:1.2,hp:1,decoy:true,identityDecoy:true,vx:Math.cos(a)*140,vy:Math.sin(a)*140})}}
  if(this.pilot==='immelmann'){this.bullets=this.bullets.filter(b=>!b.enemy);this.invuln=Math.max(this.invuln,this.skillEnhanced?1.35:1.1);this.immelmannTurn={heading:this.a,elapsed:0,spread:this.skillEnhanced?3:2,fired:false}}
 if(this.pilot==='boelcke'){const w=this.combatWorld();w.allies??=[];const formationSize=this.skillEnhanced?5:4;for(let i=0;i<formationSize;i++)w.allies.push({ownerId:own(this),slot:(this.permanentWingman||0)+i,plane:this.plane,x:this.x,y:this.y,a:this.a,life:this.skillTime,fire:.85+Math.floor(i/2)*.12,temporary:true,boelckePincer:true})}
  if(this.pilot==='udet'){this.udetBoost=0;this.evadeTime=this.skillTime;this.evadeDirection=-(this.evadeDirection||1);this.invuln=Math.max(this.invuln,this.skillTime);this.fire=Math.min(this.fire,0);s.udetActiveBonus=(s.grazes||0)*.1;s.grazes=0}
  if(this.pilot==='goering')s.commandTarget=this.identityTarget();
  if(this.pilot==='huffzky')s.bombTimer=0;
  if(this.pilot==='berthold')s.debts=s.debts.map(d=>({...d,remaining:Math.max(d.remaining,6)}));
  if(this.pilot==='barker'){s.barkerReady=true;s.escape=null}
  if(this.pilot==='ball'){this.ballCloak=this.skillTime;this.ballGhost={x:this.x,y:this.y,a:this.a,speed:this.speed,hp:1};this.ballAmbush=0;this.invuln=Math.max(this.invuln,.25)}
  this.event('skill',PILOTS[this.pilot].skill);return true;
 };
 const oldGun=Game.prototype.normalGunMultiplier;
 Game.prototype.normalGunMultiplier=function(){let m=oldGun.call(this),s=this.identityState();if(this.pilot==='rickenbacker')m*=1+(s.switches||0)*(this.skillTime>0?.18:.1);return m};
 const oldRound=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(b,type){oldRound.call(this,b,type);if(!personal(b))return b;const s=this.identityState();b.identityGun=true;b.identityOrigin={x:this.x,y:this.y,a:this.a};
  if(this.pilot==='fonck'){delete b.fonckGuided;delete b.fonckSeeker;if(this.skillTime>0)b.pierce=true;const speed=Math.hypot(b.vx,b.vy),a=this.a+delta(Math.atan2(b.vy,b.vx),this.a)*.25;b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}
  if(this.pilot==='hawker'){const speed=Math.hypot(b.vx,b.vy),a=this.a+delta(Math.atan2(b.vy,b.vx),this.a)*(1-.7*(s.focus||0));b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}
  if(this.pilot==='luke'){b.identityIgnite=true;b.specialColor='#d99658'}
  if(this.pilot==='gontermann'&&s.focus>=1&&(this.skillTime>0||!(s.ignitionCooldown>0))){s.ignitionCooldown=1.2;b.identityIgnite=true;b.identityPrepared=true;b.identityTarget=s.target;b.specialColor='#d99658'}
  return b;
 };
 const oldDamage=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){if(b.identityDot||b.identityChain)return 1;let m=oldDamage.call(this,b,e);if(!b.identityGun&&!personal(b))return m;const s=this.identityState(),origin=b.identityOrigin||this;
  if(this.pilot==='fonck'&&e===s.target)m*=1+(s.focus||0)*(this.skillTime>0?.8:.35);
  if(this.pilot==='bishop')m*=1+clamp(1-distance(origin,e)/360)*(this.skillTime>0?1.1:.65);
  if(this.pilot==='baracca'&&pilotHeadOn(origin,e))m*=1.3;
  if(this.pilot==='mannock'&&e===s.threat)m*=this.skillTime>0?1.65:1.3;
  if(this.pilot==='mckeever'&&b.gun===1&&e===s.handoff)m*=this.skillTime>0?1.75:1.3;
  if(this.pilot==='ball'&&this.ballAmbush>0&&s.alone&&Math.abs(delta(Math.atan2(origin.y-e.y,origin.x-e.x),e.a||0))>Math.PI*.72)m*=2.2;
  if(this.pilot==='luke'&&[...s.burns.values()].some(burn=>burn.enemy===e&&burn.time>0))m*=this.skillTime>0?1.55:1.2;
  if(this.pilot==='gontermann'&&b.identityPrepared&&e===b.identityTarget)m*=this.skillTime>0?1.6:1.2;
  if(this.pilot==='udet')m*=this.skillTime>0?1.2+(s.udetActiveBonus||0):1+(s.grazes||0)*.1;
  return m;
 };
 Game.prototype.identityImpact=function(b,e,target=e,position=e){
  const s=this.identityState(),mine=(b.ownerId||'p1')===own(this),marked=s.burns.get(target),dead=target.destroyed||target.dead||target.hp<=0;
  if(marked&&dead){s.burns.delete(target);if(this.pilot==='luke'&&this.skillTime>0&&!b.identityChain){const w=this.combatWorld();w.identityDetonated??=new WeakSet();if(!w.identityDetonated.has(target)){w.identityDetonated.add(target);this.identityChain(position,e)}}}
  if(!mine||b.identityDot||b.identityChain||b.patrol||b.ally||b.formation||b.actualExplosion)return;
  if(this.pilot==='mckeever'&&b.gun===0&&alive(e)){s.handoff=e;s.handoffTime=3;this.identityFx('muzzleRear',this.x-Math.cos(this.a)*16,this.y-Math.sin(this.a)*16,this.a+Math.PI,24,.15)}
  if(this.pilot==='rickenbacker'&&b.identityGun&&e!==s.lastHit){const previous=s.switchSeen.get(e)??-Infinity;const fresh=s.clock-previous>=2;if(s.lastHit&&s.clock-(s.lastHitAt||0)<2&&fresh){s.switches=Math.min(3,(s.switches||0)+1);s.switchTime=3;this.identityFx('muzzle',this.x+Math.cos(this.a)*26,this.y+Math.sin(this.a)*26,this.a,38,.16)}s.lastHit=e;s.lastHitAt=s.clock;s.switchSeen.set(e,s.clock)}
  if(b.identityIgnite&&!dead&&(this.pilot!=='gontermann'||e===b.identityTarget)){s.burns.set(target,{enemy:e,target,position:{x:position.x,y:position.y},time:3,tick:0,damage:this.damage*(this.pilot==='gontermann'?.45:.2),part:!!e.stageBossBody&&target!==e.stageBossBody,body:e.stageBossBody});this.identityFx('fireEngine',position.x,position.y,0,34,.25)}
 };
 Game.prototype.identityChain=function(position,exclude){const before=this.bullets.length;this.queueExplosionDamage(position.x,position.y,110,this.payloadPower(36),{secondaryExplosion:true,exclude,fxSource:'lePrieur'});for(const b of this.bullets.slice(before)){b.identityChain=true;b.secondaryExplosion=true}this.identityFx('fireFlash',position.x,position.y,0,110,.35)};
 Game.prototype.pilotDamageTaken=function(n){if(this.payingPilotDebt||!(n>0))return n;const s=this.identityState();s.lastDamage=s.clock;
  if(this.pilot==='berthold'){const amount=n*.4;const duration=this.skillTime>0?6:4,last=s.debts.at(-1);if(last&&last.remaining>=duration-.1)last.amount+=amount;else s.debts.push({amount,remaining:duration});n-=amount;this.identityFx('armorSpark',this.x,this.y,this.a,46,.22)}
  if(this.pilot==='barker'&&this.skillTime>0&&s.barkerReady&&n>=this.hp){s.barkerReady=false;s.escape={x:this.x,y:this.y,time:4,quiet:0};n=Math.max(0,this.hp-1);this.identityFx('armorSpark',this.x,this.y,this.a,65,.35)}
  return n;
 };
 const oldIncoming=Game.prototype.incomingDamageMultiplier;
 Game.prototype.incomingDamageMultiplier=function(source){if(this.payingPilotDebt)return 1;let m=oldIncoming.call(this,source);if(this.pilot==='brumowski'&&this.skillTime>0){const n=this.combatWorld().allies.filter(a=>a.ownerId===own(this)&&a.life>0&&distance(a,this)<180).length;m*=1-Math.min(2,n)*.1}if(this.pilot==='nungesser'&&this.skillTime>0)m*=.75;return m};
 const oldDirection=Game.prototype.gunDirection;
 Game.prototype.gunDirection=function(gun=0){const base=oldDirection.call(this,gun);if(gun!==1||!['mckeever','huffzky'].includes(this.pilot))return base;const s=this.identityState(),range=this.pilot==='mckeever'?650:420;let e=this.pilot==='mckeever'&&s.handoffTime>0?s.handoff:this.identityTarget(1.2,range,this,this.a+Math.PI);if(!alive(e)||distance(this,e)>range)return base;const aim=Math.atan2(e.y-this.y,e.x-this.x);return Math.abs(delta(aim,this.a+Math.PI))<1.2?aim:base};
 const oldBegin=Game.prototype.beginRevisionFrame;
 Game.prototype.beginRevisionFrame=function(dt,input={}){
  const extra={energyRecoveryBonus:this.energyRecoveryBonus,handlingDragMult:this.handlingDragMult};const prior=oldBegin.call(this,dt,input);Object.assign(prior,extra);this.tickPilotIdentity(dt,input);return prior;
 };
 Game.prototype.tickPilotIdentity=function(dt,input={}){
  if(!(dt>0)||this.hp<=0||this.status==='downed')return;const s=this.identityState(),w=this.combatWorld();s.clock+=dt;s.activeAge=(s.activeAge||0)+dt;s.fx=s.fx.filter(f=>(f.life-=dt)>0);const active=this.skillTime>0;
  for(const k of ['grazeTime','switchTime','handoffTime','ignitionCooldown','grazeCooldown'])s[k]=Math.max(0,(s[k]||0)-dt);if(!s.grazeTime)s.grazes=0;if(!s.switchTime)s.switches=0;
  for(const [e,t]of s.switchSeen)if(s.clock-t>3)s.switchSeen.delete(e);
  const yaw=Math.abs(delta(this.a,s.previousHeading??this.a))/dt;s.previousHeading=this.a;
  if(this.pilot==='udet'){const live=new Set();for(const b of this.bullets){if(!b.enemy)continue;live.add(b);const d=distance(this,b),prev=s.grazePasses.get(b);if(d<PILOT_IDENTITY_BALANCE.grazeOuter){if(prev===undefined||d<prev)s.grazePasses.set(b,d)}else if(prev!==undefined){s.grazePasses.delete(b);if(prev>=PILOT_IDENTITY_BALANCE.grazeInner){s.grazes=Math.min(PILOT_IDENTITY_BALANCE.grazeStacks,(s.grazes||0)+1);s.grazeTime=PILOT_IDENTITY_BALANCE.grazeDuration}}}for(const b of s.grazePasses.keys())if(!live.has(b))s.grazePasses.delete(b)}
  if(['fonck','gontermann','hawker'].includes(this.pilot)){const target=this.identityTarget(.13);s.focus=target&&target===s.target?clamp((s.focus||0)+dt/(this.pilot==='hawker'?2:1.5)):0;s.target=target;}
  if(this.pilot==='gontermann'&&s.focus>.65&&s.clock-(s.prepareFxAt??-1)>.25){s.prepareFxAt=s.clock;this.identityFx('gunSmoke',this.x+Math.cos(this.a)*25,this.y+Math.sin(this.a)*25,this.a,20,.18)}
  if(this.pilot==='udet'&&active){this.turn*=1.3;this.speed*=1.2;this.baseSpeed*=1.2}
  if(this.pilot==='voss'&&active){this.turn*=1.35;this.speed*=1.35;this.baseSpeed*=1.35}
  if(this.pilot==='jacobs'){s.turnCharge=clamp((s.turnCharge||0)+(yaw>.35?dt/2:-dt));this.energyRecoveryBonus=(this.energyRecoveryBonus||0)+.6;this.rate/=1+.3*s.turnCharge;this.handlingDragMult=(this.handlingDragMult??1)*(active?.45:.8);if(active)this.turn*=1.2;}
  if(this.pilot==='hawker')this.rate/=1+.3*(s.focus||0);
  if(this.pilot==='bishop'&&active){this.speed*=1.25;this.baseSpeed*=1.25}
  if(this.pilot==='mannock'){s.threat=this.identityThreat();s.coverFire=(s.coverFire||0)-dt;if(active&&alive(s.threat)&&distance(this,s.threat)<650&&s.coverFire<=0){s.coverFire=.65;this.identityShot(Math.atan2(s.threat.y-this.y,s.threat.x-this.x),this.supportPower(12),{formation:true,pierce:true})}}
  if(this.pilot==='huffzky'&&active){s.bombTimer=(s.bombTimer||0)-dt;if(s.bombTimer<=0){s.bombTimer=1.2;const e=this.identityTarget(Math.PI,250);if(e)s.bombs.push({x:this.x,y:this.y,tx:e.x,ty:e.y,time:.5});}}
  for(const b of s.bombs){b.time-=dt;const k=Math.min(1,dt/Math.max(dt,b.time));b.x+=(b.tx-b.x)*k;b.y+=(b.ty-b.y)*k;this.identityFx('bomb',b.x,b.y,this.a,25,dt+.01);if(b.time<=0)this.queueExplosionDamage(b.tx,b.ty,65,this.payloadPower(32),{grenade:true,fxSource:'bomb'})}s.bombs=s.bombs.filter(b=>b.time>0);
  if(this.pilot==='mckeever'&&active)this.rate/=1.25;
  if(this.pilot==='huffzky'&&active)this.rate/=1.3;
  if(this.pilot==='ball'){s.alone=!(w.allies||[]).some(a=>a.life>0&&distance(a,this)<320)&&!(w.players||[]).some(p=>p!==this&&alive(p)&&distance(p,this)<320);}
  if(this.pilot==='barker'&&s.escape){const esc=s.escape;esc.time-=dt;esc.quiet=s.clock-(s.lastDamage||0);this.speed*=1.35;this.baseSpeed*=1.35;if(distance(this,esc)>=260&&esc.quiet>=1){this.hp=Math.min(this.maxHp,this.hp+this.maxHp*(this.skillEnhanced?.25:.2));this.identityFx('gunSmoke',this.x,this.y,this.a,52,.4);s.escape=null}else if(esc.time<=0)s.escape=null;}
  if(this.pilot==='barker'&&!active)s.barkerReady=false;
  if(this.pilot==='berthold'&&s.debts.length){let payment=0;for(const d of s.debts){const paid=Math.min(d.amount,d.amount*dt/Math.max(dt,d.remaining));d.amount-=paid;d.remaining-=dt;payment+=paid}s.debts=s.debts.filter(d=>d.amount>1e-8);if(payment>0&&payment<this.hp){this.hp-=payment}else if(payment>0){const inv=this.invuln;this.payingPilotDebt=true;this.invuln=0;try{if(this.world)this.world.hitPlayer(this,payment,{gas:true});else this.hit(payment)}finally{this.payingPilotDebt=false;this.invuln=inv}}}
  // Bounded personal burns use the ordinary projectile/death pipeline in both modes.
  for(const [target,burn]of s.burns){const dead=target.destroyed||target.dead||target.hp<=0;if(dead){s.burns.delete(target);continue}burn.time-=dt;if(burn.time<=0){s.burns.delete(target);continue}burn.tick-=dt;if(burn.tick<=0){burn.tick=.25;const body=burn.body,raw=burn.part&&body?.support129?.parts.get(target.id),pos=raw?body.support129.world(raw.nx,raw.ny):null,x=pos?.x??(body?body.x+(burn.part?target.x:0):burn.enemy.x),y=pos?.y??(body?body.y+(burn.part?target.y:0):burn.enemy.y);this.bullets.push({x,y,vx:0,vy:0,life:.12,damage:burn.damage,ownerId:own(this),enemy:false,hit:new Set(),identityDot:true,identityDotTarget:target,actualExplosion:true,collisionRadius:2,pierce:false});this.identityFx('fireEngine',x,y,0,30,.22)}}
 };
 Game.prototype.updatePilotWing=function(a,dt){
  if(!commanders.has(this.pilot)||a.ownerId!==own(this))return false;
  const s=this.identityState(),active=this.skillTime>0,targets=this.enemies.filter(alive),slot=a.slot||0;let e=null;
  if(this.pilot==='goering'){if(!alive(s.commandTarget))s.commandTarget=this.identityTarget();e=active?s.commandTarget:null}
  if(!e&&targets.length){targets.sort((a,b)=>distance(a,this)-distance(b,this));const distributed=this.pilot==='boelcke'||this.pilot==='collishaw';if(distributed){targets.splice(Math.max(1,(this.combatWorld().allies||[]).filter(a=>a.life>0&&a.ownerId===own(this)).length));const side=e=>-(e.x-this.x)*Math.sin(this.a)+(e.y-this.y)*Math.cos(this.a);targets.sort((a,b)=>side(b)-side(a))}e=targets[distributed?slot%targets.length:0]}
  let target=this.wingFormationTarget(a,this.permanentWingCount());
  if(this.pilot==='boelcke'&&e){const side=slot%2?-1:1,entry=active?Math.max(0,1-(s.activeAge||0)/1.1):0,off=65+entry*100;target={x:e.x-Math.cos(e.a||0)*(active?120:180)-Math.sin(e.a||0)*side*off,y:e.y-Math.sin(e.a||0)*(active?120:180)+Math.cos(e.a||0)*side*off}}
  if(this.pilot==='collishaw'){const side=slot%2?-1:1,entry=active?Math.min(1,(s.activeAge||0)/.8):0,off=110+entry*110,forward=50+Math.sin(entry*Math.PI)*65;target={x:this.x-Math.sin(this.a)*side*off+Math.cos(this.a)*forward,y:this.y+Math.cos(this.a)*side*off+Math.sin(this.a)*forward}}
  if(this.pilot==='brumowski'&&active){const phase=s.clock*1.5+slot*Math.PI;target={x:this.x+Math.cos(phase)*100,y:this.y+Math.sin(phase)*100};e=targets.find(e=>distance(e,this)<340)||null;}
  a.life-=dt;a.invuln=Math.max(0,(a.invuln||0)-dt);a.hitFlash=Math.max(0,(a.hitFlash||0)-dt);a.muzzleFlash=Math.max(0,(a.muzzleFlash||0)-dt);const dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy),move=Math.min(clamp(dt*(active?3.5:2.6)),dt*(active?330:250)/Math.max(1,d));a.x+=dx*move;a.y+=dy*move;const splitting=active&&['boelcke','collishaw','brumowski'].includes(this.pilot)&&(s.activeAge||0)<.65,heading=splitting&&d>20?Math.atan2(dy,dx):e?Math.atan2(e.y-a.y,e.x-a.x):this.a;a.a+=(delta(heading,a.a||0))*Math.min(1,dt*7);
  a.fire-=dt;if(e&&distance(e,a)<650&&a.fire<=0){a.fire=.58*(a.permanent&&this.upgrades?.fighterSupply?.9:1)/((1+(this.commandRateBonus||0))*((this.combatWorld().players||[this]).some(p=>p.pilot==='mannock'&&p.hp>0)?1.15:1)*(active?(this.pilot==='goering'?1.6:1.25):1));const rear=Math.abs(delta(Math.atan2(a.y-e.y,a.x-e.x),e.a||0))>Math.PI*.72;const bonus=active&&this.pilot==='goering'?1.65:active&&this.pilot==='boelcke'&&rear?1.5:1;a.muzzleFlash=.09;a.fireHeading=a.a;this.identityShot(a.a,this.supportPower(5)*(this.wingmanDamageMult||1)*bonus*(a.permanent&&this.upgrades?.fighterSupply?1.2:1),{ally:true,speed:470},a)}
  return true;
 };
 const oldTickWorld=Game.prototype.tickRevisionWorld;
 Game.prototype.tickRevisionWorld=function(dt){oldTickWorld.call(this,dt);for(const d of this.revisionDecoys||[])if(d.identityDecoy){d.x+=d.vx*dt;d.y+=d.vy*dt}};
 installPilotFeedback(Game,PILOTS);
}
