// Rare specializations use the existing player, projectile and flight paths.
import {combatImpactResult} from './combat-impact-result.js';
export const RARE_BALANCE=Object.freeze({precisionHits:6,precisionGap:1.5,precisionDamage:1.25,precisionCooldown:3,inertiaCharge:1,inertiaWindow:.6,inertiaRetention:.5,springDuration:1.5,springTurn:1.2,springCooldown:6,platingGap:2,platingDuration:1.5,platingReduction:.18,platingCooldown:12,dopeThreshold:.25,dopeHeal:.12});
export const RARE_SPECIALIZATIONS=Object.freeze([
 {id:'precisionSynchronizer',name:'정밀 동조 사격기',family:'GUN',desc:'1.5초 이내 같은 표적을 기관총으로 6회 연속 명중시키면 다음 기관총 탄환 피해 +25%. 재발동 대기시간 3초.',enName:'Precision Synchronizer',enDesc:'Hit the same target 6 times with your machine guns, with at most 1.5s between hits. The next MG round deals +25% damage. 3s cooldown.',icon:'synchronization_gear.webp'},
 {id:'directFuse',name:'직격 신관',family:'EXPLOSIVE',desc:'로켓·수류탄 직접 명중 피해 +25%, 주변 폭발 피해 −15%.',enName:'Direct-Impact Fuse',enDesc:'Rocket/grenade direct-hit damage +25%; surrounding blast damage −15%.',icon:'le_prieur_rocket_launcher.webp'},
 {id:'fragmentationFuse',name:'광역 파편신관',family:'EXPLOSIVE',desc:'로켓·수류탄 폭발 반경 +20%, 직접 명중 피해 −10%.',enName:'Fragmentation Fuse',enDesc:'Rocket/grenade blast radius +20%; direct-hit damage −10%.',icon:'grenade_throwing_gear.webp'},
 {id:'inertiaRetainer',name:'관성 유지 장치',family:'SPEED',desc:'직선 비행 1초로 충전. 급선회 시 0.6초간 선회에 따른 속도 손실의 50% 억제. 최고속도는 증가하지 않습니다.',enName:'Inertia Retainer',enDesc:'Charge with 1s of straight flight. A hard turn preserves 50% of turning speed loss for 0.6s, without increasing top speed.',icon:'laminated_wood_propeller.webp'},
 {id:'maneuverSpring',name:'기동 복원 스프링',family:'SPEED',desc:'회피 종료 후 1.5초간 선회력 +20%. 내부 재발동 대기시간 6초.',enName:'Maneuver Return Spring',enDesc:'Turn rate +20% for 1.5s after evasion ends. 6s internal cooldown.',icon:'co_5_17_aero_compass.webp'},
 {id:'emergencyPlating',name:'비상 방호 보강',family:'SURVIVAL',desc:'2초 이내 탄환에 연속 피격되면 두 번째 피격부터 1.5초간 탄환 피해 18% 감소. 재발동 대기시간 12초.',enName:'Emergency Plating',enDesc:'A second bullet hit within 2s reduces bullet damage by 18% for 1.5s, including that hit. 12s cooldown.',icon:'j_type_armor_capsule.webp'},
 {id:'emergencyDope',name:'비상 수선 도프',family:'SURVIVAL',desc:'내구도가 처음 25% 이하로 떨어질 때 최대 내구도의 12% 즉시 회복. 출격당 1회. 치명 피해에는 발동하지 않습니다.',enName:'Emergency Repair Dope',enDesc:'The first time durability drops to 25% or less, immediately restore 12% max durability. Once per sortie; cannot prevent lethal damage.',icon:'mechanics_oil_pump.webp'}
].map(Object.freeze));
export const PROMOTED_EQUIPMENT=Object.freeze(['fighterSupply','mercedesEngine','combinedProjectiles']);
export const rareSpecializationFor=id=>RARE_SPECIALIZATIONS.find(u=>u.id===id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const owner=p=>p.id||'p1';
export const suppliedWing=(p,w)=>!!(p.upgrades?.fighterSupply&&w?.permanent&&!w.aceWingman&&w.ownerId===owner(p));
const live=p=>p.hp>0&&(!p.status||p.status==='alive');
const bulletSource=s=>!!s?.bullet&&!s.bullet.gas&&!s.bullet.actualExplosion&&!s.bullet.blast;
const ownGun=(p,b)=>!!b&&Number.isInteger(b.gun)&&!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.ghost&&!b.rocket&&!b.actualExplosion&&!b.blast&&!b.motorCannon&&!b.cow37&&!b.mauserRound&&!b.fonckSeeker&&!b.fonckSalvo&&!b.tacticalRound&&(b.ownerId||'p1')===owner(p);

// Normalize old ownership without replaying upgrade(), wing creation or doctrine
// counters. A network replica already carries the authoritative host's speeds.
export function migrateAugmentationState(p,{metadataOnly=false}={}){
 if(!p?.upgrades||p.augmentationSchema===2)return false;
 p.augmentationSchema=2;
 const rarities=p.upgradeRarities??={},legacyEngine=!!p.upgrades.mercedesEngine&&(rarities.mercedesEngine==='unique'||p.mercedesAppliedBase===1.15);
 if(legacyEngine&&!metadataOnly){
  if(Number.isFinite(p.speed))p.speed*=1.2/1.15;
  if(Number.isFinite(p.baseSpeed))p.baseSpeed*=1.2/1.15;
 }
 for(const id of ['bomber','spread','wingman',...PROMOTED_EQUIPMENT])if(p.upgrades[id])rarities[id]=PROMOTED_EQUIPMENT.includes(id)?'legendary':'rare';
 if(p.upgrades.mercedesEngine)p.mercedesAppliedBase=1.2;
 return legacyEngine;
}

// Snapshot ordnance specialization at release. The second packet receives its
// damage boost once, before the existing payload/Amatol collision calculation.
export function ordnanceProfile(p,{second=false,single=false,stagger=false}={}){
 return {direct:(p.upgrades?.directFuse?1.25:1)*(p.upgrades?.fragmentationFuse?.9:1),splash:p.upgrades?.directFuse?.85:1,radius:(p.upgrades?.fragmentationFuse?1.2:1)*(stagger&&second?1.1:1),packet:stagger?(single?1.15:second?1.25:1):1};
}
// The shared damage hooks serve both Game.hit and CoopGame.hitPlayer.
export function beginRareHit(p,n){
 const before=p.hp,now=p.t||0,bullet=bulletSource(p.damageSource),eligible=live(p)&&!(p.invuln>0)&&n>0;
 const token={before,bullet,heineckeUses:p.heineckeUses||0,oldUntil:p.rarePlatingUntil,oldCooldown:p.rarePlatingCooldown,activate:eligible&&bullet&&p.upgrades?.emergencyPlating&&now-(p.rareBulletHitAt??-Infinity)<=RARE_BALANCE.platingGap&&now>=(p.rarePlatingCooldown||0)};
 if(token.activate){p.rarePlatingUntil=now+RARE_BALANCE.platingDuration;p.rarePlatingCooldown=now+RARE_BALANCE.platingCooldown;}
 return token;
}
export function finishRareHit(p,token){
 const {before,bullet,activate}=token,lost=before-p.hp,now=p.t||0;
 if((p.heineckeUses||0)>token.heineckeUses){if(activate){p.rarePlatingUntil=token.oldUntil;p.rarePlatingCooldown=token.oldCooldown;}return;}
 if(activate&&!(lost>0)){p.rarePlatingUntil=token.oldUntil;p.rarePlatingCooldown=token.oldCooldown;}
 if(lost>0){
  if(bullet)p.rareBulletHitAt=now;
  if(p.upgrades?.emergencyDope&&!p.emergencyDopeUsed&&p.hp>0&&before>p.maxHp*RARE_BALANCE.dopeThreshold&&p.hp<=p.maxHp*RARE_BALANCE.dopeThreshold){p.emergencyDopeUsed=true;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*RARE_BALANCE.dopeHeal);p.event?.('ally','비상 수선 도프 · 내구도 12% 회복');}
 }
}
export function installRareSpecializations(Game){
 if(Game.prototype.__rareSpecializations)return;Game.prototype.__rareSpecializations=true;
 Game.prototype.rareOrdnanceProfile=function(){return ordnanceProfile(this)};
 Game.prototype.fighterSupplyDamage=function(wing){return suppliedWing(this,wing)?1.35:1};
 Game.prototype.fighterSupplyInterval=function(wing){return suppliedWing(this,wing)?.8:1};
 const apply=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(round,...args){
  const b=apply.call(this,round,...args)||round,s=this.rarePrecision;
  if(this.upgrades?.precisionSynchronizer&&s?.ready&&ownGun(this,b)&&!b.precisionSynchronized){b.damage*=RARE_BALANCE.precisionDamage;b.precisionSynchronized=true;s.ready=false;s.hits=0;s.until=(this.t||0)+RARE_BALANCE.precisionCooldown;}
  return b;
 };
 const multiplier=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){
  let m=multiplier.call(this,b,e);
  if(b?.upgradeRocket&&!b.enemy&&!b.ally&&!b.patrol&&(b.ownerId||'p1')===owner(this))m*=(b.ordnanceProfile||ordnanceProfile(this)).direct;
  // A grenade retains its existing fuse/trajectory and one damage event. A
  // target touching the detonation point takes direct damage instead of splash.
  if(b?.grenadeExplosion&&b.ordnanceProfile&&b.target===e)m*=b.ordnanceProfile.direct/b.ordnanceProfile.splash;
  return m;
 };
 const seen=new WeakMap(),impact=Game.prototype.specialRoundImpact;
 Game.prototype.specialRoundImpact=function(b,e){
  const result=impact.call(this,b,e);
  if(!this.upgrades?.precisionSynchronizer||!live(this)||!ownGun(this,b)||!(combatImpactResult(b,e)?.damage>0))return result;
  let hits=seen.get(b);if(!hits){hits=new WeakSet();seen.set(b,hits)}if(hits.has(e))return result;hits.add(e);
  const s=this.rarePrecision??={hits:0,until:0},now=this.t||0;
  if(s.ready||now<s.until)return result;
  s.hits=s.target===e&&now-(s.at??-Infinity)<=RARE_BALANCE.precisionGap?s.hits+1:1;s.target=e;s.at=now;
  if(s.hits>=RARE_BALANCE.precisionHits)s.ready=true;
  return result;
 };
 const incoming=Game.prototype.incomingDamageMultiplier;
 Game.prototype.incomingDamageMultiplier=function(source){return incoming.call(this,source)*(this.upgrades?.emergencyPlating&&bulletSource(source)&&(this.rarePlatingUntil||0)>(this.t||0)?1-RARE_BALANCE.platingReduction:1)};
 const hit=Game.prototype.hit;
 Game.prototype.hit=function(n,...args){const token=beginRareHit(this,n),result=hit.call(this,n,...args);finishRareHit(this,token);return result;};
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,...args){
  const step=clamp(Number(dt)||0,0,.04),now=this.t||0,before=this.airframeSpeed??1,heading=this.a,turn=this.turn,evading=this.evadeTime>0;
  if(this.upgrades?.maneuverSpring&&this.rareWasEvading&&!evading&&live(this)&&now>=(this.rareSpringCooldown||0)){this.rareSpringUntil=now+RARE_BALANCE.springDuration;this.rareSpringCooldown=now+RARE_BALANCE.springCooldown;}
  this.rareWasEvading=evading;
  if(this.upgrades?.maneuverSpring&&now<(this.rareSpringUntil||0))this.turn*=RARE_BALANCE.springTurn;
  let result;try{result=fly.call(this,dt,...args)}finally{this.turn=turn;}
  if(!this.upgrades?.inertiaRetainer||!live(this)||step<=0)return result;
  const scripted=evading||this.chargeTime>0||this.aceRetreat129||this.duoSpinStep>0,rate=Math.abs(angle(this.a,heading))/step;
  if(!scripted&&rate<.18)this.rareInertiaCharge=Math.min(1,(this.rareInertiaCharge||0)+step/RARE_BALANCE.inertiaCharge);
  else if(!scripted&&rate>.9&&(this.rareInertiaCharge||0)>=1){this.rareInertiaUntil=now+RARE_BALANCE.inertiaWindow;this.rareInertiaCharge=0;}
  else if(scripted)this.rareInertiaCharge=0;
  if(!scripted&&now<(this.rareInertiaUntil||0)&&this.airframeSpeed<before)this.airframeSpeed=Math.min(1,this.airframeSpeed+(before-this.airframeSpeed)*RARE_BALANCE.inertiaRetention);
  return result;
 };
}
