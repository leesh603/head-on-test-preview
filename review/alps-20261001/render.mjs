// Replays the repository's actual boss renderer using native Canvas.
// This comparison omits the host HUD, player input and browser lifecycle.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.ALPS_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),missing=new Set();
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
const {drawStageBoss,prepareStageBossAssets}=await import(pathToFileURL(path.join(root,'stageboss-view.js')).href+'?v='+(process.env.ALPS_RENDER_PREFIX?'468':'alps20261001'));
const {StageBossAddon}=await import(pathToFileURL(path.join(root,'headon-stageboss-runtime.js')).href+'?v='+(process.env.ALPS_RENDER_PREFIX?'468':'alps20261001'));
const {fxArtReady}=await import(pathToFileURL(path.join(root,'fx-art.js')).href+'?v=469');
const tune={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,patternMultiplier:1,projectileDensity:1,coastalInterval:2.5,craneInterval:4.8,harborLaunchInterval:5.6};
function setup(kind){
 const addon=new StageBossAddon({runId:'render',teamFaction:kind==='gik'?'entente':'central',stageIndex:6,rng:()=>.5,hooks:{getTuning:()=>({...tune}),onDamage(){},onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onCue(){},onEncounterCleared(){},onStageChange(){},clearEncounterOwned(){}}});
 const enc=addon.startBoss({x:0,y:0}),body=[...enc.bodies.values()][0];
 return{addon,enc,body,frame:{players:[{id:'p1',alive:true,x:40,y:360,vx:24,vy:-15,radius:12}],bounds:{left:-900,top:-1000,right:900,bottom:1000}}};
}
function tick(f,s){for(let i=0;i<Math.round(s/.02);i++)f.addon.tick(.02,f.frame);}
await Promise.all([prepareStageBossAssets(6),fxArtReady]);
const states=[];
for(const kind of ['gik','ca4'])for(const state of ['normal','warning','release','engines','guns','critical','wreck']){
 const f=setup(kind);tick(f,.6);
 f.frame.bounds={left:-320,right:320,top:-260,bottom:360};f.frame.players=[{id:'p1',alive:true,x:20,y:-420,vx:0,vy:0,radius:12}];
 if(state==='warning'||state==='release'){
  f.body.timers.set(kind==='gik'?'alps-cannon':'ca4-bombs',0);tick(f,.1);
  if(state==='release')tick(f,1.4);
 }
 if(state==='engines'){f.body.hit({partId:'leftEngine',damage:99999});tick(f,2.1);}
 if(state==='guns'){for(const id of kind==='gik'?['cannon','rearGun']:['frontGun','rearGun'])f.body.hit({partId:id,damage:99999});tick(f,.4);}
 if(state==='critical'||state==='wreck'){
  for(const id of kind==='gik'?['leftEngine','rightEngine','cannon']:['leftEngine','centerEngine','rightEngine'])f.body.hit({partId:id,damage:99999});
  tick(f,2.1);f.body.phase=3;f.body.hp=f.body.maxHp*.26;
  if(kind==='ca4'){f.body.parts.get('bombBay').hittable=true;f.body.hit({partId:'bombBay',damage:99999});}
 }
 if(state==='wreck'){f.body.hit({damage:99999});f.addon.reconcile({blocked:true});tick(f,.7);}
 for(const [view,W,H,z]of [['pc',1280,800,.95],['mobile',390,844,.55]]){
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#6f929e');sky.addColorStop(1,'#c1c7b9');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  const g={stageBoss:f.addon,camera:{zoom:z},x:f.body.x,y:f.body.y,bossBuildings:[],bossCues:[],worldRegion:()=>6};
  ctx.save();ctx.translate(.25,.125);const before=ctx.getTransform();
  drawStageBoss(ctx,g,W,H,{});const after=ctx.getTransform();
  for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Renderer leaked Canvas state: '+kind+' '+state+' '+key);ctx.restore();
  fs.writeFileSync(path.join(import.meta.dirname,`${process.env.ALPS_RENDER_PREFIX||''}${kind}-${state}-${view}.png`),canvas.toBuffer('image/png'));
  states.push({kind,state,view,width:W,height:H,bodies:[...f.enc.bodies.values()].map(b=>({kind:b.kind,phase:b.phase,x:b.x,y:b.y,hp:b.hp,hullYaw:b.hullYaw,cannonLock:b.cannonLock,cannonRemaining:b.cannonRemaining,bombRunRemaining:b.bombRunRemaining,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y,localX:p.localX,localY:p.localY,hittable:p.hittable}))}))});
 }
 f.addon.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,(process.env.ALPS_RENDER_PREFIX||'')+'render-check.json'),JSON.stringify({renderer:'test-preview drawStageBoss via native Canvas',browser:false,base:'88e5eea20c40a5ea7b2c7ebe38089f2643ca7bab',canvasStateBalanced:true,states,missing:[...missing]},null,2));
console.log(JSON.stringify({states:states.length,missing:[...missing]}));
