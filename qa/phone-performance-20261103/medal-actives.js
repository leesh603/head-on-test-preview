// Installed last so medal behavior observes the final pilot-specific overrides.
// No shared special/formation/duo damage multiplier: every bonus has an owner,
// an activation and a finite attack or a target-specific accepted-hit gate.
import {combatImpactResult} from './combat-impact-result.js';
const runs=new WeakMap();let serial=0;
const world=p=>p.combatWorld?.()||p.world||p;
const owner=p=>p.id??'p1';
const live=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const alive=e=>e&&e.hp>0&&!e.expired&&!e.crashed&&!e.rivalEscaped;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const boss=e=>!!(e.stageBossBody||e.finalArenaTarget||e.bossPilot||e.heavyBomber||e.type==='boss'||e.type==='zeppelin');
const personal=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId??'p1')===owner(p)&&!['enemy','ally','patrol','formation','transferGun','rocket','motorCannon','cow37','mauserRound','actualExplosion','blast','identityDot','identityChain','tacticalRound'].some(k=>b[k]);
const rear=(p,b,e)=>{const o=b.identityOrigin||p;return Math.abs(wrap(Math.atan2(o.y-e.y,o.x-e.x)-(e.a||0)))>Math.PI*.72;};
function covered(w,target){return (w.players||[w]).some(p=>live(p)&&p.pilot==='brumowski'&&p.skillEnhanced&&p.skillTime>0&&dist(p,target)<=260);}
function start(p){const s={id:++serial,age:0,salvos:0,reentered:new WeakSet(),diveHit:false,ambushHit:false,lastStand:false,counter:false};runs.set(p,s);return s;}

