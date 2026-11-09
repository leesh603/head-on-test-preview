import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=bomb19&rail=42&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&phase=1021&cityart=20261022&harbor=20261021&zb=20261103';

export function bossHudModel(encounter) {
  if(!encounter||encounter.completed)return null;
  if(['livens-flame-projector','minenwerfer-battery'].includes(encounter.bossId)&&![...encounter.bodies.values()].some(b=>b.discovered))return null;
  if(encounter.bossId==='mark4-wedge'&&![...encounter.bodies.values()].some(b=>b.discovered))return null;
  const state=encounter.snapshot();
  if(encounter.bossId==='jutland-grand-fleet'){
    const flagship=encounter.bodies.values().next().value,faction=flagship?.faction;
    return {...state,name:faction==='entente'?'대함대 기함':'대양함대 기함',nameEn:faction==='entente'?'Grand Fleet Flagship':'High Seas Fleet Flagship',fraction:Math.max(0,Math.min(1,state.hp/state.maxHp))};
  }
  return {...state,name:BOSS_CATALOG[encounter.bossId]?.name||encounter.bossId,fraction:Math.max(0,Math.min(1,state.hp/state.maxHp))};
}
export function bossHudDetail(model,locale='ko'){
 const en=locale==='en',hp=Math.ceil(model.hp)+' / '+Math.round(model.maxHp);
 return (model.formationTotal?(en?'Formation ':'편대 생존 ')+model.formationAlive+'/'+model.formationTotal:(en?'Parts ':'부위 ')+model.aliveParts+'/'+model.totalParts)+' · '+hp;
}
// Reuses the main build's existing durability/XP nodes, whether it has one
// shared XP bar or individual XP bars. No new player HUD or level-up logic.


