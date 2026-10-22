import test from 'node:test';
import assert from 'node:assert/strict';
import {installBattlefieldEvents,BATTLEFIELD_EVENT_TYPES as M} from '../battlefield-events170.js?v=tame3';

class MissionGame {
 constructor(){
  Object.assign(this,{mode:'endless',state:'playing',t:200,viewWidth:960,viewHeight:700,battleDirectorPattern:'RECOVERY',
   x:0,y:0,a:0,hp:25,maxHp:100,allyPlane:'camel',drops:[],allies:[],enemies:[],friendlyBombers:[],events:[],rng:()=>.3});
 }
 worldRegion(){return 0}
 event(type,text){this.events.push({type,text})}
 spawnEnemy(type){const unit={type,hp:40,maxHp:40,x:100,y:100,a:0};this.enemies.push(unit);return unit}
 update(dt){this.t+=dt}
}
installBattlefieldEvents(MissionGame);
const begin=(g,scene)=>g.beginBattlefieldEngagement('CHASE',scene,g.t+18);
const completeTargets=(g,type)=>{const m=g.offerBattlefieldEvent(type);assert(m);for(const e of m.targets)e.hp=0;g.tickBattlefieldEvents();return m};

test('emergency supply collection fully repairs alive pilots, not just partial heal',()=>{
 const g=new MissionGame(),m=g.offerBattlefieldEvent(M.SUPPLY_RECOVERY);
 assert.equal(m.supplyDrop.healFraction,1);m.supplyDrop.dead=true;g.tickBattlefieldEvents();
 assert.equal(g.hp,100);assert.equal(g.battlefieldEvents.result.outcome,'completed');
});
test('saved reconnaissance plane brings actual bomber formation for three scenes',()=>{
 const g=new MissionGame(),m=g.offerBattlefieldEvent(M.RECON_ESCORT);
 assert.equal(m.rescue.plane,'re7');g.t=m.endsAt;g.tickBattlefieldEvents();
 assert.equal(g.battlefieldEvents.result.outcome,'completed');
 for(let scene=1;scene<=3;scene++){begin(g,scene);assert.equal(g.friendlyBombers.length,scene*2)}
 begin(g,4);assert.equal(g.friendlyBombers.length,6);
});
test('rescue adds five active allies in each of three scenes',()=>{
 const g=new MissionGame(),m=g.offerBattlefieldEvent(M.RESCUE);
 g.t=m.endsAt;g.tickBattlefieldEvents();
 for(let scene=1;scene<=3;scene++){begin(g,scene);assert.equal(g.allies.filter(a=>a.eventRescueSupport).length,scene*5)}
 begin(g,4);assert.equal(g.allies.length,15);
});
test('commander disruption lasts exactly two engagements',()=>{
 const g=new MissionGame();completeTargets(g,M.HIGH_VALUE_TARGET);
 begin(g,1);assert.equal(g.battlefieldEvents.engagement.formationWeakened,true);
 begin(g,2);assert.equal(g.battlefieldEvents.engagement.formationWeakened,true);
 begin(g,3);assert.equal(g.battlefieldEvents.engagement.formationWeakened,false);
});
test('photo recon reveals one real boss part, not all boss hitboxes',()=>{
 const g=new MissionGame(),m=g.offerBattlefieldEvent(M.PHOTO_RECON);
 for(const w of m.waypoints)w.done=true;g.tickBattlefieldEvents();
 const parts=new Map([['engine',{id:'engine',hittable:true,destroyed:false}],['gun',{id:'gun',hittable:true,destroyed:false}]]);
 const body={id:'hull',x:0,y:0,dead:false,parts,coreVulnerable:true};
 g.stageBoss={stages:{phase:'boss',encounter:{id:'one',bodies:new Map([['hull',body]])}},hit:(args)=>args};
 g.tickBattlefieldConsequences();
 assert.equal(g.battlefieldEvents.bossIntel.partId,'engine');
 assert.equal(g.stageBoss.hit({bodyId:'hull',partId:'engine',damage:100}).damage,135);
 assert.equal(g.stageBoss.hit({bodyId:'hull',partId:'gun',damage:100}).damage,100);
});
test('ace kill grants existing solo upgrade selection, not an XP approximation',()=>{
 const g=new MissionGame();completeTargets(g,M.ACE_CHALLENGE);
 assert.equal(g.state,'upgrade');assert(g.events.some(e=>e.type==='upgrade'));
});
