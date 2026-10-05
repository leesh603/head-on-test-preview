import {signatureCue} from './pilot-signature-state.js?v=479';
// Personal pilot state is advanced per living pilot; persistent damage is advanced once per world.
const stepTime = dt => Number.isFinite(dt) ? Math.max(0, Math.min(.04, dt)) : 0;
const playing = p => p.state === 'playing' && p.hp > 0 && p.status !== 'downed';

export function preparePersonalRound1918(p, b) {
  if (p.pilot === 'gontermann' && p.skillTime > 0 && !b.enemy && !b.ally && !b.formation && !b.patrol) {
    b.burn = 3;
    b.gontermannIncendiary = true;
    if(b.gun!==undefined && !b.rocket && !b.motorCannon && !b.cow37){
      let target=null,best=780;
      for(const e of p.enemies){
        if(e.hp<=0||!(e.type==='zeppelin'||e.type==='bomber'||e.type==='boss'||e.heavyBomber||e.bossPilot||e.fieldUnit==='balloon'))continue;
        const d=Math.hypot(e.x-p.x,e.y-p.y),a=Math.atan2(e.y-b.y,e.x-b.x);
        if(d<best&&Math.abs(Math.atan2(Math.sin(a-p.a),Math.cos(a-p.a)))<Math.PI/3){target=e;best=d}
      }
      if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*speed;b.vy=Math.sin(a)*speed;}
    }
  }
  return b;
}

export function barkerDamage1918(p, damage) {
  if (p.pilot !== 'barker' || !(damage > 0)) return damage;
  p.barkerStacks = Math.min(p.skillTime > 0 ? 5 : 3, (p.barkerStacks || 0) + 1);
  p.barkerStackTime = 3;
  signatureCue(p,'battleDamage',{life:.85,count:p.barkerStacks});
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
      if (!p.ballCloak) {
        p.ballAmbush = 2;
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
  const response=Math.min(1,dt*4);wing.x+=(x-wing.x)*response;wing.y+=(y-wing.y)*response;
  const aim=target?Math.atan2(target.y-wing.y,target.x-wing.x):p.a-side*(attack?.22:0);
  const delta=Math.atan2(Math.sin(aim-wing.a),Math.cos(aim-wing.a));wing.a+=Math.max(-dt*4,Math.min(dt*4,delta));
  wing.muzzleFlash=Math.max(0,(wing.muzzleFlash||0)-dt);return true;
}

// Return newly killed targets so each mode can use its existing one-time death/XP pipeline.
export function advanceBurns1918(world, dt) {
  const step = stepTime(dt), killed = [];
  if (!step || world.state !== 'playing') return killed;
  for (const e of world.enemies) {
    if (e.hp <= 0 || !(e.burnTime > 0)) continue;
    const active = Math.min(step, e.burnTime);
    e.burnTime = Math.max(0, e.burnTime - step);
    if(e.gontermannBurn)e.gontermannBurn.age+=active;
    e.hp -= Math.max(0, e.burnDps || 0)*active;
    e.burnFxTime = (e.burnFxTime || 0) - step;
    if (e.burnFxTime <= 0 && !e.gontermannBurn) {
      e.burnFxTime = .13;
      world.smoke(e.x, e.y, false);
      world.burst(e.x, e.y, '#ff9a3c', 3);
    }
    if (!e.burnTime) {e.burnDps = 0;delete e.gontermannBurn;}
    if (e.hp <= 0 && !e.burnCounted && !e.deathHandled) {
      e.burnCounted = true;
      killed.push(e);
    }
  }
  return killed;
}
