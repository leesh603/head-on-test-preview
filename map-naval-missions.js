// Map objectives observe the existing fleet's motion, hull damage and ordnance.
// The host owns stage completion, rewards and pause; there is no second fleet update.
import {SHIP_TYPES} from './fleet-naval1.js?v=buildfit1&rail=42&afc=1&ai=1018&art=pilot-recovery2&sig=1019&boss=20261020b&phase=1021&cityart=20261022&perf=1029&zb=20261103';
import {vacantShipPose} from './naval-spacing.js?v=pandemonium394r2';
import {tickZeebruggeRaid,ZEEBRUGGE_BLOCKSHIPS as Z,zeebruggeCanal} from './zeebrugge-raid.js?v=cull20261106';

const regions=new Set([1,7,14,16]);
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

function initialize(g,m,dt){
 const r=m.region===7?g.navalRoute:m.region===14?g.gallipoliRoute:m.region===16?g.jutlandRoute:{x:g.x,y:g.y,a:Number.isFinite(g.a)?g.a:-Math.PI/2};
 if(!r)return false;
 m.naval={route:r,ships:[],threats:[],serial:0,bombers:[],bombs:[],wave:0,nextRaid:12};
 const n=m.naval,central=m.faction==='central';
 m.limit=m.region===1?140:155;
 if(m.region===7){
  if(!g.zeebruggeRaid)tickZeebruggeRaid(g,dt);
  const op=g.zeebruggeRaid;if(!op){delete m.naval;return false;}
  op.mapMissionId=m.id;op.defending=central;n.operation=op;n.ships=op.ships;
  for(const [i,e]of n.ships.entries()){
   Object.assign(e,{mapMissionId:m.id,missionTarget:true,faction:'entente',name:Z.names.entente[i][0],blockshipEn:Z.names.entente[i][1],wobble:e.wobble||0});
   const wrong=central?(g.friendlyShips||[]):(g.enemies||[]),index=wrong.indexOf(e);if(index>=0)wrong.splice(index,1);
   const right=central?(g.enemies??=[]):(g.friendlyShips??=[]);if(!right.includes(e))right.push(e);
  }
  n.exit=point(r,10300,0);m.suppressBoss=central;
  m.title=central?['제브뤼헤 · 항만 방어','ZEEBRUGGE · HARBOR DEFENSE']:['제브뤼헤 · 폐색 작전','ZEEBRUGGE · BLOCKSHIP RAID'];
  // Stationary patrol guns use the same shells and hit checks as the ambient fleet.
  if(!central)for(const [s,lane]of [[3300,620],[7000,-620],[10400,620]]){
   const e=ship(g,m,'central','aa',point(r,s,lane),r.a+Math.PI,'수로 경비함',{moored:true});if(e)n.threats.push(e);
  }
 }else if(m.region===1&&central){
  n.exit=point(r,1650,0);
  m.title=['아드리아해 · 봉쇄 돌파','ADRIATIC · BREAK THE BLOCKADE'];
  for(const lane of [-270,270]){const e=ship(g,m,'entente','aa',point(r,750,lane),r.a+Math.PI,'봉쇄 순양함',{moored:true});if(e)n.ships.push(e);}
 }else if(m.region===1){
  n.exitS=2900;n.exit=point(r,n.exitS);n.protect=false;
  m.title=['아드리아해 · 해협 봉쇄','ADRIATIC · HOLD THE STRAIT'];
  for(let i=0;i<3;i++){const e=ship(g,m,'central','dd',point(r,450+i*260,(i-1)*330),r.a,'돌파 구축함');if(e)n.ships.push(e);}
 }else if(m.region===14){
  n.exitS=-900;n.exit=point(r,-1120,0);n.protect=true;
  m.title=['갈리폴리 · 마지막 철수선','GALLIPOLI · LAST SHIPS OUT'];
  for(let i=0;i<3;i++){const e=ship(g,m,m.faction,'dd',point(r,1750,(i-1)*430),r.a+Math.PI,`철수선 ${i+1}`,{moored:true,departAt:12+i*12,fire:Infinity});if(e)n.ships.push(e);}
  for(const lane of [-980,980]){const e=ship(g,m,opposite(m.faction),'aa',point(r,1350,lane),r.a+Math.PI,'해안 차단함',{moored:true,fire:7});if(e)n.threats.push(e);}
 }else{
  n.exitS=6100;n.exit=point(r,n.exitS);n.protect=central;n.nextRaid=28;
  m.title=central?['유틀란트 · 함대 이탈','JUTLAND · FLEET WITHDRAWAL']:['유틀란트 · 퇴로 차단','JUTLAND · CUT OFF THE FLEET'];
  for(const [i,lane]of [-780,-340,650].entries()){
   const e=ship(g,m,'central','aa',point(r,4250-i*220,lane),r.a,`철수 순양함 ${i+1}`);if(e)n.ships.push(e);
  }
  if(central)for(const [s,lane]of [[4900,-1150],[5150,1100]]){
   const e=ship(g,m,'entente','dd',point(r,s,lane),r.a+Math.PI,'추격 구축함',{moored:true,fire:16});if(e)n.threats.push(e);
  }
 }
 // A failed placement must never reduce the denominator and grant a free victory.
 n.expected=m.region===1&&central?2:3;
 g.event?.('wave',m.title[0]);
 return true;
}

