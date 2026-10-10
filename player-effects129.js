import {createSignatureView} from './pilot-signature-view.js?v=gal1';
import {fx,fxTint} from './fx-art.js?v=gal1';
import {planeSprite,aircraftKey} from './aircraft.js?v=gal1';
import {drawHorseSilhouette,drawPowerInstrument} from './equipment-material-fx.js?v=eqfx2';

import {drawCavalryGuard} from './pilot-directed-fx.js';
const drawPilotSignatureLayer=createSignatureView(drawPetalParticle);
// Shared solo/co-op aircraft presentation; combat positions remain authoritative.
export function playerPose(p,x,y){
 const t=Math.max(0,Math.min(1,(p.cannonRecoil129||0)/.24));
 const kick=(p.cannonKick129||0)*Math.sin(t*Math.PI/2);
 const altitude=p.pilot==='immelmann'?(p.immelmannAltitude||0):0;
 const height=altitude*52;
 const roll=p.pilot==='huffzky'&&p.skillTime>0?Math.sin(p.nineRoll||0)*4:p.pilot==='udet'&&p.skillTime>0?Math.sin((p.t||0)*45)*.8:0;
 return {x:x-Math.cos(p.a)*kick-Math.sin(p.a)*roll,y:y-Math.sin(p.a)*kick+Math.cos(p.a)*roll-height,scale:(p.aceScale129||1)*(1+altitude*.1),height,shadowX:18+altitude*10,shadowY:28+altitude*12,shadowScale:1-altitude*.3,shadowAlpha:1-altitude*.35};
}
// Project the existing aircraft art through pitch and roll instead of swapping
// its heading at the apex. Vertical projection keeps the rising fuselage visible.
export function applyPlayerAttitude(c,p,pose={},shadow=false){
 const m=p.pilot==='immelmann'&&p.immelmannTurn;
 if(!m){c.rotate(p.a+(shadow?0:pose.roll||0));if(!shadow)c.scale(1,pose.bank??1);return}
 const h=m.heading,theta=m.pitch||0,phi=m.roll||0;
 const ch=Math.cos(h),sh=Math.sin(h),ct=Math.cos(theta),st=Math.sin(theta),cr=Math.cos(phi),sr=Math.sin(phi),depth=shadow?.12:.42;
 let a=ch*ct,b=sh*ct-depth*st,d=ch*cr-sh*st*sr-depth*ct*sr,w=-sh*cr-ch*st*sr;
 // Flat artwork has no fuselage thickness. Keep a narrow edge-on profile so
 // Canvas never drops the entire aircraft at a singular pitch/roll angle.
 const det=a*d-b*w,thickness=shadow?.025:.06;
 if(Math.abs(det)<thickness){
  const correction=(det<0?-thickness:thickness)-det,forward=a*a+b*b,wing=w*w+d*d;
  if(wing>forward){a+=correction*d/wing;b-=correction*w/wing}
  else{w-=correction*b/forward;d+=correction*a/forward}
 }
 c.transform(a,b,w,d,0,0);
}
export function drawPlayerAura(c,p,x,y){
 drawEquipmentEffects151(c,p,x,y);
 drawPrecisionEquipment156(c,p,x,y);
 if(p.ballCloak>0)fx(c,'mist',x,y,72,38,p.a,Math.min(.35,p.ballCloak*.3));
 // The reversal is carried by the aircraft pose and a short signature trail.
 if(p.fxOverheat>0&&p.pilot!=='udet')fx(c,'muzzle',x+Math.cos(p.a)*24,y+Math.sin(p.a)*24,28,20,p.a,Math.min(.7,p.fxOverheat));
 for(const g of p.pilot==='immelmann'?[]:p.pilotIdentity?.feedback?.ghosts||[]){c.save();c.globalAlpha*=.3*Math.pow(Math.max(0,g.life/g.maxLife),.8);planeSprite(c,x+g.x-p.x,y+g.y-p.y,g.a,aircraftKey(g.plane,false,g.pilot),g.scale,false,false);c.restore()}
 for(const f of p.pilotIdentity?.fx||[]){if(p.pilot==='immelmann'&&f.key==='windStreak')continue;const q=Math.min(1,f.life/.12),alpha=q*(f.alpha??.72),height=f.height??(f.key==='windStreak'?f.size*.35:f.size);if(f.color)fxTint(c,f.key,f.color,x+f.x-p.x,y+f.y-p.y,f.size,height,f.a,alpha);else fx(c,f.key,x+f.x-p.x,y+f.y-p.y,f.size,height,f.a,alpha)}
 if(p.pilotSignatureState)drawPilotSignatureLayer(c,p,x,y);
}