export function installMedalActives(Game,PILOTS){
 const q=Game.prototype,duration=q.skillDuration,cooldown=q.skillCooldown;
 q.skillCooldown=function(){
  if(!this.skillEnhanced)return cooldown.call(this);
  // Evaluate the ordinary effective cooldown with the same other equipment.
  // Duration/recovery floors are discounted too, so an enhanced duration can
  // never turn a medal into a cooldown increase (Boelcke: 14 -> 11.2s).
  const plain=Object.create(this);plain.skillEnhanced=false;
  const base=Math.max(PILOTS[this.pilot].cooldown*Math.max(.5,this.cooldownMult),duration.call(plain)+this.skillRecovery());
  return base*.8;
 };
 const skill=q.skill;q.skill=function(){
  if(this.skillEnhanced&&this.skillTime>0)return false;
  const used=skill.call(this);if(used&&this.skillEnhanced)start(this);return used;
 };
 q.medalBurst=function(kind,power=1.4,pierce=false){
  if(!live(this)||!this.skillEnhanced||this.reloadTime>0||this.mission?.unarmed||this.cow37)return false;
  const s=runs.get(this);if(!s)return false;let count=0;
  for(let gun=0;gun<Math.min(2,this.weapon.guns||1);gun++){
   if(gun===1&&this.weapon.bidirectional)continue;
   const n=this.unlimitedAmmo?3:Math.min(3,this.ammo[gun]||0);if(!n)continue;
   if(!this.unlimitedAmmo)this.ammo[gun]-=n;
   for(let i=0;i<n;i++){
    const a=this.a+(i-(n-1)/2)*.025,side=(gun-((this.weapon.guns||1)-1)/2)*8;
    const b={x:this.x+Math.cos(this.a)*25-Math.sin(this.a)*side,y:this.y+Math.sin(this.a)*25+Math.cos(this.a)*side,vx:Math.cos(a)*600,vy:Math.sin(a)*600,life:1.25,enemy:false,ownerId:owner(this),gun,damage:this.damage*this.normalGunMultiplier()*power,pierce,hit:new Set(),medalAttack:kind,medalRun:s.id};
    this.applySpecialRound(b,null);this.bullets.push(b);count++;
   }
  }
  if(count){this.roundsFired+=count;this.muzzleFlash=.12;this.identityFx?.('muzzleTwin',this.x+Math.cos(this.a)*25,this.y+Math.sin(this.a)*25,this.a,40,.12);this.event('shot','');}
  return count>0;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){
  const prior=begin.call(this,dt,input);
  if(!live(this)){runs.delete(this);return prior;}
  if(!this.skillEnhanced)return prior;
  const s=runs.get(this);if(!s)return prior;s.age+=dt;
  if(this.skillTime>0){
   if(this.pilot==='udet'&&!s.counter&&this.udetAcrobat?.active?.counterShown){s.counter=true;this.medalBurst('udetCounter',1.5);}
   if(this.pilot==='loewenhardt'&&!s.counter&&this.aceSkillPhase==='vertical-fire'&&s.age>=1.15){s.counter=true;this.medalBurst('loewenhardtAscent',1.2);}
   if(this.pilot==='sachsenberg'&&this.aceSkillPhase==='dive'&&s.salvos<2&&s.age>=1.25+s.salvos*.28){s.salvos++;this.medalBurst('sachsenbergDive',1.1);}
   if(this.pilot==='barker'&&s.lastStand&&!s.counter){s.counter=true;this.medalBurst('barkerCounter',1.5);}
  }
  return prior;
 };
 const apply=q.applySpecialRound;q.applySpecialRound=function(b,...args){
  const result=apply.call(this,b,...args),shot=result||b,s=runs.get(this);
  if(!live(this)||!this.skillEnhanced||!s||!personal(this,shot))return result;
  shot.medalRun=s.id;
  if(this.pilot==='baron'&&this.skillTime>0){if(this.huntTarget)shot.medalHunt=this.tailIdFor(this.huntTarget);shot.medalSun=!!this.isRedHunter?.();}
  if(this.pilot==='wolff'&&this.skillTime>0&&this.aceSkillPhase==='dive'&&!s.diveHit)shot.medalDive=true;
  if(this.pilot==='ball'&&this.ballAmbush>0&&!s.ambushHit)shot.medalAmbush=true;
  if(this.pilot==='rickenbacker'&&this.skillTime>0&&s.switchUntil>(this.pilotIdentity?.clock||0))shot.medalSwitch=true;
  return result;
 };
 const damage=q.roundDamageMultiplier;q.roundDamageMultiplier=function(b,e){
  let m=damage.call(this,b,e);const s=runs.get(this);
  if(!this.skillEnhanced||!s||!personal(this,b)||b.medalRun!==s.id)return m;
  if(b.medalAttack)m*=boss(e)?.85:1; // Finite extra MG bursts receive a boss discount.
  if((b.medalHunt&&b.medalHunt===this.tailIdFor(e)||b.medalSun&&this.sunStrikeContains(e))&&rear(this,b,e))m*=boss(e)?1.12:1.2;
  if(b.medalDive&&!s.diveHit)m*=boss(e)?1.15:1.3;
  if(b.medalAmbush&&!s.ambushHit&&this.ballAmbush>0&&this.pilotIdentity?.alone&&rear(this,b,e))m*=boss(e)?1.1:1.25;
  if(b.medalSwitch)m*=boss(e)?1.1:1.15;
  return m;
 };
 const impact=q.identityImpact;q.identityImpact=function(b,e,...args){
  const s=runs.get(this),previous=this.pilotIdentity?.lastHit,result=impact.call(this,b,e,...args);
  if(!live(this)||!this.skillEnhanced||!s||!personal(this,b)||b.medalRun!==s.id||!(combatImpactResult(b,e)?.damage>0))return result;
  if(b.medalDive)s.diveHit=true;
  if(b.medalAmbush&&this.ballAmbush>0&&this.pilotIdentity?.alone&&rear(this,b,e))s.ambushHit=true;
  if(this.pilot==='rickenbacker'&&this.skillTime>0&&previous&&previous!==e)s.switchUntil=this.pilotIdentity.clock+.65;
  return result;
 };
 const received=q.buildReceivedDamage;q.buildReceivedDamage=function(before){
  const result=received.call(this,before),s=runs.get(this);
  if(s&&this.skillEnhanced&&this.pilot==='barker'&&this.skillTime>0&&before>1&&this.hp===1)s.lastStand=true;
  return result;
 };
 const incoming=q.incomingDamageMultiplier;q.incomingDamageMultiplier=function(source){return incoming.call(this,source)*(covered(world(this),this)?.85:1);};
 const allyHit=q.hitFormationAlly;q.hitFormationAlly=function(a,n){
  const cover=covered(world(this),a),result=allyHit.call(this,a,n*(cover?.85:1));
  if(cover&&a.hitFlash>0){const p=(world(this).players||[this]).find(p=>p.pilot==='brumowski'&&live(p)&&p.skillEnhanced&&p.skillTime>0&&dist(p,a)<=260);p?.identityFx?.('armorSpark',a.x,a.y,a.a||0,22,.18);}
  return result;
 };
 const wing=q.updatePilotWing;q.updatePilotWing=function(a,dt){
  const before=a.fire,result=wing.call(this,a,dt),s=runs.get(this);
  if(!live(this)||!this.skillEnhanced||!(this.skillTime>0)||!s||a.ownerId!==owner(this)||!(a.life>0))return result;
  if(this.pilot==='brumowski'&&before<=dt&&a.fire>dt)a.fire*=.9;
  if(this.pilot==='goering'&&(a.permanent||a.whiteTemporary)&&!a.aceWingman&&!a.weaponModFormation&&!a.tacticalWing&&!s.reentered.has(a)&&s.age>this.nineDuration*.45&&s.age<this.nineDuration-1.2&&alive(this.whiteFocus)&&dist(a,this.whiteFocus)<650){
   const heading=Math.atan2(this.whiteFocus.y-a.y,this.whiteFocus.x-a.x);
   if(Math.abs(wrap(heading-a.a))<.65){s.reentered.add(a);a.muzzleFlash=.12;a.fireHeading=heading;for(const off of [-.02,.02])this.identityShot(heading+off,this.supportPower(world(this).players?7.44:5),{ally:true,medalWhiteReentry:true,speed:470},a);}
  }
  return result;
 };
}
