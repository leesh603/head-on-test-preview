import test from 'node:test';
import assert from 'node:assert/strict';
import {doverPatrolChart,doverPatrolSpawn,doverShipAtSea,doverFlightBounds} from '../dover-patrol-chart.js?v=dover3';
import {steerDoverBoundary,containDoverPlayer} from '../dover-map-boundary.js';
import {updateNavalFleet} from '../fleet-naval1.js';

test('Dover boundaries turn normal flight without world wrapping and leave other maps alone',()=>{
 for(const width of [390,1280])for(const speed of [180,430,828]){
  const g={x:0,y:0,a:-Math.PI/2,region:17,viewWidth:width,viewHeight:844};
  const b=doverFlightBounds(g);g.x=(b.left+b.right)/2;g.y=b.top+700;
  let turned=false;
  for(let i=0;i<2000;i++){
   const x=g.x,y=g.y;steerDoverBoundary(g,g,.02,speed);g.x+=Math.cos(g.a)*speed*.02;g.y+=Math.sin(g.a)*speed*.02;containDoverPlayer(g,g);
   assert(g.x>=b.left&&g.x<=b.right&&g.y>=b.top&&g.y<=b.bottom);assert(Math.hypot(g.x-x,g.y-y)<=speed*.02+1e-8);
   turned||=Math.sin(g.a)>.3;
  }
  assert(turned,'the plane physically turns inward');
 }
 const other={region:1,x:-999999,y:999999,a:1};steerDoverBoundary(other,other,.04,800);containDoverPlayer(other,other);assert.deepEqual(other,{region:1,x:-999999,y:999999,a:1});
});

test('Both fleets keep complete hulls at sea while approaching cliffs and map ends',()=>{
 const g={state:'playing',region:17,x:0,y:0,t:0,enemies:[],friendlyShips:[],fleetAmbient:Infinity,reconTimer:Infinity,worldRegion:()=>17,rng:()=>.5};
 const c=doverPatrolChart(g);
 for(const [v,x,a] of [[.2,c.left,Math.PI],[.45,c.right,0],[0,c.left+c.width*.5,-Math.PI/2],[1,c.left+c.width*.5,Math.PI/2]]){
  const q=doverPatrolSpawn(g,x,c.top+c.height*v,220);
  const e={...q,a,course:a,movingShip:true,navalVessel:true,shipClass:'aa',hp:340,maxHp:340,hullLength:171,hullWidth:46,sailingSpeed:17,driveVelocity:17,weave:0,fire:Infinity,life:Infinity};
  g.enemies=[e];g.x=e.x;g.y=e.y;
  for(let i=0;i<5000;i++){g.t+=.04;updateNavalFleet(g,.04);assert(Number.isFinite(e.x+e.y+e.a));assert(doverShipAtSea(g,e),'ship and wake cannot cross land or finite edges');assert(!e.expired);}
 }
});
