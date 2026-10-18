import '../campaign.js?v=gal1&rail=42';
import './pilot-feedback-globals.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,PLANES,PILOT_PLANES,PILOTS} from '../engine.js?v=fiveace1';
import {CoopGame} from '../coop-engine.js?v=fiveace1';
import {PILOT_IDENTITY_COPY} from '../pilot-identity-copy.js';
import {fiveAceState,isFiveAceAirship} from '../pilot-five-combat.js';
const ids=['fonck','gontermann','luke','proctor','lufbery'];
// TP dedicated ace liveries are registered by campaign.js into its own engine instance;
// the plain engine falls back to each ace's base airframe.
const BASE_PLANE={fonck:'camel',gontermann:'fokker',luke:'nieuport',proctor:'se5a',lufbery:'nieuport',schleich:'albatros'};
const planeOf=id=>PILOT_PLANES[id] in PLANES?PILOT_PLANES[id]:BASE_PLANE[id]||PILOT_PLANES[id];
const makeRound=(p,extra={})=>({x:p.x+25,y:p.y,vx:650,vy:0,life:1.55,gun:0,enemy:false,ownerId:p.id||'p1',damage:12,hit:new Set(),...extra});
function session(id,coop=false){
 const g=coop?new CoopGame([{pilot:id},{pilot:PILOTS[id].faction==='central'?'baron':'ball'}],{rng:()=>.5}):new Game(planeOf(id),id,()=>.5),p=g.players?.[0]||g;
 for(const key of ['spawn','nextBossAt','_zeppelinSchedule','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer','fieldUnitTimer','gasTimer','patrolTimer'])g[key]=Infinity;
 Object.assign(p,{x:0,y:0,a:0,invuln:0,need:Infinity,speed:0,baseSpeed:0,fire:0});if(g.players)Object.assign(g.players[1],{x:1500,y:1500,fire:Infinity,need:Infinity});
 const tick=(n=1,input={})=>{for(let i=0;i<n;i++){if(coop){g.t+=.02;g.updatePlayer(p,.02,input);g.ensureWingmen();g.updateSupport(.02);g.updateOrdnance(.02);}else g.update(.02,input);}};
 const enemy=(x,y)=>{const e={x,y,a:0,hp:100000,maxHp:100000,speed:0,fire:Infinity,type:'hunter',wobble:0};g.enemies.push(e);return e};return{g,p,tick,enemy};
}
for(const coop of [false,true]){
 const mode=coop?'coop':'solo';
 for(const id of ids)test(`${mode}/${id}: real engine activation, expiry and finite state`,()=>{
  const {g,p,tick,enemy}=session(id,coop);enemy(220,0);enemy(-220,15);const rate=p.rate,damage=p.damage;
  assert.equal(p.skill(),true);assert.equal(p.skill(),false);tick(430,{steer:.2});
  assert.equal(p.skillTime,0);assert.equal(fiveAceState(p).active,false);assert.equal(p.rate,rate);assert.equal(p.damage,damage);
  for(const key of ['x','y','a','hp','rate','turn','roundsFired'])assert.ok(Number.isFinite(p[key]),id+' '+key);
  assert.ok(g.bullets.every(b=>[b.x,b.y,b.vx,b.vy].every(Number.isFinite)));
  if(id!=='lufbery')assert.ok(fiveAceState(p).fired>0);else assert.ok(p.permanentWingman>=1);
 });
 test(`${mode}: Luke airship bosses only and no passive ignition`,()=>{
  const {p,enemy}=session('luke',coop),normal=enemy(250,0),ship={...normal,type:'zeppelin'},boss={...normal,stageBossBody:{kind:'zeppelin-l70'}},b=makeRound(p);
  const base=p.roundDamageMultiplier(b,normal);assert.ok(Math.abs(p.roundDamageMultiplier(b,ship)/base-1.2)<1e-8);assert.ok(Math.abs(p.roundDamageMultiplier(b,boss)/base-1.2)<1e-8);
  for(const e of [{...normal,type:'bomber'},{...normal,stageBossBody:{kind:'staaken-rvi'}},{...normal,stageBossBody:{kind:'a7v-flak'}}])assert.equal(p.roundDamageMultiplier(b,e),base);
  p.applySpecialRound(b,null);p.identityImpact(b,normal);assert.equal(p.identityState().burns.size,0);
 });
 test(`${mode}: Gontermann stores actual part, Luke finite ordered chain`,()=>{
  const {p,enemy}=session('gontermann',coop),e=enemy(250,0),target={x:0,y:0,hp:400,id:'engine-1'};e.stageBossBody={kind:'zeppelin-l70',x:250,y:0};
  for(let i=0;i<3;i++){p.identityState().clock+=.12;p.identityImpact(makeRound(p),e,target,{x:250,y:0});}
  assert.equal(fiveAceState(p).prepared,target);assert.equal(fiveAceState(p).hits,3);
  p.identityImpact(makeRound(p,{fiveAceRound:true,fiveAcePhase:'ignite'}),e,target,{x:250,y:0});assert.ok(p.identityState().burns.has(target));
  const run=session('luke',coop),targets=[run.enemy(250,0),run.enemy(290,20),run.enemy(330,-20)];
  for(const target of targets)run.p.identityImpact(makeRound(run.p,{fiveAceRound:true,fiveAcePhase:'ignite'}),target);
  run.p.identityImpact(makeRound(run.p,{fiveAceRound:true,fiveAcePhase:'detonate'}),targets[0]);
  run.tick(45);assert.equal(fiveAceState(run.p).chainCount,3);assert.equal(fiveAceState(run.p).chain.length,0);assert.ok(targets.some(e=>e.hp<100000));
 });
 test(`${mode}: Proctor four distinct bursts, finite first-hit suppression`,()=>{
  const {p,tick,enemy}=session('proctor',coop),e=enemy(200,0);e.fire=0;p.identityImpact(makeRound(p),e);assert.equal(e.fire,.4);e.fire=.1;p.identityImpact(makeRound(p),e);assert.equal(e.fire,.1);
  const boss={...e,bossPilot:'voss',fire:0};p.identityImpact(makeRound(p),boss);assert.equal(boss.fire,0);
  p.skill();tick(125,{steer:.4});assert.equal(fiveAceState(p).bursts,4);
 });
 test(`${mode}: Lufbery counts, fixed anchor, foreign wings and player control`,()=>{
  const {g,p,tick,enemy}=session('lufbery',coop);enemy(-200,0);tick(2);const initial=p.permanentWingman;assert.equal(initial,1);p.skill();const s=fiveAceState(p),anchor={...s.orbit};
  assert.equal(g.allies.filter(a=>a.fiveLafayette&&a.ownerId===p.id).length,2);const foreign={ownerId:'other',x:33,y:44,a:0,life:20};const snap={...foreign};assert.equal(p.updatePilotWing(foreign,.02),false);assert.deepEqual(foreign,snap);
  tick(140,{steer:.6});assert.ok(Math.abs(p.a)>.2);assert.deepEqual(s.orbit,anchor);assert.equal(p.permanentWingman,initial);
 });
}
test('five pilot catalog is identical across hangar short/full text and runtime',()=>{for(const id of ids){const copy=PILOT_IDENTITY_COPY[id];assert.equal(PILOTS[id].skill,copy.ko.skill);assert.equal(PILOTS[id].passive,copy.ko.passive);assert.equal(PILOTS[id].desc,copy.ko.activeDetail);assert.ok(copy.en.activeShort&&copy.en.passiveDetail);}});
test('airship class never inferred from brand or generic boss type',()=>{assert.ok(isFiveAceAirship({kind:'hma23'}));assert.equal(isFiveAceAirship({type:'boss',name:'Zeppelin-Staaken R.VI'}),false);});

test('all five real loadouts exist in the browser engine instance',async()=>{const {Game:G2,PLANES,WEAPONS}=await import('../engine.js?v=gal1&rail=42');const {CampaignGame}=await import('../campaign.js?v=gal1&rail=42');assert.ok(CampaignGame.prototype instanceof G2);for(const id of ids){const k=BASE_PLANE[id]&&BASE_PLANE[id] in PLANES?BASE_PLANE[id]:PILOT_PLANES[id];assert.ok(PLANES[k],id);assert.ok(WEAPONS[k],id);}});

for(const coop of [false,true])test(`Luke lethal detonation keeps the queued cookoff (${coop?'coop':'solo'})`,()=>{
 const {p,tick,enemy}=session('luke',coop),a=enemy(200,0),b=enemy(235,15);
 for(const e of [a,b])p.identityImpact(makeRound(p,{fiveAceRound:true,fiveAcePhase:'ignite'}),e);
 a.hp=0;p.identityImpact(makeRound(p,{fiveAceRound:true,fiveAcePhase:'detonate'}),a);
 tick(25);assert.equal(fiveAceState(p).chainCount,2);assert.equal(fiveAceState(p).chain.length,0);
});
