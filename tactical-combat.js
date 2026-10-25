// Sortie-local tactical consequences. Uses the existing rounds, grenades,
// escape repair and wing engagement loop; never changes a pilot's skill.
import {combatImpactResult} from './combat-impact-result.js';
export const TACTICAL_COMBAT_BALANCE=Object.freeze({reinforcements:2,wingCap:9,reinforcementDamage:.55,passEntry:.45,passWindow:.7,passExit:190,passCooldown:4,counterWindow:3,counterCooldown:8,repairCooldown:12,linkCooldown:4,bombCooldown:6,coverCooldown:7});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const world=p=>p.combatWorld?.()||p;
const alive=e=>e&&e.hp>0&&e.alive!==false&&!e.dead&&!e.expired&&!e.crashing&&!e.rivalEscaped;
const targets=p=>{const w=world(p);return [...(w.enemies||[]),...(w.eliteEnemies?.members||[])];};
const gun=b=>b&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.ghost&&!b.rocket&&!b.blast&&!b.actualExplosion&&!b.motorCannon&&!b.cow37&&!b.mauserRound&&!b.fonckSeeker&&!b.fonckSalvo&&!b.tacticalRound;
const state=p=>{if(!p._netTacticalCombat||p._netTacticalCombat.upgrades!==p.upgrades||p.t<p._netTacticalCombat.lastAt)p._netTacticalCombat={upgrades:p.upgrades,lastAt:p.t,passReady:true};p._netTacticalCombat.lastAt=p.t;return p._netTacticalCombat;};
const handledImpacts=new WeakMap();
const ready=(s,key,now,cooldown)=>{if(now<(s[key]||0))return false;s[key]=now+cooldown;return true;};
const livePlayer=p=>p.hp>0&&(!p.status||p.status==='alive')&&(!world(p).state||world(p).state==='playing');
function nearest(p,range,origin=p,cone=null){let result=null,best=range;for(const e of targets(p)){if(!alive(e)||cone!=null&&Math.abs(angle(Math.atan2(e.y-origin.y,e.x-origin.x),p.a))>cone)continue;const d=distance(e,origin);if(d<best){result=e;best=d;}}return result;}
// Short, replicated cues share the existing FX lifetime/culling lane. A light
// doctrine cue can replace only another doctrine cue, never a boss explosion.
function cue(p,id,target=p,interval=.55){
 const w=world(p),s=state(p),now=w.t??p.t??0;s.cues??={};if(now<(s.cues[id]??-Infinity))return;
 const list=w.combatFX??=[],limit=w.viewWidth<=720?6:10;let count=0,oldest=-1;
 for(let i=0;i<list.length;i++)if(list[i].fxProfile==='tactical'){count++;if(oldest<0)oldest=i;}
 if(count>=limit)list.splice(oldest,1);if(list.length>=35)return;s.cues[id]=now+interval;
 list.push({fxProfile:'tactical',tacticalCue:id,x:p.x,y:p.y,a:p.a,targetX:target.x,targetY:target.y,ownerId:p.id||'p1',radius:28,life:.65,maxLife:.65,feedbackId:'tactic:'+(w.combatFeedbackSerial=(w.combatFeedbackSerial||0)+1)});
 // A single sortie-local notice accompanies the first real action, never acquisition.
 s.announced??={};if(!s.announced[id]){s.announced[id]=true;p.event?.('tacticalActivation',id);}
}
function damage(p,n){return typeof p.payloadPower==='function'?p.payloadPower(n):n;}
function payload(p,target,{rear=false,base=34}={}){
 const w=world(p);if(!livePlayer(p)||(rear?(w.friendlyBombs?.length||0)>48:(w.bullets?.length||0)>480))return false;
 // Killing hits can still link into the next live aircraft. Preserve the proc
 // when no suitable forward target remains instead of firing at the wreck.
 if(!rear&&!alive(target)){target=nearest(p,650,p,.65);if(!target)return false;}
 const area=p.weaponMods?.EXPLOSIVE==='area',focus=p.weaponMods?.EXPLOSIVE==='focus',count=area?2:1;
 const heading=rear?p.a+Math.PI:Math.atan2(target.y-p.y,target.x-p.x);
 for(let i=0;i<count;i++){const a=heading+(area?(i-.5)*.28:0),power=damage(p,base*(area?.55:focus?1.12:1));
  // A blocking bomb must burst on the pursuit lane even if no aircraft
  // touches it. Reuse the shared timed-bomb pipeline in solo and co-op.
  if(rear){const life=.55,reach=120,radius=area?104:focus?62:84;
   (w.friendlyBombs??=[]).push({ownerId:p.id||'p1',sx:p.x,sy:p.y,x:p.x+Math.cos(a)*reach,y:p.y+Math.sin(a)*reach,life,maxLife:life,releaseAngle:a,radius,damage:power,tacticalPayloadApplied:true,tacticalBomb:true});
   continue;
  }
  (w.bullets??=[]).push({x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:Math.cos(a)*480,vy:Math.sin(a)*480,life:1.6,enemy:false,ownerId:p.id||'p1',damage:power,rocket:true,upgradeRocket:true,tacticalRound:true,explosionDamage:power,explosionBaseRadius:area?104:focus?62:84,collisionRadius:10,hit:new Set()});
 }
 return true;
}
function burst(p,b,amount=2,style=b.tacticalStyle){
 const w=world(p);if((w.bullets?.length||0)>480)return;
 const heading=Math.atan2(b.vy,b.vx),speed=Math.hypot(b.vx,b.vy)||470,fan=p.weaponMods?.GUN==='precision'?.035:p.weaponMods?.GUN==='suppression'?.22:.12;
 for(let i=0;i<amount;i++){const a=heading+(i-(amount-1)/2)*fan*2;(w.bullets??=[]).push({...b,ownerId:p.id||'p1',enemy:false,x:p.x+Math.cos(a)*24,y:p.y+Math.sin(a)*24,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:Math.min(1.2,b.life||1.2),damage:b.damage*.32,tacticalRound:true,tacticalStyle:style,hit:new Set(),pierce:false});}
}

