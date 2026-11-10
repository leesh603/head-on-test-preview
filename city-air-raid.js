// Ordinary city (catalogue 4) is an air-raid defense for both sides. Raid waves
// fly bomb runs at three city districts; the stage boss (Gotha squadron for the
// Entente, O/400 squadron for the Central powers) arrives only once the raid is
// spent. Losing every district ends the sortie.
//  - Entente: the districts are the Gotha squadron's own targets
//    (londonBattle.districts), so districts saved in the raid stay in the boss
//    fight, keep their support rounds and the existing defeat check.
//  - Central: the O/400 squadron does not bomb the city, so the raid owns the
//    districts and the defeat check here.
import {ensureLondonBattle} from './london-battle.js?v=b3bf991d11fc7798';

export const CITY_RAID=Object.freeze({
 waves:[2,3,3,6],firstAt:6,gap:16,maxLive:2,approach:1050,cityAhead:560,spread:330,bombRadius:72,
 damage:40,exit:950,escortsFrom:2,timeout:170
});
const R=CITY_RAID;
const host=g=>!g.online||g.host;
const region=g=>g.stageBoss?.stages.stageIndex??g.worldRegion?.();
const faction=g=>g.stageBoss?.stages.teamFaction||g.teamFaction||'entente';
const live=e=>e?.hp>0&&!e.expired&&!e.crashing&&!e.crashed;
const alive=b=>b.districts.filter(d=>d.hp>0);
const BOSS_NAME={entente:['고타 폭격전대','Gotha squadron'],central:['O/400 편대','O/400 squadron']};

// The battle record that holds the districts for this side of the city.
function battle(g,create=false){
 if(faction(g)==='central'){
  if(region(g)!==4){g.cityDefenseRaid=null;return null;}
  if(!g.cityDefenseRaid&&create)g.cityDefenseRaid={role:'defend',districts:[],warnings:[],bombs:[],cityRaidOwner:true};
  return g.cityDefenseRaid||null;
 }
 const b=create?ensureLondonBattle(g):g.londonBattle;
 return b?.cityGotha&&b.role==='defend'?b:null;
}
export const cityRaidBattle=g=>g&&region(g)===4?battle(g):null;
export const cityRaidActive=g=>!!cityRaidBattle(g)?.raid;

function layout(g,b){
 const a=Number.isFinite(g.a)?g.a:-Math.PI/2,hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx,cx=g.x+hx*R.cityAhead,cy=g.y+hy*R.cityAhead;
 // Same three districts, names and HP the Gotha boss fight uses.
 b.districts=[['west','서부 시가지','West district',-R.spread,0],['docks','중앙 시가지','City center',0,-125],['east','동부 시가지','East district',R.spread,0]]
  .map(([id,name,en,l,f])=>({id,name,en,x:cx+nx*l+hx*f,y:cy+ny*l+hy*f,hp:120,maxHp:120}));
 b.raid={wave:0,nextAt:(g.t||0)+R.firstAt,startedAt:g.t||0,bombers:[],cleared:0,resolvedWaves:new Set(),hits:0,done:false,heading:a};
 g.event?.('wave','도심 방어 · 공습 4파를 막고 시가지 3구역을 지키세요');
}

function spawnWave(g,b){
 const raid=b.raid,targets=alive(b);if(!targets.length)return;
 const count=R.waves[raid.wave],target=targets[raid.wave%targets.length],k=raid.wave+1;
 // Raids come in from the enemy side of the city, never from behind the pilot.
 const side=raid.wave%2?1:-1,base=raid.heading+side*(.35+.15*raid.wave),central=faction(g)==='central';
 const wave=[];
 // One bounded raid wave may exceed the ordinary two-bomber ambient cap, as the
 // Battlefield Event bomber group does.
 const prior=g.directorSpawning,mechanic=g.bossMechanicSpawn;g.directorSpawning=true;g.bossMechanicSpawn=true;
 try{for(let i=0;i<count;i++){
  const e=g.spawnEnemy?.('bomber');if(!e)break;
  const lane=(i-(count-1)/2)*80,dx=Math.cos(base),dy=Math.sin(base),x=target.x+dx*R.approach-dy*lane,y=target.y+dy*R.approach+dx*lane;
  // Raid bombers save their load for the city: no bomb carpets on the pilot.
  // The Central city keeps the faction's ordinary Entente bomber airframe.
  Object.assign(e,{x,y,a:Math.atan2(target.y-y,target.x-x),...(central?{}:{escortPlane:'gotha_night',name:'고타 G.V · 공습'}),cityRaid:{wave:k,target:target.id},missionTarget:true,frontRoute:{x:target.x-dy*lane*.35,y:target.y+dx*lane*.35},fire:Infinity,conceptBombTimer:Infinity,ace:false});
  delete e.airArrival;delete e.directorSceneId;
  wave.push(e);
 }
 if(raid.wave>=R.escortsFrom&&wave.length)for(let i=0;i<2;i++){
  const w=g.spawnEnemy?.('hunter');if(!w)break;const s=i?1:-1;
  Object.assign(w,{formationLeader:wave[0],formationBack:85,formationOffset:s*115,x:wave[0].x+s*110,y:wave[0].y+s*60,a:wave[0].a,cityRaidEscort:k,fire:1.2+i*.4});
 }}finally{g.directorSpawning=prior;g.bossMechanicSpawn=mechanic;}
 raid.bombers.push(...wave);raid.wave++;raid.nextAt=(g.t||0)+R.gap;
 g.event?.('wave',k===R.waves.length?`최종 공습 · ${target.name}로 폭격기 ${wave.length}기 진입`:`공습 ${k}/${R.waves.length}파 · ${target.name}로 폭격기 ${wave.length}기`);
}

