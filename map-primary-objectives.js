// Required battlefield objectives. The existing stage owner advances the front;
// this module only observes native parts, pilots and mission-owned units.
import {tickAirMapMission} from './map-air-missions.js?v=arras-cargo-icons-4529781a-20261112';
import {NAVAL_MISSION_BALANCE,tickNavalMapMission} from './map-naval-missions.js?v=earned-rewards-7ccfad1b-20261114';
import {tickAlpsObservation} from './alps-observation-mission.js?v=late-open-prs-5900a138-20261113';
import {harborPoint} from './harbor-crane-layout.js?v=quality-audit-596-c6ea4cf8-20261109';

export const PRIMARY_MAPS=Object.freeze([0,1,2,5,6,7,8,9,10,12,13,14,15,16]);
const BOSS_OBJECTIVES={
 5:['거대 공중요새 격파','Destroy the aerial fortress'],
 7:['장갑 항만요새 격파','Destroy the armored harbor fortress'],
 14:['갈리폴리 대요새 격파','Destroy the Gallipoli fortress']
};
const TITLES={0:['철도 돌파','Rail breakthrough'],1:['해협 봉쇄전','Strait blockade'],2:['참호 돌파','Trench breakthrough'],5:['공중요새 결전','Aerial fortress'],6:['산악 관측망 섬멸','Alpine observation network'],7:['제브뤼헤 항만요새','Zeebrugge harbor fortress'],8:['돌파로 확보','Secure the breach'],9:['아라스 고고도 제공전','Arras air superiority'],10:['솜 전선','Somme front'],12:['베르됭 보급로 확보','Open the Verdun supply route'],13:['마안 사진정찰 호위','Maan reconnaissance escort'],14:['갈리폴리 대요새','Gallipoli fortress'],15:['파리 야간 작전','Paris night operation'],16:['유틀란트 함대전','Jutland fleet action']};
const host=g=>!g.online||g.host;
const live=p=>p&&p.hp>0&&!p.expired&&!p.crashing&&p.status!=='downed'&&p.status!=='dead';
const pilots=g=>(g.players||[g]).filter(live);
const lead=g=>pilots(g)[0];
const at=(o,a,d,n=0)=>({x:o.x+Math.cos(a)*d-Math.sin(a)*n,y:o.y+Math.sin(a)*d+Math.cos(a)*n});
const near=(g,q,r=170)=>pilots(g).some(p=>Math.hypot(p.x-q.x,p.y-q.y)<=r);
const dead=(b,id)=>!!b&&(b.dead||b.parts?.get(id)?.destroyed===true||b.parts?.get(id)?.hp<=0);
const bodies=g=>[...g.stageBoss?.stages.encounter?.bodies?.values?.()||[]];
const stageKey=g=>{const s=g.stageBoss.stages;return `${s.loopIndex}:${s.orderPosition}:${s.stageIndex}`;};
const say=(g,text)=>g.event?.('wave',text);
// 20261109 HUD copy: the card reads title / what to do now with its count /
// time left and the one way it can fail. Before contact each map already
// names its real objective instead of a generic "find the target".
const PREVIEW={0:['열차포를 찾아 선로·탄약차 파괴','Find the rail gun: cut track and ammunition'],2:['적 전차를 찾아 멈추세요','Find the tank and stop it'],8:['적 주포를 부숴 돌파로를 여세요','Break the enemy guns to open the breach'],10:['전방 적 강점·전차를 저지하세요','Stop the strongpoint and tanks ahead'],12:['관측소와 보급로 포대를 찾으세요','Find the observation post and road batteries'],15:['파리 상공의 표적을 찾으세요','Find the target over Paris']};
const PREVIEW_META=['표적과 교전하면 제한시간 시작','The clock starts at first contact'];
const won=(ko,en)=>({success:true,reason:[ko,en]});
const lost=(ko,en)=>({success:false,reason:[ko,en]});
const guide=(m,q,ko,en,kind='target')=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))m.guides.push({...q,label:[ko,en],kind});};
function keepReachedExit(m){
 const point=m.guides.find(q=>q.kind==='exit');
 if(point)m.exitSignal={x:point.x,y:point.y};
}
const partGuide=(m,b,id,ko,en)=>{const p=b?.parts?.get(id);if(p&&!dead(b,id))guide(m,{x:b.x+p.x,y:b.y+p.y},ko,en);};

