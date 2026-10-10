import test from 'node:test';
import assert from 'node:assert/strict';
import {drawExplosionProfile,drawFuelFire,EXPLOSION_LIFE} from '../explosion-profiles.js';

function at(profile,age){
 const calls=[];drawExplosionProfile({}, {fxProfile:profile,radius:64,maxLife:EXPLOSION_LIFE[profile],life:EXPLOSION_LIFE[profile]-age},0,0,(c,key,x,y,w,h,a,alpha)=>calls.push({key,alpha}));return calls;
}
test('secondary fire layers enter continuously instead of appearing at full opacity',()=>{
 const calls=[];drawFuelFire({},(c,key,x,y,w,h,a,alpha)=>calls.push({key,alpha}),0,0,.5001);
 assert(calls.find(f=>f.key==='profileWing').alpha<.001);
 for(const key of ['profileGround','profileEngine'])assert(at('ammoCookoff',.5201).find(f=>f.key===key).alpha<.001);
 assert(at('ammoCookoff',.75).find(f=>f.key==='profileGround').alpha>.7);
 assert(at('aircraft',.0601).find(f=>f.key==='profileTrail').alpha<.001);
});
test('impact flashes remain immediate and smoke settles to its full existing opacity',()=>{
 assert.equal(at('heavyShell',0).find(f=>f.key==='profileFlash').alpha,.95);
 assert.equal(at('heavyShell',0).find(f=>f.key==='profileDust').alpha,0);
 assert.equal(at('heavyShell',.1).find(f=>f.key==='profileDust').alpha,.3);
 for(const kind of Object.keys(EXPLOSION_LIFE))for(let i=0;i<=100;i++)for(const f of at(kind,EXPLOSION_LIFE[kind]*i/100))assert(Number.isFinite(f.alpha)&&f.alpha>=0&&f.alpha<=1);
});
