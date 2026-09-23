export const ENERGY_COMBAT_BALANCE=Object.freeze({minimumSpeedFactor:.65,lossRate:1.8,handlingInfluence:.35,minimumTurnEffort:.2,turnCommitTime:.08});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TWO_SEAT_ARCHETYPES=new Set(['DEFENSIVE_TWO_SEATER','OFFENSIVE_TWO_SEATER']);

function eligible(game,e){
 return !!(e?.personality&&e.airframeHandling&&game.patrolCanEngage(e)&&['scout','hunter'].includes(e.type)&&!e.bossPilot&&!e.formationLeader&&!e.missionTarget&&!TWO_SEAT_ARCHETYPES.has(e.personality.archetype));
}

export function installEnergyCombat(Game){
 if(Game.prototype.__energyCombat167)return;Game.prototype.__energyCombat167=true;
 const steer=Game.prototype.dogfightSteering;
 Game.prototype.dogfightSteering=function(e,contact,dt,baseTurn){
  const result=steer.call(this,e,contact,dt,baseTurn);if(!eligible(this,e)||baseTurn<=0)return result;
  const step=Math.max(0,dt||0),profile=e.airframeHandling,p=e.personality,current=e.energySpeed??1;
  const capacity=Math.max(.0001,baseTurn*step),actual=Math.min(Math.abs(result.delta||0),Math.max(0,result.turn||0)*step),effort=clamp(actual/capacity,0,1);
  e.energyTurnTime=effort>ENERGY_COMBAT_BALANCE.minimumTurnEffort?(e.energyTurnTime||0)+step:Math.max(0,(e.energyTurnTime||0)-step*2);
  const committedEffort=e.energyTurnTime>=ENERGY_COMBAT_BALANCE.turnCommitTime?effort:0;
  const target=clamp(1-(profile.drag??.18)*committedEffort*committedEffort,ENERGY_COMBAT_BALANCE.minimumSpeedFactor,1);
  const recovery=(profile.recovery??1)*(p.acceleration??1),rate=target<current?ENERGY_COMBAT_BALANCE.lossRate:recovery;
  e.energySpeed=current+(target-current)*(1-Math.exp(-rate*step));
  const handling=(p.lowSpeedHandling??1)+(p.highSpeedHandling-p.lowSpeedHandling)*(e.energySpeed??1);
  e.energyTurnFactor=clamp(1+(handling-1)*ENERGY_COMBAT_BALANCE.handlingInfluence,.86,1.12);
  return{...result,turn:result.turn*e.energyTurnFactor};
 };
}
