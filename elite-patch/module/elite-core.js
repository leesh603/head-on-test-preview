import {
  DEFAULT_ELITE_CONFIG,
  ELITE_CFG_KEY,
  ELITE_ENEMY_TYPE,
  ELITE_KINDS,
  ELITE_WARNINGS,
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
  schlachtstaffel: {...DEFAULT_ELITE_CONFIG.schlachtstaffel, ...(user?.schlachtstaffel || {})},
  junkers: {...DEFAULT_ELITE_CONFIG.junkers, ...(user?.junkers || {})},
  salamander: {...DEFAULT_ELITE_CONFIG.salamander, ...(user?.salamander || {})}
});
const cfgFor = (config, kind) => config[ELITE_CFG_KEY[kind] || 'lePrieur'];

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
    const central = this.host.getPlayerFaction() === 'central';
    const tier2 = (this.host.getProgressStage?.() ?? 1) >= this.config.tier2Stage
      && this.random() < this.config.tier2Chance;
    if (central) return tier2 ? ELITE_KINDS.SALAMANDER : ELITE_KINDS.LE_PRIEUR;
    return tier2 ? ELITE_KINDS.JUNKERS : ELITE_KINDS.SCHLACHTSTAFFEL;
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
    const warning=ELITE_WARNINGS[kind]||'정예 편대 접근';
    this.host.emitWarning?.(warning, {kind, enemyType: ELITE_ENEMY_TYPE});
  }

  buildStats(kind, seconds) {
    const normal = this.host.getNormalStats(seconds, kind) || {};
    const ace = this.host.getAceStats(seconds) || {};
    const scale = eliteScale(seconds);
    const cfg = cfgFor(this.config, kind);
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
    if(this.host.isManaged?.()&&!this._admittedSpawn)return this.host.requestEncounter?.(kind)||null;
    if (this.squadrons.length >= this.config.maxActiveSquadrons) return null;
    const now = this.host.getTime();
    const player = this.host.getPlayer();
    const stats = this.buildStats(kind, now);
    const count = Math.min(this.config.maxActiveMembers, squadSize(kind, this.host.getProgressStage?.() ?? 1, !!this.host.isManaged?.()));
    const side = this.random() < .5 ? -1 : 1;
    const entryAngle = -Math.PI / 2 + side * (.3 + this.random() * .42);
    const view=this.host.getViewport?.(),dx=-Math.cos(entryAngle),dy=-Math.sin(entryAngle);
    const distance=view?Math.max(520,Math.min((view.w+160)/Math.max(1e-6,Math.abs(dx)),(view.h+160)/Math.max(1e-6,Math.abs(dy)))):520;
    const centerX = (view?.x??player.x) + dx*distance;
    const centerY = (view?.y??player.y) + dy*distance;
    const id = `elite-squadron-${++this.serial}`;
    const slots = Array.from({length:count},(_,i)=>i-(count-1)/2);
    const members = slots.map((slot, index) => ({
      id: `${id}-${index}`,
      enemyType: ELITE_ENEMY_TYPE,
      eliteKind: kind,
      squadronId: id,
      squadronSpawnAt: now,
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
      scale: cfgFor(this.config, kind).memberScale ?? (kind === ELITE_KINDS.SCHLACHTSTAFFEL ? 1.12 : .92)
    }));
    const leader=members.reduce((best,m)=>Math.abs(m.slot)<Math.abs(best.slot)?m:best,members[0]);
    leader.formationCommand=true;for(const m of members)if(m!==leader)m.formationLeader=leader;
    const squadron = {id, kind, members, leader, age: 0, phase: 'approach', stats, centerX, centerY};
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
    const tracked=this.host.getPlayer();this.playerVelocity=this.lastPlayerPose?{x:(tracked.x-this.lastPlayerPose.x)/step,y:(tracked.y-this.lastPlayerPose.y)/step}:{x:Math.cos(tracked.a||0)*(tracked.speed||150),y:Math.sin(tracked.a||0)*(tracked.speed||150)};this.lastPlayerPose={x:tracked.x,y:tracked.y};
    const aceActive = this.host.isAceActive?.() || false;
    if (this.lastAceActive && !aceActive) this.lastAceEndedAt = now;
    this.lastAceActive = aceActive;

    if (!this.host.isManaged?.() && !this.pendingEncounter && now >= this.nextEncounterAt) {
      if (this.canSchedule(now)) this.scheduleEncounter(now);
      else this.nextEncounterAt = now + this.range(this.config.retryDelay);
    }
    if (!this.host.isManaged?.() && this.pendingEncounter) {
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
      // Elites live outside world.enemies; their one shared fire advances here,
      // including while a leader loss temporarily diverts the formation AI.
      for(const member of squadron.members)this.advanceMemberBurn(member,step);
      if(squadron.phase==='departing'){this.updateDeparture(squadron,step);continue;}
      if (this.updateFormationBreak(squadron,step,now))continue;
      if (squadron.kind === ELITE_KINDS.LE_PRIEUR) this.updateLePrieur(squadron, step);
      else this.updateArmored(squadron, step);
      this.separateMembers(squadron);
    }
    this.updateProjectiles(step);
    const p = this.host.getPlayer();
    this.squadrons = this.squadrons.filter(s => s.members.some(m => m.alive) && (s.phase==='departing'?s.members.some(m=>{const v=this.host.getViewport?.();return m.alive&&(!v||Math.abs(m.x-v.x)<v.w+150&&Math.abs(m.y-v.y)<v.h+150);}):s.members.some(m => Math.hypot(m.x - p.x, m.y - p.y) < Math.max(this.config.despawnRadius,Math.hypot(this.host.getViewport?.().w||0,this.host.getViewport?.().h||0)+240))));
  }

  disruptFormation(member,duration=2.6) {
    const squadron=this.squadrons.find(s=>s.id===member?.squadronId);
    if(!squadron||(!member.alive&&member!==squadron.leader&&member!==squadron.formationResumeLeader))return false;
    return this.breakFormation(squadron,duration);
  }

  breakFormation(squadron,duration=2.6,leaderLost=false) {
    if(!squadron)return false;
    const now=this.host.getTime(),commander=squadron.leader||squadron.formationResumeLeader;
    leaderLost=leaderLost||!!(commander&&!commander.alive);
    if(squadron.breakUntil>now&&(!leaderLost||squadron.formationDeathBreak))return false;
    if(leaderLost)duration=2.6;
    squadron.formationResumeLeader=!leaderLost&&commander?.alive?commander:null;
    squadron.formationDeathBreak=leaderLost;squadron.breakUntil=now+duration;this.host.recordAttack?.('formationBreak',commander||squadron.members[0],{reason:leaderLost?'leader-dead':'disrupted',duration});
    if(leaderLost)squadron.regroupAt=(this.host.getProgressStage?.()??1)>=7?now+9:Infinity;
    squadron.leader=null;
    for(const m of squadron.members)if(m.alive){
      m.formationResumeLeader=m!==squadron.formationResumeLeader?squadron.formationResumeLeader:null;m.formationResumeCommand=m===squadron.formationResumeLeader;
      m.formationLeader=null;m.formationCommand=false;m.formationStrength=0;m.formationCollapseUntil=now+duration;
      delete m.rocketLocked;delete m.rocketAim;
      m.breakHeading=m.a+(Math.sign(m.slot)||1)*1.05;
      m.fireTimer=Math.max(m.fireTimer,duration+.2);m.rearTimer=Math.max(m.rearTimer,duration+.2);m.rocketTimer=Math.max(m.rocketTimer,duration+.2);m.telegraph=0;
    }
    return true;
  }

  updateFormationBreak(squadron,dt,now) {
    const commander=squadron.leader||squadron.formationResumeLeader;
    if(commander&&!commander.alive)this.breakFormation(squadron,2.6,true);
    if(squadron.breakUntil>now){
      for(const m of squadron.members)if(m.alive){
        m.hitFlash=Math.max(0,m.hitFlash-dt);m.fireTimer=Math.max(0,m.fireTimer-dt);m.rearTimer=Math.max(0,m.rearTimer-dt);m.rocketTimer=Math.max(0,m.rocketTimer-dt);m.a+=clamp(angleDiff(this.safeHeading(squadron,m,m.breakHeading),m.a),-1.4*dt,1.4*dt);
        const flight=this.flightSpeed(m,this.host.getPlayer());m.x+=Math.cos(m.a)*flight*dt;m.y+=Math.sin(m.a)*flight*dt;
      }
      this.separateMembers(squadron);return true;
    }
    if(squadron.breakUntil){
      const leader=squadron.formationResumeLeader?.alive?squadron.formationResumeLeader:null;
      squadron.leader=leader;squadron.breakUntil=0;squadron.formationResumeLeader=null;squadron.formationDeathBreak=false;
      const living=squadron.members.filter(m=>m.alive);
      for(const m of living){m.formationLeader=leader&&m!==leader?leader:null;m.formationCommand=m===leader;m.formationStrength=leader?living.length/squadron.members.length:0;m.formationCollapseUntil=0;m.formationResumeLeader=null;m.formationResumeCommand=false;m.breakHeading=null}
    }
    if(squadron.regroupAt<=now){
      const living=squadron.members.filter(m=>m.alive);squadron.regroupAt=Infinity;
      if(living.length>=2){
        squadron.leader=living[0];squadron.leader.formationCommand=true;
        for(const m of living){m.formationLeader=m===squadron.leader?null:squadron.leader;m.formationStrength=living.length/squadron.members.length}
      }
    }
    return false;
  }

  rocketIntercept(member, player, roundSpeed) {
    const v=this.playerVelocity||{x:Math.cos(player.a||0)*(player.speed||150),y:Math.sin(player.a||0)*(player.speed||150)};
    const dx=player.x-member.x,dy=player.y-member.y,speed=roundSpeed??this.config.lePrieur.rocketSpeed*eliteScale(this.host.getTime()).projectileSpeed;
    const a=v.x*v.x+v.y*v.y-speed*speed,b=2*(dx*v.x+dy*v.y),c=dx*dx+dy*dy,disc=b*b-4*a*c;
    const roots=Math.abs(a)<1e-6?[-c/(b||1)]:disc>=0?[(-b-Math.sqrt(disc))/(2*a),(-b+Math.sqrt(disc))/(2*a)]:[];
    const times=roots.filter(t=>t>0&&Number.isFinite(t)),lead=times.length?Math.min(3,Math.min(...times)):Math.min(2,Math.sqrt(c)/speed);
    return Math.atan2(dy+v.y*lead,dx+v.x*lead);
  }

  updateLePrieur(squadron, dt) {
    const player = this.host.getPlayer(),cfg = this.config.lePrieur;
    const living=squadron.members.filter(m=>m.alive);
    if(!living.some(m=>m.id===squadron.rocketShooter)&&living.every(m=>this.memberVisible(m))){
      const ready=living.filter(m=>m.rocketTimer<=cfg.aimTime+cfg.warningTime&&this.memberVisible(m)).sort((a,b)=>a.rocketTimer-b.rocketTimer||Math.abs(a.slot)-Math.abs(b.slot));
      squadron.rocketShooter=ready[0]?.id;
    }
    for (const m of squadron.members.filter(m => m.alive)) {
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      if(m.rocketLocked&&living.some(other=>other!==m&&Math.hypot(other.x-m.x,other.y-m.y)<80)){
        delete m.rocketLocked;delete m.rocketAim;m.rocketTimer=cfg.aimTime+cfg.warningTime;m.telegraph=0;squadron.rocketShooter=null;
      }
      const preparing=m.id===squadron.rocketShooter;
      const station=this.formationHeading(squadron,m,player,Math.atan2(player.y-m.y,player.x-m.x));
      // Wing-mounted rockets align the airframe, then commit to a visible fixed
      // firing axis. No sideways launch or last-frame tracking after the lock.
      if(preparing&&m.rocketTimer>cfg.warningTime)m.rocketAim=this.rocketIntercept(m,player)+(this.host.getTime()<300?(m.slot<0?-1:1)*cfg.rocketSpacing/2:0);
      const desired=m.rocketLocked?m.rocketAim:preparing?this.safeHeading(squadron,m,station+clamp(angleDiff(m.rocketAim??m.a,station),-.06,.06)):station;
      const turn=preparing?1.45:1.9;
      const steering=this.host.steerAircraft?.(m,player,turn,{delta:angleDiff(desired,m.a),turn})||{delta:angleDiff(desired,m.a),turn};
      m.a += clamp(steering.delta,-steering.turn*dt,steering.turn*dt);
      
      const flight=this.flightSpeed(m,player);m.x+=Math.cos(m.a)*flight*dt;m.y+=Math.sin(m.a)*flight*dt;
      if(!this.memberVisible(m))continue;
      m.fireTimer-=dt;
      if(m.fireTimer<=0&&Math.abs(angleDiff(this.rocketIntercept(m,player),m.a))<.18){const fired=this.fireTracer(m,m.a,194,Math.max(1,Math.round(m.damage*.58)),'eliteFrontTracer');m.fireTimer=fired?cfg.forwardGunCooldown/squadron.stats.patternScale+this.random()*.45:.12;}
      if(!preparing){m.rocketTimer=Math.max(cfg.aimTime+cfg.warningTime,m.rocketTimer-dt);m.telegraph=0;continue;}
      const aligned=(m.rocketLocked||!m.formationAvoid)&&Math.abs(angleDiff(m.rocketAim??m.a,m.a))<.10;
      if(m.rocketTimer>cfg.warningTime&&m.rocketTimer-dt<=cfg.warningTime&&!aligned)m.rocketTimer=cfg.warningTime+dt;
      else {m.rocketTimer-=dt;if(m.rocketTimer<=cfg.warningTime)m.rocketLocked=true;}
      if(m.rocketTimer<=cfg.warningTime&&m.rocketTimer>0){
        if(!aligned){m.rocketTimer=cfg.warningTime+dt;m.telegraph=0;}
        else{m.telegraph=1-m.rocketTimer/cfg.warningTime;m.gunAim=m.rocketAim;}
      }else m.telegraph=0;
      if(m.rocketTimer<=0){
        if(aligned){const rockets=this.host.getTime()>=300?3:2;let created=0;for(let i=0;i<rockets;i++)if(this.fireRocket(m,m.a+(i-(rockets-1)/2)*cfg.rocketSpacing))created++;if(created){m.rocketTimer=Math.max(5.6,cfg.rocketCooldown/squadron.stats.patternScale)+this.random()*.8;delete m.rocketAim;delete m.rocketLocked;squadron.rocketShooter=null;this.host.emitEvent?.('eliteRocketSalvo',{memberId:m.id,count:created});this.host.playSound?.('eliteRocket');}else m.rocketTimer=.12;}
        else m.rocketTimer=cfg.warningTime+dt;
      }
    }
  }

  updateArmored(squadron, dt) {
    const player = this.host.getPlayer();
    const cfg = cfgFor(this.config, squadron.kind);
    const turn = cfg.turnRate ?? 0.72;
    const living = squadron.members.filter(m => m.alive);
    for (const m of living) {
      m.hitFlash = Math.max(0, m.hitFlash - dt);
      const aim = Math.atan2(player.y - m.y, player.x - m.x);
      const desired=this.formationHeading(squadron,m,player,aim);
      const steering=this.host.steerAircraft?.(m,player,turn,{delta:angleDiff(desired,m.a),turn})||{delta:angleDiff(desired,m.a),turn};
      m.a += clamp(steering.delta, -steering.turn * dt, steering.turn * dt);
      const flight=this.flightSpeed(m,player);m.x+=Math.cos(m.a)*flight*dt;m.y+=Math.sin(m.a)*flight*dt;
      if(!this.memberVisible(m))continue;
      m.fireTimer -= dt;
      if (m.fireTimer <= 0) {
        let fired=false;
        if (cfg.twinFront) {
          fired=this.fireTracer(m, m.a + m.slot * .055 - .038, 218, Math.max(1, Math.round(m.damage * .62)), 'eliteFrontTracer');
          fired=this.fireTracer(m, m.a + m.slot * .055 + .038, 218, Math.max(1, Math.round(m.damage * .62)), 'eliteFrontTracer')||fired;
        } else fired=this.fireTracer(m, m.a + m.slot * .055, 218, m.damage, 'eliteFrontTracer');
        m.fireTimer=fired?cfg.frontCooldown / squadron.stats.patternScale + this.random() * .3:.12;
      }
      if (cfg.noRearGun) continue;
      m.rearTimer -= dt;
      const range = Math.hypot(player.x - m.x, player.y - m.y);
      const rearA = m.a + Math.PI;
      const inRearArc = Math.abs(angleDiff(aim, rearA)) <= cfg.rearHalfArc;
      if (m.rearTimer <= 0 && inRearArc && range >= cfg.rearMinRange && range <= cfg.rearMaxRange) {
        m.gunAim = this.rocketIntercept(m,player,204);
        const fired=this.fireTracer(m, m.gunAim, 204, Math.max(1, Math.round(m.damage * .82)), 'eliteRearTracer', -22);
        m.rearTimer=fired?cfg.rearCooldown / squadron.stats.patternScale + this.random() * .34:.12;
        if(fired){this.host.emitEvent?.('eliteRearGun', {memberId: m.id});this.host.playSound?.('eliteRearGun');}
      }
    }
  }

  admitShot(member) {
    this.host.recordAttack?.('shotAttempt',member);
    if(!this.memberVisible(member)||this.projectiles.length>=180||this.host.canAttack?.(member,{projectiles:this.projectiles.length})===false){this.host.recordAttack?.('shotDenied',member,{reason:this.projectiles.length>=180?'projectile-cap':member.directorAttackDeniedReason||'offscreen'});return false;}
    return true;
  }

  fireRocket(member, angle) {
    if(!this.admitShot(member))return false;
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
    this.host.recordAttack?.('shotCreated',member);return true;
  }

  fireTracer(member, angle, speed, damage, kind, muzzleOffset = 24) {
    if(!this.admitShot(member))return false;
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
    this.host.recordAttack?.('shotCreated',member);return true;
  }

  updateProjectiles(dt) {
    const players=this.host.getPlayers?.()||[this.host.getPlayer()];
    for (const p of this.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      for(const player of players)if (p.life > 0 && Math.hypot(p.x - player.x, p.y - player.y) <= p.radius + this.config.playerCollisionRadius) {
        this.host.damagePlayer(p.damage, {enemyType: ELITE_ENEMY_TYPE, eliteKind: p.eliteKind, projectileKind: p.kind,playerId:player.id,projectile:p});
        p.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0).slice(-180);
  }

  prepareProjectileBurn(dt) {
    const now=this.host.getTime(),seen=this._projectileBurnFrames??=new WeakMap();
    for(const member of this.members){if(seen.get(member)===now)continue;this.advanceMemberBurn(member,dt);seen.set(member,now);}
  }

  advanceMemberBurn(member,dt) {
    if(this._projectileBurnFrames?.get(member)===this.host.getTime())return;
    if(!member.alive||!(member.burnTime>0))return;
    const active=Math.min(dt,member.burnTime);
    member.fuelFxAge=(member.fuelFxAge||0)+active;
    member.burnTime=Math.max(0,member.burnTime-dt);
    if(member.gontermannBurn)member.gontermannBurn.age=(member.gontermannBurn.age||0)+active;
    this.damageMember(member,Math.max(0,member.burnDps||0)*active,{burn:true,ownerId:member.burnOwnerId??'p1'});
    member.burnFxTime=(member.burnFxTime||0)-dt;
    if(member.alive&&member.burnFxTime<=0&&!member.gontermannBurn){member.burnFxTime=.13;this.host.emitBurnFx?.(member);}
    if(!member.burnTime||!member.alive){member.burnTime=0;member.burnDps=0;delete member.gontermannBurn;delete member.burnAnchorSpace;delete member.burnPartId;}
  }

  damageMember(memberOrId, damage, source = {}) {
    const member = typeof memberOrId === 'string' ? this.members.find(m => m.id === memberOrId) : memberOrId;
    if (!member?.alive || !(damage > 0) || this.host.canDamageMember?.(member,source)===false) return false;
    damage*=this.host.outgoingDamageMultiplier?.(source)??1;
    const armor = cfgFor(this.config, member.eliteKind).armorFactor;
    // Continuous fire keeps the armor factor without rounding every fraction
    // of a second up to a whole projectile hit.
    if (armor && armor < 1) damage = source.burn?damage*armor:Math.max(1, Math.round(damage * armor));
    if(member.hp===member.maxHp)this.host.recordAttack?.('firstHit',member,{damage});member.hp -= damage;
    if(!source.burn)member.hitFlash = .16;
    if (member.hp > 0) return true;
    member.alive = false;
    member.hp = 0;this.host.recordAttack?.('memberDead',member);
    const squadron = this.squadrons.find(s => s.id === member.squadronId);
    if (squadron) {
      const living = squadron.members.filter(m => m.alive);
      for (const m of living) m.formationStrength = squadron.leader?.alive?living.length / squadron.members.length:0;
      if(member===squadron.leader||member===squadron.formationResumeLeader)this.breakFormation(squadron,2.6,true);
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

  safeHeading(s,m,heading){m.formationAvoid=false;if(!this.host.isManaged?.())return heading;for(const other of s.members){if(other===m||!other.alive)continue;const rx=m.x-other.x,ry=m.y-other.y,d=Math.hypot(rx,ry),mv=m.flightSpeed||m.speed,ov=other.flightSpeed||other.speed,vx=Math.cos(m.a)*mv-Math.cos(other.a)*ov,vy=Math.sin(m.a)*mv-Math.sin(other.a)*ov,t=clamp(-(rx*vx+ry*vy)/(vx*vx+vy*vy||1),0,1.6);if(d<320&&Math.hypot(rx+vx*t,ry+vy*t)<(s.members.length>4?55:s.members.length<=3?100:85)){const side=Math.sign(-Math.sin(m.a)*rx+Math.cos(m.a)*ry)||Math.sign(m.slot-other.slot)||1;m.formationAvoid=true;return m.a+side*1.05;}}return heading;}
  memberVisible(m){if(!this.host.isManaged?.())return true;const v=this.host.getViewport?.();return !v||Math.abs(m.x-v.x)<v.w-45&&Math.abs(m.y-v.y)<v.h-45;}
  formationHeading(s,m,p,aim){
    if(!s.leader?.alive)return this.safeHeading(s,m,aim);
    const a=Number.isFinite(p.a)?p.a:aim,c=Math.cos(a),n=Math.sin(a),v=this.host.getViewport?.(),maxSlot=Math.max(...s.members.map(x=>Math.abs(x.slot))),spacing=s.members.length>4&&v?Math.max(60,Math.min(90,(v.w-55-Math.abs(c)*70)/(maxSlot*Math.max(.001,Math.abs(n))),(v.h-55-Math.abs(n)*70)/(maxSlot*Math.max(.001,Math.abs(c))))):s.members.length<=3?112:90,side=maxSlot*spacing;
    let depth=v?Math.max(70,Math.min(180,(v.w-50-Math.abs(n)*side)/Math.max(.001,Math.abs(c)),(v.h-50-Math.abs(c)*side)/Math.max(.001,Math.abs(n)))):180;
    if(s.members.length>4)depth=70+(Math.abs(m.slot)%2?65:0);
    let lateral=m.slot*spacing;
    if(this.host.isManaged?.()){
      if(s.kind===ELITE_KINDS.SCHLACHTSTAFFEL){depth*=Math.cos(s.age*.28);lateral+=Math.sin(s.age*.28)*12;m.tacticalRole='rear-gun-sweep';}
      else if(s.kind===ELITE_KINDS.JUNKERS){depth=Math.min(depth,130);lateral+=Math.sin(s.age*.25)*8;m.tacticalRole='armored-pressure';}
      else if(s.kind===ELITE_KINDS.SALAMANDER){const run=s.age%7;depth*=.55+.45*Math.cos(s.age*.9);m.tacticalRole=run>3&&run<5.2?'forward-pass':'reform';}
    }
    if(s.kind===ELITE_KINDS.LE_PRIEUR&&s.members.length>4&&s.rocketShooter){const shooter=s.members.find(q=>q.id===s.rocketShooter);if(shooter){lateral=(m===shooter?0:m.slot===0?shooter.slot:m.slot)*70;depth=m===shooter?130:70;}}
    if(s.members.length>4&&v){const bound=Math.max(70,Math.min((v.w-55-Math.abs(n*lateral))/Math.max(.001,Math.abs(c)),(v.h-55-Math.abs(c*lateral))/Math.max(.001,Math.abs(n))));depth=Math.sign(depth||1)*Math.min(Math.abs(depth),bound);}
    const x=p.x-c*depth-n*lateral,y=p.y-n*depth+c*lateral;
    if(!this.host.isManaged?.())return Math.atan2(y-m.y,x-m.x);
    const pv=this.playerVelocity||{x:c*(p.speed||150),y:n*(p.speed||150)},vx=pv.x+(x-m.x)*.9,vy=pv.y+(y-m.y)*.9;
    m.stationSpeed=clamp(Math.hypot(vx,vy),60,440);m.stationHeading=Math.atan2(vy,vx);m.reinforcedStation=s.members.length>4;
    return this.safeHeading(s,m,m.stationHeading);
  }
  flightSpeed(m,p){if(!this.host.isManaged?.())return m.speed;const pace=Math.max(60,Math.min(320,(p.speed||150)*(p.airframeSpeed??1))),range=Math.hypot(m.x-p.x,m.y-p.y);const cruise=m.formationAvoid?(m.reinforcedStation&&m.tacticalRole==='rear-gun-sweep'&&pace>200?Math.max(90,pace*.65):60):m.formationCollapseUntil>this.host.getTime()?m.speed:m.stationSpeed??(range>400?Math.max(m.speed,pace+90):Math.max(m.speed,pace));return m.flightSpeed=m.reinforcedStation&&Math.abs(angleDiff(m.stationHeading??m.a,m.a))>.55?Math.min(cruise,Math.max(80,pace*.72)):cruise;}
  updateDeparture(s,dt){const p=this.host.getPlayer(),pace=Math.max(60,Math.min(320,(p.speed||150)*(p.airframeSpeed??1)))+120;for(const m of s.members)if(m.alive){m.a+=clamp(angleDiff(this.safeHeading(s,m,m.departureHeading??m.a),m.a),-.9*dt,.9*dt);m.x+=Math.cos(m.a)*pace*dt;m.y+=Math.sin(m.a)*pace*dt;m.telegraph=0;}}
  // Separation is authored into steering targets; never push aircraft sideways.
  separateMembers(squadron) {}

  range([lo, hi]) { return lo + (hi - lo) * this.random(); }
}

export {ELITE_ENEMY_TYPE, ELITE_KINDS};