export function clearMapMission(g){
 const m=g.mapMission;if(m){
  for(const key of ['enemies','patrols','allies','friendlyShips','bullets','bombZones','drops'])if(g[key])g[key]=g[key].filter(e=>e.mapMissionId!==m.id);
  if(g.navalExchanges)g.navalExchanges=g.navalExchanges.filter(e=>e.target?.mapMissionId!==m.id);
  g.stageBoss?.hazards?.clear?.(m.id);
  for(const b of bodies(g))delete b.mapAdvanceTarget;
 }
 g.mapMission=null;g.mapMissionSnapshot=null;
}
export function ensureMapMission(g){
 const s=g?.stageBoss?.stages;
 if(!s||!host(g)||g.mode==='campaign'||!PRIMARY_MAPS.includes(s.stageIndex)||['operation-active','operation-offer','operation-result','final-arena','front-complete','sky-ace'].includes(s.phase))return null;
 const key=stageKey(g);if(g.mapMission?.key===key)return g.mapMission;
 clearMapMission(g);
 const p=lead(g);if(!p)return null;
 const m=g.mapMission={id:`map-${g.stageBoss.runId||'sortie'}-${key}`,key,region:s.stageIndex,faction:s.teamFaction||g.teamFaction||'entente',age:0,limit:120,status:'active',resolved:false,success:false,exitReady:false,origin:{x:p.x,y:p.y},heading:p.a??-Math.PI/2,title:TITLES[s.stageIndex],task:['작전 지역으로 진입하세요','Enter the operation area'],detail:['필수 목표를 달성해야 다음 전장으로 이동합니다','Complete the objective to reach the next battlefield'],guides:[],reservesEvents:[1,5,6,7,9,13,14,16].includes(s.stageIndex)};
 // Part-based objectives start their deadline at contact, preserving the
 // current opening fights and the normal boss approach/arrival sequence.
 m.awaitContact=[0,2,8,10,12,15].includes(m.region);
 if(BOSS_OBJECTIVES[m.region])m.limit=Infinity;
 return m;
}

function exit(g,m,ko='귀환선',en='Exit',distance=950,reverse=true){
 if(!m.exit){m.exit=at(lead(g)||m.origin,m.heading+(reverse?Math.PI:0),distance);say(g,ko+' 개방 · 표시된 지점으로 이탈하세요');}
 guide(m,m.exit,ko,en,'exit');m.task=[ko+'으로 이동하세요',`Fly to the ${en.toLowerCase()}`];
 m.detail=['목표 달성 · 남은 적은 무시해도 됩니다','Objective done · remaining enemies may be ignored'];
 return near(g,m.exit)?won('작전 완료 · 전장 이탈','Objective complete · leaving battlefield'):null;
}
function combatBody(g,m){
 const b=bodies(g)[0];if(!b||b.arrivalPending)return null;
 if(m.contactAt==null){m.contactAt=m.age;m.limit=m.age+120;}
 return b;
}
function spawn(g,m,type,pose,extra={}){
 const previous=g.bossMechanicSpawn;let e;
 try{g.bossMechanicSpawn=true;e=g.spawnEnemy?.(type);}finally{g.bossMechanicSpawn=previous;}
 if(e)Object.assign(e,pose,{mapMissionId:m.id,missionTarget:true},extra);
 return e;
}
function interceptCounterattack(g,m,dt){
 m.counter??={launched:0,stopped:0,escaped:0,targets:[],nextAt:m.age+2};
 const c=m.counter;
 if(c.launched<4&&m.age>=c.nextAt){
  const target=m.breach,side=c.launched%2?1:-1,origin=at(target,m.heading,900,side*150),heading=Math.atan2(target.y-origin.y,target.x-origin.x);
  const e=spawn(g,m,'scout',{...origin,a:heading},{type:'railgun',fieldUnit:'railgun',fieldSprite:'railgun',fieldRegion:8,stationary:true,surface:true,arrivalAuthored:true,arrivalPending:false,airArrival:null,speed:0,hp:160,maxHp:160,hitRadius:52,hullLength:92,hullWidth:52,fire:1.2,
   rail:{...at(origin,heading,650),angle:heading,half:650,progress:-650,direction:1,speed:48},eventExitHeading:heading,mapExit:at(target,heading,250)});
  if(e){c.targets.push(e);c.launched++;c.nextAt=m.age+4;say(g,'장갑 반격대 접근 · 돌파로 진입 전에 저지하세요');}
 }
 for(const e of c.targets){if(e.mapResult)continue;if(e.hp<=0){e.mapResult='stopped';c.stopped++;continue;}
  if(e.expired){e.mapResult='missing';c.escaped++;continue;}
  guide(m,e,'장갑 반격대','Armored counterattack');
  const h=e.eventExitHeading,q=e.mapExit;if((e.x-q.x)*Math.cos(h)+(e.y-q.y)*Math.sin(h)>=0){e.mapResult='escaped';e.expired=true;e.missionTarget=false;c.escaped++;say(g,'반격대 돌파 · '+c.escaped+'/2');}}
 m.task=[`역습기 저지 ${c.stopped}/3 · 돌파 ${c.escaped}/2`,`Counterattack stopped ${c.stopped}/3 · breaches ${c.escaped}/2`];
 m.detail=['2대가 돌파하면 작전 실패','Two breaches fail the operation'];guide(m,m.breach,'확보한 돌파로','Secured breach','ally');
 if(c.escaped>=2)return lost('돌파로 상실 · 역습 저지 실패','Breach lost · counterattack succeeded');
 if(c.stopped>=3)return won('역습 저지 · 돌파로 확보','Counterattack stopped · breach secured');
 return null;
}

