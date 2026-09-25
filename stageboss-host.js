import {StageBossAddon,normalSpawnInterval} from './headon-stageboss-runtime.js?v=333&b=326';
import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=333&b=326';
import {waterBarrierDisplacement} from './headon-stageboss-render.js?v=333';

export const STAGE_NAMES=['전원 지대','아드리아해','참호 전선','포화의 참호전선','도심','고공 전역','알프스 산맥','제브뤼헤 군항'];
export const STAGE_BOSS_BALANCE=Object.freeze({distance:12000,deadline:90,spawnFactor:.55});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const players=g=>g.players||[g];
export const ZEEBRUGGE_ROUTE=Object.freeze({outerHarbor:4200,innerHarbor:10000,fortS:12580,fortN:110,seaHalfWidth:1000,halfWidth:800,backLimit:-420,approachLimit:12270,bossLimit:13600});
const smooth=(a,b,s)=>{const t=clamp((s-a)/(b-a),0,1);return t*t*(3-2*t)};
export const harborRouteHalfWidth=s=>ZEEBRUGGE_ROUTE.seaHalfWidth-(ZEEBRUGGE_ROUTE.seaHalfWidth-ZEEBRUGGE_ROUTE.halfWidth)*smooth(ZEEBRUGGE_ROUTE.outerHarbor,ZEEBRUGGE_ROUTE.innerHarbor,s);
export function harborBankOffset(s,side){
 const base=side>0?1150-500*smooth(ZEEBRUGGE_ROUTE.outerHarbor,ZEEBRUGGE_ROUTE.innerHarbor,s)-38*smooth(10000,12200,s):1250-380*smooth(7200,11200,s);
 return base+Math.sin(s*.00074+side*1.9)*13+Math.sin(s*.00183-side*.8)*5;
}
function createHarborRoute(g){return{x:g.x,y:g.y,a:Number.isFinite(g.a)?g.a:-Math.PI/2,maxForward:0,bankAt:harborBankOffset}}
export function constrainHarborRoute(g){
 const route=g.navalRoute;if(g.stageBoss?.stages.stageIndex!==7||!route)return;
 const hx=Math.cos(route.a),hy=Math.sin(route.a),nx=-hy,ny=hx;
 const limit=g.stageBoss.stages.phase==='explore'?ZEEBRUGGE_ROUTE.approachLimit:ZEEBRUGGE_ROUTE.bossLimit;
 for(const p of players(g)){
  const dx=p.x-route.x,dy=p.y-route.y,s=clamp(dx*hx+dy*hy,ZEEBRUGGE_ROUTE.backLimit,limit),halfWidth=harborRouteHalfWidth(s),n=clamp(dx*nx+dy*ny,-halfWidth,halfWidth);
  p.x=route.x+hx*s+nx*n;p.y=route.y+hy*s+ny*n;
 }
}
const alive=p=>p.hp>0&&(!p.status||p.status==='alive');
const blocked=g=>g.state!=='playing'||!!g.pendingLevelUps?.length;
export function stageBossBounds(g){const z=g.camera?.zoom||1,w=(g.viewWidth||960)/z,h=(g.viewHeight||700)/z;return {left:g.x-w/2,right:g.x+w/2,top:g.y-h/2,bottom:g.y+h/2};}
export function stageBossSpeed(p){let factor=1;for(const s of p.bossStatuses?.values()||[])factor=Math.min(factor,s.speedFactor??1);return factor;}
export function stageSpawnInterval(g,interval){return normalSpawnInterval(interval,{bossPresent:g.stageBoss?.stages.phase==='boss',factor:STAGE_BOSS_BALANCE.spawnFactor});}

