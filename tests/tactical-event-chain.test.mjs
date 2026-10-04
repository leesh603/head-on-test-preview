import test from 'node:test';
import assert from 'node:assert/strict';
import {installBattlefieldEvents,BATTLEFIELD_EVENT_TYPES as E} from '../battlefield-events170.js?v=524';
import {installRegionDoctrine} from '../region-doctrine1.js?v=524';
import {installBattleDirector} from '../battle-director169.js?v=524';

function ready(region=0){
 class Game{
  constructor(){Object.assign(this,{t:200,state:'playing',x:0,y:0,a:0,hp:100,viewWidth:960,enemies:[],allies:[],drops:[],region,rng:()=>.1,battleDirectorPattern:'RECOVERY',volleyCount:0})}
  worldRegion(){return this.region}
  spawnComposition(){return 'hunter'}
  spawnEnemy(type){const e={type,hp:30,maxHp:30,x:420,y:0,a:0,speed:150};this.enemies.push(e);return e}
  spawnFieldUnit(kind){this.enemies.push({type:kind,fieldUnit:kind,hp:100,x:400,y:0,stationary:true})}
  regularSpawnInterval(){return 2}
  regularEnemyLimit(){return 12}
  update(){}
  event(){}
  observedVolley(){this.volleyCount++}
  fieldVolley(e){e.volleys=(e.volleys||0)+1}
 }
 installRegionDoctrine(Game); // Same order as the production engine.
 installBattleDirector(Game,{passStates:{DISENGAGE:'DISENGAGE',APPROACH:'APPROACH',REPOSITION:'REPOSITION',COMMIT:'COMMIT'},directorAircraftEligible:(_,e)=>!e.stationary&&!e.missionTarget});
 installBattlefieldEvents(Game);
 const game=new Game();game.canOfferBattlefieldEvent();return game;
}
const complete=(game,event)=>{for(const target of event.targets)target.hp=0;game.tickBattlefieldEvents()};
const begin=(game,pattern='CHASE')=>game.beginBattleDirectorPattern(pattern);

test('regional hooks survive production install order; artillery result affects only next combat',()=>{
 const success=ready(2),event=success.offerBattlefieldEvent();assert.equal(event.type,'ARTILLERY_SPOTTER');complete(success,event);
 assert(event.targets.every(target=>!target.missionTarget));begin(success,'RECOVERY');assert(success.battlefieldEvents.pending.artillery);
 begin(success);success.observedVolley(false);assert.equal(success.volleyCount,0);success.observedVolley(false);assert.equal(success.volleyCount,1);
 begin(success);success.observedVolley(false);assert.equal(success.volleyCount,2);
 const failure=ready(2),failed=failure.offerBattlefieldEvent();failure.t=failed.deadline;failure.tickBattlefieldEvents();assert.equal(failure.battlefieldEvents.result.outcome,'failed');
 begin(failure);failure.t+=3;failure.tickBattlefieldConsequences();assert.equal(failure.volleyCount,1);failure.tickBattlefieldConsequences();assert.equal(failure.volleyCount,1);
 assert.equal(failure.barrageBoost,undefined);assert.equal(failure.observationBoostUntil,undefined);
});

test('observer success cancels a complete field salvo, never modifies HP or shell damage',()=>{
 const game=ready(0),event=game.offerBattlefieldEvent();assert.equal(event.type,'FORWARD_OBSERVER');complete(game,event);begin(game);
 const cannon={fieldUnit:'railgun',fieldSalvoLeft:2,hp:600};game.fieldVolley(cannon);assert.equal(cannon.fieldSalvoLeft,0);assert.equal(cannon.volleys,undefined);assert.equal(cannon.hp,600);
 game.fieldVolley(cannon);assert.equal(cannon.volleys,1);
});

test('bomber interception forces or suppresses one combat run without repeated bias',()=>{
 const failure=ready(),event=failure.offerBattlefieldEvent(E.BOMBER_INTERCEPT);assert.equal(event.type,E.BOMBER_INTERCEPT);
 event.targets[0].x+=event.targets[0].eventExitDistance+1;failure.tickBattlefieldEvents();assert.equal(failure.battlefieldEvents.result.outcome,'failed');
 assert.equal(begin(failure,'RECOVERY'),'RECOVERY');assert.equal(begin(failure),'BOMBER_RUN');assert(failure.battleDirector.queue.every(action=>action.type==='bomber'));assert.equal(begin(failure),'CHASE');
 const success=ready(),intercept=success.offerBattlefieldEvent(E.BOMBER_INTERCEPT);complete(success,intercept);assert.equal(begin(success,'BOMBER_RUN'),'HEAD_ON_PASS');assert(success.battleDirector.queue.every(action=>action.type==='hunter'));assert.equal(begin(success,'BOMBER_RUN'),'BOMBER_RUN');
});

test('regional bomber escape is failure, not completion, and creates next-run priority',()=>{
 const game=ready(5),event=game.offerBattlefieldEvent();assert.equal(event.type,'BOMBER_STREAM');event.targets[0].x+=1000;game.tickBattlefieldEvents();assert.equal(game.battlefieldEvents.result.outcome,'failed');assert.equal(begin(game),'BOMBER_RUN');
 const escaped=ready(6),pursuit=escaped.offerBattlefieldEvent();pursuit.targets[0].rivalEscaped=true;escaped.tickBattlefieldEvents();assert.equal(escaped.battlefieldEvents.result.outcome,'failed');
});

