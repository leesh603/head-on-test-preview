import test from 'node:test';
import assert from 'node:assert/strict';
// Lazily loaded atlas images also resolve after individual tests end; keep the
// stub at file scope like the other browser-asset suites.
globalThis.Image=class{naturalWidth=1774;naturalHeight=887;set src(value){this.url=value;if(value)queueMicrotask(()=>this.onload?.())}};
import {FortDouaumont,FortSouville,verdunFortMuzzle} from '../verdun-fortresses.js?v=tame3&rail=40';
import {VERDUN_PART_FRAMES,VERDUN_GUN_FRAMES,VERDUN_GUN_ATLAS_SIZE} from '../verdun-art-layout.js?v=verdun-r9';

function context(){
 let matrix=[1,0,0,1,0,0];const stack=[],calls=[];
 const ctx=new Proxy({
  calls,save(){stack.push(matrix.slice())},restore(){matrix=stack.pop()},
  translate(x,y){matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y},
  rotate(angle){const [a,b,c,d]=matrix,C=Math.cos(angle),S=Math.sin(angle);matrix[0]=a*C+c*S;matrix[1]=b*C+d*S;matrix[2]=c*C-a*S;matrix[3]=d*C-b*S},
  drawImage(image,...args){calls.push({url:image.url,args,matrix:matrix.slice()})},
  clip(){throw new Error('Part destruction must not mask in a different whole-fort image')}
 },{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 return ctx;
}
function world(call,point){
 const [,,sw,sh,dx,dy,dw,dh]=call.args;
 const x=dx+point[0]*dw/sw,y=dy+point[1]*dh/sh,[a,b,c,d,e,f]=call.matrix;
 return{x:a*x+c*y+e,y:b*x+d*y+f};
}
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function matches(call,frame){return call.args.slice(0,4).every((x,i)=>x===frame.rect[i])}

test('foundation centers stay fixed while illustrated gun tips match native muzzle positions',async()=>{
 const {drawVerdunFort,releaseVerdunAssets}=await import('../verdun-art.js?v=tame3');
 try{
  for(const [Ctor,key,id,kind]of [[FortDouaumont,'douaumont','heavy-left','heavy'],[FortDouaumont,'douaumont','mg-left','mg'],[FortDouaumont,'douaumont','aa-left','aa'],[FortSouville,'souville','bunker-left','bunker'],[FortSouville,'souville','pit-left','pit']]){
   const b=new Ctor({id:'visual',x:513,y:-217,tuning:{maxHp:4000,damage:20,bulletSpeed:260,verdunScale:.8},emit(){}}),p=b.parts.get(id);
   for(const state of ['normal','damaged','destroyed'])for(const recoil of [0,.12,.24]){
    p.angle=.73;p.active=true;p.hittable=true;p.revealed=true;
    if(state==='damaged')p.hp=p.maxHp*.4;
    if(state==='destroyed')b.hit({partId:id,damage:1e9});
    // Registration checks settled frames; transition timing is covered separately.
    p.openAmount=1;p.damageBlend=1;p.recoil=state==='destroyed'?0:recoil;
    const c=context();drawVerdunFort(c,b);
    const groundState=state==='destroyed'?(key==='souville'?3:2):state==='damaged'?(key==='souville'?2:1):(key==='souville'?1:0);
    const ground=VERDUN_PART_FRAMES[key].mounts[kind].frames[groundState];
    const groundCall=c.calls.find(q=>q.url.includes('-parts-r9.webp')&&matches(q,ground));
    if(groundCall){
     near(groundCall.matrix[1],0);near(groundCall.matrix[2],0);
     const center=world(groundCall,ground.pivot);near(center.x,b.x+p.x);near(center.y,b.y+p.y);
    }else assert(key==='souville'&&kind==='bunker'&&state==='normal','only intact hull-authored foundations omit the overlay');
    const gunState=state==='destroyed'?2:state==='damaged'?1:0;
    const gun=VERDUN_GUN_FRAMES[kind][gunState];
    const gunCall=c.calls.find(q=>q.url.includes('boss-verdun-weapons-r9.webp')&&matches(q,gun));assert(gunCall);
    const pivot=world(gunCall,gun.pivot),shift=p.recoil*24*b.fortScale;
    near(pivot.x,b.x+p.x-Math.cos(p.angle)*shift);near(pivot.y,b.y+p.y-Math.sin(p.angle)*shift);
    near(Math.atan2(gunCall.matrix[1],gunCall.matrix[0]),p.angle+Math.PI/2);
    if(state!=='destroyed'){
     const tip=world(gunCall,[gun.pivot[0],gun.pivot[1]-gun.reach]),muzzle=verdunFortMuzzle(b,p);
     near(tip.x,muzzle.x);near(tip.y,muzzle.y);
    }
   }
  }
 }finally{releaseVerdunAssets();}
});

test('new weapon atlas contains five independent three-state weapons with safe rectangles',()=>{
 assert.deepEqual(Object.keys(VERDUN_GUN_FRAMES),['heavy','mg','aa','bunker','pit']);
 for(const frames of Object.values(VERDUN_GUN_FRAMES)){
  assert.equal(frames.length,3);
  for(const [state,frame] of frames.entries()){
   const [x,y,w,h]=frame.rect,[px,py]=frame.pivot;
   assert(x>=0&&y>=0&&x+w<=VERDUN_GUN_ATLAS_SIZE[0]&&y+h<=VERDUN_GUN_ATLAS_SIZE[1]);
   assert(px>0&&px<w&&py>0&&py<h&&frame.reach>0);
   if(state<2)assert(py-frame.reach>=0,'functional muzzle stays inside its frame');
  }
 }
});

test('every measured state rectangle and mounting pivot stays within the authored atlas',()=>{
 for(const atlas of Object.values(VERDUN_PART_FRAMES)){
  for(const frames of [...Object.values(atlas.mounts).map(q=>q.frames),...Object.values(atlas.guns)])for(const frame of frames){
   const [x,y,w,h]=frame.rect,[px,py]=frame.pivot;
   assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=1254&&y+h<=1254);
   assert(px>=0&&py>=0&&px<=w&&py<=h);
  }
 }
});
