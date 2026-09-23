// Semantic asset keys, not generated replacement graphics. Map to the current
// main build's pixel atlas. Bodies stay top-down; part offsets are world-aligned.
export const BOSS_ASSET_KEYS=Object.freeze([
  'paris-gun','lincomparable','sms-stuttgart','hms-zubian','hms-zubian-front','hms-zubian-rear',
  'zeppelin-l70','hma23','a7v-flak','mark-v-cruiser','livens-flame-projector','minenwerfer-battery','london-apron','drachen-net','gik','ca4','armored-harbor-fortress'
]);
export function renderStageBossLayer(addon,{drawBody,drawPart,drawHazard}) {
  for(const fn of [drawBody,drawPart,drawHazard])if(typeof fn!=='function')throw new Error('Current pixel renderer adapters required');
  for(const b of addon.stages.encounter?.bodies.values()||[]) {
    const ownDefeat=addon.bodyDefeats?.find(d=>d.id===b.id),globalDefeat=b.dead&&addon.defeatSequence?.encounterId===addon.stages.encounter.id&&!b.kind.startsWith('hms-zubian-');
    const destroying=!!ownDefeat||globalDefeat,destruction=ownDefeat||addon.defeatSequence;
    if(b.dead&&!destroying)continue;
    if(b.hidden&&!destroying)continue;
    const railCars=b.rail129?[...b.parts.values()].filter(p=>p.kind==='rail-car').map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,destroyed:p.destroyed,hittable:p.hittable})):null;
    const layeredParts=['livens-flame-projector','minenwerfer-battery','armored-harbor-fortress'].includes(b.kind)?[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,maxHp:p.maxHp,destroyed:p.destroyed,hittable:p.hittable,angle:p.angle||0})):null;
    drawBody({assetKey:b.kind,phase:b.phase,x:b.x,y:b.y,coreVulnerable:b.coreVulnerable,hp:b.hp,maxHp:b.maxHp,motionTime:b.motionTime||0,recoil:b.recoil||0,splitAge:b.splitAge||0,stateAge:b.stateAge||0,splitGap:b.splitGap||0,craneAngle:b.craneAngle||0,nozzleAngle:b.nozzleAngle,engaged:!!b.engaged,lockedFlameAngle:b.lockedFlameAngle,parts:layeredParts,railCars,railBroken:!!b.rail129?.broken,railDirection:b.rail129?.direction||1,
      destroying,destructionAge:destruction?.age||0,destructionDuration:destruction?.duration||0});
    if(b.dead)continue;
    for(const part of b.parts.values())drawPart({bodyKey:b.kind,phase:b.phase,partId:part.id,kind:part.kind,x:b.x+part.x,y:b.y+part.y,
      hp:part.hp,maxHp:part.maxHp,destroyed:part.destroyed,hittable:part.hittable,radius:part.radius,angle:part.angle||0});
  }
  addon.hazards.pool.visit(h=>{if(h.phase!=='waiting')drawHazard(h);});
}
// Optional solid-water correction for a host collision resolver. Returns a
// displacement; this module never takes over player movement or input.
export function waterBarrierDisplacement(player,barrier) {
  const rx=barrier.width/2+(player.radius||0),ry=barrier.height/2+(player.radius||0);
  const dx=player.x-barrier.x,dy=player.y-barrier.y;
  if(Math.abs(dx)>rx||Math.abs(dy)>ry)return{x:0,y:0};
  return rx-Math.abs(dx)<ry-Math.abs(dy)?{x:(dx<0?-1:1)*(rx-Math.abs(dx)+.1),y:0}:{x:0,y:(dy<0?-1:1)*(ry-Math.abs(dy)+.1)};
}
