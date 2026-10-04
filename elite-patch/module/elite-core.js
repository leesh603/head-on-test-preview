import {
  DEFAULT_ELITE_CONFIG,
  ELITE_ENEMY_TYPE,
  ELITE_KINDS,
  eliteScale,
  squadSize
} from './elite-config.js';

const TAU = Math.PI * 2;
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const mergeConfig = user => ({
  ...DEFAULT_ELITE_CONFIG,
  ...user,
  lePrieur: {...DEFAULT_ELITE_CONFIG.lePrieur, ...(user?.lePrieur || {})},
  schlachtstaffel: {...DEFAULT_ELITE_CONFIG.schlachtstaffel, ...(user?.schlachtstaffel || {})}
});

function requireHost(host) {
  for (const name of ['getTime', 'getPlayer', 'getPlayerFaction', 'getNormalStats', 'getAceStats', 'damagePlayer']) {
    if (typeof host?.[name] !== 'function') throw new TypeError(`EliteEnemy host adapter requires ${name}()`);
  }
}

export class EliteEnemySystem {
  constructor(host, options = {}) {
    requireHost(host);
    this.host = host;
    this.config = mergeConfig(options);
    this.random = host.random || Math.random;
    this.squadrons = [];
    this.projectiles = [];
    this.nextEncounterAt = this.config.firstEncounterAt;
    this.pendingEncounter = null;
    this.lastAceActive = false;
    this.lastAceEndedAt = -Infinity;
    this.serial = 0;
  }

  get members() { return this.squadrons.flatMap(s => s.members).filter(m => m.alive); }
  get active() { return this.squadrons.length > 0 || this.pendingEncounter !== null; }

  chooseKind() {
    return this.host.getPlayerFaction() === 'central'
      ? ELITE_KINDS.LE_PRIEUR
      : ELITE_KINDS.SCHLACHTSTAFFEL;
  }

  canSchedule(now) {
    if ((this.host.getProgressStage?.() ?? 1) < this.config.unlockStage) return false;
    if (this.squadrons.length >= this.config.maxActiveSquadrons) return false;
    if ((this.host.isAceActive?.() || false)) return false;
    const untilAce = this.host.secondsUntilAce?.() ?? Infinity;
    if (untilAce < this.config.aceBeforeLockout) return false;
    if (now - this.lastAceEndedAt < this.config.aceAfterLockout) return false;
    return true;
  }

  scheduleEncounter(now) {
    const kind = this.chooseKind();
    this.pendingEncounter = {kind, spawnAt: now + this.config.warningLead};
    const warning=kind===ELITE_KINDS.LE_PRIEUR?'르 프리외르 로켓 장착 정예편대 접근':'장갑판 보강 슐라흐트슈타펠 접근';
    this.host.emitWarning?.(warning, {kind, enemyType: ELITE_ENEMY_TYPE});
  }

  buildStats(kind, seconds) {
    const normal = this.host.getNormalStats(seconds, kind) || {};
    const ace = this.host.getAceStats(seconds) || {};
    const scale = eliteScale(seconds);
    const cfg = kind === ELITE_KINDS.LE_PRIEUR ? this.config.lePrieur : this.config.schlachtstaffel;
    const normalHp = Math.max(1, normal.hp || 22);
    const aceHp = Math.max(normalHp * 4, ace.hp || normalHp * 12);
    const normalDamage = Math.max(1, normal.damage || 9);
    const aceDamage = Math.max(normalDamage * 2, ace.damage || normalDamage * 4);
    const hp = Math.min(aceHp * cfg.aceHpCapPerMember, normalHp * cfg.hpNormalMultiplier * scale.hp);
    const damage = Math.min(aceDamage * cfg.aceDamageCap, normalDamage * cfg.damageNormalMultiplier * scale.damage);
    return {
      hp: Math.max(normalHp * 1.5, Math.round(hp)),
      damage: Math.max(normalDamage * 1.3, Math.round(damage)),
      speed: Math.max(60, (normal.speed || 95) * cfg.speedNormalMultiplier * (1 + Math.min(.10, seconds / 1500))),
      projectileSpeedScale: scale.projectileSpeed,
      patternScale: scale.pattern,
      aceHp,
      aceDamage
    };
  }

