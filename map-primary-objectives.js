// Required battlefield objectives. The existing stage owner advances the front;
// this module only observes native parts, pilots and mission-owned units.
import {tickAirMapMission} from './map-air-missions.js';
import {tickNavalMapMission} from './map-naval-missions.js';

export const PRIMARY_MAPS=Object.freeze([0,1,2,5,6,7,8,9,10,12,14,15,16]);
const TITLES={0:['철도 보급 차단','Rail interdiction'],1:['해협 봉쇄전','Strait blockade'],2:['참호 돌파','Trench breakthrough'],5:['폭격대 요격','Bomber interception'],6:['산악 탈출','Mountain escape'],7:['운하 폐색 작전','Canal operation'],8:['돌파로 확보','Secure the breach'],9:['정찰기 귀환','Bring reconnaissance home'],10:['솜 전선','Somme front'],12:['베르됭 보급로 확보','Open the Verdun supply route'],14:['갈리폴리 철수','Gallipoli evacuation'],15:['파리 야간 작전','Paris night operation'],16:['유틀란트 함대전','Jutland fleet action']};
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
const won=(ko,en)=>({success:true,reason:[ko,en]});
const lost=(ko,en)=>({success:false,reason:[ko,en]});
const guide=(m,q,ko,en,kind='target')=>{if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))m.guides.push({...q,label:[ko,en],kind});};
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
 const m=g.mapMission={id:`map-${g.stageBoss.runId||'sortie'}-${key}`,key,region:s.stageIndex,faction:s.teamFaction||g.teamFaction||'entente',age:0,limit:120,status:'active',resolved:false,success:false,exitReady:false,origin:{x:p.x,y:p.y},heading:p.a??-Math.PI/2,title:TITLES[s.stageIndex],task:['작전 지역으로 진입하세요','Enter the operation area'],detail:['필수 목표를 달성해야 다음 전장으로 이동합니다','Complete the objective to reach the next battlefield'],guides:[],reservesEvents:[1,5,6,7,9,14,16].includes(s.stageIndex)};
 // Part-based objectives start their deadline at contact, preserving the
 // current opening fights and the normal boss approach/arrival sequence.
 m.awaitContact=[0,2,8,10,12,15].includes(m.region);
 if(m.region===1)m.suppressBoss=true;
 return m;
}

function exit(g,m,ko='귀환선',en='Exit',distance=950,reverse=true){
 if(!m.exit){m.exit=at(lead(g)||m.origin,m.heading+(reverse?Math.PI:0),distance);say(g,ko+' 개방 · 표시된 지점으로 이탈하세요');}
 guide(m,m.exit,ko,en,'exit');m.task=[ko+'에 도달하세요',`Reach the ${en.toLowerCase()}`];
 m.detail=['남은 적을 모두 격파할 필요는 없습니다','Remaining enemies may be left behind'];
 return near(g,m.exit)?won('작전 완료 · 전장 이탈','Objective complete · leaving battlefield'):null;
}
function combatBody(g,m){
 const b=bodies(g)[0];if(!b)return null;
 if(m.contactAt==null){m.contactAt=m.age;m.limit=m.age+120;}
 return b;
}
function spawn(g,m,type,pose,extra={}){
 if((g.enemies||[]).filter(live).length>=60)return null;
 const previous=g.bossMechanicSpawn;let e;
 try{g.bossMechanicSpawn=true;e=g.spawnEnemy?.(type);}finally{g.bossMechanicSpawn=previous;}
 if(e)Object.assign(e,pose,{mapMissionId:m.id,missionTarget:true},extra);
 return e;
}
function interceptCounterattack(g,m,dt){
 m.counter??={launched:0,stopped:0,escaped:0,targets:[],nextAt:m.age+2};
 const c=m.counter;
 if(c.launched<4&&m.age>=c.nextAt){
  const target=m.breach,side=c.launched%2?1:-1,origin=at(target,m.heading,1000,side*210),heading=Math.atan2(target.y-origin.y,target.x-origin.x);
  const e=spawn(g,m,'bomber',{...origin,a:heading},{eventExit:true,eventExitHeading:heading,speed:90,fire:1.2,mapExit:at(target,heading,250)});
  if(e){c.targets.push(e);c.launched++;c.nextAt=m.age+4;say(g,'역습기 접근 · 돌파로 진입 전에 요격하세요');}
 }
 for(const e of c.targets){if(e.mapResult)continue;if(!live(e)){e.mapResult='stopped';c.stopped++;continue;}
  guide(m,e,'역습기','Counterattack');
  const h=e.eventExitHeading,q=e.mapExit;if((e.x-q.x)*Math.cos(h)+(e.y-q.y)*Math.sin(h)>=0){e.mapResult='escaped';e.expired=true;e.hp=0;e.missionTarget=false;c.escaped++;say(g,'역습기 돌파 · '+c.escaped+'/2');}}
 m.task=[`역습기 저지 ${c.stopped}/3 · 돌파 ${c.escaped}/2`,`Counterattack stopped ${c.stopped}/3 · breaches ${c.escaped}/2`];
 m.detail=['2대가 돌파하면 작전 실패','Two breaches fail the operation'];guide(m,m.breach,'확보한 돌파로','Secured breach','ally');
 if(c.escaped>=2)return lost('돌파로 상실 · 역습 저지 실패','Breach lost · counterattack succeeded');
 if(c.stopped>=3)return won('역습 저지 · 돌파로 확보','Counterattack stopped · breach secured');
 return null;
}

