// Shared, bounded manoeuvres for ordinary allied aircraft. Pilot-authored
// formations continue through their existing support poses.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export const WEAPON_WING_BALANCE=Object.freeze({strikeCycle:6,strikeAttack:2.4,coverCycle:3.6,coverAttack:2.4,launchWindow:.65,guardRange:250,guardLeash:300,scanInterval:.2});
const commandPilots=new Set(['goering','boelcke','collishaw','brumowski']);
export function weaponModWingActive(owner,wing){
 return !!wing.permanent&&!Number.isFinite(wing.carrierLaunchAt)&&['strike','cover'].includes(owner.weaponMods?.FORMATION)&&!owner.upgrades?.lufberyCircle&&!wing.boelckePincer&&!wing.orbit&&!(owner.skillTime>0&&commandPilots.has(owner.pilot));
}
const eligibleModTarget=(owner,target,range)=>!!target&&target.hp>0&&!target.dead&&!target.crashing&&!target.rivalEscaped&&distance(target,owner)<=range;
const validModTarget=(world,owner,target,range)=>eligibleModTarget(owner,target,range)&&(world.enemies||[]).includes(target);
const priorityTarget=e=>e.bossPilot||e.type==='boss'?3:e.ace||e.formationCommand||e.missionTarget||e.heavyBomber?2:0;
function modWingPlan(world,owner,mode,now){
 let plan=owner._netWeaponWingPlan;
 if(!plan||plan.mode!==mode){plan=owner._netWeaponWingPlan={mode,epoch:now,window:-1,scanAt:0,guardScanAt:0};}
 const period=mode==='strike'?WEAPON_WING_BALANCE.strikeCycle:WEAPON_WING_BALANCE.coverCycle;
 const window=Math.floor(Math.max(0,now-plan.epoch)/period),start=plan.epoch+window*period;
 if(window!==plan.window){plan.window=window;plan.start=start;plan.target=null;plan.scanAt=0;}
 if(plan.checkedAt===now)return plan;plan.checkedAt=now;
 if(!plan.target&&now>=plan.scanAt||plan.target&&!validModTarget(world,owner,plan.target,520)){
  plan.scanAt=now+WEAPON_WING_BALANCE.scanInterval;let best=-Infinity;plan.target=null;
  const carrier=owner.bomberTransfer?.kind==='airship',focus=owner.buildWingTarget?.(owner)||owner.airshipFocusTarget?.();
  for(const enemy of world.enemies||[]){if(!eligibleModTarget(owner,enemy,520)||!carrier&&(enemy.surface||enemy.stationary))continue;
   const score=priorityTarget(enemy)*1000+(enemy===focus?600:0)-distance(enemy,owner);
   if(score>best){best=score;plan.target=enemy;}
  }
 }
 if(now>=plan.guardScanAt||plan.guardTarget&&!validModTarget(world,owner,plan.guardTarget,WEAPON_WING_BALANCE.guardRange)){
  plan.guardScanAt=now+WEAPON_WING_BALANCE.scanInterval;plan.guardTarget=null;let best=WEAPON_WING_BALANCE.guardRange;
  for(const enemy of world.enemies||[]){if(!eligibleModTarget(owner,enemy,WEAPON_WING_BALANCE.guardRange)||enemy.surface||enemy.stationary)continue;const d=distance(enemy,owner);if(d<best){best=d;plan.guardTarget=enemy;}}
 }
 return plan;
}
// Adjust dispatch and target assignment, retaining the existing movement states.
function prepareModWing(world,owner,wing,home,now){
 const mode=owner.weaponMods?.FORMATION;
 if(!weaponModWingActive(owner,wing)){
  if(wing.weaponModFormation){wing.engagementTarget=null;wing._netCarrierEngagement=null;wing._netCarrierTarget=null;wing.engagementState='HOME';}
  wing.weaponModFormation=null;wing.weaponModGuard=false;wing._netWeaponWingGuardTarget=null;return null;
 }
 const plan=modWingPlan(world,owner,mode,now),elapsed=now-plan.start;
 const guard=mode==='cover'&&(wing.slot||0)%2!==plan.window%2;
 const attacking=!guard&&elapsed<(mode==='strike'?WEAPON_WING_BALANCE.strikeAttack:WEAPON_WING_BALANCE.coverAttack);
 wing.weaponModFormation=mode;wing.weaponModGuard=guard;wing._netWeaponWingGuardTarget=null;
 let state=wing.engagementState||'HOME';
 if(guard){
  const target=distance(wing,owner)<=WEAPON_WING_BALANCE.guardLeash?plan.guardTarget:null;
  if(target){
   if(state==='HOME'||state==='RETURN'&&distance(wing,home)<110){state='INTERCEPT';wing.engagementUntil=now+1.2;wing.fire=0;}
   if(state==='INTERCEPT'||state==='PASS'){wing.engagementTarget=target;wing._netCarrierEngagement=target;wing._netWeaponWingGuardTarget=target;}
  }else{state=distance(wing,home)<80?'HOME':'RETURN';wing.engagementTarget=null;wing._netCarrierEngagement=null;}
 }else if(!attacking){
  if(state==='INTERCEPT'||state==='PASS'){state='BREAK';wing.engagementUntil=now+.65;wing.engagementHeading=wing.a+((wing.slot||0)%2?-.7:.7);}
  wing.engagementTarget=null;wing._netCarrierEngagement=null;
 }else if(elapsed<=WEAPON_WING_BALANCE.launchWindow&&wing._netWeaponWingLaunch!==plan.start&&(state==='HOME'||state==='RETURN'&&distance(wing,home)<110)&&plan.target){
  state='INTERCEPT';wing.engagementTarget=plan.target;wing._netCarrierEngagement=plan.target;wing.engagementUntil=plan.start+(mode==='strike'?WEAPON_WING_BALANCE.strikeAttack:WEAPON_WING_BALANCE.coverAttack);wing._netWeaponWingLaunch=plan.start;wing.fire=0;
 }
 wing.engagementState=state;
 return true;
}