  spawnEncounter(kind = this.chooseKind()) {
    if (this.squadrons.length >= this.config.maxActiveSquadrons) return null;
    const now = this.host.getTime();
    const player = this.host.getPlayer();
    const stats = this.buildStats(kind, now);
    const count = Math.min(this.config.maxActiveMembers, squadSize(kind, this.host.getProgressStage?.() ?? 1));
    const side = this.random() < .5 ? -1 : 1;
    const entryAngle = -Math.PI / 2 + side * (.3 + this.random() * .42);
    const centerX = player.x - Math.cos(entryAngle) * 520;
    const centerY = player.y - Math.sin(entryAngle) * 520;
    const id = `elite-squadron-${++this.serial}`;
    const slots = count === 2 ? [-.5, .5] : count === 3 ? [-1, 0, 1] : [-1.5, -.5, .5, 1.5];
    const members = slots.map((slot, index) => ({
      id: `${id}-${index}`,
      enemyType: ELITE_ENEMY_TYPE,
      eliteKind: kind,
      squadronId: id,
      faction: this.host.getPlayerFaction() === 'central' ? 'entente' : 'central',
      x: centerX + slot * 64,
      y: centerY + Math.abs(slot) * 24,
      a: entryAngle,
      slot,
      hp: stats.hp,
      maxHp: stats.hp,
      damage: stats.damage,
      speed: stats.speed,
      fireTimer: .8 + index * .16,
      rearTimer: 1.1 + index * .13,
      rocketTimer: this.config.lePrieur.aimTime + this.config.lePrieur.warningTime,
      aimTimer: this.config.lePrieur.aimTime,
      warningTimer: 0,
      telegraph: 0,
      alive: true,
      hitFlash: 0,
      formationStrength: 1,
      gunAim: entryAngle,
      scale: kind === ELITE_KINDS.SCHLACHTSTAFFEL ? 1.12 : .92
    }));
    const squadron = {id, kind, members, age: 0, phase: 'approach', stats, centerX, centerY};
    this.squadrons.push(squadron);
    this.pendingEncounter = null;
    this.host.emitEvent?.('eliteSpawn', {kind, enemyType: ELITE_ENEMY_TYPE, count});
    this.host.playSound?.(kind === ELITE_KINDS.LE_PRIEUR ? 'eliteApproachFast' : 'eliteApproachHeavy');
    return squadron;
  }

  update(dt) {
    const step = clamp(Number(dt) || 0, 0, .05);
    if (!step) return;
    const now = this.host.getTime();
    const aceActive = this.host.isAceActive?.() || false;
    if (this.lastAceActive && !aceActive) this.lastAceEndedAt = now;
    this.lastAceActive = aceActive;

    if (!this.pendingEncounter && now >= this.nextEncounterAt) {
      if (this.canSchedule(now)) this.scheduleEncounter(now);
      else this.nextEncounterAt = now + this.range(this.config.retryDelay);
    }
    if (this.pendingEncounter) {
      if (aceActive) {
        this.pendingEncounter = null;
        this.nextEncounterAt = now + this.range(this.config.retryDelay);
      } else if (now >= this.pendingEncounter.spawnAt) {
        this.spawnEncounter(this.pendingEncounter.kind);
        this.nextEncounterAt = now + this.range(this.config.encounterCooldown);
      }
    }

    for (const squadron of this.squadrons) {
      squadron.age += step;
      if (squadron.kind === ELITE_KINDS.LE_PRIEUR) this.updateLePrieur(squadron, step);
      else this.updateSchlachtstaffel(squadron, step);
      this.separateMembers(squadron);
    }
    this.updateProjectiles(step);
    const p = this.host.getPlayer();
    this.squadrons = this.squadrons.filter(s => s.members.some(m => m.alive) && s.members.some(m => Math.hypot(m.x - p.x, m.y - p.y) < this.config.despawnRadius));
  }

