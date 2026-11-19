// Observe an accepted first-contact delay. No new delay, target or damage.
const INSTALLED=Symbol.for('headon.proctor-suppression-fx.v1');
export function installProctorSuppressionFx(Game){const q=Game.prototype;if(Object.hasOwn(q,INSTALLED))return;Object.defineProperty(q,INSTALLED,{value:true});
 const impact=q.identityImpact;q.identityImpact=function(b,e,target=e,pos=e){
  const before=this.pilot==='proctor'?this.pilotIdentity?.five?.proctorSeen?.get(e):undefined,fire=e?.fire;
  const result=impact.call(this,b,e,target,pos);
  const after=this.pilotIdentity?.five?.proctorSeen?.get(e);
  // A consumed opportunity is not enough: show suppression only when the
  // authoritative firing timer actually moves later.
  if(this.pilot==='proctor'&&this.state==='playing'&&this.hp>0&&this.status!=='downed'&&Number.isFinite(after)&&after!==before&&Number.isFinite(fire)&&e.fire>fire){
   this.identityFx('proctorSuppression',b.x,b.y,Math.atan2(b.vy,b.vx),32,.55,{ownerId:this.id??'p1',delay:e.fire-fire});
  }
  return result;
 };
}

