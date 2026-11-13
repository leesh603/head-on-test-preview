// Map objectives observe the existing fleet's motion, hull damage and ordnance.
// The host owns stage completion, rewards and pause; there is no second fleet update.
import {SHIP_TYPES} from './fleet-naval1.js?v=buildfit1&rail=42&afc=1&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021&cityart=20261022&perf=1029&zb=20261103';
import {vacantShipPose} from './naval-spacing.js?v=pandemonium394r2';

const regions=new Set([1,16]);
export const NAVAL_MISSION_BALANCE=Object.freeze({
 blockadeSectors:4,blockadeSeconds:45,raiderWaves:3,raidersPerWave:3,raiderGap:18,raidersStopped:7,
 jutlandShips:6,jutlandGoal:4
});
const B=NAVAL_MISSION_BALANCE;
const opposite=f=>f==='central'?'entente':'central';
const live=e=>e&&e.hp>0&&!e.expired&&!e.crashing&&!e.crashed;
const point=(r,s,n=0)=>({x:r.x+Math.cos(r.a)*s-Math.sin(r.a)*n,y:r.y+Math.sin(r.a)*s+Math.cos(r.a)*n});
const along=(r,e)=>(e.x-r.x)*Math.cos(r.a)+(e.y-r.y)*Math.sin(r.a);
const guide=(e,label,kind)=>({x:e.x,y:e.y,label,kind});
const result=(success,ko,en)=>({success,reason:[ko,en]});
const reached=(g,p,radius=180)=>(g.players||[g]).some(e=>e.hp>0&&Math.hypot(e.x-p.x,e.y-p.y)<=radius);

function ship(g,m,side,cls,p,a,name,extra={}){
 const t=SHIP_TYPES[cls],e={id:`${m.id}:ship:${m.naval.serial++}`,type:'ship',shipClass:cls,faction:side,name,
  ...p,a,course:a,weave:0,speed:0,sailingSpeed:t.speed,driveVelocity:0,stationary:true,surface:true,
  navalVessel:true,movingShip:true,hitRadius:cls==='aa'?44:36,hullLength:t.drawnH*.45,hullWidth:t.drawnH*.12,
  hp:t.hp,maxHp:t.hp,fire:3,ace:false,wobble:0,life:Infinity,hazardRegion:m.region,xpValue:cls==='aa'?16:9,
  missionTarget:true,mapMissionId:m.id,...extra};
 if(!vacantShipPose(g,e))return null;
 (side===m.faction?(g.friendlyShips??=[]):(g.enemies??=[])).push(e);
 return e;
}

function retire(g,e){
 e.expired=true;e.missionTarget=false;
 for(const list of [g.enemies||[],g.friendlyShips||[]]){const i=list.indexOf(e);if(i>=0)list.splice(i,1);}
}

function deploy(g,m,side,cls,s,lane,heading,name,extra={}){
 const r=m.naval.route;
 for(const drift of [0,-170,170,-340,340,510,-510]){
  const e=ship(g,m,side,cls,point(r,s,lane+drift),heading,name,extra);
  if(e)return e;
 }
 return null;
}

function deployBlockade(g,m){
 const n=m.naval,r=n.route;
 for(const [i,sector] of n.sectors.entries()){
  const lane=(i%2?1:-1)*430;
  for(const [slot,cls] of ['aa','dd'].entries()){
   if(sector.ships[slot])continue;
   const e=deploy(g,m,'entente',cls,sector.s,slot?Math.sign(lane)*940:lane,r.a+Math.PI/2,
    slot?'봉쇄 구축함':'봉쇄 순양함',{moored:true,fire:3+i*.6});
   if(e)sector.ships[slot]=e;
  }
 }
}

function deployRaiderWave(g,m){
 const n=m.naval;
 if(n.raiderWave>=B.raiderWaves||m.age<n.nextRaiderAt)return;
 const end=(n.raiderWave+1)*B.raidersPerWave;
 while(n.ships.length<end){
  const i=n.ships.length%B.raidersPerWave;
  const e=deploy(g,m,'central',i===1?'aa':'dd',700+n.raiderWave*300,(i-1)*425,n.route.a,'습격 함대');
  if(!e){n.nextRaiderAt=m.age+.5;return;}
  n.ships.push(e);
 }
 n.raiderWave++;
 n.nextRaiderAt=m.age+B.raiderGap;
 g.event?.('wave',`습격 함대 ${n.raiderWave}/${B.raiderWaves}차 전열 접근`);
}

