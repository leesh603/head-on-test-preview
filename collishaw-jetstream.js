// Player Black Flight: the leader remains under player control. Existing two
// personal wingmen flank a shared target, make two finite burst passes, then rejoin.
import {advanceWingFlight} from './wingman-flight.js?v=flight20261023';
const runs=new WeakMap();
const owner=p=>p.id||'p1',angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const live=p=>p?.pilot==='collishaw'&&p.hp>0&&p.status!=='downed'&&p.skillTime>0;
const world=p=>p.combatWorld?.()||p;
export const BLACK_FLIGHT=Object.freeze({passes:2,rounds:3,medalRounds:4,stagger:.48,returnSeconds:1,medalReturnSeconds:1.3});
function personal(p,w){return w.ownerId===owner(p)&&w.permanent&&!w.aceWingman&&!w.weaponModFormation&&!w.tacticalWing&&!w.boelckePincer&&!w.orbit&&!w.carrierHidden&&!w.crashing&&!w.crashed&&w.life>0&&(w.hp===undefined||w.hp>0)&&(w.slot===0||w.slot===1);}
const targetAlive=e=>e?.hp>0&&!e.expired&&!e.crashing&&!e.crashed&&!e.rivalEscaped&&!e.destroyed;
function attackTarget(p,run){
 let best=null,bestScore=Infinity;
 for(const e of world(p).enemies||[]){
  if(!targetAlive(e)||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
  const dx=e.x-p.x,dy=e.y-p.y,distance=Math.hypot(dx,dy);
  if(distance>650)continue;
  const score=distance+125*Math.abs(angle(Math.atan2(dy,dx)-run.a));
  if(score<bestScore){best=e;bestScore=score;}
 }
 return best;
}
export function beginCollishawJetstream(p){
 const run={x:p.x,y:p.y,a:p.a,clock:p.identityState().clock||0,duration:p.skillTime,wings:new WeakMap(),slots:new Map(),passStrikes:[]};
 run.target=attackTarget(p,run);runs.set(p,run);
}
export function collishawJetstream(p){
 if(!live(p)){runs.delete(p);return null;}
 const run=runs.get(p);if(p.state!=='playing'||!run)return null;
 run.returning=(p.identityState().clock-run.clock)>=run.duration-(p.skillEnhanced?BLACK_FLIGHT.medalReturnSeconds:BLACK_FLIGHT.returnSeconds);
 return run;
}
export function advanceCollishawJetstream(p,w,dt,interval){
 const run=collishawJetstream(p);if(!run||!personal(p,w)||!(dt>0)||!(interval>0)||!Number.isFinite(interval))return null;
 let member=run.wings.get(w);if(!member){member=run.slots.get(w.slot)||{index:w.slot,phase:'spread',phaseAt:0,pass:0,inPass:0,release:0,shots:0};run.wings.set(w,member);run.slots.set(w.slot,member);}
 const age=Math.max(0,(p.identityState().clock||0)-run.clock);
 if(!targetAlive(run.target))run.target=attackTarget(p,run);
 const target=run.target,axis=run.a,ca=Math.cos(axis),sa=Math.sin(axis);
 const side=member.index===0?1:-1;
 const tx=target?.x??run.x+ca*360,ty=target?.y??run.y+sa*360;
 const rounds=p.skillEnhanced?BLACK_FLIGHT.medalRounds:BLACK_FLIGHT.rounds;
 const change=phase=>{if(member.phase===phase)return;member.phase=phase;member.phaseAt=age;if(phase==='attack')delete member.attackHeading;};
 if(member.target!==target){member.target=target;delete member.attackHeading;if(member.phase==='attack')member.phaseAt=age;}
 if(run.returning||member.finished)change('return');
 else if(!target)change('escort');
 else if(member.phase==='escort')change('spread');
 const leadAlive=(world(p).allies||[]).some(a=>personal(p,a)&&a.slot===0);
 const attackAt=member.index===0?.30:leadAlive?(run.passStrikes[0]??.95)+BLACK_FLIGHT.stagger:1;
 if(member.phase==='spread'&&age>=attackAt)change('attack');
 if(member.phase==='attack'&&((member.inPass>=rounds&&age-member.lastShot>=.16)||age-member.phaseAt>1.7)){
  member.exitHeading=w.a;change('break');
 }
 if(member.phase==='break'&&age-member.phaseAt>=.32){
  if(member.pass+1<BLACK_FLIGHT.passes){member.pass++;member.inPass=0;member.approach=false;change('reposition');}
  else{member.finished=true;change('return');}
 }
 const stage={x:tx+ca*185-sa*side*145,y:ty+sa*185+ca*side*145,a:axis+Math.PI};
 if(member.phase==='reposition'){
  const passReleaseAt=member.index===0?0:leadAlive?(run.passStrikes[member.pass]??3.05)+BLACK_FLIGHT.stagger:2.8;
  if((w.x-tx)*ca+(w.y-ty)*sa>110)member.approach=true;
  if(member.approach&&age>=Math.max(2.2+member.index*.3,passReleaseAt)&&Math.abs(angle(Math.atan2(ty-w.y,tx-w.x)-w.a))<.45)change('attack');
 }
 let station,cruise=220;
 if(member.phase==='return'||member.phase==='escort'){
  station=p.wingFormationTarget?.(w,p.permanentWingCount?.()??2)||{x:p.x-ca*45-sa*side*65,y:p.y-sa*45+ca*side*65,a:p.a};
  station={...station,a:p.a};cruise=Math.max(205,p.speed||170);
 }else if(member.phase==='spread'){const aft=130+member.index*100;station={x:tx-ca*aft-sa*side*80,y:ty-sa*aft+ca*side*80,a:axis};cruise=190;}
 else if(member.phase==='break'){
  const heading=member.exitHeading;station={x:w.x+Math.cos(heading)*180-Math.sin(heading)*side*70,y:w.y+Math.sin(heading)*180+Math.cos(heading)*side*70,a:heading+side*.4};
 }else if(member.phase==='reposition')station={...stage,a:member.approach?axis+Math.PI:axis};
 else if(member.attackHeading!==undefined)station={x:w.x+Math.cos(member.attackHeading)*220,y:w.y+Math.sin(member.attackHeading)*220,a:member.attackHeading};
 else station={x:tx,y:ty,a:Math.atan2(ty-w.y,tx-w.x)};
 advanceWingFlight(w,{a:station.a,speed:cruise},station,dt,{cruiseSpeed:cruise,maxSpeed:260,turnRate:3.1});
 w.muzzleFlash=Math.max(0,(w.muzzleFlash||0)-dt);w.life-=dt;w.invuln=Math.max(0,(w.invuln||0)-dt);w.hitFlash=Math.max(0,(w.hitFlash||0)-dt);
 const fireHeading=Math.atan2(ty-w.y,tx-w.x);
 const inRange=target&&Math.hypot(tx-w.x,ty-w.y)<650;
 // A finite three/four-round burst per pass. No accumulated shot debt and no
 // shooting backwards during the break, reposition or return phases.
 w.fire=Math.max(0,(w.fire||0)-dt);
 member.release=Math.max(-dt,member.release-dt);
 const first=run.passStrikes[member.pass],fallback=member.pass===0?.95:3.05;
 const releaseAt=member.index===0?0:leadAlive?(first??fallback)+BLACK_FLIGHT.stagger:member.pass===0?1.0:2.8;
 const ready=member.phase==='attack'&&age>=releaseAt&&Math.abs(angle(fireHeading-w.a))<.18;
 if(!ready)member.release=Math.max(0,member.release);
 const shoot=!!inRange&&ready&&member.inPass<rounds&&member.release<=0;
 if(shoot){member.inPass++;member.shots++;member.lastShot=age;member.attackHeading??=fireHeading;member.release+=Math.max(.07,Math.min(.12,interval*.25));w.fire=member.release;if(member.index===0){run.firstStrike??=age;run.passStrikes[member.pass]??=age;}}
 return {heading:fireHeading,shoot,age,index:member.index,pass:member.pass,phase:member.phase,pending:0,shots:member.shots,side};
}

