// Replays the repository's actual boss renderer using native Canvas.
// This comparison omits the host HUD, player input and browser lifecycle.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.AIRSHIP_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),missing=new Set();
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
const tune={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,motionMultiplier:1,projectileDensity:.7,engineInterval:2.6,engineShotCount:3,gasInterval:6.2,launchInterval:3.4,panicInterval:2.8};
function setup(boss){
 const addon=new StageBossAddon({runId:'render',teamFaction:boss==='hma23'?'central':'entente',stageIndex:5,rng:()=>.5,hooks:{getTuning:()=>({...tune}),onDamage(){},onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onCue(){},onEncounterCleared(){},onStageChange(){},clearEncounterOwned(){}}});
 const enc=addon.startBoss({x:0,y:0}),body=[...enc.bodies.values()][0];
 return{addon,enc,body,frame:{players:[{id:'p1',alive:true,x:50,y:430,vx:24,vy:-15,radius:12}],bounds:{left:-900,top:-1000,right:900,bottom:1000}}};
}
function tick(f,s){for(let i=0;i<Math.round(s/.02);i++)f.addon.tick(.02,f.frame);}
function open(f){if(f.body.kind==='zeppelin-l70'){f.body.hit({partId:'capsule',damage:99999});tick(f,1.12);}else for(let i=0;i<4;i++)f.body.hit({partId:'port-'+i,damage:99999});}
await Promise.all([prepareStageBossAssets(5),fxArtReady]);
const states=[];
for(const boss of ['zeppelin-l70','hma23'])for(const state of ['normal','attack','damage','exposed','wreck']){
 const f=setup(boss);tick(f,.6);
 if(state==='attack'){
  if(boss==='zeppelin-l70'){f.body.timers.set('bomb-run',0);f.body.timers.set('carpet',0);tick(f,.4);}
  else{f.body.timers.set('launch-wave',0);f.body.timers.set('launch',0);tick(f,.4);}
 }
 if(state==='damage'){
  if(boss==='zeppelin-l70')open(f);
  for(const id of boss==='zeppelin-l70'?['engine-0','engine-3']:['port-1','engine-0'])if(f.body.parts.has(id))f.body.hit({partId:id,damage:99999});
  f.body.hp=Math.min(f.body.hp,f.body.maxHp*.55);tick(f,.6);
 }
 if(state==='exposed'||state==='wreck')open(f);
 if(state==='wreck'){f.body.hit({damage:99999});f.addon.reconcile({blocked:true});tick(f,.5);}
 for(const [view,W,H,z]of [['pc',1280,800,.75],['mobile',390,844,.42]]){
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  // Neutral high-altitude backdrop exposes atlas alpha and mount alignment.
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#243744');sky.addColorStop(1,'#465762');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  const g={stageBoss:f.addon,camera:{zoom:z},x:0,y:0,bossBuildings:[],bossCues:[],worldRegion:()=>5};
  drawStageBoss(ctx,g,W,H,{});
  fs.writeFileSync(path.join(import.meta.dirname,`${process.env.AIRSHIP_RENDER_PREFIX||''}${boss}-${state}-${view}.png`),canvas.toBuffer('image/png'));
  states.push({boss,state,view,width:W,height:H,bodies:[...f.enc.bodies.values()].map(b=>({kind:b.kind,phase:b.phase,x:b.x,y:b.y,hp:b.hp,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y,hatch:p.hatch,launchWarmup:p.launchWarmup}))}))});
 }
 f.addon.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,(process.env.AIRSHIP_RENDER_PREFIX||'')+'render-check.json'),JSON.stringify({renderer:'test-preview drawStageBoss via native Canvas',browser:false,base:'6797ac040a46bc0ba1c02aaf4f84dc257c34c900',states,missing:[...missing]},null,2));
console.log(JSON.stringify({states:states.length,missing:[...missing]}));
