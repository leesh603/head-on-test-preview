/** R.II intrusion adapter. Native rear-quarter guns / external racks, plain network state. */
import {LinkeHofmannRII,RII_LAYOUT} from './linke-hofmann-rii.js';
import {drawRIIBoss,drawRIIReleasedBombs} from './linke-hofmann-rii-render.js';
import {riiCollapseSites,riiCollapsePulse,queueRIICollapseFx} from './rii-destruction-fx.js';
import {pushExplosionFx} from './explosion-profiles.js?v=fx5';
import {fx} from './fx-art.js?v=tame3';
import {queueArtilleryMuzzle} from './artillery-fx.js';
export const RII_DESTRUCTION_TIME=2.65;
const cache=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=(n,d=0)=>Number.isFinite(n)?n:d;
const fields=['phase','phaseClock','cycle','dropIndex','dropClock','visualBombs','visualBombSerial','bombHeading','finishClock','rackAmmo','gunCadence','nextGun','turretStates','flightSpeed','rpm','propellerPhase','crash','defeatAge','defeatProgress','dead'];
const players=g=>(g.players||[g]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
const velocity=p=>({x:finite(p.vx,Math.cos(finite(p.a,-Math.PI/2))*finite(p.speed)),y:finite(p.vy,Math.sin(finite(p.a,-Math.PI/2))*finite(p.speed))});
function bodyFor(e){let b=cache.get(e);if(!b){b=new LinkeHofmannRII({id:e.encounterId||'rii',x:e.x,y:e.y,emit:v=>b._intrusionEmit?.(v),tuning:{maxHp:e.maxHp||1000,partHp:100,damage:12,bulletSpeed:310,geometryScale:e.scale||.2}});if(e.rii)for(const k of fields)if(e.rii[k]!==undefined)b[k]=structuredClone(e.rii[k]);if(!e.rii)for(const s of Object.values(b.turretStates))s.angle+=(e.a??-Math.PI/2)+Math.PI/2;cache.set(e,b);}b.x=e.x;b.y=e.y;b.a=e.a;b.hp=e.hp;b.geometryScale=e.scale||.2;b.rotateParts();return b;}
function save(e,b){e.x=b.x;e.y=b.y;e.a=b.a;e.flightSpeed=b.flightSpeed;e.rii||={};for(const k of fields)e.rii[k]=structuredClone(b[k]);e.flightPhase=b.phase;e.turretAngles=Object.fromEntries(Object.entries(b.turretStates).map(([id,s])=>[id,s.angle-b.a]));}
export function initializeRII(e){if(e.riiInitialized)return e;e.riiInitialized=true;e.riiBrokenIds=[];e.riiShots=[];e.hazards||=[];e.shotCues||=[];e.riiSerial=0;save(e,bodyFor(e));return e;}
function event(g,e,b,v){
 if(v.type==='cancel-hazards'){e.riiShots=e.riiShots.filter(q=>q.sourcePartId!==v.sourcePartId);e.shotCues=e.shotCues.filter(q=>q.partId!==v.sourcePartId);e.hazards=e.hazards.filter(q=>q.sourcePartId!==v.sourcePartId);return;}
 if(v.type==='hazard'){if(!v.delay)e.volley=finite(e.volley)+1;if(v.kind==='projectile')e.riiShots.push({...v,age:0,id:++e.riiSerial});else {e.hazards.push({...v,kind:'bomb',age:0,done:false,rii:true,id:++e.riiSerial});(g.events||=[]).push({type:'riiBombReleased',encounterId:e.encounterId,partId:v.sourcePartId,x:v.x,y:v.y});}return;}
 if(v.type==='charge-warning'&&v.partId?.startsWith('gun')){e.shotCues.push({partId:v.partId,a:v.angle,x:v.x,y:v.y,age:0,warning:v.seconds,damage:6.6,rii:true});return;}
 if(v.type==='body-defeated')e.riiSelfDestruct=true;
}
function sync(g,e,b){b._intrusionEmit=v=>event(g,e,b,v);const handled=e.riiBrokenIds||=([]);for(const p of b.parts.values()){const q=e.parts?.[p.id];if(!q)continue;p.maxHp=q.maxHp;p.hp=q.hp;if(p.hp<=0&&!handled.includes(p.id)){handled.push(p.id);b.onPartDestroyed(p);}}}
function sample(g,e,dt){const p=players(g)[0]||g,v=velocity(p),old=e.riiPlayerMotion;if(!old){e.riiPlayerMotion={x:finite(p.x),y:finite(p.y),vx:v.x,vy:v.y};return;}const dx=(finite(p.x)-old.x)/dt,dy=(finite(p.y)-old.y)/dt,k=1-Math.exp(-8*dt),bad=Math.hypot(dx,dy)>800;old.vx+=((bad?v.x:dx)-old.vx)*k;old.vy+=((bad?v.y:dy)-old.vy)*k;old.x=finite(p.x);old.y=finite(p.y);}
export function stepRIIMotion(g,e,dt){
 initializeRII(e);if(!(dt>0))return;sample(g,e,dt);const b=bodyFor(e);sync(g,e,b);
 // Lifecycle cleanup must clear the cached simulation too, not only its JSON view.
 if(e.phase==='retreating'||e.phase==='resolved')b.visualBombs=[];
 if(e.phase==='reserved'||e.phase==='warning'||e.phase==='resolved'){b.updateArrival(dt);save(e,b);return;}
 if(e.phase==='entering'){
  if(!e.riiEntry){const p=players(g)[0]||g,a=e.shadowPass?.a??finite(p.a,-Math.PI/2),speed=Math.max(82,Math.hypot(e.riiPlayerMotion.vx,e.riiPlayerMotion.vy)),margin=Math.hypot(e.width||390,e.height||844)*.5+RII_LAYOUT.width*e.scale*.5+40;e.riiEntry={x:finite(p.x)-Math.cos(a)*margin,y:finite(p.y)-Math.sin(a)*margin,a,age:0,distance:margin+140+speed*3,speed};}
  const q=e.riiEntry;q.age=Math.min(3,q.age+dt);const t=q.age/3,d=(-2*t*t*t+3*t*t)*q.distance+(t*t*t-t*t)*q.speed*3;b.x=q.x+Math.cos(q.a)*d;b.y=q.y+Math.sin(q.a)*d;for(const s of Object.values(b.turretStates))s.angle+=q.a-b.a;b.a=q.a;b.flightSpeed=q.speed;b.updateArrival(dt);b.rotateParts();save(e,b);return;
 }
 if(e.phase!=='active'&&e.phase!=='retreating')return;
 const p=players(g)[0]||g,v=e.riiPlayerMotion,ps=Math.hypot(v.vx,v.vy),lead={x:finite(p.x)+(ps>10?v.vx/ps:Math.cos(b.a))*200,y:finite(p.y)+(ps>10?v.vy/ps:Math.sin(b.a))*200},distance=Math.hypot(lead.x-b.x,lead.y-b.y);
 const actualDistance=Math.hypot(finite(p.x)-b.x,finite(p.y)-b.y);if(b.phase!=='defence'||actualDistance>420)e.riiGuardLeg=false;else if(actualDistance<300)e.riiGuardLeg=true;
 const guarding=!!e.riiGuardLeg,guardHeading=Math.atan2(finite(p.y)-b.y,finite(p.x)-b.x)-Math.PI+(b.cycle%2?.65:-.65);
 b.flightControl={speed:guarding?clamp(ps+(Math.min(280,(e.width||390)*.5+50)-actualDistance)*.45,70,500):clamp(ps+(distance-120)*.38,70,600),heading:guarding?guardHeading:Math.atan2(lead.y-b.y,lead.x-b.x),turnRate:clamp(.85+ps/280,.85,2.2)};
 if(b.phase==='bomb-prepare'){e.riiBombApproach??=Math.atan2(lead.y-b.y,lead.x-b.x);b.flightControl.heading=e.riiBombApproach;}else e.riiBombApproach=null;
 if(b.phase==='bomb-run')b.flightControl.speed=Math.min(b.flightControl.speed,Math.max(85,ps*.45));
 const turnError=Math.abs(Math.atan2(Math.sin(b.flightControl.heading-b.a),Math.cos(b.flightControl.heading-b.a)));if(b.phase!=='bomb-run'&&turnError>.6)b.flightControl.speed=Math.min(b.flightControl.speed,Math.max(90,ps*.65));
 const oldX=b.x,oldY=b.y,oldAngles=Object.fromEntries(Object.entries(b.turretStates).map(([id,s])=>[id,s.angle]));
 if(e.phase==='retreating'){b.flightSpeed=Math.max(160,b.flightSpeed);b.x+=Math.cos(b.a)*b.flightSpeed*dt;b.y+=Math.sin(b.a)*b.flightSpeed*dt;b.updateArrival(dt);}
 else b.update(dt,{players:players(g).filter(p=>Math.hypot(p.x-b.x,p.y-b.y)<=560).map(p=>({...p,vx:p===players(g)[0]?v.vx:velocity(p).x,vy:p===players(g)[0]?v.vy:velocity(p).y}))});
 e.riiSlewUsed={};for(const [id,s]of Object.entries(b.turretStates)){const d=Math.atan2(Math.sin(s.angle-oldAngles[id]),Math.cos(s.angle-oldAngles[id])),change=clamp(d,-1.2*dt,1.2*dt);s.angle=oldAngles[id]+change;e.riiSlewUsed[id]=Math.abs(change);}
 e.worldVx=(b.x-oldX)/dt;e.worldVy=(b.y-oldY)/dt;save(e,b);
}
export function stepRIICombat(g,e,dt){initializeRII(e);if(e.phase!=='active'||e.hp<=0||!(dt>0))return;const b=bodyFor(e);sync(g,e,b);
 for(const q of e.shotCues){q.age+=dt;const m=b.gunMuzzle(q.partId,q.a);q.x=m.x;q.y=m.y;}e.shotCues=e.shotCues.filter(q=>e.parts[q.partId]?.hp>0&&q.age<q.warning+.56);
 for(const id of ['gun-left','gun-right']){const q=e.riiShots.find(q=>!q.done&&q.sourcePartId===id),s=b.turretStates[id];if(q&&s){const d=Math.atan2(Math.sin(q.angle-s.angle),Math.cos(q.angle-s.angle));const remaining=Math.max(0,1.2*dt-(e.riiSlewUsed?.[id]||0));s.angle+=clamp(d,-remaining,remaining);}}
 for(const q of e.riiShots){q.age+=dt;if(q.done||q.age<q.warning+(q.delay||0)||!b.alivePart(q.sourcePartId))continue;q.done=true;if(Math.abs(Math.atan2(Math.sin(q.angle-b.turretStates[q.sourcePartId].angle),Math.cos(q.angle-b.turretStates[q.sourcePartId].angle)))>.18)continue;const m=b.gunMuzzle(q.sourcePartId,q.angle);(g.bullets||=[]).push({...m,vx:q.vx,vy:q.vy,life:q.duration,enemy:true,visualType:'boss',damage:q.damage,intrusionEncounterId:e.encounterId,encounterId:e.encounterId,sourceBossId:e.profileId,sourcePartId:q.sourcePartId});b.noteAttackActivated({...q,angle:undefined});queueArtilleryMuzzle(g,{...m,angle:q.angle,scale:.18,heavy:false});(g.events||=[]).push({type:'riiGunShot',encounterId:e.encounterId,partId:q.sourcePartId,...m});}
 e.riiShots=e.riiShots.filter(q=>!q.done&&b.alivePart(q.sourcePartId));
 for(const h of e.hazards){h.age+=dt;if(!h.done&&h.age>=h.warning){h.done=true;for(const p of players(g))if(Math.hypot(p.x-h.x,p.y-h.y)<h.radius+finite(p.r,12)){if(g.players)g.hitPlayer?.(p,h.damage);else g.hit?.(h.damage);}g.combatBlast?.(h.x,h.y,h.radius,'enemy','structure');}}
 e.hazards=e.hazards.filter(h=>h.age<h.warning+.35);save(e,b);
}
export function beginRIIDestruction(g,e){initializeRII(e);const b=bodyFor(e);sync(g,e,b);if(e.riiCollapse)return;b.beginCrash();b.dead=true;e.riiCollapse={age:0,index:0,sites:riiCollapseSites(b)};e.riiShots=[];e.hazards=[];e.shotCues=[];b.visualBombs=[];save(e,b);}
export function stepRIIDestruction(g,e,dt){if(!e.riiCollapse)beginRIIDestruction(g,e);const b=bodyFor(e),c=e.riiCollapse;c.age+=dt;b.updateCrash(dt,c.age,RII_DESTRUCTION_TIME);while(c.index<c.sites.length&&c.sites[c.index].at<=c.age){const v=riiCollapsePulse(b,c.sites[c.index++]);const presentation={event:(...args)=>g.event?.(...args),shake:g.shake||0};queueRIICollapseFx(presentation,v,(unused,spec)=>pushExplosionFx(g,spec));g.shake=presentation.shake;(g.events||=[]).push({...v,encounterId:e.encounterId});}save(e,b);}
export function locateRIIIntrusionHit(e,x,y,padding=0,previousX=x,previousY=y){const b=bodyFor(e),prior=[...b.parts.values()].map(p=>[p,p.hp]);try{for(const p of b.parts.values())if(e.parts?.[p.id])p.hp=e.parts[p.id].hp;const hit=b.locateHit({x,y,radius:padding,previousX,previousY});return hit?hit.partId||'core':null;}finally{for(const [p,hp]of prior)p.hp=hp;}}
export function drawRIIIntrusionBoss(c,e,point,scale,images){const state={...e.rii,propellerPhase:e.visualRIIPropellerPhase??e.rii?.propellerPhase,turretStates:Object.fromEntries(Object.entries(e.rii?.turretStates||{}).map(([id,s])=>[id,{...s,angle:Number.isFinite(e.turretAngles?.[id])?e.a+e.turretAngles[id]:s.angle}])),kind:'linke-hofmann-r-ii',x:point.x,y:point.y,a:e.a,geometryScale:scale,parts:RII_LAYOUT.parts.map(p=>({...p,...e.parts?.[p.id],hp:e.damage?.[p.id]==='destroyed'?0:e.parts?.[p.id]?.hp??100,maxHp:e.parts?.[p.id]?.maxHp??100})),visualBombs:[]};return drawRIIBoss(c,state,{images,time:e.age||0,effect:e.riiShadow?undefined:fx});}
export function drawRIIIntrusionBombs(c,e,point,z,images){const origin=point(0,0);c.save();c.translate(origin.x,origin.y);c.scale(z,z);drawRIIReleasedBombs(c,{...e.rii,visualBombs:(e.rii?.visualBombs||[]).map(b=>({...b,age:b.age+(e.visualRIITime||0)})),geometryScale:e.scale},{images});c.restore();}

export const drawRIIIntrusion=drawRIIIntrusionBoss;
