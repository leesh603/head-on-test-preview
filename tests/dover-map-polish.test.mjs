import test from 'node:test';
import assert from 'node:assert/strict';
import {periodicCoastPixels} from '../dover-coast-tiles.js';
import {doverPatrolChart,doverPatrolSpawn,doverShipAtSea,doverFlightBounds,doverWaterInterval,DOVER_MAP} from '../dover-patrol-chart.js';
import {drawDoverCue} from '../dover-night-view.js';
import {BOSS_CUTIN_ART} from '../boss-cutin-art.js';
import {readFileSync} from 'node:fs';

test('Coastal wrap preserves alpha and has identical RGBA borders without dark offshore fringes',()=>{
 const w=12,h=40,src=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)src.set(x<6?[180+y,190,160,255]:[255,0,255,0],(y*w+x)*4);
 const tile=periodicCoastPixels(src,w,h,4);
 assert.equal(tile.width,w);assert.equal(tile.height,32);
 assert.deepEqual(tile.data.subarray(0,w*4),tile.data.subarray((tile.height-1)*w*4));
 for(let y=0;y<tile.height;y++){
  assert.equal(tile.data[(y*w+3)*4+3],255);
  assert.equal(tile.data[(y*w+9)*4+3],0);
  assert.equal(tile.data[(y*w+3)*4+1],190,'hidden offshore RGB cannot contaminate opaque chalk');
 }
});

test('A wide finite chart remains registered and patrol hulls fit the real irregular sea',()=>{
 for(const width of [390,1280]){
  const g={x:120,y:300,viewWidth:width,viewHeight:844},chart=doverPatrolChart(g),bounds=doverFlightBounds(g);
  assert.equal(chart.width,DOVER_MAP.width);assert(bounds.right-bounds.left>width*3);assert(bounds.bottom-bounds.top>844*8);
  g.x+=900;g.y-=2500;assert.equal(doverPatrolChart(g),chart);
  for(let row=0;row<100;row++)for(const x of [-10000,120,10000]){
   const y=chart.top+chart.height*row/99,q=doverPatrolSpawn(g,x,y,220);
   assert(doverShipAtSea(g,{...q,hullLength:171,hullWidth:46}));
  }
  for(const x of [bounds.left,bounds.right])for(const y of [bounds.top,bounds.bottom]){
   assert(x-width/2>=chart.left&&x+width/2<=chart.right);assert(y-844/2>=chart.top&&y+844/2<=chart.bottom);
  }
  const a=doverWaterInterval(g,chart.top+chart.height*.15),b=doverWaterInterval(g,chart.top+chart.height*.75);
  assert(Math.abs(a.left-b.left)>300,'real headlands alter the corridor instead of straight repeating strips');
 }
});

test('Committed bombing cue has finite warnings and separate safe lane edges',()=>{
 const coordinates=[],c=new Proxy({globalAlpha:1,moveTo(x,y){coordinates.push(x,y)},lineTo(x,y){coordinates.push(x,y)}},{get:(o,k)=>k in o?o[k]:()=>{}});
 assert(drawDoverCue(c,{type:'dover-bomb-warning',x:20,y:-50,angle:1.1,length:430,safeGap:76,exitAngle:2.2,life:.7,seconds:1.35}));
 assert(coordinates.length>20);assert(coordinates.every(Number.isFinite));
 assert.equal(drawDoverCue(c,{type:'charge-warning'}),false);
});

test('Both Dover bosses use their dedicated authored cut-in assets',()=>{
 for(const [id,file] of [['supermarine-nighthawk','cutin-dover-nighthawk.webp'],['siemens-schuckert-r-viii','cutin-dover-rviii.webp']]){
  assert.equal(BOSS_CUTIN_ART[id],'./'+file+'?v=dover2');
  const bytes=readFileSync(new URL('../'+file,import.meta.url));assert(bytes.length>100000);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert(bytes[20]&16);
 }
});