// Same visual language as tail lock; derived from the real passive state.
export function passiveGaugeProgress(p){
 if(p.pilot==='wolff')return Math.min(1,Math.max(0,(p.wolffSafeTime||0)/18));
 if(p.pilot==='nungesser')return Math.min(1,Math.max(0,(1-p.hp/p.maxHp)/.8));
 return 0;
}
export function drawPassiveGauge(c,p,x,y){/* Nungesser uses airframe smoke rather than an instrument ring. */}

export function drawPetalParticle(c,p,x,y){
 if(p.life<=0)return;
 c.save();c.translate(x,y);c.rotate(p.angle+(p.maxLife-p.life)*p.spin);
 c.globalAlpha=.78*Math.min(1,p.life/.25);c.fillStyle='#f5eedb';
 c.beginPath();c.moveTo(-p.size,0);c.quadraticCurveTo(0,-p.size*.8,p.size,0);c.quadraticCurveTo(0,p.size*.55,-p.size,0);c.fill();
 c.strokeStyle='#cabda6';c.lineWidth=.7;c.beginPath();c.moveTo(-p.size*.65,0);c.lineTo(p.size*.55,0);c.stroke();c.restore();
}

// Equipment uses its real activation state. These small, bounded drawings never
// create particles, change damage, or simulate an ability in the render loop.
function drawScarf(c,t){
 // Two folded cloth tails, attached behind the cockpit, not speed trails.
 for(let side=-1;side<=1;side+=2){
  const wave=Math.sin(t*11+side)*3,tip=Math.sin(t*8+side)*5;
  c.beginPath();c.moveTo(-12,side*5);c.bezierCurveTo(-27,side*7+wave,-33,side*13-wave,-51,side*10+tip);
  c.lineTo(-44,side*7+tip);c.bezierCurveTo(-32,side*8-wave,-25,side*3+wave,-12,side*3);c.closePath();
  c.fillStyle=side<0?'#772b2a':'#a43c32';c.fill();c.strokeStyle='#402c24';c.lineWidth=1;c.stroke();
  c.beginPath();c.moveTo(-16,side*4);c.bezierCurveTo(-28,side*5+wave,-34,side*10-wave,-45,side*9+tip);
  c.strokeStyle='#c46b50';c.lineWidth=.7;c.stroke();
 }
}
function drawEquipmentEffects151(c,p,x,y){
 if(p.hp<=0)return;const t=p.t||0;c.save();c.translate(x,y);c.rotate(p.a);
 if(p.pilot==='baracca'&&p.prancingHorseFlash160>0)drawCavalryGuard(c,Math.min(1,p.prancingHorseFlash160/.34));
 // Existing engine upgrade is outside the special-equipment pass.
 if(p.upgrades?.mercedesEngine){const output=Math.max(0,Math.min(1,p.mercedesOutput160||0));c.save();c.globalAlpha=.18+output*.28;c.strokeStyle='#c6d0c6';c.lineWidth=1+output*.7;for(const side of [-1,1]){c.beginPath();c.moveTo(-25,side*8);c.quadraticCurveTo(-40-output*13,side*(10+Math.sin(t*18)*2),-52-output*24,side*12);c.stroke()}c.restore()}
 if(p.scarffRing){
  const a=(p.scarffAim??p.a)-p.a;c.save();c.rotate(a);
  // Short inked bearing at the gun, following the actual 66 degree/s mount.
  c.lineCap='round';c.strokeStyle='#30291f';c.lineWidth=4;c.beginPath();c.moveTo(24,0);c.lineTo(35,0);c.stroke();
  c.strokeStyle='#c4b696';c.lineWidth=1.5;c.stroke();c.restore();
 }
 if(p.upgrades?.redScarf)drawScarf(c,t);
 c.restore();
}

