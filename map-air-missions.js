// The map objective owns the route and result; existing aircraft movement,
// targeting, bullets and patrol damage own every combat interaction.
import {registerMaanReconFacility} from './ground-facility-missions.js?v=b3bf991d11fc7798';
export const AIR_MAP_MISSION_BALANCE=Object.freeze({
 arrasTotal:9,arrasWave:3,arrasGoal:6,arrasGap:22,arrasLimit:105,
 reconHp:240,reconSpeed:132,reconPhotoRadius:180,reconPhotoSeconds:3,reconExitRadius:170,reconLimit:110,reconThreatCap:4
});
const B=AIR_MAP_MISSION_BALANCE;
const alive=e=>!!e&&e.hp>0&&!e.expired&&!e.crashing&&!e.crashed&&e.life!==0;
const pilot=g=>(g.players||[g]).find(p=>alive(p)&&p.status!=='downed');
const at=(p,a,d)=>({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const viewport=g=>{const z=Math.max(.1,g.camera?.zoom||1);return{x:g.mode==='coop2'?(g.camera?.x??g.x):g.x,y:g.mode==='coop2'?(g.camera?.y??g.y):g.y,w:(g.viewWidth||960)/(2*z),h:(g.viewHeight||700)/(2*z)};};
const room=(g,n)=>{const limit=Math.min(65,g.enemyCapacity?.()??65);return(g.enemies||[]).filter(alive).length+n<=limit;};
const say=(g,text)=>g.event?.('wave',text);
const finish=(m,success,ko,en)=>(m.air.result??={success,reason:[ko,en]});

function spawn(g,type){
 const before=(g.enemies||[]).length,flags=[g.directorSpawning,g.bossMechanicSpawn,g.battlefieldEventSpawning];
 // Reuse the same finite mission reservation as the native interception event.
 g.directorSpawning=true;g.bossMechanicSpawn=true;g.battlefieldEventSpawning=true;
 try{return g.spawnEnemy?.(type)||((g.enemies||[]).length>before?g.enemies.at(-1):null);}
 finally{[g.directorSpawning,g.bossMechanicSpawn,g.battlefieldEventSpawning]=flags;}
}

function missionPlane(m,start,heading,route,altitude){
 return {...start,a:heading,plane:'re8',faction:'entente',name:'R.E.8 임무기',mapMissionId:m.id,operationTarget:true,
  hp:180,maxHp:180,life:Infinity,speed:150,altitude,fire:.4,invuln:0,hitFlash:0,think:0,pass:0,target:null,frontEscortRoute:route,waypoint:route};
}
function tickArras(g,m){
 const s=m.air,protect=m.faction==='entente',heading=m.heading,p=pilot(g),altitude=p.altitude;
 if(s.launched<B.arrasTotal&&m.age>=s.nextAt){
  const lane=(s.launched%B.arrasWave-1)*155;
  const start=at(at(m.origin,heading,-700),heading+Math.PI/2,lane),exit=at(start,heading,6900);
  const e=protect?missionPlane(m,start,heading,exit,altitude):spawn(g,'bomber');
  if(e){
   if(protect)(g.patrols??=[]).push(e);
   else Object.assign(e,{...start,a:heading,escortPlane:'re8',faction:'entente',hp:180,maxHp:180,altitude,speed:150,
    mapMissionId:m.id,missionTarget:true,arrivalAuthored:true,arrivalPending:false,airArrival:null,frontRoute:at(exit,heading,1000)});
   s.planes.push({e,exit});s.launched++;
   s.nextAt=m.age+(s.launched%B.arrasWave===0?B.arrasGap:.45);
  }
 }
 for(const q of s.planes){
  const {e,exit}=q;if(q.result)continue;
  if(e.hp<=0||e.crashing||e.crashed){q.result='down';s.down++;continue;}
  if(e.expired||!(protect?g.patrols:g.enemies)?.includes(e)){q.result='missing';continue;}
  const dx=e.x-exit.x,dy=e.y-exit.y;
  if(dx*Math.cos(heading)+dy*Math.sin(heading)>=-95&&Math.abs(dy*Math.cos(heading)-dx*Math.sin(heading))<=165){
   q.result='home';s.home++;e.expired=true;e.missionTarget=false;
   const list=protect?g.patrols:g.enemies;list.splice(list.indexOf(e),1);
  }
 }
 const active=s.planes.filter(q=>!q.result),progress=protect?s.home:s.down;
 m.task=protect?['임무기 안전 귀환 '+progress+'/'+B.arrasGoal,'Mission aircraft returned '+progress+'/'+B.arrasGoal]:
  ['적 임무기 격추 '+progress+'/'+B.arrasGoal,'Mission aircraft intercepted '+progress+'/'+B.arrasGoal];
 m.detail=['임무기 출격 '+s.launched+'/'+B.arrasTotal,'Mission aircraft launched '+s.launched+'/'+B.arrasTotal];
 m.guides=active.map(({e})=>({x:e.x,y:e.y,kind:protect?'ally':'target',label:['임무기','MISSION AIRCRAFT']}));
 if(protect&&active.length&&m.age>=s.nextSweep){
  const target=active[0].e;
  for(const side of [-1,1]){const e=spawn(g,'hunter');if(e){const q=pursuerPosition(g,target,side);Object.assign(e,{...q,a:Math.atan2(target.y-q.y,target.x-q.x),mapMissionId:m.id,operationEscortTarget:target,altitude,airArrival:null,arrivalAuthored:true,arrivalPending:false});}}
  s.nextSweep=m.age+14;
 }
 if(progress>=B.arrasGoal&&g.stageBoss.stages.encounter)return finish(m,true,'아라스 제공 임무 성공','Arras air mission complete');
 if(progress+active.length+B.arrasTotal-s.launched<B.arrasGoal)return finish(m,false,'아라스 제공 임무 실패','Arras air mission failed');
 return null;
}

function beginRecon(g,m,p){
 const heading=p.a??-Math.PI/2,v=viewport(g),start=at(p,heading,-Math.hypot(v.w,v.h)-140);
 const facilities=[registerMaanReconFacility(g,m,'airfield',at(p,heading,1000)),
  registerMaanReconFacility(g,m,'signal',at(at(p,heading,2900),heading+Math.PI/2,310))];
 const route=[...facilities,null];
 const exit=at(p,heading,-550);
 const scout={...start,a:heading,plane:m.faction==='central'?'dfw_cv':'re8',faction:m.faction,
  name:m.faction==='central'?'DFW C.V 사진정찰기':'R.E.8 사진정찰기',mapMissionId:m.id,operationTarget:true,
  hp:B.reconHp,maxHp:B.reconHp,life:Infinity,speed:B.reconSpeed,altitude:p.altitude,
  fire:.4,invuln:0,hitFlash:0,think:0,pass:0,target:null,frontEscortRoute:route[0],waypoint:route[0]};
 (g.patrols??=[]).push(scout);
 m.air={kind:'recon',scout,route,facilities,exit,photos:0,hold:0,threats:[],sweeps:0,nextSweepAt:m.age+9,aceDueAt:null,aceTriedAt:-Infinity};
 say(g,'정찰기 합류 · 촬영 지점 3곳을 엄호한 뒤 아군 전선까지 귀환시키세요');
}

function pursuerPosition(g,target,side){
 // Cross the reconnaissance route from its forward flanks. Slower early-war
 // fighters get a real interception pass instead of chasing forever astern.
 const heading=(target.a??0)+side*1.05,v=viewport(g);
 let p=at(target,heading,560);
 // A visible contact approaches from outside the current camera, without a warp.
 if(Math.abs(p.x-v.x)<v.w+95&&Math.abs(p.y-v.y)<v.h+95)p=at(target,heading,Math.hypot(v.w,v.h)+distance(target,v)+150);
 return p;
}

function sendPursuer(g,m,type,side){
 const s=m.air,target=s.scout,cap=type==='boss'?B.reconThreatCap:B.reconThreatCap-1;
 if(!room(g,1)||s.threats.filter(alive).length>=cap)return null;
 const e=spawn(g,type);if(!e)return null;
 const position=pursuerPosition(g,target,side);
 Object.assign(e,{...position,a:Math.atan2(target.y-position.y,target.x-position.x),mapMissionId:m.id,
  missionTarget:true,operationEscortTarget:target,arrivalAuthored:true,arrivalPending:false,
  fire:1.2,altitude:target.altitude,...(type==='boss'?{eventAce:true,operationAce:true}:{})});
 s.threats.push(e);return e;
}

function reconPressure(g,m){
 const s=m.air;
 if(s.sweeps<(s.facilities[0].destroyed?1:2)&&m.age>=s.nextSweepAt){
  if(s.threats.filter(alive).length<=B.reconThreatCap-2&&room(g,2)){
   const made=[sendPursuer(g,m,'hunter',-1),sendPursuer(g,m,'hunter',1)].filter(Boolean);
   if(made.length){s.sweeps++;s.nextSweepAt=m.age+23;say(g,'적 추격 편대 접근 · 정찰기의 후방을 지키세요');}
   else s.nextSweepAt=m.age+2;
  }else s.nextSweepAt=m.age+2;
 }
 if(s.photos>=2&&!s.facilities[1].destroyed&&s.aceDueAt==null){s.aceDueAt=m.age+4;say(g,'적 에이스 접근 · 촬영을 마친 정찰기를 추격합니다');}
 if(s.aceDueAt!=null&&!s.facilities[1].destroyed&&!s.ace&&m.age>=s.aceDueAt&&m.age-s.aceTriedAt>=2){
  s.aceTriedAt=m.age;s.ace=sendPursuer(g,m,'boss',1);
 }
}

function tickRecon(g,m,dt){
 const s=m.air,p=s.scout,returning=s.photos>=s.route.length;
 if(!alive(p)||!g.patrols?.includes(p))return finish(m,false,'정찰기 상실 · 촬영 자료 소실','Reconnaissance aircraft lost · photographs lost');
 const landship=[...g.stageBoss.stages.encounter?.bodies?.values()||[]].find(b=>['wustenpanzer','sinai-landship'].includes(b.kind));
 if(landship&&!landship.arrivalPending)s.route[2]={x:landship.x,y:landship.y};
 m.task=returning?['정찰기를 아군 전선까지 귀환시키세요','Escort the reconnaissance aircraft home']:[`촬영 ${s.photos}/3 · 정찰기가 촬영 구역에서 3초 체공`,`Photos ${s.photos}/3 · Keep the aircraft in each photo area for 3s`];
 m.detail=[`정찰기 ${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}`+(returning?' · 귀환 중':` · 촬영 ${s.hold.toFixed(1)}/3초`),`Aircraft ${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}`+(returning?' · Returning':` · Photo ${s.hold.toFixed(1)}/3s`)];
 const target=returning?s.exit:s.route[s.photos];
 if(!target){p.frontEscortRoute=s.route[1];m.detail=['육상함 집결지 식별 중','Locating the landship position'];reconPressure(g,m);return null;}
 const names=[['격납고','Hangar'],['통신본부','Signal HQ'],['중포·육상함 집결지','Landship artillery position']];
 m.guides=[{x:p.x,y:p.y,kind:'ally',label:['정찰기 엄호','PROTECT RECON']},{...target,kind:returning?'exit':'target',label:returning?['귀환 지점','RETURN POINT']:names[s.photos]}];
 if(returning){
  p.frontEscortRoute=s.exit;
  if(distance(p,s.exit)<=B.reconExitRadius)return finish(m,true,'정찰기 귀환 · 촬영 자료 확보','Reconnaissance aircraft home · photographs secured');
 }else{
  const d=distance(p,target);
  if(d<=B.reconPhotoRadius){
   s.hold+=dt;
   // The existing patrol follows a short orbit waypoint while its camera works.
   const a=d>1?Math.atan2(p.y-target.y,p.x-target.x):p.a;
   p.frontEscortRoute=at(target,a+.95,125);
   if(s.hold>=B.reconPhotoSeconds){
    s.photos++;s.hold=0;p.frontEscortRoute=s.route[s.photos]||s.exit;
    say(g,s.photos===3?'사진 촬영 완료 · 정찰기 귀환을 엄호하세요':`촬영 ${s.photos}/3 완료 · 다음 관측 지점으로 이동`);
   }
  }else{s.hold=0;p.frontEscortRoute=target;}
 }
 if(m.age>=m.limit)return finish(m,false,'정찰기 귀환 시간 초과','Reconnaissance return time expired');
 reconPressure(g,m);return null;
}

export function tickAirMapMission(g,m,dt){
 if(!g||!m||![9,13].includes(m.region)||g.state!=='playing'||g.online&&!g.host||!(dt>0))return null;
 if(m.air?.result)return m.air.result;
 if(m.status!=='active')return null;
 const p=pilot(g);if(!p)return null;
 if(!m.air){
  if(m.region===9){m.limit=B.arrasLimit;m.air={kind:'sortie',planes:[],launched:0,down:0,home:0,nextAt:m.age,nextSweep:8};}
  else{m.limit=B.reconLimit;beginRecon(g,m,p);}
 }
 return m.region===9?tickArras(g,m):tickRecon(g,m,Math.min(.1,dt));
}
