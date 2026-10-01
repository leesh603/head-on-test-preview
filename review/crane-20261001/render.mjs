// Replays the repository's actual boss renderer using native Canvas.
// This comparison omits the host HUD, player input and browser lifecycle.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.CRANE_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),missing=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage {
 constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn();};this.onerror=()=>{for(const fn of this.listeners.error||[])fn();};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(root,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));}catch{missing.add(file);queueMicrotask(()=>this.onerror?.());}}
 get src(){return nativeSrc.get.call(this);}
}
globalThis.Image=AssetImage;
globalThis.localStorage={getItem:()=>null};globalThis.location={search:''};
globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};
globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const {drawStageBoss,prepareStageBossAssets}=await import(pathToFileURL(path.join(root,'stageboss-view.js')));
const {StageBossAddon}=await import(pathToFileURL(path.join(root,'headon-stageboss-runtime.js')));
const {fxArtReady}=await import(pathToFileURL(path.join(root,'fx-art.js')));
const tune={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,patternMultiplier:1,projectileDensity:1,coastalInterval:2.5,craneInterval:4.8,harborLaunchInterval:5.6};
function setup(){
 const addon=new StageBossAddon({runId:'render',teamFaction:'entente',stageIndex:7,rng:()=>.5,hooks:{getTuning:()=>({...tune}),onDamage(){},onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onCue(){},onEncounterCleared(){},onStageChange(){},clearEncounterOwned(){}}});
 const enc=addon.startBoss({x:0,y:0}),body=[...enc.bodies.values()][0];
 return{addon,enc,body,frame:{players:[{id:'p1',alive:true,x:40,y:360,vx:24,vy:-15,radius:12}],bounds:{left:-900,top:-1000,right:900,bottom:1000}}};
}
function tick(f,s){for(let i=0;i<Math.round(s/.02);i++)f.addon.tick(.02,f.frame);}
await Promise.all([prepareStageBossAssets(7),fxArtReady]);
const states=[];
for(const state of ['normal','windup','sweep','damage','exposed','wreck']){
 const f=setup();tick(f,.6);
 if(state==='windup'||state==='sweep'){
  if(f.body.startCrane){f.body.craneAngle=1.8;f.body.startCrane(f.frame.players);tick(f,state==='windup'?.4:f.body.craneWarn+1.4);}
  else{f.body.timers.set('crane-mines',0);tick(f,state==='windup'?.4:1.4);}
 }
 if(state==='damage'){for(const id of ['ammo-storage','gun-left','seaplane-facility'])f.body.hit({partId:id,damage:99999});tick(f,.6);}
 if(state==='exposed'||state==='wreck'){
  for(const id of ['ammo-storage','gun-left','crane-arm','crane-pivot'])f.body.hit({partId:id,damage:99999});
  tick(f,.3);
 }
 if(state==='wreck'){f.body.hit({damage:99999});f.addon.reconcile({blocked:true});tick(f,.7);}
 for(const [view,W,H,z]of [['pc',1280,800,.8],['mobile',390,844,.46]]){
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  ctx.fillStyle='#28464a';ctx.fillRect(0,0,W,H);
  const g={stageBoss:f.addon,camera:{zoom:z},x:0,y:0,bossBuildings:[],bossCues:[],worldRegion:()=>7};
  ctx.save();ctx.translate(.25,.125);const before=ctx.getTransform();
  drawStageBoss(ctx,g,W,H,{});const after=ctx.getTransform();
  for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Renderer leaked Canvas state: '+state+' '+key);ctx.restore();
  fs.writeFileSync(path.join(import.meta.dirname,`${process.env.CRANE_RENDER_PREFIX||''}harbor-${state}-${view}.png`),canvas.toBuffer('image/png'));
  states.push({state,view,width:W,height:H,bodies:[...f.enc.bodies.values()].map(b=>({kind:b.kind,phase:b.phase,x:b.x,y:b.y,hp:b.hp,craneState:b.craneState,craneAngle:b.craneAngle,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y,angle:p.angle,launchWarmup:p.launchWarmup}))}))});
 }
 f.addon.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,(process.env.CRANE_RENDER_PREFIX||'')+'render-check.json'),JSON.stringify({renderer:'test-preview drawStageBoss via native Canvas',browser:false,base:'d0ad86a698ff9f474ca93aa585ef972b0af9ff6e',canvasStateBalanced:true,states,missing:[...missing]},null,2));
console.log(JSON.stringify({states:states.length,missing:[...missing]}));
