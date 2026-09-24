import {drawGameIcon} from './icons.js?v=304';
// Shared solo/co-op aircraft presentation; combat positions remain authoritative.
export function playerPose(p,x,y){
 const t=Math.max(0,Math.min(1,(p.cannonRecoil129||0)/.24));
 const kick=(p.cannonKick129||0)*Math.sin(t*Math.PI/2);
 return {x:x-Math.cos(p.a)*kick,y:y-Math.sin(p.a)*kick,scale:p.aceScale129||1};
}
export function drawPlayerAura(c,p,x,y){
 drawPassiveGauge(c,p,x,y);
 drawEquipmentEffects151(c,p,x,y);
 drawPrecisionEquipment156(c,p,x,y);
 if(!(p.skillTime>0))return;
 c.save();c.translate(x,y);
 if(p.pilot==='nungesser'){
  // The heart tip is local +Y: rotate it onto the aircraft's forward vector.
  c.rotate(p.a-Math.PI/2);c.scale(.66,.66);
  const pulse=.5+.5*Math.sin(p.skillTime*7),fade=Math.min(1,p.skillTime/.2);
  c.beginPath();c.moveTo(0,53);
  c.bezierCurveTo(-100,-7,-52,-73,0,-34);c.bezierCurveTo(52,-73,100,-7,0,53);c.closePath();
  c.fillStyle='#100e19';c.globalAlpha=.34*fade;c.fill();
  c.strokeStyle='#a697c7';c.lineJoin='round';c.globalAlpha=(.1+pulse*.04)*fade;c.lineWidth=7;c.stroke();
  c.strokeStyle='#c1b2df';c.globalAlpha=(.48+pulse*.12)*fade;c.lineWidth=1.8;c.stroke();
  // A restrained highlight at the forward tip makes rotation easy to read.
  c.strokeStyle='#eee6ff';c.globalAlpha=.65*fade;c.lineWidth=1.6;c.beginPath();c.moveTo(-9,43);c.lineTo(0,53);c.lineTo(9,43);c.stroke();
 }else if(p.pilot==='berthold'){
  const g=c.createRadialGradient(0,0,26,0,0,46);g.addColorStop(0,'#439bff00');g.addColorStop(.8,'#439bff22');g.addColorStop(1,'#95dcff88');
  c.fillStyle=g;c.beginPath();c.arc(0,0,46,0,Math.PI*2);c.fill();c.strokeStyle='#8fd3ff';c.lineWidth=2;c.stroke();
 }
 c.restore();
}

