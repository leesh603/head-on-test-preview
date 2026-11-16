// The existing Lafayette wing owns its position, turn and actual gun timer.
// No orbit geometry, target, shot, flight history or combat state is created here.
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawLafayetteWing(c,p,w,x,y,plane,tex){
 if(p.pilot!=='lufbery'||!(p.hp>0)||p.status==='downed'||p.state!=='playing'||w.ownerId!==(p.id??'p1')||w.aceWingman||w.carrierHidden||w.crashing||w.crashed||!(w.life>0)||w.hp<=0||!w.plane||![w.x,w.y,w.a,x,y].every(Number.isFinite))return false;
 if(!w.fiveLafayette&&!(w.permanent&&w.slot===p.fiveLafayetteSlot))return false;
 const scale=.94*(w.carrierScale??1),a=w.a,ca=Math.cos(a),sa=Math.sin(a);
 c.save();try{
  c.globalAlpha*=.95;
  plane(c,x+12,y+20,a,w.plane,scale,false,true);
  plane(c,x,y,a,w.plane,scale,false,false,w.hitFlash||0,w.hp!=null&&w.hp<=w.maxHp*.5);
  if(w.muzzleFlash>0){
   const aim=w.fireHeading??w.muzzleAngle??a,fade=clamp(w.muzzleFlash/.07),age=Math.max(0,.09-w.muzzleFlash);
   // The original identityShot muzzle remains at its real firing point.
   tex(c,'gunSmoke',x+Math.cos(aim)*19,y+Math.sin(aim)*19,29,13,aim,.42*fade);
   tex(c,'bulletBrass',x+ca*(10-age*45)-sa*(9+age*70),y+sa*(10-age*45)+ca*(9+age*70),5.5,2.5,a+.6+age*14,.82*fade);
  }
 }finally{c.restore();}
 return true;
}