function retarget(b,e){
 const t=b.districts.find(d=>d.id===e.cityRaid.target);if(t?.hp>0)return t;
 const next=alive(b).sort((p,q)=>Math.hypot(p.x-e.x,p.y-e.y)-Math.hypot(q.x-e.x,q.y-e.y))[0];
 if(next){e.cityRaid.target=next.id;e.frontRoute={x:next.x,y:next.y};}
 return next;
}

export function tickCityAirRaid(g,dt){
 if(!host(g)||g.mode==='campaign'||g.state!=='playing'||!(dt>0))return;
 if(region(g)!==4){if(g.cityDefenseRaid)g.cityDefenseRaid=null;return;}
 const phase=g.stageBoss?.stages.phase,b=battle(g,phase==='explore');if(!b)return;
 if(!b.raid){if(phase!=='explore')return;layout(g,b);}
 // Central owns its districts' defeat; the Entente city keeps london-battle's.
 if(b.cityRaidOwner&&b.districts.length&&!alive(b).length&&!b.cleared){g.state='lost';g.score=g.kills*100+Math.floor(g.t)*10;g.event?.('end','도심 방어 실패 · 시가지 모두 파괴');return;}
 const raid=b.raid;if(raid.done)return;
 const now=g.t||0;
 for(const e of raid.bombers){
  if(e.cityRaid.resolved)continue;
  if(!live(e)){e.cityRaid.resolved='down';continue;}
  if(e.cityRaid.dropped){if(Math.hypot(e.x-e.cityRaid.dropX,e.y-e.cityRaid.dropY)>R.exit){e.expired=true;e.cityRaid.resolved='away';}continue;}
  const d=retarget(b,e);if(!d){e.cityRaid.resolved='away';e.expired=true;continue;}
  const distance=Math.hypot(e.x-d.x,e.y-d.y);
  if(e.cityRaid.wave===R.waves.length&&distance<360&&!raid.finalWarned){
   raid.finalWarned=true;g.event?.('bombWarning',`최종 편대 폭격 진입 · ${d.name} 투하 직전`);
  }
  if(distance<=R.bombRadius){
   d.hp-=Math.min(d.hp,R.damage);raid.hits++;
   Object.assign(e.cityRaid,{dropped:true,dropX:e.x,dropY:e.y});e.missionTarget=false;
   const a=e.a;e.frontRoute={x:e.x+Math.cos(a)*R.exit*1.4,y:e.y+Math.sin(a)*R.exit*1.4};
   g.combatBlast?.(d.x,d.y,80,'enemy','bomb');
   const left=alive(b).length;
   g.event?.('wave',d.hp>0?`${d.name} 피격 · ${Math.ceil(d.hp/d.maxHp*100)}% 남음`:left?`${d.name} 붕괴 · 남은 구역 ${left}`:`${d.name} 붕괴 · 도심 함락`);
  }
 }
 // Later waves may finish first. Keep the boss gate closed until each launched
 // group has either lost its bombers or committed its payload.
 for(let k=1;k<=raid.wave;k++){
  if(raid.resolvedWaves.has(k))continue;
  const group=raid.bombers.filter(e=>e.cityRaid.wave===k);
  if(group.some(e=>!e.cityRaid.resolved&&!e.cityRaid.dropped))continue;
  raid.resolvedWaves.add(k);raid.cleared=raid.resolvedWaves.size;
  if(group.length&&group.every(e=>e.cityRaid.resolved==='down'))g.event?.('wave',k===R.waves.length?'최종 폭격기 전원 요격 · 마지막 투하 저지':`${k}파 요격 · 시가지 무사`);
  for(const w of g.enemies||[])if(w.cityRaidEscort===k&&live(w)){w.formationLeader=null;g.breakEnemyFormation?.(w,2);}
 }
 const liveWaves=raid.wave-raid.cleared;
 if(raid.wave<R.waves.length&&now>=raid.nextAt&&liveWaves<R.maxLive)spawnWave(g,b);
 const timedOut=now-raid.startedAt>R.timeout,repelled=raid.cleared>=R.waves.length;
 if(repelled||timedOut){
  raid.done=true;
  if(timedOut)for(const e of raid.bombers)if(!e.cityRaid.resolved&&!e.cityRaid.dropped){
   e.cityRaid.resolved='away';e.missionTarget=false;e.expired=true;
  }
  if(alive(b).length)g.event?.('wave',`${!repelled?'공습기 이탈':raid.hits?'공습 종료':'시가지 피해 없이 공습 저지'} · ${BOSS_NAME[faction(g)][0]} 본대 접근`);
 }
}

