// The blockships support the same harbor assault for either player faction.
// Each scuttled ship disables one fortress system through native part damage.
// A sunk convoy leaves the remaining fortress systems for the player to clear.
export const ZEEBRUGGE_BLOCKSHIPS=Object.freeze({
 names:[['테티스','Thetis'],['인트레피드','Intrepid'],['이피게니아','Iphigenia']],
 startS:1400,missionLaunchS:4000,missionStartS:5800,spacing:410,lane:-300,speed:150,
 hp:720,missionHp:300,canalS:12000,canalN:-375,arrive:120,
 // Through the open channel, the gap between the two mole arms, then the west basin (route s,n).
 path:[[10850,-50],[11610,-245]],
 gunInterval:6,gunDamage:28,gunRange:1600,missionGunRange:2000,
 // Concrete-laden hulls: patrol-ship shells do half damage (fleet-naval1 exchange).
 shellArmor:.5,
 // Scuttled once past the mole gap into the canal mouth, staggered so the hulls settle in a line.
 settleStep:145,settleBand:120
});
const Z=ZEEBRUGGE_BLOCKSHIPS;
// Cut in order as blockships settle: the boss's own parts, destroyed through its hit path.
const CUTS=[['seaplane-facility','수상기 격납고 봉쇄'],['ammo-storage','탄약 보급 차단'],['crane-arm','크레인 수로 폐쇄']];
const host=g=>!g.online||g.host;
const region=g=>g.stageBoss?.stages.stageIndex??g.worldRegion?.();
const own=g=>g.stageBoss?.stages.teamFaction||g.teamFaction||'entente';
const live=e=>e&&e.hp>0&&!e.expired;

function routePoint(route,s,n){const hx=Math.cos(route.a),hy=Math.sin(route.a);return{x:route.x+hx*s-hy*n,y:route.y+hy*s+hx*n};}
export function zeebruggeCanal(g){const r=g?.navalRoute;return r?routePoint(r,Z.canalS,Z.canalN):null;}
const fortress=g=>{const enc=g.stageBoss?.stages.phase==='boss'?g.stageBoss.stages.encounter:null;return enc&&[...enc.bodies?.values?.()||[]].find(b=>b.kind==='armored-harbor-fortress'&&!b.dead);};

function launch(g,op,route){
 const faction=own(g),start=op.mapMissionId?Z.missionStartS:Z.startS,hp=op.mapMissionId?Z.missionHp:Z.hp;
 for(const [i,[ko,en]] of Z.names.entries()){
  const p=routePoint(route,start-i*Z.spacing,Z.lane+(i%2?90:-60));
  const e={type:'ship',shipClass:'aa',faction,name:ko,blockshipEn:en,blockship:i,x:p.x,y:p.y,a:route.a,course:route.a,weave:i*2.1,speed:0,sailingSpeed:Z.speed,driveVelocity:op.mapMissionId?90:0,stationary:true,surface:true,navalVessel:true,movingShip:true,hitRadius:44,hullLength:380*.45,hullWidth:380*.12,hp,maxHp:hp,shellArmor:Z.shellArmor,fire:3+i,ace:false,life:Infinity,hazardRegion:7,xpValue:0};
  if(op.mapMissionId)Object.assign(e,{mapMissionId:op.mapMissionId,missionTarget:true,wobble:0});
  (g.friendlyShips??=[]).push(e);op.ships.push(e);
 }
}

function cutFortress(g,op){
 const count=Math.min(op.scuttled,CUTS.length),body=fortress(g),preview=g.navalRoute?.fortressPreview;
 if(!body&&preview)for(let i=op.previewCut;i<count;i++){
  const part=preview.parts.find(p=>p.id===CUTS[i][0]);if(part){part.hp=0;part.destroyed=true;}
  op.previewCut=i+1;
 }
 if(!body)return;
 while(op.cut<count){
  const [id]=CUTS[op.cut++],part=body.parts.get(id);
  if(part&&!part.destroyed){part.hittable=true;body.hit({partId:id,damage:part.hp});}
 }
}