export function enableStageBoss(g,{teamFaction,heavyHp=1}={}){
 if(g.mode==='campaign'||g.stageBoss)return g.stageBoss;
 g.stageStartDistance=g.distance||0;g.stageStartTime=g.t;g.bossBuildings=[];g.bossCues=[];g.navalRouteCues=new Set();g.navalApproachAt=null;g.navalRoute=null;
 const hitPlayer=(id,damage,source)=>{if(blocked(g))return;const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p))return;const percent=({'rail-shell':.06,'rail-shell-outer':.045,'alps-cannon':.05,'torpedo-charge':.05,'zubian-mortar':.04,'carpet-bomb':.04,'observer-shell':.04,'black-flak':.03})[source?.visual]||0,finalDamage=damage+p.maxHp*percent;if(g.players)g.hitPlayer(p,finalDamage);else g.hit(finalDamage);if(source?.visual==='torpedo-charge'){g.combatBlast(p.x,p.y,54,'enemy');g.shake=Math.max(g.shake,10);}else if(source?.visual==='zubian-shell')g.combatBlast(p.x,p.y,24,'enemy');};
 const hooks={
  getTuning({bossId}){
   // Reuse the current ace HP/time growth and current heavy coop multiplier once.
   const loop=g.stageBoss?.stages.loopIndex||0,stage=g.stageBoss?.stages.stageIndex||0;
   const density=loop===0?({0:.55,1:.7,2:.85}[stage]??1):1;
   const maxHp=Math.round(2100*(1+g.t/150)*(1+1.2*loop+.35*loop*loop))*heavyHp;
   const bossTuning={
    'paris-gun':{warningSeconds:1.55,railCycle:7.45,shellCount:5},
    lincomparable:{warningSeconds:1.85,railCycle:8.05},
    'sms-stuttgart':{launchInterval:2.9},
    'hms-zubian':{broadsideInterval:1.2/density,mortarInterval:2.05,chargeInterval:3.05},
    'zeppelin-l70':{engineInterval:2.6,engineShotCount:3,suppressiveInterval:3.75,suppressiveCount:5,gasInterval:7.5},
    hma23:{launchInterval:2.8,panicInterval:2.55},
    gik:{suppressiveInterval:3.4,suppressiveCount:5,rearFinalInterval:.65},
    'livens-flame-projector':{flameInterval:6.2},
    'minenwerfer-battery':{mortarInterval:5.8}
    ,'armored-harbor-fortress':{coastalInterval:2.5,craneInterval:4.8,harborLaunchInterval:5.6}
   }[bossId]||{};
   return {loopIndex:loop,projectileDensity:density,maxHp,partHp:maxHp*.12,damage:Math.round(18*(1+g.t/240)*(1+Math.min(.5,loop*.12))),bulletSpeed:270,coreRadius:150,
    mobileBoss:true,motionMultiplier:Math.min(2.5,1+loop*.25),patternMultiplier:Math.min(3,1+loop*.35),geometryScale:2.025,splitProtection:5,fireInterval:6,waterInterval:3.8,launchInterval:3,enrageInterval:1.1,broadsideInterval:1.8/density,mortarInterval:1.8,chargeInterval:2.7,suppressiveInterval:3.1/density,suppressiveCount:7,
    parts:{truss:{x:24,y:-80},muzzle:{x:0,y:-92},hangar:{x:0,y:38},crane:{x:42,y:-25},
     front:{x:0,y:-86},rear:{x:0,y:91},left:{x:-57,y:0},right:{x:57,y:0}},...bossTuning};
  },
  onDamage:hitPlayer,
  onStatus(id,status){const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p)||blocked(g))return;p.bossStatuses??=new Map();p.bossStatuses.set(status.sourceId,{...status,remaining:status.seconds});},
  onBarrierContact(id,h){const p=players(g).find(p=>(p.id||'p1')===id);if(!p||!alive(p)||blocked(g))return;const x=p.x,y=p.y,d=waterBarrierDisplacement({...p,radius:12},h);p.x+=d.x;p.y+=d.y;if(g.players)g.constrainMove(p,x,y);},
  spawnMinion(spec){
   const n=g.enemies.length;let result;g.bossMechanicSpawn=true;try{result=g.spawnEnemy(spec.minion==='autocannon'?'bomber':'hunter')}finally{g.bossMechanicSpawn=false}const e=result||g.enemies[g.enemies.length-1];if(g.enemies.length===n||!e)return;
   Object.assign(e,{id:spec.id,encounterId:spec.encounterId,faction:spec.faction,bossMinion:true,behavior:spec.behavior,
    x:spec.x,y:spec.y,escortPlane:spec.minion==='seaplane'||spec.minion==='seaplane-central'?'hansa_brandenburg_cc':spec.minion==='seaplane-entente'?'macchi_m5':spec.minion==='sopwith-camel'?'camel':spec.faction==='central'?'albatros':'sopwith',
    surface:spec.minion==='autocannon',stationary:spec.minion==='autocannon',groundEscort:spec.minion==='autocannon',a:spec.minion==='autocannon'?(spec.vx<0?Math.PI:0):(spec.a??e.a),vx:spec.vx||0,life:spec.behavior==='attack-pass'?6.2:18,fire:spec.fire??1.2,
    passTargetX:spec.passTargetX,passTargetY:spec.passTargetY,formationIndex:spec.formationIndex,formationCount:spec.formationCount,supportInvulnUntil:g.t+(spec.invulnerableSeconds||0)});
  },
  countMinions(id){return g.enemies.filter(e=>e.encounterId===id&&e.bossMinion&&e.hp>0).length;},
  onBuildingImpact(event){const b=g.bossBuildings.find(b=>!b.destroyed&&Math.abs(event.x-b.x)<=b.w/2+8&&Math.abs(event.y-b.y)<=b.h/2);if(!b)return false;b.destroyed=true;g.combatBlast(b.x,b.y,55,'enemy');return true;},
  onCue(event){
   const body=g.stageBoss?.stages.encounter?.bodies.get(event.bossId),x=event.x??body?.x??g.x,y=event.y??body?.y??g.y;
   if(event.type==='spawn-minefield'){
    g.hostileMinefields??=[];
    const owned=g.hostileMinefields.filter(f=>f.encounterId===g.stageBoss?.stages.encounter?.id);
    let existing=owned.reduce((n,f)=>n+f.mines.filter(m=>!m.dead).length,0);
    for(const f of owned)for(const m of f.mines){if(existing+event.points.length<=event.maxMines)break;if(!m.dead){m.dead=true;existing--;}}
    const mines=event.points.map(p=>({x:p.x,y:p.y,hp:18,dead:false,bossMine:true,chainHandled:false}));
    if(mines.length){const mx=mines.reduce((n,m)=>n+m.x,0)/mines.length,my=mines.reduce((n,m)=>n+m.y,0)/mines.length;
      g.hostileMinefields.push({x:mx,y:my,radius:Math.max(60,...mines.map(m=>Math.hypot(m.x-mx,m.y-my)+20)),
        warning:event.warning,life:event.life,region:g.worldRegion(),mines,encounterId:g.stageBoss.stages.encounter.id});}
   }
   if(event.type==='boss-enter'){g.event('wave','지역 보스 출현! · '+BOSS_CATALOG[event.bossId].name);g.event('heavyShot','');}
   else if(event.type==='hazard-activated'&&event.kind==='circle')g.combatBlast(event.x,event.y,event.radius,'enemy');
   else if(event.type==='part-destroyed'){const part=body?.parts.get(event.partId);g.combatBlast(x+(part?.x||0),y+(part?.y||0),46,'enemy');g.shake=Math.max(g.shake,7);}
   else if(event.type==='ammo-detonation'){g.combatBlast(event.x,event.y,105,'enemy');g.shake=Math.max(g.shake,12);g.event('wave','항구요새 탄약고 유폭 · 중앙 회전축 방호 약화');}
   else if(event.type==='rail-car-detached'){g.combatBlast(event.x,event.y,58,'enemy');g.shake=Math.max(g.shake,8);
    for(let i=0;i<4;i++){const ox=(g.rng?g.rng()-.5:Math.random()-.5)*120,oy=(i-1.5)*55+(g.rng?g.rng()-.5:Math.random()-.5)*30,r=24+((i*37)%3)*14;g.combatBlast(event.x+ox,event.y+oy,r,'enemy');if(g.burst)g.burst(event.x+ox,event.y+oy,'#ffd06a',6);if(g.smoke)g.smoke(event.x+ox,event.y+oy,true)}
    g.event('wave','열차 객차 파괴 · 기관차 방호 약화');}
   else if(event.type==='rail-runaway'){g.event('wave','기관차 폭주! · 선로에서 이탈하기 전에 추격하세요');g.shake=Math.max(g.shake,6);}
   else if(event.type==='rail-derail'){g.combatBlast(x,y,96,'enemy');g.shake=Math.max(g.shake,12);g.event('wave','기관차 탈선 · 최종 코어 노출');}
   else if(event.type==='body-defeated'&&event.kind?.startsWith('hms-zubian-')){g.combatBlast(x,y,82,'enemy');g.shake=Math.max(g.shake,10);}
   else if(event.type==='mine-chain'){g.combatBlast(event.x,event.y,event.radius||72,'enemy');g.shake=Math.max(g.shake,9);for(const e of g.enemies)if(e.hp>0&&!e.stageBossBody&&Math.hypot(e.x-event.x,e.y-event.y)<(event.radius||72))e.hp-=65;g.stageBoss?.hitAt({x:event.x,y:event.y,radius:event.radius||72,damage:65,faction:g.teamFaction});}
   else if(['split','misfire'].includes(event.type)){g.combatBlast(x,y,event.type==='split'?78:92,'enemy');g.shake=Math.max(g.shake,8);}
   else if(event.type==='boss-destruction-start'){g.event('wave',BOSS_CATALOG[event.bossId].name+' 붕괴 중!');g.shake=Math.max(g.shake,8);if(['zeppelin-l70','hma23'].includes(event.bossId))for(const b of event.bodies||[])g.wreckGust(b);}
   else if(event.type==='boss-destruction-pulse'){g.combatBlast(event.x,event.y,event.radius,'enemy');g.shake=Math.max(g.shake,event.final?13:8);}
   else if(event.type==='heavy-gun-fired'){g.event('heavyShot','');g.shake=Math.max(g.shake,7);}
   else if(event.type==='muzzle'){g.burst(event.x,event.y,'#ffe0a2',12);g.shake=Math.max(g.shake,3);}
   else if(event.type==='camera-shake')g.shake=Math.max(g.shake,event.strength||5);
   else if(event.type==='charge-warning'||event.type==='reentry-warning')g.bossCues.push({...event,life:event.seconds});
   else if(event.type==='rail-aim')g.bossCues.push({...event,targetX:event.target.x,targetY:event.target.y,life:event.seconds});
   else if(event.type==='cannon-aim')g.bossCues.push({...event,targetX:event.x+Math.cos(event.angle)*event.length,targetY:event.y+Math.sin(event.angle)*event.length,life:1.7});
   else if(event.type==='gas-zone'){(g.gasZones??=[]).push({x:event.x,y:event.y,r:event.radius||130,warning:1.6,life:event.life||9});}
   else if(event.type==='phase-change')g.event('wave','보스 전술 변화 · '+({exposed:'본체 노출',enraged:'대공포 집중 사격',reveal:'구름 은폐 해제',escort:'호위 차량 접근',locomotive:'기관차 노출','seaplane-support':'수상기 지원편대','breached':'외곽 장갑 붕괴','final-core':'중앙 지휘시설 노출'}[event.phase]||event.phase));
  },
  onEncounterCleared({id,bossId}){
   g.kills++;g.priorityKills=(g.priorityKills||0)+1;const owner=players(g).find(p=>(p.id||'p1')===g.stageBossLastOwner);if(g.players&&owner)owner.kills++;
   g.event('kill','');g.event('wave',BOSS_CATALOG[bossId].name+' 격파 · 다음 지역 진입');
   const hero=players(g)[0]||g;for(let i=0;i<9;i++){const a=i*.7;(g.drops||=[]).push({x:hero.x+Math.cos(a)*70,y:hero.y+Math.sin(a)*70,value:16,heal:i===0,bossReward:true})}
  },
  onStageChange({stageIndex,loopIndex}){const previousRegion=g.region;g.region=stageIndex;g.stageStartDistance=g.distance||0;g.stageStartTime=g.t;g.clearRegionalHazards();g.bossBuildings=[];g.bossCues=[];g.navalRouteCues=new Set();g.navalApproachAt=null;g.navalRoute=stageIndex===7?createHarborRoute(g):null;
   // A fresh map starts clean: leftover stragglers must not be sitting on top
   // of the player at the transition moment.
   g.enemies=g.enemies.filter(e=>e.missionTarget||e.stageBossBody||e.navalVessel||e.heavyBomber);
   g.bullets=g.bullets.filter(b=>!b.enemy);
   if(previousRegion!==undefined&&previousRegion!==stageIndex)g.events.push({type:'regionTransition',region:stageIndex,previousRegion,text:STAGE_NAMES[stageIndex]});g.event('wave',STAGE_NAMES[stageIndex]+' · '+(loopIndex+1)+'회차');},
  clearEncounterOwned(id){g.enemies=g.enemies.filter(e=>e.encounterId!==id);g.bullets=g.bullets.filter(b=>b.encounterId!==id);g.hostileMinefields=(g.hostileMinefields||[]).filter(f=>f.encounterId!==id);for(const p of players(g))for(const [key,s] of p.bossStatuses||[])if(s.encounterId===id)p.bossStatuses.delete(key);g.bossCues=[];}
 };
 g.stageBoss=new StageBossAddon({runId:g.runId||globalThis.crypto?.randomUUID?.()||'solo-'+Date.now(),teamFaction,hooks,rng:g.rng});
 return g.stageBoss;
}