function tickParts(g,m,dt){
 const b=combatBody(g,m);if(!b){m.task=PREVIEW[m.region]||['전방 표적을 찾으세요','Find the target ahead'];m.detail=PREVIEW_META;return null;}
 const parts=[...b.parts?.values()||[]];
 if(m.region===0){
  const rail=!!b.rail129?.broken||dead(b,'rail'),ammo=dead(b,'car-front');
  m.task=[`선로 ${rail?'차단':'파괴'} · 탄약차 ${ammo?'차단':'파괴'}`,`Track ${rail?'cut':'intact'} · ammunition ${ammo?'cut':'intact'}`];m.detail=['열차포를 무력화한 뒤 전방으로 돌파','Disable the railway gun, then break through ahead'];
  partGuide(m,b,'rail','선로','Track');partGuide(m,b,'car-front','탄약차','Ammunition car');
  if(b.dead||rail&&ammo)return exit(g,m,'전방 돌파 지점','Forward breach',1050,false);
 }else if(m.region===2){
  const stopped=b.dead||dead(b,'engine-deck')||dead(b,'track-left')&&dead(b,'track-right');
  m.task=[`전차 정지 · 궤도 ${['track-left','track-right'].filter(id=>dead(b,id)).length}/2 또는 엔진`,`Stop the tank · tracks ${['track-left','track-right'].filter(id=>dead(b,id)).length}/2 or engine`];m.detail=['멈추면 전방 돌파 지점 개방','Stopping it opens the breakthrough'];
  partGuide(m,b,'track-left','좌측 궤도','Left track');partGuide(m,b,'track-right','우측 궤도','Right track');
  if(stopped)return exit(g,m,'돌파 지점','Breakthrough',1100,false);
 }else if(m.region===8){
  const ids=b.kind==='fliegerzug'?['car-launch-a','car-launch-b']:['turret'];
  const done=b.dead||ids.every(id=>dead(b,id));
  if(!m.breach&&done){m.breach=at({x:b.x,y:b.y},m.heading,450);m.limit=Math.max(m.limit,m.age+45);say(g,'돌파로 개방 · 적 장갑 반격대가 접근합니다');}
  if(m.breach)return interceptCounterattack(g,m,dt);
  m.task=[b.kind==='fliegerzug'?`발진 객차 파괴 ${ids.filter(id=>dead(b,id)).length}/2`:'주포를 파괴해 돌파로 개방',b.kind==='fliegerzug'?`Launch cars destroyed ${ids.filter(id=>dead(b,id)).length}/2`:'Destroy the turret to open the breach'];m.detail=['돌파로를 연 뒤 역습기까지 막아야 승리','After the breach, stop the counterattack to win'];
  for(const id of ids)partGuide(m,b,id,b.kind==='fliegerzug'?'발진 객차':'주포',b.kind==='fliegerzug'?'Launch car':'Turret');
 }else if(m.region===10){
  const tanks=bodies(g).filter(q=>q.kind==='mark4-wedge');
  if(tanks.length){
   // All nine original tanks and their native weapons remain. Only their
   // drive destination changes from chasing the camera to a fixed rear line.
   m.defenseLine??={x:tanks.reduce((n,q)=>n+q.x,0)/tanks.length,y:Math.max(...tanks.map(q=>q.y))+1900};
   for(const tank of tanks){
    tank.mapAdvanceTarget={x:tank.anchorX??tank.x,y:m.defenseLine.y+180};
    if(!tank.mapBreach&&tank.y>=m.defenseLine.y&&live(tank)&&tank.tracks?.()>0&&!dead(tank,'engine-deck'))tank.mapBreach=true;
   }
   const breached=tanks.filter(t=>t.mapBreach).length,stopped=tanks.filter(t=>!t.mapBreach&&(t.dead||t.tracks?.()===0||dead(t,'engine-deck'))).length,goal=7;
   m.task=[`돌파대 저지 ${stopped}/${goal} · 방어선 돌파 ${breached}/3`,`Landships stopped ${stopped}/${goal} · breaches ${breached}/3`];m.detail=['궤도·엔진을 끊으세요 · 3대 돌파 시 실패','Break tracks or engines · three breaches fail'];
   guide(m,m.defenseLine,'최종 방어선','Last defense line','ally');for(const t of tanks.filter(t=>!t.mapBreach&&live(t)&&t.tracks?.()>0).sort((a,z)=>z.y-a.y).slice(0,2))guide(m,t,'선두 돌파대','Leading landship');
   if(breached>=3)return lost('방어선 붕괴 · 돌파대 저지 실패','Defense line breached by three landships');
   if(stopped>=goal)return won('랜드쉽 돌파대 저지 · 전선 사수','Landship breakthrough stopped');
  }else{
   const ids=['gun-left','gun-right','twin-aa'],n=ids.filter(id=>dead(b,id)).length;
   m.task=[`강점 화기 제압 ${n}/3`,`Strongpoint weapons silenced ${n}/3`];m.detail=['모두 제압하면 진격 지점 개방','All silenced opens the advance'];
   for(const id of ids)partGuide(m,b,id,'강점 포대','Strongpoint gun');
   if(b.dead||n===3)return exit(g,m,'진격 지점','Advance point',1000,false);
  }
 }else if(m.region===12){
  const control=b.kind==='fort-douaumont'?'control':'observer';
  const guns=b.kind==='fort-douaumont'?['heavy-left','heavy-right']:['bunker-left','bunker-right'];
  const n=guns.filter(id=>dead(b,id)).length,blind=dead(b,control);
  m.task=[`관측소 ${blind?'파괴됨':'남음'} · 보급로 포대 ${n}/2`,`Observation ${blind?'cut':'active'} · road batteries ${n}/2`];m.detail=['모두 제압하면 보급로 확보 지점 개방','All silenced opens the supply route'];
  partGuide(m,b,control,'포병 관측소','Artillery observation');for(const id of guns)partGuide(m,b,id,'보급로 위협 포대','Road-covering battery');
  if(b.dead||blind&&n===2)return exit(g,m,'보급로 확보 지점','Supply route',1000,false);
 }else if(m.region===15){
  const defend=m.faction!=='central',ids=defend?['bomb-bay-left','bomb-bay-right']:['generator-left','generator-right'];
  const n=ids.filter(id=>dead(b,id)).length;
  m.task=[`${defend?'폭탄창':'방공 발전기'} 파괴 ${n}/2`,`${defend?'Bomb bays':'Defense generators'} destroyed ${n}/2`];m.detail=[defend?'파리 피해가 한도에 닿으면 실패':'모두 끄면 야간 귀환 지점 개방',defend?'Paris damage at its limit fails the mission':'Both dark opens the night exit'];
  for(const id of ids)partGuide(m,b,id,defend?'폭탄창':'발전기',defend?'Bomb bay':'Generator');
  if(g.parisBattle?.role==='defend'&&g.parisBattle.cityDamage>=g.parisBattle.damageLimit)return lost('파리 방어 실패','Paris defense failed');
  if(b.dead||n===2){if(g.parisBattle)g.parisBattle.cleared=true;return defend?won('폭격 능력 상실 · 파리 방어 성공','Bombing capability destroyed · Paris defended'):exit(g,m,'야간 귀환 지점','Night exit',1500);}
 }
 return null;
}

