import {EliteEnemySystem, ELITE_ENEMY_TYPE} from './elite-core.js';

const INSTALL_KEY = Symbol.for('headon.eliteEnemyPatch.v1');

function median(values, fallback) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return fallback;
  return sorted[Math.floor(sorted.length / 2)];
}

export function createHeadOnHost(game, bindings = {}) {
  const enemies = () => bindings.getEnemies?.(game) || game.enemies || [];
  const bullets = () => bindings.getFriendlyProjectiles?.(game) || game.bullets || [];
  const faction = () => bindings.getPlayerFaction?.(game) || bindings.planes?.[game.plane]?.faction || game.playerFaction;
  const normalStats = (seconds, kind) => {
    if (bindings.getNormalStats) return bindings.getNormalStats(game, seconds, kind);
    const normal = enemies().filter(e => !e.ace && !e.bossPilot && e.type !== 'boss' && e.type !== 'zeppelin' && !e.heavyBomber);
    return {
      hp: median(normal.map(e => e.maxHp || e.hp), bindings.normalHpFallback || 26),
      damage: median((game.bullets || []).filter(b => b.enemy && !b.flak).map(b => b.damage), bindings.normalDamageFallback || 9),
      speed: median(normal.map(e => e.speed), bindings.normalSpeedFallback || 96)
    };
  };
  const aceStats = seconds => {
    if (bindings.getAceStats) return bindings.getAceStats(game, seconds);
    const ace = enemies().find(e => e.bossPilot || e.type === 'boss' || e.ace);
    const normal = normalStats(seconds);
    return {hp: ace?.maxHp || normal.hp * 10, damage: bindings.aceDamageFallback || normal.damage * 3.5};
  };
  return {
    random: bindings.random || game.rng || Math.random,
    getTime: () => bindings.getTime?.(game) ?? game.t ?? 0,
    getPlayer: () => bindings.getPlayer?.(game) || game,
    getPlayerFaction: faction,
    getNormalStats: normalStats,
    getAceStats: aceStats,
    isAceActive: () => bindings.isAceActive?.(game) ?? enemies().some(e => e.bossPilot || e.type === 'boss' || e.ace),
    secondsUntilAce: () => bindings.secondsUntilAce?.(game) ?? (Number.isFinite(game.nextBossAt) ? game.nextBossAt - (game.t || 0) : Infinity),
    getProgressStage: () => bindings.getProgressStage?.(game) ?? Math.floor(Math.max(0, game.distance || 0) / 12000) + 1,
    damagePlayer: (amount, meta) => bindings.damagePlayer?.(game, amount, meta) ?? game.hit?.(amount),
    emitWarning: (text, meta) => bindings.emitWarning?.(game, text, meta) ?? game.event?.('elite', text),
    emitEvent: (type, detail) => bindings.emitEvent?.(game, type, detail) ?? game.event?.(type, ''),
    playSound: cue => bindings.playSound?.(game, cue),
    onEliteKilled: detail => {
      if (bindings.onEliteKilled) return bindings.onEliteKilled(game, detail);
      game.kills = (game.kills || 0) + 1;
      game.eliteKills = (game.eliteKills || 0) + 1;
      // Intentionally do not increment priorityKills: the current HEAD-ON
      // leaderboard counts aces, airships and bombers only.
      game.event?.('kill', '');
      if (Array.isArray(game.drops)) game.drops.push({x: detail.x, y: detail.y, value: Math.round(detail.rewardMultiplier), heal: false});
    },
    getFriendlyProjectiles: bullets
  };
}

// First contact of a swept circular projectile. Explosions are stationary areas.
function eliteContact(projectile, member, radius) {
  const x1=projectile.x,y1=projectile.y;
  if (![x1,y1,member.x,member.y,radius].every(Number.isFinite)) return Infinity;
  const swept=!projectile.actualExplosion;
  const x0=swept&&Number.isFinite(projectile.previousX)?projectile.previousX:x1;
  const y0=swept&&Number.isFinite(projectile.previousY)?projectile.previousY:y1;
  const dx=x1-x0,dy=y1-y0,ox=x0-member.x,oy=y0-member.y;
  const c=ox*ox+oy*oy-radius*radius;
  if(c<=0)return 0;
  const length=dx*dx+dy*dy;
  if(!length)return Infinity;
  const dot=ox*dx+oy*dy,disc=dot*dot-length*c;
  if(disc<0)return Infinity;
  const t=(-dot-Math.sqrt(disc))/length;
  return t>=0&&t<=1?t:Infinity;
}

export function routeFriendlyProjectileHits(game, system, bindings = {}) {
  const list=bindings.getFriendlyProjectiles?.(game)||game.bullets||[];
  for(const projectile of list){
    if(projectile.enemy||projectile.life<=0)continue;
    projectile.eliteHits||=new Set();
    const pad=Math.max(0,(projectile.actualExplosion?projectile.explosionRadius:projectile.collisionRadius)||0);
    const contacts=[];
    for(const member of system.members){
      if(projectile.eliteHits.has(member.id)||member.hp<=0||member.alive===false)continue;
      const body=bindings.getEliteHitRadius?.(member)??(member.eliteKind==='schlachtstaffel'?24:18);
      const t=eliteContact(projectile,member,body+pad);
      if(Number.isFinite(t))contacts.push({member,t});
    }
    contacts.sort((a,b)=>a.t-b.t);
    for(const {member} of contacts){
      projectile.eliteHits.add(member.id);
      const damage=projectile.mauserRound?(projectile.damage||1)*3:(projectile.damage||1);
      system.damageMember(member,damage,{projectile});
      bindings.onEliteImpact?.(game,member,projectile);
      if(!projectile.pierce){projectile.life=0;break;}
    }
  }
}

export function attachEliteSystem(game, bindings = {}, options = {}) {
  if (game.eliteEnemies) return game.eliteEnemies;
  game.eliteEnemies = new EliteEnemySystem(createHeadOnHost(game, bindings), options);
  return game.eliteEnemies;
}

export function installHeadOnElitePatch(GameClass, bindings = {}, options = {}) {
  if (!GameClass?.prototype) throw new TypeError('installHeadOnElitePatch requires the real HEAD-ON Game class');
  if (GameClass.prototype[INSTALL_KEY]) return GameClass.prototype[INSTALL_KEY];
  const originalUpdate = GameClass.prototype.update;
  if (typeof originalUpdate !== 'function') throw new TypeError('HEAD-ON Game.update was not found');
  GameClass.prototype.update = function elitePatchedUpdate(dt, input) {
    for(const b of bindings.getFriendlyProjectiles?.(this)||this.bullets||[]){b.previousX=b.x;b.previousY=b.y;}
    const result = originalUpdate.call(this, dt, input);
    if ((bindings.isPlaying?.(this) ?? this.state === 'playing')) {
      const system = attachEliteSystem(this, bindings, options);
      system.update(dt);
      routeFriendlyProjectileHits(this, system, bindings);
    }
    return result;
  };
  const uninstall = () => {
    if (GameClass.prototype.update === patchedUpdate) GameClass.prototype.update = originalUpdate;
    delete GameClass.prototype[INSTALL_KEY];
  };
  const patchedUpdate = GameClass.prototype.update;
  GameClass.prototype[INSTALL_KEY] = {uninstall, enemyType: ELITE_ENEMY_TYPE};
  return GameClass.prototype[INSTALL_KEY];
}
