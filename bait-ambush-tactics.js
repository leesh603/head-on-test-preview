// The existing bait formation reacts only when a player elects to pursue its leader.
// Flight and fire still use the native enemy turn rates and projectile gates.
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const visible=p=>p?.hp>0&&p.status!=='downed'&&!p.fogHidden&&!(p.ballCloak>0)&&!(p.kaiserFogTime>0)&&!(p.cloudConceal>0);

export function clearBaitAmbush(e,target){
 if(!e?.directorBaitAmbush)return;
 delete e.directorBaitAmbush;delete e.directorBaitWaypoint;
 if(e.directorRoleTarget===target)e.directorRoleTarget=null;
}

export function tickBaitAmbush(game,squad,living,now){
 if(squad?.tactic!=='bait')return;
 if(squad.baitUntil){
  if(now>=squad.baitUntil||squad.broken||!visible(squad.baitTarget)){
   for(const e of living)clearBaitAmbush(e,squad.baitTarget);
   squad.baitUntil=0;
  }
  return;
 }
 if(squad.baitUsed||squad.broken||!living.includes(squad.leader)||living.length<3||now-squad.startedAt<.85||now-squad.startedAt>5.3)return;
 const leader=squad.leader;
 let target=null,best=490;
 for(const p of game.players||[game]){
  if(!visible(p)||!Number.isFinite(p.a))continue;
  const distance=Math.hypot(leader.x-p.x,leader.y-p.y);
  if(distance<160||distance>=best||Math.abs(angleDiff(Math.atan2(leader.y-p.y,leader.x-p.x),p.a))>.58)continue;
  target=p;best=distance;
 }
 if(!target)return;
 squad.baitUsed=true;squad.baitTarget=target;squad.baitUntil=now+2.4;
 for(const e of living){
  if(!['hunter','scout'].includes(e.type))continue;
  e.directorBaitAmbush=true;e.directorChoreographyDone=true;e.directorLaunchAt=0;e.directorIntentUntil=0;e.directorRallyUntil=0;
  e.combatPassState='APPROACH';e.combatPassTimer=0;e.combatPassCooldown=0;
  if(e===leader){e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,now+.9);continue;}
  e.directorRoleTarget=target;
  const side=e.directorSlot%2?1:-1;
  e.directorBaitWaypoint={x:target.x-Math.cos(target.a)*125-Math.sin(target.a)*side*130,y:target.y-Math.sin(target.a)*125+Math.cos(target.a)*side*130};
  e.directorFireHoldUntil=Math.max(e.directorFireHoldUntil||0,now+.3);
 }
}

export function baitAmbushSteering(game,e,contact,baseTurn,wrap,fighterAim){
 const squad=e?.directorSquad,now=game.t||0;
 if(!e?.directorBaitAmbush||!squad||squad.broken||now>=squad.baitUntil||!visible(squad.baitTarget)||!visible(contact)||baseTurn<=0||e.defensivePressure)return null;
 const target=squad.baitTarget;
 if(e===squad.leader){
  const heading=Math.atan2(e.y-target.y,e.x-target.x);
  return{delta:wrap(heading,e.a),turn:baseTurn};
 }
 const point=e.directorBaitWaypoint||target;
 const heading=Math.hypot(point.x-e.x,point.y-e.y)>115?Math.atan2(point.y-e.y,point.x-e.x):fighterAim(game,e,contact);
 return{delta:wrap(heading,e.a),turn:baseTurn};
}
