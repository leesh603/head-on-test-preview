// The map objective owns the route and result; existing aircraft movement,
// targeting, bullets and patrol damage own every combat interaction.
export const AIR_MAP_MISSION_BALANCE=Object.freeze({
 skyWaves:3,skyWaveSize:3,skyGoal:7,skyLeaks:3,skyWarning:3,skyGap:18,skyLimit:112,
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

function warnSkyWave(g,m){
 const s=m.air,p=pilot(g);if(!p)return;
 const heading=(p.a??-Math.PI/2)+(s.waves%2?-1:1)*Math.PI/2,v=viewport(g);
 const center=at(p,p.a??-Math.PI/2,160),span=Math.hypot(v.w,v.h)+240;
 s.pending={heading,center,span,spawned:0,at:m.age+B.skyWarning,nextTry:0};
 say(g,`폭격 편대 ${s.waves+1}/${B.skyWaves}파 접근 · 진입 반대편으로 돌파하기 전에 요격하세요`);
}

function launchSkyWave(g,m){
 const s=m.air,q=s.pending;if(!q||m.age<q.at||m.age<q.nextTry)return;
 const left=B.skyWaveSize-q.spawned;
 if(!room(g,left)){q.nextTry=m.age+1;return;}
 for(let i=q.spawned;i<B.skyWaveSize;i++){
  const e=spawn(g,'bomber');if(!e){q.nextTry=m.age+1;return;}
  const side=(i-1)*105,back=Math.abs(i-1)*85,origin=at(at(q.center,q.heading,-q.span-back),q.heading+Math.PI/2,side);
  const exitDistance=q.span*2+220+back;
  Object.assign(e,{...origin,a:q.heading,mapMissionId:m.id,mapAirBomber:true,missionTarget:true,
   faction:m.faction==='central'?'entente':'central',ace:false,arrivalAuthored:true,arrivalPending:false,
   eventExit:true,eventExitHeading:q.heading,eventExitOrigin:{...origin},eventExitDistance:exitDistance,
   frontRoute:at(origin,q.heading,exitDistance+1800),fire:1.3+i*.25,altitude:pilot(g)?.altitude});
  // A fixed cruise gives every bounded wave time to cross the interception lane.
  e.speed=Math.max(110,Math.min(150,e.speed||110));s.targets.push(e);q.spawned++;
 }
 s.waves++;s.nextAt=m.age+B.skyGap;s.pending=null;
}

function tickSky(g,m){
 const s=m.air;
 for(const e of s.targets){
  if(e.mapAirResult)continue;
  // Crash animation and corpse drift beyond the exit never become a leak.
  if(e.hp<=0||e.deathHandled||e.deathCounted||e.crashing||e.crashed){e.mapAirResult='down';s.down++;continue;}
  const a=e.eventExitHeading,o=e.eventExitOrigin,travel=(e.x-o.x)*Math.cos(a)+(e.y-o.y)*Math.sin(a);
  if(travel>=e.eventExitDistance||e.expired){
   e.mapAirResult='escaped';e.missionTarget=false;e.eventExit=false;e.expired=true;s.escaped++;
   const index=g.enemies?.indexOf(e)??-1;if(index>=0)g.enemies.splice(index,1);
   say(g,`폭격기 돌파 ${s.escaped}/${B.skyLeaks} · 3대 돌파 시 임무 실패`);
  }
 }
 const active=s.targets.filter(e=>!e.mapAirResult);
 m.title=['고공 폭격 편대 요격','HIGH-ALTITUDE INTERCEPTION'];
 m.task=[`폭격기 ${s.down}/${B.skyGoal}대 요격 · 돌파 ${s.escaped}/${B.skyLeaks}`,`Bombers down ${s.down}/${B.skyGoal} · Escaped ${s.escaped}/${B.skyLeaks}`];
 m.detail=[`${s.waves}/${B.skyWaves}파 · 비행선은 엄호 전력입니다`,`Wave ${s.waves}/${B.skyWaves} · The airship covers the raid`];
 m.guides=active.map(e=>({x:e.x,y:e.y,kind:'target',label:['요격 표적','INTERCEPT']}));
 if(s.escaped>=B.skyLeaks)return finish(m,false,'폭격기 3대 돌파 · 요격선 붕괴','Three bombers escaped · interception line lost');
 if(s.down>=B.skyGoal)return finish(m,true,'폭격기 7대 요격 · 공습 저지','Seven bombers intercepted · raid stopped');
 if(m.age>=m.limit)return finish(m,false,'요격 시간 초과','Interception time expired');
 if(!s.pending&&s.waves<B.skyWaves&&!active.length&&m.age>=s.nextAt)warnSkyWave(g,m);
 launchSkyWave(g,m);
 if(s.pending)m.detail=[`${s.waves+1}파 접근 · ${Math.max(0,Math.ceil(s.pending.at-m.age))}초`,`Wave ${s.waves+1} approaching · ${Math.max(0,Math.ceil(s.pending.at-m.age))}s`];
 return null;
}

function beginRecon(g,m,p){
 const heading=p.a??-Math.PI/2,v=viewport(g),start=at(p,heading,-Math.hypot(v.w,v.h)-140);
 const route=[at(p,heading,850),at(at(p,heading,2050),heading+Math.PI/2,310),at(at(p,heading,3250),heading-Math.PI/2,240)];
 const exit=at(p,heading,-550);
 const scout={...start,a:heading,plane:m.faction==='central'?'dfw_cv':'re8',faction:m.faction,
  name:m.faction==='central'?'DFW C.V 사진정찰기':'R.E.8 사진정찰기',mapMissionId:m.id,operationTarget:true,
  hp:B.reconHp,maxHp:B.reconHp,life:Infinity,speed:B.reconSpeed,altitude:p.altitude,
  fire:.4,invuln:0,hitFlash:0,think:0,pass:0,target:null,frontEscortRoute:route[0],waypoint:route[0]};
 (g.patrols??=[]).push(scout);
 m.air={kind:'recon',scout,route,exit,photos:0,hold:0,threats:[],sweeps:0,nextSweepAt:m.age+9,aceDueAt:null,aceTriedAt:-Infinity};
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
 const s=m.air,target=s.scout;if(!room(g,1)||s.threats.filter(alive).length>=B.reconThreatCap)return null;
 const e=spawn(g,type);if(!e)return null;
 const position=pursuerPosition(g,target,side);
 Object.assign(e,{...position,a:Math.atan2(target.y-position.y,target.x-position.x),mapMissionId:m.id,
  missionTarget:true,operationEscortTarget:target,arrivalAuthored:true,arrivalPending:false,
  fire:1.2,altitude:target.altitude,...(type==='boss'?{eventAce:true,operationAce:true}:{})});
 s.threats.push(e);return e;
}

function reconPressure(g,m){
 const s=m.air;
 if(s.sweeps<2&&m.age>=s.nextSweepAt){
  if(s.threats.filter(alive).length<=B.reconThreatCap-2&&room(g,2)){
   const made=[sendPursuer(g,m,'hunter',-1),sendPursuer(g,m,'hunter',1)].filter(Boolean);
   if(made.length){s.sweeps++;s.nextSweepAt=m.age+23;say(g,'적 추격 편대 접근 · 정찰기의 후방을 지키세요');}
   else s.nextSweepAt=m.age+2;
  }else s.nextSweepAt=m.age+2;
 }
 if(s.photos>=2&&s.aceDueAt==null){s.aceDueAt=m.age+4;say(g,'적 에이스 접근 · 촬영을 마친 정찰기를 추격합니다');}
 if(s.aceDueAt!=null&&!s.ace&&m.age>=s.aceDueAt&&m.age-s.aceTriedAt>=2){
  s.aceTriedAt=m.age;s.ace=sendPursuer(g,m,'boss',1);
 }
}

function tickRecon(g,m,dt){
 const s=m.air,p=s.scout,returning=s.photos>=s.route.length;
 m.title=['아라스 사진정찰 호위','ARRAS RECONNAISSANCE ESCORT'];
 m.task=returning?['정찰기를 아군 전선까지 귀환시키세요','Escort the reconnaissance aircraft home']:[`촬영 ${s.photos}/3 · 정찰기가 촬영 구역에서 3초 체공`,`Photos ${s.photos}/3 · Keep the aircraft in each photo area for 3s`];
 m.detail=[`정찰기 ${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}`+(returning?' · 귀환 중':` · 촬영 ${s.hold.toFixed(1)}/3초`),`Aircraft ${Math.max(0,Math.ceil(p.hp))}/${p.maxHp}`+(returning?' · Returning':` · Photo ${s.hold.toFixed(1)}/3s`)];
 const target=returning?s.exit:s.route[s.photos];
 m.guides=[{x:p.x,y:p.y,kind:'ally',label:['정찰기 엄호','PROTECT RECON']},{...target,kind:returning?'exit':'target',label:returning?['귀환 지점','RETURN POINT']:[`촬영 ${s.photos+1}/3`,`PHOTO ${s.photos+1}/3`]}];
 if(!alive(p)||!g.patrols?.includes(p))return finish(m,false,'정찰기 상실 · 촬영 자료 소실','Reconnaissance aircraft lost · photographs lost');
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
 if(!g||!m||![5,9].includes(m.region)||g.state!=='playing'||g.online&&!g.host||!(dt>0))return null;
 if(m.air?.result)return m.air.result;
 if(m.status!=='active')return null;
 const p=pilot(g);if(!p)return null;
 if(!m.air){
  if(m.region===5){m.limit=B.skyLimit;m.air={kind:'intercept',waves:0,targets:[],down:0,escaped:0,nextAt:m.age,pending:null};}
  else{m.limit=B.reconLimit;beginRecon(g,m,p);}
 }
 return m.region===5?tickSky(g,m):tickRecon(g,m,Math.min(.1,dt));
}
