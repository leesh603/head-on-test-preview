import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game,PLANES,PILOTS,angleDiff} from '../engine.js?v=gal1&rail=42';
import {coopPlane,CoopGame} from '../coop-engine.js?v=gal1&rail=42';
import '../campaign.js?v=gal1&rail=42';
import {SORTIE_COMBAT_STYLES as styles} from '../aircraft-combat-roles.js?v=gal1';
import {tickRegionalConditions,REGION_COMBAT_EVENTS} from '../region-doctrine1.js?v=gal1';
const app=fs.readFileSync(new URL('../app.js?v=gal1&rail=42',import.meta.url),'utf8');

const solo=[...app.match(/\(\{baron:baronAircraft,(.*?)\}\[id\]/s)[1].matchAll(/\w+:'([^']+)'/g)].map(m=>m[1]);
const roster=[...new Set([...solo,'fokker','baron_albatros',...Object.keys(PILOTS).map(coopPlane)])];
const make=id=>{const g=new Game(id,'fonck',()=>.5);Object.assign(g,{a:0,x:0,y:0,skillTime:0,level:10,airframeSpeed:.72});return g;};
const fly=(g,seconds,steer=0)=>{for(let t=0;t<seconds-1e-9;t+=.02)g.flyAirframe(.02,{steer});};
const enemy=(x,y)=>({id:999,hp:100,maxHp:100,x,y,a:0,type:'hunter',speed:100});

test('exact solo and coop sortie coverage; no AI or support fits added',()=>{
 assert.equal(roster.length,31);assert.deepEqual(Object.keys(styles).sort(),roster.sort());
 for(const id of roster){assert(PLANES[id]);assert(styles[id].condition&&styles[id].weakness);}
});
for(const id of roster)test(`${id}: conditional rule changes an actual flight or shot without changing base stats`,()=>{
 const g=make(id),c=make(id),s=styles[id];c.aircraftCombatRole=()=>null;
 const original={turn:g.turn,speed:g.speed,damage:g.damage,rate:g.rate,hp:g.hp};
 if(['slow','close','reverse'].includes(s.mode)){
  if(s.mode==='close')g.enemies=c.enemies=[enemy(100,0)];
  if(s.mode==='reverse'){fly(g,.7,1);fly(c,.7,1);const ga=g.a,ca=c.a;fly(g,.2,-1);fly(c,.2,-1);assert(Math.abs(angleDiff(g.a,ga))>Math.abs(angleDiff(c.a,ca)),id);}
  else{g.aircraftTurnTime=c.aircraftTurnTime=.5;g.aircraftTurnSign=c.aircraftTurnSign=1;fly(g,.1,1);fly(c,.1,1);assert(g.a>c.a,id);}
 }else if(['sustain','late','energy'].includes(s.mode)){
  if(s.mode==='energy')g.airframeSpeed=c.airframeSpeed=1;
  fly(g,2,s.mode==='energy'?.3:1);fly(c,2,s.mode==='energy'?.3:1);
  assert(g.airframeSpeed>c.airframeSpeed,id);
 }else if(['exit','defensive','pass'].includes(s.mode)){
  if(s.mode==='defensive')g.enemies=c.enemies=[enemy(-100,0)];
  fly(g,1.5,0);fly(c,1.5,0);assert(g.airframeSpeed>c.airframeSpeed,id);
 }else{
  g.level=3;g.enemies=[enemy(160,12)];g.aircraftStraightTime=0;
  const shot=()=>({gun:0,vx:520,vy:0,damage:12});
  const loose=g.applySpecialRound(shot());g.aircraftStraightTime=2;
  if(s.mode==='twoSeat'&&s.group===1){g.enemies=[enemy(-160,-12)];const rear=()=>({gun:1,vx:-520,vy:0,damage:12});g.aircraftStraightTime=0;const a=g.applySpecialRound(rear());g.aircraftStraightTime=2;const b=g.applySpecialRound(rear());assert.notEqual(b.vy,a.vy);}
  else{const aimed=g.applySpecialRound(shot());assert.notEqual(aimed.vy,loose.vy,id);assert.equal(aimed.damage,12);}
 }
 for(const [k,v]of Object.entries(original))assert.equal(g[k],v,`${id} ${k}`);
 assert(Number.isFinite(g.a)&&g.airframeSpeed<=1);
});
test('styles yield priority to active skills and cannot add an enemy-only role',()=>{
 for(const id of roster){const g=make(id);g.skillTime=2;g.aircraftTurnTime=2;g.aircraftTurnSign=1;g.flyAirframe(.02,{steer:1});assert.equal(g.aircraftStyleActive,false);}
 assert(!styles.staaken);assert(!styles.jasta11_fokkerd7);
});
function scene(pattern){const g=make('camel');g.t=400;g.viewWidth=1280;g.beginBattleDirectorPattern(pattern);g.t+=.36;g.tickBattleDirector(.02);g.t+=.06;g.tickBattleDirector(.02);return g;}
function move(g,seconds){for(let i=0;i<seconds/.02;i++){for(const e of g.enemies){const s=g.dogfightSteering(e,g,.02,1.7);e.a+=Math.max(-s.turn*.02,Math.min(s.turn*.02,s.delta));e.x+=Math.cos(e.a)*e.speed*.02;e.y+=Math.sin(e.a)*e.speed*.02;}g.t+=.02;g.tickBattleDirector(.02);}}
test('CROSS and PINCER visibly separate before fire; then cross vs rear convergence',()=>{
 const cross=scene('CROSS_ATTACK'),pincer=scene('PINCER');
 for(const g of [cross,pincer]){assert(g.enemies.length>=3);const e=g.enemies[0],y=Math.abs(e.y);g.fireEnemy(e);assert.equal(g.bullets.length,0);move(g,.6);assert(Math.abs(e.y)>y+15);assert(e.directorReadyAt>g.t);}
 move(cross,2);move(pincer,2);
 const c=cross.enemies[0],p=pincer.enemies[0];assert.equal(p.directorSquad.tactic,'pincer');assert.equal(c.directorSquad.tactic,'cross');assert(c.combatPassWaypoint.y>0);assert(p.combatPassWaypoint.y<0);
});
test('DECOY leader flies away while flankers approach from the rear',()=>{
 const g=scene('DECOY'),bait=g.enemies.find(e=>e.directorLayout==='decoy'),wing=g.enemies.find(e=>e.directorLayout==='decoyWing');
 const bx=bait.x;move(g,.6);assert(bait.x>bx+20);assert.equal(bait.directorSquad.tactic,'decoy');move(g,.5);assert(wing.combatPassWaypoint.x<g.x);
});
function region(id){const g=make('camel');g.lockedRegion=id;g.stageBoss={stages:{phase:'explore',stageIndex:id}};g.t=0;tickRegionalConditions(g,.02);g.t=5.1;tickRegionalConditions(g,.02);return g;}
test('all 14 regions retain named mechanics; trench and Alpine events create actual hazards',()=>{
 assert.equal(Object.keys(REGION_COMBAT_EVENTS).length,14);
 const t=region(2);assert(t.barrage);assert(t.barrage.x>t.x);
 const a=region(6),wind=a.gusts.find(x=>x.thermal);assert(wind);a.x=wind.x;a.y=wind.y;a.airframeSpeed=.6;tickRegionalConditions(a,.04);assert(a.airframeSpeed>.6);
 a.t=18;tickRegionalConditions(a,.02);assert(a.gusts.some(x=>!x.thermal));
});
test('Somme balloon death reduces real artillery zones, not despawn or expiration',()=>{
 const g=region(10);assert(g.regionalCondition.spotter);assert.equal(g.bombZones.length,3);
 g.regionalCondition.spotter.hp=0;g.bombZones=[];g.t=10.2;tickRegionalConditions(g,.02);assert.equal(g.bombZones.length,1);assert(g.regionalCondition.weakenedUntil>g.t);
 g.lockedRegion=8;g.t=12;tickRegionalConditions(g,.02);assert.equal(g.regionalCondition.weakenedUntil,0);
});
test('harbor coordinates live ship fire; coop trench uses visible existing shell warnings',()=>{
 const g=region(7);g.enemies=[{hp:10,movingShip:true,faction:'central',fire:0},{hp:10,movingShip:true,faction:'central',fire:5}];g.teamFaction='entente';g.t=20;tickRegionalConditions(g,.02);assert(g.enemies.every(e=>e.fire===1.2));
 const c=new CoopGame([{pilot:'fonck',plane:'camel'},{pilot:'mannock',plane:'se5a'}]);c.lockedRegion=2;c.stageBoss={stages:{phase:'explore',stageIndex:2}};c.t=0;tickRegionalConditions(c,.02);c.t=6;tickRegionalConditions(c,.02);assert.equal(c.bombZones.length,3);assert(c.bombZones.every(z=>z.delay>1));
});

test('HEAD-ON gives the existing Break phase priority over entry guidance',()=>{
 const g=scene('HEAD_ON_PASS'),e=g.enemies[0];g.t=e.directorReadyAt+.1;e.directorSquad.leader.combatPassState='DISENGAGE';e.combatPassHeading=e.a+1;
 const steering=g.dogfightSteering(e,g,.02,1.7);assert(Math.abs(steering.delta-1)<1e-8);assert(steering.turn<1.7);
});
