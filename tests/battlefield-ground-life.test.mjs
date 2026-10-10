import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GROUND_ROUTES,GROUND_FIGHTS,GROUND_EVENTS,groundRoutePose,groundInfantryPose,groundBattlePhase} from '../ground-life.js';

const source=readFileSync(new URL('../ground-life.js',import.meta.url),'utf8')
 .split('\n').filter(line=>!/^import\b/.test(line.trim())).join('\n').replace(/\bexport (function|const)\b/g,'$1');
function context(){
 const counts={images:0,filters:0,geometry:0,fx:0};
 const c=new Proxy({globalAlpha:1,save(){},restore(){},drawImage(){counts.images++},fillRect(){counts.geometry++}},
 {get:(t,p)=>p in t?t[p]:()=>{},set(t,p,v){if(p==='filter')counts.filters++;t[p]=v;return true;}});
 return {c,counts};
}
async function renderer(){
 const fxKeys=[],document={createElement(){return {width:0,height:0,getContext:()=>context().c}}};
 const Image=class{set src(v){this.naturalWidth=1448;queueMicrotask(()=>this.onload())}};
 const api=new Function('fx','Image','document',source+'\nreturn {groundLifeReady,drawGroundLife};')((c,key)=>{fxKeys.push(key);return true;},Image,document);
 await api.groundLifeReady;return {...api,fxKeys};
}
test('vehicles accelerate along finite approved paths without sideways/reverse drift',()=>{
 const pose={},last={};
 for(const [key,routes]of Object.entries(GROUND_ROUTES))for(const r of routes){
  assert.ok(!['sea','channel','sky'].includes(key));
  let progress=-1;
  for(let n=0;n<100;n++){
   groundRoutePose(r,r[6]*n/100,0,pose);
   assert.ok(pose.progress>=progress);progress=pose.progress;
   assert.ok(pose.u>=Math.min(r[1],r[3])&&pose.u<=Math.max(r[1],r[3]));
   assert.ok(pose.v>=Math.min(r[2],r[4])&&pose.v<=Math.max(r[2],r[4]));
   if(n&&pose.moving){const dx=pose.u-last.u,dy=pose.v-last.v;assert.ok(dx*Math.cos(pose.heading)+dy*Math.sin(pose.heading)>0);}
   Object.assign(last,pose);
  }
  groundRoutePose(r,0,0,pose);assert.equal(pose.alpha,0,'loop wrap is invisible');assert.equal(pose.moving,false);
 }
});
test('water regions have no infantry, ground vehicles or ground fire',async()=>{
 const {drawGroundLife,fxKeys}=await renderer();const {c,counts}=context();
 for(const key of ['sea','channel','sky','night','alps']){assert.equal(GROUND_ROUTES[key],undefined);assert.equal(GROUND_FIGHTS[key],undefined);assert.equal(GROUND_EVENTS[key],undefined);drawGroundLife(c,key,-800,-800,1600,1600,1254,2,1);}
 assert.equal(counts.images,0);assert.equal(fxKeys.length,0);
});
test('squads charge, scatter, withdraw and lose a member within the inspected dry apron',()=>{
 const states=new Set(),p={};let hiddenCasualty=false;
 for(let n=0;n<4;n++)for(let tick=0;tick<840;tick++){
  groundInfantryPose(tick*.1,0,0,n,p);states.add(p.state);
  assert.ok(Math.abs((n-1)*7+p.along)<=20);
  assert.ok(p.forward>=0&&p.forward<=10);
  assert.ok(p.alpha>=0&&p.alpha<=1);
  if(p.state==='fallen'&&p.alpha===0)hiddenCasualty=true;
 }
 for(const state of ['fire','cover','charge','scatter','retreat','regroup','fallen'])assert.ok(states.has(state),state);
 assert.ok(hiddenCasualty,'casualties fade without a permanent corpse pool');
});
test('scenery uses painted images and existing FX without a live filter or drawn bodies',async()=>{
 const {drawGroundLife,fxKeys}=await renderer();const {c,counts}=context();
 for(let n=0;n<100;n++)drawGroundLife(c,'burning',0,0,1254,1254,1254,n*.07,1);
 assert.ok(counts.images>0);assert.ok(fxKeys.includes('fireGround'));assert.ok(fxKeys.includes('smokeDark'));
 assert.equal(counts.geometry,0,'no canvas-filled infantry, vehicles or smoke');assert.equal(counts.filters,0);
});
test('portrait mobile and broad desktop scenes remain bounded over long travel',async()=>{
 const {drawGroundLife,fxKeys}=await renderer();
 for(const density of [1,.45])for(const key of ['trenches','burning','cambrai','somme','city']){
  const {c,counts}=context();let maxImages=0,maxFx=0;
  for(let n=0;n<200;n++){
   const old=counts.images,oldFx=fxKeys.length;drawGroundLife(c,key,n*137-12000,n*83-9000,density===1?1920:390,density===1?1080:844,key==='cambrai'?768:1254,n*.21,density);
   maxImages=Math.max(maxImages,counts.images-old);maxFx=Math.max(maxFx,fxKeys.length-oldFx);
  }
  assert.ok(maxImages<=(density===1?38:15),key+' sprites '+maxImages);assert.ok(maxFx<=(density===1?80:32),key+' FX '+maxFx);
 }
});

test('a nearby bombardment drives scatter, retreat and sustained smoke',async()=>{
 const p={};
 groundInfantryPose(8.9,0,0,0,p);assert.equal(p.state,'charge');
 groundInfantryPose(9.2,0,0,0,p);assert.equal(p.state,'scatter');
 groundInfantryPose(11,0,0,0,p);assert.equal(p.state,'retreat');
 assert.equal(groundBattlePhase(9,0,0),9);
 const {drawGroundLife,fxKeys}=await renderer(),{c}=context();
 drawGroundLife(c,'trenches',300,160,150,150,1254,14,1);
 assert.ok(fxKeys.includes('smokeDust'),'smoke remains five seconds after the squad impact');
 assert.ok(!fxKeys.some(k=>/explosionHot|flameJet|airblast/.test(k)),'no bright airborne combat FX reused for ground shells');
});
