// Bristol F.2B: fixed forward Vickers and independently aimed observer Lewis.
// Read real firing cues and rounds; never add a gun, projectile or target.
const clamp=v=>Math.max(0,Math.min(1,v));
const owner=p=>p.id??'p1';
// Each burst stores the observer's world-space station at the instant of firing.
function drawBurstPowder(c,p,tex){
 if(!(p.skillTime>0))return;
 const effects=p.pilotSignatureState?.effects||[];
 const pa=Math.cos(p.a),ps=Math.sin(p.a);
 for(let i=effects.length-1,count=0;i>=0&&count<3;i--){
  const e=effects[i],age=e.age;
  if(e.kind!=='rearBurst'||!e.strong||e.ownerId!==owner(p)||!(e.life>0)||!(age>=.018&&age<.28)||![e.stationX,e.stationY,e.a].every(Number.isFinite))continue;
  const q=age/.28,fade=(1-q)**1.25,a=e.a-p.a;
  const dx=e.stationX-p.x,dy=e.stationY-p.y,x=dx*pa+dy*ps,y=-dx*ps+dy*pa,co=Math.cos(a),si=Math.sin(a);
  // Two lobes of powder peel off the muzzle axis. Brass ejects to one side.
  for(let j=0;j<2;j++){
   const t=age-j*.035;if(t<.018)continue;
   const f=clamp((t-.018)/.03)*fade,forward=7+t*26,side=(j?1:-1)*(3+t*(j?65:45));
   tex(c,j?'gunSmoke':'mistPuff',x+co*forward-si*side,y+si*forward+co*side,23+t*57,15+t*29,a+(j?.24:-.26),(j?.64:.86)*f);
   const back=4+t*21,port=6+t*102;
   tex(c,'bulletBrass',x-co*back+si*port,y-si*back-co*port,7,3,a-.8+t*14,.94*f);
  }
  count++;
 }
}

const excluded=b=>['enemy','ally','formation','patrol','rocket','motorCannon','cow37','mauserRound','blast','actualExplosion','identityDot','identityChain'].some(k=>b[k]);
function round(p,gun){
 const bullets=(p.combatWorld?.()||p).bullets||[];
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];
  if(b.gun===gun&&(b.ownerId??'p1')===owner(p)&&b.life>0&&!excluded(b)&&Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&Math.hypot(b.x-p.x,b.y-p.y)<140)return b;
 }
}
export function drawMckeeverGuns(c,p,tex){
 if(p.pilot!=='mckeever'||!(p.hp>0)||p.status==='downed'||p.state!=='playing')return;
 if(p.reloadTime>0){drawBurstPowder(c,p,tex);return;}
 for(const gun of [0,1]){
  const flash=gun===1?p.nineRearFlash:p.muzzleFlash;
  if(!(flash>0))continue;
  const b=round(p,gun);if(!b)continue;
  const age=Math.max(0,(gun===1?.1:.055)-flash),heading=Math.atan2(b.vy,b.vx),a=heading-p.a;
  // The Bristol observer is in the aft cockpit, not on the tailplane.
  // Heavy-aircraft transfers retain their existing mount coordinates.
  const rearStation=p.bomberTransfer?.rear!==undefined?-p.bomberTransfer.rear:3;
  const m=gun===1?{x:p.x+Math.cos(p.a)*rearStation,y:p.y+Math.sin(p.a)*rearStation}:
   p.bomberGunMount?.(0,heading,p.weapon?.sortieMuzzleSide??0)||{x:p.x+Math.cos(p.a)*23,y:p.y+Math.sin(p.a)*23};
  const dx=m.x-p.x,dy=m.y-p.y,ca=Math.cos(p.a),sa=Math.sin(p.a),x=dx*ca+dy*sa,y=-dx*sa+dy*ca,fade=clamp(flash/(gun===1?.06:.035));
  // Crossfire changes presentation only while this station is actually firing.
  // The rear flag is stamped by the real strong rearBurst, not a nearby target.
  const crossfire=p.skillTime>0&&gun===1&&b.pilotRearActive===true;
  if(crossfire){
   const ca=Math.cos(a),sa=Math.sin(a);
   // The ordinary fixed forward flash stays unchanged. Only a real strong
   // observer burst gets this broad, brief flash at its existing mount.
   tex(c,'muzzleRear',x+ca*7,y+sa*7,36,15,a,.98*fade);
   continue;
  }
  tex(c,gun===1?'muzzleRear':'muzzle',x+Math.cos(a)*7,y+Math.sin(a)*7,gun===1?31:27,gun===1?13:10,a,.95*fade);
  // Short propwash carries spent powder aft; the observer's burst fans sideways.
  for(let i=0;i<(gun===1?3:2);i++){
   const t=age+i*.025,slip=t*80,side=gun===1?-1:1;
   tex(c,'gunSmoke',x+Math.cos(a)*9-slip,y+Math.sin(a)*9+side*t*20,22+t*70,11+t*36,a+side*t*2,(gun===1?.25:.18)*fade*(1-i*.22));
   tex(c,'bulletBrass',x-3-t*30,y+side*(5+t*95),6,2.4,side*(.4+t*11),.86*fade*(1-i*.15));
  }
 }
 drawBurstPowder(c,p,tex);
}
