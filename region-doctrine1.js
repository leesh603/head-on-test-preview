// Regional enemy doctrine weights + regional battlefield events.
// Wraps spawnComposition (keeps time-scaling) and offerBattlefieldEvent (keeps canOffer guards).
import {BATTLEFIELD_EVENT_BALANCE} from './battlefield-events170.js?v=r5';
const AIR_TYPES=['scout','hunter','bomber','heavyBomber'];
// weight = [scout,hunter,bomber,heavy,zeppelinShare]
const DOCTRINE={
 0:{scout:.375,hunter:.4375,bomber:.125,heavy:.0625},
 1:{scout:.1875,hunter:.375,bomber:.3125,heavy:.125},
 2:{scout:.43,hunter:.36,bomber:.14,heavy:.07},
 3:{scout:.2,hunter:.6,bomber:.133,heavy:.067},
 4:{scout:.118,hunter:.588,bomber:.176,heavy:.118},
 5:{scout:.05,hunter:.45,bomber:.30,heavy:.20},
 6:{scout:.056,hunter:.722,bomber:.111,heavy:.111},
 7:{scout:.1875,hunter:.375,bomber:.3125,heavy:.125}
};
const REGION_EVENTS={0:'FORWARD_OBSERVER',1:'FLEET_CROSSING',2:'ARTILLERY_SPOTTER',3:'GAS_ATTACK',4:'BLACKOUT',5:'BOMBER_STREAM',6:'MOUNTAIN_PURSUIT',7:'AMMO_DEPOT'};
const EVENT_LABEL={FORWARD_OBSERVER:'전진 관측소',FLEET_CROSSING:'함대 교차 해역',ARTILLERY_SPOTTER:'포병 관측기',GAS_ATTACK:'가스 공습',BLACKOUT:'야간 정전',BOMBER_STREAM:'폭격기 대형',MOUNTAIN_PURSUIT:'산악 추격전',AMMO_DEPOT:'탄약고 타격'};
// Existing scenery/hazard owners stay authoritative. These are regional rules,
// not optional mission offers, so they never suspend the Battle Director.
export const REGION_COMBAT_EVENTS=Object.freeze({
 0:'기뢰지대·관측기구',1:'아군·적 함대 교차 화망',2:'이동 집중포격',3:'가스·연막 전선',
 4:'탐조등 추적·연동 사격',5:'순풍·역풍 기류',6:'상승기류·난기류',7:'함포 동시 일제사격',
 8:'진행 방향 횡단 포격',9:'고공 돌풍·비행단',10:'관측기구 격추로 포격 약화',
 11:'진영별 런던 공격·방어',12:'요새 접근로 포격',13:'먼지바람 엄폐'
});
export function tickRegionalConditions(g,dt){
 if(g.state!=='playing'||dt<=0)return;
 const region=g.worldRegion(),now=g.t||0,step=Math.min(.04,dt);
 if(g.regionalCondition?.region!==region)g.regionalCondition={region,next:now+5,serial:0,spotter:null,weakenedUntil:0};
 const r=g.regionalCondition;
 if(g.stageBoss?.stages.phase!=='explore')return;
 const ps=(g.players||[g]).filter(p=>p.hp>0&&(!p.status||p.status==='alive'));
 if(region===6){
  for(const p of ps)for(const gust of g.gusts||[])if(gust.thermal&&gust.life>0&&Math.hypot(p.x-gust.x,p.y-gust.y)<gust.radius){
   const energy=p.airframeSpeed??1;p.airframeSpeed=energy+(1-energy)*(1-Math.exp(-3*step));
  }
 }
 if(region===10&&r.spotter?.hp<=0&&!r.spotterDefeated){
  r.spotterDefeated=true;r.weakenedUntil=now+24;
  g.event('wave','관측기구 격추 · 24초간 포격 밀도 감소');
 }
 if(now<r.next)return;
 r.serial++;
 const p=ps[r.serial%Math.max(1,ps.length)]||g,a=p.a||0;
 const shells=(count,spacing,delay=1.8)=>{
  if((g.bombZones||[]).length>12)return;
  for(let i=0;i<count;i++){
   const side=(i-(count-1)/2)*spacing;
   (g.bombZones??=[]).push({x:p.x+Math.cos(a)*120-Math.sin(a)*side,y:p.y+Math.sin(a)*120+Math.cos(a)*side,sx:p.x-Math.sin(a)*420,sy:p.y+Math.cos(a)*420,delay:delay+i*.15,maxDelay:delay+i*.15,radius:38,damage:12,artyFire:true,hazardRegion:region});
  }
 };
 if(region===2){
  // Keep the authored moving barrage; put its first warning ahead of the pilot.
  if(g.mode==='coop2'){
   r.barrageOrigin??={x:p.x+Math.cos(a)*180,y:p.y+Math.sin(a)*180,a};
   const o=r.barrageOrigin,progress=(r.serial%5)*55;
   for(let i=-1;i<=1;i++)(g.bombZones??=[]).push({x:o.x+Math.cos(o.a)*progress-Math.sin(o.a)*i*55,y:o.y+Math.sin(o.a)*progress+Math.cos(o.a)*i*55,sx:o.x-350,sy:o.y-200,delay:1.8,maxDelay:1.8,radius:32,damage:12,artyFire:true,hazardRegion:2});
   if(r.serial%5===0){r.barrageOrigin=null;r.next=now+14;}else r.next=now+2.2;
  }else{if(!g.barrage)g.spawnBarrage?.();r.next=now+32;}
 }else if(region===6){
  if((g.gusts||[]).length<4){
   const thermal=r.serial%2===1;
   (g.gusts??=[]).push({x:p.x+Math.cos(a)*170,y:p.y+Math.sin(a)*170,vx:Math.cos(a)*28,vy:Math.sin(a)*28,a,life:9,maxLife:9,radius:thermal?100:65,thermal,hit:false,hitPlayers:new Set()});
   g.event('flak',thermal?'상승기류 · 기류 안에서 에너지 회복':'산악 난기류 · 옆으로 벗어나세요');
  }r.next=now+12;
 }else if(region===7){
  const ships=(g.enemies||[]).filter(e=>e.movingShip&&e.hp>0&&e.faction!==(g.teamFaction||g.faction||p.faction)&&!e.expired);
  if(!ships.length)g.spawnMovingFleet?.();
  else{for(const e of ships)e.fire=1.2;g.event('flak','군항 함포 · 일제사격 준비');}
  r.next=now+14;
 }else if(region===8){shells(4,85);g.event('flak','캉브레 · 횡단 포격선');r.next=now+12;}
 else if(region===10){
  if(!r.spotter||r.spotter.expired||r.spotterDefeated&&now>=r.weakenedUntil){
   r.spotter=(g.enemies||[]).find(e=>e.hp>0&&e.fieldUnit==='balloon'&&!e.expired)||g.spawnFieldUnit?.('balloon');
   if(r.spotter){r.spotterDefeated=false;g.event('flak','솜 관측기구 · 격추하면 적 포격이 약해집니다');}
  }
  shells(now<r.weakenedUntil?1:3,110);r.next=now+(now<r.weakenedUntil?9:5);
 }else r.next=now+20;
}

