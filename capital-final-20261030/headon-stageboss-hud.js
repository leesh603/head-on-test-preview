import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=capital-final-20261030&rail=42&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&phase=1021&cityart=20261022&harbor=20261021';

export function bossHudModel(encounter) {
  if(!encounter||encounter.completed)return null;
  if(['livens-flame-projector','minenwerfer-battery'].includes(encounter.bossId)&&![...encounter.bodies.values()].some(b=>b.discovered))return null;
  if(encounter.bossId==='mark4-wedge'&&![...encounter.bodies.values()].some(b=>b.discovered))return null;
  const state=encounter.snapshot();
  return {...state,name:BOSS_CATALOG[encounter.bossId]?.name||encounter.bossId,fraction:Math.max(0,Math.min(1,state.hp/state.maxHp))};
}
// Reuses the main build's existing durability/XP nodes, whether it has one
// shared XP bar or individual XP bars. No new player HUD or level-up logic.


