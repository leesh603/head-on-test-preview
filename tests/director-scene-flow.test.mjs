import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../engine.js?v=513';
import {BATTLE_DIRECTOR_PATTERNS as P} from '../battle-director169.js?v=513';

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
