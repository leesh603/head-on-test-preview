// Semantic asset keys, not generated replacement graphics. Map to the current
// main build's pixel atlas. Bodies stay top-down; part offsets are world-aligned.
import {netContact} from './london-apron369.js?v=imm3';
export const BOSS_ASSET_KEYS=Object.freeze([
  'paris-gun','lincomparable','sms-stuttgart','hms-zubian','hms-zubian-front','hms-zubian-rear',
  'zeppelin-l70','hma23','a7v-flak','mark-v-cruiser','livens-flame-projector','minenwerfer-battery','london-apron','drachen-net','gik','ca4','armored-harbor-fortress','fliegerzug','treffas-wagen','mark4-wedge','morser-battery','staaken-rvi','london-searchlight'
]);
export function renderStageBossLayer(addon,{drawBody,drawPart,drawHazard}) {
  for(const fn of [drawBody,drawPart,drawHazard])if(typeof fn!=='function')throw new Error('Current pixel renderer adapters required');
  for(const b of addon.stages.encounter?.bodies.values()||[]) {
    const cityWreck=b.dead&&b.kind==='flak-tower-cell',ownDefeat=addon.bodyDefeats?.find(d=>d.id===b.id),globalDefeat=b.dead&&addon.defeatSequence?.encounterId===addon.stages.encounter.id&&!b.kind.startsWith('hms-zubian-')&&b.kind!=='gotha-raider';
    const destroying=(b.jutlandBoss&&b.dead)||(b.sommeBoss&&b.dead)||cityWreck||!!ownDefeat||globalDefeat,destruction=ownDefeat||addon.defeatSequence;
    if(b.dead&&!destroying)continue;
    if(b.hidden&&!destroying)continue;
    const railCars=b.rail129?[...b.parts.values()].filter(p=>p.kind==='rail-car').map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,destroyed:p.destroyed,hittable:p.hittable,destroyedAt:p.destroyedAt,detachedPose:p.detachedPose,angle:p.angle||0,gunFlash:p.gunFlash||0,shotAngle:p.shotAngle||0,launchWarmup:p.launchWarmup||0,reloadVisual:p.reloadVisual||0,launchTarget:p.launchTarget||null})):null;
    const layeredParts=['a7v-flak','mark-v-cruiser','livens-flame-projector','minenwerfer-battery','armored-harbor-fortress','treffas-wagen','mark4-wedge','morser-battery','staaken-rvi','london-searchlight','london-apron','drachen-net','fliegerzug','gotha-raider','london-apron-raid','hms-zubian','hms-zubian-front','hms-zubian-rear','gik','ca4','flak-tower-cell','paris-searchlight-fortress','paris-staaken-rvi'].includes(b.kind)?[...b.parts.values()].map(p=>({id:p.id,art:p.art,muzzleLength:p.muzzleLength,kind:p.kind,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,destroyed:p.destroyed,hittable:p.hittable,angle:p.angle??0,aimAngle:p.aimAngle,cell:p.cell,artAngle:p.artAngle,localX:p.localX??p.x,localY:p.localY??p.y,recoil:p.recoil||0,radius:p.radius,hitRadiusX:p.hitRadiusX,hitRadiusY:p.hitRadiusY,drawWidth:p.drawWidth,drawHeight:p.drawHeight,hitFlash:p.hitFlash||0,destroyedAt:p.destroyedAt})):null;
    drawBody({id:b.id,ruralRailBoss:!!b.ruralRailBoss,gunFlash:b.gunFlash||0,recovery:b.recovery||0,sommeBoss:!!b.sommeBoss,sommeScale:b.sommeScale,tankRole:b.tankRole,trackMarks:b.trackMarks,salvo:b.salvo,lock:b.lock,lane:b.lane,assetKey:b.kind,phase:b.phase,x:b.x,y:b.y,a:b.a,coreVulnerable:b.coreVulnerable,hp:b.hp,maxHp:b.maxHp,motionTime:b.motionTime||0,waterTime:b.waterTime||0,wakeTrail:b.wakeTrail||[],recoil:b.recoil||0,splitAge:b.splitAge||0,stateAge:b.stateAge||0,splitGap:b.splitGap||0,craneAngle:b.craneAngle||0,cannonFlash:b.cannonFlash||0,cannonShotAngle:b.cannonShotAngle,bank:b.bank||0,craneState:b.craneState,craneStart:b.craneStart,craneEnd:b.craneEnd,craneClock:b.craneClock,craneWarn:b.craneWarn,nozzleAngle:b.nozzleAngle,engaged:!!b.engaged,lockedFlameAngle:b.lockedFlameAngle,parts:layeredParts,railCars,geometryScale:b.t?.geometryScale||1,hullYaw:b.hullYaw||0,driveVelocity:b.driveVelocity||0,tacticalState:b.tacticalState,driveMoving:!!b.driveMoving,regionalScale:b.regionalScale||1,railBodyScale:b.railBodyScale||1,regionalCore:b.regionalCore||null,launchStock:b.launchStock,hangarHatch:b.hangarHatch||0,flakAngle:b.flakAngle,lampAngle:b.lampAngle,beamRemaining:b.beamRemaining||0,lockProgress:b.lockProgress||0,railBroken:!!b.rail129?.broken,railDirection:b.rail129?.direction||1,heading:b.heading||0,wheelRoll:b.wheelRoll||0,gunAngle:b.gunAngle,flakLock:b.flakLock,churn:b._churn||null,
      apronScale:b.apronScale,apronTime:b.apronTime,cityArtScale:b.cityArtScale,cityRigOffsets:b.cityRigOffsets,cityMineLane:b.cityMineLane,shellLock:b.shellLock,
      destroying,destructionAge:destruction?.age||0,destructionDuration:destruction?.duration||0});
    if(b.dead)continue;
    for(const part of b.parts.values())drawPart({sommeBoss:!!b.sommeBoss,bodyKey:b.kind,phase:b.phase,partId:part.id,kind:part.kind,x:b.x+part.x,y:b.y+part.y,
      hp:part.hp,maxHp:part.maxHp,destroyed:part.destroyed,hittable:part.hittable,radius:part.radius,hitRadiusX:part.hitRadiusX,hitRadiusY:part.hitRadiusY,angle:part.angle||0,recoil:part.recoil||0,hitFlash:part.hitFlash||0,destroyedAt:part.destroyedAt,motionTime:b.motionTime||0});
  }
  addon.hazards.pool.visit(h=>{if(h.phase!=='waiting')drawHazard(h);});
}
// Optional solid-water correction for a host collision resolver. Returns a
// displacement; this module never takes over player movement or input.
export function waterBarrierDisplacement(player,barrier) {
  if(barrier.kind==='net')return netContact(player,barrier.vertices)||{x:0,y:0};
  if(barrier.kind==='beam'){
    const ax=barrier.x,ay=barrier.y,bx=ax+Math.cos(barrier.angle)*barrier.length,by=ay+Math.sin(barrier.angle)*barrier.length;
    const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy,t=len2?Math.max(0,Math.min(1,((player.x-ax)*dx+(player.y-ay)*dy)/len2)):0;
    const qx=ax+dx*t,qy=ay+dy*t,px=player.x-qx,py=player.y-qy,dist=Math.hypot(px,py),limit=barrier.thickness/2+(player.radius||0);
    if(dist>=limit)return{x:0,y:0};
    const nx=dist>.001?px/dist:-dy/Math.max(1,Math.sqrt(len2)),ny=dist>.001?py/dist:dx/Math.max(1,Math.sqrt(len2)),push=limit-dist+.1;
    return{x:nx*push,y:ny*push};
  }
  const rx=barrier.width/2+(player.radius||0),ry=barrier.height/2+(player.radius||0);
  const dx=player.x-barrier.x,dy=player.y-barrier.y;
  if(Math.abs(dx)>rx||Math.abs(dy)>ry)return{x:0,y:0};
  return rx-Math.abs(dx)<ry-Math.abs(dy)?{x:(dx<0?-1:1)*(rx-Math.abs(dx)+.1),y:0}:{x:0,y:(dy<0?-1:1)*(ry-Math.abs(dy)+.1)};
}
