// Reproducible test-server Canvas renderer inspection, not a browser play claim.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.ADRIATIC_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),dist=root,missing=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage {
 constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn();};this.onerror=()=>{for(const fn of this.listeners.error||[])fn();};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(dist,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));}catch{missing.add(file);queueMicrotask(()=>this.onerror?.());}}
 get src(){return nativeSrc.get.call(this);}
}
globalThis.Image=AssetImage;
globalThis.localStorage={getItem:()=>null};
globalThis.location={search:''};
globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};
globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const {drawStageBoss,prepareStageBossAssets}=await import(pathToFileURL(path.join(root,'stageboss-view.js')));
const {StageBossAddon}=await import(pathToFileURL(path.join(root,'headon-stageboss-runtime.js')));
const {fxArtReady}=await import(pathToFileURL(path.join(root,'fx-art.js')));
const tune={maxHp:2400,partHp:288,damage:18,bulletSpeed:270,geometryScale:2.025,mobileBoss:true,splitProtection:0,projectileDensity:.7,broadsideInterval:1.72,mortarInterval:2.05,chargeInterval:3.05};
function setup(boss){
 const addon=new StageBossAddon({runId:'render',teamFaction:boss==='hms-zubian'?'central':'entente',stageIndex:1,hooks:{getTuning:()=>({...tune}),onDamage(){},onStatus(){},onBarrierContact(){},spawnMinion(){},countMinions:()=>0,onBuildingImpact:()=>false,onCue(){},onEncounterCleared(){},onStageChange(){},clearEncounterOwned(){}}});
 const enc=addon.startBoss({x:0,y:0}),body=[...enc.bodies.values()][0];
 return{addon,enc,body,frame:{players:[{id:'p1',alive:true,x:50,y:520,radius:12}],bounds:{left:-900,top:-1000,right:900,bottom:1000}}};
}
await Promise.all([prepareStageBossAssets(1),fxArtReady]);
const sea=new AssetImage();sea.src='./terrain-sea.webp';await sea.decode().catch(()=>{});
const states=[];
for(const boss of ['sms-stuttgart','hms-zubian'])for(const state of ['normal','damage','split','wreck']){
 if(boss==='sms-stuttgart'&&state==='split')continue;
 const f=setup(boss);
 if(state==='damage'){f.body.hit({partId:boss==='hms-zubian'?'frontEngine':'gun0',damage:9999});if(boss==='sms-stuttgart')f.body.hit({partId:'cover',damage:9999});}
 if(state==='split'||state==='wreck'){
  f.body.hit({damage:99999});for(let i=0;i<140;i++)f.addon.tick(.02,f.frame);
  if(state==='wreck'){
   if(boss==='sms-stuttgart'){f.body.hit({partId:'fuel',damage:99999});f.body.hit({damage:99999});for(let i=0;i<50;i++)f.addon.tick(.02,f.frame);f.body.hit({damage:99999});}
   else for(const b of f.enc.bodies.values())b.hit({damage:99999});
   f.addon.reconcile({blocked:true});for(let i=0;i<25;i++)f.addon.tick(.02,f.frame);
  }
 }
 for(const [view,W,H,z]of [['pc',1280,800,.65],['mobile',390,844,.34]]){
  const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');
  if(sea.naturalWidth){ctx.drawImage(sea,0,0,W,H);}else{ctx.fillStyle='#294d52';ctx.fillRect(0,0,W,H);}
  const g={stageBoss:f.addon,camera:{zoom:z},x:0,y:0,bossBuildings:[],bossCues:[],worldRegion:()=>1};
  drawStageBoss(ctx,g,W,H,{});
  fs.writeFileSync(path.join(import.meta.dirname,`${process.env.ADRIATIC_RENDER_PREFIX||''}${boss}-${state}-${view}.png`),canvas.toBuffer('image/png'));
  states.push({boss,state,view,width:W,height:H,bodies:[...f.enc.bodies.values()].map(b=>({kind:b.kind,x:b.x,y:b.y,hp:b.hp,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y}))}))});
 }
 f.addon.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,(process.env.ADRIATIC_RENDER_PREFIX||'')+'render-check.json'),JSON.stringify({renderer:'test-server drawStageBoss via native Canvas',browser:false,states,missing:[...missing]},null,2));
console.log(JSON.stringify({states:states.length,missing:[...missing]}));