function tickAdriatic(g,m,dt){
 if(!m.blockadeCleared){
  const opening=tickNavalMapMission(g,m,dt);
  if(!opening?.success)return opening;
  keepReachedExit(m);
  m.blockadeCleared=true;m.guides=[];
  m.bossApproachAt=Math.max(m.age,m.naval.openedAt+NAVAL_MISSION_BALANCE.blockadeSeconds);
  say(g,opening.reason[0]);
 }
 if(m.faction==='entente'&&!m.naval.sectors.some(s=>s.ships.some(live)))return lost('봉쇄선 방어 실패','Blockade lost');
 const encounter=g.stageBoss.stages.encounter;
 m.task=['적 기함 격침','Sink the enemy flagship'];
 const wait=Math.ceil(m.bossApproachAt-m.age);
 m.detail=encounter?['기함을 격침하면 작전 완료','Sink the flagship to complete the operation']:
  wait>0?[`적 기함 포착까지 ${wait}초`,`Flagship contact in ${wait}s`]:['적 기함 접근 중','Enemy flagship approaching'];
 return encounter?.completed?won('적 기함 격침 · 아드리아해 작전 완료','Flagship sunk · Adriatic operation complete'):null;
}

function tickHarborObjective(g,m,encounter){
 const route=g.navalRoute,convoy=g.zeebruggeRaid;
 const support=convoy?.mapMissionId===m.id
  ?(convoy.done&&!convoy.scuttled?['폐색선 전멸','Blockships lost']:
   [`폐색선 자침 ${convoy.scuttled}/3`,`Blockships scuttled ${convoy.scuttled}/3`])
  :null;
 const detail=(ko,en)=>m.detail=support?[ko+' · '+support[0],en+' · '+support[1]]:[ko,en];
 if(!encounter){
  const along=route?.maxForward||0;
  m.task=along<4200?['외해 함대를 지나 항만으로 진입','Fly past the fleet toward the harbor']:
   ['내항으로 진입해 요새 포대를 제압','Enter the inner harbor and silence its guns'];
  detail('최종 목표 · 장갑 항만요새 격파','Destroy the armored harbor fortress');
  if(route)guide(m,along>=9000&&route.fortressPreview?route.fortressPreview:at(route,route.a,along+1600),'요새 접근로','Fortress approach');
  return null;
 }
 if(encounter.completed)return won(...BOSS_OBJECTIVES[7]);
 const b=bodies(g)[0];if(!b)return null;
 const guns=['gun-front-left','gun-front-right','gun-left','gun-right'],silenced=guns.filter(id=>dead(b,id)).length;
 if(b.coreVulnerable){
  m.task=['노출된 요새 핵심부를 파괴하세요','Destroy the exposed fortress core'];
  detail(`해안포 ${silenced}/4문 제압`,`Coastal batteries silenced ${silenced}/4`);
  guide(m,harborPoint(b,0,-44),'요새 핵심부','Fortress core');
 }else{
  const breached=b.parts.get('crane-pivot')?.hittable;
  m.task=breached?['크레인 기반을 부숴 핵심부 노출','Break the crane base to expose the core']:
   ['해안포와 항만설비를 무력화하세요','Silence the guns and disable the harbor facilities'];
  detail(`해안포 ${silenced}/4문 제압`,`Coastal batteries silenced ${silenced}/4`);
  if(breached)partGuide(m,b,'crane-pivot','크레인 기반','Crane base');
  partGuide(m,b,'ammo-storage','탄약고 · 포격과 기뢰','Ammunition · guns and mines');
  partGuide(m,b,'seaplane-facility','격납고 · 수상기 출격','Hangar · seaplane sorties');
  partGuide(m,b,'crane-arm','크레인 · 기뢰 투척','Crane · mine throws');
 }
 for(const id of guns)partGuide(m,b,id,'해안포','Coastal battery');
 return null;
}

