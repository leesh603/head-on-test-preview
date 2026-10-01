// Actual game renderer and host on native Canvas, without browser input or HUD.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.CAMBRAI_ROOT||path.resolve(import.meta.dirname,'../..'),prefix=process.env.CAMBRAI_PREFIX||'',tag=prefix?'480':'cambrai20261001',missing=new Set(),loaded=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage{constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn()};this.onerror=()=>{for(const fn of this.listeners.error||[])fn()};}addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(root,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));loaded.add(path.relative(root,file));}catch{missing.add(path.relative(root,file));queueMicrotask(()=>this.onerror?.());}}get src(){return nativeSrc.get.call(this);}}
globalThis.Image=AssetImage;globalThis.localStorage={getItem:()=>null};globalThis.location={search:''};globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const mod=name=>import(pathToFileURL(path.join(root,name)).href+'?v='+tag);
const {drawStageBoss,prepareStageBossAssets}=await mod('stageboss-view.js'),{drawRegionalBug}=await mod('regional-boss-view352.js'),{CoopGame}=await mod('coop-engine.js'),{enableStageBoss,beginStageBossFrame,endStageBossFrame}=await mod('stageboss-host.js');
await prepareStageBossAssets(8);const states=[];
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds/.02);i++){g.t+=.02;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}}
for(const [view,W,H]of [['pc',1280,800],['mobile',390,844]])for(const kind of ['fliegerzug','treffas-wagen'])for(const state of ['normal','windup','release','damage','exposed','wreck']){
 const pilots=kind==='fliegerzug'?[{pilot:'baron'},{pilot:'voss'}]:[{pilot:'fonck'},{pilot:'fonck'}],g=new CoopGame(pilots,{rng:()=>.37});g.viewWidth=W;g.viewHeight=H;g.camera={x:0,y:0,zoom:1};g.region=8;
 enableStageBoss(g,{teamFaction:g.teamFaction,heavyHp:1.65});g.stageBoss.stages.stageIndex=8;
 const enc=g.stageBoss.startBoss({x:0,y:kind==='fliegerzug'?-452:0}),b=[...enc.bodies.values()][0];
 for(const [i,p]of g.players.entries()){p.x=(i?1:-1)*95;p.y=150;p.invuln=9999;p.previousX=p.x;p.previousY=p.y;}
 if(state==='windup'||state==='release'){
  if(kind==='fliegerzug'){b.prepareBug(b.parts.get('car-launch-a'),[{id:'p1',alive:true,x:95,y:150,vx:0,vy:0}]);tick(g,state==='release'?1.42:.2);}
  else if(b.planFlak){b.planFlak({id:'p1',alive:true,x:95,y:150,vx:0,vy:0});tick(g,state==='release'?3.6:1.3);}
  else{b.timers.set('treffas-flak',0);tick(g,state==='release'?1.3:.02);}
 }
 if(state==='damage'){for(const id of kind==='fliegerzug'?['car-launch-a']:['wheel-left','turret'])b.hit({partId:id,damage:b.parts.get(id).maxHp*.65});tick(g,.16);}
 if(state==='exposed'){for(const id of kind==='fliegerzug'?['car-flak','car-launch-a','car-supply']:['wheel-left','wheel-right'])b.hit({partId:id,damage:999999});tick(g,1.4);}
 if(state==='wreck'){for(const id of kind==='fliegerzug'?['car-launch-a']:['turret'])b.hit({partId:id,damage:999999});tick(g,2.2);}
 const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.fillStyle='#686743';c.fillRect(0,0,W,H);c.strokeStyle='#53543b';c.lineWidth=1;for(let y=-20;y<H;y+=55){c.beginPath();c.moveTo(0,y);c.lineTo(W,y+45);c.stroke();}
 c.save();c.translate(.25,.125);const before=c.getTransform();drawStageBoss(c,g,W,H,{});c.save();c.translate(W/2-g.x,H/2-g.y);for(const e of g.enemies)if(e.bugDrone)drawRegionalBug(c,e);c.restore();const after=c.getTransform();for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Canvas state leak '+kind+' '+state);c.restore();
 fs.writeFileSync(path.join(import.meta.dirname,`${prefix}${kind}-${state}-${view}.png`),canvas.toBuffer('image/png'));
 states.push({kind,state,view,hp:b.hp,maxHp:b.maxHp,phase:b.phase,coreVulnerable:b.coreVulnerable,flakLock:b.flakLock,bugs:g.enemies.filter(e=>e.bugDrone).map(e=>({x:e.x,y:e.y,a:e.a,targetX:e.bugTargetX,targetY:e.bugTargetY,launchAge:e.launchAge})),parts:[...b.parts.values()].map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,angle:p.angle,detachedPose:p.detachedPose}))});g.stageBoss.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,prefix+'render-check.json'),JSON.stringify({renderer:'Actual drawStageBoss/drawRegionalBug + stageboss-host / CoopGame on native Canvas; flat field background',browser:false,base:'ad93bb6878421bb3eb96ecb338a1c10c1cc589dc',canvasStateBalanced:true,states,loaded:[...loaded].sort(),missing:[...missing].sort()},null,2));console.log(JSON.stringify({frames:states.length,missing:[...missing].sort()}));
