// The Cavallino is a brief mark at the visible aircraft centre.
// Presentation only: charge travel, invulnerability and contacts stay in combat.
const clamp=n=>Math.max(0,Math.min(1,n));
export function baraccaHeraldryPose(p){
 if(p.pilot!=='baracca'||p.state!=='playing'||!(p.hp>0)||p.status==='downed')return null;
 const s=p.pilotSignatureState;
 if(p.chargeTime>0){
  const age=Math.max(0,(p.skillDuration?.()||1)-p.chargeTime);
  const entry=clamp(age/.08),fade=clamp(p.chargeTime/.14);
  return {active:true,age,a:(p.chargeAngle??p.a)-p.a+Math.PI/2,size:26+8*entry,alpha:.74*entry*fade};
 }
 // Only accepted, owned head-on damage reveals the passive stamp.
 const cue=s?.effects?.findLast(e=>e.kind==='cavalryHeadOn'&&e.ownerId===(p.id??'p1')&&e.life>0&&e.age>=0&&e.age<.28);
 if(!cue)return null;const fade=1-cue.age/.28;
 return {active:false,age:cue.age,a:Math.PI/2,size:18+4*(1-fade),alpha:.66*Math.sin(Math.PI*clamp(cue.age/.28))};
}
export function drawBaraccaHeraldry(c,p,insignia){
 const v=baraccaHeraldryPose(p);if(!v||!(v.alpha>0))return false;
 c.save();try{
  c.rotate(v.a);c.globalAlpha*=v.alpha;
  c.shadowColor='rgba(252,234,193,.9)';c.shadowBlur=2;
  return insignia(c,'baraccaHorse',0,0,v.size,v.age);
 }finally{c.restore();}
}
