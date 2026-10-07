export const NET_HZ=15;
export const MAX_TETHER=1100;
export function seededRandom(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
export function cleanInput(value={}){const out={};if(Number.isFinite(value.angle))out.angle=Math.atan2(Math.sin(value.angle),Math.cos(value.angle));if(Number.isFinite(value.steer))out.steer=Math.max(-1,Math.min(1,value.steer));return out;}
const OMIT=new Set(['world','encounter','emit','hooks','rng','formationLeader','directorSquad','target','leader','chargeHits','damageSource','collisionGrid','enemyCollisionGrid']);
const FORBIDDEN=new Set(['__proto__','prototype','constructor']);

// Bounded render/state data only. Maps/Sets matter for boss parts and pilot FX.
// Engine callbacks, object graph links and collision caches never cross the wire.
export function pack(value,seen=new Set(),depth=0){
 if(value==null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number')return Number.isFinite(value)?Math.round(value*1000)/1000:{$number:String(value)};
 if(typeof value!=='object'||depth>12||seen.has(value))return undefined;
 seen.add(value);let result;
 if(value instanceof Map)result={$map:[...value].map(([k,v])=>[k,pack(v,seen,depth+1)])};
 else if(value instanceof Set)result={$set:[...value].filter(v=>typeof v!=='object').map(v=>pack(v,seen,depth+1))};
 else if(Array.isArray(value))result=value.map(v=>pack(v,seen,depth+1)??null);
 else {result={};for(const key of Object.keys(value)){if(OMIT.has(key)||FORBIDDEN.has(key)||key.startsWith('_net'))continue;const v=(key==='hp'||key==='maxHp')&&Number.isFinite(value[key])?value[key]:pack(value[key],seen,depth+1);if(v!==undefined)result[key]=v;}if('destroyed'in value)result.destroyed=!!value.destroyed;}
 seen.delete(value);return result;
}
export function unpack(value){
 if(!value||typeof value!=='object')return value;
 if('$number'in value)return {Infinity:Infinity,'-Infinity':-Infinity,NaN:NaN}[value.$number];
 if('$map'in value)return new Map(value.$map.map(([k,v])=>[k,unpack(v)]));
 if('$set'in value)return new Set(value.$set.map(unpack));
 if(Array.isArray(value))return value.map(unpack);
 const out={};for(const [k,v] of Object.entries(value))if(!FORBIDDEN.has(k))out[k]=unpack(v);return out;
}
export class FieldDelta {
 constructor(){this.previous=new Map();}
 reset(){this.previous.clear();}
 take(id,object){
  const prior=this.previous.get(id)||new Map(),next=new Map(),set={},remove=[];
  for(const [key,value] of Object.entries(object)){const signature=JSON.stringify(value);next.set(key,signature);if(prior.get(key)!==signature)set[key]=value;}
  for(const key of prior.keys())if(!next.has(key))remove.push(key);
  this.previous.set(id,next);return Object.keys(set).length||remove.length?{set,remove}:null;
 }
 retain(ids){for(const id of this.previous.keys())if(!ids.has(id))this.previous.delete(id);}
}
export function applyFields(target,delta){if(!delta)return;for(const key of delta.remove||[])if(!FORBIDDEN.has(key))delete target[key];for(const [key,value] of Object.entries(delta.set||{}))if(!FORBIDDEN.has(key))target[key]=unpack(value);}
export function pose(entity){return [entity.x||0,entity.y||0,entity.a||0,entity.vx??Math.cos(entity.a||0)*(entity.speed||entity.baseSpeed||0),entity.vy??Math.sin(entity.a||0)*(entity.speed||entity.baseSpeed||0)].map(n=>Math.round(n*100)/100);}
export function mixAngle(a,b,t){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;}
