// The existing Lafayette wing owns its position, turn and actual gun timer.
// No orbit geometry, target, shot, flight history or combat state is created here.
const clamp=n=>Math.max(0,Math.min(1,n));
export function lafayetteWingPose(p,w){
 const returning=w.fiveLafayette&&!(p.skillTime>0&&p.pilotIdentity?.five?.orbit);
 const turn=returning?0:Math.max(-1,Math.min(1,Number.isFinite(w.fiveBank)?w.fiveBank:0));
 return {bank:1-Math.abs(turn)*.24,scale:.78*(w.carrierScale??1)};
}
export function drawLafayetteWing(c,p,w,x,y,plane,tex){
 if(p.pilot!=='lufbery'||!(p.hp>0)||p.status==='downed'||p.state!=='playing'||w.ownerId!==(p.id??'p1')||w.aceWingman||w.carrierHidden||w.crashing||w.crashed||!(w.life>0)||w.hp<=0||!w.plane||![w.x,w.y,w.a,x,y].every(Number.isFinite))return false;
 if(!w.fiveLafayette&&!(w.permanent&&w.slot===p.fiveLafayetteSlot))return false;
 const pose=lafayetteWingPose(p,w),a=w.a,ca=Math.cos(a),sa=Math.sin(a);
 c.save();try{
  c.globalAlpha*=.95;
  c.save();c.translate(x+12,y+20);c.rotate(a);c.scale(1,pose.bank);plane(c,0,0,0,w.plane,pose.scale,false,true);c.restore();
  c.save();c.translate(x,y);c.rotate(a);c.scale(1,pose.bank);plane(c,0,0,0,w.plane,pose.scale,false,false,w.hitFlash||0,w.hp!=null&&w.hp<=w.maxHp*.5);c.restore();
  if(w.muzzleFlash>0){
   const aim=w.fireHeading??w.muzzleAngle??a,fade=clamp(w.muzzleFlash/.07),age=Math.max(0,.09-w.muzzleFlash);
   // The original identityShot muzzle remains at its real firing point.
   tex(c,'gunSmoke',x+Math.cos(aim)*19,y+Math.sin(aim)*19,29,13,aim,.42*fade);
   tex(c,'bulletBrass',x+ca*(10-age*45)-sa*(9+age*70),y+sa*(10-age*45)+ca*(9+age*70),5.5,2.5,a+.6+age*14,.82*fade);
  }
 }finally{c.restore();}
 return true;
}