  updateLePrieur(squadron, dt) {
    const player = this.host.getPlayer();
    const cfg = this.config.lePrieur;
    const living = squadron.members.filter(m => m.alive);
    for (const m of living) {
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      const aim = Math.atan2(player.y - m.y, player.x - m.x);
      const turn = squadron.phase === 'aim' ? 1.45 : 1.9;
      m.a += clamp(angleDiff(aim, m.a), -turn * dt, turn * dt);
      const formationSide = m.a + Math.PI / 2;
      const targetX = player.x - Math.cos(m.a) * 250 + Math.cos(formationSide) * m.slot * 66;
      const targetY = player.y - Math.sin(m.a) * 250 + Math.sin(formationSide) * m.slot * 66;
      m.x += Math.cos(m.a) * m.speed * dt + (targetX - m.x) * dt * .34;
      m.y += Math.sin(m.a) * m.speed * dt + (targetY - m.y) * dt * .34;
      m.rocketTimer -= dt;
      if (m.rocketTimer <= cfg.warningTime && m.rocketTimer > 0) {
        m.telegraph = 1 - m.rocketTimer / cfg.warningTime;
        m.gunAim = aim;
      } else m.telegraph = 0;
      if (m.rocketTimer <= 0) {
        const rockets = this.host.getTime() >= 300 ? 3 : 2;
        for (let i = 0; i < rockets; i++) this.fireRocket(m, aim + (i - (rockets - 1) / 2) * cfg.rocketSpacing);
        m.rocketTimer = Math.max(5.6, cfg.rocketCooldown / squadron.stats.patternScale) + this.random() * .8;
        this.host.emitEvent?.('eliteRocketSalvo', {memberId: m.id, count: rockets});
        this.host.playSound?.('eliteRocket');
      }
      m.fireTimer -= dt;
      if (m.fireTimer <= 0) {
        m.fireTimer = cfg.forwardGunCooldown / squadron.stats.patternScale + this.random() * .45;
        this.fireTracer(m, aim, 194, Math.max(1, Math.round(m.damage * .58)), 'eliteFrontTracer');
      }
    }
  }

  updateSchlachtstaffel(squadron, dt) {
    const player = this.host.getPlayer();
    const cfg = this.config.schlachtstaffel;
    const living = squadron.members.filter(m => m.alive);
    for (const m of living) {
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      const aim = Math.atan2(player.y - m.y, player.x - m.x);
      m.a += clamp(angleDiff(aim, m.a), -0.72 * dt, 0.72 * dt);
      const sideA = m.a + Math.PI / 2;
      const forwardOffset = m.slot === 0 ? 0 : -34;
      const targetX = player.x - Math.cos(m.a) * (285 - forwardOffset) + Math.cos(sideA) * m.slot * 76;
      const targetY = player.y - Math.sin(m.a) * (285 - forwardOffset) + Math.sin(sideA) * m.slot * 76;
      m.x += Math.cos(m.a) * m.speed * dt + (targetX - m.x) * dt * .26;
      m.y += Math.sin(m.a) * m.speed * dt + (targetY - m.y) * dt * .26;
      m.fireTimer -= dt;
      if (m.fireTimer <= 0) {
        m.fireTimer = cfg.frontCooldown / squadron.stats.patternScale + this.random() * .3;
        this.fireTracer(m, m.a + m.slot * .055, 218, m.damage, 'eliteFrontTracer');
      }
      m.rearTimer -= dt;
      const range = Math.hypot(player.x - m.x, player.y - m.y);
      const rearA = m.a + Math.PI;
      const inRearArc = Math.abs(angleDiff(aim, rearA)) <= cfg.rearHalfArc;
      if (m.rearTimer <= 0 && inRearArc && range >= cfg.rearMinRange && range <= cfg.rearMaxRange) {
        m.rearTimer = cfg.rearCooldown / squadron.stats.patternScale + this.random() * .34;
        m.gunAim = aim;
        this.fireTracer(m, aim, 204, Math.max(1, Math.round(m.damage * .82)), 'eliteRearTracer', -22);
        this.host.emitEvent?.('eliteRearGun', {memberId: m.id});
        this.host.playSound?.('eliteRearGun');
      }
    }
  }

