import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};

import {Mark1Landship,SchwabenFortress} from '../somme-boss-combat.js?v=coop1';
import {sponsonAim,sommeMuzzle,angleDelta} from '../somme-boss-layout.js?v=coop1';
import {SOMME_FRAMES,SOMME_SHEETS} from '../somme-boss-atlas.js?v=coop1';
import {existsSync} from 'node:fs';
const tuning={maxHp:3000,damage:20,bulletSpeed:240,regionalViewWidth:390,regionalViewHeight:844};
const bounds={left:-195,right:195,top:-422,bottom:422};
const ctx={players:[],bounds};
const tank=()=>new Mark1Landship({id:'tank',x:0,y:-600,tuning,emit(){}});
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('tracked drive translates along its hull with bounded acceleration and no camera clamping',()=>{
 for(const hurt of [false,true]){
  const a=tank(),b=tank();if(hurt)for(const q of [a,b])q.hit({partId:'track-left',damage:99999});
  for(let i=0;i<1200;i++){
   const old={x:a.x,y:a.y,a:a.hullYaw,v:a.driveVelocity||0};a.update(.05,ctx);
   b.update(.05,{players:[],bounds:{left:bounds.left+i*45,right:bounds.right+i*45,top:bounds.top-i*80,bottom:bounds.bottom-i*80}});
   near(a.x,b.x);near(a.y,b.y);near(a.hullYaw,b.hullYaw);
   // A tracked tank cannot acquire sideways velocity while turning.
   near((a.x-old.x)*Math.cos(a.hullYaw)+(a.y-old.y)*Math.sin(a.hullYaw),0);
   assert(Math.abs(angleDelta(a.hullYaw,old.a))<=.16*.05+1e-9);
   assert((a.driveVelocity||0)-old.v<=13*a.sommeScale*.05+1e-9);
   assert(Math.hypot(a.x-old.x,a.y-old.y)<=17*a.sommeScale*.05+1e-9);
  }
 }
});

test('male settles before firing and female has a faster covering burst during the halt',()=>{
 const male=tank(),events=[];male.emit=e=>events.push({...e,velocity:male.driveVelocity});
 for(let i=0;i<30;i++)male.update(.05,ctx);
 male.timers.set('sponson-left',0);
 const players=[{id:'p',alive:true,x:350,y:male.y+70}];
 for(let i=0;i<150;i++)male.update(.05,{players,bounds:{left:-500,right:500,top:-1000,bottom:1000}});
 const shots=events.filter(e=>e.visual==='somme-landship-shell');assert(shots.length>0);assert(shots.every(e=>e.velocity<.5));
 const female=new Mark1Landship({id:'female',x:0,y:0,slot:1,tuning,emit(){}});
 female.encounter={bodies:new Map([['male',male],['female',female]])};male.salvo={};
 const intervals=[];female.fireMG=(p,dt,players,interval)=>intervals.push(interval);
 female.update(.05,{players,bounds});assert.deepEqual(intervals,[2.5,2.5]);
});

test('sponson traverse rejects the opposite side and respects the hull rotation',()=>{
 const b=tank(),p=b.parts.get('sponson-left');
 for(const a of [0,.7,Math.PI]){
  b.hullYaw=a;const center=a+Math.PI;
  const aim=offset=>sponsonAim(b,p,b.x+p.x+Math.cos(center+offset)*500,b.y+p.y+Math.sin(center+offset)*500);
  assert(aim(0).reachable);assert(aim(1.4).reachable);assert(!aim(1.6).reachable);
  near(Math.abs(angleDelta(aim(2).angle,center)),1.45);
 }
});

test('creeping barrage changes impact rows while preserving its committed clear corridor',()=>{
 const events=[],b=new SchwabenFortress({id:'fort',x:0,y:0,tuning:{...tuning,regionalViewWidth:1440},emit:e=>events.push(e)});
 const wide={left:-720,right:720,top:-500,bottom:500},players=[{id:'p',alive:true,x:0,y:200}];
 b.wave=1;b.planBarrage(players,wide);const captured={...b.lock};b.launchBarrage();
 const shots=events.filter(e=>e.visual==='somme-heavy-shell');assert(shots.length>=2);assert(new Set(shots.map(s=>s.y)).size>1);
 for(const shot of shots){assert(Math.abs(shot.x-captured.gate)-shot.radius>=b.lane.width/2);assert(shot.warning>=1.65);assert(shot.delay<=1.28);}
 b.timers.set('twin-aa',0);b.update(.01,{players,bounds:wide});
 for(const shot of events.filter(e=>e.visual==='somme-aa-shell'))assert(Math.abs(shot.x-b.lane.x)-shot.radius>=b.lane.width/2);
});

