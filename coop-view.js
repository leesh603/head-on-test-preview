import {getLocale} from './i18n.js?v=531';
import {unitNameEN} from './event-text-en.js?v=531';
import {drawRegionalBug} from './regional-boss-view352.js?v=531';
import {drawGust3,drawGasVeil3} from './atmosphere-role3.js?v=531';
import {drawGasCloud196} from './gas-cloud196.js?v=531';
import {drawGrenade,drawGrenadeBlast,drawAmatolBlast,drawFxExplosion} from './weapon-effects156.js?v=531';
import {fxsBoomTail} from './fx-sample-preview.js?v=531';
import {fx,fxReady,fxTint} from './fx-art.js?v=531';
import {drawAADefense,drawDrachenMine} from './aa-defense-art.js?v=531';
import {drawPilotSignatureFront,drawMccuddenSupply} from './pilot-signature-view.js';
import {drawHeineckeParachute} from './heinecke-rettungsfallschirm.js?v=531';
import {drawAircraftCrash,enemyCrashScale} from './aircraft-crash.js?v=531';
import {playerPose,drawPlayerAura,drawPetalParticle,drawRedGhosts162} from './player-effects129.js?v=531';
import {drawStageBoss} from './stageboss-view.js?v=531';
import {planeSprite,aircraftKey} from './aircraft.js?v=531';
import {drawEquipment} from './equipment.js?v=531';
import {drawEnemyProjectile,drawCannonProjectile,drawBattlefieldFire,friendlyTracerColor} from './projectiles.js?v=531';
import {drawBattlefieldSprite} from './battlefield-art.js?v=531';
import {drawSpecialAmmoIcon} from './icons.js?v=531';
import {SUN_STRIKE,TAILING_BALANCE,SPECIAL_AMMO,enemyAircraftScale} from './engine.js?v=531';
import {drawCombatFeedback,combatCameraOffset,combatVisualPose} from './combat-feedback.js?v=531';

