import {drawEquipmentDecals} from './equipment-finishing-fx.js?v=equipmentfinishing20261030';
import {equipmentArmorFeedback} from './equipment-hit-feedback.js';
import {drawScarffMount,drawCompassPickupWisps} from './equipment-mount-fx.js?v=equipmentmount20261030';
import {drawRedScarf} from './equipment-detail-fx.js?v=equipmentdetail20261030';
import {drawMercedesOutput,drawTelescopeAcquisition,drawMaximReload} from './equipment-extension-fx.js?v=equipmentextension20261030';
import {drawBrockConcealment,drawRankinBurst,drawRepairStitch,drawGloveCadence} from './equipment-signature-fx.js?v=equipmentart20261030';
import {combatVisualPose} from './combat-feedback.js?v=descent20261022&motion=20261022';
import {drawMomentumTrail} from './ace-momentum.js';
import {drawMaterialPetal,drawRepairRecovery} from './petal-supply-fx.js?v=repairparcel20261023';
import {nungesserCombatStatus} from './nungesser-combat.js';
import {drawBuildTransferEntry,drawTransferStations} from './build-transfer-view.js?v=buildfit1&afc=1&art=pilot-recovery2';
import {createSignatureView} from './pilot-signature-view.js?v=deathdefiance1&sig=1019&boss=20261020b&phase=1021&cityart=20261022&perf=1029';
import {fx,fxTint} from './fx-art.js?v=tame3';
import {planeSprite,aircraftKey} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1';
import {drawHorseSilhouette} from './equipment-material-fx.js?v=eqfx2';

