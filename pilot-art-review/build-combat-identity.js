// Combat consequences for the existing five build families. No new upgrades or UI.
export const BUILD_COMBAT_BALANCE=Object.freeze({rankCap:5,focusGap:1.25,focusHits:6,focusCone:.22,focusRange:620,wingFocusTime:1.8,wingRange:560,straightTime:.45,passExitDistance:235,passWindow:4,escapeDistance:125,escapeClearance:155,repairDelay:1.2,repairWindow:4,repairCooldown:12});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const ownRound=b=>!!b&&!b.enemy&&!b.patrol&&!b.ally&&!b.formation&&!b.ghost;
const gunRound=b=>ownRound(b)&&!b.rocket&&!b.actualExplosion&&!b.blast&&!b.motorCannon&&!b.cow37&&!b.mauserRound&&!b.fonckSeeker&&!b.fonckSalvo;
const priority=e=>!!(e?.formationCommand||e?.formationResumeCommand||e?.missionTarget||e?.bossPilot||e?.type==='boss'||e?.heavyBomber);
const live=e=>!!e&&e.hp>0&&e.alive!==false&&!e.crashing;
const combatEnemies=game=>{const world=game.combatWorld?.()||game;return [...(world.enemies||[]),...(world.eliteEnemies?.members||[])]};
export function buildIdentityStrength(upgrades,identity,identityFor){
 let ranks=0;for(const [id,count] of Object.entries(upgrades||{}))if(identityFor(id)===identity)ranks+=Math.max(0,Number(count)||0);
 return clamp((ranks-1)/(BUILD_COMBAT_BALANCE.rankCap-1),0,1);
}
export function installBuildCombatIdentity(Game,{identityFor}){
 if(Game.prototype.__buildCombatIdentity)return;Game.prototype.__buildCombatIdentity=true;
 Game.prototype.buildCombatStrength=function(identity){
  if(this._buildRankAt!==this.t||this._buildRankUpgrades!==this.upgrades){this._buildRankAt=this.t;this._buildRankUpgrades=this.upgrades;this._buildRankStrength={};const totals={};for(const [id,count] of Object.entries(this.upgrades||{})){const key=identityFor(id);if(key)totals[key]=(totals[key]||0)+Math.max(0,Number(count)||0)}for(const [key,ranks] of Object.entries(totals))this._buildRankStrength[key]=clamp((ranks-1)/(BUILD_COMBAT_BALANCE.rankCap-1),0,1)}
  return this._buildRankStrength[identity]||0;
 };
 const upgrade=Game.prototype.upgrade;
 if(upgrade)Game.prototype.upgrade=function(...args){const result=upgrade.apply(this,args);this._buildRankAt=undefined;return result};
 Game.prototype.buildFocusedTarget=function(){const focus=this.buildGunFocus,e=focus?.target;if(!live(e)||(this.t||0)-focus.at>BUILD_COMBAT_BALANCE.focusGap)return null;const d=Math.hypot(e.x-this.x,e.y-this.y),bearing=Math.atan2(e.y-this.y,e.x-this.x);return d<=BUILD_COMBAT_BALANCE.focusRange&&Math.abs(angle(bearing,this.a))<=BUILD_COMBAT_BALANCE.focusCone?e:null};
 Game.prototype.buildGunFan=function(fan){
  let factor=1;const gun=this.buildCombatStrength('GUN'),target=this.buildFocusedTarget();
  if(gun&&target)factor*=1-.45*gun*clamp((this.buildGunFocus.hits-1)/(BUILD_COMBAT_BALANCE.focusHits-1),0,1);
  // A pilot must fly the straight entry and leave the target before the next pass.
  const pass=this.buildSpeedPass;
  if(this.buildCombatStrength('SPEED')&&this.buildStraightTime>=BUILD_COMBAT_BALANCE.straightTime&&(this.airframeSpeed??1)>=.86&&pass?.ready&&this.t<=pass.until)factor*=1-.3*this.buildCombatStrength('SPEED');
  return fan*factor;
 };
 Game.prototype.buildWingTarget=function(wing){
  const focus=this.buildCommandFocus,e=focus?.target;if(!this.buildCombatStrength('FORMATION')||!live(e)||(this.t||0)-focus.at>BUILD_COMBAT_BALANCE.wingFocusTime)return null;
  return Math.hypot(e.x-wing.x,e.y-wing.y)<=BUILD_COMBAT_BALANCE.wingRange?e:null;
 };
 const apply=Game.prototype.applySpecialRound;
 Game.prototype.applySpecialRound=function(round,...args){
  const incoming=Math.atan2(round.vy||0,round.vx||0),result=apply.call(this,round,...args)||round;
  if(gunRound(result)){const strength=this.buildCombatStrength('GUN'),target=this.buildFocusedTarget();if(strength&&target){const speed=Math.hypot(result.vx,result.vy),out=Math.atan2(result.vy,result.vx),factor=this.buildGunFan(1),heading=incoming+angle(out,incoming)*factor;result.vx=Math.cos(heading)*speed;result.vy=Math.sin(heading)*speed;result.buildFocusedTarget=target;result.buildFocusStrength=strength*clamp((this.buildGunFocus.hits-1)/(BUILD_COMBAT_BALANCE.focusHits-1),0,1)}}
  return result;
 };
 const multiplier=Game.prototype.roundDamageMultiplier;
 Game.prototype.roundDamageMultiplier=function(b,e){let mult=multiplier.call(this,b,e);if(gunRound(b)&&b.buildFocusedTarget===e&&priority(e))mult*=1+.12*(b.buildFocusStrength||0);return mult};
 const impact=Game.prototype.specialRoundImpact;
 Game.prototype.specialRoundImpact=function(b,e){
  impact.call(this,b,e);if(!ownRound(b))return;const now=this.t||0;
  if(gunRound(b)){
   if(this.buildCombatStrength('GUN')){const old=this.buildGunFocus,hits=old?.target===e&&now-old.at<=BUILD_COMBAT_BALANCE.focusGap?Math.min(BUILD_COMBAT_BALANCE.focusHits,old.hits+1):1;this.buildGunFocus={target:e,at:now,hits}}
   if(this.buildCombatStrength('SPEED')&&this.buildStraightTime>=BUILD_COMBAT_BALANCE.straightTime&&(this.airframeSpeed??1)>=.86){const pass=this.buildSpeedPass;if(!pass||pass.target!==e||pass.ready||now>pass.until)this.buildSpeedPass={target:e,at:now,until:now+BUILD_COMBAT_BALANCE.passWindow,ready:false}}
  }
  if(this.buildCombatStrength('FORMATION')&&priority(e))this.buildCommandFocus={target:e,at:now};
  const explosive=this.buildCombatStrength('EXPLOSIVE');
  if(explosive&&(b.actualExplosion||b.rocket||b.motorCannon||b.cow37)&&typeof this.breakEnemyFormation==='function'){
   const nowWorld=this.combatWorld?.()||this,eliteSquad=nowWorld.eliteEnemies?.squadrons?.find(s=>s.id===e.squadronId);
   const leader=e.formationLeader||e.formationResumeLeader||(e.formationCommand||e.formationResumeCommand?e:null)||eliteSquad?.leader;if(!leader||leader.bossPilot||leader.stageBossBody||leader.bossMinion)return;
   const leaderDead=leader.hp<=0||leader.alive===false;
   if(!leaderDead&&(leader.buildBlastDisruptUntil||0)>now)return;
   const sameGroup=other=>other===leader||other.formationLeader===leader||other.formationResumeLeader===leader||!!(eliteSquad&&other.squadronId===eliteSquad.id);
   const targets=combatEnemies(this),clustered=e===leader||targets.some(other=>other!==e&&live(other)&&sameGroup(other)&&Math.hypot(other.x-e.x,other.y-e.y)<=140);
   if(clustered){leader.buildBlastDisruptUntil=now+1.4;const members=targets.filter(other=>live(other)&&sameGroup(other));for(const member of members){if(leaderDead)this.breakEnemyFormation(member);else this.breakEnemyFormation(member,.45+.45*explosive)}}
  }
 };
 Game.prototype.buildReceivedDamage=function(before){
  const lost=before-this.hp,now=this.t||0,strength=this.buildCombatStrength('SURVIVAL');
  if(lost>0){this.buildLastDamageAt=now;if(this.buildEscapeRepair)this.buildEscapeRepair=null;if(strength&&this.hp>0&&lost>=this.maxHp*.14&&now>=(this.buildRepairCooldownUntil||0)){this.buildRepairCooldownUntil=now+BUILD_COMBAT_BALANCE.repairCooldown;this.buildEscapeRepair={x:this.x,y:this.y,until:now+BUILD_COMBAT_BALANCE.repairWindow,budget:Math.min(lost*.35,this.maxHp*(.04+.04*strength))}}}
 };
 const hit=Game.prototype.hit;
 Game.prototype.hit=function(...args){const before=this.hp,result=hit.apply(this,args);this.buildReceivedDamage(before);return result};
 const fly=Game.prototype.flyAirframe;
 Game.prototype.flyAirframe=function(dt,...args){
  const before=this.a,result=fly.call(this,dt,...args),step=clamp(Number(dt)||0,0,.04),yaw=Math.abs(angle(this.a,before)),scripted=this.chargeTime>0||this.evadeTime>0||this.aceRetreat129||this.duoSpinStep>0;
  this.buildStraightTime=!scripted&&yaw<=step*.18?(this.buildStraightTime||0)+step:0;
  const now=this.t||0,pass=this.buildSpeedPass,speed=this.buildCombatStrength('SPEED');
  if(pass&&now>pass.until)this.buildSpeedPass=null;
  else if(pass&&speed&&!scripted){const distance=Math.hypot(pass.target.x-this.x,pass.target.y-this.y),headingTo=Math.atan2(pass.target.y-this.y,pass.target.x-this.x),departing=Math.abs(angle(headingTo,this.a))>Math.PI/2;if(departing&&distance>=BUILD_COMBAT_BALANCE.passExitDistance)pass.ready=true;
   // Recover turn energy on a deliberate straight egress; never exceed cruise speed.
   if(departing&&this.buildStraightTime>=BUILD_COMBAT_BALANCE.straightTime&&distance>=90&&distance<=540)this.airframeSpeed=clamp((this.airframeSpeed??1)+(1-(this.airframeSpeed??1))*(1-Math.exp(-1.8*speed*step)),.65,1);
  }
  const repair=this.buildEscapeRepair;
  if(repair){if(now>repair.until||this.hp<=0)this.buildEscapeRepair=null;
   else if(now-(this.buildLastDamageAt||0)>=BUILD_COMBAT_BALANCE.repairDelay&&Math.hypot(this.x-repair.x,this.y-repair.y)>=BUILD_COMBAT_BALANCE.escapeDistance&&!combatEnemies(this).some(e=>live(e)&&Math.hypot(e.x-this.x,e.y-this.y)<BUILD_COMBAT_BALANCE.escapeClearance)){
    const healed=Math.min(repair.budget,this.maxHp*.05*step,this.maxHp-this.hp);this.hp+=healed;repair.budget-=healed;if(repair.budget<=1e-9)this.buildEscapeRepair=null;
   }
  }
  return result;
 };
}
