import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter,ParisGun} from '../headon-stageboss-patterns.js';
import {renderStageBossLayer} from '../headon-stageboss-render.js';
import {bossPhaseLabel} from '../boss-feedback.js';
const tuning={maxHp:2400,partHp:280,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,splitProtection:0,broadsideInterval:1.8,mortarInterval:2.05,chargeInterval:3.05,suppressiveInterval:3.1};
const frame={players:[{id:'p1',alive:true,x:100,y:200,vx:30,vy:0,radius:12}],bounds:{left:-200,right:600,top:-450,bottom:450}};
function setup(id,extra={}){const events=[],enc=createBossEncounter({id:'raid-'+id,bossId:id,tuning:{...tuning,...extra},x:200,y:-100,rng:()=>.5,emit:e=>events.push(e)});return{enc,b:[...enc.bodies.values()][0],events};}
function run(f,seconds,ctx=frame){for(let i=0;i<Math.ceil(seconds/.02);i++)f.enc.update(.02,ctx);}

test('Stuttgart rearms between final sorties: guns hold and the counter window opens',()=>{
 const f=setup('sms-stuttgart');run(f,.1);for(let i=0;i<3;i++)f.b.hit({damage:99999});
 assert.equal(f.b.support129.phase,4);run(f,14);
 assert(f.events.some(e=>e.type==='phase-change'&&e.phase==='carrier-rearm'));
 let opened=false;for(let i=0;i<600&&!opened;i++){run(f,.02);opened=f.b.support129.rearming;}
 assert(opened);assert.equal(f.b.counterWindow(),1.5);
});

test('Zubian bow is a weapon while the front half charges, and the ram is never drawn',()=>{
 const f=setup('hms-zubian');f.b.hit({damage:99999});run(f,20);
 const rams=f.events.filter(e=>e.type==='hazard'&&e.visual==='hull-ram');
 assert(rams.length>0);assert(rams.every(e=>e.kind==='circle'&&e.warning===0&&e.once&&e.damage>0));
 const drawn=[];renderStageBossLayer({stages:{encounter:{bodies:new Map()}},hazards:{pool:{visit(fn){fn({phase:'active',visual:'hull-ram'});fn({phase:'active',visual:'zubian-mortar'});}}}},{drawBody(){},drawPart(){},drawHazard:h=>drawn.push(h.visual)});
 assert.deepEqual(drawn,['zubian-mortar']);
});

test('Bruno grows its march and shortens stops once half its hull is gone',()=>{
 const events=[],b=new ParisGun({id:'b',x:0,y:-460,faction:'central',tuning:{maxHp:2400,partHp:288,damage:18,bulletSpeed:270,warningSeconds:1.55,railCycle:7.45,shellCount:5},emit:e=>events.push(e)});
 const ctx={players:[{id:'p1',alive:true,x:-80,y:130,vx:30,vy:0,radius:12}],bounds:{left:-480,right:480,top:-400,bottom:400}};
 for(const id of b.railCarOrder)b.hit({partId:id,damage:999999});b.update(.02,ctx);
 assert(b.brunoBarrage);assert.equal(b.rail129.c.moveSeconds,2.3);
 b.rail129.velocity=0;b.rail129.target=null;b.rail129.enter('aim');for(let i=0;i<200;i++)b.update(.02,ctx);
 assert.equal(events.filter(e=>e.visual==='rail-shell').length,7);
});

test('every new phase announcement has Korean and English text',()=>{
 for(const phase of ['carrier-rearm','bruno-barrage','lincomparable-hasty-reload','minenwerfer-reload','l70-last-raid','harbor-last-stand','formation-recovery','red-total-assault','black-cross-encirclement','schwaben-last-barrage','staaken-last-raid','jutland-last-salvo']){
  const ko=bossPhaseLabel(phase,'ko'),en=bossPhaseLabel(phase,'en');
  assert.notEqual(ko,'보스 전술 변화',phase);assert.notEqual(en,'Boss tactics changed',phase);
 }
});