function tickParts(g,m,dt){
 const b=combatBody(g,m);if(!b){m.task=['전방의 주요 표적을 찾으세요','Locate the main target ahead'];return null;}
 const parts=[...b.parts?.values()||[]];
 if(m.region===0){
  const rail=!!b.rail129?.broken||dead(b,'rail'),ammo=dead(b,'car-front');
  m.task=[`선로 ${rail?'차단':'파괴'} · 탄약차 ${ammo?'차단':'파괴'}`,`Track ${rail?'cut':'intact'} · ammunition ${ammo?'cut':'intact'}`];m.detail=['선로와 탄약차를 끊고 귀환 · 시간 초과 시 실패','Cut track and ammunition, then return · timeout fails'];
  partGuide(m,b,'rail','선로','Track');partGuide(m,b,'car-front','탄약차','Ammunition car');
  if(b.dead||rail&&ammo)return exit(g,m);
 }else if(m.region===2){
  const stopped=b.dead||dead(b,'engine-deck')||dead(b,'track-left')&&dead(b,'track-right');
  m.task=['궤도 양쪽 또는 엔진을 파괴해 돌파로를 여세요','Break both tracks or the engine to open a passage'];m.detail=['차체가 멈추면 전방 돌파 지점으로 이동','When the hull stops, reach the forward exit'];
  partGuide(m,b,'track-left','좌측 궤도','Left track');partGuide(m,b,'track-right','우측 궤도','Right track');
  if(stopped)return exit(g,m,'돌파 지점','Breakthrough',1100,false);
 }else if(m.region===8){
  const ids=b.kind==='fliegerzug'?['car-launch-a','car-launch-b']:['turret'];
  const done=b.dead||ids.every(id=>dead(b,id));
  if(!m.breach&&done){m.breach=at({x:b.x,y:b.y},m.heading,450);m.limit=Math.max(m.limit,m.age+45);say(g,'돌파로 개방 · 적 항공 역습이 접근합니다');}
  if(m.breach)return interceptCounterattack(g,m,dt);
  m.task=[b.kind==='fliegerzug'?'발진 객차 2량을 파괴하세요':'주포를 파괴해 돌파로를 여세요',b.kind==='fliegerzug'?'Destroy both launch cars':'Destroy the turret to open the breach'];m.detail=['공격 성공 후 역습까지 막아야 승리','Open the breach, then stop the counterattack'];
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
   const breached=tanks.filter(t=>t.mapBreach).length,stopped=tanks.filter(t=>!t.mapBreach&&(t.dead||t.tracks?.()===0||dead(t,'engine-deck'))).length,goal=Math.max(1,tanks.length-2);
   m.task=[`돌파대 저지 ${stopped}/${goal} · 방어선 돌파 ${breached}/3`,`Landships stopped ${stopped}/${goal} · breaches ${breached}/3`];m.detail=['궤도·엔진을 끊으세요 · 3대 돌파 시 실패','Break tracks or engines · three breaches fail'];
   guide(m,m.defenseLine,'최종 방어선','Last defense line','ally');for(const t of tanks.filter(t=>!t.mapBreach&&live(t)&&t.tracks?.()>0).sort((a,z)=>z.y-a.y).slice(0,2))guide(m,t,'선두 돌파대','Leading landship');
   if(breached>=3)return lost('방어선 붕괴 · 돌파대 저지 실패','Defense line breached by three landships');
   if(stopped>=goal)return won('랜드쉽 돌파대 저지 · 전선 사수','Landship breakthrough stopped');
  }else{
   const ids=['gun-left','gun-right','twin-aa'],n=ids.filter(id=>dead(b,id)).length;
   m.task=[`강점 화기 제압 ${n}/3`,`Strongpoint weapons silenced ${n}/3`];m.detail=['보루의 중화기를 끊은 뒤 열린 전선으로 진격','Silence the strongpoint and advance through the opening'];
   for(const id of ids)partGuide(m,b,id,'강점 포대','Strongpoint gun');
   if(b.dead||n===3)return exit(g,m,'진격 지점','Advance point',1000,false);
  }
 }else if(m.region===12){
  const control=b.kind==='fort-douaumont'?'control':'observer';
  const guns=b.kind==='fort-douaumont'?['heavy-left','heavy-right']:['bunker-left','bunker-right'];
  const n=guns.filter(id=>dead(b,id)).length,blind=dead(b,control);
  m.task=[`관측망 ${blind?'차단':'제압'} · 보급로 위협 포대 ${n}/2`,`Observation ${blind?'cut':'active'} · road batteries ${n}/2`];m.detail=['관측소와 양측 포대를 끊고 보급로를 확보하세요','Silence observation and both batteries covering the supply route'];
  partGuide(m,b,control,'포병 관측소','Artillery observation');for(const id of guns)partGuide(m,b,id,'보급로 위협 포대','Road-covering battery');
  if(b.dead||blind&&n===2)return exit(g,m,'보급로 확보 지점','Supply route',1000,false);
 }else if(m.region===15){
  const defend=m.faction!=='central',ids=defend?['bomb-bay-left','bomb-bay-right']:['generator-left','generator-right'];
  const n=ids.filter(id=>dead(b,id)).length;
  m.task=[`${defend?'폭탄창':'발전기'} 무력화 ${n}/2`,`${defend?'Bomb bays':'Generators'} disabled ${n}/2`];m.detail=[defend?'투하 능력을 없애면 도시 방어 성공':'방공망을 소등시킨 뒤 파리에서 이탈',defend?'Remove bombing capability to save the city':'Black out the defenses, then leave Paris'];
  for(const id of ids)partGuide(m,b,id,defend?'폭탄창':'발전기',defend?'Bomb bay':'Generator');
  if(g.parisBattle?.role==='defend'&&g.parisBattle.cityDamage>=g.parisBattle.damageLimit)return lost('파리 방어 실패','Paris defense failed');
  if(b.dead||n===2){if(g.parisBattle)g.parisBattle.cleared=true;return defend?won('폭격 능력 상실 · 파리 방어 성공','Bombing capability destroyed · Paris defended'):exit(g,m,'야간 귀환 지점','Night exit',1500);}
 }
 return null;
}

