import {navarreEnemySpeedMultiplier} from './navarre-frommherz-combat.js';
// Formation stations are steering goals, never positions to interpolate toward.
// Shared by solo, co-op, ace escorts and authored pilot formations.
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
// Ace escorts fly toward their station during the ordinary enemy movement pass.
// Never correct their position or heading again after firing/collision handling.
export function advanceEscortFlight(world,wing,dt){
 const leader=wing.formationLeader;
 if(!leader||leader.hp<=0||leader.crashing||!world.enemies.includes(leader)||wing.directorSquad||wing.directorFormation||wing.stationary||world.sunStrikeContains?.(wing)){
  if(leader)wing.formationReturning=false;return false;
 }
 const ca=Math.cos(leader.a),sa=Math.sin(leader.a),back=wing.formationBack||0,side=wing.formationOffset||0;
 const station={x:leader.x-ca*back-sa*side,y:leader.y-sa*back+ca*side,a:leader.a};
 wing.formationReturning=Math.hypot(wing.x-leader.x,wing.y-leader.y)>520;
 const cruise=Math.max(80,leader.speed*(leader.energySpeed??1))*navarreEnemySpeedMultiplier(world,wing);
 return advanceWingFlight(wing,leader,station,dt,{cruiseSpeed:cruise,maxSpeed:cruise*1.65,turnRate:2.2});
}
export function advanceWingFlight(wing,owner,station,dt,options={}){
 if(!Number.isFinite(dt)||dt<=0||wing.carrierHidden)return false;
 const cruise=Math.max(80,options.cruiseSpeed??(owner.speed??170)*clamp(owner.airframeSpeed??1,.4,1.5));
 const handling=clamp(wing.personality?.highSpeedHandling??1,.75,1.25);
 const turn=clamp((options.turnRate??2.2)*handling,1.4,3.2);
 const acceleration=cruise*.85*clamp(wing.personality?.acceleration??1,.75,1.25);
 const heading=Number.isFinite(station.a)?station.a:owner.a||0,ca=Math.cos(heading),sa=Math.sin(heading);
 const ceiling=Math.max(cruise,options.maxSpeed??cruise*1.65),lead=clamp(cruise*.65,50,170);
 if(!Number.isFinite(wing.a))wing.a=heading;
 if(!Number.isFinite(wing.flightSpeed))wing.flightSpeed=cruise;
 let remaining=Math.min(dt,.2);
 while(remaining>1e-8){
  const step=Math.min(.02,remaining),dx=station.x-wing.x,dy=station.y-wing.y;
  // Look ahead along the formation course, so arriving aircraft keep flying.
  const goal=Math.atan2(dy+sa*lead,dx+ca*lead),error=angleDiff(goal,wing.a);
  const bank=clamp(error,-turn*step,turn*step);
  const along=dx*ca+dy*sa;
  const desired=clamp(cruise+along*.65,cruise*.6,ceiling)*(Math.abs(error)>1.2?.85:1);
  wing.flightSpeed+=clamp(desired-wing.flightSpeed,-acceleration*step,acceleration*step);
  wing.a+=bank;
  wing.x+=Math.cos(wing.a)*wing.flightSpeed*step;
  wing.y+=Math.sin(wing.a)*wing.flightSpeed*step;
  remaining-=step;
 }
 return true;
}