function initialize(g,m){
 if(m.region===1&&g.intrusionBoss&&g.intrusionBoss.phase!=='resolved')return false;
 const r=m.region===16?g.jutlandRoute:{x:g.x,y:g.y,a:m.heading};
 if(!r)return false;
 // The escort battle starts at fleet contact, not while the pilot is still
 // crossing the approach. Preserve the interception side's existing opening.
 if(m.region===16&&m.faction==='central'){
  m.awaitContact=true;
  const contact=point(r,4680);
  if(!reached(g,contact,1500)){
   m.task=['철수 함대에 합류하세요','Join the withdrawing fleet'];
   m.detail=['함대 합류 후 호위 제한시간 시작','Escort clock starts at fleet contact'];
   m.guides=[guide(contact,['철수 함대','Withdrawing fleet'],'ally')];
   return false;
  }
  m.contactAt=m.age;
 }
 const n=m.naval={route:r,ships:[],threats:[],serial:0,bombers:[],bombs:[],wave:0,nextRaid:18};
 const central=m.faction==='central';
 if(m.region===1){
  n.exitS=2520;n.exit=point(r,4350);n.openedAt=m.age;
  n.sectors=Array.from({length:B.blockadeSectors},(_,i)=>({s:680+i*880,ships:[null,null]}));
  n.raiderWave=0;n.nextRaiderAt=m.age;
  m.limit=m.age+125;
 }else{
  n.exitS=5920;n.exit=point(r,n.exitS);n.protect=central;n.nextRaid=m.age+18;
  for(let i=0;i<B.jutlandShips;i++){
   // The slower cruisers use outer withdrawal lanes clear of the flagship's
   // central maneuvering hull; interception-side deployment is unchanged.
   const lane=central&&i%3===1?(i<3?-1:1)*1350:(i%3-1)*575,s=4680-Math.floor(i/3)*420;
   const e=deploy(g,m,'central',i%3===1?'aa':'dd',s,lane,r.a,`철수 전열 ${i+1}`,{fire:3+i*.55});
   if(e)n.ships.push(e);
  }
  for(const [i,lane] of [-1220,1220].entries()){
   const e=deploy(g,m,'entente','dd',5350+i*300,lane,r.a,'추격 구축함',{fire:7,moored:true});
   if(e)n.threats.push(e);
  }
  m.limit=(central?m.age:0)+135;
 }
 g.event?.('wave',m.title?.[0]);
 return true;
}

function raidConvoy(g,m){
 const n=m.naval;
 const name='철수 함대';
 // Existing bomb-zone ordnance owns the countdown, warning art, impact and pilot damage.
 // Retained references let the ship receive damage at that same physical impact.
 for(const b of n.bombs){
  if(b.resolved||b.zone.delay>0)continue;b.resolved=true;
  if(live(b.target)&&Math.hypot(b.target.x-b.zone.x,b.target.y-b.zone.y)<b.zone.radius+(b.target.hitRadius||0)){
   b.target.hp=Math.max(0,b.target.hp-65);b.target.hitFlash=.24;
  }
 }
 n.bombs=n.bombs.filter(b=>!b.resolved);
 for(const run of n.bombers){
  const e=run.plane;if(!live(e)||run.finished)continue;
  if(run.dropped){if(Math.hypot(e.x-run.dropX,e.y-run.dropY)>1100){run.finished=true;retire(g,e);}continue;}
  if(!live(run.target)){run.finished=true;e.missionTarget=false;continue;}
  const t=run.target,lead=.8;
  e.frontRoute={x:t.x+Math.cos(t.a)*(t.driveVelocity||0)*lead,y:t.y+Math.sin(t.a)*(t.driveVelocity||0)*lead};
  if(Math.hypot(e.x-t.x,e.y-t.y)>170)continue;
  const delay=1.8,zone={x:t.x+Math.cos(t.a)*(t.driveVelocity||0)*delay,y:t.y+Math.sin(t.a)*(t.driveVelocity||0)*delay,
   sx:e.x,sy:e.y,delay,maxDelay:delay,radius:76,damage:18,sourcePlane:e.escortPlane||e.bankAircraft,mapMissionId:m.id};
  (g.bombZones??=[]).push(zone);n.bombs.push({zone,target:t});
  Object.assign(run,{dropped:true,dropX:e.x,dropY:e.y});e.missionTarget=false;
  e.frontRoute={x:e.x+Math.cos(e.a)*1600,y:e.y+Math.sin(e.a)*1600};
  g.event?.('bombWarning',`${name} 폭격 투하 · 다음 공습기를 먼저 요격하세요`);
 }
 if(n.wave>=5||m.age<n.nextRaid||n.bombers.filter(b=>live(b.plane)&&!b.dropped&&!b.finished).length>=4)return;
 const targets=n.ships.filter(s=>live(s)&&!s.mapNavalResult).sort((a,b)=>a.hp-b.hp);
 if(!targets.length)return;
 const target=targets[0],prior=g.directorSpawning,mechanic=g.bossMechanicSpawn;g.directorSpawning=true;g.bossMechanicSpawn=true;
 try{for(let i=0;i<2;i++){
  const e=g.spawnEnemy?.('bomber');if(!e)break;
  const a=target.a+(.35+i*.15)*(n.wave%2?-1:1),p={x:target.x+Math.cos(a)*(900+i*180),y:target.y+Math.sin(a)*(900+i*180)};
  Object.assign(e,{...p,a:Math.atan2(target.y-p.y,target.x-p.x),fire:Infinity,bombTimer:Infinity,conceptBombTimer:Infinity,
   mapMissionId:m.id,missionTarget:true,ace:false,frontRoute:{x:target.x,y:target.y}});
  delete e.airArrival;delete e.directorSceneId;n.bombers.push({plane:e,target});
 }}finally{g.directorSpawning=prior;g.bossMechanicSpawn=mechanic;}
 n.wave++;n.nextRaid=m.age+18;
 g.event?.('wave',`${name}로 폭격기 접근 · 투하 전에 요격하세요`);
}