import {bishopFlightHeight} from './engine.js?v=merge20261017&airbattle=20261025&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021&cityart=20261022&harbor=20261021&td4=20261026&kfb=1027&momentum=20261027';
import {udetRollPose} from './udet-acrobat-fx.js';
import {bomberEntryPose} from './bomber-transfer.js?v=buildfit1&afc=1&td4=20261026';
import {bombSprite} from './bomb-sprites.js?v=bomb20&perf=1029';
import {fxsBombFall} from './fx-sample-preview.js?v=pilotfx20261018&perf=1029';
const drawPilotSignatureLayer=createSignatureView(drawPetalParticle);
// Shared solo/co-op aircraft presentation; combat positions remain authoritative.
export function playerPose(p,x,y){
 const entry=p.bomberTransfer?bomberEntryPose(p):null;

 const t=Math.max(0,Math.min(1,(p.cannonRecoil129||0)/.24));
 const kick=(p.cannonKick129||0)*Math.sin(t*Math.PI/2);
 const altitude=p.pilot==='immelmann'?(p.immelmannAltitude||0):0;
 const bishopHeight=p.pilot==='bishop'?bishopFlightHeight(p):0,bishopAltitude=bishopHeight/((p.viewHeight||900)*.9);
 const height=altitude*52+bishopHeight;
 if(entry)return {x,y:y-entry.height-height,scale:(entry.departing?1:p.bomberTransfer.scale)*entry.scale,height:entry.height+height,alpha:entry.alpha,sprite:entry.departing?aircraftKey(p.plane,false,p.pilot):p.bomberTransfer.sprite,shadowX:18,shadowY:28,shadowScale:entry.scale,shadowAlpha:entry.alpha*(1-entry.height/((p.viewHeight||900)*.9))};
 const roll=p.pilot==='huffzky'&&p.skillTime>0?Math.sin(p.nineRoll||0)*4:p.pilot==='udet'?udetRollPose(p).offset:0;
 return {x:x-Math.cos(p.a)*kick-Math.sin(p.a)*roll,y:y-Math.sin(p.a)*kick+Math.cos(p.a)*roll-height,scale:(p.bomberTransfer?.scale??1)*(p.aceScale129||1)*(1+altitude*.1)*(1-bishopAltitude*.25),height,shadowX:18+altitude*10,shadowY:28+altitude*12,shadowScale:1-altitude*.3,shadowAlpha:1-altitude*.35};
}
export function drawBomberRearGunner(c,p,x,y){
 drawTransferStations(c,p,x,y);
 const fit=p.bomberTransfer;if(!fit||!(fit.rearFlash>0))return;
 const a=fit.rearAim;fx(c,'muzzleRear',x-Math.cos(p.a)*fit.rear+Math.cos(a)*6,y-Math.sin(p.a)*fit.rear+Math.sin(a)*6,22,16,a,Math.min(1,fit.rearFlash*12));
}
// Active turns use the same heading and bank projection as ordinary flight.
export function applyPlayerAttitude(c,p,pose={},shadow=false){
 const acrobat=p.pilot==='udet'?udetRollPose(p):{bank:1,roll:0};c.rotate(p.a+(shadow?0:(pose.roll||0)+acrobat.roll));if(!shadow)c.scale(1,(pose.bank??1)*acrobat.bank);else if(p.pilot!=='loewenhardt')c.scale(1,pose.bank??1);
}
export function drawPlayerAura(c,p,x,y){
 const momentumPose=playerPose(p,p.x,p.y),momentumVisual=combatVisualPose(p),momentumRoll=p.pilot==='udet'?udetRollPose(p):{roll:0,bank:1};
 drawMomentumTrail(c,p,x,y,{scale:momentumPose.scale,roll:(momentumVisual.roll||0)+momentumRoll.roll,bank:(momentumVisual.bank??1)*momentumRoll.bank});
 const entry=bomberEntryPose(p);
 if(entry){if(!drawBuildTransferEntry(c,p,x,y+entry.height)){drawBomberEntry(c,p,x,y+entry.height);return;}}
 drawEquipmentEffects151(c,p,x,y);
 drawRepairRecovery(c,p,x,y);
 drawPrecisionEquipment156(c,p,x,y);
 if(p.ballCloak>0&&!p.sortieFlightFx)fx(c,'mist',x,y,72,38,p.a,Math.min(.35,p.ballCloak*.3));
 // The reversal is carried by the aircraft pose and a short signature trail.
 if(p.fxOverheat>0&&p.pilot!=='udet')fx(c,'muzzle',x+Math.cos(p.a)*24,y+Math.sin(p.a)*24,28,20,p.a,Math.min(.7,p.fxOverheat));
 for(const g of ['nungesser','barker','jacobs','hawker','boelcke','collishaw','guynemer','bishop','baracca','rickenbacker','goering','brumowski','huffzky','berthold','luke','mannock','wolff','mccudden','immelmann'].includes(p.pilot)||p.pilot==='loewenhardt'&&p.loewAscentFx?[]:p.pilotIdentity?.feedback?.ghosts||[]){c.save();c.globalAlpha*=.3*Math.pow(Math.max(0,g.life/g.maxLife),.8);planeSprite(c,x+g.x-p.x,y+g.y-p.y,g.a,p.bomberTransfer?.sprite||aircraftKey(g.plane,false,g.pilot),g.scale*(p.bomberTransfer?.scale??1),false,false);c.restore()}
 for(const f of p.pilotIdentity?.fx||[]){if(p.pilot==='proctor'&&['muzzleTwin','gunSmoke'].includes(f.key))continue;if(p.pilot==='mckeever'&&['muzzle','muzzleTwin','muzzleRear','muzzleHeavy','gunSmoke'].includes(f.key))continue;if(p.pilot==='gontermann'&&f.key==='fireEngine')continue;if(['nungesser','barker'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleRear','muzzleHeavy','gunSmoke','spark','smokeDark','smokeTrail','engineSmoke','fireEngine','fireWing'].includes(f.key))continue;if(['jacobs','hawker'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleRear','muzzleHeavy','gunSmoke','spark','smokeDark'].includes(f.key))continue;if(['huffzky','berthold'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleRear','muzzleHeavy','gunSmoke','spark','armorSpark','metalShard','debris'].includes(f.key))continue;if(['luke','mannock'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleRear','muzzleHeavy','gunSmoke','spark','fireEngine','fireFlash'].includes(f.key))continue;if(['wolff','mccudden'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleHeavy','gunSmoke','spark'].includes(f.key))continue;if(['baracca','rickenbacker','goering','brumowski'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleHeavy','gunSmoke','spark'].includes(f.key))continue;if(['guynemer','bishop'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','muzzleHeavy','gunSmoke'].includes(f.key))continue;if(['boelcke','collishaw'].includes(p.pilot)&&['windStreak','mist','muzzle','muzzleTwin','gunSmoke'].includes(f.key))continue;if(f.fonckLegacy&&p.fonckPrecisionFx)continue;if(f.loewLegacy&&p.loewAscentFx)continue;if(f.udetLegacy&&p.udetAcrobat)continue;if(f.sortiePilotLegacy&&p.sortieFlightFx)continue;if(f.metalPilotLegacy&&p.metalFlightFx)continue;if(p.pilot==='immelmann'&&f.key==='windStreak')continue;const q=Math.min(1,f.life/.12),alpha=q*(f.alpha??.72),height=f.height??(f.key==='windStreak'?f.size*.35:f.size);if(f.color)fxTint(c,f.key,f.color,x+f.x-p.x,y+f.y-p.y,f.size,height,f.a,alpha);else fx(c,f.key,x+f.x-p.x,y+f.y-p.y,f.size,height,f.a,alpha)}
 if(p.pilotSignatureState)drawPilotSignatureLayer(c,p,x,y);
}

// Five authored bomb sprites and atlas impacts, with no extra damage or particles.
// The acquisition clock advances only in playing frames, including local co-op.
function drawBomberEntry(c,p,x,y){
 const fit=p.bomberTransfer,time=fit.entryTime;
 for(let i=0;i<5;i++){
  const age=time-.6-i*.12;if(age<0||age>1.2)continue;
  const tx=x+(i-2)*62,ty=y+70+(i%2)*48;
  if(age<.7){
   const kind=fit.sprite==='bomber-transfer-gotha'?'puw':i%2?'hales':'cooper';
   fxsBombFall(c,(X,Y,k,a,pitch)=>bombSprite(c,kind,X,Y,54*k,a,1,pitch),tx-24,ty-(p.viewHeight||900)*.72,tx,ty,age/.7,Math.PI/2);
  }else{
   const q=(age-.7)/.5,frame=Math.min(3,Math.floor(q*4));
   fx(c,'bombfx'+frame,tx,ty,100+q*55,100+q*55,0,(1-q)*.8);
   fx(c,'smokeDark',tx,ty-q*22,60+q*70,45+q*55,0,(1-q)*.35);
  }
 }
}

// Same visual language as tail lock; derived from the real passive state.
export function passiveGaugeProgress(p){
 if(p.pilot==='wolff')return Math.min(1,Math.max(0,(p.wolffSafeTime||0)/18));
 if(p.pilot==='nungesser')return nungesserCombatStatus(p).readyFraction;
 return 0;
}

export function drawPetalParticle(c,p,x,y,owner){
 return drawMaterialPetal(c,p,x,y,owner);
}

// Equipment uses its real activation state. These small, bounded drawings never
// create particles, change damage, or simulate an ability in the render loop.
function drawEquipmentEffects151(c,p,x,y){
 if(p.hp<=0)return;drawMercedesOutput(c,p,x,y);c.save();c.translate(x,y);c.rotate(p.a);
 c.restore();
}

function drawPrecisionEquipment156(c,p,x,y){
 if(p.hp<=0)return;
 const held=p.upgrades||{};
 c.save();c.translate(x,y);
 c.save();c.rotate(p.a);
 if(held.badinGauge&&typeof p.badinDamageBonus==='function'){
  const q=Math.min(1,p.badinDamageBonus()/.6);
  // Sustained engine output is visible at the gun only while it fires.
  // No floating dial or blue dash trails. This never creates extra projectiles.
  if(q>0&&p.muzzleFlash>0&&p.reloadTime===0){
   const f=Math.min(1,p.muzzleFlash/.07)*q;
   for(let side=-1;side<=1;side+=2)fx(c,'muzzle',30,side*7,24+q*9,9,0,f*.6);
  }
 }
 if(held.immelmannManual&&p.evadeTime>0){
  const f=Math.min(1,p.evadeTime/.18);
  // Two compact wingtip condensations are tied to the real evasive maneuver.
  for(let s=-1;s<=1;s+=2)fx(c,'vaporTrail',-18,s*27,31,7,Math.PI+s*.15,f*.45);
 }
 if(held.maximBelt&&p.muzzleFlash>0&&p.reloadTime===0){
  // Expelled brass marks rapid firing; its scale stays below a live bullet.
  const q=1-Math.min(1,p.muzzleFlash/.1);
  for(let i=0;i<2;i++){const d=10+q*14+i*5;fx(c,'bulletBrass',7-i*4,18+d,7,3,1.2+i*.8+q,Math.max(0,.7-q*.6))}
 }
 if(held.quadLewis&&p.muzzleFlash>0&&p.reloadTime===0){
  const a=(p.gunDirection?.(0)??p.a)-p.a;c.save();c.rotate(a);
  for(let i=0;i<4;i++)fx(c,'muzzle',29,(i-1.5)*8,19,11,0,Math.min(.8,p.muzzleFlash*8));c.restore();
 }
 // Mauser already has its own muzzle, aimed projectile and hit FX in the
 // actual weapon renderer. Do not overlay a second purple pseudo-projectile.
 c.restore();
 // Mobilization is represented by its actual three additional wingmen, not
 // unrelated chevrons attached to the player's aircraft.
 // The inventory already confirms acquisition. Do not duplicate item cards
 // above the aircraft, including the horse's former round badge.

 c.restore();
}

export function drawEquipmentDefense(c,p,x,y,options={}){
 if(!(p.hp>0)||p.status==='downed'||p.heineckeEscape>0)return;
 drawCompassPickupWisps(c,p,x,y,options);
 c.save();c.translate(x,y);c.rotate(p.a);
 // Above the airframe: the isolated horse cannot disappear beneath a wing.
 if(p.prancingHorseFlash160>0){
  const f=Math.min(1,p.prancingHorseFlash160/.14),a=(p.equipmentImpactAngle??p.a)-p.a;
  fx(c,'ricochet',Math.cos(a)*29,Math.sin(a)*22,38,22,a,f*.75);
  c.save();c.translate(43,0);c.rotate(-p.a);drawHorseSilhouette(c,0,-5,34,f*.92);c.restore();
 }
 if(p.upgrades?.ironCross&&p.skillTime>0){
  // A restrained gilt glint on both wings during the actual active skill.
  // The medal itself stays in the HUD, where it is legible.
  const pulse=Math.pow(Math.max(0,Math.sin((p.t||0)*5)),8);
  if(pulse>.02)for(let side=-1;side<=1;side+=2)fx(c,'spark',2,side*24,14,6,p.a,pulse*.5);
 }

 const armor=equipmentArmorFeedback(p,(p.combatWorld?.()||p).t||0);
 if(armor){
  const q=1-armor.remaining/.24,a=armor.angle-p.a;
  const ix=Math.cos(a)*29,iy=Math.sin(a)*24;
  fx(c,'ricochet',ix,iy,24,14,a,(1-q)*.95);
  // A couple of metal fragments travel away from the impact; no force field.
  for(let i=0;i<2;i++){const b=a+(i?-.45:.45),d=4+q*12;fx(c,'metalShard'+i,ix+Math.cos(b)*d,iy+Math.sin(b)*d,7,4,b+q*3,(1-q)*.65)}
 }

 c.restore();
 // Whole-airframe concealment is above the sprite; hostile foreground remains later.
 const pose=playerPose(p,x,y),fit=p.bomberTransfer;
 const scale=Math.max(.6,Math.min(2.8,(pose.scale||1)*(fit?Math.max(1,(fit.hullLength||60)/60):1)));
 const clothVisual=combatVisualPose(p);
 c.save();c.translate(pose.x+(clothVisual.x||0),pose.y+(clothVisual.y||0));c.scale(pose.scale||1,pose.scale||1);applyPlayerAttitude(c,p,{...pose,roll:clothVisual.roll,bank:clothVisual.bank});
 drawEquipmentDecals(c,p);drawRedScarf(c,p,0,0,{...options,local:true});drawScarffMount(c,p,0,0,{local:true});c.restore();
 drawBrockConcealment(c,p,pose.x,pose.y,{...options,scale});
 drawRankinBurst(c,p,x,y,options);
 drawRepairStitch(c,p,pose.x,pose.y,options);
 drawGloveCadence(c,p,pose.x,pose.y,options);
 drawTelescopeAcquisition(c,p,x,y,options);
 // Physical feed follows the same receiver scale and bank as the aircraft.
 const feedVisual=combatVisualPose(p);
 c.save();c.translate(pose.x+(feedVisual.x||0),pose.y+(feedVisual.y||0));c.scale(pose.scale||1,pose.scale||1);applyPlayerAttitude(c,p,{...pose,roll:feedVisual.roll,bank:feedVisual.bank});
 drawMaximReload(c,p,0,0,{...options,local:true});c.restore();
}

// Aircraft silhouettes use the live sprite and world positions, behind the player.
const redGhostCanvas162=typeof document==='undefined'?null:document.createElement('canvas');
if(redGhostCanvas162){redGhostCanvas162.width=240;redGhostCanvas162.height=240;}
export function drawRedGhosts162(c,p,x,y,sprite,key){
 if(!redGhostCanvas162||!p.redGhosts162?.length)return;
 const ink=redGhostCanvas162.getContext('2d');c.save();
 for(const g of p.redGhosts162){
  ink.clearRect(0,0,240,240);ink.save();sprite(ink,120,120,g.a,key,p.bomberTransfer?.scale??1,false,false);
  ink.globalCompositeOperation='source-in';ink.fillStyle='#b51f32';ink.fillRect(0,0,240,240);ink.restore();
  c.globalAlpha=.38*Math.pow(Math.max(0,g.life/.32),1.25);c.drawImage(redGhostCanvas162,x+g.x-p.x-120,y+g.y-p.y-120);
 }c.restore();
}





