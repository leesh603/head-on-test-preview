import {squadronDamage,squadronDurability} from './squadron-elite-balance.js?v=09c75d146ae4289d';
import {canAdmitSquadron,announceSquadron} from './squadron-combat-state.js?v=09c75d146ae4289d';
/** 94th Aero Squadron-inspired patrol. Alternating lane choreography is game fiction. */
import {arrivalViewport} from './enemy-arrivals.js?v=09c75d146ae4289d';
export const HAT_RING_BALANCE=Object.freeze({count:5,first:24,interval:115,maxDuration:28,reserve:8,speed:152,turn:1.1,warning:.7,burst:.86,coast:1.8,bulletLife:2,bulletSpeed:455,gapHalfWidth:45,maxPasses:3,spacing:112,damage:9,minSeparation:100});
const B=HAT_RING_BALANCE,live=e=>e&&e.hp>0&&!e.expired&&!e.crashing,host=g=>!g.online||g.host;
const pilot=g=>g.players?.find(p=>p.hp>0&&p.status!=='downed')||g,hasPilot=g=>g.players?.length?g.players.some(p=>p.hp>0&&p.status!=='downed'):g.hp>0;
const pace=g=>Math.max(60,Math.min(280,(pilot(g).speed||150)*(pilot(g).airframeSpeed??1)*(pilot(g).pursuitSpeedFactor??1)));
function speed(e,v){e.speed=e.dogfightCruise=e.personalityCruise=e.cruiseSpeedCap=v;}
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const stageKey=g=>`${g.stageBoss?.stages?.loopIndex||0}:${g.stageBoss?.stages?.orderPosition||0}:${g.stageBoss?.stages?.stageIndex}`;
const members=g=>(g.enemies||[]).filter(e=>e.hatRingGroup!=null&&e.hatRingGroup===g.hatRingBlockade?.groupId&&live(e));
const lane=(e,a)=>-Math.sin(a)*e.x+Math.cos(a)*e.y;
const gunLane=e=>e.hatRingSlot===2?-1:e.hatRingSlot===3?1:e.hatRingSlot;
let art,loading=false,retryAt=0;
export function configureHatRingArt(hooks){art=hooks;loading=false;retryAt=0;}
function ready(){if(typeof Image==='undefined')return true;if(art?.ready?.('hatring_spad'))return true;if(art&&!loading&&Date.now()>=retryAt){loading=true;Promise.resolve().then(()=>art.load('hatring_spad')).then(()=>{if(!art.ready('hatring_spad'))retryAt=Date.now()+30000}).catch(()=>retryAt=Date.now()+30000).finally(()=>loading=false);}return false;}
export const hatRingActive=g=>['entry','reform','warning','salvo','coast','clear'].includes(g.hatRingBlockade?.phase);
function blocked(g){return !g.stageBoss?.stages||g.stageBoss.stages.phase!=='explore'||g.stageCombatWindow?.ready||['active','pending','dispatching'].includes(g.photoReconDirector?.phase)||g.battlefieldEvents?.current?.status==='active'||['warning','entering','active','retreating'].includes(g.intrusionBoss?.phase)||g.eliteEnemies?.active||g.londonBattle||g.parisBattle||g.verdunBattle||(g.bossPresentationAfter||0)>(g.t||0)||(g.battleRecoveryUntil||0)>(g.t||0)||(g.enemies||[]).some(e=>live(e)&&(e.bossPilot||e.type==='boss'||e.stageBossBody));}
const visible=(g,e,margin=0)=>{const v=arrivalViewport(g);return Math.abs(e.x-v.x)<v.w+margin&&Math.abs(e.y-v.y)<v.h+margin};
const visibleLanes=(g,es)=>[-1,0,1].every(slot=>!es.some(e=>gunLane(e)===slot)||es.some(e=>gunLane(e)===slot&&visible(g,e,-15)));
function room(g){const es=(g.enemies||[]).filter(live);return es.filter(e=>!e.bossPilot&&!e.heavyBomber&&['scout','hunter','bomber'].includes(e.type)).length+B.count<=(g.regularEnemyLimit?.()??12)&&es.length+B.count<=(g.enemyCapacity?.()??65)-1;}
function withdraw(g,reason){const s=g.hatRingBlockade;if(!s)return;s.phase='exit';s.outcome=reason;s.nextIn=B.interval;for(const e of members(g)){e.hatRingPhase='exit';e.hatRingHeading=e.a+.75;e.hatRingOpen=false;speed(e,pace(g)+120);e.missionTarget=false;e.fire=Infinity;}}
/** Admission only: may warm artwork, never creates combat entities or consumes RNG. */
export function canSpawnHatRingBlockade(g){
 if(!canAdmitSquadron(g,'hat-ring'))return false;
 const own=g.stageBoss?.stages?.teamFaction||g.teamFaction;
 if(!host(g)||g.state!=='playing'||!hasPilot(g)||own!=='central'||g.mode==='campaign'||g.historicalMode||g.stage?.historicalAnchorDate||blocked(g)||(g.enemies||[]).some(e=>live(e)&&e.hatRingGroup!=null)||!room(g)||!ready()||(g.stageCombatWindow?.remaining??Infinity)<B.maxDuration+B.reserve)return false;
 return true;
}
export function spawnHatRingBlockade(g){
 if(!canSpawnHatRingBlockade(g))return false;
 const p=pilot(g),v=arrivalViewport(g),a=(p.a||0),dx=Math.cos(a),dy=Math.sin(a),distance=Math.min(Math.abs(dx)>.001?(v.w+170)/Math.abs(dx):Infinity,Math.abs(dy)>.001?(v.h+170)/Math.abs(dy):Infinity),group=(g.hatRingSerial||0)+1,created=[];
 const prior=g.directorSpawning;g.directorSpawning=true;
 try{for(const slot of [-1,0,1,2,3]){const n=g.enemies.length,e=g.spawnEnemy?.('scout')||(g.enemies.length>n?g.enemies.at(-1):null);if(!e)break;
  for(const k of ['bankAircraft','bankHandlingBase','bankFireFactor','bankTurnFactor','formationLivery','directorSquad','directorFormation','frontRoute','eliteKind','personalityId','normalFormationFamily','formationLeader','isFormationCommander','directorSignals','dangerHeavy','dangerAimUntil','dangerAimAngle','airArrival','arrivalPending'])delete e[k];
  const hp=Math.round(65*squadronDurability(g)),side=slot===2?-1:slot===3?1:slot,back=slot>=2?68:Math.abs(slot)*8;Object.assign(e,{type:'scout',ace:false,hatRingSlot:slot,hatRingGroup:group,hatRingPhase:'entry',hatRingHeading:a,arrivalAuthored:true,missionTarget:true,battlefieldEventId:'hat-ring:'+group,escortPlane:'hatring_spad',visualScale:1,name:'제94항공대 · Hat in the Ring',planeName:'SPAD XIII',faction:'entente',hp,maxHp:hp,speed:Math.min(360,pace(g)+110),dogfightCruise:Math.min(360,pace(g)+110),personalityCruise:Math.min(360,pace(g)+110),cruiseSpeedCap:Math.min(360,pace(g)+110),energySpeed:1,fire:Infinity,hitRadius:20,contactRadius:17,x:v.x-dx*(distance+back)-dy*side*B.spacing,y:v.y-dy*(distance+back)+dx*side*B.spacing,a});created.push(e);
 }}finally{g.directorSpawning=prior}
 if(created.length!==B.count){g.enemies=g.enemies.filter(e=>!created.includes(e));return false;}
 g.hatRingSerial=group;g.hatRingBlockade={phase:'entry',groupId:group,stageKey:stageKey(g),elapsed:0,combatAge:0,age:0,pass:0,completedPasses:0,heading:a,cruise:pace(g),sampleX:p.x,sampleY:p.y,openSlot:0,nextIn:B.interval,lastTime:g.t||0};announceSquadron(g,'hat-ring',group);g.event?.('wave','제94항공대 접근 · 뒤쪽 평행 사격 접근 · 사격을 쉬는 통로로 회피');return created[1];
}
// A passed approach is retried through native flight. Wait for the old bullets
// to expire before turning the formation or announcing a different safe lane.
function reform(g,s){if(s.completedPasses>=B.maxPasses){withdraw(g,'departed');return;}s.phase='reform';s.age=0;s.reformHeading=s.heading;const es=members(g),cx=es.reduce((n,e)=>n+e.x,0)/es.length,cy=es.reduce((n,e)=>n+e.y,0)/es.length;s.reformCenterX=cx;s.reformCenterY=cy;s.reformSpeed=es.reduce((n,e)=>n+e.speed,0)/es.length;s.reformRate=0;for(const e of es){e.hatRingPhase='reform';e.hatRingOpen=false;e.fire=Infinity;e.hatRingFormationForward=(e.x-cx)*Math.cos(s.heading)+(e.y-cy)*Math.sin(s.heading);e.hatRingFormationSide=-(e.x-cx)*Math.sin(s.heading)+(e.y-cy)*Math.cos(s.heading);}}
function clearForReform(g,s){if((g.bullets||[]).some(b=>b.hatRingGroup===s.groupId&&b.life>0)){s.phase='clear';s.age=0;for(const e of members(g)){e.hatRingPhase='clear';e.hatRingHeading=s.heading;}}else reform(g,s);}
function warn(g,s){const es=members(g);s.phase='warning';s.age=0;s.openSlot=[0,-1,1][s.completedPasses%3];s.pass++;s.passFired=false;s.volley=0;s.laneRounds={};s.centerRounds=0;
 const center=es.find(e=>e.hatRingSlot===s.openSlot)||es.find(e=>gunLane(e)===s.openSlot),mean=es.reduce((sum,e)=>sum+lane(e,s.heading)-gunLane(e)*B.spacing,0)/Math.max(1,es.length);s.openLane=center?lane(center,s.heading):mean+s.openSlot*B.spacing;
 for(const e of es){e.hatRingPhase='warning';e.hatRingOpen=gunLane(e)===s.openSlot;e.hatRingHeading=s.heading;speed(e,Math.max(60,(s.projectedCruise??s.cruise)-(e.hatRingOpen?1:0)));e.hatRingRounds=0;e.fire=Infinity;}
 g.event?.('wave','94항공대 사격 준비 · 사격을 쉬는 기체의 빈 통로를 확인하세요');
}
export function tickHatRingBlockade(g,dt){
 if(!host(g)||!(dt>0)||g.mode==='campaign')return;let s=g.hatRingBlockade;
 if(g.state!=='playing'){if(s&&hatRingActive(g)&&['dead','lost','won'].includes(g.state))withdraw(g,'run-ended');return;}
 dt=Math.min(.04,dt);if(!s)s=g.hatRingBlockade={phase:'idle',nextIn:B.first,stageKey:stageKey(g),lastTime:g.t||0};
 if((g.t||0)<s.lastTime){withdraw(g,'restart');s.nextIn=B.first;}s.lastTime=g.t||0;
 const es=members(g);
 if(hatRingActive(g)){
  if(!es.length){withdraw(g,'destroyed');return;}if(blocked(g)||s.stageKey!==stageKey(g)||!hasPilot(g)){withdraw(g,'priority');return;}
  const target=pilot(g);if(Number.isFinite(s.sampleX)){s.projectedCruise=Math.max(60,Math.min(280,((target.x-s.sampleX)*Math.cos(s.heading)+(target.y-s.sampleY)*Math.sin(s.heading))/dt));if(!['entry','reform'].includes(s.phase))for(const e of es)speed(e,Math.max(60,s.projectedCruise/(s.phase==='coast'?Math.max(.9,Math.cos(s.heading-(s.coastHeading??s.heading))**2):1)-(e.hatRingOpen?1:0)));}s.sampleX=target.x;s.sampleY=target.y;if(!['reform','clear'].includes(s.phase)&&es.some(e=>(target.x-e.x)*Math.cos(s.heading)+(target.y-e.y)*Math.sin(s.heading)<B.minSeparation))clearForReform(g,s);
  s.elapsed+=dt;s.age+=dt;if(s.engagedAt!==undefined)s.combatAge=(s.combatAge||0)+dt;if(s.combatAge>=B.maxDuration||s.elapsed>=B.maxDuration+B.reserve){withdraw(g,'timeout');return;}
  if(s.phase==='reform'){
   s.heading=target.a||0;
   const dx=Math.cos(s.heading),dy=Math.sin(s.heading),v=arrivalViewport(g),half=Math.min(v.w/Math.max(.001,Math.abs(dx)),v.h/Math.max(.001,Math.abs(dy))),cx=es.reduce((sum,e)=>sum+e.x,0)/es.length,cy=es.reduce((sum,e)=>sum+e.y,0)/es.length,back=Math.max(150,Math.min(185,half-70)),vx=dx*pace(g)+(target.x-dx*back-cx)*.65,vy=dy*pace(g)+(target.y-dy*back-cy)*.65,wanted=Math.atan2(vy,vx),change=Math.max(-.5*dt,Math.min(.5*dt,angle(wanted-s.reformHeading)));
   s.reformHeading+=change;s.reformRate=change/dt;s.reformCenterX=cx;s.reformCenterY=cy;s.reformSpeed=Math.abs(angle(wanted-s.reformHeading))>.35?110:Math.max(60,Math.min(340,Math.hypot(vx,vy)));
   // Commit the next parallel lanes along the formation's native course. A
   // circling target need not become parallel to every inner/outer wing first;
   // the full warning gives the formation time to settle on this fixed course.
   const attack=s.reformHeading,depth=e=>(target.x-e.x)*Math.cos(attack)+(target.y-e.y)*Math.sin(attack),toward=Math.atan2(target.y-cy,target.x-cx);
   if(visibleLanes(g,es)&&Math.abs(angle(toward-attack))<.6&&es.every(e=>depth(e)>B.minSeparation+15&&Math.abs(angle(e.a-attack))<.65)){s.heading=attack;warn(g,s);}
  }else if(s.phase==='clear'){if(!(g.bullets||[]).some(b=>b.hatRingGroup===s.groupId&&b.life>0))reform(g,s);}
  else if(s.phase==='entry'){const p=pilot(g),v=arrivalViewport(g),dx=Math.abs(Math.cos(s.heading)),dy=Math.abs(Math.sin(s.heading)),fit=Math.min(dx>.001?(v.w-15-dy*B.spacing)/dx:Infinity,dy>.001?(v.h-15-dx*B.spacing)/dy:Infinity),depth=Math.min(fit-12,Math.max(B.minSeparation+25,dx*v.w+dy*v.h-90));if(visibleLanes(g,es)&&es.filter(e=>e.hatRingSlot<2).every(e=>(p.x-e.x)*Math.cos(s.heading)+(p.y-e.y)*Math.sin(s.heading)<=depth))warn(g,s);}
  else if(s.phase==='warning'&&s.age>=B.warning){s.phase='salvo';s.age=0;for(const e of es)e.hatRingPhase='salvo';}
  else if(s.phase==='salvo'){
   if(s.volley<5&&s.age>=s.volley*.2){for(const e of es)fireHatRing(g,e);s.volley++;}
   if(s.age>=B.burst){s.phase='coast';s.age=0;s.coastHeading=s.heading;for(const e of es)e.hatRingPhase='coast';}
  }else if(s.phase==='coast'){
   // All slots bank together between salvos; positions are never assigned.
   s.heading=(s.coastHeading??s.heading)+(s.pass%2?1:-1)*.14*Math.sin(Math.PI*2*Math.min(1,s.age/B.coast));
   for(const e of es)e.hatRingHeading=s.heading;
   if(s.age<B.coast)return;

   if(s.completedPasses>=B.maxPasses){withdraw(g,'departed');return;}
   // Never change the open lane while any previous volley is still live.
   if((g.bullets||[]).some(b=>b.hatRingGroup===s.groupId&&b.life>0))return;
   if(!s.passFired||!visibleLanes(g,es))reform(g,s);else warn(g,s);
  }
 }
 for(const e of es)if(e.hatRingPhase==='exit'&&!visible(g,e,110))g.enemies=g.enemies.filter(x=>x!==e);
 if(!members(g).length&&!hatRingActive(g)){s.phase='idle';if(!g.squadronManaged&&!blocked(g)){s.nextIn=Math.max(0,s.nextIn-dt);if(!s.nextIn)spawnHatRingBlockade(g);}}
}
export function hatRingSteering(g,e){if(e.hatRingGroup==null)return null;if(e.hatRingPhase==='exit')speed(e,pace(g)+120);let heading=e.hatRingHeading;
 if(g.hatRingBlockade?.phase==='reform'&&e.hatRingPhase!=='exit'){
  const s=g.hatRingBlockade,a=s.reformHeading,dx=Math.cos(a),dy=Math.sin(a),forward=e.hatRingFormationForward,side=e.hatRingFormationSide,ox=dx*forward-dy*side,oy=dy*forward+dx*side;
  // Rotate the formation through native per-aircraft velocities, including the
  // inner/outer wing speed difference. No aircraft position is reassigned.
  const vx=dx*s.reformSpeed-s.reformRate*oy+(s.reformCenterX+ox-e.x)*.8,vy=dy*s.reformSpeed+s.reformRate*ox+(s.reformCenterY+oy-e.y)*.8;
  heading=Math.atan2(vy,vx);speed(e,Math.max(40,Math.min(400,Math.hypot(vx,vy))));
  e.hatRingHeading=heading;
 }return {delta:angle(heading-e.a),turn:e.hatRingOpen?1.4:B.turn};}
