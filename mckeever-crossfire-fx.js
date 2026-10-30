// Bristol F.2B: fixed forward Vickers and independently aimed observer Lewis.
// Read real firing cues and rounds; never add a gun, projectile or target.
const clamp=v=>Math.max(0,Math.min(1,v));
const owner=p=>p.id??'p1';
const excluded=b=>['enemy','ally','formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
function round(p,gun){
 const bullets=(p.combatWorld?.()||p).bullets||[];
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];
  if(b.gun===gun&&(b.ownerId??'p1')===owner(p)&&b.life>0&&!excluded(b)&&Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&Math.hypot(b.x-p.x,b.y-p.y)<140)return b;
 }
}
export function drawMckeeverGuns(c,p,tex){
 if(p.pilot!=='mckeever'||!(p.hp>0)||p.status==='downed'||p.state!=='playing'||p.reloadTime>0)return;
 for(const gun of [0,1]){
  const b=round(p,gun);if(!b)continue;
  const flash=gun===1?p.nineRearFlash:p.muzzleFlash;
  if(!(flash>0))continue;
  const age=Math.max(0,(gun===1?.1:.055)-flash),heading=Math.atan2(b.vy,b.vx),a=heading-p.a;
  // The Bristol observer is in the aft cockpit, not on the tailplane.
  // Heavy-aircraft transfers retain their existing mount coordinates.
  const rearStation=p.bomberTransfer?.rear!==undefined?-p.bomberTransfer.rear:3;
  const m=gun===1?{x:p.x+Math.cos(p.a)*rearStation,y:p.y+Math.sin(p.a)*rearStation}:
   p.bomberGunMount?.(0,heading,p.weapon?.sortieMuzzleSide??0)||{x:p.x+Math.cos(p.a)*23,y:p.y+Math.sin(p.a)*23};
  const dx=m.x-p.x,dy=m.y-p.y,ca=Math.cos(p.a),sa=Math.sin(p.a),x=dx*ca+dy*sa,y=-dx*sa+dy*ca,fade=clamp(flash/(gun===1?.06:.035));
  tex(c,gun===1?'muzzleRear':'muzzle',x+Math.cos(a)*7,y+Math.sin(a)*7,gun===1?31:27,gun===1?13:10,a,.95*fade);
  // Short propwash carries spent powder aft; the observer's burst fans sideways.
  for(let i=0;i<(gun===1?3:2);i++){
   const t=age+i*.025,slip=t*80,side=gun===1?-1:1;
   tex(c,'gunSmoke',x+Math.cos(a)*9-slip,y+Math.sin(a)*9+side*t*20,22+t*70,11+t*36,a+side*t*2,(gun===1?.25:.18)*fade*(1-i*.22));
   tex(c,'bulletBrass',x-3-t*30,y+side*(5+t*95),6,2.4,side*(.4+t*11),.86*fade*(1-i*.15));
  }
 }
}