test('commander and rescue outcomes use bounded next-scene state and existing ally path',()=>{
 const commander=ready(),event=commander.offerBattlefieldEvent(E.HIGH_VALUE_TARGET);complete(commander,event);begin(commander);assert.equal(commander.battlefieldEvents.engagement.formationWeakened,true);assert.equal(commander.battlefieldEvents.engagement.sceneId,commander.battleDirector.sceneId);begin(commander);assert.equal(commander.battlefieldEvents.engagement.formationWeakened,false);
 const rescue=ready(),mission=rescue.offerBattlefieldEvent(E.RESCUE),saved=mission.rescue;rescue.t=mission.endsAt;rescue.tickBattlefieldEvents();assert.equal(saved.life,0);begin(rescue);const support=rescue.allies.filter(a=>a.eventRescueSupport);assert.equal(support.length,1);assert.equal(support[0].life,16);assert.equal(support[0].hp,saved.hp);begin(rescue);assert.equal(rescue.allies.filter(a=>a.eventRescueSupport).length,1);
});

test('later outcomes replace pending slots; expiration or leaving region consumes nothing elsewhere',()=>{
 const game=ready();game.recordBattlefieldOutcome({id:1,type:E.BOMBER_INTERCEPT},'failed');game.recordBattlefieldOutcome({id:2,type:E.BOMBER_INTERCEPT},'completed');assert.equal(Object.keys(game.battlefieldEvents.pending).length,1);assert.equal(begin(game,'BOMBER_RUN'),'HEAD_ON_PASS');
 game.recordBattlefieldOutcome({id:3,type:E.BOMBER_INTERCEPT},'failed');game.t+=91;assert.equal(begin(game),'CHASE');
 game.recordBattlefieldOutcome({id:4,type:'ARTILLERY_SPOTTER'},'failed');game.region=1;begin(game);game.t+=3;game.tickBattlefieldConsequences();assert.equal(game.volleyCount,0);
});

test('depot disruption reaches only harbor fortress coastal reload, restores after 18 seconds',()=>{
 const game=ready(7);game.recordBattlefieldOutcome({id:1,type:'AMMO_DEPOT',region:7},'completed');
 const other={kind:'gik',hp:400,t:{coastalInterval:2.5,suppressiveInterval:3.4}};
 game.stageBoss={stages:{phase:'boss',encounter:{bodies:new Map([['other',other]])}}};game.tickBattlefieldConsequences();assert.equal(other.t.coastalInterval,2.5);assert(game.battlefieldEvents.pending.facility);
 const body={kind:'armored-harbor-fortress',hp:2000,t:{coastalInterval:2.5,damage:18,craneInterval:4.8}};game.stageBoss.stages.encounter.bodies.set('harbor',body);game.tickBattlefieldConsequences();assert(Math.abs(body.t.coastalInterval-2.95)<1e-10);assert.equal(body.hp,2000);assert.equal(body.t.damage,18);assert.equal(body.t.craneInterval,4.8);assert.equal(game.battlefieldEvents.pending.facility,undefined);
 game.t+=18;game.tickBattlefieldConsequences();assert.equal(body.t.coastalInterval,2.5);game.tickBattlefieldConsequences();assert.equal(body.t.coastalInterval,2.5);
});

test('real solo and co-op consume regional artillery and bomber results through the Director',async()=>{
 const {Game}=await import('../engine.js?v=524');const {CoopGame}=await import('../coop-engine.js?v=524');
 for(const game of [new Game('fokker','baron',()=>.1),new CoopGame([{plane:'fokker',pilot:'baron'},{plane:'fokker',pilot:'voss'}],{rng:()=>.1})]){
  game.lockedRegion=2;game.t=200;game.battleDirectorPattern='RECOVERY';game.enemies=[];game.canOfferBattlefieldEvent();
  const event=game.offerBattlefieldEvent();assert.equal(event.type,'ARTILLERY_SPOTTER');complete(game,event);begin(game);const count=game.bullets.length;game.observedVolley(false);assert.equal(game.bullets.length,count);game.observedVolley(false);assert.equal(game.bullets.length,count+7);
  game.recordBattlefieldOutcome({id:900,type:E.BOMBER_INTERCEPT},'failed');assert.equal(begin(game),'BOMBER_RUN');game.t+=.4;game.tickBattleDirector(.04);assert(game.enemies.some(e=>e.directorPattern==='BOMBER_RUN'&&e.type==='bomber'));
 }
});

test('real commander aftermath briefly breaks next scene aircraft, then expires',async()=>{
 const {Game}=await import('../engine.js?v=524');const game=new Game('fokker','baron',()=>.25);game.t=200;game.enemies=[];game.recordBattlefieldOutcome({id:901,type:E.HIGH_VALUE_TARGET},'completed');begin(game,'CROSS_ATTACK');game.t+=.4;game.tickBattleDirector(.04);const fighter=game.enemies.find(e=>e.directorSceneId===game.battleDirector.sceneId);assert(fighter);assert(fighter.formationCollapseUntil>game.t);assert(fighter.fire>=2);game.t=fighter.formationCollapseUntil+.01;assert.equal(fighter.hp,fighter.maxHp);assert(fighter.formationCollapseUntil<game.t);
});
