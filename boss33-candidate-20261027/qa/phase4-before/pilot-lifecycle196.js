import {signatureCue} from './pilot-signature-state.js';
import {advanceWingFlight} from './wingman-flight.js?v=flight20261023';
// Personal pilot state is advanced per living pilot; persistent damage is advanced once per world.
const stepTime = dt => Number.isFinite(dt) ? Math.max(0, Math.min(.04, dt)) : 0;
const playing = p => p.state === 'playing' && p.hp > 0 && p.status !== 'downed';

export function preparePersonalRound1918(p, b) {
  // Finite Gontermann ignition is handled by the owned projectile impact hook.
  return b;
}

export function barkerDamage1918(p, damage) {
  if (p.pilot !== 'barker' || !(damage > 0)) return p.pilotDamageTaken ? p.pilotDamageTaken(damage) : damage;
  p.barkerStacks = Math.min(p.skillTime > 0 ? 5 : 3, (p.barkerStacks || 0) + 1);
  p.barkerStackTime = 3;
  signatureCue(p,'battleDamage',{life:.85,count:p.barkerStacks});
  const taken = p.pilotDamageTaken ? p.pilotDamageTaken(damage) : damage;
  return p.skillTime > 0 ? Math.min(taken, Math.max(0, p.hp - 1)) : taken;
}

export function advancePersonal1918(p, dt, previousRounds = p.roundsFired) {
  const step = stepTime(dt);
  if (!step || !playing(p)) return;
  if (p.pilot === 'barker' && p.barkerStackTime > 0) {
    p.barkerStackTime = Math.max(0, p.barkerStackTime - step);
    if (!p.barkerStackTime) p.barkerStacks = 0;
  }
  if (p.pilot === 'ball') {
    if (p.ballCloak > 0) {
      p.ballCloak = Math.max(0, p.ballCloak - step);
      const ghost = p.ballGhost;
      if (ghost) {
        ghost.x += Math.cos(ghost.a) * ghost.speed * step;
        ghost.y += Math.sin(ghost.a) * ghost.speed * step;
      }

      p.invuln = Math.max(p.invuln, step + .02);
      if (!p.ballCloak) {
        p.ballAmbush = 2;
      }
    } else if (p.ballAmbush > 0) p.ballAmbush = Math.max(0, p.ballAmbush - step);
  }
  if (p.pilot === 'rickenbacker' && p.skillTime <= 0) p.rickRingDone = false;
  if (p.pilot === 'rickenbacker' && p.skillTime > 0 && (p.roundsFired > previousRounds || !p.rickRingDone)) {
    p.rickRingDone = true;
    let count = 0;
    for (const e of p.enemies) {
      if (count >= 7) break;
      if (e.hp <= 0 || (e.surface && !e.stageBossBody) || Math.hypot(e.x - p.x, e.y - p.y) > 780) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      p.bullets.push({x:p.x + Math.cos(a)*24, y:p.y + Math.sin(a)*24,
        vx:Math.cos(a)*580, vy:Math.sin(a)*580, life:1.5, enemy:false, ownerId:p.id,
        damage:p.damage*.85, pierce:true, specialColor:'#d7c493', hit:new Set(), formation:true, rickRingRound:true});
      count++;
    }
    if(count)signatureCue(p,'ringVolley',{life:.32});
  }
}

