// Actual host and Canvas renderer. This capture is not a browser playtest.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.SOMME_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),prefix=process.env.SOMME_RENDER_PREFIX||'',tag=prefix?'480':'somme20261001',missing=new Set(),loaded=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage{constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn()};this.onerror=()=>{for(const fn of this.listeners.error||[])fn()};}addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(root,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));loaded.add(path.relative(root,file));}catch{missing.add(path.relative(root,file));queueMicrotask(()=>this.onerror?.());}}get src(){return nativeSrc.get.call(this);}}
globalThis.Image=AssetImage;globalThis.localStorage={getItem:()=>null};globalThis.location={search:''};globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const mod=name=>import(pathToFileURL(path.join(root,name)).href+'?v='+tag);
const {drawStageBoss,prepareStageBossAssets}=await mod('stageboss-view.js'),{CoopGame}=await mod('coop-engine.js'),{enableStageBoss,beginStageBossFrame,endStageBossFrame}=await mod('stageboss-host.js'),{TerrainRenderer,preloadTerrainProfile}=await mod('alps-terrain117.js'),{fxArtReady}=await mod('fx-art.js');
await Promise.all([prepareStageBossAssets(10),preloadTerrainProfile('somme'),fxArtReady]);
const terrain=new TerrainRenderer({detail:.72,tileSize:768,canvasFactory:createCanvas});
function game(kind,W,H){const config=kind==='fortress'?[{pilot:'fonck'},{pilot:'fonck'}]:[{pilot:'baron'},{pilot:'voss'}],g=new CoopGame(config,{rng:()=>.37});g.viewWidth=W;g.viewHeight=H;g.camera={x:0,y:0,zoom:1};g.region=10;enableStageBoss(g,{teamFaction:g.teamFaction,heavyHp:1.65});g.stageBoss.stages.stageIndex=10;for(const [i,p]of g.players.entries()){p.x=(i?1:-1)*60;p.y=150;p.invuln=9999;p.previousX=p.x;p.previousY=p.y;}return g;}
function tick(g,seconds){for(let i=0;i<Math.round(seconds/.02);i++){g.t+=.02;g.updateHazards(.02);beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}}
const states=[];
for(const [view,W,H]of [['pc',1280,800],['mobile',390,844]])for(const kind of ['fortress','landships'])for(const state of prefix?['normal','windup','damage','wreck']:['normal','windup','release','damage','support-lost','immobilized','wreck']){
 const g=game(kind,W,H),enc=g.stageBoss.startBoss({x:0,y:-90});tick(g,.06);const bodies=[...enc.bodies.values()],b=bodies[0];
 if(prefix){if(state==='windup'){for(const body of bodies)for(const key of body.timers.keys())body.timers.set(key,0);tick(g,.3);}if(state==='damage')for(const p of b.parts.values())b.hit({partId:p.id,damage:p.maxHp*.65});if(state==='wreck'){for(const p of b.parts.values())b.hit({partId:p.id,damage:999999});b.hit({damage:999999});g.stageBoss.reconcile({blocked:true});tick(g,.5);}}
 else{
  if(state==='windup'||state==='release'){if(kind==='fortress')b.planBarrage(g.players.map(p=>({...p,alive:true})),{left:-W/2,right:W/2,top:-H/2,bottom:H/2});else b.timers.set('sponson-left',0);tick(g,state==='release'?1.65:.25);}
  if(state==='damage'){for(const body of bodies)for(const p of body.parts.values())body.hit({partId:p.id,damage:p.maxHp*.6});tick(g,.06);}
  if(state==='support-lost'){for(const id of kind==='fortress'?['observer','ammo']:['sponson-left','sponson-right'])for(const body of bodies)body.hit({partId:id,damage:999999});tick(g,3);}
  if(state==='immobilized'){if(kind==='fortress')for(const id of ['gun-left','twin-aa'])b.hit({partId:id,damage:999999});else for(const id of ['track-left','track-right'])b.hit({partId:id,damage:999999});tick(g,1.8);}
  if(state==='wreck'){for(const p of b.parts.values())b.hit({partId:p.id,damage:999999});b.hit({damage:999999});g.stageBoss.reconcile({blocked:true});tick(g,.5);}
 }
 const canvas=createCanvas(W,H),c=canvas.getContext('2d');terrain.draw(c,{key:'somme',camera:{x:g.x-W/2,y:g.y-H/2},width:W,height:H});
 c.save();c.translate(.25,.125);const before=c.getTransform();drawStageBoss(c,g,W,H,{});const after=c.getTransform();for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Canvas state leak '+kind+' '+state);c.restore();
 const file=`${prefix}${kind}-${state}-${view}.png`;fs.writeFileSync(path.join(import.meta.dirname,file),canvas.toBuffer('image/png'));
 states.push({file,kind,state,view,width:W,height:H,bodies:bodies.map(b=>({kind:b.kind,role:b.tankRole,x:b.x,y:b.y,hp:b.hp,maxHp:b.maxHp,dead:b.dead,phase:b.phase,scale:b.sommeScale||b.regionalScale,coreVulnerable:b.coreVulnerable,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y,angle:p.angle}))}))});g.stageBoss.dispose();
}
const report={renderer:'actual drawStageBoss, CoopGame, stageboss-host and TerrainRenderer via native Canvas',browser:false,terrainTextureAvailable:!missing.has('terrain-somme359r2.webp'),base:'5b9f3a870720dcc63f61fdc64b2fdfc21b7a32de',canvasStateBalanced:true,states,loaded:[...loaded].sort(),missing:[...missing].sort()};fs.writeFileSync(path.join(import.meta.dirname,prefix+'render-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({frames:states.length,atlasLoaded:[...loaded].filter(s=>/20261001.webp$/.test(s)),missing:report.missing}));
if(!prefix)for(const kind of ['fortress','landships']){
 const g=game(kind,760,520);g.stageBoss.startBoss({x:0,y:kind==='fortress'?0:20});const canvas=createCanvas(760,520),c=canvas.getContext('2d');drawStageBoss(c,g,760,520,{layer:'bodies'});
 fs.writeFileSync(path.join(root,kind==='fortress'?'boss-art-schwaben20261001.webp':'boss-art-mark1-20261001.webp'),canvas.encodeSync('webp',94));g.stageBoss.dispose();
}