function clearMountainPoint(g,q){
 // Avoid placing a navigation target inside an authored collision peak.
 const mountains=g.alpsMountains;if(!mountains?.query)return q;
 for(const radius of [0,250,500,800])for(let i=0;i<(radius?12:1);i++){
  const p=at(q,i*Math.PI/6,radius),peaks=mountains.query({left:p.x-240,right:p.x+240,top:p.y-240,bottom:p.y+240});
  if(peaks.every(k=>Math.hypot(p.x-k.x,p.y-k.y)>(k.radius||0)+210))return p;
 }
 return q;
}
function tickEscape(g,m){
 if(!m.route){m.route=[[2600,-450],[5100,520],[7700,-150]].map(([d,n])=>clearMountainPoint(g,at(m.origin,m.heading,d,n)));m.routeIndex=0;m.limit=110;m.suppressBoss=false;m.nextChase=8;}
 const q=m.route[m.routeIndex];
 if(q&&near(g,q,220)){m.routeIndex++;say(g,'산악 통과 '+m.routeIndex+'/3 · 다음 탈출로로 이동');}
 if(m.routeIndex>=m.route.length)return won('산악 포위망 탈출','Escaped the mountain pursuit');
 const destination=m.route[m.routeIndex];guide(m,destination,`탈출로 ${m.routeIndex+1}/3`,`Escape route ${m.routeIndex+1}/3`,'exit');
 m.task=[`탈출로 통과 ${m.routeIndex}/3`,`Escape routes crossed ${m.routeIndex}/3`];m.detail=['추격기를 떼고 통과 · 제한시간 내 귀환 실패 시 패배','Break pursuit and pass every route · timeout fails'];
 if(m.age>=m.nextChase){m.nextChase=m.age+18;const p=lead(g);if(p&&(g.enemies||[]).filter(e=>e.mapMissionId===m.id&&live(e)).length<4){say(g,'산악 추격기 접근 · 탈출로를 따라 비행하세요');for(const side of [-1,1])spawn(g,m,'hunter',{...at(p,p.a+Math.PI,700,side*150),a:p.a},{fire:1.5});}}
 return null;
}

