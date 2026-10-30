// Host-only bridge. Snapshots remain native plain JSON; renderers use the same scale.
// A positions/radii (including state.x/y) are authoring units, scaled .5 to world.
// Factory positions/radii are already world units. HP/damage are NEVER scaled.
import * as asymmetric from './pandemonium-a-mechanics.js';
import * as factory from './pandemonium-factory-mechanics.js';
const profiles={asymmetric:{api:asymmetric,scale:.5,maxCoreHp:300},factory:{api:factory,scale:1,maxCoreHp:2000}};
function profile(type){const p=profiles[type==='a'?'asymmetric':type];if(!p)throw new RangeError('Unsupported arena variant: '+type);return p;}
export function variantWorldScale(type){return profile(type).scale;}
export function createVariant(type,{token,entityId,x=0,y=0,a=0}={}){
 if(!token||!entityId)throw new TypeError('Explicit encounter token and entityId required');
 const {api,scale,maxCoreHp}=profile(type),s=api.createBoss({token,entityId,x:x/scale,y:y/scale,a});
 s.x=x/scale;s.y=y/scale;s.a=a;s.maxCoreHp=maxCoreHp;
 if(s.variant==='factory'){s.audioEvents=[];s.audioSerial=0;}
 return s;
}
export function listVariantParts(type,s){const {api,scale}=profile(type);return api.listParts(s).map(p=>({...p,x:p.x*scale,y:p.y*scale,r:p.r*scale,maxHp:p.maxHp}));}
// Defensive core-stop also covers a host snapshot whose core was set to zero.
function stopDefeated(s){
 if(s.coreHp>0)return;
 s.coreHp=0;s.defeat??={token:s.token+':'+s.entityId,elapsed:0};
 s.hazards=[];s.damageEvents=[];if(s.pending)s.pending=[];
 if('v' in s)s.v=0;if('velocity' in s)s.velocity=0;if('angularVelocity' in s)s.angularVelocity=0;
 if('pressure' in s)s.pressure=0;
 for(const p of s.parts){p.warning=0;p.recoil=0;if('recoilV' in p)p.recoilV=0;if('task' in p)p.task=null;if('active' in p)p.active=false;}
}
// Factory cues only reflect native outcomes, never warnings or synthetic weapons.
// Serial/cue history is JSON snapshot state; the existing audio consumer owns playback.
function factoryCue(s,kind,source){
 const at=factory.listParts(s).find(p=>p.id===source)||s;
 s.audioSerial=Math.max(s.audioSerial||0,...(s.audioEvents||[]).map(e=>e.serial||0))+1;
 s.audioEvents=[...(s.audioEvents||[]),{serial:s.audioSerial,kind,source,x:at.x,y:at.y}].slice(-64);
}
// Returns actual HP removed, normalizing the two native APIs' boolean/number result.
// A core remains directly hittable; factory core is only exposed by its native rules.
export function damageVariantPart(type,s,id,nativeAmount){
 const {api}=profile(type);
 if(s.paused||s.coreHp<=0||!Number.isFinite(nativeAmount)||nativeAmount<=0)return 0;
 const before=id==='core'?s.coreHp:s.parts.find(p=>p.id===id)?.hp;
 if(before==null)return 0;
 api.damagePart(s,id,nativeAmount);stopDefeated(s);
 const after=id==='core'?s.coreHp:s.parts.find(p=>p.id===id).hp;
 if(s.variant==='factory'&&before>0&&after===0)factoryCue(s,'destroy',id);
 return Math.max(0,before-after);
}
// Host may advance a defeated boss separately during its phase-transition sequence.
export function advanceVariantDefeat(type,s,dt,{paused=false}={}){
 const {api}=profile(type);
 if(paused||s.paused||s.coreHp>0||!Number.isFinite(dt)||dt<=0)return s.defeat;
 stopDefeated(s);const elapsed=s.defeat.elapsed||0;
 // Native update retires existing visual FX; normalized timeline is wall-time based.
 api.updateBoss(s,Math.min(dt,2),{players:[],paused:false});
 s.defeat.elapsed=Math.min(7,Math.max(0,elapsed)+dt);stopDefeated(s);return s.defeat;
}
const live=p=>p&&p.alive!==false&&(p.hp==null||p.hp>0)&&!['downed','dead','defeated'].includes(p.status)&&(p.id??p.playerId)!=null&&Number.isFinite(p.x)&&Number.isFinite(p.y);
// The caller supplies actual world players, NOT camera/screen positions.
// Already-launched native aircraft remain collision hazards (not independent enemies).
// Ordinary source destruction keeps launched hazards; core defeat removes all of them.
// Returned events are drained exactly once; callers must not consume native queues too.
export function updateVariant(type,s,dt,actualWorldPlayers=[],{paused=false}={}){
 const {api,scale}=profile(type);
 if(paused||s.paused||!Number.isFinite(dt)||dt<=0)return [];
 if(s.coreHp<=0){advanceVariantDefeat(type,s,dt);return [];}
 const players=actualWorldPlayers.filter(live).map(p=>({...p,id:p.id??p.playerId,x:p.x/scale,y:p.y/scale,...(Number.isFinite(p.r??p.radius)?{r:(p.r??p.radius)/scale,radius:(p.radius??p.r)/scale}:{})}));
 if(s.variant==='asymmetric'){const phase=s.time*Math.PI/24;s.drive=Math.cos(phase)*.45;s.turn=Math.sin(phase)*.16;}
 const existingHazards=[...s.hazards];
 const firedUnits=new Set(existingHazards.filter(h=>h.kind==='unit'&&h.fired).map(h=>h.id));
 api.updateBoss(s,dt,{players,paused:false});
 if(s.coreHp<=0){stopDefeated(s);return [];}
 const hazards=[...existingHazards,...s.hazards];
 if(s.variant==='factory')for(const h of hazards){
  if(h.kind!=='unit'||!h.fired||firedUnits.has(h.id))continue;
  firedUnits.add(h.id);factoryCue(s,'aircraft',h.sourcePartId);
 }
 const events=s.damageEvents.map(e=>{
  const sourcePartId=s.parts.find(p=>e.source===p.id||e.source===s.entityId+':'+p.id)?.id;
  const match=hazards.find(h=>h.sourcePartId===sourcePartId&&h.damage===e.damage);
  const role=s.parts.find(p=>p.id===sourcePartId)?.role;
  const kind=e.kind??match?.kind??(role==='battery'||role==='crane'?'shell':role==='production'?'unit':role==='deck'?(e.damage===9?'aircraft':'bullet'):role==='turret'?'projectile':'bullet');
  return {...e,kind,x:e.x*scale,y:e.y*scale};
 });s.damageEvents=[];
 return events;
}