function observeFleet(g,n){
 for(const e of n.ships){
  if(e.mapNavalResult)continue;
  if(e.hp<=0)e.mapNavalResult='sunk';
  else if(e.expired)e.mapNavalResult='missing';
  else if(along(n.route,e)>=n.exitS){e.mapNavalResult='escaped';retire(g,e);}
 }
 return {
  escaped:n.ships.filter(s=>s.mapNavalResult==='escaped').length,
  sunk:n.ships.filter(s=>s.mapNavalResult==='sunk').length,
  active:n.ships.filter(s=>live(s)&&!s.mapNavalResult)
 };
}

function adriaticObjective(g,m){
 deployBlockade(g,m);
 deployRaiderWave(g,m);
 const n=m.naval,{escaped,sunk,active}=observeFleet(g,n);
 const batteries=n.sectors.flatMap(s=>s.ships).filter(Boolean),holding=batteries.filter(live).length;
 if(m.faction==='central'){
  const cleared=n.sectors.filter(q=>q.ships.every(s=>s&&s.hp<=0)).length,allClear=cleared===B.blockadeSectors;
  m.task=allClear?['해협 돌파 지점을 통과하세요','Fly through the strait exit']:
   [`봉쇄 구역 제압 ${cleared}/${B.blockadeSectors}`,`Blockade sectors silenced ${cleared}/${B.blockadeSectors}`];
  m.detail=allClear?['돌파 지점 너머로 적 기함 접근 중','The enemy flagship is beyond the blockade']:
   ['구역마다 순양함과 구축함을 모두 격침하세요','Sink the cruiser and destroyer in each sector'];
  m.guides=allClear?[guide(n.exit,['해협 돌파','Cross the strait'],'exit')]:
   batteries.filter(live).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y)).map(e=>guide(e,[e.name,'Blockade ship'],'target'));
  if(allClear&&reached(g,n.exit,220))return result(true,'봉쇄선 돌파','Blockade breached');
 }else{
  const total=B.raiderWaves*B.raidersPerWave,unlaunched=total-n.ships.length;
  m.task=[`습격 함정 저지 ${sunk}/${B.raidersStopped} · 봉쇄함 ${holding}`,`Raiders sunk ${sunk}/${B.raidersStopped} · Blockade ships ${holding}`];
  m.detail=[`습격 ${n.raiderWave}/${B.raiderWaves}차 · 3척 돌파 시 실패`,`Raid ${n.raiderWave}/${B.raiderWaves} · Three breakthroughs fail`];
  m.guides=active.map(e=>guide(e,[e.name,'Raider'],'target'));
  if((!holding&&batteries.length===B.blockadeSectors*2)||escaped>total-B.raidersStopped||sunk+active.length+unlaunched<B.raidersStopped)
   return result(false,'봉쇄선 방어 실패','Blockade lost');
  if(sunk>=B.raidersStopped&&n.raiderWave===B.raiderWaves)return result(true,'습격 함대 저지','Raid stopped');
 }
 return null;
}

function jutlandObjective(g,m){
 const n=m.naval;if(n.protect)raidConvoy(g,m);
 const {escaped,sunk,active}=observeFleet(g,n),goal=B.jutlandGoal;
 const progress=n.protect?escaped:sunk;
 m.task=n.protect?[`주력함 퇴각 ${escaped}/${goal}`,`Capital ships withdrawn ${escaped}/${goal}`]:
  [`퇴각 함정 저지 ${sunk}/${goal}`,`Retreating ships sunk ${sunk}/${goal}`];
 m.detail=[`이탈 ${escaped}/${B.jutlandShips} · 손실 ${sunk}`,`Through ${escaped}/${B.jutlandShips} · Sunk ${sunk}`];
 m.guides=active.map(e=>guide(e,[e.name,n.protect?'Friendly ship':'Target ship'],n.protect?'ally':'target'));
 const encounter=g.stageBoss?.stages.encounter;
 if(progress>=goal&&encounter&&!encounter.arrivalPending){
  return n.protect?result(true,'주력 함대 철수 완료','Fleet withdrawal complete'):result(true,'적 함대의 퇴각 저지','Enemy withdrawal stopped');
 }
 if(progress+active.length<goal)return result(false,'함대 작전 실패','Fleet operation failed');
 return null;
}

export function tickNavalMapMission(g,m,dt){
 if(!m||!regions.has(m.region)||m.status!=='active'||!(dt>0)||g.state!=='playing'||g.online&&!g.host)return null;
 if(!m.naval&&!initialize(g,m))return null;
 return m.region===1?adriaticObjective(g,m):jutlandObjective(g,m);
}
