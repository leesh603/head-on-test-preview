// Player Black Flight: the leader remains under player control. Existing two
// personal wingmen converge on one fixed course and pass it in sequence.
import {advanceWingFlight} from './wingman-flight.js?v=capital-final-20261030';
const runs=new WeakMap();
const owner=p=>p.id||'p1',angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const live=p=>p?.pilot==='collishaw'&&p.hp>0&&p.status!=='downed'&&p.skillTime>0;
const world=p=>p.combatWorld?.()||p;
function personal(p,w){return w.ownerId===owner(p)&&w.permanent&&!w.aceWingman&&!w.weaponModFormation&&!w.tacticalWing&&!w.boelckePincer&&!w.orbit&&!w.carrierHidden&&!w.crashing&&!w.crashed&&w.life>0&&(w.hp===undefined||w.hp>0)&&(w.slot===0||w.slot===1);}
export function beginCollishawJetstream(p){
 runs.set(p,{x:p.x,y:p.y,a:p.a,clock:p.identityState().clock||0,duration:p.skillTime,wings:new WeakMap()});
}
export function collishawJetstream(p){
 if(!live(p)){runs.delete(p);return null;}
 const run=runs.get(p);if(p.state!=='playing'||!run)return null;
 run.returning=(p.identityState().clock-run.clock)>=Math.min(3.72,run.duration*.62);
 return run;
}
export function advanceCollishawJetstream(p,w,dt,interval){
 const run=collishawJetstream(p);if(!run||run.returning||!personal(p,w)||!(dt>0)||!(interval>0)||!Number.isFinite(interval))return null;
 let member=run.wings.get(w);if(!member){member={index:w.slot,pending:0,release:0,shots:0};run.wings.set(w,member);}
 const age=Math.max(0,(p.identityState().clock||0)-run.clock),ca=Math.cos(run.a),sa=Math.sin(run.a),speed=230;
 const along=100+speed*age-member.index*110;
 // Steering goals, never teleports. Both followers use the same immutable line;
 // the second is 110px / .48s behind the first even if the leader turns away.
 const cruise=member.index===1&&age<.8?115:speed;
 advanceWingFlight(w,{a:run.a,speed:cruise,airframeSpeed:1},{x:run.x+ca*along,y:run.y+sa*along,a:run.a},dt,{cruiseSpeed:cruise,maxSpeed:member.index===1&&age<.8?180:285,turnRate:3.1});
 w.muzzleFlash=Math.max(0,(w.muzzleFlash||0)-dt);w.life-=dt;w.invuln=Math.max(0,(w.invuln||0)-dt);w.hitFlash=Math.max(0,(w.hitFlash||0)-dt);
 const target=(world(p).enemies||[]).some(e=>e.hp>0&&!e.expired&&!e.crashed&&!e.rivalEscaped&&Math.hypot(e.x-w.x,e.y-w.y)<650);
 // Original support cadence accrues the budget. Gathering delays shots rather
 // than creating extra salvos; only an existing live target can accrue a round.
 w.fire=(w.fire||0)-dt;
 if(target&&w.fire<=0){member.pending++;w.fire=interval;}
 else w.fire=Math.max(w.fire,0);
 member.release=Math.max(0,member.release-dt);
 const leadAlive=(world(p).allies||[]).some(a=>personal(p,a)&&a.slot===0);
 const releaseAt=member.index===0?.65:leadAlive?(run.firstStrike??Infinity)+.48:1.13;
 const side=-(w.x-run.x)*sa+(w.y-run.y)*ca,ready=age>=releaseAt&&Math.abs(side)<28&&Math.abs(angle(w.a-run.a))<.12;
 const shoot=target&&ready&&member.pending>0&&member.release<=0;
 if(shoot){member.pending--;member.shots++;member.release=.14;if(member.index===0)run.firstStrike??=age;}
 return {heading:run.a,shoot,age,index:member.index,pending:member.pending,shots:member.shots,side};
}
