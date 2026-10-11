import test from 'node:test';
import assert from 'node:assert/strict';
import {DOVER_MAP,doverPatrolChart,doverFlightBounds} from '../dover-patrol-chart.js?v=dover3';
import {DOVER_COAST_PROFILE} from '../dover-terrain-profile.js?v=dover3';
import * as view from '../dover-terrain-render.js?v=dover5';

test('Normal Dover entry has a visible English cliff on mobile without narrowing the flight area',()=>{
 for(const w of [390,1280]){
  const g={x:420,y:-930,viewWidth:w,viewHeight:844},c=doverPatrolChart(g),p=view.doverCoastPoint(c,.43,-1),b=doverFlightBounds(g);
  assert(Math.abs(g.x-p.x-150)<1e-7,'spawn beside the coast, rather than in a long empty sea');
  assert(p.x>g.x-w/2&&p.x<g.x,'coast is visible in a normal start viewport');
  assert(b.right-b.left>w*3);assert(b.bottom-b.top>844*8);
  assert.equal(c.width,6144);assert.equal(c.height,9216);
 }
});

test('Every coast quad has consistent triangle orientation without folded chalk ribbons',()=>{
 const c=doverPatrolChart({x:0,y:0}),coast={naturalWidth:887,naturalHeight:1774};let checked=0;
 for(const side of [-1,1])for(let row=1;row<383;row++){
  const p=view.doverCoastPoint(c,row/383,side),transforms=[];
  const ctx=new Proxy({globalAlpha:1,transform(...a){transforms.push(a)}},{get:(o,k)=>k in o?o[k]:()=>{}});
  view.paintDoverTerrain(ctx,c,p.x,p.y,1024,80,coast,{draw(){}});
  assert.equal(transforms.length%2,0);
  for(let i=0;i<transforms.length;i+=2){
   const jacobian=([a,b,c,d])=>a*d-b*c;
   assert(jacobian(transforms[i])*jacobian(transforms[i+1])>1e-6,`folded ${side<0?'English':'French'} coast around row ${row}`);checked++;
  }
 }
 assert(checked>3000);
});

test('Material repeat joins the exact same source edge and alpha pixels on both sides',()=>{
 assert.equal(typeof view.doverMaterialY,'function');const h=1774;
 for(let period=1;period<=24;period++){
  const distance=period*h,edge=period%2?h:0;
  assert.equal(view.doverMaterialY(distance,h),edge);
  assert(Math.abs(view.doverMaterialY(distance-.001,h)-view.doverMaterialY(distance+.001,h))<1e-7,'no mismatched top/bottom image rows');
 }
 assert.equal(view.doverMaterialY(100,h),view.doverMaterialY(2*h-100,h));
});

test('The navigable channel stays between 2.4 and 3.1 km while keeping broad unique headlands',()=>{
 const widths=DOVER_COAST_PROFILE.map(p=>(p[1]-p[0])*DOVER_MAP.width);
 assert(Math.min(...widths)>2400);assert(Math.max(...widths)<3100);
 assert(Math.abs(DOVER_COAST_PROFILE[57][0]-DOVER_COAST_PROFILE[287][0])*DOVER_MAP.width>600);
});