// Once engaged, each live harbor gun shells the nearest blockship in range.
function shellConvoy(g,op,dt){
 const body=fortress(g);if(!body)return;
 for(const part of body.parts.values()){
  if(part.kind!=='harbor-gun'||part.destroyed)continue;
  const left=(op.gunClock.get(part.id)??Z.gunInterval*(.5+.25*op.gunClock.size))-dt;
  if(left>0){op.gunClock.set(part.id,left);continue;}
  op.gunClock.set(part.id,Z.gunInterval);
  const gx=body.x+part.x,gy=body.y+part.y;
  let target=null,range=op.mapMissionId?Z.missionGunRange:Z.gunRange;
  for(const ship of op.ships){
   if(ship.blockshipResolved||!live(ship))continue;
   const distance=Math.hypot(ship.x-gx,ship.y-gy);
   if(distance<range){target=ship;range=distance;}
  }
  if(!target)continue;
  if(op.mapMissionId){
   const duration=Math.max(.9,range/330),speed=target.driveVelocity||0;
   const shots=g.navalExchanges??=[];
   if(shots.length<24)shots.push({sx:gx,sy:gy,x:target.x+Math.cos(target.a)*speed*duration,y:target.y+Math.sin(target.a)*speed*duration,age:0,duration,target,damage:Z.gunDamage,faction:body.faction,mapMissionId:op.mapMissionId});
  }else{
   target.hp=Math.max(0,target.hp-Z.gunDamage);target.hitFlash=.24;
   g.combatBlast?.(target.x+((op.gunClock.size*37)%60-30),target.y+((op.gunClock.size*53)%80-40),46,'enemy','shell');
  }
  if(!op.shelledWarned){op.shelledWarned=true;g.event?.('flak','요새 포대가 폐색선을 포격 · 포좌를 먼저 제압하세요');}
 }
}

export function tickZeebruggeRaid(g,dt){
 if(!host(g)||g.mode==='campaign'||g.state!=='playing'||!(dt>0))return;
 if(region(g)!==7){if(g.zeebruggeRaid)g.zeebruggeRaid=null;return;}
 const phase=g.stageBoss?.stages.phase,route=g.navalRoute;
 if(g.zeebruggeRaid&&g.zeebruggeRaid.route!==route)g.zeebruggeRaid=null;
 if(!g.zeebruggeRaid){
  if(phase!=='explore'||!route)return;
  const mission=g.mapMission?.region===7&&g.mapMission.status==='active'?g.mapMission:null;
  if(mission&&(route.maxForward||0)<Z.missionLaunchS)return;
  const op=g.zeebruggeRaid={route,ships:[],scuttled:0,sunk:0,cut:0,previewCut:0,gunClock:new Map(),done:false,approachWarned:false,mapMissionId:mission?.id};
  launch(g,op,route);
  g.event?.('wave','폐색선 3척이 진입 중 · 자침에 성공하면 요새 설비를 차단합니다');
 }
 const op=g.zeebruggeRaid,canal=zeebruggeCanal(g);if(!canal)return;
 if(op.done){cutFortress(g,op);return;}
 for(const e of op.ships){
  if(e.blockshipResolved)continue;
  if(!(e.hp>0)||e.expired){
   e.blockshipResolved=e.hp>0?'withdrawn':'sunk';
   if(e.blockshipResolved==='sunk')op.sunk++;
   g.event?.('wave',`${e.name} ${e.hp>0?'이탈':'격침'} · 남은 폐색선 ${op.ships.filter(s=>!s.blockshipResolved).length}`);
   continue;
  }
  // Steer through the authored harbor mouth; never across the moles or quays.
  let wp=e.blockshipWaypoint??0;const along=(e.x-route.x)*Math.cos(route.a)+(e.y-route.y)*Math.sin(route.a);
  while(wp<Z.path.length&&along>=Z.path[wp][0]-60)wp++;e.blockshipWaypoint=wp;
  const settleS=Z.canalS-e.blockship*Z.settleStep;
  const aim=wp<Z.path.length?routePoint(route,...Z.path[wp]):routePoint(route,settleS,Z.canalN);
  e.course=Math.atan2(aim.y-e.y,aim.x-e.x);
  const side=-(e.x-route.x)*Math.sin(route.a)+(e.y-route.y)*Math.cos(route.a);
  if(!op.approachWarned&&wp>=Z.path.length-1){op.approachWarned=true;g.event?.('wave','폐색선 최종 진입 · 운하 입구까지 포대를 견제하세요');}
  if(along>=settleS-Z.arrive&&Math.abs(side-Z.canalN)<Z.settleBand){
   // Scuttled in the canal mouth: the hull sinks where it stops.
   e.blockshipResolved='scuttled';op.scuttled++;e.hp=0;e.driveVelocity=0;
   g.combatBlast?.(e.x,e.y,70,'friendly','shipSink');
   g.event?.('wave',`${e.name} 자침 · ${CUTS[op.scuttled-1][1]}`);
  }
 }
 cutFortress(g,op);shellConvoy(g,op,dt);
 if(!op.done&&op.ships.every(s=>s.blockshipResolved)){
  op.done=true;
  g.event?.('wave',op.scuttled?`폐색 작전 종료 · 자침 ${op.scuttled}/${op.ships.length}`:'폐색 작전 실패 · 요새 전력 온전');
 }
}

