import {MAP_COMBAT_TYPES as T,mapCombatProfileForStage} from './map-combat-roles.js';
export const FRONT_LENGTH=10;
// Saves from the opt-in twelve-map front have no length field. Finish that
// already-started route; continueFront creates the new ten-map format.
export const frontLength=front=>front&&front.length!==FRONT_LENGTH?12:FRONT_LENGTH;
export const FRONT_MULTIPLIERS=Object.freeze([.9,1,1.2,1.4]);
// Two early, three middle and one late map. Cambrai remains available for
// the rail operation; Laon, Paris and the enemy capital close every front.
const EARLY=[[2],[1],[4]], MID=[[9],[3],[10],[7],[5],[6]], LATE=[[12],[13],[14],[16],[17]];
const LEGACY_MID=[[9],[8],[3],[10],[7],[5],[6]],LEGACY_LATE=[[12],[13],[14],[16],[19,15],[17]];
const BUILD_TYPES={GUN:[T.DECISIVE],EXPLOSIVE:[T.SABOTAGE,T.DECISIVE],FORMATION:[T.ESCORT_INTERCEPT],SPEED:[T.BREAKTHROUGH,T.INTERDICT_SUPPLY],SURVIVAL:[T.DEFENSE]};
const unit=n=>Number.isFinite(n)?Math.min(1,Math.max(0,n)):null;
export function frontPerformance({mission,targets,speed}={}){
 const values=[[unit(mission),.45],[unit(targets),.30],[unit(speed),.25]].filter(([v])=>v!==null);
 return values.length?values.reduce((sum,[v,w])=>sum+v*w,0)/values.reduce((sum,[,w])=>sum+w,0):null;
}
function random(front){
 let n=front.seed>>>0;n^=n<<13;n^=n>>>17;n^=n<<5;front.seed=n>>>0;return front.seed/4294967296;
}
export function createFront(faction,seed,previous=[],risk=2,recent=[]){
 return {seed:(seed>>>0)||1,length:FRONT_LENGTH,capital:faction==='entente'?18:11,previous:[...previous],risk:Math.max(1,Math.min(4,Math.round(Number(risk)||2))),recent:recent.filter(Number.isFinite).slice(-2),report:null,operationStage:null};
}
export function nextFrontMap(front,order,{mission,boss,build,outcome}={}){
 const position=order.length,length=frontLength(front),legacy=length===12;
 if(position===length-1)return [front.capital];
 if(position>=length)return [];
 if(!legacy&&position===7)return [19];
 if(!legacy&&position===8)return [15];
 const end=legacy?(position<=3?4:position<=7?8:11):(position<=2?3:position<=5?6:7);
 const pool=legacy?(end===4?EARLY:end===8?LEGACY_MID:LEGACY_LATE):(end===3?EARLY:end===6?MID:LATE);
 const faction=front.capital===18?'entente':'central';
 const typeFor=map=>mapCombatProfileForStage(map,faction)?.type;
 const candidates=pool.filter(group=>group.length<=end-position&&group.every(map=>!order.includes(map)&&map!==front.operationStage));
 const weighted=candidates.map(group=>{
  const type=typeFor(group[0]), recovery=type===T.DEFENSE||type===T.BREAKTHROUGH, offensive=type===T.SABOTAGE||type===T.DECISIVE;
  const components=[
   [unit(mission),.35,v=>recovery?1-v:offensive?v:.5],
   [unit(boss),.20,v=>type===T.DECISIVE?v:type===T.DEFENSE?1-v:.5],
   [build&&Object.keys(build).length?1:null,.20,()=>{const entries=Object.entries(build).filter(([key,value])=>BUILD_TYPES[key]&&Number.isFinite(value)&&value>0);const total=entries.reduce((a,[,v])=>a+v,0);return total?entries.reduce((a,[key,v])=>a+(BUILD_TYPES[key].includes(type)?v:0),0)/total:.5;}],
   [unit(outcome),.15,v=>recovery?1-v:offensive?v:.5],
   [random(front),.10,v=>v]
  ].filter(([v])=>v!=null);
  const affinity=components.reduce((a,[v,w,f])=>a+w*f(v),0)/components.reduce((a,[,w])=>a+w,0);
  const repeat=order.slice(-2).filter(map=>typeFor(map)===type).length;
  return [.5+affinity,Math.pow(.58,repeat),group.every(map=>!front.previous?.includes(map))?1.45:1].reduce((a,v)=>a*v,1);
 });
 let roll=random(front)*weighted.reduce((a,v)=>a+v,0);
 for(let i=0;i<candidates.length;i++)if((roll-=weighted[i])<0)return candidates[i];
 return candidates.at(-1)||[];
}
export function recordFrontPerformance(front,metrics,loop=0){
 front.risk=Math.max(1,Math.min(4,Math.round(Number(front.risk)||2)));
 const score=frontPerformance(metrics);
 if(score===null)return front.risk;
 front.recent=[...(front.recent||[]).filter(Number.isFinite).slice(-1),score];
 const average=front.recent.reduce((a,v)=>a+v,0)/front.recent.length;
 const baseline=Math.min(4,2+Math.floor(loop/2));
 const wanted=average>=.83?4:average>=.69?3:average<.42?1:baseline;
 front.risk+=Math.sign(wanted-front.risk);
 return front.risk;
}