function drawPrecisionEquipment156(c,p,x,y){
 if(p.hp<=0)return;
 const t=p.t||p.world?.t||0,held=p.upgrades||{};
 c.save();c.translate(x,y);
 if(p.telescopeFocus156>0&&p.telescopeTarget156?.hp>0){
  const e=p.telescopeTarget156,dx=e.x-p.x,dy=e.y-p.y;
  const settle=Math.min(1,p.telescopeFocus156/.06),r=21+(1-settle)*3;
  // Only mark the real selected target; a long line suggested a laser weapon.
  c.save();c.translate(dx,dy);c.globalAlpha*=settle*.9;
  for(let pass=0;pass<2;pass++){
   c.strokeStyle=pass?'#d6c59c':'#302b24';c.lineWidth=pass?1.2:3.2;
   for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,r,i*Math.PI/2+.2,i*Math.PI/2+.65);c.stroke()}
  }c.restore();
 }
 c.save();c.rotate(p.a);
 if(held.badinGauge&&typeof p.badinDamageBonus==='function'){
  const q=Math.min(1,p.badinDamageBonus()/.6);
  // Sustained-power instrument, not blue speed lines that imply a dash.
  if(q>0){c.save();c.translate(-13,34);c.rotate(-p.a);drawPowerInstrument(c,q,.85);c.restore()}
 }
 if(held.immelmannManual&&p.evadeTime>0){
  const f=Math.min(1,p.evadeTime/.18);
  // Two compact wingtip condensations are tied to the real evasive maneuver.
  for(let s=-1;s<=1;s+=2)fx(c,'vaporTrail',-18,s*27,31,7,Math.PI+s*.15,f*.45);
 }
 if((held.flightGloves||held.maximBelt)&&p.muzzleFlash>0&&p.reloadTime===0){
  // Expelled brass marks rapid firing; its scale stays below a live bullet.
  const q=1-Math.min(1,p.muzzleFlash/.1);
  for(let i=0;i<(held.flightGloves?3:2);i++){const d=10+q*14+i*5;fx(c,'bulletBrass',7-i*4,18+d,7,3,1.2+i*.8+q,Math.max(0,.7-q*.6))}
 }
 if(held.maximBelt&&p.reloadTime>0){
  // Feeding links close toward the receiver; no permanently floating belt.
  const shift=(t*18)%5;c.save();c.globalAlpha*=.8;
  for(let i=0;i<5;i++){const yy=12+i*4-shift;c.strokeStyle='#342a1d';c.lineWidth=3;c.beginPath();c.moveTo(-8,yy);c.lineTo(-2,yy-1);c.stroke();c.strokeStyle='#bd9b60';c.lineWidth=1.3;c.stroke()}
  c.restore();
 }
 if(held.quadLewis&&p.muzzleFlash>0&&p.reloadTime===0){
  const a=(p.gunDirection?.(0)??p.a)-p.a;c.save();c.rotate(a);
  for(let i=0;i<4;i++)fx(c,'muzzle',29,(i-1.5)*8,19,11,0,Math.min(.8,p.muzzleFlash*8));c.restore();
 }
 // Mauser already has its own muzzle, aimed projectile and hit FX in the
 // actual weapon renderer. Do not overlay a second purple pseudo-projectile.
 c.restore();
 if(held.fogCompass){
  // Trace only drops actually moving inward within this owner's pickup range.
  let count=0;const world=p.combatWorld?.()||p;
  for(const d of world.drops||[]){const dx=d.x-p.x,dy=d.y-p.y,dist=Math.hypot(dx,dy);if(dist<30||dist>p.magnet||d.supply)continue;
   if(count++===6)break;const ux=dx/dist,uy=dy/dist;c.save();c.globalAlpha*=.38;c.strokeStyle=d.heal?'#b9c8a0':'#d7bd7c';c.lineWidth=1.2;
   c.beginPath();c.moveTo(dx+ux*7,dy+uy*7);c.lineTo(dx+ux*18,dy+uy*18);c.stroke();c.restore();
  }
 }
 // Mobilization is represented by its actual three additional wingmen, not
 // unrelated chevrons attached to the player's aircraft.
 // The inventory already confirms acquisition. Do not duplicate item cards
 // above the aircraft, including the horse's former round badge.

 c.restore();
}

