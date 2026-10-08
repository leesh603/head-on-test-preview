import assert from 'node:assert/strict';
import {Game,LEGENDARIES,UPGRADES} from '../engine.js?v=raid1';
import {CoopGame} from '../coop-engine.js?v=raid1';

const id='heineckeRettungsfallschirm';
assert(LEGENDARIES.some(x=>x.id===id));
assert(UPGRADES.some(x=>x.id===id&&x.legendary));
{
 const g=new Game();g.upgrades[id]=1;g.invuln=0;g.spawn=100;
 const x=g.x,y=g.y,max=g.maxHp;
 g.hit(g.hp+100);
 assert.equal(g.state,'playing');assert.equal(g.heineckeEscape,3);assert.equal(g.heineckeUses,1);
 for(let i=0;i<76&&g.heineckeEscape>0;i++)g.update(.04,{fireHeld:false,inputMode:'gamepad'});
 assert.equal(g.heineckeEscape,0);assert(Math.abs(g.hp-max*.4)<.1);assert(Math.hypot(g.x-x,g.y-y)>250);assert.equal(g.invuln,2);
 g.invuln=0;g.hit(g.hp+100);assert.equal(g.state,'lost');assert.equal(g.heineckeUses,1);
}
{
 const g=new CoopGame([{pilot:'baron'},{pilot:'baron'}],{rng:()=>.5,runId:'heinecke-test'});
 for(const p of g.players){p.upgrades[id]=1;p.invuln=0}
 for(const p of g.players)assert.equal(g.hitPlayer(p,p.hp+100),true);
 assert.equal(g.state,'playing');assert.equal(g.living().length,2);
 for(let i=0;i<76&&g.players.some(p=>p.heineckeEscape>0);i++)g.update(.04,{});
 assert.equal(g.state,'playing');
 for(const p of g.players){assert.equal(p.heineckeEscape,0);assert(Math.abs(p.hp-p.maxHp*.4)<.1);assert.equal(p.invuln,2);assert.equal(p.heineckeUses,1)}
 const p=g.players[0];p.invuln=0;g.hitPlayer(p,p.hp+100);assert.equal(p.status,'downed');assert.equal(g.state,'playing');assert.equal(g.players[1].status,'alive');
}
console.log('Heinecke solo/co-op integration passed');