// Same visual language as tail lock; derived from the real passive state.
export function passiveGaugeProgress(p){
 if(p.pilot==='wolff')return Math.min(1,Math.max(0,(p.wolffSafeTime||0)/18));
 if(p.pilot==='nungesser')return Math.min(1,Math.max(0,(1-p.hp/p.maxHp)/.8));
 return 0;
}
export function drawPassiveGauge(c,p,x,y){
 if(p.pilot!=='nungesser'||p.hp<=0||p.status&&p.status!=='alive')return;
 const progress=passiveGaugeProgress(p),r=48,color=p.pilot==='wolff'?'#dce8b9':'#baa8d4';
 c.save();c.translate(x,y);c.fillStyle=color;c.globalAlpha=.045;
 c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
 c.strokeStyle=color;c.lineWidth=1;c.globalAlpha=.2;c.stroke();
 c.lineWidth=2.5;c.globalAlpha=.65;c.beginPath();c.arc(0,0,r,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
 c.lineWidth=1;c.globalAlpha=.35;
 for(let i=0;i<(p.pilot==='wolff'?6:4);i++){
  const a=-Math.PI/2+i*Math.PI*2/(p.pilot==='wolff'?6:4);
  c.beginPath();c.moveTo(Math.cos(a)*(r+3),Math.sin(a)*(r+3));c.lineTo(Math.cos(a)*(r+7),Math.sin(a)*(r+7));c.stroke();
 }
 c.restore();
}

export function drawPetalParticle(c,p,x,y){
 if(p.life<=0)return;
 c.save();c.translate(x,y);c.rotate(p.angle+(p.maxLife-p.life)*p.spin);
 c.globalAlpha=.78*Math.min(1,p.life/.25);c.fillStyle='#f5eedb';
 c.beginPath();c.moveTo(-p.size,0);c.quadraticCurveTo(0,-p.size*.8,p.size,0);c.quadraticCurveTo(0,p.size*.55,-p.size,0);c.fill();
 c.strokeStyle='#cabda6';c.lineWidth=.7;c.beginPath();c.moveTo(-p.size*.65,0);c.lineTo(p.size*.55,0);c.stroke();c.restore();
}

// Equipment overlays follow aircraft orientation without changing its sprite.
function drawEquipmentEffects151(c,p,x,y){
 if(p.hp<=0)return;const t=p.t||0;c.save();c.translate(x,y);c.rotate(p.a);
 if(p.prancingHorseFlash160>0){
  const q=Math.min(1,p.prancingHorseFlash160/.34),r=36+(1-q)*28;
  c.save();c.lineCap='round';
  for(let i=0;i<3;i++){c.globalAlpha=q*(.65-i*.16);c.strokeStyle=i===0?'#e7e5cf':'#71847c';c.lineWidth=i===0?2:5;c.beginPath();c.ellipse(5-i*5,0,r-i*7,30-i*4,0,-1.18,1.18);c.stroke();}
  for(const side of [-1,1]){c.globalAlpha=q*.55;c.strokeStyle='#cbd3c2';c.lineWidth=1.5;c.beginPath();c.moveTo(26,side*18);c.bezierCurveTo(8,side*38,-28,side*34,-52-(1-q)*24,side*20);c.stroke();}c.restore();
 }
 if(p.upgrades?.mercedesEngine){const output=Math.max(0,Math.min(1,p.mercedesOutput160||0));c.save();c.globalAlpha=.18+output*.28;c.strokeStyle='#c6d0c6';c.lineWidth=1+output*.7;for(const side of [-1,1]){c.beginPath();c.moveTo(-25,side*8);c.quadraticCurveTo(-40-output*13,side*(10+Math.sin(t*18)*2),-52-output*24,side*12);c.stroke()}c.restore()}
 if(p.jArmorCapsule){
  const hit=p.hitFlash>0,pulse=.5+.5*Math.sin(t*2.6);c.save();c.globalAlpha=hit?.82:.22+pulse*.05;c.strokeStyle=hit?'#f5f2da':'#b8ceca';c.lineWidth=hit?3:1.5;c.beginPath();c.ellipse(0,0,49,35,0,0,Math.PI*2);c.stroke();
  c.globalAlpha=hit?.58:.16;c.fillStyle='#9eb8b2';c.beginPath();c.ellipse(0,0,46,32,0,0,Math.PI*2);c.fill();c.globalAlpha=hit?.78:.32;c.lineWidth=1;for(const x of [-25,0,25]){c.beginPath();c.moveTo(x,-30+Math.abs(x)*.18);c.quadraticCurveTo(x+6,0,x,30-Math.abs(x)*.18);c.stroke()}c.restore();
 }
 if(p.scarffRing){const a=(p.scarffAim??p.a)-p.a;c.rotate(a);c.strokeStyle='#d7e7c288';c.lineWidth=2;c.beginPath();c.arc(0,0,33,-.2,.2);c.stroke();if(p.muzzleFlash>0){c.strokeStyle='#fff0b9';c.beginPath();c.moveTo(25,0);c.lineTo(42,0);c.stroke()}c.rotate(-a)}
 if(p.repairFlash151>0){c.globalAlpha=Math.min(1,p.repairFlash151/.2);c.strokeStyle='#d8e8dc';c.lineWidth=2;const progress=1-p.repairFlash151/.75;for(let i=0;i<5;i++){const a=i*Math.PI*2/5,r=28+progress*28,px=Math.cos(a)*r,py=Math.sin(a)*r;c.save();c.translate(px,py);c.rotate(a+progress*3);c.beginPath();c.moveTo(-4,-5);c.lineTo(-2,0);c.lineTo(2,0);c.lineTo(4,-5);c.moveTo(0,0);c.lineTo(0,8);c.stroke();c.restore()}}
 c.restore();
}

// Small, function-linked instrument marks; no gameplay mutation in render paths.
function drawPrecisionEquipment156(c,p,x,y){
 if(p.hp<=0)return;
 const t=p.t||p.world?.t||0,held=p.upgrades||{},acquire=p.equipmentAcquire156;
 c.save();c.translate(x,y);
 if(p.telescopeFocus156>0&&p.telescopeTarget156){
  const e=p.telescopeTarget156,dx=e.x-p.x,dy=e.y-p.y,r=14;
  const pulse=.5+.5*Math.sin(t*16);c.save();c.strokeStyle='#cfe4d9';c.globalAlpha=.28;c.lineWidth=1.4;c.beginPath();c.moveTo(12,0);c.quadraticCurveTo(dx*.48,dy*.28,dx,dy);c.stroke();c.translate(dx,dy);c.globalAlpha=.78+pulse*.18;c.lineWidth=1.8;
  for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(r+3,4);c.quadraticCurveTo(r+3,11,r-5,11);c.stroke()}
  c.globalAlpha=.38+pulse*.25;c.beginPath();c.arc(0,0,r+7,-.45,.45);c.stroke();c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.stroke();c.restore();
 }
 c.save();c.rotate(p.a);
 if(held.redScarf){c.strokeStyle='#98545188';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(-23,side*11);c.quadraticCurveTo(-42,side*14+Math.sin(t*9)*3,-64,side*12);c.stroke()}}
 if(held.immelmannManual&&p.evadeTime>0){c.strokeStyle='#c8d6d09c';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.arc(-8,0,28+i*6,1.9,4.1);c.stroke()}}
 if(held.flightGloves&&p.muzzleFlash>0){c.strokeStyle='#cfbc9277';for(const side of [-1,1]){c.beginPath();c.moveTo(20,side*8);c.lineTo(31,side*8);c.stroke()}}
 if(held.maximBelt&&p.reloadTime>0){c.strokeStyle='#cfbc9288';for(let i=0;i<5;i++){const yy=-12+i*5;c.beginPath();c.moveTo(-23,yy);c.lineTo(-19,yy);c.stroke()}}
 if(held.quadLewis&&p.muzzleFlash>0){c.strokeStyle='#e3dacba0';for(let i=0;i<4;i++){c.beginPath();c.moveTo(26,-8+i*5);c.lineTo(35,-8+i*5);c.stroke()}}
 if(held.mauserAceKiller&&p.mauserFlash160>0){const a=(p.mauserAim156??p.a)-p.a;c.save();c.rotate(a);c.strokeStyle='#c0a6ff';c.globalAlpha=Math.min(1,p.mauserFlash160/.08);c.lineWidth=2;c.beginPath();c.moveTo(17,0);c.lineTo(34,0);c.stroke();c.restore()}
 c.restore();
 if(held.ironCross&&p.skillTime>0){c.globalAlpha=Math.min(.65,p.skillTime*2);drawGameIcon(c,'ironCross-'+(p.faction==='entente'||['fonck','baracca','mccudden','nungesser','guynemer','bishop','mannock','mckeever','collishaw'].includes(p.pilot)?'entente':'central'),0,-43,22);c.globalAlpha=1}
 if(held.fogCompass){const phase=t%4;if(phase<.5){c.strokeStyle='#acc4bb66';c.lineWidth=1;for(let i=0;i<4;i++){const a=i*Math.PI/2,r=38-phase*12;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+6),Math.sin(a)*(r+6));c.stroke()}}}
 if(held.goeringBaton){c.strokeStyle='#b4c0b43a';c.lineWidth=1;for(const side of [-1,1]){c.beginPath();c.moveTo(side*40,9);c.lineTo(side*45,4);c.lineTo(side*50,9);c.stroke()}}
 if(acquire?.life>0){
  const q=1-acquire.life/acquire.maxLife,alpha=Math.min(1,q*8)*Math.min(1,acquire.life*4),id=acquire.id;
  c.globalAlpha=alpha;c.translate(0,-51);drawGameIcon(c,id==='ironCross'?(p.plane?.includes('fokker')||p.plane==='albatros'?'ironCross-central':'ironCross-entente'):id,0,0,28);
  // Each item gets a small mechanical signature around its original artwork.
  c.save();c.strokeStyle='#cec5a8';c.lineWidth=1;
  if(id==='boelckeDicta'){for(let i=0;i<3;i++){c.beginPath();c.moveTo(-12,-7+i*7);c.lineTo(5+q*12,-7+i*7);c.stroke()}}
  if(id==='sparkPlug'){c.beginPath();c.arc(0,0,21,-Math.PI/2,-Math.PI/2+q*Math.PI*2);c.stroke()}
  if(id==='kaiserFog'){c.globalAlpha=alpha*.2;for(let i=0;i<3;i++){c.beginPath();c.ellipse((i-1)*12,9-q*15,10+q*6,5+q*4,0,0,Math.PI*2);c.stroke()}}
  if(id==='rankinShell'){for(let i=0;i<7;i++){const a=.3+i*.45,r=17+q*12;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));c.stroke()}}
  if(id==='motorCannon'||id==='cow37'){c.beginPath();c.moveTo(0,-19);c.lineTo(0,-23-q*(id==='cow37'?14:8));c.stroke();c.beginPath();c.arc(0,12,17,q,Math.PI-q);c.stroke()}
  if(id==='flightGloves'||id==='maximBelt'||id==='quadLewis'){for(let i=0;i<(id==='quadLewis'?4:6);i++){const xx=-17+i*6;c.beginPath();c.moveTo(xx,19);c.lineTo(xx,22+(i%2?1:3));c.stroke()}}
  if(id==='sacredCowling'){for(const side of [-1,1]){c.beginPath();c.moveTo(side*19,-9);c.lineTo(side*23,-3);c.lineTo(side*17,3);c.stroke()}}
  if(id==='steelPlate'){c.strokeRect(-20+q*3,-17,40-q*6,34)}
  if(id==='mauserAceKiller'){c.beginPath();c.moveTo(16,-12);c.lineTo(24+q*10,-17-q*6);c.stroke()}
  if(id==='loEmblem'){c.beginPath();c.moveTo(-20,16);c.lineTo(20,16);c.stroke()}
  c.restore();
  c.lineWidth=1;c.strokeStyle=['telescope','fogCompass'].includes(id)?'#91b8ba':['prancingHorse','steelPlate','rearGunner'].includes(id)?'#bfc9c3':'#c8b58c';
  if(['telescope','fogCompass','rearGunner'].includes(id)){c.beginPath();c.arc(0,0,20,Math.PI*q,Math.PI*q+Math.PI*1.4);c.stroke()}
  else if(['ironCross','goeringBaton','boelckeDicta'].includes(id)){for(const side of [-1,1]){c.beginPath();c.moveTo(side*18,-9);c.lineTo(side*23,14);c.lineTo(side*16,10);c.stroke()}}
  else if(['prancingHorse','redScarf','immelmannManual','loEmblem'].includes(id)){for(const side of [-1,1]){c.beginPath();c.moveTo(side*19,-8);c.lineTo(side*(23+q*10),12);c.stroke()}}
  else {for(const side of [-1,1]){c.beginPath();c.moveTo(side*19,-12);c.lineTo(side*19,12);c.lineTo(side*12,12);c.stroke()}}
  for(let i=0;i<4;i++){const a=i*Math.PI/2+q*.2,r=22+q*7;c.globalAlpha=alpha*(1-q);c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+2),Math.sin(a)*(r+2));c.stroke()}
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