function tickBossObjective(g,m){
 const encounter=g.stageBoss.stages.encounter;
 if(m.region===7)return tickHarborObjective(g,m,encounter);
 m.task=BOSS_OBJECTIVES[m.region];
 m.detail=encounter?['요새의 실제 파괴로 작전을 완료하세요','Destroy the fortress to finish the operation']:
  ['전방의 요새에 접근하세요','Approach the fortress ahead'];
 if(!encounter&&m.region===14){
  const r=g.gallipoliRoute;
  if(r)guide(m,at(r,r.a,Math.max(0,r.maxForward||0)+1600),'요새 접근로','Fortress approach');
 }
 if(m.region===14&&encounter&&!encounter.completed){
  const b=bodies(g)[0];
  if(b?.coreVulnerable){
   m.detail=['지휘포대 노출 · 마지막 표적을 파괴하세요','Command exposed · destroy the final target'];
   guide(m,b,'지휘포대','Command post');
  }else if(b){
   m.detail=['탄약고를 부수면 해당 구역 포대 수리가 멈춥니다','Destroy ammunition depots to stop sector repairs'];
   const p=lead(g),parts=[...b.parts.values()].filter(q=>!q.destroyed&&q.hp>0);
   const ammo=parts.filter(q=>q.kind==='supply'),targets=ammo.length?ammo:parts.filter(q=>['gun','aa'].includes(q.kind));
   targets.sort((a,c)=>Math.hypot(b.x+a.x-p.x,b.y+a.y-p.y)-Math.hypot(b.x+c.x-p.x,b.y+c.y-p.y));
   for(const q of targets.slice(0,6))partGuide(m,b,q.id,q.kind==='supply'?'탄약고':'포대',q.kind==='supply'?'Ammunition depot':'Battery');
  }
 }
 return encounter?.completed?won(...BOSS_OBJECTIVES[m.region]):null;
}