  fireRocket(member, angle) {
    const cfg = this.config.lePrieur;
    const speed = cfg.rocketSpeed * eliteScale(this.host.getTime()).projectileSpeed;
    this.projectiles.push({
      id: `elite-projectile-${++this.serial}`,
      enemy: true,
      enemyType: ELITE_ENEMY_TYPE,
      eliteKind: member.eliteKind,
      kind: 'eliteRocket',
      x: member.x + Math.cos(angle) * 28,
      y: member.y + Math.sin(angle) * 28,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: cfg.rocketLife,
      damage: Math.round(member.damage * 1.32),
      radius: 12,
      hostileRocket: true
    });
  }

  fireTracer(member, angle, speed, damage, kind, muzzleOffset = 24) {
    this.projectiles.push({
      id: `elite-projectile-${++this.serial}`,
      enemy: true,
      enemyType: ELITE_ENEMY_TYPE,
      eliteKind: member.eliteKind,
      kind,
      x: member.x + Math.cos(member.a) * muzzleOffset,
      y: member.y + Math.sin(member.a) * muzzleOffset,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 4.1,
      damage,
      radius: 7
    });
    this.host.emitEvent?.('eliteGunfire', {kind, memberId: member.id});
  }

  updateProjectiles(dt) {
    const player = this.host.getPlayer();
    for (const p of this.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life > 0 && Math.hypot(p.x - player.x, p.y - player.y) <= p.radius + this.config.playerCollisionRadius) {
        this.host.damagePlayer(p.damage, {enemyType: ELITE_ENEMY_TYPE, eliteKind: p.eliteKind, projectileKind: p.kind});
        p.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0).slice(-180);
  }

  damageMember(memberOrId, damage, source = {}) {
    const member = typeof memberOrId === 'string' ? this.members.find(m => m.id === memberOrId) : memberOrId;
    if (!member?.alive || !(damage > 0)) return false;
    member.hp -= damage;
    member.hitFlash = .16;
    if (member.hp > 0) return true;
    member.alive = false;
    member.hp = 0;
    const squadron = this.squadrons.find(s => s.id === member.squadronId);
    if (squadron) {
      const living = squadron.members.filter(m => m.alive);
      for (const m of living) m.formationStrength = living.length / squadron.members.length;
    }
    this.host.onEliteKilled?.({
      enemyType: ELITE_ENEMY_TYPE,
      killType: ELITE_ENEMY_TYPE,
      eliteKind: member.eliteKind,
      memberId: member.id,
      x: member.x,
      y: member.y,
      scoreClass: 'elite',
      countsForPriorityRanking: false,
      rewardMultiplier: member.eliteKind === ELITE_KINDS.SCHLACHTSTAFFEL ? 2.4 : 2.0,
      source
    });
    return true;
  }

  separateMembers(squadron) {
    const living = squadron.members.filter(m => m.alive);
    for (let i = 0; i < living.length; i++) for (let j = i + 1; j < living.length; j++) {
      const a = living[i], b = living[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      const min = squadron.kind === ELITE_KINDS.SCHLACHTSTAFFEL ? 58 : 48;
      if (d < min) {
        const nx = d > 0 ? dx / d : 1, ny = d > 0 ? dy / d : 0, push = (min - d) * .5;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      }
    }
  }

  range([lo, hi]) { return lo + (hi - lo) * this.random(); }
}

export {ELITE_ENEMY_TYPE, ELITE_KINDS};
