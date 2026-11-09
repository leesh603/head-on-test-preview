import {doverPatrolChart,doverCliffRoute} from './dover-patrol-chart.js?v=dover3';
import {beginAircraftCrash,advanceAircraftCrash} from './aircraft-crash.js?v=descent20261022';

// Mission tuning lives here; counts, thresholds and pace can be adjusted together.
export const DOVER_BREAKTHROUGH_BALANCE=Object.freeze({total:18,waveSize:6,maxActive:12,interceptGoal:12,escortGoal:10,routeLength:11200,speed:205,hp:260,waveGap:15,waveProgress:.2,fighterCap:6,fighterInterval:10,coastProgress:.76,resultSeconds:4});
const BOSS_SEPARATION=3.2;
const live=b=>b?.hp>0&&!b.doverResult&&!b.expired&&!b.crashing;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const region=g=>g.stageBoss?.stages.stageIndex??g.worldRegion?.()??g.region;
const hero=g=>g.players?.find(p=>p.hp>0)||g;
export const doverMissionActive=g=>region(g)===17&&!!g.doverMission&&!g.doverMission.resolved;
export function doverBomberFrames(g){
 if(!doverMissionActive(g)||g.doverMission.faction!=='central')return [];
 return g.doverMission.bombers.filter(live).map(b=>({id:b.id,alive:true,hp:b.hp,maxHp:b.maxHp,x:b.x,y:b.y,a:b.a,vx:b.vx,vy:b.vy,radius:b.hitRadius,doverBomber:true}));
}
export function doverCombatTarget(g,e){
 if(!doverMissionActive(g)||g.doverMission.faction!=='central'||!e?.doverInterceptor)return null;
 let target=null,distance=Infinity;
 for(const b of g.doverMission.bombers)if(live(b)){const d=(b.x-e.x)**2+(b.y-e.y)**2;if(d<distance){target=b;distance=d;}}
 return target;
}
export function damageDoverBomber(g,target,damage,source){
 const m=g.doverMission,b=typeof target==='object'?target:m?.bombers.find(b=>b.id===target);
 if(!m||m.resolved||!live(b)||!Number.isFinite(damage)||damage<=0)return false;
 b.hp=Math.max(0,b.hp-damage);b.previousHp=b.hp;b.lastHitAt=g.t||0;b.hitFlash=.22;
 // The engine model is shared by hostile player rounds and friendly convoy hits.
 b.damageSource=source;return true;
}
export function clearDoverMission(g){
 g.enemies=(g.enemies||[]).filter(e=>!e.doverBomber&&!e.doverEscort&&!e.doverInterceptor);
 g.bullets=(g.bullets||[]).filter(b=>!b.doverOwned);
 g.doverMission=null;
}
function createMission(g){
 const cfg={...DOVER_BREAKTHROUGH_BALANCE,...g.doverMissionConfig};
 cfg.total=clamp(Math.round(cfg.total),1,36);cfg.waveSize=clamp(Math.round(cfg.waveSize),1,6);cfg.maxActive=Math.max(cfg.waveSize,Math.min(12,Math.round(cfg.maxActive)));
 cfg.interceptGoal=clamp(Math.round(cfg.interceptGoal),1,cfg.total);cfg.escortGoal=clamp(Math.round(cfg.escortGoal),1,cfg.total);
 const spawnY=g.y-(g.viewHeight||700)/2-180;
 const m={config:cfg,faction:g.stageBoss?.stages.teamFaction||g.teamFaction||'entente',bombers:[],waves:0,spawned:0,shotDown:0,arrived:0,time:0,lastWaveAt:-cfg.waveGap,nextFighterAt:3,spawnY,destinationY:spawnY-cfg.routeLength,bossReady:false,bossDefeated:false,resolved:false,progress:0};
 g.doverMission=m;doverPatrolChart(g);
 g.event?.('wave',m.faction==='central'?`해협 돌파전 · 폭격기 ${cfg.escortGoal}대 호위`:`해협 돌파전 · 폭격기 ${cfg.interceptGoal}대 격추`);
 return m;
}
function spawnFighters(g,m,number){
 const active=m.bombers.filter(live);if(!active.length)return;
 const cap=m.bossDefeated?2:m.config.fighterCap;
 let count=(g.enemies||[]).filter(e=>e.hp>0&&(e.doverEscort||e.doverInterceptor)).length;
 const prior=g.directorSpawning;g.directorSpawning=true;
 try{for(let i=0;i<number&&count<cap&&(g.enemies?.length||0)<60;i++){
  const e=g.spawnEnemy?.('hunter');if(!e)break;
  const b=active[(count+i)%active.length],side=i%2?1:-1;
  Object.assign(e,{doverEscort:m.faction==='entente',doverInterceptor:m.faction==='central',faction:m.faction==='central'?'entente':'central',arrivalAuthored:true,arrivalPending:false,x:b.x+side*420,y:b.y-580,a:Math.PI/2,fire:1.1+i*.3,escortPlane:m.faction==='central'?'camel':'albatros_d5a'});
  delete e.airArrival;delete e.directorSceneId;delete e.directorFormation;delete e.directorSquad;
  if(m.faction==='entente'){e.formationLeader=b;e.formationBack=85;e.formationOffset=side*130;}
  count++;
 }}finally{g.directorSpawning=prior;}
}
function spawnWave(g,m){
 const c=m.config,count=Math.min(c.waveSize,c.total-m.spawned),chart=doverPatrolChart(g);
 for(let i=0;i<count;i++){
  const row=Math.floor(i/3),lane=i%3-1,y=m.spawnY+row*170,route=doverCliffRoute(chart,y,560,0),hp=Math.round(c.hp*(1+Math.min(2,(g.t||0)/500))*(g.players?1.35:1));
  const b={id:`dover-bomber-${g.stageBoss?.stages.loopIndex||0}-${m.spawned+i}`,doverBomber:true,missionTarget:true,arrivalAuthored:true,type:'bomber',heavyBomber:true,airframe:'gotha',escortPlane:'gotha',faction:'central',name:'고타 G.V · 해협 돌파',wave:m.waves,hp,maxHp:hp,previousHp:hp,x:route.x+lane*145,y,a:-Math.PI/2,vx:0,vy:-c.speed,speed:c.speed,hitRadius:45,contactRadius:36,fire:Infinity,hitFlash:0,engineDamage:0,smokeTimer:0,progress:0,spawnY:y};
  m.bombers.push(b);if(m.faction==='entente')(g.enemies??=[]).push(b);
 }
 m.spawned+=count;m.waves++;m.lastWaveAt=m.time;
 if(m.spawned===c.total)m.bossApproachAt=m.time+BOSS_SEPARATION;
 g.event?.('wave',`폭격기 ${m.waves}편대 접근 · ${m.spawned}/${c.total}`);spawnFighters(g,m,m.spawned===c.total?5:3);
}
function downBomber(g,m,b){
 if(b.doverResult)return;b.doverResult='shotDown';b.missionTarget=false;m.shotDown++;
 // Preserve the game's painted aircraft crash, smoke and heavy explosion assets.
 if(!b.crashing&&!b.crashed){b.crashStyle='spin';beginAircraftCrash(b,g.rng||Math.random);b.crashDuration=b.crashT=1.7;}
 g.combatBlast?.(b.x,b.y,48,m.faction==='central'?'enemy':'friendly','aircraftMedium');
}
function settleMission(g,m){
 if(m.rewarded)return;m.rewarded=true;
 const c=m.config;m.success=m.faction==='central'?m.arrived>=c.escortGoal:m.shotDown>=c.interceptGoal;
 const total=m.success?Math.min(36,12+17*2+(g.stageBoss?.stages.loopIndex||0)*4):12;
 const p=hero(g),gems=g.xpGemSplits?.(total)||[total];
 for(let i=0;i<gems.length;i++){const a=i*.7;(g.drops??=[]).push({x:p.x+Math.cos(a)*70,y:p.y+Math.sin(a)*70,value:gems[i],heal:false,bossReward:true});}
 if(m.success)(g.drops??=[]).push({x:p.x,y:p.y,value:0,heal:true,bossReward:true});
 g.event?.('wave',m.success?`임무 성공 · 격추 ${m.shotDown} / 돌파 ${m.arrived}`:`임무 실패 · 격추 ${m.shotDown} / 돌파 ${m.arrived} · 보상 감소`);
 m.finishedAt=m.time;
}
export function tickDoverMission(g,dt){
 if(region(g)!==17||g.mode==='campaign'||g.online&&!g.host||g.state!=='playing'||!(dt>0))return;
 const m=g.doverMission||createMission(g),c=m.config;if(m.resolved)return;m.time+=dt;
 // Retained records count every aircraft exactly once, even after normal enemy cleanup.
 for(const b of m.bombers){
  if(b.doverResult==='shotDown'){if(b.crashing&&!b.crashed)advanceAircraftCrash(g,b,dt);continue;}
  if(b.doverResult)continue;
  if(b.hp<=0||b.crashing||b.crashed){downBomber(g,m,b);continue;}
  if(b.hp<b.previousHp){b.lastHitAt=g.t||0;b.hitFlash=.22;}
  b.previousHp=b.hp;b.hitFlash=Math.max(0,b.hitFlash-dt);
  const hp=b.hp/b.maxHp;b.engineDamage=hp<.35?2:hp<.7?1:0;
  const damaged=b.engineDamage>0,side=Number(b.id.split('-').at(-1))%2?1:-1;
  const route=doverCliffRoute(doverPatrolChart(g),b.y,560,420),evading=(g.t||0)-(b.lastHitAt??-100)<2.4;
  const drift=damaged?side*(b.engineDamage===2?165:85):0;
  const lane=(Number(b.id.split('-').at(-1))%c.waveSize)%3-1;
  const aimX=route.x+lane*145+drift+(evading?side*115:0),speed=c.speed*(b.engineDamage===2?.64:b.engineDamage===1?.83:1);
  b.vx=clamp((aimX-b.x)*.65,-85,85);b.vy=-speed;b.x+=b.vx*dt;b.y+=b.vy*dt;b.a=Math.atan2(b.vy,b.vx);b.speed=speed;
  b.progress=clamp((b.spawnY-b.y)/(b.spawnY-m.destinationY),0,1);
  if(damaged){b.smokeTimer-=dt;if(b.smokeTimer<=0){b.smokeTimer=b.engineDamage===2?.18:.32;g.smoke?.(b.x+side*22,b.y+14,b.engineDamage===2);}}
  if(b.y<=m.destinationY){b.doverResult='arrived';b.missionTarget=false;b.expired=true;b.hp=0;m.arrived++;g.event?.('wave',`영국 해안 돌파 · ${m.arrived}대`);}
 }
 const active=m.bombers.filter(live),last=m.bombers.filter(b=>b.wave===m.waves-1);
 const waveReady=m.spawned<c.total&&active.length+Math.min(c.waveSize,c.total-m.spawned)<=c.maxActive&&(!last.length||last.every(b=>b.doverResult)||last.some(b=>b.progress>=c.waveProgress));
 const waveWait=c.waveGap-(m.time-m.lastWaveAt);
 if(waveReady&&m.waves>0&&waveWait<=4&&m.approachWarned!==m.waves){
  m.approachWarned=m.waves;m.waveApproachAt=m.time+1.5;
  g.event?.('wave',`해협 후방 · 고타 ${m.waves+1}편대 접근 중`);
 }
 if(waveReady&&waveWait<=0&&m.time>=(m.waveApproachAt??0))spawnWave(g,m);
 // Separate the regional arrival from the convoy's last entry. The boss
 // can still engage convoy survivors and the mission still owns the exit.
 m.bossReady=Number.isFinite(m.bossApproachAt)&&m.time>=m.bossApproachAt;
 m.progress=m.bombers.reduce((v,b)=>v+(b.doverResult?1:b.progress),0)/c.total;
 if(m.spawned===c.total&&m.shotDown+m.arrived===c.total){settleMission(g,m);if(m.time-m.finishedAt>=c.resultSeconds)m.resolved=true;return;}
 m.nextFighterAt-=dt;
 if(m.nextFighterAt<=0){const coast=active.some(b=>b.progress>=c.coastProgress);m.nextFighterAt=m.bossDefeated?18:coast?6:c.fighterInterval;spawnFighters(g,m,coast?3:2);}
 // Coastal batteries fire physical, swept rounds at the arriving friendly convoy.
 if(m.faction==='central'){
  m.flakAt=(m.flakAt??2)-dt;
  const b=active.find(b=>b.progress>=c.coastProgress);
  if(b&&m.flakAt<=0){m.flakAt=m.bossDefeated?7:4.5;const shore=doverCliffRoute(doverPatrolChart(g),b.y,0,0),x=shore.x-90,y=b.y-220,a=Math.atan2(b.y+b.vy*.6-y,b.x+b.vx*.6-x);
   (g.aaEffects??=[]).push({x,y,age:0,life:.23,size:44,kind:'aaMuzzle'});
   for(let i=-1;i<=1;i++){const angle=a+i*.09;(g.bullets??=[]).push({x,y,vx:Math.cos(angle)*370,vy:Math.sin(angle)*370,life:3,enemy:true,flak:true,doverOwned:true,damage:14,visualType:'flak'});}
  }
 }
}
// Returns the earliest convoy impact so existing player/ally interception order remains intact.
export function doverRoundImpact(g,round,x0,y0){
 const m=g.doverMission;if(!doverMissionActive(g)||m.faction!=='central'||!round.enemy)return null;
 const dx=round.x-x0,dy=round.y-y0,len=dx*dx+dy*dy;let first=Infinity,target=null;
 for(const b of m.bombers){if(!live(b))continue;const r=b.hitRadius+(round.flak?6:0),ox=x0-b.x,oy=y0-b.y,c=ox*ox+oy*oy-r*r;let t=0;
  if(c>0){if(!len)continue;const dot=ox*dx+oy*dy,disc=dot*dot-len*c;if(disc<0)continue;t=(-dot-Math.sqrt(disc))/len;if(t<0||t>1)continue;}
  if(t<first){first=t;target=b;}
 }
 return target?{target,t:first}:null;
}
