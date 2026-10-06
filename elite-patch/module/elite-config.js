export const ELITE_ENEMY_TYPE = 'elite';

export const ELITE_KINDS = Object.freeze({
  LE_PRIEUR: 'le_prieur_squadron',
  SCHLACHTSTAFFEL: 'schlachtstaffel',
  JUNKERS: 'junkers_squadron',
  SALAMANDER: 'salamander_squadron'
});

export const DEFAULT_ELITE_CONFIG = Object.freeze({
  firstEncounterAt: 0,
  unlockStage: 4,
  encounterCooldown: [58, 82],
  retryDelay: [8, 14],
  warningLead: 1.45,
  aceBeforeLockout: 16,
  aceAfterLockout: 13,
  maxActiveSquadrons: 1,
  maxActiveMembers: 4,
  despawnRadius: 1250,
  playerCollisionRadius: 11,
  tier2Stage: 10,
  tier2Chance: 0.55,
  lePrieur: Object.freeze({
    hpNormalMultiplier: 1.72,
    aceHpCapPerMember: 0.24,
    damageNormalMultiplier: 1.48,
    aceDamageCap: 0.42,
    speedNormalMultiplier: 1.16,
    aimTime: 1.1,
    warningTime: 0.72,
    rocketSpeed: 236,
    rocketLife: 4.2,
    rocketSpacing: 0.12,
    rocketCooldown: 8.5,
    forwardGunCooldown: 2.15
  }),
  schlachtstaffel: Object.freeze({
    hpNormalMultiplier: 2.08,
    aceHpCapPerMember: 0.28,
    damageNormalMultiplier: 1.32,
    aceDamageCap: 0.38,
    speedNormalMultiplier: 0.94,
    frontCooldown: 1.62,
    rearCooldown: 1.28,
    rearHalfArc: Math.PI * 0.34,
    rearMinRange: 48,
    rearMaxRange: 360
  }),
  junkers: Object.freeze({
    hpNormalMultiplier: 2.85,
    aceHpCapPerMember: 0.33,
    damageNormalMultiplier: 1.45,
    aceDamageCap: 0.46,
    speedNormalMultiplier: 0.8,
    frontCooldown: 1.5,
    rearCooldown: 1.15,
    rearHalfArc: Math.PI * 0.42,
    rearMinRange: 44,
    rearMaxRange: 400,
    armorFactor: 0.55,
    turnRate: 0.6,
    twinFront: true,
    memberScale: 1.28
  }),
  salamander: Object.freeze({
    hpNormalMultiplier: 2.4,
    aceHpCapPerMember: 0.3,
    damageNormalMultiplier: 1.52,
    aceDamageCap: 0.44,
    speedNormalMultiplier: 0.94,
    frontCooldown: 1.3,
    armorFactor: 0.6,
    turnRate: 1.05,
    twinFront: true,
    noRearGun: true,
    memberScale: 1.06
  })
});

export function eliteScale(seconds) {
  const t = Math.max(0, Number(seconds) || 0);
  return {
    pattern: 1 + Math.min(0.48, t / 720),
    hp: 1 + Math.min(0.62, t / 620),
    damage: 1 + Math.min(0.38, t / 850),
    projectileSpeed: 1 + Math.min(0.2, t / 1050)
  };
}

export function squadSize(kind, progressStage) {
  const stage = Math.max(1, Number(progressStage) || 1);
  const armored = kind === ELITE_KINDS.JUNKERS || kind === ELITE_KINDS.SALAMANDER;
  const base = stage < 7 ? 2 : stage < 10 ? 3 : 4;
  return armored ? Math.min(3, base) : base;
}

export const ELITE_CFG_KEY = Object.freeze({
  [ELITE_KINDS.LE_PRIEUR]: 'lePrieur',
  [ELITE_KINDS.SCHLACHTSTAFFEL]: 'schlachtstaffel',
  [ELITE_KINDS.JUNKERS]: 'junkers',
  [ELITE_KINDS.SALAMANDER]: 'salamander'
});

export const ELITE_WARNINGS = Object.freeze({
  [ELITE_KINDS.LE_PRIEUR]: '르 프리외르 로켓 장착 정예편대 접근',
  [ELITE_KINDS.SCHLACHTSTAFFEL]: '장갑판 보강 슐라흐트슈타펠 접근',
  [ELITE_KINDS.JUNKERS]: '융커스 J.I 기갑비행대 접근',
  [ELITE_KINDS.SALAMANDER]: '솝위스 새러맨더 기갑비행대 접근'
});