export function installRegionDoctrine(Game){
 const P=Game.prototype;
 const _comp=Game.prototype.spawnComposition;
 Game.prototype.spawnComposition=function(){
  const w=DOCTRINE[this.worldRegion()];
  if(!w)return _comp.call(this);
  const r=this.rng();let acc=0;
  for(const t of AIR_TYPES){acc+=w[t==='heavyBomber'?'heavy':t]||0;if(r<acc)return t==='heavyBomber'?(this.rng()<.25?'zeppelin':'heavyBomber'):t}
  return 'hunter';
 };
 const installEvents=()=>{
 if(P.__regionalBattlefieldEvents1)return;P.__regionalBattlefieldEvents1=true;
 const _offer=Game.prototype.offerBattlefieldEvent;
 Game.prototype.offerBattlefieldEvent=function(preferred){
  const rt=REGION_EVENTS[this.worldRegion()];
  const state=this.battlefieldEvents;
  if(!preferred&&rt&&this.canOfferBattlefieldEvent?.()&&this.rng()<.6&&state&&state.lastType!==rt){
   const event={id:++state.serial,type:rt,label:EVENT_LABEL[rt],status:'active',offeredAt:this.t||0,startedAt:this.t||0,region:this.worldRegion(),targets:[],deadline:(this.t||0)+70};
   if(this._spawnRegionalTargets(event)){
    state.current=event;
    state.nextOfferAt=(this.t||0)+BATTLEFIELD_EVENT_BALANCE.cooldownMin+this.rng()*(BATTLEFIELD_EVENT_BALANCE.cooldownMax-BATTLEFIELD_EVENT_BALANCE.cooldownMin);
    this.event('wave','지역 작전 — '+EVENT_LABEL[rt]);
    return event;
   }
  }
  return _offer.call(this,preferred);
 };
 P._spawnRegionalTargets=function(event){
  const mark=e=>{if(e){e.missionTarget=true;e.battlefieldEventId=event.id;e.battlefieldEventType=event.type;event.targets.push(e)}return e};
  switch(event.type){
   case 'FORWARD_OBSERVER':{
    this.spawnFieldUnit('balloon');
    const bal=this.enemies.find(e=>e.fieldUnit==='balloon'&&e.hp>0&&!e.battlefieldEventId);
    if(bal){bal.spotterBoost=true;mark(bal)}
    mark(this.spawnEnemy('scout'));mark(this.spawnEnemy('scout'));
    event.deadline=(this.t||0)+20;event.failBoost='observation';
    return event.targets.length>=2;
   }
   case 'FLEET_CROSSING':{
    this.fleetCrossing?.();event.deadline=(this.t||0)+22;event.ambient=true;return true;
   }
   case 'ARTILLERY_SPOTTER':{
    for(let i=0;i<2;i++){const s=mark(this.spawnEnemy('scout'));if(s)Object.assign(s,{spotter:true,fire:1.6})}
    event.deadline=(this.t||0)+15;event.failBoost='barrage';
    return event.targets.length===2;
   }
   case 'GAS_ATTACK':{
    const dir=this.a+(this.rng()-.5)*.5;
    (this.gasZones||=[]).push(
     {x:this.x+Math.cos(this.a)*420,y:this.y+Math.sin(this.a)*420,r:150,life:22,driftDir:dir,eventGas:true},
     {x:this.x+Math.cos(this.a)*560+150,y:this.y+Math.sin(this.a)*560-80,r:170,life:24,driftDir:dir,eventGas:true});
    event.deadline=(this.t||0)+22;event.ambient=true;return true;
   }
   case 'BLACKOUT':{
    const light=this.enemies.find(e=>e.cityUnit==='light'&&e.hp>0);
    if(light){mark(light);event.deadline=(this.t||0)+18;event.winBoost='blackout';return true}
    this._citySpawned=false;this.spawnCityNet?.();
    const l2=this.enemies.find(e=>e.cityUnit==='light'&&e.hp>0);
    if(l2){mark(l2);event.deadline=(this.t||0)+18;event.winBoost='blackout';return true}
    return false;
   }
   case 'BOMBER_STREAM':{
    for(let i=0;i<3;i++){const b=mark(this.spawnEnemy('heavyBomber'));if(b){const p=this;Object.assign(b,{eventExit:true,fire:1.2});b.eventExitOrigin={x:b.x,y:b.y};b.eventExitHeading=Math.atan2(b.y-this.y,b.x-this.x)}}
    mark(this.spawnEnemy('hunter'));mark(this.spawnEnemy('hunter'));
    event.deadline=(this.t||0)+60;
    return event.targets.length>=3;
   }
   case 'MOUNTAIN_PURSUIT':{
    const ace=mark(this.spawnEnemy('boss'));if(ace)Object.assign(ace,{eventAce:true,battlefieldEventAce:true,fire:.5});
    mark(this.spawnEnemy('hunter'));mark(this.spawnEnemy('hunter'));
    event.deadline=(this.t||0)+60;return event.targets.length>=2;
   }
   case 'AMMO_DEPOT':{
    let dep=this.enemies.find(e=>e.harborFacility==='depot'&&e.hp>0);
    if(!dep){this._harborSpawned=false;this.spawnHarborFacilities?.();dep=this.enemies.find(e=>e.harborFacility==='depot'&&e.hp>0)}
    if(dep){mark(dep);event.deadline=(this.t||0)+15;return true}
    return false;
   }
  }
  return false;
 };
 const _tick=Game.prototype.tickBattlefieldEvents;
 Game.prototype.tickBattlefieldEvents=function(){
  const state=this.battlefieldEvents,event=state?.current,now=this.t||0;
  if(!event||!Object.values(REGION_EVENTS).includes(event.type))return _tick.call(this);
  {
   this.tickBattlefieldConsequences?.();
   const done=outcome=>{
    for(const target of event.targets||[]){target.missionTarget=false;target.eventExit=false;delete target.eventExitOrigin}
    this.recordBattlefieldOutcome?.(event,outcome);
    state.result={id:event.id,type:event.type,outcome};state.history.push({type:event.type,outcome,time:now});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;
    if(outcome==='completed'){
     const p=this;
     for(let i=0;i<4;i++)(this.drops||=[]).push({x:p.x+Math.cos(i*1.7)*46,y:p.y+Math.sin(i*1.7)*46,value:i<3?11:12,heal:false,battlefieldEvent:true});
     (this.drops||=[]).push({x:p.x-60,y:p.y,value:0,heal:true,supply:true,life:16,vx:0,vy:0,battlefieldEvent:true});
    }
    if(outcome==='completed'&&event.winBoost==='blackout'){this.illuminatedUntil=0;this.blackoutUntil=now+15}
   };
   if(event.ambient){if(now>=event.deadline)done('completed');return}
   if(event.targets?.some(t=>t.hp>0&&(t.rivalEscaped||t.expired)))return done('failed');
   if(event.type==='BOMBER_STREAM')for(const target of event.targets||[])if(target.hp>0&&target.eventExitOrigin&&Math.hypot(target.x-target.eventExitOrigin.x,target.y-target.eventExitOrigin.y)>=(target.eventExitDistance||BATTLEFIELD_EVENT_BALANCE.bomberExitDistance))return done('failed');
   if(event.targets?.length&&event.targets.every(t=>t.hp<=0||t.deathHandled))return done('completed');
   if(now>=event.deadline)return done('failed');
   return;
  }
  return _tick.call(this);
 };
 };
 if(P.__battlefieldEvents170)installEvents();else P.installRegionalBattlefieldEvents=installEvents;
 // Blackout: suppress city fire net while active.
 const _caSup=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  _caSup.call(this,dt,input);
  if((this.blackoutUntil||0)>(this.t||0))this.illuminatedUntil=0;
 };
};
