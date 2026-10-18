import test from 'node:test';
import assert from 'node:assert/strict';
import {MAAN_LAYOUT} from '../maan-layout.js';
import {MAAN_ART_COLUMNS,MAAN_DAMAGE_PANELS,MAAN_TRACK_WINDOWS,maanArtState,maanArtSignature,maanWorkshopSpread} from '../maan-art.js';

test('Ma’an distinguishes damaged mounts from destroyed mounts at the HP boundary',()=>{
 assert.equal(MAAN_ART_COLUMNS,3);
 assert.equal(maanArtState({hp:51,maxHp:100}),0);
 assert.equal(maanArtState({hp:50,maxHp:100}),1);
 assert.equal(maanArtState({hp:0,maxHp:100,destroyed:true}),2);
 const parts=new Map([['left',{hp:50,maxHp:100}],['right',{hp:100,maxHp:100}]]);
 assert.equal(maanArtSignature(parts),'10');parts.get('left').destroyed=true;
 assert.equal(maanArtSignature(parts),'20');
});
test('Collapsed workshop roof leaves hull clearance before forward emergence at 3.6s',()=>{
 const width=MAAN_LAYOUT.wustenpanzer.width;
 assert.equal(maanWorkshopSpread(0,width),0);
 assert(maanWorkshopSpread(3.6-2.8,width)*2>=width+24);
 assert.equal(maanWorkshopSpread(60,width),maanWorkshopSpread(1,width));
});
test('Every Ma’an combat component owns a bounded painted damage panel',()=>{
 for(const [kind,l] of Object.entries(MAAN_LAYOUT)){
  const panels=MAAN_DAMAGE_PANELS[kind];
  assert.deepEqual(Object.keys(panels).sort(),l.parts.map(p=>p[0]).sort());
  for(const [x,y,w,h] of Object.values(panels)){
   assert(w>8&&h>8);assert(x>=-l.width/2&&x+w<=l.width/2);
   assert(y>=-l.height/2&&y+h<=l.height/2);
   assert(w*h<l.width*l.height*.17,'a destroyed part cannot own most of the hull');
  }
  for(const [id,x,y,w,h] of MAAN_TRACK_WINDOWS[kind]){
   const [px,py,pw,ph]=panels[id];
   assert(x-w/2>=px&&x+w/2<=px+pw&&y-h/2>=py&&y+h/2<=py+ph);
  }
 }
});
