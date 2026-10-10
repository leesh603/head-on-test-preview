import test from 'node:test';
import assert from 'node:assert/strict';
import {MINEN_ART,MINEN_TUBES,minenRecoilOffset,minenMuzzleLocal} from '../minenwerfer-art-layout.js';
import {drawMinenInstallation} from '../minenwerfer-art-render.js';
import {MinenwerferBattery} from '../headon-stageboss-patterns.js';
const make=()=>new MinenwerferBattery({id:'minen',x:0,y:0,tuning:{maxHp:1000,partHp:100,damage:12,bulletSpeed:160,mortarInterval:1.9},rng:()=>.5});
const images={base:{naturalWidth:1448,naturalHeight:1086},barrels:{naturalWidth:1536,naturalHeight:512},damage:{naturalWidth:1448,naturalHeight:1086}};
function draw(p){const calls=[],c=new Proxy({},{get:(_,name)=>name==='drawImage'?(...args)=>calls.push(args):()=>{}});drawMinenInstallation(c,p,images);return calls;}
test('barrel recoil kicks smoothly and returns to exactly the same resting pose',()=>{
 const p={mortarRecoils:[0,0,0]};
 for(let tube=0;tube<3;tube++){
  const offset=age=>{p.mortarRecoils[tube]=MINEN_ART.recoilDuration-age;return minenRecoilOffset(p,tube)};
  assert.equal(offset(0),0);assert(offset(.01)>0);assert(offset(.03)>offset(.01));
  assert.equal(offset(MINEN_ART.recoilKick),MINEN_TUBES[tube].recoilTravel);
  assert(offset(.1)<offset(.06));assert(offset(.2)<offset(.1));assert(offset(.3)<offset(.2));assert.equal(offset(MINEN_ART.recoilDuration),0);
 }
});
test('fixed emplacement and the two idle barrel sprites have identical draw calls throughout a shot',()=>{
 const p={x:17,y:-25,hp:400,maxHp:400,mortarRecoils:[0,0,0]},idle=draw(p);
 assert.equal(idle.length,10);assert.equal(idle[0][0],images.base);
 for(let tube=0;tube<3;tube++)for(const age of [.01,.055,.1,.2,.3,.36]){
  p.mortarRecoils=[0,0,0];p.mortarRecoils[tube]=MINEN_ART.recoilDuration-age;const active=draw(p);
  assert.deepEqual(active[0],idle[0]);
  for(let i=0;i<3;i++)if(i!==tube)assert.deepEqual(active[i*2+1],idle[i*2+1]);
  for(const i of [2,4,6,7,8,9])assert.deepEqual(active[i],idle[i]);
  const moving=active[tube*2+1];assert.equal(moving[0],images.barrels);assert.equal(moving[5],idle[tube*2+1][5]);
  assert(Math.abs(moving[6]-idle[tube*2+1][6]-minenRecoilOffset(p,tube))<1e-10);
  assert(Math.abs(minenMuzzleLocal(p,tube).y-MINEN_TUBES[tube].muzzleY-minenRecoilOffset(p,tube))<1e-10);
 }
});
test('a subsequent tube shot preserves the previous tube recovery, and pause freezes both',()=>{
 const b=make(),p=b.parts.get('main-gun');b.recovery=10;b.blast(p,0);b.update(.08,{});
 const left=p.mortarRecoils[0];b.blast(p,2);assert.equal(p.mortarRecoils[0],left);assert.equal(p.mortarRecoils[2],MINEN_ART.recoilDuration);
 assert(minenRecoilOffset(p,0)>0);assert.equal(minenRecoilOffset(p,1),0);
 const before=p.mortarRecoils.slice();b.update(.2,{paused:true});assert.deepEqual(p.mortarRecoils,before);
 b.update(.2,{});b.update(.2,{});assert.deepEqual(p.mortarRecoils,[0,0,0]);
});
test('wrecks never render or animate separated live tubes',()=>{
 const p={x:0,y:0,hp:0,maxHp:400,destroyed:true,mortarRecoils:[.3,.3,.3]},calls=draw(p);
 assert.equal(calls.length,1);assert.equal(calls[0][0],images.damage);
});
