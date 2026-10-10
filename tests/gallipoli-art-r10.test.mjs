import test from 'node:test';
import assert from 'node:assert/strict';
import {drawGallipoliWeapon,GALLIPOLI_WEAPON_FRAMES,gallipoliSectorArtState} from '../gallipoli-art-r10.js';
import {gallipoliMuzzle,GALLIPOLI_PARTS,GALLIPOLI_SECTORS} from '../gallipoli-boss.js';
function context(){
 let t={x:0,y:0,a:0};const stack=[],calls=[];
 return {calls,save(){stack.push({...t})},restore(){t=stack.pop()},translate(x,y){t.x+=Math.cos(t.a)*x-Math.sin(t.a)*y;t.y+=Math.sin(t.a)*x+Math.cos(t.a)*y},rotate(a){t.a+=a},drawImage(im,sx,sy,sw,sh,x,y,w,h){calls.push({t:{...t},sx,sy,x,y,w,h,sw,sh})}};
}
function point(call,x,y){const lx=call.x+x*call.w/call.sw,ly=call.y+y*call.h/call.sh;return{x:call.t.x+Math.cos(call.t.a)*lx-Math.sin(call.t.a)*ly,y:call.t.y+Math.sin(call.t.a)*lx+Math.cos(call.t.a)*ly};}
for(const art of ['twin','howitzer','aa'])test(art+' muzzle registration and barrel-only recoil',()=>{
 const f=GALLIPOLI_WEAPON_FRAMES[art],spec=GALLIPOLI_PARTS.find(p=>p.art===art);
 for(const angle of [0,.8,Math.PI,4.7])for(const state of [0,1]){
  let mount;
  for(const recoil of [0,.12,.24]){
   const p={...spec,x:81,y:93,angle,recoil},c=context();drawGallipoliWeapon(c,{naturalWidth:1024},p,state);
   assert.equal(c.calls.length,2);const fixed=c.calls[0];
   if(mount)assert.deepEqual(fixed.t,mount);else mount=fixed.t;
   for(const barrel of art==='twin'?[-1,1]:[0]){
    const actual=point(c.calls[1],f.barrel[2]+barrel*(f.halfSpacing||0),f.tip);
    const expected=gallipoliMuzzle({x:0,y:0},p,barrel);
    assert(Math.hypot(actual.x-expected.x,actual.y-expected.y)<1e-8);
   }
  }
 }
});
test('sector destruction and repair select registered wall damage',()=>{
 const parts=new Map(GALLIPOLI_PARTS.map(p=>[p.id,{...p,hp:100,maxHp:100,destroyed:false}]));const b={parts},s=GALLIPOLI_SECTORS[0];
 assert.equal(gallipoliSectorArtState(b,s),0);parts.get(s.guards[0]).hp=20;assert.equal(gallipoliSectorArtState(b,s),1);
 for(const id of s.guards)parts.get(id).destroyed=true;assert.equal(gallipoliSectorArtState(b,s),2);
 for(const id of s.guards)Object.assign(parts.get(id),{destroyed:false,hp:100});assert.equal(gallipoliSectorArtState(b,s),0);
});