function raidConvoy(g,m){
 const n=m.naval;
 const name=m.region===7?'폐색선':'철수 함대';
 // Existing bomb-zone ordnance owns the countdown, warning art, impact and pilot damage.
 // Retained references let the ship receive damage at that same physical impact.
 for(const b of n.bombs){
  if(b.resolved||b.zone.delay>0)continue;b.resolved=true;
  if(live(b.target)&&Math.hypot(b.target.x-b.zone.x,b.target.y-b.zone.y)<b.zone.radius+(b.target.hitRadius||0)){
   b.target.hp=Math.max(0,b.target.hp-180);b.target.hitFlash=.24;
  }
 }
 n.bombs=n.bombs.filter(b=>!b.resolved);
 for(const run of n.bombers){
  const e=run.plane;if(!live(e)||run.finished)continue;
  if(run.dropped){if(Math.hypot(e.x-run.dropX,e.y-run.dropY)>1100){run.finished=true;retire(g,e);}continue;}
  if(!live(run.target)||run.target.blockshipResolved){run.finished=true;e.missionTarget=false;continue;}
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
 const targets=n.ships.filter(s=>live(s)&&!s.blockshipResolved).sort((a,b)=>a.hp-b.hp);
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

function blockshipObjective(g,m){
 const n=m.naval,op=n.operation,defend=m.faction==='central';
 if(!defend)raidConvoy(g,m);
 const sunk=op.sunk||0,scuttled=op.scuttled||0;
 m.guides=n.ships.filter(s=>live(s)&&!s.blockshipResolved).map(s=>guide(s,[s.name,s.blockshipEn],defend?'target':'ally'));
 m.detail=[`자침 ${scuttled}/3 · 격침 ${sunk}/3`,`Scuttled ${scuttled}/3 · sunk ${sunk}/3`];
 if(defend){
  m.task=['영국 폐색선 2척 저지 · 운하 자침 2척이면 패배','Stop 2 British blockships · 2 scuttled means defeat'];
  if(scuttled>=2)return result(false,'운하 봉쇄 · 폐색선 저지 실패','Canal blocked · interception failed');
  if(sunk>=2)return result(true,'폐색선 저지 · 항만 통로 유지','Blockships stopped · harbor remains open');
 }else{
  m.task=scuttled>=2?['폐색 완료 · 외항 귀환 지점으로 철수','Canal blocked · withdraw to the outer harbor']:['폐색선 2척을 운하에 자침 · 이후 외항으로 철수','Scuttle 2 blockships in the canal, then withdraw'];
  if(sunk>=2)return result(false,'폐색선 손실 · 운하 봉쇄 실패','Too many blockships lost · blockade failed');
  if(scuttled>=2){m.guides=[guide(n.exit,['외항 귀환','Return to outer harbor'],'exit')];if(reached(g,n.exit,220))return result(true,'운하 봉쇄 후 철수 완료','Canal blocked and withdrawal complete');}
  else{const canal=zeebruggeCanal(g);if(canal)m.guides.push(guide(canal,['자침 수로','Scuttling channel'],'target'));}
 }
 return null;
}

function convoyObjective(g,m){
 const n=m.naval,evac=m.region===14;
 if(m.region===16&&n.protect)raidConvoy(g,m);
 for(const e of n.ships){
  if(e.mapNavalResult)continue;
  if(e.hp<=0){e.mapNavalResult='sunk';continue;}
  if(e.expired){e.mapNavalResult='missing';continue;}
  if(evac&&m.age>=e.departAt)e.moored=false;
  if(evac?along(n.route,e)<=n.exitS:along(n.route,e)>=n.exitS){e.mapNavalResult='escaped';retire(g,e);}
 }
 const escaped=n.ships.filter(s=>s.mapNavalResult==='escaped').length,sunk=n.ships.filter(s=>s.mapNavalResult==='sunk').length;
 const unavailable=n.expected-n.ships.length+n.ships.filter(s=>s.mapNavalResult==='missing').length;
 m.guides=n.ships.filter(s=>live(s)&&!s.mapNavalResult).map(s=>guide(s,[s.name,n.protect?'Friendly ship':'Target ship'],n.protect?'ally':'target'));
 m.detail=[`통과 ${escaped}/3 · 손실 ${sunk}/3`,`Through ${escaped}/3 · sunk ${sunk}/3`];
 if(n.protect){
  m.task=evac?['철수선 3척 중 2척 출항 엄호 · 이후 해상으로 귀환','Escort 2 of 3 evacuation ships out, then return to sea']:['순양함 3척 중 2척을 이탈 항로까지 보호','Protect 2 of 3 cruisers until they reach the escape route'];
  if(sunk+unavailable>=2)return result(false,'함대 손실 · 철수 임무 실패','Fleet losses · withdrawal failed');
  if(escaped>=2){
   if(!evac)return result(true,'함대 이탈 성공','Fleet withdrawal successful');
   m.task=['철수선 출항 완료 · 해상 귀환 지점으로 이동','Evacuation complete · reach the return point at sea'];
   m.guides=[guide(n.exit,['해상 귀환','Return to sea'],'exit')];
   if(reached(g,n.exit,230))return result(true,'철수선 엄호 및 해상 귀환 완료','Evacuation and return to sea complete');
  }
 }else{
  m.task=['돌파 함정 3척 중 2척 저지 · 2척 도주하면 패배','Stop 2 of 3 ships · 2 escapes means defeat'];
  if(escaped+unavailable>=2)return result(false,'적 함대 통과 · 차단 실패','Enemy fleet got through · interception failed');
  if(sunk>=2)return result(true,'적 함대 차단 성공','Enemy fleet intercepted');
 }
 return null;
}

export function tickNavalMapMission(g,m,dt){
 if(!m||!regions.has(m.region)||m.status!=='active'||!(dt>0)||g.state!=='playing'||g.online&&!g.host)return null;
 if(!m.naval&&!initialize(g,m,dt))return null;
 const n=m.naval;
 let resolved=null;
 if(m.region===7)resolved=blockshipObjective(g,m);
 else if(m.region===1&&m.faction==='central'){
  const sunk=n.ships.filter(e=>e.hp<=0).length;
  m.task=sunk>=2?['봉쇄 돌파 · 열린 해협의 출구를 직접 통과','Blockade broken · fly through the open passage']:['봉쇄 순양함 2척 무력화 후 해협 통과','Disable both blockade cruisers, then cross the strait'];
  m.detail=[`봉쇄함 격침 ${sunk}/2`,`Blockade ships sunk ${sunk}/2`];
  m.guides=sunk>=2?[guide(n.exit,['돌파 출구','Open passage'],'exit')]:n.ships.filter(live).map(e=>guide(e,[e.name,'Blockade cruiser'],'target'));
  if(sunk>=2&&reached(g,n.exit,210))resolved=result(true,'봉쇄 돌파 및 해협 통과 완료','Blockade broken and strait crossed');
 }else resolved=convoyObjective(g,m);
 if(resolved)return resolved;
 if(m.age>=m.limit)return result(false,'작전 제한시간 초과 · 목표 미달성','Operation timed out · objective incomplete');
 return null;
}