export function fireHatRing(g,e){if(e.hatRingGroup==null)return false;e.fire=Infinity;const s=g.hatRingBlockade;
 if(!host(g)||g.state!=='playing'||s?.phase!=='salvo'||!live(e)||e.hatRingGroup!==s.groupId||e.hatRingOpen||e.hatRingSlot===s.openSlot||e.hatRingRounds>=4||e.hatRingLastVolley===s.pass+':'+s.volley||!visible(g,e,-15)||g.sunStrikeContains?.(e)||(g.bullets?.length||0)>=180)return true;
 // Each flank has a relief aircraft. Only one gun in each occupied lane fires
 // per beat, so five aircraft retain the original two-gun/safe-lane budget.
 const firingLane=gunLane(e);if((s.laneRounds?.[firingLane]||0)>=4)return true;
 const peers=members(g).filter(q=>gunLane(q)===firingLane&&visible(g,q,-15)&&Math.abs(angle(s.heading-q.a))<=.16);if(peers[(s.pass+s.volley)%Math.max(1,peers.length)]!==e)return true;
 const p=g.enemyCombatTarget?.(e)||pilot(g);if(!p||p.hp<=0||p.fogHidden||p.kaiserFogTime>0||p.ballCloak>0||p.cloudConceal>0)return true;
 const a=s.heading;if((p.x-e.x)*Math.cos(a)+(p.y-e.y)*Math.sin(a)<B.minSeparation)return true;if(Math.abs(angle(a-e.a))>.16||Math.abs(lane(e,a)-s.openLane)<B.gapHalfWidth+8)return true;
 s.fired=true;(s.laneRounds??={})[firingLane]=(s.laneRounds[firingLane]||0)+1;if(firingLane===0)s.centerRounds=s.laneRounds[0];s.engagedAt??=g.t||0;if(!s.passFired){s.passFired=true;s.completedPasses=(s.completedPasses||0)+1;}e.hatRingLastVolley=s.pass+':'+s.volley;e.hatRingRounds++;(g.bullets??=[]).push({x:e.x+Math.cos(a)*26,y:e.y+Math.sin(a)*26,vx:Math.cos(a)*B.bulletSpeed,vy:Math.sin(a)*B.bulletSpeed,life:B.bulletLife,enemy:true,sourceX:e.x,sourceY:e.y,hatRingGroup:s.groupId,hatRingSlot:e.hatRingSlot,hatRingPass:s.pass,hatRingOpenLane:s.openLane,hatRingHeading:a,collisionRadius:2,damage:squadronDamage(g,B.damage),visualType:'scout'});e.muzzleFlash=.12;e.gunAim=a;g.event?.('enemyShot','');return true;
}
export function installHatRingBlockade(Game){const p=Game.prototype;if(Object.hasOwn(p,'__hatRingBlockade'))return;p.__hatRingBlockade=true;
 const steer=p.dogfightSteering;p.dogfightSteering=function(e,...args){return hatRingSteering(this,e)||steer.call(this,e,...args);};
 const fire=p.fireEnemy;p.fireEnemy=function(e,...args){if(!fireHatRing(this,e))return fire.call(this,e,...args);};
}

export function withdrawHatRingBlockade(g,reason='priority'){withdraw(g,reason);}

/** Asset-only prefetch, independent of combat admission and RNG. */
export function warmHatRingArt(id){return ready();}