export function tickMapMission(g,dt){
 if(!g||!host(g)||g.state!=='playing'||g.manualPaused||g.pendingLevelUps?.length||!(dt>0)||!lead(g))return;
 const m=ensureMapMission(g);if(!m)return;
 m.age+=Math.min(dt,.12);m.guides=[];
 if(m.resolved){m.exitReady=m.success&&m.age>=m.resolvedAt+1.6;return m;}
 let result;
 if(m.region===1)result=tickAdriatic(g,m,Math.min(dt,.12));
 else if(m.region===16)result=tickNavalMapMission(g,m,Math.min(dt,.12));
 else if(BOSS_OBJECTIVES[m.region])result=tickBossObjective(g,m);
 else if([9,13].includes(m.region))result=tickAirMapMission(g,m,Math.min(dt,.12));
 else if(m.region===6)result=tickAlpsObservation(g,m);
 else result=tickParts(g,m,Math.min(dt,.12));
 if(!result&&!m.blockadeCleared&&(!m.awaitContact||m.contactAt!=null)&&m.age>=m.limit)result=lost('제한시간 초과 · 작전 실패','Time expired · operation failed');
 if(result){
  m.resolved=true;m.success=!!result.success;m.status=m.success?'succeeded':'failed';m.resolvedAt=m.age;m.reason=result.reason;m.task=result.reason;m.detail=m.success?['작전 성공 · 다음 전장으로 이동','Mission complete · moving to the next battlefield']:['작전 실패','Mission failed'];
  if(m.success){keepReachedExit(m);say(g,result.reason[0]);}
  else{g.state='lost';g.score=(g.kills||0)*100+Math.floor(g.t||0)*10;g.event?.('end',result.reason[0]);}
 }
 return m;
}
export function mapMissionCard(g,en=false){
 if(g?.online&&!g.host){const c=g.mapMissionSnapshot?.cards?.[en?'en':'ko'];return c?{title:c[0],objective:c[1],meta:c[2],urgent:c[3],clock:c[4]||'',time:c[5]??null,fail:c[6]||'',state:c[7]||'active'}:null;}
 const m=g?.mapMission;if(!m||m.region!==g.stageBoss?.stages.stageIndex)return null;
 const lang=en?1:0,remaining=Math.max(0,Math.ceil(m.limit-m.age)),timed=Number.isFinite(m.limit)&&!m.blockadeCleared&&(!m.awaitContact||m.contactAt!=null);
 const clock=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
 const active=timed&&!m.resolved;
 return {title:(m.title||TITLES[m.region])[lang],objective:m.task?.[lang]||'',meta:(active?(en?`${clock} left · `:`남은 ${clock} · `):'')+(m.detail?.[lang]||''),urgent:active&&remaining<=20,clock:active?clock:'',time:active?Math.round(Math.max(0,Math.min(1,(m.limit-m.age)/Math.max(1,m.limit-(m.contactAt??0))))*100)/100:null,fail:m.detail?.[lang]||'',state:m.resolved?(m.success?'success':'failed'):'active'};
}
export function snapshotMapMission(g){
 const m=g?.mapMission;if(!m)return null;
 const card=en=>{const c=mapMissionCard(g,en);return c?[c.title,c.objective,c.meta,c.urgent,c.clock,c.time,c.fail,c.state]:null;};
 return {id:m.id,region:m.region,status:m.status,cards:{ko:card(false),en:card(true)},guides:m.guides.slice(0,6).map(q=>({x:q.x,y:q.y,label:q.label,kind:q.kind})),exitSignal:m.exitSignal??null};
}
