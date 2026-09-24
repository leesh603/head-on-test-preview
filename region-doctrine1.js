// Regional enemy doctrine weights + regional battlefield events.
// Wraps spawnComposition (keeps time-scaling) and offerBattlefieldEvent (keeps canOffer guards).
import {BATTLEFIELD_EVENT_BALANCE} from './battlefield-events170.js?v=214';
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
 const _offer=Game.prototype.offerBattlefieldEvent;
 Game.prototype.offerBattlefieldEvent=function(preferred){
  const rt=REGION_EVENTS[this.worldRegion()];
  const state=this.battlefieldEvents;
  if(rt&&this.canOfferBattlefieldEvent?.()&&this.rng()<.6&&state&&state.lastType!==rt){
   const event={id:++state.serial,type:rt,status:'active',offeredAt:this.t||0,startedAt:this.t||0,targets:[],deadline:(this.t||0)+70};
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
   const done=outcome=>{
    state.result={id:event.id,type:event.type,outcome};state.history.push({type:event.type,outcome,time:now});state.history=state.history.slice(-8);state.lastType=event.type;state.current=null;
    if(outcome==='completed'){
     const p=this;
     for(let i=0;i<4;i++)(this.drops||=[]).push({x:p.x+Math.cos(i*1.7)*46,y:p.y+Math.sin(i*1.7)*46,value:i<3?11:12,heal:false,battlefieldEvent:true});
     (this.drops||=[]).push({x:p.x-60,y:p.y,value:0,heal:true,supply:true,life:16,vx:0,vy:0,battlefieldEvent:true});
    }
    if(outcome==='completed'&&event.winBoost==='blackout'){this.illuminatedUntil=0;this.blackoutUntil=now+15}
    if(outcome==='failed'&&event.failBoost==='observation')this.observationBoostUntil=now+25;
    if(outcome==='failed'&&event.failBoost==='barrage')this.barrageBoost=true;
   };
   if(event.ambient){if(now>=event.deadline)done('completed');return}
   if(event.targets?.length&&event.targets.every(t=>t.hp<=0||t.expired||t.rivalEscaped))return done('completed');
   if(event.targets?.some(t=>t.rivalEscaped))return done('failed');
   if(now>=event.deadline)return done('failed');
   return;
  }
  return _tick.call(this);
 };
 // Blackout: suppress city fire net while active.
 const _caSup=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  _caSup.call(this,dt,input);
  if((this.blackoutUntil||0)>(this.t||0))this.illuminatedUntil=0;
 };
};
