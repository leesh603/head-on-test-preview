import {beginEquipmentLedger,recordEquipmentDoctrine} from './equipment-replacement.js';
import {wimperisTarget,correctWimperisBomb} from './flight-equipment.js';
import {BUILD_TRANSFER,AIRFRAME_TRANSFER_IDS,tickTransferGuns,transferStationPosition} from './build-airframe-transfer.js?v=buildfit1&afc=1';
// Sortie-only heavy-airframe fit. The selected plane and pilot remain authoritative.
import {BOMBER_TRANSFER_DESCRIPTION} from './airframe-doctrines.js';
export {BOMBER_TRANSFER_DESCRIPTION};
export const BOMBER_TRANSFER=Object.freeze({
 entente:Object.freeze({name:'Handley Page O/400',sprite:'bomber-transfer-o400',hp:3.5,hpCap:520,speed:.76,turn:.62,period:4.8,count:5,spacing:56,interval:.18,radius:96,damage:145,scale:2.28,front:39,rear:30,hullLength:30,hullWidth:57}),
 central:Object.freeze({name:'Gotha G.V',sprite:'bomber-transfer-gotha',hp:3.2,hpCap:480,speed:.8,turn:.66,period:4.5,count:3,spacing:37,interval:.15,radius:90,damage:185,scale:2.06,front:51,rear:41,hullLength:42,hullWidth:52})
});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const active=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed'&&!(p.heineckeEscape>0);
const world=p=>p.combatWorld?.()||p;

export const BOMBER_ENTRY_DURATION=2.6;
export function bomberEntryPose(p){
 const time=p.bomberTransfer?.entryTime;
 if(!Number.isFinite(time)||time>=BOMBER_ENTRY_DURATION)return null;
 const kind=p.bomberTransfer.kind;
 if(kind==='gunship'){const q=clamp((time-.9)/1.25,0,1);return {departing:time<.9,height:0,scale:time<.9?1:1.08-.08*q,alpha:time<.9?1-clamp(time/.9,0,.75):clamp(q*3,0,1)};}
 if(kind==='airship'){const q=clamp((time-.65)/1.95,0,1),height=(1-q)*(p.viewHeight||900)*.42;return {departing:time<.65,height:time<.65?0:height,scale:time<.65?1:1.35-.35*q,alpha:time<.65?1-time/.65:clamp(q*4,0,1)};}
 const departing=time<.65,q=clamp(departing?time/.65:(time-1.65)/.95,0,1);
 const altitude=departing?Math.sin(q*Math.PI/2):Math.pow(1-q,3);
 return {departing,height:altitude*(p.viewHeight||900)*.9,scale:1-altitude*.25,alpha:departing?1-clamp((q-.65)/.35,0,1):clamp(q*4,0,1)};
}

// Reuse the Scarff mount's bounded aiming and target scan for the bomber gun.
export function gunnerAim(current,desired,dt,turnRate){return current+clamp(wrap(desired-current),-turnRate*dt,turnRate*dt)}
export function gunnerTarget(p,range,rearOnly=false,sector=null){
 let target=null,best=range;const scan=e=>{
  if(!e||e.hp<=0)return;
  if(rearOnly&&(e.dead||e.crashing||e.rivalEscaped||e.surface||e.fieldUnit||e.stationary))return;
  const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);
  if(sector!==null&&Math.abs(wrap(Math.atan2(dy,dx)-sector))>Math.PI*.55)return;
  if(d>best||rearOnly&&Math.abs(wrap(Math.atan2(dy,dx)-p.a-Math.PI))>Math.PI*.48)return;
  best=d;target=e;
 };
 for(const e of world(p).enemies||[])scan(e);
 const bodies=world(p).stageBoss?.stages?.encounter?.bodies;
 if(bodies)for(const body of bodies.values())scan(body);
 return target;
}

