export const ELITE_ENEMY_TYPE = 'elite';

export const ELITE_KINDS = Object.freeze({
  LE_PRIEUR: 'le_prieur_squadron',
  SCHLACHTSTAFFEL: 'schlachtstaffel'
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
  if (stage < 7) return 2;
  if (stage < 10) return 3;
  return 4;
}
