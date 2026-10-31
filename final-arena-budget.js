// Hittable fortress parts are collision proxies, not independently updated aircraft.
// Keep unrelated surface entities and stale/foreign markers in the existing budget.
export function isFinalArenaTargetProxy(g,e){
 return g.stageBoss?.stages?.phase==='final-arena'&&!!g.finalArena?.formToken&&
  (Array.isArray(g.finalArena.bosses)?g.finalArena.bosses.some(b=>b.active&&!b.defeated&&b.id===e.finalArenaBossId&&b.formToken===e.finalArenaFormToken):e.finalArenaFormToken===g.finalArena.formToken)&&!!e.finalArenaTarget&&
  e.type==='final-fortress'&&e.stationary===true&&e.surface===true;
}