// Swept hull intersection: wings grow wider without turning the whole sprite into a circle.
export function bomberRoundImpact(p,b,x0,y0){
 const fit=p.bomberTransfer;if(!fit)return null;
 const ca=Math.cos(p.a),sa=Math.sin(p.a),pad=b.flak?6:0,l=fit.hullLength+pad,w=fit.hullWidth+pad;
 const ox=x0-p.x,oy=y0-p.y,dx=b.x-x0,dy=b.y-y0;
 const u=(ox*ca+oy*sa)/l,v=(-ox*sa+oy*ca)/w,du=(dx*ca+dy*sa)/l,dv=(-dx*sa+dy*ca)/w;
 const c=u*u+v*v-1;if(c<=0)return 0;
 const a=du*du+dv*dv;if(!a)return null;
 const dot=u*du+v*dv,disc=dot*dot-a*c;if(disc<0)return null;
 const t=(-dot-Math.sqrt(disc))/a;return t>=0&&t<=1?t:null;
}
export function bomberContactPadding(p,e){
 const fit=p.bomberTransfer;if(!fit)return 0;
 const angle=Math.atan2(e.y-p.y,e.x-p.x)-p.a;
 return 1/Math.hypot(Math.cos(angle)/fit.hullLength,Math.sin(angle)/fit.hullWidth)-10;
}

// Each boss body shares three full bomb hits per salvo, even when proxies/parts overlap.
export function capBomberSalvoDamage(e,b,damage){
 const salvo=b.bomberSalvo;if(!salvo||!(e.stageBossBody||e.bossPilot||e.type==='boss'))return damage;
 const key=e.stageBossBody||e,used=salvo.bossDamage.get(key)||0;
 const cap=salvo.bossCap*(b.explosionDamage||b.damage)/(b.explosionBaseDamage||b.damage||1);
 const dealt=Math.max(0,Math.min(damage,cap-used));salvo.bossDamage.set(key,used+dealt);return dealt;
}

export function detonateFriendlyBomb(w,b){
 const p=w.players?w.players.find(p=>p.id===b.ownerId):w;
 if(!p||b.bomberTransfer&&(!active(p)))return;
 const previous=w.combatFX?.at(-1);
 p.queueExplosionDamage(b.x,b.y,b.radius,b.damage,{fxSource:'bomb',bomberSalvo:b.bomberSalvo,pilotSupport:!!b.pilotSupport});
 const effect=w.combatFX?.at(-1);if(effect&&effect!==previous){effect.impactWeapon=b.cooperBomb||b.sprite==='cooper'?'cooper':b.sprite==='puw'?'puw':'bomb';if(Number.isFinite(b.releaseAngle))effect.direction=b.releaseAngle;else if(Math.hypot(b.vx||0,b.vy||0)>0)effect.direction=Math.atan2(b.vy,b.vx);}
 if(b.tacticalBomb){const blast=w.bullets.at(-1);if(blast?.actualExplosion&&blast.ownerId===b.ownerId){blast.tacticalRound=true;blast.projectileCombo=b.projectileCombo;}}
}

function bombingTarget(p){
 let target=null,best=440;const w=world(p),scan=e=>{
  if(!e||!(e.hp>0)||e.dead||e.crashing||e.rivalEscaped)return;
  const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);
  if(d<best&&Math.abs(wrap(Math.atan2(dy,dx)-p.a))<Math.PI*.55){target=e;best=d;}
 };
 for(const e of w.enemies||[])scan(e);
 const bodies=w.stageBoss?.stages?.encounter?.bodies;if(bodies)for(const body of bodies.values())scan(body);
 return target;
}
function beginSalvo(p,fit){
 const target=p.upgrades?.wimperisSight?wimperisTarget(p,{range:440,cone:Math.PI*.55}):bombingTarget(p),source=target?.entity||target,lead=source&&!source.surface&&!source.stationary&&!source.stageBossBody?Math.min(140,(source.speed||0)*.85):0;
 fit.heading=p.a;fit.tx=target?target.x+Math.cos(source.a||0)*lead:p.x+Math.cos(p.a)*160;
 fit.ty=target?target.y+Math.sin(source.a||0)*lead:p.y+Math.sin(p.a)*160;
 fit.remaining=fit.count;fit.index=0;fit.drop=0;
 fit.salvo={bossDamage:new Map(),bossCap:p.payloadPower(fit.damage)*3};
 p.event('ally',fit.name+' · '+(fit.count===5?'융단폭격':'집중폭격'));
}
function releaseBomb(p,fit){
 const ca=Math.cos(fit.heading),sa=Math.sin(fit.heading),index=fit.index++,offset=(index-(fit.count-1)/2)*fit.spacing;
 const lateral=fit.count===5?[0,-28,28,-28,28][index]:[22,0,-22][index],flight=.85;
 const bomb={ownerId:p.id,sx:p.x-ca*5,sy:p.y-sa*5,x:fit.tx+ca*offset-sa*lateral,y:fit.ty+sa*offset+ca*lateral,life:flight,maxLife:flight,radius:fit.radius,damage:p.payloadPower(fit.damage),releaseAngle:fit.heading,sprite:fit.count===3?'puw':index%2?'hales':'cooper',bomberTransfer:true,bomberSalvo:fit.salvo};
 if(p.upgrades?.wimperisSight){bomb.wimperisCenterX=fit.tx;bomb.wimperisCenterY=fit.ty;}
 correctWimperisBomb(p,bomb);(world(p).friendlyBombs??=[]).push(bomb);
 fit.remaining--;fit.drop+=fit.interval;
}