function modWingHome(wing,owner,home,dt){
 const response=2.6*Math.max(.75,Math.min(1.25,wing.personality?.acceleration??1));
 wing.x+=(home.x-wing.x)*Math.min(1,dt*response);wing.y+=(home.y-wing.y)*Math.min(1,dt*response);wing.a=owner.a;
 return true;
}

export function wingmanEngagementStep(world,owner,wing,home,dt){
 const mod=prepareModWing(world,owner,wing,home,world.t??owner.t??0);
 if(owner.bomberTransfer?.kind==='airship'&&wing.permanent&&!wing.boelckePincer&&!wing.orbit){
  const commanded=owner.skillTime>0&&['goering','boelcke','collishaw','brumowski'].includes(owner.pilot);
  if(owner.upgrades?.lufberyCircle||commanded){wing._netCarrierTarget=null;wing._netCarrierEngagement=null;wing.engagementTarget=null;wing.engagementState='HOME';return false}
  const now=world.t??owner.t??0,slot=wing.slot||0,side=slot%2?-1:1,fit=owner.bomberTransfer;
  let state=wing.engagementState||'HOME',target=wing._netCarrierEngagement;
  if(target&&(!(target.hp>0)||target.dead||target.crashing||!(world.enemies||[]).includes(target)||distance(target,owner)>560))target=null;
  if(distance(wing,owner)>400){state='RETURN';target=null}
  if(state==='INTERCEPT'&&!target)state='RETURN';
  if(state==='PASS'&&now>=wing.engagementUntil){state='BREAK';wing.engagementUntil=now+.9;wing.engagementHeading=wing.a+side*.75;target=null}
  if(state==='BREAK'&&now>=wing.engagementUntil)state='RETURN';
  if(state==='RETURN'&&distance(wing,home)<105){state='HOME';wing.engagementUntil=now+.45+slot*.12}
  if(!mod&&state==='HOME'&&now>=(wing.engagementUntil||0)){
   target=owner.airshipWingTarget();
   if(target){state='INTERCEPT';wing.engagementUntil=now+2.4}
  }
  if(state==='INTERCEPT'&&target){
   const bearing=Math.atan2(target.y-wing.y,target.x-wing.x);
   if(distance(wing,target)<220&&Math.abs(angleDiff(bearing,wing.a))<.5){state='PASS';wing.engagementUntil=now+.65;wing.engagementHeading=bearing}
   else if(now>=wing.engagementUntil){state='RETURN';target=null}
  }
  // Fly through a loose station instead of sliding sideways while facing a target.
  const phase=now*.85+slot*1.7,ca=Math.cos(owner.a),sa=Math.sin(owner.a);
  let wx=home.x+ca*Math.cos(phase)*65-sa*Math.sin(phase)*side*40,wy=home.y+sa*Math.cos(phase)*65+ca*Math.sin(phase)*side*40;
  if(state==='INTERCEPT'&&target){wx=target.x;wy=target.y}
  if(state==='PASS'||state==='BREAK'){wx=wing.x+Math.cos(wing.engagementHeading)*160;wy=wing.y+Math.sin(wing.engagementHeading)*160}
  let dx=wx-wing.x,dy=wy-wing.y;const gap=Math.hypot(dx,dy)||1;dx/=gap;dy/=gap;
  const ox=wing.x-owner.x,oy=wing.y-owner.y,u=(ox*ca+oy*sa)/(fit.hullLength+65),v=(-ox*sa+oy*ca)/(fit.hullWidth+65),h=Math.hypot(u,v);
  if(h<1.4){const push=(1.4-h)*3.5;dx+=(-sa*(v||side)+ca*u*.35)*push;dy+=(ca*(v||side)+sa*u*.35)*push}
  for(const other of world.allies||[]){if(other===wing||other.carrierHidden||other.ownerId!==wing.ownerId)continue;const x=wing.x-other.x,y=wing.y-other.y,d=Math.hypot(x,y);if(d>0&&d<72){dx+=x/d*(72-d)/42;dy+=y/d*(72-d)/42}}
  const goal=Math.atan2(dy,dx),error=angleDiff(goal,wing.a);wing.a+=clamp(error,-dt*2.4,dt*2.4);
  const speed=state==='INTERCEPT'||state==='PASS'?165:clamp((owner.speed||75)+gap*.55,100,185),bankSlow=Math.max(.48,1-Math.abs(error)*.2);
  wing.x+=Math.cos(wing.a)*speed*bankSlow*dt;wing.y+=Math.sin(wing.a)*speed*bankSlow*dt;
  wing.engagementState=state;wing.engagementTarget=null;wing._netCarrierEngagement=target;wing._netCarrierTarget=(state==='INTERCEPT'||state==='PASS')?target:null;
  return true;
 }
 if(owner.upgrades?.lufberyCircle||wing.boelckePincer||wing.orbit||!mod&&(owner.wingmanDamageMult>1||commandPilots.has(owner.pilot))||mod&&owner.skillTime>0&&commandPilots.has(owner.pilot))return false;
 const now=world.t||0,active=wing.engagementTarget;
 if(active&&(active.hp<=0||!world.enemies.includes(active)||distance(active,owner)>580||distance(active,wing)>700))wing.engagementTarget=null;
 if(!mod&&(wing.engagementState==='HOME'||!wing.engagementState||wing.engagementState==='RETURN'&&distance(wing,home)<110)&&!wing.engagementTarget){
  let best=650,chosen=null;
  for(const enemy of world.enemies||[]){if(enemy.hp<=0||enemy.crashing||enemy.surface||enemy.stationary||distance(enemy,owner)>520)continue;
   let assigned=0;if(world.allies)for(const other of world.allies)if(other!==wing&&other.engagementTarget===enemy)assigned++;
   const score=distance(enemy,wing)+assigned*230;
   if(score<best){best=score;chosen=enemy}
  }
  if(chosen){wing.engagementTarget=chosen;wing.engagementState='INTERCEPT';wing.engagementUntil=now+1.2}
 }
 if(!wing.engagementState||wing.engagementState==='HOME')return mod?modWingHome(wing,owner,home,dt):false;
 const target=wing.engagementTarget;
 if(wing.engagementState==='INTERCEPT'&&!target)wing.engagementState='RETURN';
 if(wing.engagementState==='INTERCEPT'&&target){
  const bearing=Math.atan2(target.y-wing.y,target.x-wing.x),gap=distance(wing,target);
  if(gap<240&&Math.abs(angleDiff(bearing,wing.a))<.55){wing.engagementState='PASS';wing.engagementUntil=now+.75;wing.engagementHeading=bearing}
  else if(mod&&now>=wing.engagementUntil){wing.engagementState='RETURN';wing.engagementTarget=null;}
 }
 if(wing.engagementState==='PASS'&&now>=wing.engagementUntil){wing.engagementState='BREAK';wing.engagementUntil=now+1.1;wing.engagementHeading=wing.a+((wing.slot||0)%2?-.7:.7);wing.engagementTarget=null}
 if(wing.engagementState==='BREAK'&&now>=wing.engagementUntil)wing.engagementState='RETURN';
 if(wing.engagementState==='RETURN'&&distance(wing,home)<80){wing.engagementState='HOME';wing.engagementTarget=null;return mod?modWingHome(wing,owner,home,dt):false}
 if(distance(wing,owner)>500){wing.engagementState='RETURN';wing.engagementTarget=null}
 const goal=wing.engagementState==='INTERCEPT'&&target?Math.atan2(target.y-wing.y,target.x-wing.x):wing.engagementState==='RETURN'?Math.atan2(home.y-wing.y,home.x-wing.x):wing.engagementHeading??wing.a;
 const turn=clamp((wing.personality?.highSpeedHandling||1)*(wing.engagementState==='RETURN'?2.8:2.25),1.6,3.3)*dt;
 wing.a+=clamp(angleDiff(goal,wing.a),-turn,turn);
 const speed=wing.engagementState==='RETURN'?clamp((owner.speed||170)*1.45,210,290):clamp((owner.speed||170)*1.08*(wing.personality?.acceleration||1),145,225);
 wing.x+=Math.cos(wing.a)*speed*dt;wing.y+=Math.sin(wing.a)*speed*dt;
 return true;
}

