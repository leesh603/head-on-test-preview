import {reserveCombatFxSlot} from './explosion-profiles.js?v=09c75d146ae4289d';
// Confirmed direct hits only. Collision volumes and basic weapon damage stay intact.
// Coordinates below describe regions INSIDE the existing collision volume, not a
// second hitbox. Aircraft can supply criticalLayout for exceptional arrangements.
export const AIRCRAFT_CRITICAL_BALANCE=Object.freeze({
 attempt:.12,aceAttempt:.28,playerAttempt:.75,wingRecovery:.55,wingCooldown:1.2,
 aceOpeningProtection:12,pilotKill:.08,acePilotKill:.0015,mauserPilotKill:.08,mauserAcePilotKill:.02,flechettePilotKill:.24,flechetteAcePilotKill:.04,
 wing:Object.freeze({chance:.52,multiplier:1.25}),
 body:Object.freeze({chance:.28,multiplier:1.5}),
 engine:Object.freeze({chance:.55,multiplier:2.3}),
 fuel:Object.freeze({chance:.48,multiplier:1.9,ignite:.65}),
 cockpit:Object.freeze({chance:.38,multiplier:2.8})
});
// The offensive feedback revision does not increase incoming player damage.
const PLAYER_CRITICAL_PROFILES=Object.freeze({wing:{chance:.3,multiplier:1.12},body:{chance:.12,multiplier:1.3},engine:{chance:.24,multiplier:1.65},fuel:{chance:.18,multiplier:1.5},cockpit:{chance:.2,multiplier:2}});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Critical attempts must not advance the Director/spawn random stream. Only
// the authoritative world uses this independent, reproducible sequence.
function criticalRandom(world){
 if(typeof world.criticalRng==='function')return world.criticalRng();
 world.criticalRandomState=(Math.imul(world.criticalRandomState??0x43524954,1664525)+1013904223)>>>0;
 return world.criticalRandomState/4294967296;
}
const tractor=Object.freeze({engine:.7,fuel:.22,cockpit:-.18});
const pusher=Object.freeze({engine:-.65,fuel:-.12,cockpit:.42});
const pushers=new Set(['airco_dh2','hawker_dh2','mccudden_dh2','fe2b','fe2d','voisin','voisin8','voisin_8','voisin_iii','gunbus','vickers_fb5']);
// Existing bankAircraft / heavy airframe IDs; nacelles are separate from the
// forward crew station. These are normalized gameplay regions, not pixel masks.
const twins=new Set(['hp_o400','handley-page','gotha','aeg_g4','friedrichshafen_g3','caudron_g4','caudron_r11','felixstowe_f2','bomber-transfer-o400','bomber-transfer-gotha']);
const quads=new Set(['staaken','staaken_r6','ilya_muromets']);
const heavyLayout=Object.freeze({engine:null,fuel:0,cockpit:.64});
const ace=e=>!!(e.bossPilot||e.ace||e.rivalAce||e.type==='boss');
function eligible(e,b,player){
 if(b?.synthesisSupport)return false;
 if(!e||!b||!(e.hp>0)||e.crashing||e.crashed||e.expired||e.stageBossBody||e.intrusionBody||e.surface||e.stationary||e.fieldUnit||e.navalVessel||e.bugDrone||e.groundEscort||e.missionGround||e.londonInstallation||e.cityUnit||e.bossAirship||e.type==='zeppelin')return false;
 if(e.invuln>0||e.aceInvuln124>0)return false;
 if(b.flechette&&(player||b.enemy))return false;
 if(!player&&!['scout','hunter','bomber','boss','fighter'].includes(e.type)&&!ace(e))return false;
 return !b.bomberSalvo&&!b.actualExplosion&&!b.explosionRadius&&!b.blast&&!b.fireZone&&!b.identityDotTarget&&!b.fieryGrapnel&&!b.patrol&&!b.gas&&!b.flak&&!b.rocket&&!b.hostileRocket&&!b.fieldShell&&!b.heavyShell&&!b.burnTick&&Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&Math.hypot(b.vx,b.vy)>1;
}
export function aircraftCriticalRegion(e,x,y,{player=false,hitRadius}={}){
 // Defaults mirror engine.enemyAircraftHitRadius exactly; injection avoids an
 // engine -> stageboss-host -> critical -> engine import cycle.
 const radius=hitRadius??(player?10:(e.hitRadius??(e.heavyBomber?55:e.type==='boss'?19:e.type==='bomber'?23:17)));
 const ca=Math.cos(e.a||0),sa=Math.sin(e.a||0),dx=x-e.x,dy=y-e.y;
 const forward=(dx*ca+dy*sa)/(e.hullLength||e.bomberTransfer?.hullLength||radius),side=(-dx*sa+dy*ca)/(e.hullWidth||e.bomberTransfer?.hullWidth||radius);
 const model=String(e.bomberTransfer?.sprite||e.bankAircraft||e.airframe||e.escortPlane||e.bossPlane||e.plane||'').replace(/^(mech\/|bank\/)/,'');
 const multi=twins.has(model)||quads.has(model)||model==='caproni_ca3';
 const layout=e.criticalLayout||(multi?heavyLayout:pushers.has(model)?pusher:tractor);
 // Reject padded/outlying contacts rather than inventing precision damage.
 if(!Number.isFinite(forward)||!Number.isFinite(side)||Math.hypot(forward,side)>1+1e-6)return null;
 let part='body';
 const nacelle=multi&&Math.abs(forward-.12)<.24&&(Math.abs(Math.abs(side)-.58)<.2||quads.has(model)&&Math.abs(Math.abs(side)-.28)<.13||model==='caproni_ca3'&&Math.abs(side)<.18&&forward<0);
 if(nacelle)part='engine';
 else if(Math.abs(side)>.42)part='wing';
 else if(layout.engine!=null&&Math.abs(forward-layout.engine)<.27)part='engine';
 else if(Math.abs(forward-layout.cockpit)<.17&&Math.abs(side)<.24)part='cockpit';
 else if(Math.abs(forward-layout.fuel)<.2&&Math.abs(side)<.32)part='fuel';
 return{part,forward,side};
}
export function resolveAircraftCritical(world,e,b,damage,{player=false,impactX=b?.x,impactY=b?.y,hitRadius}={}){
 const unchanged={damage,critical:null},time=world?.t||0;
 if(world?.online&&!world.host||!Number.isFinite(damage)||!(damage>0))return unchanged;
 // Keep protection checks independent of render state and consume no RNG there.
 if(e?.supportInvulnUntil>time||!eligible(e,b,player))return unchanged;
 if(time<(e.criticalAttemptAt??-Infinity))return unchanged;
 const geometry={player,hitRadius};let sampleX=impactX,sampleY=impactY;
 if(!player&&Number.isFinite(b.previousX)&&Number.isFinite(b.previousY)){
  // Collision already confirmed this round. Sample its chord through the hull,
  // not the frame-dependent first endpoint at the outer collision surface.
  // This changes neither the hitbox nor which targets the round can hit.
  const radius=hitRadius??e.hitRadius??(e.heavyBomber?55:e.type==='boss'?19:e.type==='bomber'?23:17);
  const length=e.hullLength||e.bomberTransfer?.hullLength||radius,width=e.hullWidth||e.bomberTransfer?.hullWidth||radius;
  const ca=Math.cos(e.a||0),sa=Math.sin(e.a||0),dx=b.x-e.x,dy=b.y-e.y;
  const x=(dx*ca+dy*sa)/length,y=(-dx*sa+dy*ca)/width;
  const vx=(b.vx*ca+b.vy*sa)/length,vy=(-b.vx*sa+b.vy*ca)/width;
  const a=vx*vx+vy*vy,p=x*vx+y*vy,d=p*p-a*(x*x+y*y-1);
  if(!(a>0)||d<0)return unchanged;
  const root=Math.sqrt(d),entry=(-p-root)/a,exit=(-p+root)/a;
  const at=entry+(exit-entry)*criticalRandom(world);
  sampleX=b.x+b.vx*at;sampleY=b.y+b.vy*at;
 }
 if(player){
  // Sample only the segment which already collided. This preserves the tiny
  // player hitbox while allowing a transverse shot to cross internal regions.
  if(aircraftCriticalRegion(e,b.x,b.y,geometry)){sampleX=b.x;sampleY=b.y;}
  else if(Number.isFinite(b.previousX)&&Number.isFinite(b.previousY)){
   const dx=b.x-b.previousX,dy=b.y-b.previousY,length=dx*dx+dy*dy;
   if(length>0){const u=clamp(((e.x-b.previousX)*dx+(e.y-b.previousY)*dy)/length,0,1),x=b.previousX+u*dx,y=b.previousY+u*dy;if(aircraftCriticalRegion(e,x,y,geometry)){sampleX=x;sampleY=y;}}
  }
 }
 const region=aircraftCriticalRegion(e,sampleX,sampleY,geometry);if(!region||time<(e.criticalAttemptAt??-Infinity))return unchanged;
 // Steel darts specialize in cockpit penetration; other regions keep base damage.
 if(b.flechette&&region.part!=='cockpit')return unchanged;
 if(b.synthesisDart){if(time<(e.synthesisDartAttemptAt??-Infinity)||b.synthesisGroup?.attempts.has(e))return unchanged;e.synthesisDartAttemptAt=time+.6;b.synthesisGroup?.attempts.add(e);}
 const isAce=!player&&ace(e),balance=AIRCRAFT_CRITICAL_BALANCE,profile=(player?PLAYER_CRITICAL_PROFILES:balance)[region.part];
 e.criticalAttemptAt=time+(player?balance.playerAttempt:isAce?balance.aceAttempt:balance.attempt);
 const random=()=>criticalRandom(world);
 const roll=random();
 // The kill roll is unconditional per cockpit attempt (not chance squared).
 const mauser=!player&&!b.enemy&&b.mauserRound===true,flechette=!player&&!b.enemy&&b.flechette===true;
 const killChance=player?0:b.synthesisDart?(isAce?.004:.025):flechette?(isAce?balance.flechetteAcePilotKill:balance.flechettePilotKill):mauser?(isAce?balance.mauserAcePilotKill:balance.mauserPilotKill):isAce?balance.acePilotKill:balance.pilotKill;
 const opening=isAce&&time-(e.aceSpawnT??0)<balance.aceOpeningProtection;
 const pilotKill=region.part==='cockpit'&&!opening&&roll<killChance;
 if(!pilotKill&&roll>=profile.chance*(player?.7:1))return unchanged;
 if(region.part==='wing'&&time<(e.criticalWingReadyAt??-Infinity))return unchanged;
 let dealt=pilotKill?Math.max(damage,e.hp):damage*profile.multiplier;
 // A critical never converts an otherwise surviving player hit into a death.
 if(player&&damage<e.hp)dealt=Math.min(dealt,Math.max(damage,e.hp-1));
 const ignite=region.part==='fuel'&&!player&&random()<profile.ignite;
 return{damage:dealt,critical:{part:region.part,pilotKill,ignite,player,x:impactX,y:impactY,anchorX:sampleX,anchorY:sampleY,a:Math.atan2(b.vy,b.vx),side:Math.sign(region.side)||1,multiplier:dealt/damage,baseDamage:damage}};
}
// Feedback survives particle eviction. A small serializable journal also reaches
// online guests; expiry is simulation-time based so pausing does not consume it.
export function pruneCriticalFeedback(world){
 const list=world.criticalFeedback;if(!list)return [];
 const time=world.t||0;let w=0;
 for(const f of list)if(f.noticeExpires>time)list[w++]=f;
 list.length=w;return list;
}
const feedbackPriority=f=>f.player?4:f.pilotKill?3:f.lethal?2:1;
const criticalFx=f=>f.fxProfile==='aircraftCritical';
export function applyAircraftCritical(world,e,b,result){
 const c=result?.critical;if(!c||world?.online&&!world.host)return false;
 if(result.applied)return false;result.applied=true;
 const time=world.t||0,anchorX=Number.isFinite(c.anchorX)?c.anchorX:c.x,anchorY=Number.isFinite(c.anchorY)?c.anchorY:c.y;
 if(c.part==='wing'&&e.hp>0){
  e.criticalWingReadyAt=time+AIRCRAFT_CRITICAL_BALANCE.wingCooldown;
  e.criticalSway={age:0,duration:c.player?.4:AIRCRAFT_CRITICAL_BALANCE.wingRecovery,a:c.a,amplitude:c.player?2.5:17,player:c.player};
 }
 if(c.part==='engine')e.criticalEngineUntil=time+(c.player?.65:.95);
 if(c.ignite&&e.hp>0){
  const dps=Math.min(Math.max(1,c.baseDamage*.2),(e.maxHp||e.hp)*.025);
  if(!(e.burnTime>0))e.fuelFxAge=0;
  e.burnTime=Math.max(e.burnTime||0,2);
  if(dps>=(e.burnDps||0)){e.burnDps=dps;e.burnOwnerId=b.ownerId??world.id;e.burnSupport=!!(b.ally||b.formation||b.ghost);}
  // Local origin for the renderer; do not repurpose boss burnAnchorSpace.
  const ca=Math.cos(e.a||0),sa=Math.sin(e.a||0),dx=anchorX-e.x,dy=anchorY-e.y;
  e.criticalFuelOrigin={forward:dx*ca+dy*sa,side:-dx*sa+dy*ca};
 }
 const lethal=!c.player&&e.hp<=0;
 if(lethal){
  e.lethalCritical=c.pilotKill?'pilot':c.ignite?'fire':c.part;
  if(c.part==='wing')e.lethalCriticalSide=c.side;
 }
 const life=c.pilotKill?.65:c.player?.42:c.part==='fuel'?.9:.72;
 const feedbackId='critical:'+(world.criticalFxSerial=(world.criticalFxSerial||0)+1);
 const cue={fxProfile:'aircraftCritical',feedbackId,part:c.part,pilotKill:!!c.pilotKill,player:!!c.player,ignite:!!c.ignite,lethal,x:anchorX,y:anchorY,ownerId:b.ownerId??world.id,audioExpires:time+life,noticeExpires:time+(lethal?5:2.5)};
 const journal=pruneCriticalFeedback(world);world.criticalFeedback=journal;
 if(journal.length>=32){
  let index=-1,lowest=Infinity;
  for(let i=0;i<journal.length;i++){const priority=feedbackPriority(journal[i]);if(priority<=feedbackPriority(cue)&&priority<lowest){index=i;lowest=priority;}}
  if(index>=0)journal.splice(index,1);
 }
 if(journal.length<32)journal.push(cue);
 const ca=Math.cos(e.a||0),sa=Math.sin(e.a||0),dx=anchorX-e.x,dy=anchorY-e.y;
 const f={...c,lethal,x:anchorX,y:anchorY,airframeA:e.a||0,anchorForward:dx*ca+dy*sa,anchorSide:-dx*sa+dy*ca,fxProfile:'aircraftCritical',life,maxLife:life,ownerId:b.ownerId??world.id,feedbackId,audioExpires:cue.audioExpires,noticeExpires:cue.noticeExpires};
 if(!reserveCombatFxSlot(world,f,criticalFx,world.viewWidth<=720?8:14))return true;
 e.criticalTargetKey??=(world.criticalTargetSerial=(world.criticalTargetSerial||0)+1);
 f.targetKey=e.criticalTargetKey;world.combatFX.push(f);
 return true;
}
export function tickAircraftCritical(e,dt){
 if(e?.criticalFuelOrigin&&!(e.burnTime>0))delete e.criticalFuelOrigin;
 const s=e?.criticalSway;if(!s)return;
 if(!(e.hp>0)||e.crashing||e.crashed){delete e.criticalSway;return;}
 const next=Math.min(s.duration,s.age+clamp(Number.isFinite(dt)?dt:0,0,.04));
 // Integrate a finite physical impulse. No heading overwrite, steering lock,
 // teleport restoration, or permanent alteration of airframe speed/handling.
 const integral=t=>{const u=t/s.duration;return 3*s.amplitude*(u-u*u+u*u*u/3);};
 const shift=integral(next)-integral(s.age);
 e.x+=Math.cos(s.a)*shift;e.y+=Math.sin(s.a)*shift;s.age=next;
 if(next>=s.duration-1e-9)delete e.criticalSway;
}

