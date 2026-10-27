// Shared, bounded manoeuvres for ordinary allied aircraft. Pilot-authored
// formations continue through their existing support poses.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function wingmanEngagementStep(world,owner,wing,home,dt){
 if(owner.upgrades?.lufberyCircle||owner.wingmanDamageMult>1||wing.boelckePincer||wing.orbit||['collishaw','brumowski','boelcke','goering'].includes(owner.pilot))return false;
 const now=world.t||0,active=wing.engagementTarget;
 if(active&&(active.hp<=0||!world.enemies.includes(active)||distance(active,owner)>580||distance(active,wing)>700))wing.engagementTarget=null;
 if((wing.engagementState==='HOME'||!wing.engagementState||wing.engagementState==='RETURN'&&distance(wing,home)<110)&&!wing.engagementTarget){
  let best=650,chosen=null;
  for(const enemy of world.enemies||[]){if(enemy.hp<=0||enemy.crashing||enemy.surface||enemy.stationary||distance(enemy,owner)>520)continue;
   const assigned=(world.allies||[]).filter(other=>other!==wing&&other.engagementTarget===enemy).length;
   const score=distance(enemy,wing)+assigned*230;
   if(score<best){best=score;chosen=enemy}
  }
  if(chosen){wing.engagementTarget=chosen;wing.engagementState='INTERCEPT';wing.engagementUntil=now+1.2}
 }
 if(!wing.engagementState||wing.engagementState==='HOME')return false;
 const target=wing.engagementTarget;
 if(wing.engagementState==='INTERCEPT'&&!target)wing.engagementState='RETURN';
 if(wing.engagementState==='INTERCEPT'&&target){
  const bearing=Math.atan2(target.y-wing.y,target.x-wing.x),gap=distance(wing,target);
  if(gap<240&&Math.abs(angleDiff(bearing,wing.a))<.55){wing.engagementState='PASS';wing.engagementUntil=now+.75;wing.engagementHeading=bearing}
 }
 if(wing.engagementState==='PASS'&&now>=wing.engagementUntil){wing.engagementState='BREAK';wing.engagementUntil=now+1.1;wing.engagementHeading=wing.a+((wing.slot||0)%2?-.7:.7);wing.engagementTarget=null}
 if(wing.engagementState==='BREAK'&&now>=wing.engagementUntil)wing.engagementState='RETURN';
 if(wing.engagementState==='RETURN'&&distance(wing,home)<80){wing.engagementState='HOME';wing.engagementTarget=null;return false}
 if(distance(wing,owner)>500){wing.engagementState='RETURN';wing.engagementTarget=null}
 const goal=wing.engagementState==='INTERCEPT'&&target?Math.atan2(target.y-wing.y,target.x-wing.x):wing.engagementState==='RETURN'?Math.atan2(home.y-wing.y,home.x-wing.x):wing.engagementHeading??wing.a;
 const turn=clamp((wing.personality?.highSpeedHandling||1)*(wing.engagementState==='RETURN'?2.8:2.25),1.6,3.3)*dt;
 wing.a+=clamp(angleDiff(goal,wing.a),-turn,turn);
 const speed=wing.engagementState==='RETURN'?clamp((owner.speed||170)*1.45,210,290):clamp((owner.speed||170)*1.08*(wing.personality?.acceleration||1),145,225);
 wing.x+=Math.cos(wing.a)*speed*dt;wing.y+=Math.sin(wing.a)*speed*dt;
 return true;
}

export function wingmanAttackTarget(wing){return wing.engagementState==='INTERCEPT'||wing.engagementState==='PASS'?wing.engagementTarget:null}

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
