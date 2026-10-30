import {FACILITY_MAPS,FACILITY_ART} from './ground-facility-profiles.js';
import {recordCombatImpact} from './combat-impact-result.js';

export const FACILITY_BALANCE=Object.freeze({firstAt:14,duration:32,bossReserve:5,airfieldHp:84,signalHp:140,reduction:.25,minimumAirborne:3});
export const FACILITY_TYPES=Object.freeze({airfield:'AIRFIELD_RAID',signal:'SIGNAL_HQ_RAID'});
export const facilityMission=e=>e?.type===FACILITY_TYPES.airfield||e?.type===FACILITY_TYPES.signal;
const host=g=>!g.online||g.host;
const region=g=>g.worldRegion?.()??g.region;
export const facilityStageKey=g=>{const s=g.stageBoss?.stages,w=g.stageCombatWindow;return `${s?.loopIndex??w?.loopIndex??0}:${s?.orderPosition??w?.stageIndex??s?.stageIndex??region(g)}:${region(g)}`;};
const player=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g;
let artReady=()=>typeof Image==='undefined';
export function configureFacilityArtReady(fn){artReady=fn;}
export function ensureFacilityState(g){
 const key=facilityStageKey(g);
 if(g.groundFacilities?.stageKey!==key){
  if(facilityMission(g.battlefieldEvents?.current))g.battlefieldEvents.current=null;
  g.groundFacilities={stageKey:key,region:region(g),enteredAt:g.stageStartTime??g.t??0,offered:false,reserved:null,sites:[],effects:{airfield:false,signal:false},counters:{}};
 }
 return g.groundFacilities;
}
// Reserve one optional slot on half of eligible stage visits; existing missions
// retain the other visits and are never cancelled. Release failed art/placement
// reservations promptly instead of starving the normal event scheduler.
export function reserveFacilitySlot(g){
 if(!host(g)||g.mode==='campaign'||!g.stageBoss?.stages||!FACILITY_MAPS[region(g)])return false;
 const s=ensureFacilityState(g);s.reserved??=(g.rng?.()??.5)<.5;if(facilityMission(g.battlefieldEvents?.current))return true;
 if(!s.reserved||s.offered||(g.t||0)-s.enteredAt>FACILITY_BALANCE.firstAt+4)return false;
 const map=FACILITY_MAPS[region(g)],faction=facilityFaction(g);if(!faction)return false;
 for(const kind of ['airfield','signal']){const art=FACILITY_ART[`${map.key}-${kind}-${faction}`];if(art)artReady(art.file);}
 return (g.stageCombatWindow?.remaining??99)>=FACILITY_BALANCE.duration+FACILITY_BALANCE.bossReserve;
}
function ownFaction(g){return g.teamFaction||g.stageBoss?.stages?.teamFaction||g.faction||g.facilityPlaneFaction?.()||null;}
export function facilityFaction(g){const own=ownFaction(g);return own==='central'?'entente':own==='entente'?'central':null;}
function eligible(g){
 const s=g.groundFacilities,stage=g.stageBoss?.stages,now=g.t||0;
 if(!host(g)||g.state!=='playing'||g.mode==='campaign'||!FACILITY_MAPS[region(g)]||!s||s.offered||!facilityFaction(g))return false;
 if(now-s.enteredAt<FACILITY_BALANCE.firstAt||(g.stageCombatWindow?.remaining??99)<FACILITY_BALANCE.duration+FACILITY_BALANCE.bossReserve)return false;
 if(stage&&stage.phase!=='explore'||g.stageCombatWindow?.approaching||g.stageCombatWindow?.ready||g.battlefieldEvents?.current||(g.battleRecoveryUntil||0)>now)return false;
 if((g.ruralFronts?.fronts||[]).some(f=>f.status==='active')||g.eliteEnemies?.active)return false;
 if(['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||['active','pending','dispatching'].includes(g.photoReconDirector?.phase))return false;
 return !(g.enemies||[]).some(e=>e.hp>0&&!e.expired&&(e.bossPilot||e.type==='boss'||e.stageBossBody));
}
// Authored dry patches are transformed exactly like the ground. Insignia/art
// are never mirrored; only the slot position follows Cambrai's tile parity.
function slotClear(map,q,art){
 const scale=q.width/(art?.nominalWidth??art?.width??q.width),h=q.height??(art?.height||q.width)*scale;
 const hx=q.x+(art?.pivot?(art.width/2-art.pivot[0])*scale:0),hy=q.y+(art?.pivot?(art.height/2-art.pivot[1])*scale:0);
 const hw=art?.pivot?art.width*scale/2:q.width/2,hh=h/2;
 for(const [px,py,size,period]of map.exclusions||[])for(let ix=Math.floor(hx/period)-1;ix<=Math.floor(hx/period)+1;ix++)for(let iy=Math.floor(hy/period)-1;iy<=Math.floor(hy/period)+1;iy++){const mx=map.mirror&&Math.abs(ix%2),my=map.mirror&&Math.abs(iy%2),x=ix*period+(mx?period-px:px),y=iy*period+(my?period-py:py);if(Math.abs(hx-x)<hw+size*.65+8&&Math.abs(hy-y)<hh+size*.65+8)return false;}
 return true;
}
export function facilityPlacement(g,kind,art){
 const map=FACILITY_MAPS[region(g)],p=player(g);if(!map)return null;
 const period=map.period,ox=Math.floor(p.x/period),oy=Math.floor(p.y/period),choices=[];
 for(let iy=oy-1;iy<=oy+1;iy++)for(let ix=ox-1;ix<=ox+1;ix++)for(const group of map[kind]||[]){
  const slots=group.map(q=>({x:(ix+(map.mirror&&Math.abs(ix%2)?1-q.u:q.u))*period,y:(iy+(map.mirror&&Math.abs(iy%2)?1-q.v:q.v))*period,width:q.width,height:q.height}));
  const x=slots.reduce((a,q)=>a+q.x,0)/slots.length,y=slots.reduce((a,q)=>a+q.y,0)/slots.length,d=Math.hypot(x-p.x,y-p.y);
  // Never spawn directly beneath the player, nor beyond a light 32-second detour.
  if(d<140||d>650||slots.some(q=>Math.hypot(q.x-p.x,q.y-p.y)>760||!slotClear(map,q,art)))continue;
  const ahead=(x-p.x)*Math.cos(p.a||0)+(y-p.y)*Math.sin(p.a||0);
  choices.push({slots,x,y,score:d+(ahead<0?160:0),key:`${ix}:${iy}:${map[kind].indexOf(group)}`});
 }
 return choices.sort((a,b)=>a.score-b.score)[0]||null;
}
export function startFacilityMission(g,requested){
 const state=ensureFacilityState(g);if(!eligible(g))return null;
 const map=FACILITY_MAPS[region(g)],faction=facilityFaction(g);
 const both=(map.signal||[]).length>0;state.preferSignal??=(g.rng?.()??.5)<.5;const order=requested?[requested]:both&&state.preferSignal?['signal','airfield']:['airfield','signal'];
 for(const kind of order){
  if(!FACILITY_TYPES[kind]||state.effects[kind])continue;
  const art=FACILITY_ART[`${map.key}-${kind}-${faction}`];if(!art||!artReady(art.file))continue;
  const place=facilityPlacement(g,kind,art);if(!place)continue;
  const events=g.battlefieldEvents??={serial:0,current:null,history:[],pending:{}},id=`facility-${++events.serial}-${state.stageKey}`;
  const targets=place.slots.map((q,i)=>{const scale=q.width/(art.nominalWidth??art.width),w=art.width*scale,h=q.height??art.height*scale;return{id:`${id}-${i}`,groundFacility:true,facilityKind:kind,facilityArt:`${map.key}-${kind}-${faction}`,faction,region:region(g),x:q.x+(art.pivot?(art.width/2-art.pivot[0])*scale:0),y:q.y+(art.pivot?(art.height/2-art.pivot[1])*scale:0),a:0,width:w,height:h,hitWidth:art.hit[2]*scale,hitHeight:art.hit[3]*h/art.height,hitOffsetX:(art.hit[0]+art.hit[2]/2-art.width/2)*scale,hitOffsetY:(art.hit[1]+art.hit[3]/2-art.height/2)*h/art.height,hp:kind==='airfield'?FACILITY_BALANCE.airfieldHp:FACILITY_BALANCE.signalHp,maxHp:kind==='airfield'?FACILITY_BALANCE.airfieldHp:FACILITY_BALANCE.signalHp,stationary:true,surface:true,missionTarget:true,battlefieldEventId:id,hitFlash:0};});
  const event={id,type:FACILITY_TYPES[kind],facilityKind:kind,status:'active',region:region(g),regionKey:state.stageKey,startedAt:g.t,deadline:g.t+FACILITY_BALANCE.duration,targets};
  state.sites.push({id,kind,placementKey:place.key,targets});state.offered=true;events.current=event;events.nextOfferAt=Math.max(events.nextOfferAt||0,event.deadline+8);
  g.event?.('wave',kind==='airfield'?'기회 목표 · 적 비행장 격파 (32초)':'기회 목표 · 적 통신본부 격파 (32초)');return event;
 }
 return null;
}
function finish(g,event,outcome,reason){
 if(event.status!=='active')return false;event.status=outcome;
 const state=ensureFacilityState(g),events=g.battlefieldEvents;
 for(const e of event.targets)e.missionTarget=false;
 if(outcome==='completed'){
  state.effects[event.facilityKind]=true;
  g.event?.('wave',event.facilityKind==='airfield'?'비행장 격파 · 현재 지역 일반 편대 출격 감소':'통신망 파괴 · 현재 지역 폭격·특수기 출격 감소');
 }
 events.result={id:event.id,type:event.type,outcome,reason};events.history??=[];events.history.push({type:event.type,outcome,time:g.t});events.history=events.history.slice(-8);events.lastType=event.type;events.current=null;
 return true;
}
export function tickFacilityMission(g){
 if(!host(g)||g.state!=='playing')return;
 const state=ensureFacilityState(g),event=g.battlefieldEvents?.current;
 for(const site of state.sites)for(const e of site.targets)e.hitFlash=Math.max(0,(e.hitFlash||0)-.04);
 if(!facilityMission(event)){if(!event)startFacilityMission(g);return;}
 if(event.region!==region(g)||event.regionKey!==state.stageKey)return finish(g,event,'missed','facilityCancelled');
 if(g.stageBoss?.stages?.phase==='boss'||g.stageCombatWindow?.ready||['warning','entering','active'].includes(g.intrusionBoss?.phase))return finish(g,event,'missed','facilityCancelled');
 if(event.targets.length&&event.targets.every(e=>e.hp<=0))return finish(g,event,'completed','facilitiesDestroyed');
 if((g.t||0)>=event.deadline)return finish(g,event,'missed','facilityExpired');
}
export function facilityTargets(g){
 if(!host(g)||g.state!=='playing')return[];
 const event=g.battlefieldEvents?.current;
 return facilityMission(event)&&event.status==='active'&&event.region===region(g)&&event.regionKey===facilityStageKey(g)?event.targets.filter(e=>e.hp>0):[];
}
export function facilityCollision(e,x,y,b={}){
 const cx=e.x+e.hitOffsetX,cy=e.y+e.hitOffsetY,pad=b.collisionRadius||0,hw=e.hitWidth/2+pad,hh=e.hitHeight/2+pad;
 if(b.actualExplosion){const dx=Math.max(0,Math.abs(x-cx)-hw),dy=Math.max(0,Math.abs(y-cy)-hh);return dx*dx+dy*dy<=(b.explosionRadius||0)**2;}
 // Segment/AABB test: high-speed rounds cannot tunnel through small roofs.
 const px=b.previousX??x,py=b.previousY??y,dx=x-px,dy=y-py;let lo=0,hi=1;
 for(const [p,d,min,max]of [[px,dx,cx-hw,cx+hw],[py,dy,cy-hh,cy+hh]]){if(Math.abs(d)<1e-9){if(p<min||p>max)return false;}else{const a=(min-p)/d,c=(max-p)/d;lo=Math.max(lo,Math.min(a,c));hi=Math.min(hi,Math.max(a,c));if(lo>hi)return false;}}
 return true;
}
export function damageFacility(g,e,b,damage){
 if(!facilityTargets(g).includes(e)||b.enemy||b.patrol||!(damage>0)||!Number.isFinite(damage))return recordCombatImpact(b,e,{damage:0,blocked:true});
 const dealt=Math.min(e.hp,damage);e.hp=Math.max(0,e.hp-dealt);e.hitFlash=.18;
 if(e.hp<=0&&!e.destroyed){e.destroyed=true;e.destroyedAt=g.t;g.combatBlast?.(e.x+e.hitOffsetX,e.y+e.hitOffsetY,Math.max(24,e.hitWidth*.45),'friendly','structure','armorBreak');g.smoke?.(e.x,e.y,true);g.shake=Math.max(g.shake||0,2);}
 return recordCombatImpact(b,e,{damage:dealt,blocked:false,partKind:'facility'});
}
function suppressionState(g){const s=g.groundFacilities;return s?.stageKey===facilityStageKey(g)&&host(g)&&g.stageBoss?.stages?.phase!=='boss'?s:null;}
function nextSuppressionCount(g,s,key){if(s.counters[key]===undefined)s.counters[key]=Math.floor((g.rng?.()??Math.random())*4);return ++s.counters[key];}
const category=type=>['scout','hunter'].includes(type)?'airfield':['bomber','heavyBomber','zeppelin'].includes(type)?'signal':null;
export function facilityPlan(g,plan){
 const s=suppressionState(g);if(!s||g.battlefieldEventSpawning||g.bossMechanicSpawn)return plan;
 let remaining=plan.length;
 const kept=plan.filter(e=>{const k=category(e.type);if(!k||!s.effects[k]||remaining<=2)return true;const n=nextSuppressionCount(g,s,`plan-${k}`);if(n%Math.round(1/FACILITY_BALANCE.reduction)){return true;}remaining--;return false;});
 if(kept.length===plan.length)return plan;
 // Repack formation slots instead of leaving missing leader/index references.
 const groups=new Map();for(const e of kept){const k=e.layout+'|'+e.type;const group=groups.get(k)||[];group.push(e);groups.set(k,group);}
 return kept.map(e=>{const group=groups.get(e.layout+'|'+e.type);return{...e,index:group.indexOf(e),count:group.length};});
}
export function allowFacilityAmbient(g,type){
 const s=suppressionState(g),k=category(type);if(!s||!k||!s.effects[k]||g.battlefieldEventSpawning||g.bossMechanicSpawn)return true;
 const live=(g.enemies||[]).filter(e=>e.hp>0&&!e.surface&&!e.stationary&&!e.expired&&!e.bossPilot).length;if(live<FACILITY_BALANCE.minimumAirborne)return true;
 const key=`ambient-${k}`,n=nextSuppressionCount(g,s,key);return n%Math.round(1/FACILITY_BALANCE.reduction)!==0;
}
export function installGroundFacilities(Game,planes){
 const p=Game.prototype;if(Object.hasOwn(p,'__groundFacilities'))return;p.__groundFacilities=true;
 if(planes)p.facilityPlaneFaction=function(){return planes[this.plane]?.faction;};
 const candidates=p.projectileCandidates;p.projectileCandidates=function(b){const base=candidates.call(this,b),extra=facilityTargets(this);return extra.length&&!b?.enemy&&!b?.patrol?[...base,...extra]:base;};
 const collision=p.targetCollision;p.targetCollision=function(e,x,y,b){return e.groundFacility?e.hp>0&&facilityCollision(e,x,y,b):collision.call(this,e,x,y,b);};
 const offer=p.offerBattlefieldEvent;if(offer)p.offerBattlefieldEvent=function(...args){return args[0]==null&&reserveFacilitySlot(this)?null:offer.apply(this,args);};
 const canOffer=p.canOfferBattlefieldEvent;if(canOffer)p.canOfferBattlefieldEvent=function(...args){return !reserveFacilitySlot(this)&&canOffer.apply(this,args);};
 const tick=p.tickBattlefieldEvents;p.tickBattlefieldEvents=function(...args){
  if(!host(this))return;
  ensureFacilityState(this);
  if(facilityMission(this.battlefieldEvents?.current)){this.tickBattlefieldConsequences?.();tickFacilityMission(this);return;}
  const result=tick.apply(this,args);tickFacilityMission(this);return result;
 };
}
