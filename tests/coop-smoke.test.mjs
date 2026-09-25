import test from 'node:test';
import assert from 'node:assert/strict';

// DOM shims for engine module-level art loaders (browser-only globals).
globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

const {CoopGame}=await import('../coop-engine.js?v=333');
const {Game}=await import('../engine.js?v=333');

const make=()=>new CoopGame([{pilot:'baron'},{pilot:'voss'}],{rng:()=>.5});

// Regression for the missing-method crash: a manual prototype allowlist used to
// silently drop new Game methods (inSmoke, _pickHeavy) and freeze co-op on frame 1.
test('coop and player state inherit every Game prototype method',()=>{
 const g=make(),p=g.players[0];
 for(const name of Object.getOwnPropertyNames(Game.prototype)){
  if(name==='constructor')continue;
  assert.equal(typeof g[name],typeof Game.prototype[name],`CoopGame.${name}`);
  assert.equal(typeof p[name],typeof Game.prototype[name],`PlayerState.${name}`);
 }
});

test('coop sortie ticks without uncaught errors',()=>{
 const g=make();
 g.nextHeavyAt=0; // exercise the _pickHeavy spawn path immediately
 assert.doesNotThrow(()=>{
  for(let i=0;i<1800;i++)g.update(1/60,{});
 });
});

test('smoke concealment and tail lock evaluate on player state',()=>{
 const g=make(),p=g.players[0];
 g.smokeZones=[{x:p.x,y:p.y,r:100,life:5}];
 assert.equal(p.inSmoke(p.x,p.y),true);
 assert.equal(typeof p.tailEligible,'function');
});