test('observer loss makes heavy and AA impact coordinates independent of pilot position',()=>{
 const run=x=>{const events=[],b=new SchwabenFortress({id:'blind',x:0,y:0,tuning,emit:e=>events.push(e)});b.hit({partId:'observer',damage:99999});b.timers.set('twin-aa',0);b.update(.05,{players:[{id:'p',alive:true,x,y:40}],bounds});return events.filter(e=>e.visual==='somme-aa-shell').map(e=>[e.x,e.y,e.warning]);};
 assert.deepEqual(run(-150),run(150));assert(run(150).length>0);
});

test('atlas references exist and all cell rectangles remain within authored images',()=>{
 const sizes={'schwaben-body':[1774,887],'schwaben-guns':[1254,1254],'schwaben-support':[1536,1024],'mark1-hulls':[1536,1024],'mark1-hardware':[1448,1086]};
 for(const filename of Object.values(SOMME_SHEETS))assert(existsSync(new URL('../'+filename,import.meta.url)));
 for(const f of Object.values(SOMME_FRAMES)){const [w,h]=sizes[f.sheet],[x,y,rw,rh]=f.rect;assert(x>=0&&y>=0&&x+rw<=w&&y+rh<=h);}
});

test('support roofs draw below weapons, bore tips meet native muzzles and sponson housings stay fixed',async()=>{
 const oldImage=globalThis.Image;
 globalThis.Image=class{naturalWidth=1536;naturalHeight=1024;listeners={};addEventListener(k,fn){this.listeners[k]=fn}set src(v){this.url=v;queueMicrotask(()=>{this.listeners.load?.();this.onload?.()})}};
 const art=await import('../somme-boss-render.js?v=coop1');
 let matrix=[1,0,0,1,0,0],stack=[],calls=[];
 const c=new Proxy({globalAlpha:1,save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y},rotate(a){const [x,y,u,v]=matrix,cs=Math.cos(a),sn=Math.sin(a);matrix[0]=x*cs+u*sn;matrix[1]=y*cs+v*sn;matrix[2]=u*cs-x*sn;matrix[3]=v*cs-y*sn},drawImage(im,...args){calls.push({url:im.url,args,matrix:[...matrix]})}},{get:(o,k)=>k in o?o[k]:()=>{}});
 try{
  await art.prepareSommeAssets();
  for(const Ctor of [SchwabenFortress,Mark1Landship]){
   const b=new Ctor({id:'render',x:73,y:-40,tuning,emit(){}});for(const p of b.parts.values())p.angle=.35;
   calls=[];art.drawSommeBoss(c,{...b,assetKey:b.kind,parts:[...b.parts.values()]});
   const gunCalls=calls.filter(q=>q.url.includes('schwaben-guns-r2'));
   assert(gunCalls.length>0);
   const support=calls.filter(q=>q.url.includes('schwaben-support'));
   if(Ctor===SchwabenFortress)assert(Math.max(...support.map(q=>calls.indexOf(q)))<Math.min(...gunCalls.map(q=>calls.indexOf(q))));
   for(const p of [...b.parts.values()].filter(p=>p.muzzleLength>0)){
    const key=p.art==='casemate'?'gun-heavy':p.art==='mg'?'gun-mg':p.art==='sponson'?'gun-heavy':'gun-twin-aa',f=SOMME_FRAMES[key+'-normal'];
    const call=gunCalls.find(q=>q.args.slice(0,4).every((v,i)=>v===f.rect[i]));assert(call);
    // Multiple identical gun frames use per-part position in draw order.
    const same=[...b.parts.values()].filter(q=>q.muzzleLength>0&&(q.art===p.art));const chosen=gunCalls.filter(q=>q.args.slice(0,4).every((v,i)=>v===f.rect[i]))[same.indexOf(p)];
    const [a,d,u,v,x,y]=chosen.matrix,k=chosen.args[6]/f.rect[2],dx=chosen.args[4]+f.tip[0]*k,dy=chosen.args[5]+f.tip[1]*k,m=sommeMuzzle(b,p);
    near(a*dx+u*dy+x,m.x);near(d*dx+v*dy+y,m.y);
   }
   if(Ctor===Mark1Landship){const fixed=calls.filter(q=>q.url.includes('hardware')&&q.args[0]>=724);for(const q of fixed){near(q.matrix[0],Math.cos(b.hullYaw));near(q.matrix[1],Math.sin(b.hullYaw));}}
  }
 }finally{art.releaseSommeAssets();globalThis.Image=oldImage;}
});