// The squadron arrives when the raid is spent instead of after a fixed distance.
export function cityRaidGate(g){
 const b=cityRaidBattle(g);if(!b?.raid)return null;
 const raid=b.raid,left=R.waves.length-raid.cleared;
 return{ready:raid.done,remaining:raid.done?0:Math.max(1,left*R.gap),progress:raid.cleared/R.waves.length};
}

export function cityRaidMissionCard(g,en=false){
 const b=cityRaidBattle(g);if(!b?.raid||g.stageBoss?.stages.phase!=='explore')return null;
 const raid=b.raid,inbound=raid.bombers.filter(e=>!e.cityRaid.resolved&&!e.cityRaid.dropped).length,boss=BOSS_NAME[faction(g)];
 const objective=raid.done?(en?`Raid repelled · ${boss[1]} inbound`:`공습 저지 · ${boss[0]} 접근`):(en?`Raid ${Math.max(1,raid.wave)}/${R.waves.length}`:`공습 ${Math.max(1,raid.wave)}/${R.waves.length}파`)+(inbound?(en?` · ${inbound} bombers inbound`:` · 폭격기 ${inbound}기 접근`):(en?' · next wave':' · 다음 공습 대기'));
 const meta=b.districts.map(d=>(en?d.en.split(' ')[0]:d.name.split(' ')[0])+'\u00a0'+Math.ceil(d.hp/d.maxHp*100)+'%').join(' · ');
 return{title:en?'DEFEND THE CITY':'도심 방어',objective,meta};
}

// The raid takes the boss slot: the raiding squadron is the stage's first
// formation, and the bar is the city itself, emptying district by district.
export function cityRaidHudModel(g,en=false){
 const b=cityRaidBattle(g);if(!b?.raid||g.stageBoss?.stages.phase!=='explore')return null;
 const raid=b.raid,boss=BOSS_NAME[faction(g)],inbound=raid.bombers.filter(e=>!e.cityRaid.resolved&&!e.cityRaid.dropped).length;
 const hp=b.districts.reduce((n,d)=>n+Math.max(0,d.hp),0),maxHp=b.districts.reduce((n,d)=>n+d.maxHp,0);
 // One line: squadron and wave; the bombers' targets are marked on the city strip.
 const title=(en?boss[1]+' · ':boss[0]+' · ')+(raid.done?(en?'RAID REPELLED':'공습 저지'):(en?`RAID ${Math.max(1,raid.wave)}/${R.waves.length}`:`공습 ${Math.max(1,raid.wave)}/${R.waves.length}파`));
 const inboundBy={};for(const e of raid.bombers)if(!e.cityRaid.resolved&&!e.cityRaid.dropped)inboundBy[e.cityRaid.target]=(inboundBy[e.cityRaid.target]||0)+1;
 const detail=raid.done?(en?'Main squadron inbound':'본대 접근 중'):(en?`Raid ${Math.max(1,raid.wave)}/${R.waves.length}`:`공습 ${Math.max(1,raid.wave)}/${R.waves.length}파`)+(inbound?(en?` · ${inbound} bombers on their run`:` · 폭격기 ${inbound}기 폭격 진입`):(en?' · next wave forming':' · 다음 공습 대기'));
 const tactic=b.districts.map(d=>(en?d.en.split(' ')[0]:d.name.split(' ')[0])+'\u00a0'+(d.hp>0?Math.ceil(d.hp/d.maxHp*100)+'%':(en?'ruined':'붕괴'))).join(' · ');
 // District boundaries on the bar, as the boss bar marks its phase gates.
 const ticks=b.districts.slice(0,-1).map((_,i)=>b.districts.slice(0,i+1).reduce((n,d)=>n+d.maxHp,0)/maxHp);
 return{title,detail,tactic,hp,maxHp,ticks,low:hp<=maxHp/3,districts:b.districts,inboundBy};
}
