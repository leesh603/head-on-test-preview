import {drawGrenade,drawGrenadeBlast,drawAmatolBlast,drawFxExplosion} from './weapon-effects156.js?v=214';
import {fx,fxReady,fxTint} from './fx-art.js';
import {playerPose,drawPlayerAura,drawPetalParticle,drawRedGhosts162} from './player-effects129.js?v=214';
import {drawStageBoss} from './stageboss-view.js?v=194&b=210';
import {planeSprite,aircraftKey} from './aircraft.js?v=216';
import {drawEquipment} from './equipment.js?v=214&b=210';
import {drawEnemyProjectile,drawCannonProjectile,drawBattlefieldFire} from './projectiles.js?v=214&b=210';
import {drawBattlefieldSprite} from './battlefield-art.js?v=214&b=210';
import {drawSpecialAmmoIcon} from './icons.js?v=214';
import {SUN_STRIKE,TAILING_BALANCE,SPECIAL_AMMO,enemyAircraftScale} from './engine.js?v=220';

// Every combat layer uses the same world transform; rendering never edits the session.
const xpGem=typeof Image!=='undefined'?new Image():null;if(xpGem)xpGem.src='./xp-gem.png?v=210';
export function drawCoop(c,g,W,H,{terrain,drawZeppelin,drawFieldArt,fieldArt}){
 const t=g.t,z=g.camera.zoom;c.save();c.scale(z,z);terrain(g.x,g.y,W/z,H/z);c.restore();drawStageBoss(c,g,W,H,{drawZeppelin,drawFieldArt,layer:'bodies'});c.save();c.translate(W/2,H/2);c.scale(z,z);c.translate(-g.x,-g.y);
 drawBattlefieldFire(c,g);for(const e of g.enemyAirshipPasses||[])drawZeppelin(c,e.x,e.y,e.a,.72,false,'central');
 for(const p of g.players)for(const d of p.vossAfterimages||[]){c.save();c.globalAlpha=.4*d.life/d.maxLife;planeSprite(c,d.x,d.y,d.a,aircraftKey(p.plane,false,p.pilot),1);c.restore();}
 for(const e of g.enemies)for(const d of e.vossTrails||[]){c.save();c.globalAlpha=.4*d.life/d.maxLife;planeSprite(c,d.x,d.y,d.a,e.bossPlane,enemyAircraftScale(e),true);c.restore();}
 for(const d of g.revisionDecoys||[]){c.save();c.globalAlpha=Math.min(.45,d.life*.4);planeSprite(c,d.x,d.y,d.a,aircraftKey(d.plane,false,d.pilot),1);c.restore()}
 const ring=(x,y,r,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke()};
 const heart=(x,y,size,color)=>{const s=Math.max(1,Math.round(size/4));c.fillStyle=color;c.fillRect(x-2*s,y-s,s,s);c.fillRect(x+s,y-s,s,s);c.fillRect(x-3*s,y,6*s,s);c.fillRect(x-2*s,y+s,4*s,s);c.fillRect(x-s,y+2*s,2*s,s)};
 const sprite=(p,key,scale=1,enemy=false)=>{const q=playerPose(p,p.x,p.y);if(!enemy){drawRedGhosts162(c,p,p.x,p.y,planeSprite,key);drawPlayerAura(c,p,q.x,q.y);}planeSprite(c,q.x+14,q.y+20,p.a,key,scale*q.scale,enemy,true);planeSprite(c,q.x,q.y,p.a,key,scale*q.scale,enemy,false,p.hitFlash||0)};
 for(const gas of g.gasZones){c.fillStyle=gas.warning>0?'#d6b74722':'#72842e55';c.beginPath();c.arc(gas.x,gas.y,gas.r,0,Math.PI*2);c.fill();ring(gas.x,gas.y,gas.r,'#d6c66b');c.fillStyle='#f8ebae';c.font='14px sans-serif';c.textAlign='center';c.fillText(gas.warning>0?'독가스 살포 '+gas.warning.toFixed(1)+'초':'독가스 · 조종 저하 / 지속 피해',gas.x,gas.y-gas.r-12)}
 for(const field of g.hostileMinefields){ring(field.x,field.y,field.radius,field.warning>0?'#ffe0a199':'#e58b6c88');for(const m of field.mines)if(!m.dead){if(!fx(c,'mine',m.x,m.y,30,30))drawEquipment(c,'mine',m.x,m.y,0,28);ring(m.x,m.y,18,'#ff876e')}}
 for(const d of g.drops){if(d.dead)continue;if(d.specialAmmo){ring(d.x,d.y,24+Math.sin(t*6)*3,SPECIAL_AMMO[d.specialAmmo]?.color||'#ffd36f',2);drawSpecialAmmoIcon(c,d.specialAmmo,d.x,d.y+Math.sin(t*4)*2,42)}else if(d.heal||d.supply){ring(d.x,d.y,22+Math.sin(t*5)*3,'#9cffb4');drawEquipment(c,'repair',d.x,d.y+Math.sin(t*3)*2,0,40)}else{if(xpGem?.naturalWidth)c.drawImage(xpGem,d.x-9,d.y-9,18,18);else{c.fillStyle='#63d5ec';c.fillRect(d.x-3,d.y-3,6,6)}}}
 for(const grenade of g.grenades||[])drawGrenade(c,grenade,grenade.x,grenade.y);for(const m of g.mines){if(!fx(c,'mine',m.x,m.y,30,30))drawEquipment(c,'mine',m.x,m.y,0,30);if(m.legendary||m.arm===0)ring(m.x,m.y,22+Math.sin(t*5)*3,m.legendary?'#ffd56f99':'#ffcc6677')}
 for(const e of g.enemies){
  if(e.stageBossBody)continue;
  if(e.crashing){const key=e.escortPlane||e.bossPlane||(e.faction==='entente'?(e.type==='hunter'?'nieuport':'camel'):(e.type==='hunter'?'fokker_standard':'albatros'));sprite(e,key,enemyAircraftScale(e),true);continue}
  if(e.hp<=0)continue;
  if(e.groundEscort)drawBattlefieldSprite(c,'aa',e.x,e.y,96,e.a+Math.PI/2);
  else if(e.fieldUnit){if(e.rail){const r=e.rail;c.save();c.translate(r.x,r.y);c.rotate(r.angle);c.strokeStyle='#bec1ab';c.lineWidth=3;for(const off of [-8,8]){c.beginPath();c.moveTo(-r.half-25,off);c.lineTo(r.half+25,off);c.stroke()}c.restore()}drawBattlefieldSprite(c,e.fieldSprite,e.x,e.y,e.rail?210:354,e.rail?e.rail.angle+Math.PI/2:0)}
  else if(e.navalVessel)drawBattlefieldSprite(c,'ship',e.x,e.y,320,e.a+Math.PI/2);
  else if(e.heavyBomber){const im=fieldArt[e.airframe],w=e.airframe==='staaken'?178:158;if(im?.naturalWidth)drawFieldArt(e.airframe,e.x,e.y,w,w*im.naturalHeight/im.naturalWidth,e.a+Math.PI/2,e.hitFlash>0?.65:1)}
  else if(e.type==='zeppelin')drawZeppelin(c,e.x,e.y,e.a,.92,e.hitFlash>0,e.faction);
  else{const key=e.escortPlane||e.bossPlane||(e.faction==='entente'?(e.type==='hunter'?'nieuport':'camel'):(e.type==='hunter'?'fokker_standard':'albatros'));sprite(e,key,enemyAircraftScale(e),true)}
  if(e.aceInvuln124>0)ring(e.x,e.y,42+Math.sin(t*20)*4,'#35253d',2);
  if(e.bossPilot||e.fieldUnit||e.heavyBomber||e.type==='zeppelin'){const offset=e.fieldUnit?e.rail?125:190:e.type==='zeppelin'?70:e.bossPilot?42:65;c.fillStyle='#172b23';c.fillRect(e.x-42,e.y-offset,84,5);c.fillStyle='#ed9d66';c.fillRect(e.x-42,e.y-offset,84*Math.max(0,e.hp/e.maxHp),5);c.font='14px sans-serif';c.textAlign='center';c.fillStyle='#ffe3aa';c.fillText(e.name||'비행선',e.x,e.y-offset-8)}
 }
 for(const a of g.allies){sprite(a,a.plane,.78);if(g.player(a.ownerId)?.wingBoost>0)ring(a.x,a.y,28,'#f5e7ad',2)}
 for(const patrol of g.patrols){if(patrol.hp<=0)continue;sprite(patrol,patrol.plane,.9);c.fillStyle='#83dce9';c.fillRect(patrol.x-16,patrol.y+34,32*patrol.hp/patrol.maxHp,3)}
 for(const p of g.players){for(const wing of p.formationWings||[]){c.globalAlpha=wing.alpha||0;sprite(wing,'sopwith');c.globalAlpha=1}for(const wing of p.divingSquadron||[])sprite(wing,'se5a');for(const ship of p.airshipFleet||[])if(ship.age>=0&&ship.age<6)drawZeppelin(c,ship.x,ship.y,ship.a,ship.scale||.825,false,'central')}
 for(const b of g.friendlyBombers){const im=fieldArt[b.airframe];if(im?.naturalWidth)drawFieldArt(b.airframe,b.x,b.y,150,150*im.naturalHeight/im.naturalWidth,b.a+Math.PI/2)}
 for(const b of g.friendlyBombs){const f=1-b.life/b.maxLife;if(!fx(c,'bomb',b.sx+(b.x-b.sx)*f,b.sy+(b.y-b.sy)*f,40,20,Math.atan2(b.y-b.sy,b.x-b.sx)))drawEquipment(c,'rocket',b.sx+(b.x-b.sx)*f,b.sy+(b.y-b.sy)*f,Math.atan2(b.y-b.sy,b.x-b.sx)+Math.PI/2,38);ring(b.x,b.y,22,'#a2eddb70')}
 for(const b of g.bullets){if(b.life<=0)continue;if(b.enemy){drawEnemyProjectile(c,b,b.x,b.y,t);if(b.hostileRocket){if(!fx(c,'rocket',b.x,b.y,50,15,Math.atan2(b.vy,b.vx)))drawEquipment(c,'rocket',b.x,b.y,Math.atan2(b.vy,b.vx)+Math.PI/2,46)}}else if(b.rocket){if(!fx(c,'rocket',b.x,b.y,52,16,Math.atan2(b.vy,b.vx)))drawEquipment(c,'rocket',b.x,b.y,Math.atan2(b.vy,b.vx)+Math.PI/2,48)}else if(b.motorCannon||b.cow37){drawCannonProjectile(c,b,b.x,b.y)}else if(b.fonckSeeker){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));if(!fx(c,'tracerCream',-6,0,46,10)){c.fillStyle='#fff0ad';c.fillRect(-22,b.motorCannon?-7:-3,b.motorCannon?45:30,b.motorCannon?14:6);c.fillStyle='#bd8745';c.fillRect(-15,-7,6,b.motorCannon?14:6)}c.restore()}else{const bc=(b.mauserRound?'#a98cff':b.specialColor)||(b.formation||b.ally?'#b9f2de':b.pierce?'#f8f5cd':'#f8df87'),bw=b.specialAmmo?4:b.formation||b.ally?4:2;if(!fxTint(c,'tracerAmber',bc,b.x,b.y,bw*11,bw*4,Math.atan2(b.vy,b.vx))){c.strokeStyle=bc;c.lineWidth=bw;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*(b.specialAmmo==='tracer'?.032:.018),b.y-b.vy*(b.specialAmmo==='tracer'?.032:.018));c.stroke()}}}
 for(const zone of g.bombZones){const progress=1-zone.delay/zone.maxDelay;c.fillStyle='#ff3c202a';c.beginPath();c.arc(zone.x,zone.y,zone.radius,0,Math.PI*2);c.fill();ring(zone.x,zone.y,zone.radius,'#ff855a');ring(zone.x,zone.y,Math.max(0,zone.radius*(1-progress)),'#ff855a')}
 for(const fxf of g.combatFX){const f=1-fxf.life/fxf.maxLife;if(fxf.amatol){drawAmatolBlast(c,fxf,fxf.x,fxf.y);continue}if(fxf.grenade){drawGrenadeBlast(c,fxf,fxf.x,fxf.y);continue}if(!drawFxExplosion(c,fxf,fxf.x,fxf.y))drawFieldArt('flak',fxf.x,fxf.y,fxf.radius*(1+f)*2,fxf.radius*(1+f)*2,0,Math.min(1,fxf.life*3))}
 for(const f of g.flakBursts)drawBattlefieldSprite(c,'aa',f.x,f.y,66);
 for(const gust of g.gusts)drawFieldArt('gust',gust.x,gust.y,gust.radius*2.6,gust.radius*2.6,gust.a+t*.15,Math.max(0,Math.min(.85,gust.life,6-gust.life)));
 for(const particle of g.particles){const smokeLife=particle.smoke?Math.max(0,particle.life/particle.maxLife):0;c.globalAlpha=particle.smoke?smokeLife*(particle.muzzleSmoke?.88:.65):Math.min(1,particle.life*3);if(particle.petal){drawPetalParticle(c,particle,particle.x,particle.y);continue}if(particle.heart){heart(particle.x,particle.y,particle.size,particle.color);continue}c.fillStyle=particle.color;const size=particle.smoke?particle.size+(1-smokeLife)*(particle.muzzleSmoke?15:10):3;
  if(!particle.smoke&&fxReady('spark')){fxTint(c,'spark',particle.color,particle.x,particle.y,size*4,size*4);continue}
  if(particle.smoke){const lum=parseInt(particle.color?.slice(1,3)||'88',16),sKey=particle.muzzleSmoke?'smokePuff':lum<110?'smokeDark':lum>170?'smokeWisp':'smokeGray';if(fx(c,sKey,particle.x,particle.y,size*2.4,size*2.4)){c.globalAlpha=1;continue}}
  c.fillRect(particle.x-size/2,particle.y-size/2,size,size)}c.globalAlpha=1;
 for(const p of g.players){if(p.status!=='alive')continue;
  if(p.isRedHunter()&&p.skillTime>0){c.save();c.translate(p.x,p.y);c.rotate(p.a);if(fxReady('sunshaft')){for(let i=0;i<5;i++){const a=(i/4*2-1)*SUN_STRIKE.halfAngle*.9,L=SUN_STRIKE.range*.8;fx(c,'sunshaft',Math.cos(a)*L*.5-30,Math.sin(a)*L*.5,L,140+((i*53)%80),a,.5);}}else{c.fillStyle='#ffe8b330';c.beginPath();c.moveTo(0,0);c.arc(0,0,SUN_STRIKE.range,-SUN_STRIKE.halfAngle,SUN_STRIKE.halfAngle);c.closePath();c.fill();}c.restore()}
  if(p.skillTime>0&&!['nungesser','berthold','wolff'].includes(p.pilot))ring(p.x,p.y,35+Math.sin(t*10)*4,'#ffe2a4',1);
  if(p.chargeTime>0||p.upgrades.redScarf){c.strokeStyle=p.chargeTime>0?'#ffe3a680':'#d6f6efa8';c.lineWidth=2;for(const off of [-24,24]){const x=p.x-Math.sin(p.a)*off,y=p.y+Math.cos(p.a)*off,len=p.chargeTime>0?150:70;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(p.a)*len,y-Math.sin(p.a)*len);c.stroke()}}
  c.globalAlpha=p.invuln>0&&Math.floor(t*15)%2?.55:1;sprite(p,aircraftKey(p.plane,false,p.pilot));c.globalAlpha=1;const color=p.id==='p1'?'#74d9fb':'#ffcd78';ring(p.x,p.y,39,color,1.5);c.fillStyle=color;c.textAlign='center';c.font='bold 14px sans-serif';c.fillText(p.id.toUpperCase(),p.x,p.y+54);
 if(p.muzzleFlash>0&&p.reloadTime===0)for(let gun=0;gun<p.weapon.guns;gun++){const ga=p.gunDirection(gun),mx=p.x+Math.cos(ga)*27,my=p.y+Math.sin(ga)*27;if(!fx(c,'muzzle',mx+Math.cos(ga)*6,my+Math.sin(ga)*6,16,16,ga)){c.fillStyle='#fff4ca';c.fillRect(mx-2,my-2,5,5)}}
 }
 for(const p of g.players){if(p.status!=='alive'||!p.tailTargetId)continue;const e=g.enemies.find(e=>e.hp>0&&e.tailId===p.tailTargetId);if(!e)continue;const progress=p.tailLockFraction(),color=p.id==='p1'?'#74d9fb':'#ffcd78';c.strokeStyle=p.tailLocked?'#ff7258':color;c.lineWidth=p.tailLocked?3:2;c.beginPath();c.arc(e.x,e.y,38,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();c.fillStyle=p.tailLocked?'#fff0c0':color;c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(p.tailLocked?'꼬리 우위 ×'+TAILING_BALANCE.damageMultiplier.toFixed(2):p.id.toUpperCase()+' 후방 '+Math.round(progress*100)+'%',e.x,e.y-48)}
 c.restore();c.font='14px sans-serif';c.textAlign='left';c.fillStyle='#f1edd0';c.fillText(['전원 지대','아드리아해','참호 전선','도심','고공 전역'][g.region]+' · 팀 비행 '+(g.distance/1000).toFixed(1)+' km',14,H-14);
}