const TRANSFER_DEFENSE_ARCS=Object.freeze({
 bomber:[Math.PI-.63,Math.PI-.25,Math.PI+.25,Math.PI+.63],
 gunship:[-.72,-.43,-.14,.14,.43,.72],
 airship:[0,Math.PI/3,2*Math.PI/3,Math.PI,4*Math.PI/3,5*Math.PI/3]
});
// Fire ordinary machine-gun projectiles; intercept only nearby incoming light rounds.
function transferDefenseVolley(p,fit){
 const w=world(p),kind=fit.kind||'bomber',range=kind==='airship'?190:kind==='gunship'?145:165;
 const maxIntercept=kind==='airship'?3:2;let intercepted=0;
 for(const bullet of w.bullets||[]){
  if(!bullet.enemy||bullet.life<=0||bullet.heavy||bullet.flak||bullet.hostileRocket||bullet.fieldShell||bullet.naval)continue;
  const dx=bullet.x-p.x,dy=bullet.y-p.y,d2=dx*dx+dy*dy;
  if(d2>range*range||dx*bullet.vx+dy*bullet.vy>=0)continue;
  const relative=wrap(Math.atan2(dy,dx)-p.a);
  if(kind==='gunship'&&Math.abs(relative)>1.22)continue;
  if(kind==='bomber'&&Math.abs(relative)<Math.PI*.53)continue;
  bullet.life=0;if(++intercepted>=maxIntercept)break;
 }
 const arcs=TRANSFER_DEFENSE_ARCS[kind],ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(let i=0;i<arcs.length;i++){
  const a=p.a+arcs[i],side=i%2?-1:1,station=fit.stations?.[i%(fit.stations?.length||1)];
  const front=kind==='bomber'?-fit.rear:kind==='airship'?(station?.front??fit.front*.45):fit.front*.7;
  const lateral=kind==='bomber'?side*fit.hullWidth*.36:kind==='airship'?(station?.lateral??side*fit.hullWidth*.6):side*fit.hullWidth*.5;
  const x=p.x+ca*front-sa*lateral,y=p.y+sa*front+ca*lateral;
  const shot={x,y,vx:Math.cos(a)*500,vy:Math.sin(a)*500,life:.78,enemy:false,ownerId:p.id,gun:0,damage:p.damage*p.normalGunMultiplier()*(kind==='gunship'?.64:kind==='airship'?.35:.47),hit:new Set(),transferDefense:true};
  w.bullets.push(p.applySpecialRound(shot,null));if(station)station.flash=.13;
 }
 if(kind==='bomber')fit.rearFlash=.14;
 p.event('shot','');
}
export function installBomberTransfer(Game,planes,scarff){
 const q=Game.prototype;
 q.acquireAirframeTransfer=function(id='bomberTransfer'){
  if(this.bomberTransfer||this.upgrades?.strutterAirbrake||AIRFRAME_TRANSFER_IDS.some(key=>this.upgrades?.[key]))return false;
  const config=(id==='bomberTransfer'?BOMBER_TRANSFER:BUILD_TRANSFER[id])?.[planes[this.plane]?.faction];if(!config)return false;
  beginEquipmentLedger(this);
  const ratio=this.maxHp?this.hp/this.maxHp:1;
  this.bomberTransfer={...config,id,entryTime:0,cooldown:config.period,remaining:0,drop:0,rearTimer:.2,rearAim:this.a+Math.PI,rearFlash:0,yaw:0};
  const oldHp=this.maxHp;this.maxHp=Math.min((config.hpCap??Infinity)*(this.upgrades?.loEmblem?.5:1),this.maxHp*config.hp);this.hp=this.maxHp*ratio;this.bomberTransfer.hpMultiplier=this.maxHp/oldHp;this.transferBaseRate=this.rate;
  this.enemyCruiseReference??=this.baseSpeed??this.speed;
  this.speed*=config.speed;if(this.baseSpeed)this.baseSpeed*=config.speed;this.turn*=config.turn;
  if(config.kind==='airship'){
   const count=this.permanentWingman||0;this.bomberTransfer.escortBonus=Math.max(0,Math.min(3,7-count));
   this.permanentWingman=count+this.bomberTransfer.escortBonus;this.wingmanDamageMult=(this.wingmanDamageMult||1)*1.35;
  }
  recordEquipmentDoctrine(this,id);
  this.airframeSpeed=1;this.event('ally',(id==='mgTransfer'?'집중화력 개조 · ':id==='airshipTransfer'?'공중함대 지휘 · ':'폭격비행대 전속 · ')+config.name);return true;
 };
 q.acquireBomberTransfer=function(){return this.acquireAirframeTransfer('bomberTransfer');};
 q.clearAirframeTransfer=function(){const fit=this.bomberTransfer;if(!fit)return false;const ratio=this.maxHp?this.hp/this.maxHp:0;this.maxHp/=fit.hpMultiplier||fit.hp;this.hp=this.maxHp*ratio;this.speed/=fit.speed;if(this.baseSpeed)this.baseSpeed/=fit.speed;this.turn/=fit.turn;if(fit.kind==='airship'){this.wingmanDamageMult=(this.wingmanDamageMult||1)/1.35;this.permanentWingman=Math.max(0,(this.permanentWingman||0)-(fit.escortBonus||0));const w=world(this);let kept=0;w.allies=w.allies.filter(a=>{if(!a.permanent||a.ownerId!==this.id)return true;delete a.carrierLaunchAt;delete a.carrierHidden;delete a.carrierScale;return kept++<this.permanentWingman;});}delete this.upgrades[fit.id||'bomberTransfer'];delete this.bomberTransfer;this.airframeSpeed=1;return true;};
 q.isBomberEntering=function(){return Number.isFinite(this.bomberTransfer?.entryTime)&&this.bomberTransfer.entryTime<BOMBER_ENTRY_DURATION;};
 // Command data belongs to this sortie and owner; existing allies, guns and upgrades do the work.
 q.airshipFocusTarget=function(){
  const fit=this.bomberTransfer;if(fit?.kind!=='airship')return null;
  const e=fit._netCarrierFocus,w=world(this);
  if(e?.hp>0&&!e.dead&&!e.crashing&&!e.rivalEscaped&&this.t<=fit.focusUntil&&w.enemies.includes(e)&&Math.hypot(e.x-this.x,e.y-this.y)<=620)return e;
  fit._netCarrierFocus=null;return null;
 };
 q.airshipWingTarget=function(){
  const fit=this.bomberTransfer;if(fit?.kind!=='airship')return null;
  const focus=this.airshipFocusTarget();if(focus)return focus;
  if(this.t>=(fit.scanAt??-1)||fit._netCarrierGuard&&(fit._netCarrierGuard.hp<=0||fit._netCarrierGuard.crashing||!world(this).enemies.includes(fit._netCarrierGuard))){
   fit.scanAt=this.t+.2;fit._netCarrierGuard=null;let best=520;
   for(const e of world(this).enemies){if(!(e.hp>0)||e.dead||e.crashing||e.rivalEscaped)continue;const d=Math.hypot(e.x-this.x,e.y-this.y);if(d<best){best=d;fit._netCarrierGuard=e;}}
  }
  return fit._netCarrierGuard&&Math.hypot(fit._netCarrierGuard.x-this.x,fit._netCarrierGuard.y-this.y)<=560?fit._netCarrierGuard:null;
 };
 const impact=q.specialRoundImpact;
 q.specialRoundImpact=function(b,e){const result=impact.call(this,b,e);const fit=this.bomberTransfer;
  if(fit?.kind==='airship'&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.ghost&&!b.transferGun&&!b.identityDot&&(!b.ownerId||b.ownerId===this.id)&&e.hp>0){fit._netCarrierFocus=e;fit.focusUntil=this.t+1.8;}
  return result;
 };
 const formation=q.wingFormationTarget;
 q.wingFormationTarget=function(a,count){
  if(this.bomberTransfer?.kind!=='airship'||!a.permanent||this.upgrades.lufberyCircle||this.skillTime>0&&['goering','boelcke','collishaw','brumowski'].includes(this.pilot))return formation.call(this,a,count);
  const slot=a.slot??0,side=slot%2?-1:1,row=Math.floor(slot/2),phase=this.t*.75+slot*.65;
  return transferStationPosition(this,38-row*75+Math.sin(phase)*18,side*(145+row*32)+Math.cos(phase)*12);
 };
 const pilotWing=q.updatePilotWing;
 q.updatePilotWing=function(a,dt){
  if(this.bomberTransfer?.kind==='airship'&&a.ownerId===this.id&&Number.isFinite(a.carrierLaunchAt)){
   const age=this.t-a.carrierLaunchAt,q=clamp(age/1.15,0,1),ease=q*q*(3-2*q),home=this.wingFormationTarget(a,this.permanentWingCount());
   const start=transferStationPosition(this,-14,(a.slot%2?-1:1)*22);
   a.x=start.x+(home.x-start.x)*ease;a.y=start.y+(home.y-start.y)*ease;a.a=this.a+(a.slot%2?-1:1)*Math.sin(q*Math.PI)*.65;
   a.carrierHidden=age<0;a.carrierScale=.45+.55*q;a.muzzleFlash=0;a.fire=.2;
   if(q<1)return true;delete a.carrierLaunchAt;delete a.carrierHidden;delete a.carrierScale;
  }
  return pilotWing?.call(this,a,dt)||false;
 };
 q.bomberGunMount=function(gun=0,angle=this.a,offset=0){
  const fit=this.bomberTransfer;if(!fit)return {x:this.x+Math.cos(angle)*23-Math.sin(angle)*offset,y:this.y+Math.sin(angle)*23+Math.cos(angle)*offset};
  const back=this.weapon.bidirectional&&gun===1,forward=back?-fit.rear:fit.front,ca=Math.cos(this.a),sa=Math.sin(this.a);
  return {x:this.x+ca*forward-Math.sin(angle)*offset,y:this.y+sa*forward+Math.cos(angle)*offset};
 };
 q.tickBomberTransfer=function(dt){
  const fit=this.bomberTransfer;if(!fit||!active(this))return;
  const step=clamp(dt||0,0,.04);if(!step)return;
  if(this.isBomberEntering()){
   const before=fit.entryTime;fit.entryTime=Math.min(BOMBER_ENTRY_DURATION,before+step);this.muzzleFlash=0;
   const beats=fit.kind==='gunship'?[.45,.9,1.45]:fit.kind==='airship'?[.7,1.4,2.05]:[1.3,1.54,1.78];
   for(const beat of beats)if(before<beat&&fit.entryTime>=beat)this.event('bossSound',fit.kind==='gunship'?'reload':fit.kind==='airship'?'formationPass':'explosion');
   return;
  }
  if(fit.defenseTime>0){fit.defenseTime=Math.max(0,fit.defenseTime-step);fit.defenseBeat-=step;if(fit.defenseTime>0&&fit.defenseBeat<=0){transferDefenseVolley(this,fit);fit.defenseBeat+=.14;}}
  if(fit.kind){tickTransferGuns(this,step,gunnerAim,gunnerTarget);if(fit.kind==='airship')return;}
  if(!fit.kind){fit.cooldown-=step;if(fit.cooldown<=0){fit.cooldown+=this.ordnanceInterval(fit.period);beginSalvo(this,fit);}
  if(fit.remaining>0){fit.drop-=step;if(fit.drop<=0)releaseBomb(this,fit);}
  }
  fit.rearFlash=Math.max(0,fit.rearFlash-step);
  if(this.bishopTime>0||this.ballCloak>0||this.aceRetreat129){fit.rearFlash=0;return;}
  // Existing two-seater pilots retain their authored rear gun, ammo and skills.
  if(this.weapon.bidirectional||['huffzky','mckeever'].includes(this.pilot))return;
  const target=gunnerTarget(this,scarff.scarffRange,true),desired=target?Math.atan2(target.y-this.y,target.x-this.x):this.a+Math.PI;
  fit.rearAim=gunnerAim(fit.rearAim,desired,step,scarff.scarffTurnRate);
  fit.rearTimer=Math.max(0,fit.rearTimer-step);
  if(!target||fit.rearTimer>0||Math.abs(wrap(fit.rearAim-desired))>.16)return;
  fit.rearTimer=this.ordnanceInterval(scarff.scarffInterval);fit.rearFlash=.09;
  const a=fit.rearAim,x=this.x-Math.cos(this.a)*fit.rear,y=this.y-Math.sin(this.a)*fit.rear;
  world(this).bullets.push({x,y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:1.25,enemy:false,ownerId:this.id,ally:true,bomberRear:true,damage:scarff.scarffDamage*(1+(this.gunUpgradeBonus||0)),hit:new Set()});this.event('shot','');
 };
 q.resetBomberSortieTimers=function(){const fit=this.bomberTransfer;if(fit){fit.launchSequence=0;fit._netCarrierFocus=null;fit._netCarrierGuard=null;fit.entryTime=BOMBER_ENTRY_DURATION;fit.remaining=0;fit.salvo=null;fit.cooldown=fit.period;fit.rearTimer=.2;fit.rearFlash=0;fit.yaw=0;fit.evadeTurn=0;fit.defenseTime=0;fit.defenseBeat=0;for(const station of fit.stations||[]){station.timer=.2;station.flash=0;station.reload=0;station.ammo=Math.round(fit.belt*(this.upgrades?.maximBelt?1.75:1));station.aim=this.a;}}};
 const begin=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){this.transferFiring=input.inputMode!=='gamepad'||!!input.fireHeld;return begin.call(this,dt,input);};
 const hit=q.hit;
 q.hit=function(...args){if(this.isBomberEntering()&&this.hp>0)return;const result=hit.apply(this,args);if(this.bomberTransfer&&this.hp<=0){this.resetBomberSortieTimers();this.friendlyBombs=(this.friendlyBombs||[]).filter(b=>!b.bomberTransfer||b.ownerId!==this.id);}return result;};
 const evade=q.evade;
 q.evade=function(){
  if(!this.bomberTransfer)return evade.call(this);
  if(!active(this)||this.evadeCooldown>0||this.isBomberEntering())return false;
  const fit=this.bomberTransfer;this.evadeCooldown=6*(this.evadeCooldownMult||1);
  this.evadeTime=0;fit.evadeTurn=0;fit.defenseTime=.94;fit.defenseBeat=.14;
  transferDefenseVolley(this,fit);
  this.event('ally',fit.kind==='gunship'?'중무장 화망 전개':fit.kind==='airship'?'대공 방어망 전개':'후방 방어사격');
  return true;
 };
 const round=q.applySpecialRound;
 q.applySpecialRound=function(b,type){
  const fit=this.bomberTransfer;
  const gunRound=fit&&!b.enemy&&!b.ally&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.transferDefense&&b.gun!==undefined;
  if(fit?.kind==='gunship'&&gunRound&&!b.transferGun)b.damage*=1.4;
  // Correct before pilot processing too: authored duplicate rounds inherit this origin.
  const mount=gunRound?(b.transferGun?transferStationPosition(this,fit.stations[b.transferStation].front,fit.stations[b.transferStation].lateral):this.bomberGunMount(b.gun,this.gunDirection(b.gun),this.weapon.bidirectional?0:(b.gun-(this.weapon.guns-1)/2)*8)):null;
  if(mount)Object.assign(b,mount);
  const start=world(this).bullets?.length||0,heading=this.a;let result;
  try{if(b.transferGun)this.a=fit.stations[b.transferStation].aim;result=round.call(this,b,type);}finally{this.a=heading;}
  if(mount){Object.assign(result||b,mount);for(let i=start;i<(world(this).bullets?.length||0);i++){const copy=world(this).bullets[i];if(copy.gun===b.gun&&copy.jacobsSuppress)Object.assign(copy,mount);}}
  return result;
 };
 const fly=q.flyAirframe;
 q.flyAirframe=function(dt,input={}){
  const fit=this.bomberTransfer;if(!fit||this.aceRetreat129||this.chargeTime>0)return fly.call(this,dt,input);
  const step=clamp(dt||0,0,.04);if(!step)return;
  const before=this.a,current=this.airframeSpeed??1;
  // Run all existing pilot hooks first; smooth their requested yaw into heavy inertia.
  fly.call(this,step,input);
  const requested=wrap(this.a-before)/step;
  if(!(this.evadeTime>0))fit.evadeTurn=0;
  fit.yaw+=(requested-fit.yaw)*(1-Math.exp(-step*(fit.response||3)));this.a=before+fit.yaw*step;
  const effort=this.turn?Math.min(1,Math.abs(fit.yaw/this.turn)):0,target=1-.22*effort*effort;
  this.airframeSpeed=current+(target-current)*(1-Math.exp(-step*(target<current?1.6:fit.recovery||.65)*(1+(this.energyRecoveryBonus||0))));
 };
}
