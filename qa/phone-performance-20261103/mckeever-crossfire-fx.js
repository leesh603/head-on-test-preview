// Bristol F.2B: fixed forward Vickers and independently aimed observer Lewis.
// Read real firing cues and rounds; never add a gun, projectile or target.
const clamp=v=>Math.max(0,Math.min(1,v));
const owner=p=>p.id??'p1';
// Local presentation cache only; snapshots already carry actual rear bursts.
// Keep powder at the observed muzzle, never attached to a following aircraft.
const bursts=new WeakMap();
function observeBurst(p,m,heading){
 const now=(p.combatWorld?.()||p).t;if(!Number.isFinite(now))return;
 let s=bursts.get(p);if(!s||s.owner!==owner(p)||now<s.time){s={owner:owner(p),time:now,flash:0,events:[]};bursts.set(p,s);}
 if(p.nineRearFlash>s.flash+.001){s.events.push({x:m.x,y:m.y,a:heading,at:now});if(s.events.length>3)s.events.shift();}
}
function drawBurstPowder(c,p,tex){
 const s=bursts.get(p),now=(p.combatWorld?.()||p).t;if(!s)return;
 if(!(p.skillTime>0)||s.owner!==owner(p)||!Number.isFinite(now)||now<s.time){bursts.delete(p);return;}
 s.time=now;s.flash=p.nineRearFlash||0;
 s.events=s.events.filter(e=>now-e.at<.22);
 for(const e of s.events){
  const age=now-e.at,q=age/.22,fade=(1-q)**1.3,ca=Math.cos(e.a),sa=Math.sin(e.a),pa=Math.cos(p.a),ps=Math.sin(p.a),a=e.a-p.a;
  // The three real-shot powder wisps drift off the observer's port side.
  for(let i=0;i<3;i++){
   const t=age+i*.018,side=7+t*105,wx=e.x+ca*8+sa*side-t*35,wy=e.y+sa*8-ca*side,dx=wx-p.x,dy=wy-p.y;
   tex(c,'gunSmoke',dx*pa+dy*ps,-dx*ps+dy*pa,24+t*60,12+t*40,a-.45,.43*fade*(1-i*.2));
   const cx=e.x+sa*(7+t*145)-t*18-p.x,cy=e.y-ca*(7+t*145)-p.y;
   tex(c,'bulletBrass',cx*pa+cy*ps,-cx*ps+cy*pa,7,2.6,a-1+t*15,.95*fade*(1-i*.14));
  }
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
 if(p.pilot!=='mckeever'||!(p.hp>0)||p.status==='downed'||p.state!=='playing'||p.reloadTime>0){bursts.delete(p);return;}
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
  // Crossfire changes presentation only while this station is actually firing.
  // The rear flag is stamped by the real strong rearBurst, not a nearby target.
  const crossfire=p.skillTime>0&&gun===1&&b.pilotRearActive===true;
  if(crossfire){
   const ca=Math.cos(a),sa=Math.sin(a);
   // The ordinary fixed forward flash stays unchanged. Only a real strong
   // observer burst gets this broad, brief flash at its existing mount.
   tex(c,'muzzleRear',x+ca*7,y+sa*7,40,19,a,.98*fade);
   observeBurst(p,m,heading);
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
