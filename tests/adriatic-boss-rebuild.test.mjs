import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossEncounter} from '../headon-stageboss-patterns.js?v=hangar2';
import {navalPoint,navalOverlap,zubianSize,zubianSplitPose} from '../adriatic-boss-layout.js?v=hangar2';


const tuning={maxHp:2400,partHp:280,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,splitProtection:0,broadsideInterval:1.8,mortarInterval:2.05,chargeInterval:3.05,suppressiveInterval:3.1};
const frame={players:[{id:'p1',alive:true,x:100,y:550,vx:30,vy:0,radius:12},{id:'p2',alive:true,x:600,y:600,vx:0,vy:-20,radius:12}],bounds:{left:-700,right:900,top:-600,bottom:950}};
function setup(bossId){const events=[],enc=createBossEncounter({id:'adriatic-'+bossId,bossId,tuning:{...tuning},x:200,y:50,rng:()=>.5,emit:e=>events.push(e)});return{enc,body:[...enc.bodies.values()][0],events};}
function split(f){f.body.hit({damage:99999});for(let i=0;i<136;i++)f.enc.update(.02,frame);return [...f.enc.bodies.values()];}

test('Zubian replacement starts at the rendered cut poses and conserves HP',()=>{
 const f=setup('hms-zubian');f.body.hullYaw=.32;const halves=split(f);assert.equal(halves.length,2);
 for(const h of halves){const q=zubianSplitPose(f.body,h.role);assert.ok(Math.hypot(q.x-h.x,q.y-h.y)<3,'replacement must not jump back to the old +/-92 centers');assert.ok(zubianSize(h).height>380);}
 assert.equal(halves.reduce((n,b)=>n+b.hp,0),1200);assert.equal(f.enc.completed,false);
});
test('moving, turning and charging Zubian halves never overlap their painted extents',()=>{
 const f=setup('hms-zubian');split(f);
 for(let i=0;i<3500;i++){frame.players[0].x=200+Math.sin(i*.017)*330;frame.players[0].y=250+Math.cos(i*.013)*320;f.enc.update(.02,frame);const [a,b]=f.enc.bodies.values();assert.equal(navalOverlap(a,b,0),null,'overlap at step '+i);}
 assert.ok(f.events.some(e=>e.type==='charge-warning'));assert.ok(f.events.some(e=>e.tag==='zubian-crossfire'));
});
test('destroyed guns survive the split, stop their attacks, and both halves remain hittable',()=>{
 const f=setup('hms-zubian');for(const id of ['frontGun','rearGun'])f.body.hit({partId:id,damage:9999});const halves=split(f);f.events.length=0;
 for(let i=0;i<700;i++)f.enc.update(.02,frame);
 assert.ok(halves.every(h=>h.gun().destroyed));assert.equal(f.events.some(e=>e.visual==='zubian-shell'||e.visual==='zubian-mortar'),false);
 for(const h of halves){const size=zubianSize(h),q=navalPoint(h,size.width*.24,-size.height*.28);assert.ok(h.locateHit({...q,radius:1}),'hull beyond the old core disc is hittable');assert.equal(h.locateHit(navalPoint(h,size.width*2,0)),null);}
});
test('a torpedo follows its locked warning course and does not accelerate the hull to bullet speed',()=>{
 const f=setup('hms-zubian'),halves=split(f),bow=halves.find(h=>h.role==='front');bow.timers.set('charge',0);
 f.enc.update(.02,frame);const warning=f.events.findLast(e=>e.type==='charge-warning');for(let i=0;i<60;i++)f.enc.update(.02,frame);
 const torpedo=f.events.findLast(e=>e.visual==='torpedo-charge');assert.ok(torpedo);assert.equal(torpedo.x,warning.x);assert.equal(torpedo.y,warning.y);
 const cross=torpedo.vx*(warning.targetY-warning.y)-torpedo.vy*(warning.targetX-warning.x);assert.ok(Math.abs(cross)<1e-7);assert.ok(bow.driveVelocity<90);
});
test('Stuttgart navigation, rotated parts and swept collision share the live transform',()=>{
 const f=setup('sms-stuttgart');for(let i=0;i<500;i++)f.enc.update(.02,frame);const b=f.body,s=b.support129;
 assert.ok(Math.hypot(b.x-200,b.y-50)>100);assert.equal(b.x,s.x);assert.equal(b.y,s.y);
 for(const id of ['gun0','gun3','boiler']){const p=s.parts.get(id),q=s.world(p.nx,p.ny);assert.equal(s.locateHit({...q}),id);assert.ok(Math.hypot(b.x+b.parts.get(id).x-q.x,b.y+b.parts.get(id).y-q.y)<1e-9);}
 const before=s.driveVelocity;b.hit({partId:'boiler',damage:99999});f.enc.update(.02,frame);assert.ok(s.driveVelocity<before*.4);
 const pose=[b.x,b.y,s.angle];s.tick(.5,{...frame,paused:true});assert.deepEqual([b.x,b.y,s.angle],pose);
});
test('destroying all Stuttgart guns removes both shell volleys and targeted flak',()=>{
 const {body:b}=setup('sms-stuttgart'),s=b.support129;for(let i=0;i<4;i++)b.hit({partId:'gun'+i,damage:99999});s.projectiles.clear();for(let i=0;i<5;i++)s.fire(frame.players);assert.equal(s.projectiles.count,0);
});

// Repeat the launch check while hull turns force the stern to yield clearance.
test('every torpedo emerges from the bow muzzle throughout a long moving encounter',()=>{
 let enc,launches=0;
 const dynamicFrame={players:[{id:'p1',alive:true,x:100,y:550,vx:30,vy:0}],bounds:{...frame.bounds}};
 enc=createBossEncounter({id:'launch-alignment',bossId:'hms-zubian',tuning:{...tuning},x:200,y:50,rng:()=>.5,emit:e=>{
  if(e.visual==='torpedo-charge'){const b=enc.bodies.get(e.bossId),q=navalPoint(b,0,-zubianSize(b).height*.42);assert.ok(Math.hypot(e.x-q.x,e.y-q.y)<1e-7,'launch moved off the actual bow muzzle');launches++;}
 }});
 [...enc.bodies.values()][0].hit({damage:99999});
 for(let i=0;i<5000;i++){dynamicFrame.players[0].x=200+Math.sin(i*.017)*330;dynamicFrame.players[0].y=250+Math.cos(i*.013)*320;enc.update(.02,dynamicFrame);}
 assert.ok(launches>=15);
});