export function installTacticalCombat(Game,{PLANES={}}={}){
 if(Game.prototype.__tacticalCombat)return;Game.prototype.__tacticalCombat=true;
 Game.prototype.tacticalWingDamage=function(wing){return wing?.permanent&&!wing.aceWingman&&wing.ownerId===(this.id||'p1')&&this.weaponMods?.FORMATION==='reinforcement'&&wing.slot>=Math.min(7,this.permanentWingman||0)?TACTICAL_COMBAT_BALANCE.reinforcementDamage:1;};
 Game.prototype.tacticalWingMode=function(){return this.weaponMods?.FORMATION||(['crossfire','formationBreakthrough','guidedBombing','mutualCover'].includes(this.compositeTactic)?'escort':null);};
 Game.prototype.tacticalWingOrder=function(wing){
  const s=state(this),now=this.t||0;
  if(this.compositeTactic==='mutualCover'&&s.damagedUntil>now){const e=nearest(this,280);if(e)return{target:e,guard:true};}
  if(['crossfire','formationBreakthrough'].includes(this.compositeTactic)&&s.commandUntil>now&&alive(s.commandTarget))return{target:s.commandTarget,cross:this.compositeTactic==='crossfire',breakthrough:this.compositeTactic==='formationBreakthrough'};
  return null;
 };
 const ensure=Game.prototype.ensureWingmen;
 Game.prototype.ensureWingmen=function(...args){
  const base=this.permanentWingman||0,reinforced=this.weaponMods?.FORMATION==='reinforcement';
  if(reinforced)this.permanentWingman=Math.min(TACTICAL_COMBAT_BALANCE.wingCap,Math.min(7,base)+2);
  try{ensure?.apply(this,args);}finally{if(reinforced)this.permanentWingman=base;}
  for(const wing of world(this).allies||[])if(wing.permanent&&!wing.aceWingman&&wing.ownerId===(this.id||'p1'))wing.tacticalReinforcement=!!(reinforced&&wing.slot>=Math.min(7,base));
  if(this.weaponMods?.FORMATION==='elite')for(const wing of world(this).allies||[]){if(!wing.permanent||wing.aceWingman||wing.ownerId!==(this.id||'p1')||wing.tacticalElite)continue;
   // Preserve authored pilot airframes and fighter-supply's existing conversion.
   if(!['goering','collishaw','brumowski','boelcke'].includes(this.pilot)&&!this.upgrades?.fighterSupply){const model=PLANES[this.plane]?.faction==='central'?'fokkerd7':'se5a';if(PLANES[model])wing.plane=model;}
   wing.tacticalElite=true;
  }
 };
 const received=Game.prototype.buildReceivedDamage;
 Game.prototype.buildReceivedDamage=function(before){
  received?.call(this,before);const lost=before-this.hp;if(!(lost>0)||this.hp<=0)return;
  const s=state(this),now=this.t||0;s.damagedUntil=now+4;s.damageOrigin={x:this.x,y:this.y};s.damageLost=lost;s.escapeUsed=false;s.blockUsed=false;
  if(this.weaponMods?.SURVIVAL==='counter'){this.buildEscapeRepair=null;if(ready(s,'counterAt',now,8))s.counterUntil=now+3;}
  if(this.weaponMods?.SURVIVAL==='repair'&&ready(s,'repairAt',now,12)){
   this.buildLastDamageAt=now;this.buildEscapeRepair={x:this.x,y:this.y,until:now+6,budget:Math.min(lost*.4,this.maxHp*.08)};this.buildRepairCooldownUntil=now+12;
  }
 };
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,...args){
  const before=this.a,hp=this.hp,result=fly.call(this,dt,...args);if(!livePlayer(this))return result;
  const s=state(this),step=clamp(Number(dt)||0,0,.05),now=this.t||0,yaw=Math.abs(angle(this.a,before));
  s.turning=yaw>step*.24&&!this.evadeTime&&!this.chargeTime;s.turnTime=s.turning?(s.turnTime||0)+step:0;
  const fast=(this.airframeSpeed??1)>=.86&&(this.buildStraightTime||0)>=.45&&!this.evadeTime&&!this.chargeTime;
  s.fast=fast;
  if(this.weaponMods?.SURVIVAL==='repair'&&this.hp>hp+1e-9)cue(this,'survivalRepair',this,.35);
  if(!s.passReady&&s.passOrigin&&now>=(s.passAt||0)&&distance(this,s.passOrigin)>=190&&!nearest(this,120))s.passReady=true;
  if(s.passUntil>now&&fast)this.airframeSpeed=Math.min(1,(this.airframeSpeed??1)+step*.09);
  if(this.compositeTactic==='emergencyEscape'&&!s.escapeUsed&&s.damagedUntil>now&&s.damageOrigin&&distance(this,s.damageOrigin)>=160&&!nearest(this,170)){
   s.escapeUsed=true;this.evadeCooldown=Math.max(0,(this.evadeCooldown||0)-2);this.reloadTime=Math.max(0,(this.reloadTime||0)-.6);cue(this,'emergencyEscape');
   if(this.weaponMods?.SURVIVAL==='repair'&&this.buildEscapeRepair)this.buildEscapeRepair.until=Math.max(this.buildEscapeRepair.until,now+2);
   this.event?.('ally','긴급 이탈 · 재정비');
  }
  if(this.compositeTactic==='blockingBombing'&&!s.blockUsed&&s.damagedUntil>now&&s.damageOrigin&&distance(this,s.damageOrigin)>=90&&now>=(s.blockingAt||0)){
   const target={x:this.x-Math.cos(this.a)*120,y:this.y-Math.sin(this.a)*120};if(payload(this,target,{rear:true,base:38})){s.blockUsed=true;s.blockingAt=now+8;cue(this,'blockingBombing',target);this.event?.('ally','차단 폭격 · 후방 투하');}
  }
  return result;
 };
 Game.prototype.tacticalGunRound=function(b){
  if(!(gun(b)||b?.cow37)||b.tacticalGunApplied||!livePlayer(this))return b;b.tacticalGunApplied=true;
  const s=state(this),now=this.t||0,entry=s.fast?nearest(this,Math.min(650,Math.hypot(b.vx,b.vy)*(b.life||1.2)),this,.42):null;
  if(this.weaponMods?.GUN)b.tacticalStyle=this.weaponMods.GUN;
  const gunTarget=this.weaponMods?.GUN?nearest(this,540,this,.5):null;
  if(gunTarget)cue(this,this.weaponMods.GUN==='precision'?'gunPrecision':'gunSuppression',gunTarget,.8);
  if(this.weaponMods?.SPEED==='strike'&&entry&&s.passReady){s.passReady=false;s.passOrigin={x:this.x,y:this.y};s.passUntil=now+.7;s.passAt=now+4;cue(this,'speedStrike',entry);}
  if(this.weaponMods?.SPEED==='strike'){
   if(s.passUntil>now){b.pierce=true;b.tacticalStyle='strike';b.life=Math.min(b.life||1.5,1.5);b.damage*=1.25;}
  }
  if(this.weaponMods?.SPEED==='duel'){
   b.life=Math.min(b.life||1.5,1.2);
   if(s.turnTime>=.22){const e=nearest(this,250,this,.5);if(e&&Math.abs(angle(Math.atan2(this.y-e.y,this.x-e.x),(e.a||0)+Math.PI))<.85)b.damage*=1.2;}
  }
  if(this.compositeTactic==='highSpeedIntercept'&&entry&&(!s.interceptOrigin||distance(this,s.interceptOrigin)>=190)&&ready(s,'interceptAt',now,this.weaponMods?.SPEED==='duel'?5:4)){
   s.interceptOrigin={x:this.x,y:this.y};b.pierce=true;b.tacticalStyle='intercept';burst(this,b,this.weaponMods?.GUN==='suppression'?2:1,'intercept');cue(this,'highSpeedIntercept',entry);
  }
  const counter=this.weaponMods?.SURVIVAL==='counter'&&s.counterUntil>now,defense=this.compositeTactic==='defensiveSuppression'&&s.damagedUntil>now;
  if(counter||defense){const e=nearest(this,240,this,.65);if(e){
   if(counter){b.damage*=1.25;b.tacticalStyle='counter';if(s.counterBurstUntil!==s.counterUntil){s.counterBurstUntil=s.counterUntil;b.pierce=true;burst(this,b,2,'counter');cue(this,'survivalCounter',e);}}
   if(defense&&ready(s,'defenseAt',now,8)){burst(this,b,2,'counter');cue(this,'defensiveSuppression',e);let removed=0;for(const hostile of world(this).bullets||[]){if(removed>=2)break;if(hostile.enemy&&hostile.life>0&&!hostile.flak&&!hostile.heavyShell&&distance(hostile,this)<150&&Math.abs(angle(Math.atan2(hostile.y-this.y,hostile.x-this.x),this.a))<.8){hostile.life=0;removed++;}}}
  }}
  return b;
 };
 const apply=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(round,...args){return this.tacticalGunRound(apply?.call(this,round,...args)||round);};
 const cow=Game.prototype.createCow37Round;
 if(cow)Game.prototype.createCow37Round=function(...args){const b=cow.apply(this,args);if(this.weaponMods?.GUN==='precision'&&Number.isFinite(this.cow37Timer)){const s=state(this);s.cowBurst=((s.cowBurst||0)+1)%3;const interval=this.ordnanceInterval?.(1)||1;this.cow37Timer+=interval*((s.cowBurst?.25:2.5)-1);}return b;};
 // Both worlds call this immediately before projectile movement and collision.
 // Transform heavy equipment here because those emitters bypass applySpecialRound.
 const prepare=Game.prototype.prepareProjectileCandidates;
 Game.prototype.prepareProjectileCandidates=function(...args){
  const owners=this.players||[this],w=world(this),initial=(w.bullets||[]).length;
  for(let i=0;i<initial;i++){const b=w.bullets[i];if(!b||b.enemy||b.tacticalPayloadApplied||b.tacticalRound||!(b.cow37||b.motorCannon||b.upgradeRocket||b.ally))continue;
   const p=owners.find(o=>(o.id||'p1')===(b.ownerId||'p1'));if(!p)continue;b.tacticalPayloadApplied=true;
   if(b.ally){const wing=(w.allies||[]).find(a=>a.ownerId===(p.id||'p1')&&a.slot===b.tacticalWingSlot);
    if(wing?.weaponModFormation==='reinforcement'||wing?.weaponModFormation==='elite')cue(p,wing.weaponModFormation==='elite'?'wingElite':'wingReinforcement',wing,.8);
    if(wing?.weaponModFormation&&['crossfire','formationBreakthrough','mutualCover'].includes(p.compositeTactic))cue(p,p.compositeTactic,wing,.8);
    continue;
   }
   if(b.upgradeRocket){if(p.weaponMods?.EXPLOSIVE)cue(p,p.weaponMods.EXPLOSIVE==='focus'?'explosiveFocus':'explosiveArea');continue;}
   let heading=Math.atan2(b.vy,b.vx),speed=Math.hypot(b.vx,b.vy),explosive=p.weaponMods?.EXPLOSIVE;
   if(b.cow37&&p.weaponMods?.GUN==='precision'){const e=nearest(p,650,p,.5);if(e){const desired=Math.atan2(e.y-b.y,e.x-b.x);heading+=clamp(angle(desired,heading),-.08,.08);}b.collisionRadius=Math.min(b.collisionRadius||13,10);}
   const spread=b.cow37&&p.weaponMods?.GUN==='suppression';
   if(spread){b.damage*=.34;for(const side of [-1,1])if(w.bullets.length<480)w.bullets.push({...b,vx:Math.cos(heading+side*.14)*speed,vy:Math.sin(heading+side*.14)*speed,hit:new Set(),tacticalRound:true});}
   if(explosive==='focus'){const e=nearest(p,650,p,.3);if(e)heading+=clamp(angle(Math.atan2(e.y-b.y,e.x-b.x),heading),-.12,.12);}
   if(explosive==='area'){const s=state(p);s.heavyLane=((s.heavyLane||0)+1)%3;heading+=(s.heavyLane-1)*.18;b.tacticalAreaShell=true;b.damage*=.82;}
   b.vx=Math.cos(heading)*speed;b.vy=Math.sin(heading)*speed;
   if(explosive)cue(p,explosive==='focus'?'explosiveFocus':'explosiveArea');
   if(b.cow37)p.tacticalGunRound(b);
  }
  for(const grenade of w.grenades||[]){if(grenade.tacticalPayloadApplied)continue;const p=owners.find(o=>(o.id||'p1')===(grenade.ownerId||'p1'));if(p?.weaponMods?.EXPLOSIVE){grenade.tacticalPayloadApplied=true;cue(p,p.weaponMods.EXPLOSIVE==='focus'?'explosiveFocus':'explosiveArea');}}
  for(const bomb of w.friendlyBombs||[]){if(bomb.tacticalPayloadApplied||bomb.bishopBomb)continue;const p=owners.find(o=>(o.id||'p1')===(bomb.ownerId||'p1'));if(!p||!p.weaponMods?.EXPLOSIVE)continue;bomb.tacticalPayloadApplied=true;
   const s=state(p),focus=p.weaponMods.EXPLOSIVE==='focus';let target=s.bombTarget;if(!alive(target)||distance(p,target)>750)target=nearest(p,750);s.bombTarget=target;
   if(focus&&target){if(!bomb.wimperisPrepared){bomb.x=target.x+(target.vx||0)*.12;bomb.y=target.y+(target.vy||0)*.12;}bomb.radius*=.8;}
   else if(!focus){s.bombLane=((s.bombLane||0)+1)%3;const offset=(s.bombLane-1)*95;bomb.x-=Math.sin(p.a)*offset;bomb.y+=Math.cos(p.a)*offset;bomb.radius*=1.15;bomb.damage*=.85;}
   cue(p,focus?'explosiveFocus':'explosiveArea',bomb);
  }
  return prepare?.apply(this,args);
 };
 const impact=Game.prototype.specialRoundImpact;
 Game.prototype.specialRoundImpact=function(b,e){
  const result=impact?.call(this,b,e);if(!b||b.enemy||b.patrol||b.tacticalRound||b.ownerId&&b.ownerId!==(this.id||'p1')||!livePlayer(this)||!e)return result;
  let hits=handledImpacts.get(b);if(!hits){hits=new WeakSet();handledImpacts.set(b,hits);}if(hits.has(e))return result;hits.add(e);
  const s=state(this),now=this.t||0,ownGun=gun(b)||b.cow37;
  if(b.tacticalAreaShell&&!b.tacticalAreaDetonated){b.tacticalAreaDetonated=true;this.queueExplosionDamage?.(e.x,e.y,74,b.damage*.22,{secondaryExplosion:true,exclude:e});}
  if(!(combatImpactResult(b,e)?.damage>0))return result;
  if(ownGun){
   const same=s.hitTarget===e&&now-(s.hitAt||0)<1.3;s.hitCount=same?(s.hitCount||0)+1:1;s.hitTarget=e;s.hitAt=now;
   if(this.weaponMods?.SPEED==='duel'&&s.turnTime>=.22&&distance(this,e)<250&&Math.abs(angle(Math.atan2(this.y-e.y,this.x-e.x),(e.a||0)+Math.PI))<.85&&ready(s,'duelAt',now,1.6)){burst(this,b,1,'duel');cue(this,'speedDuel',e);}
   if(this.compositeTactic==='fireLink'&&s.hitCount>=3&&now>=(s.fireLinkAt||0)&&payload(this,e,{base:34})){s.fireLinkAt=now+4;cue(this,'fireLink',e);}
   if(this.compositeTactic==='crossfire'){s.commandTarget=e;s.commandUntil=now+1.8;cue(this,'crossfire',e,1.4);}
   if(this.compositeTactic==='formationBreakthrough'&&s.fast){s.commandTarget=e;s.commandUntil=now+1.6;cue(this,'formationBreakthrough',e,1.4);}
   if(this.compositeTactic==='diveBombing'&&s.fast&&distance(this,e)<380&&(!s.diveOrigin||distance(this,s.diveOrigin)>=190)&&now>=(s.diveAt||0)&&payload(this,e,{base:46})){s.diveAt=now+6;s.diveOrigin={x:this.x,y:this.y};cue(this,'diveBombing',e);}
  }
  if(b.ally&&this.compositeTactic==='guidedBombing'&&now>=(s.guidedAt||0)&&payload(this,e,{base:36})){s.guidedAt=now+(this.weaponMods?.FORMATION==='elite'?4.8:6);cue(this,'guidedBombing',e);}
  if(b.ally&&this.compositeTactic==='mutualCover'&&s.damagedUntil>now&&distance(this,e)<280&&ready(s,'coverAt',now,7)){
   // A successful protection pass suppresses this pursuer's next shot briefly.
   const delay=this.weaponMods?.FORMATION==='elite'?.65:.45;
   e.fire=Math.max(e.fire||0,delay);
   // Native elites run separate countdowns for forward, rear and rocket fire.
   for(const timer of ['fireTimer','rearTimer','rocketTimer'])if(Number.isFinite(e[timer]))e[timer]=Math.max(e[timer],delay);
   cue(this,'mutualCover',e);
   const threat=world(this).bullets?.find(h=>h.enemy&&h.life>0&&!h.flak&&!h.heavyShell&&distance(h,this)<140);if(threat)threat.life=0;
  }
  return result;
 };
}