// Thin combat targets share body state. They never run the old enemy AI or rewards.
export function syncStageBossTargets(g){
 const encounter=g.stageBoss?.stages.encounter,bodies=encounter?.bodies;
 g.enemies=g.enemies.filter(e=>!e.stageBossBody||bodies?.get(e.stageBossBody.id)===e.stageBossBody&&!e.stageBossBody.dead);
 const incoming=[...bodies?.values()||[]].filter(body=>!body.dead&&!g.enemies.some(e=>e.stageBossBody===body));
 if(incoming.length)g.reserveEnemySlots(incoming.length);
 for(const body of bodies?.values()||[]){if(body.dead||g.enemies.some(e=>e.stageBossBody===body))continue;
  const e={stageBossBody:body,encounterId:encounter.id,id:body.id,type:'stageBoss',faction:body.faction,stationary:true,surface:true,missionTarget:true,a:-Math.PI/2,speed:0,fire:Infinity};
  for(const key of ['x','y','hp','maxHp'])Object.defineProperty(e,key,{enumerable:true,get:()=>body[key]});g.enemies.push(e);
 }
}
export function stageBossCollision(g,e,x,y,b){const body=e.stageBossBody;if(!body)return null;if(blocked(g)||body.dead||g.stageBoss?.stages.encounter?.bodies.get(body.id)!==body)return false;return !!body.locateHit({x,y,previousX:b?.previousX??x,previousY:b?.previousY??y,radius:b?.collisionRadius||0});}
export function damageStageBoss(g,e,b,damage){
 if(!e.stageBossBody){if(e.bossPilot==='berthold'){if(e.hp<=e.maxHp*.5)damage*=.75;if(e.ironWillUntil>g.t)damage*=.35;}e.hp-=damage;return;}
 if(blocked(g)||b.patrol)return;const body=e.stageBossBody;
 const hit=body.locateHit({x:b.x,y:b.y,previousX:b.previousX,previousY:b.previousY,radius:b.collisionRadius||0});if(!hit)return;
 const result=g.stageBoss.hit({bodyId:body.id,...hit,damage,faction:g.teamFaction});
 if(result.damage>0)g.stageBossLastOwner=b.ownerId||'p1';
}
function updateMinions(g,dt){
 for(const e of g.enemies){if(!e.bossMinion||e.hp<=0)continue;const p=g.enemyCombatTarget(e);if(!p||p.hp<=0)continue;
  e.life=(e.life??18)-dt;if(e.life<=0){e.hp=0;continue}
  if(e.surface){e.x+=e.vx*dt;e.a=e.vx<0?Math.PI:0;const viewH=g.viewHeight||640,floorY=g.y+viewH*.34;e.y=Math.max(e.y,floorY);}else if(e.behavior==='attack-pass'){
   e.passAge=(e.passAge||0)+dt;if(!e.passLocked){const a=Math.atan2((e.passTargetY??p.y)-e.y,(e.passTargetX??p.x)-e.x);e.a=a;e.passLocked=true;e.speed=Math.max(205,e.speed||0);}
   const lane=((e.formationIndex||0)-((e.formationCount||1)-1)/2)*9;e.x+=Math.cos(e.a)*e.speed*dt-Math.sin(e.a)*Math.sin(e.passAge*2.2)*lane*dt;e.y+=Math.sin(e.a)*e.speed*dt+Math.cos(e.a)*Math.sin(e.passAge*2.2)*lane*dt;
  }else{const a=Math.atan2(p.y-e.y,p.x-e.x),delta=Math.atan2(Math.sin(a-e.a),Math.cos(a-e.a));e.a+=clamp(delta,-2*dt,2*dt);e.x+=Math.cos(e.a)*e.speed*dt;e.y+=Math.sin(e.a)*e.speed*dt;}
  if(e.behavior==='suicide-dive'&&Math.hypot(e.x-p.x,e.y-p.y)<25){if(g.players)g.hitPlayer(p,18);else g.hit(18);e.hp=0;g.combatBlast(e.x,e.y,35,'enemy');continue;}
  e.fire-=dt;if(e.fire<=0&&(e.behavior!=='attack-pass'||e.passAge>.65&&e.passAge<3.4)){e.fire=e.surface ? 1.5 : e.behavior==='attack-pass' ? .48 : 2.5;const a=e.behavior==='attack-pass'?e.a:Math.atan2(p.y-e.y,p.x-e.x);g.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*210,vy:Math.sin(a)*210,life:4,enemy:true,visualType:e.surface?'flak':'fighter',damage:Math.round(9*(1+g.t/240)),encounterId:e.encounterId});}
 }
}
export function beginStageBossFrame(g,dt){
 const addon=g.stageBoss;if(!addon||blocked(g)||dt<=0)return;
 addon.reconcile({blocked:false});
 for(const p of players(g))for(const [id,s]of p.bossStatuses||[]){s.remaining-=dt;if(s.remaining<=0||!alive(p))p.bossStatuses.delete(id);}
 g.bossCues=g.bossCues.filter(c=>(c.life-=dt)>0);
 const stage=addon.stages.stageIndex,naval=stage===1||stage===7;
 let route=stage===7?g.navalRoute:null;
 if(stage===7&&!route)route=g.navalRoute=createHarborRoute(g);
 if(route){const hx=Math.cos(route.a),hy=Math.sin(route.a),forward=(g.x-route.x)*hx+(g.y-route.y)*hy;route.maxForward=Math.max(route.maxForward||0,forward);}
 const travel=stage===7?Math.max(0,route.maxForward||0):(g.distance||0)-g.stageStartDistance,progress=Math.max(0,Math.min(1,travel/STAGE_BOSS_BALANCE.distance));
 if(naval&&addon.stages.phase==='explore'){
  const messages=stage===7?[[.35,'군항 외곽 진입 · 방파제 수로를 따라 전진'],[.72,'내항 접근 · 우현 부두를 따라 전진'],[.91,'항만 중심부 진입 · 우현 요새 포대 확인']]:[[.12,'연안 이탈 · 함대 수색 개시'],[.46,'외해 진입 · 적 수상기 활동 포착'],[.76,'수평선에 적 군함 실루엣 확인']];
  g.navalRouteCues??=new Set();for(const [mark,message]of messages)if(progress>=mark&&!g.navalRouteCues.has(mark)){g.navalRouteCues.add(mark);g.event('wave',message);}
 }
 const ready=travel>=STAGE_BOSS_BALANCE.distance||(stage!==7&&g.t-g.stageStartTime>=STAGE_BOSS_BALANCE.deadline);
 if(addon.stages.phase==='explore'&&ready){
  if(naval&&!g.navalApproachAt){g.navalApproachAt=g.t;g.event('wave',stage===7?'경고 · 장갑 항구요새 전면 도달':'경고 · 적 주력함이 전방에서 접근 중');g.event('heavyShot','');}
  if(!naval||g.t-g.navalApproachAt>=5.2){
   const bounds=stageBossBounds(g),alpine=stage===6,rail=['paris-gun','lincomparable'].includes(addon.stages.bossId);
   let x,y;
   if(stage===7&&route){
    // The illustrated central quay sits inside the right shoreline at this
    // point. Anchor the fortress on its concrete pier, clear of open water.
    const hx=Math.cos(route.a),hy=Math.sin(route.a),nx=-hy,ny=hx,along=ZEEBRUGGE_ROUTE.fortS;
    x=route.x+hx*along+nx*ZEEBRUGGE_ROUTE.fortN;y=route.y+hy*along+ny*ZEEBRUGGE_ROUTE.fortN;
   }else{
    const structure=stage===3;
    const forward=naval?Math.max(520,Math.min(760,(bounds.bottom-bounds.top)*1.05)):structure?Math.max(520,Math.min(700,(bounds.bottom-bounds.top)*.95)):rail?Math.max(460,Math.min(650,(bounds.bottom-bounds.top)*.82)):0;
    const heading=Number.isFinite(g.a)?g.a:-Math.PI/2;
    x=g.x+(alpine?105:(naval||rail||structure)?Math.cos(heading)*forward:0);
    y=g.y+(alpine?-Math.max(165,Math.min(180,(bounds.bottom-bounds.top)*.24)):(naval||rail||structure)?Math.sin(heading)*forward:-Math.min(180,(bounds.bottom-bounds.top)*.22));
   }
   addon.startBoss({x,y});g.navalApproachAt=null;
  }
 }
 // Heavy ambient hazards pause in the introductory boss encounter; aircraft and
 // ace schedules continue, with bounded admission and reduced reinforcement rate.
 if(addon.stages.phase==='boss'&&addon.stages.loopIndex===0){
  for(const key of ['fieldUnitTimer','regionThreat','flakTimer'])if(g[key]!==Infinity)g[key]=Math.max(g[key]||0,dt+.1)+dt;
  for(const key of ['nextHeavyAt','_zeppelinSchedule'])if(g[key]!==Infinity)g[key]=Math.max(g[key]||0,g.t+dt+.1)+dt;
 }
 syncStageBossTargets(g);separateLargeBossBodies(g);updateMinions(g,dt);
}
const LARGE_AIRCRAFT_HULLS=Object.freeze({
 // The artwork is much larger than the weak-point circles.  These ellipses
 // cover the visible fuselage and wings so a player can never remain hidden
 // inside the bomber while its movement path crosses them.
 gik:{halfWidth:128,halfHeight:150},
 ca4:{halfWidth:128,halfHeight:150}
});
export function separateLargeBossBodies(g){
 // Every aircraft is passable in HEAD-ON — players always fly through boss bodies.
}
export function endStageBossFrame(g,dt){
 separateAces(g,dt);
 const addon=g.stageBoss;if(!addon)return;
 constrainHarborRoute(g);
 if(addon.stages.phase==='sky-ace'&&g.skyChampion?.hp<=0){
  addon.stages.encounter={id:'sky-ace-'+addon.serial++,completed:true};addon.stages.phase='clear-pending';
  const next=addon.stages.advance(blocked(g));if(next){g.skyChampion=null;addon.hooks.onStageChange(next);}return;
 }
 if(g.state==='lost'||g.state==='won'){addon.dispose();return;}
 const activeEncounter=addon.stages.encounter;
 for(const f of activeEncounter?(g.hostileMinefields||[]):[])if(f.encounterId===activeEncounter.id)
  for(const mine of f.mines)if(mine.dead&&!mine.chainHandled){
   mine.chainHandled=true;
   for(const nearby of g.hostileMinefields||[])if(nearby.encounterId===f.encounterId)
    for(const next of nearby.mines)if(!next.dead&&Math.hypot(next.x-mine.x,next.y-mine.y)<=72){next.dead=true;next.chainHandled=true;g.combatBlast(next.x,next.y,30,'friendly');}
   addon.hooks.onCue({type:'mine-chain',bossId:activeEncounter.bodies.values().next().value?.id,x:mine.x,y:mine.y,radius:72});
  }
 // The host has already resolved its entire upgrade queue/loss state this frame.
 const bounds=stageBossBounds(g);const frame={paused:blocked(g),players:players(g).map(p=>({id:p.id||'p1',alive:alive(p),x:p.x,y:p.y,vx:Number.isFinite(p.previousX)?(p.x-p.previousX)/Math.max(dt,1/120):0,vy:Number.isFinite(p.previousY)?(p.y-p.previousY)/Math.max(dt,1/120):0,radius:12})),bounds,peaks:g.alpsMountains?.query(bounds)||[],buildings:g.bossBuildings};
 addon.tick(dt,frame);addon.reconcile({blocked:blocked(g)});separateLargeBossBodies(g);syncStageBossTargets(g);
 // Aerial aprons are solid barriers: aircraft that wander into the mesh are caught.
 const nets=activeEncounter?[...activeEncounter.bodies.values()].filter(b=>!b.dead&&['london-apron','drachen-net'].includes(b.kind)):[];
 for(const e of g.enemies){
  if(e.hp<=0||e.stageBossBody||e.bossMinion||e.crashing||e.crashed||e.surface||e.navalVessel||e.groundEscort||e.fieldUnit==='railgun'||e.stationary)continue;
  for(const b of nets){const dx=e.x-b.x,dy=e.y-b.y;if((dx/330)**2+(dy/235)**2<1){e.hp=0;g.combatBlast(e.x,e.y,26,'friendly');for(let k=0;k<4;k++)g.smoke?.(e.x+(g.rng()-.5)*20,e.y+(g.rng()-.5)*20,true);break;}}
 }
 if(g.state==='lost')addon.dispose();
}
// Shared by solo and co-op; bounded lateral clearance without changing aim/HP.
export function separateAces(g,dt){
 if(blocked(g)||dt<=0)return;
 const aces=g.enemies.filter(e=>e.hp>0&&e.bossPilot&&!e.stationary&&!e.stageBossBody);
 const limit=100*Math.min(dt,.04);
 for(let i=0;i<aces.length;i++)for(let j=i+1;j<aces.length;j++){
  const a=aces[i],b=aces[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  const gap=Math.max(82,(a.hitRadius||34)+(b.hitRadius||34)+14);if(d>=gap)continue;
  if(d<.001){dx=Math.cos(a.a+Math.PI/2);dy=Math.sin(a.a+Math.PI/2);d=1;}
  const move=Math.min(limit,(gap-d)/2),ux=dx/d,uy=dy/d;
  a.x-=ux*move;a.y-=uy*move;b.x+=ux*move;b.y+=uy*move;
 }
}
