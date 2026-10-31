// Observe the existing first-contact delay. No new delay, target or damage.
const INSTALLED=Symbol.for('headon.proctor-suppression-fx.v1');
export function installProctorSuppressionFx(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const impact=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){
  const before=this.pilot==='proctor'?this.pilotIdentity?.five?.proctorSeen?.get(e):undefined,fire=e?.fire;
  const result=impact.call(this,b,e,target,pos);
  const after=this.pilotIdentity?.five?.proctorSeen?.get(e);
  // A consumed first-contact opportunity is not necessarily a delayed shot:
  // if its existing fire timer already exceeds the floor, do not claim success.
  if(this.pilot==='proctor'&&this.state==='playing'&&this.hp>0&&this.status!=='downed'&&Number.isFinite(after)&&after!==before&&Number.isFinite(fire)&&e.fire>fire){
   this.identityFx('proctorSuppression',b.x,b.y,Math.atan2(b.vy,b.vx),32,.38,{ownerId:this.id??'p1'});
  }
  return result;
 };
}