function tickAdriatic(g,m,dt){
 if(!m.blockadeCleared){
  const opening=tickNavalMapMission(g,m,dt);
  if(!opening?.success)return opening;
  m.blockadeCleared=true;m.suppressBoss=false;m.guides=[];
  say(g,opening.reason[0]+' · 적 기함 접근 중');
 }
 const encounter=g.stageBoss.stages.encounter;
 m.task=['적 기함 격침','Sink the enemy flagship'];
 m.detail=encounter?['기함을 격침하면 작전 완료','Sink the flagship to complete the operation']:['적 기함 접근 중','Enemy flagship approaching'];
 return encounter?.completed?won('적 기함 격침 · 아드리아해 작전 완료','Flagship sunk · Adriatic operation complete'):null;
}

export function tickMapMission(g,dt){
 if(!g||!host(g)||g.state!=='playing'||g.manualPaused||g.pendingLevelUps?.length||!(dt>0)||!lead(g))return;
 const m=ensureMapMission(g);if(!m)return;
 m.age+=Math.min(dt,.12);m.guides=[];
 if(m.resolved){m.exitReady=m.success&&m.age>=m.resolvedAt+1.6;return m;}
 let result;
 if(m.region===1)result=tickAdriatic(g,m,Math.min(dt,.12));
 else if([7,14,16].includes(m.region))result=tickNavalMapMission(g,m,Math.min(dt,.12));
 else if([5,9].includes(m.region))result=tickAirMapMission(g,m,Math.min(dt,.12));
 else if(m.region===6)result=tickEscape(g,m);
 else result=tickParts(g,m,Math.min(dt,.12));
 if(!result&&!m.blockadeCleared&&(!m.awaitContact||m.contactAt!=null)&&m.age>=m.limit)result=lost('제한시간 초과 · 작전 실패','Time expired · operation failed');
 if(result){
  m.resolved=true;m.success=!!result.success;m.status=m.success?'succeeded':'failed';m.resolvedAt=m.age;m.reason=result.reason;m.task=result.reason;m.detail=m.success?['다음 전장으로 이동합니다','Proceeding to the next battlefield']:['필수 목표를 달성하지 못했습니다','The required objective was not achieved'];
  if(m.success)say(g,result.reason[0]);
  else{g.state='lost';g.score=(g.kills||0)*100+Math.floor(g.t||0)*10;g.event?.('end',result.reason[0]);}
 }
 return m;
}
export function mapMissionCard(g,en=false){
 if(g?.online&&!g.host){const c=g.mapMissionSnapshot?.cards?.[en?'en':'ko'];return c?{title:c[0],objective:c[1],meta:c[2],urgent:c[3]}:null;}
 const m=g?.mapMission;if(!m||m.region!==g.stageBoss?.stages.stageIndex)return null;
 const lang=en?1:0,remaining=Math.max(0,Math.ceil(m.limit-m.age)),timed=!m.blockadeCleared&&(!m.awaitContact||m.contactAt!=null);
 return {title:(m.title||TITLES[m.region])[lang],objective:m.task?.[lang]||'',meta:(timed&&!m.resolved?`${remaining}s · `:'')+(m.detail?.[lang]||''),urgent:timed&&!m.resolved&&remaining<=20};
}
export function snapshotMapMission(g){
 const m=g?.mapMission;if(!m)return null;
 const card=en=>{const c=mapMissionCard(g,en);return c?[c.title,c.objective,c.meta,c.urgent]:null;};
 return {id:m.id,region:m.region,status:m.status,cards:{ko:card(false),en:card(true)},guides:m.guides.slice(0,6).map(q=>({x:q.x,y:q.y,label:q.label,kind:q.kind}))};
}