// Every combat layer uses the same world transform; rendering never edits the session.
const xpGem=null;const ballCloudSprite=new Image();ballCloudSprite.src='./fx-ball-cloud.webp?v=426&b=326';
export function drawCoop(c,g,W,H,{terrain,drawZeppelin,drawFieldArt,fieldArt,fieldArtImg,groundLayer}){
 const t=g.t,z=g.camera.zoom;c.save();c.scale(z,z);terrain(g.x,g.y,W/z,H/z);c.restore();drawStageBoss(c,g,W,H,{drawZeppelin,drawFieldArt,layer:'bodies'});c.save();const kick=combatCameraOffset(g);c.translate(W/2+kick.x,H/2+kick.y);c.scale(z,z);c.translate(-g.x,-g.y);
 groundLayer?.();drawBattlefieldFire(c,g);
 const cl=(x,y,m)=>x<g.x-W/(2*z)-m||x>g.x+W/(2*z)+m||y<g.y-H/(2*z)-m||y>g.y+H/(2*z)+m;
 for(const e of g.enemyAirshipPasses||[])if(!cl(e.x,e.y,320))drawZeppelin(c,e.x,e.y,e.a,.72,false,'central');
 for(const p of g.players)for(const d of p.vossAfterimages||[]){c.save();c.globalAlpha=.4*d.life/d.maxLife;planeSprite(c,d.x,d.y,d.a,aircraftKey(p.plane,false,p.pilot),1);c.restore();}
 for(const e of g.enemies)for(const d of e.vossTrails||[]){if(cl(d.x,d.y,110))continue;c.save();c.globalAlpha=.4*d.life/d.maxLife;planeSprite(c,d.x,d.y,d.a,e.bossPlane,enemyAircraftScale(e),true);c.restore();}
 for(const d of g.revisionDecoys||[]){c.save();c.globalAlpha=Math.min(.45,d.life*.4);planeSprite(c,d.x,d.y,d.a,aircraftKey(d.plane,false,d.pilot),1);c.restore()}
 const ring=(x,y,r,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke()};
 const heart=(x,y,size,color)=>{const s=Math.max(1,Math.round(size/4));c.fillStyle=color;c.fillRect(x-2*s,y-s,s,s);c.fillRect(x+s,y-s,s,s);c.fillRect(x-3*s,y,6*s,s);c.fillRect(x-2*s,y+s,4*s,s);c.fillRect(x-s,y+2*s,2*s,s)};
 const sprite=(p,key,scale=1,enemy=false)=>{const q=playerPose(p,p.x,p.y),visual=combatVisualPose(p);q.x+=visual.x;q.y+=visual.y;q.roll=visual.roll;q.bank=visual.bank;if(!enemy){drawRedGhosts162(c,p,p.x,p.y,planeSprite,key);drawPlayerAura(c,p,q.x,q.y);}if(!enemy||p.type!=='bomber'&&p.type!=='zeppelin'){c.save();c.globalAlpha*=q.shadowAlpha;planeSprite(c,q.x+(p.pilot==='immelmann'?q.shadowX:14),q.y+(p.pilot==='immelmann'?q.shadowY:20)+q.height,p.a,key,scale*q.scale*q.shadowScale,enemy,true);c.restore();}c.save();c.translate(q.x,q.y);c.rotate(p.a+q.roll);c.scale(1,q.bank);planeSprite(c,0,0,0,key,scale*q.scale,enemy,false,enemy&&visual.active?Math.min(.1,p.hitFlash||0):p.hitFlash||0,p.hp<p.maxHp*.5);c.restore();if(!enemy)drawPilotSignatureFront(c,p,q.x,q.y)};
 for(const gas of g.gasZones){if(cl(gas.x,gas.y,(gas.r||80)+60))continue;drawGasCloud196(c,gas,gas.x,gas.y,t);c.fillStyle='#e0dfb0';c.font='13px sans-serif';c.textAlign='center';c.fillText(gas.warning>0?'독가스 살포 '+gas.warning.toFixed(1)+'초':'독가스 · 조종 저하 / 지속 피해',gas.x,gas.y-gas.r-12)}
 for(const field of g.hostileMinefields){if(!field.encounterId)ring(field.x,field.y,field.radius,field.warning>0?'#ffe0a199':'#e58b6c88');for(const m of field.mines)if(!m.dead&&!cl(m.x,m.y,80)){drawDrachenMine(c,m.x,m.y,64,64);ring(m.x,m.y,18,field.warning>0?'#ffe0a188':'#ff876e')}}
 for(const d of g.drops){if(d.dead||cl(d.x,d.y,70))continue;if(d.specialAmmo){ring(d.x,d.y,24+Math.sin(t*6)*3,SPECIAL_AMMO[d.specialAmmo]?.color||'#ffd36f',2);drawSpecialAmmoIcon(c,d.specialAmmo,d.x,d.y+Math.sin(t*4)*2,42)}else if(d.mccuddenSupply){drawMccuddenSupply(c,d,d.x,d.y)}else if(d.heal||d.supply){const pulse=22+Math.sin(t*5)*4;c.save();c.globalAlpha=.4;ring(d.x,d.y,pulse,'#5fff9e',7);c.globalAlpha=1;ring(d.x,d.y,pulse,'#9cffb4');c.fillStyle='rgba(210,255,224,.9)';for(let i=0;i<4;i++){const sa=t*2.6+i*Math.PI/2;c.beginPath();c.arc(d.x+Math.cos(sa)*(pulse+6),d.y+Math.sin(sa)*(pulse+6),1.7,0,Math.PI*2);c.fill()}c.restore();drawEquipment(c,'repair',d.x,d.y+Math.sin(t*3)*2,0,46)}else{if(xpGem?.naturalWidth)c.drawImage(xpGem,d.x-9,d.y-9,18,18);else{c.fillStyle='#63d5ec';c.fillRect(d.x-3,d.y-3,6,6)}}}
 for(const grenade of g.grenades||[])if(!cl(grenade.x,grenade.y,80))drawGrenade(c,grenade,grenade.x,grenade.y);for(const m of g.mines){if(cl(m.x,m.y,80))continue;drawDrachenMine(c,m.x,m.y,62,62);if(m.legendary||m.arm===0)ring(m.x,m.y,22+Math.sin(t*5)*3,m.legendary?'#ffd56f99':'#ffcc6677')}
 for(const e of g.enemies){if(cl(e.x,e.y,360)||e.hp<=0)continue;
  if(e.groundEscort)drawBattlefieldSprite(c,'aa',e.x,e.y,96,e.a+Math.PI/2);
  else if(e.fieldUnit){if(e.rail){const r=e.rail;c.save();c.translate(r.x,r.y);c.rotate(r.angle);c.strokeStyle='#bec1ab';c.lineWidth=3;for(const off of [-8,8]){c.beginPath();c.moveTo(-r.half-25,off);c.lineTo(r.half+25,off);c.stroke()}c.restore()}drawBattlefieldSprite(c,e.fieldSprite,e.x,e.y,e.rail?210:354,e.rail?e.rail.angle+Math.PI/2:0);const offset=e.rail?125:190;c.fillStyle='#172b23';c.fillRect(e.x-42,e.y-offset,84,5);c.fillStyle='#ed9d66';c.fillRect(e.x-42,e.y-offset,84*Math.max(0,e.hp/e.maxHp),5);c.font='14px sans-serif';c.textAlign='center';c.fillStyle='#ffe3aa';c.fillText(unitNameEN(e.name||'비행선'),e.x,e.y-offset-8)}
  else if(e.navalVessel)drawBattlefieldSprite(c,'ship',e.x,e.y,320,e.a+Math.PI/2)}
 for(const f of g.flakBursts)if(!cl(f.x,f.y,90))drawBattlefieldSprite(c,'aa',f.x,f.y,66);
 for(const e of g.enemies){
  if(e.stageBossBody||e.cityUnit||cl(e.x,e.y,300))continue;
  if(e.crashing){const key=e.formationLivery||e.escortPlane||e.bossPlane||(e.faction==='entente'?(e.type==='hunter'?'nieuport':'camel'):(e.type==='hunter'?'fokker_standard':'albatros'));drawAircraftCrash(c,e,e.x,e.y,t,fx);sprite(e,key,enemyAircraftScale(e)*enemyCrashScale(e),true);continue}
  if(e.hp<=0)continue;
  if(e.groundEscort||e.fieldUnit||e.navalVessel)continue;
  if(e.bugDrone){drawRegionalBug(c,e);}
  else if(e.heavyBomber){const im=(fieldArtImg?fieldArtImg(e.airframe):fieldArt[e.airframe]),w=e.airframe==='staaken'?178:158;if(im?.naturalWidth)drawFieldArt(e.airframe,e.x,e.y,w,w*im.naturalHeight/im.naturalWidth,e.a+Math.PI/2,e.hitFlash>0?.65:1)}
  else if(e.type==='zeppelin')drawZeppelin(c,e.x,e.y,e.a,.92,e.hitFlash>0,e.faction);
  else{const key=e.formationLivery||e.escortPlane||e.bossPlane||(e.faction==='entente'?(e.type==='hunter'?'nieuport':'camel'):(e.type==='hunter'?'fokker_standard':'albatros'));sprite(e,key,enemyAircraftScale(e),true)}
  if(e.aceInvuln124>0)ring(e.x,e.y,42+Math.sin(t*20)*4,'#35253d',2);
  if(e.vossSurge){const n2=Math.min(7,Math.max(3,e.vossSurgeCount||3));ring(e.x,e.y,50,'rgba(255,222,140,.4)',1.5);for(let i=0;i<n2;i++){const ga=t*2.3+i*Math.PI*2/n2;c.fillStyle=i%2?'#ffe6a2':'#cfe6ff';c.beginPath();c.arc(e.x+Math.cos(ga)*50,e.y+Math.sin(ga)*50,3,0,Math.PI*2);c.fill()}}
  if(e.bossPilot||e.fieldUnit||e.heavyBomber||e.type==='zeppelin'){const offset=e.fieldUnit?e.rail?125:190:e.type==='zeppelin'?70:e.bossPilot?42:65;c.fillStyle='#172b23';c.fillRect(e.x-42,e.y-offset,84,5);c.fillStyle='#ed9d66';c.fillRect(e.x-42,e.y-offset,84*Math.max(0,e.hp/e.maxHp),5);c.font='14px sans-serif';c.textAlign='center';c.fillStyle='#ffe3aa';c.fillText(unitNameEN(e.name||'비행선'),e.x,e.y-offset-8)}
  else if(e.bossMinion&&(e.callSign||e.callSignKo)){c.font='600 11px "Arial Narrow",sans-serif';c.textAlign='center';c.textBaseline='middle';const w=Math.ceil(c.measureText((getLocale()==='en'?(e.callSign||e.callSignKo):(e.callSignKo||e.callSign))).width)+14;c.fillStyle='rgba(18,13,11,.86)';c.fillRect(Math.round(e.x-w/2),Math.round(e.y-56),w,17);c.strokeStyle='#743d35';c.lineWidth=1;c.strokeRect(Math.round(e.x-w/2)+.5,Math.round(e.y-56)+.5,w-1,16);c.fillStyle='#f0d7a4';c.fillText((getLocale()==='en'?(e.callSign||e.callSignKo):(e.callSignKo||e.callSign)),Math.round(e.x),Math.round(e.y-48))}
 }
 drawCombatFeedback(c,g,(x,y)=>[x,y],{fx,planeSprite});
 for(const a of g.allies){const owner=g.player(a.ownerId);sprite(a,owner?.pilot==='goering'?'goering_fokkerd7':a.plane,.78);if(owner?.wingBoost>0&&owner.pilot!=='goering')ring(a.x,a.y,28,'#f5e7ad',2)}
 for(const patrol of g.patrols){if(patrol.hp<=0)continue;sprite(patrol,patrol.plane,.9);c.fillStyle='#83dce9';c.fillRect(patrol.x-16,patrol.y+34,32*patrol.hp/patrol.maxHp,3)}
 for(const p of g.players){for(const wing of p.formationWings||[]){c.globalAlpha=wing.alpha||0;sprite(wing,'collishaw_sopwith');c.globalAlpha=1}for(const wing of p.divingSquadron||[])sprite(wing,'se5a');
   if(p.pilot==='rickenbacker'&&(p.rickActive||p.skillTime)>0){const ph=t*3.1,ea=.32;c.save();c.globalAlpha=.8;c.strokeStyle='rgba(255,226,140,.85)';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,58,30,ea,0,Math.PI*2);c.stroke();c.globalAlpha=.22;c.lineWidth=1;c.beginPath();c.ellipse(p.x,p.y,58,30,ea,0,Math.PI*2);c.stroke();c.restore()}
   if(p.fxOverheat>0&&p.pilot!=='udet'){c.save();c.globalAlpha=.55*p.fxOverheat;const nx=p.x+Math.cos(p.a)*14,ny=p.y+Math.sin(p.a)*14;c.fillStyle='#ff8a3c';c.beginPath();c.arc(nx,ny,7+Math.sin(t*30)*2.4,0,Math.PI*2);c.fill();c.fillStyle='#ffd27a';c.beginPath();c.arc(nx,ny,3.4,0,Math.PI*2);c.fill();c.restore()}
   if(p.ballCloak>0&&ballCloudSprite.naturalWidth){const fade=Math.min(1,p.ballCloak*3);c.save();for(let i=0;i<7;i++){const ga=t*.5+i*.9,rr=10+((i*53)%26),sc=.16+(i*29)%10*.014;c.globalAlpha=.5*fade*(i%2?.85:1);c.save();c.translate(p.x+Math.cos(ga)*rr,p.y+Math.sin(ga)*rr*.75);c.rotate(ga*.4);c.drawImage(ballCloudSprite,-160*sc,-100*sc,320*sc,200*sc);c.restore()}c.restore()}
   if(p.pilot==='baracca'&&(g.enemies||[]).some(e=>{if(e.hp<=0)return false;const d=(e.x-p.x)**2+(e.y-p.y)**2;return d<520*520&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-p.a),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.a)))<Math.PI/3})){c.save();const pulse=.6+.3*Math.sin(t*10);c.globalAlpha=.8;c.strokeStyle=`rgba(224,58,42,${pulse})`;c.lineWidth=2.6;c.beginPath();c.arc(p.x,p.y,44,p.a-Math.PI/3,p.a+Math.PI/3);c.stroke();c.lineWidth=1.2;c.strokeStyle=`rgba(255,214,150,${pulse})`;c.beginPath();c.arc(p.x,p.y,52,p.a-Math.PI/4,p.a+Math.PI/4);c.stroke();c.restore()}
   if(p.pilot==='voss'){const n=(g.enemies||[]).filter(e=>e.hp>0&&(e.x-p.x)**2+(e.y-p.y)**2<400*400).length;if(n>=2){c.save();const m=Math.min(6,n);c.globalAlpha=.75;for(let i=0;i<m;i++){const ga=t*2.6+i*Math.PI*2/m+.4;c.fillStyle=i%2?'#ff9a7a':'#e0523a';c.beginPath();c.arc(p.x+Math.cos(ga)*44,p.y+Math.sin(ga)*44,2.8,0,Math.PI*2);c.fill()}c.restore()}}
   if(p.pilot==='gontermann'){const heavy=(g.enemies||[]).filter(e=>e.hp>0&&(e.heavyBomber||e.zeppelin||e.boss||e.ace||e.big||e.stageBossBody||e.navalVessel||e.fieldUnit||e.type==='boss')&&(e.x-p.x)**2+(e.y-p.y)**2<700*700);if(heavy.length){c.save();heavy.slice(0,4).forEach((e,i)=>{const r=(e.r||18)+13+Math.sin(t*6+i)*3;if(p.pilot==='luke'){c.globalAlpha=.85;c.strokeStyle='#ffb43c';c.lineWidth=2;c.save();c.translate(e.x,e.y);c.rotate(t*1.5);c.beginPath();c.moveTo(0,-r);c.lineTo(r,0);c.lineTo(0,r);c.lineTo(-r,0);c.closePath();c.stroke();c.restore()}else{c.globalAlpha=.8;for(let j=0;j<3;j++){const ga=t*2+j*2.1;c.fillStyle=j%2?'#ff8a3c':'#ffce6a';c.beginPath();c.arc(e.x+Math.cos(ga)*r*.7,e.y+Math.sin(ga)*r*.7,2.4,0,Math.PI*2);c.fill()}}});c.restore()}}
   for(const ship of p.airshipFleet||[])if(ship.age>=0&&ship.age<6)drawZeppelin(c,ship.x,ship.y,ship.a,ship.scale||.825,false,'central')}
 for(const b of g.friendlyBombers){if(cl(b.x,b.y,200))continue;const im=(fieldArtImg?fieldArtImg(b.airframe):fieldArt[b.airframe]);if(im?.naturalWidth)drawFieldArt(b.airframe,b.x,b.y,150,150*im.naturalHeight/im.naturalWidth,b.a+Math.PI/2)}
 for(const b of g.friendlyBombs){if(cl(b.x,b.y,80))continue;const f=1-b.life/b.maxLife;if(!fx(c,'bomb',b.sx+(b.x-b.sx)*f,b.sy+(b.y-b.sy)*f,40,20,Math.atan2(b.y-b.sy,b.x-b.sx))&&!b.bishopBomb)drawEquipment(c,'rocket',b.sx+(b.x-b.sx)*f,b.sy+(b.y-b.sy)*f,Math.atan2(b.y-b.sy,b.x-b.sx)+Math.PI/2,38);if(!b.bishopBomb)ring(b.x,b.y,22,'#a2eddb70')}
 for(const b of g.bullets){if(b.life<=0||cl(b.x,b.y,80))continue;if(b.enemy){continue}else if(b.rocket){if(!fx(c,'rocket',b.x,b.y,52,16,Math.atan2(b.vy,b.vx)))drawEquipment(c,'rocket',b.x,b.y,Math.atan2(b.vy,b.vx)+Math.PI/2,48)}else if(b.motorCannon||b.cow37){drawCannonProjectile(c,b,b.x,b.y)}else if(b.mannockPass){fx(c,b.mannockPass==='vertical'?'tracerCream':'tracerAmber',b.x,b.y,48,8,Math.atan2(b.vy,b.vx))}else if(b.fonckVolley){fx(c,'tracerCream',b.x,b.y,46,10,Math.atan2(b.vy,b.vx))}else if(b.fonckSeeker){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));if(!fx(c,'tracerCream',-6,0,46,10)){c.fillStyle='#fff0ad';c.fillRect(-22,b.motorCannon?-7:-3,b.motorCannon?45:30,b.motorCannon?14:6);c.fillStyle='#bd8745';c.fillRect(-15,-7,6,b.motorCannon?14:6)}c.restore()}else{const bc=(b.mauserRound?'#a98cff':b.eagle?'#9fdcff':b.specialColor)||(b.formation||b.ally?'#b9f2de':b.pierce?'#f8f5cd':friendlyTracerColor(b,g.gunUpgradeBonus)),bw=b.specialAmmo?4:b.formation||b.ally?4:2;if(!fxTint(c,'tracerAmber',bc,b.x,b.y,bw*11,bw*4,Math.atan2(b.vy,b.vx))){c.strokeStyle=bc;c.lineWidth=bw;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*(b.specialAmmo==='tracer'?.032:.018),b.y-b.vy*(b.specialAmmo==='tracer'?.032:.018));c.stroke()}}}
 for(const zone of g.bombZones){if(cl(zone.x,zone.y,zone.radius+20))continue;const progress=1-zone.delay/zone.maxDelay;c.fillStyle='#ff3c202a';c.beginPath();c.arc(zone.x,zone.y,zone.radius,0,Math.PI*2);c.fill();ring(zone.x,zone.y,zone.radius,'#ff855a');ring(zone.x,zone.y,Math.max(0,zone.radius*(1-progress)),'#ff855a')}
 for(const fxf of g.combatFX){if(cl(fxf.x,fxf.y,(fxf.radius||60)*2.6+80))continue;const f=1-fxf.life/fxf.maxLife;if(fxf.amatol){drawAmatolBlast(c,fxf,fxf.x,fxf.y);continue}if(fxf.grenade){drawGrenadeBlast(c,fxf,fxf.x,fxf.y);continue}if(!drawFxExplosion(c,fxf,fxf.x,fxf.y))drawFieldArt('flak',fxf.x,fxf.y,fxf.radius*(1+f)*2,fxf.radius*(1+f)*2,0,Math.min(1,fxf.life*3))}
 for(const gust of g.gusts)if(!cl(gust.x,gust.y,(gust.radius||60)*1.4+60)&&!drawGust3(c,gust,gust.x,gust.y,t))drawFieldArt('gust',gust.x,gust.y,gust.radius*2.6,gust.radius*2.6,gust.a+t*.15,Math.max(0,Math.min(.85,gust.life,6-gust.life)));
 for(const p of g.grunkreuzPuffs||[])if(!cl(p.x,p.y,140))drawGasVeil3(c,p,p.x,p.y,t);
 for(const particle of g.particles){if(cl(particle.x,particle.y,70))continue;const smokeLife=particle.smoke?Math.max(0,particle.life/particle.maxLife):0;c.globalAlpha=particle.smoke?smokeLife*(particle.muzzleSmoke?.88:.65):Math.min(1,particle.life*3);if(particle.petal){drawPetalParticle(c,particle,particle.x,particle.y);continue}if(particle.heart){heart(particle.x,particle.y,particle.size,particle.color);continue}c.fillStyle=particle.color;const size=particle.smoke?particle.size+(1-smokeLife)*(particle.muzzleSmoke?15:10):3;
  if(!particle.smoke&&fxReady('spark')){fxTint(c,'spark',particle.color,particle.x,particle.y,size*4,size*4);continue}
  if(particle.smoke){const lum=parseInt(particle.color?.slice(1,3)||'88',16),sKey=particle.muzzleSmoke?'smokePuff':lum<110?'smokeDark':lum>170?'smokeWisp':'smokeGray';if(fx(c,sKey,particle.x,particle.y,size*2.4,size*2.4)){c.globalAlpha=1;continue}}
  c.fillRect(particle.x-size/2,particle.y-size/2,size,size)}c.globalAlpha=1;
 for(const p of g.players){if(p.heineckeEscape>0){drawHeineckeParachute(c,p,p.heineckeAnchor.x,p.heineckeAnchor.y);continue}if(p.status!=='alive')continue;
  if(p.isRedHunter()&&p.skillTime>0){c.save();c.translate(p.x,p.y);c.rotate(p.a);if(fxReady('sunshaft')){for(let i=0;i<3;i++){const a=(i-1)*SUN_STRIKE.halfAngle*.72,L=SUN_STRIKE.range*.72;fxTint(c,'sunshaft','#f7e3b6',Math.cos(a)*L*.5-30,Math.sin(a)*L*.5,L,110+(i%2)*40,a,.18);}}else{c.fillStyle='#ffe8b330';c.beginPath();c.moveTo(0,0);c.arc(0,0,SUN_STRIKE.range,-SUN_STRIKE.halfAngle,SUN_STRIKE.halfAngle);c.closePath();c.fill();}c.restore()}
  if(p.skillTime>0&&!['nungesser','berthold','wolff'].includes(p.pilot))ring(p.x,p.y,35+Math.sin(t*10)*4,'#ffe2a4',1);
  if(p.pilot==='berthold'&&(p.hp<=p.maxHp*.5||p.skillTime>0)){const act=p.skillTime>0,n=act?4:3,R=act?46:40,rot=t*(act?1.6:.9);c.lineCap='butt';for(let i=0;i<n;i++){const a0=rot+i*Math.PI*2/n,a1=a0+Math.PI*.38;c.globalAlpha=act?.85:.6;c.lineWidth=act?7:5;c.strokeStyle='#8fa8bd';c.beginPath();c.arc(p.x,p.y,R,a0,a1);c.stroke();c.lineWidth=act?3:2.2;c.strokeStyle='#dfeaf4';c.beginPath();c.arc(p.x,p.y,R,a0+.03,a1-.03);c.stroke()}c.globalAlpha=1}
  if(p.chargeTime>0||p.upgrades.redScarf){c.strokeStyle=p.chargeTime>0?'#ffe3a680':'#d6f6efa8';c.lineWidth=2;for(const off of [-24,24]){const x=p.x-Math.sin(p.a)*off,y=p.y+Math.cos(p.a)*off,len=p.chargeTime>0?150:70;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(p.a)*len,y-Math.sin(p.a)*len);c.stroke()}
   if(p.chargeTime>0){const ox=Math.cos(p.a),oy=Math.sin(p.a),nx=-oy,ny=ox,fade=Math.min(1,p.chargeTime*4);c.lineCap='round';
    c.globalAlpha=.8*fade;c.fillStyle='rgba(255,214,140,.13)';
    c.beginPath();c.moveTo(p.x+ox*158,p.y+oy*158);c.lineTo(p.x-nx*44-ox*14,p.y-ny*44-oy*14);c.lineTo(p.x+nx*44-ox*14,p.y+ny*44-oy*14);c.closePath();c.fill();
    c.strokeStyle='#ffe3a6';c.lineWidth=3;c.beginPath();c.moveTo(p.x-nx*44-ox*14,p.y-ny*44-oy*14);c.lineTo(p.x+ox*158,p.y+oy*158);c.lineTo(p.x+nx*44-ox*14,p.y+ny*44-oy*14);c.stroke();
    for(let k=1;k<=3;k++){const bx=p.x-ox*(18+k*32),by=p.y-oy*(18+k*32),sp=42+k*17;
     c.globalAlpha=.62*fade*(1-k*.19);c.lineWidth=2.2;
     c.beginPath();c.moveTo(bx-nx*sp,by-ny*sp);c.lineTo(bx+ox*26,by+oy*26);c.lineTo(bx+nx*sp,by+ny*sp);c.stroke()}
    c.globalAlpha=1}}
  c.globalAlpha=p.invuln>0&&Math.floor(t*15)%2?.55:1;sprite(p,aircraftKey(p.plane,false,p.pilot));c.globalAlpha=1;const color=p.id==='p1'?'#74d9fb':'#ffcd78';ring(p.x,p.y,39,color,1.5);c.fillStyle=color;c.textAlign='center';c.font='bold 14px sans-serif';c.fillText(p.id.toUpperCase(),p.x,p.y+54);
 if(p.muzzleFlash>0&&p.reloadTime===0)for(let gun=0;gun<p.weapon.guns;gun++){const ga=p.gunDirection(gun),mx=p.pilot==='huffzky'&&gun===1?p.x-Math.cos(p.a)*23:p.x+Math.cos(ga)*27,my=p.pilot==='huffzky'&&gun===1?p.y-Math.sin(p.a)*23:p.y+Math.sin(ga)*27;if(!fx(c,Math.cos(ga-p.a)<0?'muzzleRear':(p.cow37||p.motorCannon)?'muzzleHeavy':'muzzle',mx+Math.cos(ga)*6,my+Math.sin(ga)*6,16,16,ga)){c.fillStyle='#fff4ca';c.fillRect(mx-2,my-2,5,5)}}
 if(p.mauserFlash160>0){const ma=p.mauserAim156??p.a;fx(c,'muzzlePistol',p.x+Math.cos(ma)*22,p.y+Math.sin(ma)*22,26,26,ma,Math.min(1,p.mauserFlash160*8))}
 }
 for(const p of g.players){if(p.status!=='alive'||!p.tailTargetId)continue;const e=g.enemies.find(e=>e.hp>0&&e.tailId===p.tailTargetId);if(!e)continue;const progress=p.tailLockFraction(),color=p.id==='p1'?'#74d9fb':'#ffcd78';c.strokeStyle=p.tailLocked?'#ff7258':color;c.lineWidth=p.tailLocked?3:2;c.beginPath();c.arc(e.x,e.y,38,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();c.fillStyle=p.tailLocked?'#fff0c0':color;c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(p.tailLocked?'꼬리 우위 ×'+TAILING_BALANCE.damageMultiplier.toFixed(2):p.id.toUpperCase()+' 후방 '+Math.round(progress*100)+'%',e.x,e.y-48)}
 for(const b of g.bullets)if(b.enemy&&b.life>0&&!cl(b.x,b.y,90))drawEnemyProjectile(c,b,b.x,b.y,t,z);
 c.restore();c.font='14px sans-serif';c.textAlign='left';c.fillStyle='#f1edd0';c.fillText((['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항','캉브레 들판','아라스 상공','솜 강전선','런던 대공습','베르됭'][g.worldRegion?.()??g.region]||'전원 지대')+' · 팀 비행 '+(g.distance/1000).toFixed(1)+' km',14,H-14);
}


