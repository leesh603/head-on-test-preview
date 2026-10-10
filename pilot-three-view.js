// Draw only existing painted textures and real projectile paths. No filled halos.
const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
export function drawThreeWorld(c,p,fx,bolt){
 if(!['proctor','lufbery'].includes(p.pilot))return;
 const own=p.id||'p1';let count=0;
 for(const b of (p.combatWorld?.()||p).bullets||[]){
  if(b.enemy||b.life<=0||b.ownerId!==undefined&&b.ownerId!==own||!b.proctorSalvo&&!b.lafayetteShot)continue;
  if(Math.hypot(b.x-p.x,b.y-p.y)>800||count++>=28)continue;
  const a=Math.atan2(b.vy,b.vx),x=b.x-p.x,y=b.y-p.y;
  bolt(c,x,y,a,'#e5c995',b.proctorSalvo?34:22,b.proctorSalvo?3.3:2.5,.8);
 }
 const s=p.pilotIdentity?.three,e=s?.target;
 if(p.pilot==='lufbery'&&p.skillTime>0&&e?.hp>0){
  // Small smoke notches outside the airframe: selected enemy, never a beam.
  const x=e.x-p.x,y=e.y-p.y,a=Math.atan2(p.y-e.y,p.x-e.x),r=e.type==='bomber'?48:32;
  for(let side=-1;side<=1;side+=2){const b=a+side*.9;fx(c,'windStreak',x+Math.cos(b)*r,y+Math.sin(b)*r,27,7,b+side*.4,.58)}
 }
}
export function drawThreeLocal(c,p,fx){
 const s=p.pilotIdentity?.three;if(!s)return false;
 const active=p.skillTime>0,shot=p.muzzleFlash>0&&!(p.reloadTime>0),age=s.age||0;
 if(p.pilot==='proctor'){
  if(active){
   const q=(age%.6)/.6,a=(s.lane??p.a)-p.a;
   // Recoil smoke visibly separates the firing and re-aiming beats.
   if(shot){fx(c,'muzzleTwin',32,0,48,20,a,.85);fx(c,'gunSmoke',25,0,44,18,a,.3)}
   for(let side=-1;side<=1;side+=2)fx(c,'vaporTrail',-32-q*14,side*23,48,7,Math.PI,.18*(1-q));
  }
  if(shot)for(let i=0;i<2;i++)fx(c,'metalShard'+i,-9-i*8,13+i*7,5,3,age*7+i,.65);
  return true;
 }
 if(p.pilot==='schleich'){
  if(active)for(let side=-1;side<=1;side+=2){
   // The forward wedge is open: aircraft and incoming rounds stay readable.
   fx(c,'windStreak',24,side*22,74,12,-side*.55,.55);
   fx(c,'vaporTrail',-32,side*38,94,14,side*.16,.32);
  }
  return true;
 }
 if(p.pilot==='lufbery'){
  const turn=limit(s.turn,-3,3);
  if(Math.abs(turn)>.12||active)for(let side=-1;side<=1;side+=2){
   fx(c,'vaporTrail',-38,side*24+turn*4,active?77:44,8,Math.PI+turn*.12,active?.29:.16);
  }
  if(active&&shot){const a=(p.gunDirection?.(0)??p.a)-p.a;fx(c,'muzzleTwin',25,0,39,18,a,.82);fx(c,'gunSmoke',31,0,26,14,a,.28)}
  return true;
 }
 return false;
}