export function wingmanAttackTarget(wing){if(wing.weaponModFormation&&wing.engagementState!=='INTERCEPT'&&wing.engagementState!=='PASS')return null;if(wing.weaponModGuard&&wing._netWeaponWingGuardTarget)return wing._netWeaponWingGuardTarget;if(wing._netCarrierTarget)return wing._netCarrierTarget;return wing.engagementState==='INTERCEPT'||wing.engagementState==='PASS'?wing.engagementTarget:null}

export function patrolEngagementStep(p,target,home,dt){
 const S=p.combatPassState||'APPROACH',nowDt=Math.max(0,dt),range=clamp(p.personality?.preferredRange||210,145,310);
 p.combatPassTimer=Math.max(0,(p.combatPassTimer||0)-nowDt);
 let state=S;
 if(!target){state='APPROACH';p.combatPassWaypoint=null}
 else if(state==='APPROACH'){
  const bearing=Math.atan2(target.y-p.y,target.x-p.x);
  if(distance(p,target)<range*1.2&&Math.abs(angleDiff(bearing,p.a))<.55){state='ATTACK_PASS';p.combatPassTimer=.45;p.combatPassHeading=bearing}
 }else if(p.combatPassTimer===0){
  if(state==='ATTACK_PASS'){state='COMMIT';p.combatPassTimer=.7}
  else if(state==='COMMIT'){state='DISENGAGE';p.combatPassTimer=1.05;p.combatPassHeading=p.a+((p.slot||0)%2?-.42:.42)}
  else if(state==='DISENGAGE'){
   state='REPOSITION';p.combatPassTimer=1.3;
   const bearing=Number.isFinite(target.a)?target.a:Math.atan2(target.y-p.y,target.x-p.x),side=(p.slot||0)%2?-1:1;
   p.combatPassWaypoint={x:target.x-Math.cos(bearing)*range-Math.sin(bearing)*side*range*.65,y:target.y-Math.sin(bearing)*range+Math.cos(bearing)*side*range*.65};
  }else if(state==='REPOSITION'){state='REENGAGE';p.combatPassTimer=.5}
  else if(state==='REENGAGE')state='APPROACH';
 }
 p.combatPassState=state;
 const goal=state==='ATTACK_PASS'||state==='COMMIT'||state==='DISENGAGE'?p.combatPassHeading??p.a:state==='REPOSITION'?Math.atan2((p.combatPassWaypoint||target).y-p.y,(p.combatPassWaypoint||target).x-p.x):Math.atan2((target||home).y-p.y,(target||home).x-p.x);
 const turn=(p.personalityTurn||2.25)*dt*((state==='COMMIT'||state==='DISENGAGE')?.35:1);
 p.a+=clamp(angleDiff(goal,p.a),-turn,turn);
 return true;
}