// Use the existing allied aircraft and projectiles; only these two pilots change targeting.
export function pilotWingTarget(p, wing) {
  if (!['collishaw','brumowski'].includes(p.pilot)) return null;
  const world=p.combatWorld(),peers=[...(world.allies||[]),...(p.formationWings||[])];
  if (wing.target?.hp>0 && world.enemies.includes(wing.target) && Math.hypot(wing.target.x-p.x,wing.target.y-p.y)<650) return wing.target;
  let best=Infinity,target=null;
  for (const e of world.enemies) {
    if(e.hp<=0||e.surface||e.fieldUnit||Math.hypot(e.x-p.x,e.y-p.y)>650)continue;
    const assigned=peers.filter(a=>a!==wing&&a.life!==0&&a.target===e&&(a.ownerId===undefined||a.ownerId===p.id)).length;
    const score=Math.hypot(e.x-wing.x,e.y-wing.y)+assigned*650;
    if(score<best){best=score;target=e}
  }
  wing.target=target;return target;
}
export function pilotSupportPose(p,wing,dt,attack=false){
  if(!(p.pilot==='collishaw'&&(wing.permanent||attack))&&!(p.pilot==='brumowski'&&wing.orbit))return false;
  const target=pilotWingTarget(p,wing),side=(wing.slot||0)<0?-1:(wing.slot||0)%2?-1:1;
  let x,y;
  if(p.pilot==='collishaw'){
    const forward=attack?135: -45,off=side*(attack?140+Math.abs(wing.slot||0)*38:85);
    x=p.x+Math.cos(p.a)*forward-Math.sin(p.a)*off;y=p.y+Math.sin(p.a)*forward+Math.cos(p.a)*off;
  }else{
    const orbit=(p.t||0)*1.5+(wing.slot||0)*Math.PI;
    const aim=target?Math.atan2(target.y-p.y,target.x-p.x):orbit;
    x=p.x+Math.cos(aim)*95-Math.sin(aim)*side*65;y=p.y+Math.sin(aim)*95+Math.cos(aim)*side*65;
  }
  advanceWingFlight(wing,p,{x,y,a:p.a-side*(attack?.22:0)},dt);
  wing.muzzleFlash=Math.max(0,(wing.muzzleFlash||0)-dt);return true;
}
// Return newly killed targets so each mode can use its existing one-time death/XP pipeline.
export function advanceBurns1918(world, dt) {
  const step = stepTime(dt), killed = [];
  if (!step || world.state !== 'playing') return killed;
  for (const e of world.enemies) {
    if (e.hp <= 0 || !(e.burnTime > 0)) continue;
    const active = Math.min(step, e.burnTime);
    e.fuelFxAge=(e.fuelFxAge||0)+active;
    e.burnTime = Math.max(0, e.burnTime - step);
    if(e.gontermannBurn)e.gontermannBurn.age+=active;
    let burnDamage = Math.max(0, e.burnDps || 0)*active;
    if(e.burnAnchorSpace){const owner=(world.players||[world]).find(p=>p.id===(e.burnOwnerId||'p1'))||world;
      if(e.supportInvulnUntil>world.t||owner.canHitTarget&&!owner.canHitTarget(e,{burn:true}))burnDamage=0;
      if(e.burnPartId&&e.stageBossBody?.parts.get(e.burnPartId)?.destroyed)burnDamage=0;
      if(!e.stageBossBody&&e.bossPilot==='berthold'){if(e.hp<=e.maxHp*.5)burnDamage*=.75;if(e.ironWillUntil>world.t)burnDamage*=.35;}
    }
    // Burn goes through the boss addon so show-before-fall floors apply to it too.
    if (e.stageBossBody) {const hit={bodyId:e.stageBossBody.id,partId:e.burnAnchorSpace?e.burnPartId:undefined,damage:burnDamage,faction:world.teamFaction};const result=world.stageBoss?.hit ? world.stageBoss.hit(hit) : e.stageBossBody.hit(hit);if(e.burnAnchorSpace&&result?.damage>0)world.stageBossLastOwner=e.burnOwnerId;}
    else e.hp -= burnDamage;
    e.burnFxTime = (e.burnFxTime || 0) - step;
    if (e.burnFxTime <= 0 && !e.gontermannBurn) {
      e.burnFxTime = .13;
      world.smoke(e.x, e.y, false, true);
      world.burst(e.x, e.y, '#ff9a3c', 3, 'profileOnly');
    }
    if (!e.burnTime) {e.burnDps = 0;delete e.gontermannBurn;delete e.burnAnchorSpace;delete e.burnPartId;}
    if (e.hp <= 0 && !e.burnCounted && !e.deathHandled && !e.stageBossBody) {
      e.burnCounted = true;
      killed.push(e);
    }
  }
  return killed;
}
