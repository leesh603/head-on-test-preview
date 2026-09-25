// Personal pilot state is advanced per living pilot; persistent damage is advanced once per world.
const stepTime = dt => Number.isFinite(dt) ? Math.max(0, Math.min(.04, dt)) : 0;
const playing = p => p.state === 'playing' && p.hp > 0 && p.status !== 'downed';

export function preparePersonalRound1918(p, b) {
  if (p.pilot === 'gontermann' && p.skillTime > 0 && !b.enemy && !b.ally && !b.formation && !b.patrol) {
    b.burn = 3;
    b.specialColor = '#ff9a3c';
  }
  return b;
}

export function barkerDamage1918(p, damage) {
  if (p.pilot !== 'barker' || !(damage > 0)) return damage;
  p.barkerStacks = Math.min(p.skillTime > 0 ? 5 : 3, (p.barkerStacks || 0) + 1);
  p.barkerStackTime = 3;
  return p.skillTime > 0 ? Math.min(damage, Math.max(0, p.hp - 1)) : damage;
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
      p._ballPuff = (p._ballPuff || 0) - step;
      if (p._ballPuff <= 0) {
        p._ballPuff = .09;
        p.smoke(p.x + (p.rng() - .5) * 40, p.y + (p.rng() - .5) * 40, false);
      }
      if (!p.ballCloak) {
        p.ballAmbush = 2;
        p.burst(p.x, p.y, '#f4f0dc', 18);
      }
    } else if (p.ballAmbush > 0) p.ballAmbush = Math.max(0, p.ballAmbush - step);
  }
  if (p.pilot === 'rickenbacker' && p.skillTime > 0 && p.roundsFired > previousRounds) {
    let count = 0;
    for (const e of p.enemies) {
      if (count >= 7) break;
      if (e.hp <= 0 || e.surface || Math.hypot(e.x - p.x, e.y - p.y) > 780) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      p.bullets.push({x:p.x + Math.cos(a)*24, y:p.y + Math.sin(a)*24,
        vx:Math.cos(a)*580, vy:Math.sin(a)*580, life:1.5, enemy:false, ownerId:p.id,
        damage:p.damage*.85, pierce:true, specialColor:'#d7c493', hit:new Set(), formation:true});
      count++;
    }
  }
  if (p.pilot === 'brumowski') {
    const world = p.combatWorld();
    for (const a of world.allies || []) {
      if (!a.orbit || a.life <= 0 || (world.players && a.ownerId !== p.id)) continue;
      const angle = p.t*1.5 + (a.slot || 0)*Math.PI;
      a.x += (p.x + Math.cos(angle)*115 - a.x)*Math.min(1, step*6);
      a.y += (p.y + Math.sin(angle)*115 - a.y)*Math.min(1, step*6);
      a.a = angle + Math.PI/2;
    }
  }
}

// Return newly killed targets so each mode can use its existing one-time death/XP pipeline.
export function advanceBurns1918(world, dt) {
  const step = stepTime(dt), killed = [];
  if (!step || world.state !== 'playing') return killed;
  for (const e of world.enemies) {
    if (e.hp <= 0 || !(e.burnTime > 0)) continue;
    const active = Math.min(step, e.burnTime);
    e.burnTime = Math.max(0, e.burnTime - step);
    e.hp -= Math.max(0, e.burnDps || 0)*active;
    e.burnFxTime = (e.burnFxTime || 0) - step;
    if (e.burnFxTime <= 0) {
      e.burnFxTime = .13;
      world.smoke(e.x, e.y, false);
      world.burst(e.x, e.y, '#ff9a3c', 3);
    }
    if (!e.burnTime) e.burnDps = 0;
    if (e.hp <= 0 && !e.burnCounted && !e.deathHandled) {
      e.burnCounted = true;
      killed.push(e);
    }
  }
  return killed;
}