export function zeebruggeMissionCard(g,en=false){
 const op=g?.zeebruggeRaid;if(!op||region(g)!==7||op.done)return null;
 if(op.mapMissionId)return null;// The map objective HUD owns managed raid progress.
 const canal=zeebruggeCanal(g);if(!canal)return null;
 const lead=op.ships.filter(s=>!s.blockshipResolved&&live(s)).sort((a,b)=>Math.hypot(a.x-canal.x,a.y-canal.y)-Math.hypot(b.x-canal.x,b.y-canal.y))[0];
 const km=lead?(Math.hypot(lead.x-canal.x,lead.y-canal.y)/1000).toFixed(1):'0';
 const state=s=>s.blockshipResolved==='scuttled'?(en?'scuttled':'자침'):s.blockshipResolved?(en?'lost':'이탈'):Math.ceil(s.hp/s.maxHp*100)+'%';
 return{title:en?'BLOCKSHIP OPERATION':'폐색 작전',
  objective:(en?'Scuttled ':'운하 폐색 ')+op.scuttled+' / '+op.ships.length+(lead?(en?` · lead ${km} km`:` · 선두 ${km}km`):''),
  meta:op.ships.map(s=>(en?s.blockshipEn:s.name.replace('폐색선 ',''))+'\u00a0'+state(s)).join(' · ')};
}

// Canal mouth marker, in the same tactical language as the city districts.
export function drawZeebruggeCanal(c,g){
 const op=g?.zeebruggeRaid,canal=op&&zeebruggeCanal(g);if(!canal||op.done&&!op.scuttled)return;
 // Off screen for most of the stage: skip the dashed ring and its text.
 if(Math.abs(canal.x-(g.x||0))>(g.viewWidth||1280)+300||Math.abs(canal.y-(g.y||0))>(g.viewHeight||900)+300)return;
 c.save();c.strokeStyle=op.scuttled?'#bce5c9':'#a9c7bd99';c.lineWidth=op.scuttled?2:1.5;c.setLineDash(op.scuttled?[]:[6,7]);c.beginPath();c.arc(canal.x,canal.y,Z.arrive,0,Math.PI*2);c.stroke();c.setLineDash([]);
 c.font='12px system-ui';c.textAlign='center';c.fillStyle='#e1e6da';c.fillText((op.scuttled?'진입로 확보 · ':'운하 입구 · 폐색 ')+op.scuttled+'/'+op.ships.length,canal.x,canal.y+Z.arrive+18);
 c.restore();
}
