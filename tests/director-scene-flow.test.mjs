import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=tame3&rail=13';
import {BATTLE_DIRECTOR_PATTERNS as P} from '../battle-director169.js?v=tame3';


const setup=()=>{const g=new Game('fokker','baron',()=>.2);g.state='playing';g.viewWidth=1200;g.t=10;g.players=[];return g};
const tick=(g,n=1,dt=.5)=>{for(let i=0;i<n;i++){g.t+=dt;g.tickBattleDirector(.04)}};

test('a live combat scene suppresses regular and scheduled mob spawns',()=>{
 const g=setup();g.beginBattleDirectorPattern(P.CROSS_ATTACK);tick(g,4);
 assert.equal(g.battleDirectorPattern,P.CROSS_ATTACK);
 assert.equal(g.directorMobSpawnsSuppressed(),true);
 assert.equal(g.mobSpawnsSuppressed(),true);
});

test('wiping a directed squad auto-chains into a recovery scene',()=>{
 const g=setup();g.beginBattleDirectorPattern(P.CROSS_ATTACK);tick(g,6);
 assert(g.enemies.some(e=>e.directorSquad&&e.hp>0),'squad spawned');
 for(const e of g.enemies)if(e.directorSquad)e.hp=0;
 tick(g,4);
 assert.equal(g.battleDirectorPattern,P.RECOVERY);
});

test('an active battlefield event suspends the director and releases squads',()=>{
 const g=setup();g.beginBattleDirectorPattern(P.CHASE);tick(g,6);
 g.battlefieldEvents={current:{status:'active',type:'FORWARD_OBSERVER'}};
 g.tickBattleDirector(.04);
 assert.equal(g.battleDirectorPattern,null);
 assert.equal(g.battleDirector.suspended,true);
 assert(!g.enemies.some(e=>e.directorSquad&&e.hp>0));
 g.battlefieldEvents={};
 tick(g,12);
 assert(g.battleDirectorPattern,'director resumes after the event');
});

test('recovery scenes keep suppression and are followed by a combat scene',()=>{
 const g=setup();g.beginBattleDirectorPattern(P.RECOVERY);tick(g,2);
 assert.equal(g.directorMobSpawnsSuppressed(),true);
 tick(g,40);
 const combat=g.battleDirector.history.filter(p=>p!==P.RECOVERY&&p!==P.ACE_PRESSURE);
 assert(combat.length>=1);
 for(let i=1;i<combat.length;i++)assert.notEqual(combat[i],combat[i-1]);
});

test('scene cleanup pauses ordinary replacement pressure and disperses its own formation',()=>{
 const g=setup();g.t=300;g.beginBattleDirectorPattern(P.CROSS_ATTACK);
 for(let i=0;i<3;i++){g.t+=.5;g.tickBattleDirector(.04)}
 assert.equal(g.battleDirector.phase,'approach');assert(g.battleDirector.spawned>=2);
 g.t=g.battleDirector.startedAt+4;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'formation');
 g.t=g.battleDirector.startedAt+9;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'melee');
 for(const e of g.enemies.slice(0,-1))e.hp=0;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'collapse');
 g.spawn=0;g.t=g.battleDirector.endsAt-4;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'cleanup');assert(g.spawn>=4);assert.equal(g.enemies.at(-1).directorLayout,'recovery');
 g.t=g.battleDirector.endsAt-2;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'quiet');
});

test('escort spawns visibly behind its bomber with the same heading',()=>{
 const g=setup();g.t=300;g.beginBattleDirectorPattern(P.ESCORT);
 for(let i=0;i<5;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const bomber=g.enemies.find(e=>e.type==='bomber'),escorts=g.enemies.filter(e=>e.directorLayout==='escort');assert(bomber);assert.equal(escorts.length,4);
 for(const e of escorts){assert.equal(e.a,bomber.a);assert.equal(e.directorEscort,bomber);const forward=(e.x-bomber.x)*Math.cos(bomber.a)+(e.y-bomber.y)*Math.sin(bomber.a);assert(Math.abs(forward+90)<.001)}
});

test('clearing the directed group produces a real quiet gap instead of replacement spam',()=>{
 const g=setup();g.t=300;g.beginBattleDirectorPattern(P.CROSS_ATTACK);
 for(let i=0;i<12&&g.battleDirector.queue.length;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const originalEnd=g.battleDirector.endsAt;for(const e of g.enemies)e.hp=0;g.spawn=0;g.tickBattleDirector(.04);
 assert.equal(g.battleDirector.phase,'quiet');assert(g.battleDirector.endsAt<originalEnd);assert(g.battleDirector.endsAt>g.t+2.5);assert(g.mobSpawnsSuppressed());
 g.t+=2;g.tickBattleDirector(.04);assert.equal(g.battleDirector.phase,'quiet');assert.equal(g.battleDirector.queue.length,0);
});

test('formation loss breaks survivors once without touching stats or scripted enemies',()=>{
 const g=setup();g.t=300;g.beginBattleDirectorPattern(P.CROSS_ATTACK);
 for(let i=0;i<12&&g.battleDirector.queue.length;i++){g.t+=.5;g.tickBattleDirector(.04)}
 const survivor=g.enemies[0],hp=survivor.hp,speed=survivor.speed;for(const e of g.enemies.slice(1))e.hp=0;g.t+=3;g.tickBattleDirector(.04);
 assert.equal(survivor.combatPassState,'DISENGAGE');assert.equal(survivor.combatPassTimer,.85);assert.equal(survivor.hp,hp);assert.equal(survivor.speed,speed);
 survivor.combatPassTimer=.2;g.tickBattleDirector(.04);assert(survivor.combatPassTimer<.5,'no repeated timer reset');
});