export function drawEquipmentDefense(c,p,x,y){
 c.save();c.translate(x,y);c.rotate(p.a);
 // Above the airframe: the isolated horse cannot disappear beneath a wing.
 if(p.prancingHorseFlash160>0){
  const f=Math.min(1,p.prancingHorseFlash160/.14),a=(p.equipmentImpactAngle??p.a)-p.a;
  fx(c,'ricochet',Math.cos(a)*29,Math.sin(a)*22,38,22,a,f*.75);
  c.save();c.translate(43,0);c.rotate(-p.a);drawHorseSilhouette(c,0,-5,34,f*.92);c.restore();
 }
 if(p.repairFlash151>0){
  const q=1-p.repairFlash151/.75,f=Math.min(1,q*10)*Math.min(1,p.repairFlash151/.2);
  // Brief light catches the existing wing fabric as the repair completes.
  // No floating toolbox, green aura, or false damage smoke.
  for(let side=-1;side<=1;side+=2){
   const y=side*(27-q*16);fx(c,'spark',1,y,12,8,side*.45,f*.65);
   c.save();c.globalAlpha*=f*.8;c.strokeStyle='#d6c5a0';c.lineWidth=1;
   c.beginPath();c.moveTo(-6,y-side*3);c.lineTo(6,y-side*1);c.stroke();c.restore();
  }
 }
 if(p.upgrades?.ironCross&&p.skillTime>0){
  // A restrained gilt glint on both wings during the actual active skill.
  // The medal itself stays in the HUD, where it is legible.
  const pulse=Math.pow(Math.max(0,Math.sin((p.t||0)*5)),8);
  if(pulse>.02)for(let side=-1;side<=1;side+=2)fx(c,'spark',2,side*24,14,6,p.a,pulse*.5);
 }

 if(p.jArmorCapsule&&p.equipmentArmorFlash>0){
  const q=1-p.equipmentArmorFlash/.24,a=(p.equipmentImpactAngle??p.a)-p.a;
  const ix=Math.cos(a)*29,iy=Math.sin(a)*24;
  fx(c,'ricochet',ix,iy,60,38,a,(1-q)*.95);
  // A couple of metal fragments travel away from the impact; no force field.
  for(let i=0;i<2;i++){const b=a+(i?-.45:.45),d=8+q*30;fx(c,'metalShard'+i,ix+Math.cos(b)*d,iy+Math.sin(b)*d,17,10,b+q*3,(1-q)*.65)}
 }
 if(p.kaiserFogTime>0){
  const age=3-p.kaiserFogTime,fade=Math.min(1,age/.25,p.kaiserFogTime/.55);
  // An irregular trailing smoke curtain; the nose and incoming rounds remain
  // readable. Fixed six sprites, no per-frame particle or gradient allocation.
  for(let i=0;i<6;i++){const q=((age*.55+i/6)%1),side=i%2?1:-1;
   fx(c,'smokeWisp',-8-q*64,side*(8+q*26),62+q*51,45+q*29,Math.PI+side*.25,fade*(1-q)*.44);
  }
 }
 if(p.rankinFlash>0){
  const q=1-p.rankinFlash/.5,fade=Math.min(1,p.rankinFlash/.18);
  // The complete rear 220-degree fan, with an outward expanding shrapnel
  // front. Visual radius is deliberately smaller than the 500px hit range.
  fx(c,'shellBurst0',-30,0,42+q*18,40,Math.PI,Math.max(0,1-q*3)*.65);
  for(let i=0;i<9;i++){const a=Math.PI+(i/8-.5)*220*Math.PI/180,d=35+q*(58+(i%3)*12);
   fx(c,'metalShard'+i%3,Math.cos(a)*d,Math.sin(a)*d,24-i%2*4,14,a+q*2,fade*.95);
   if(i%2===0)fx(c,'spark',Math.cos(a)*d,Math.sin(a)*d,21,21,a,fade*.65);
   if(i%2===0)fx(c,'smokePuff',Math.cos(a)*(d-9),Math.sin(a)*(d-9),30+q*22,22+q*14,a,fade*.4);
  }
 }
 c.restore();
}

// Aircraft silhouettes use the live sprite and world positions, behind the player.
const redGhostCanvas162=typeof document==='undefined'?null:document.createElement('canvas');
if(redGhostCanvas162){redGhostCanvas162.width=180;redGhostCanvas162.height=180;}
export function drawRedGhosts162(c,p,x,y,sprite,key){
 if(!redGhostCanvas162||!p.redGhosts162?.length)return;
 const ink=redGhostCanvas162.getContext('2d');c.save();
 for(const g of p.redGhosts162){
  ink.clearRect(0,0,180,180);ink.save();sprite(ink,90,90,g.a,key,1,false,false);
  ink.globalCompositeOperation='source-in';ink.fillStyle='#b51f32';ink.fillRect(0,0,180,180);ink.restore();
  c.globalAlpha=.38*Math.pow(Math.max(0,g.life/.32),1.25);c.drawImage(redGhostCanvas162,x+g.x-p.x-90,y+g.y-p.y-90);
 }c.restore();
}

