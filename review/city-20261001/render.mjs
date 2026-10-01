// Actual repository renderer + host simulation, native Canvas; no browser input/HUD.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('@napi-rs/canvas');
const root=process.env.CITY_RENDER_ROOT||path.resolve(import.meta.dirname,'../..'),prefix=process.env.CITY_RENDER_PREFIX||'',tag=prefix?'469':'city20261001',missing=new Set(),loaded=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage{constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn()};this.onerror=()=>{for(const fn of this.listeners.error||[])fn()};}addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(root,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));loaded.add(path.relative(root,file));}catch{missing.add(path.relative(root,file));queueMicrotask(()=>this.onerror?.());}}get src(){return nativeSrc.get.call(this);}}
globalThis.Image=AssetImage;globalThis.localStorage={getItem:()=>null};globalThis.location={search:''};globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const mod=name=>import(pathToFileURL(path.join(root,name)).href+'?v='+tag);
const {drawStageBoss,prepareStageBossAssets}=await mod('stageboss-view.js');const {CoopGame}=await mod('coop-engine.js');const {enableStageBoss,beginStageBossFrame,endStageBossFrame}=await mod('stageboss-host.js');const {drawCityAirLayer,prepareCityAirAssets}=await mod('city-air1.js');const {fxArtReady}=await mod('fx-art.js');const {TerrainRenderer,preloadTerrainProfile}=await mod('alps-terrain117.js');const {drawDrachenMine}=await mod('aa-defense-art.js');
const defense=prefix?null:await mod('city-defense.js');
await Promise.all([prepareStageBossAssets(4),prepareCityAirAssets?.(),fxArtReady,preloadTerrainProfile('city')]);
const terrain=new TerrainRenderer({detail:.72,tileSize:768,canvasFactory:createCanvas});
function game(kind,W,H){const config=kind==='drachen'?[{pilot:'fonck'},{pilot:'fonck'}]:[{pilot:'baron'},{pilot:'voss'}],g=new CoopGame(config,{rng:()=>.37});g.viewWidth=W;g.viewHeight=H;g.camera={x:0,y:0,zoom:1};g.region=4;enableStageBoss(g,{teamFaction:g.teamFaction,heavyHp:1.65});g.stageBoss.stages.stageIndex=4;for(const [i,p]of g.players.entries()){p.x=(i?1:-1)*60;p.y=120;p.invuln=9999;p.previousX=p.x;p.previousY=p.y;}return g;}
function tick(g,seconds){for(let i=0;i<Math.round(seconds/.02);i++){g.t+=.02;g.updateHazards(.02);beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}}
const states=[];
for(const [view,W,H,z]of [['pc',1280,800,.85],['mobile',390,844,1]])for(const kind of ['drachen','flak','ambient'])for(const state of kind==='ambient'?['normal','windup','disabled']:['normal','windup','release','damage','exposed','wreck']){
 const g=game(kind,W,H);g.camera.zoom=kind==='ambient'?1:z;
 if(kind==='ambient'){
  g.spawnCityNet();g.camera.y=-300;const lamps=g.enemies.filter(e=>e.cityUnit==='light');
  if(state==='windup'){if(defense){const lamp=lamps[0],pit=g.enemies.find(e=>e.cityUnit==='pit');lamp.lit.set('p1',20);pit.fireT=0;defense.tickCityDefense(g,.02);}else{lamps[0].lockT=1.2;g.illuminatedUntil=2;}}
  if(state==='disabled'){lamps[0].hp=0;defense?.tickCityDefense(g,.02);}
 }else{
  const enc=g.stageBoss.startBoss({x:0,y:0});tick(g,.66);let cells=[...enc.bodies.values()],b=cells[0];
  if(state==='windup'||state==='release'){
   if(kind==='drachen'){b.timers.set('mine-lay',0);tick(g,.18);if(state==='release')tick(g,1.45);}
   else{for(const cell of cells){if(cell.planShell)cell.planShell(80,120);else{const p=cell.parts.get('ears');p.angle=Math.atan2(120-cell.y,80-cell.x);cell.lockProgress=2;cell.timers.set('siege-locked',0);}}tick(g,state==='release'?3.0:.18);}
  }
  if(state==='damage'){for(const cell of cells){if(kind==='drachen'){cell.hit({partId:'airship-1',damage:cell.parts.get('airship-1').maxHp*.6});}else for(const id of ['siege','gun-bl'])cell.hit({partId:id,damage:cell.parts.get(id).maxHp*.6});}tick(g,.14);}
  if(state==='exposed'){for(const cell of cells)for(const id of kind==='drachen'?['airship-0','airship-1']:['ears','siege'])cell.hit({partId:id,damage:999999});tick(g,2);}
  if(state==='wreck'){if(kind==='drachen')b.hit({partId:'airship-0',damage:999999});else{for(const p of b.parts.values())b.hit({partId:p.id,damage:999999});b.hit({damage:999999});}g.stageBoss.reconcile({blocked:true});tick(g,.55);}
 }
 const canvas=createCanvas(W,H),c=canvas.getContext('2d');terrain.draw(c,{key:'city',camera:{x:g.x-W/2,y:g.y-H/2},width:W,height:H});
 c.save();c.translate(.25,.125);const before=c.getTransform();drawStageBoss(c,g,W,H,{});
 if(kind==='ambient'){c.save();c.translate(W/2-g.x,H/2-g.y);drawCityAirLayer(c,g,{point:(x,y)=>[x,y]});c.restore();}
 else{c.save();c.translate(W/2,H/2);c.scale(g.camera.zoom,g.camera.zoom);for(const f of g.hostileMinefields||[])for(const m of f.mines)if(!m.dead){drawDrachenMine(c,m.x,m.y,64,64);c.strokeStyle=f.warning>0?'#ffe0a188':'#ff876e';c.lineWidth=1;c.beginPath();c.arc(m.x,m.y,18,0,Math.PI*2);c.stroke();}c.restore();}
 const after=c.getTransform();for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Canvas state leak '+kind+' '+state);c.restore();
 fs.writeFileSync(path.join(import.meta.dirname,`${prefix}${kind}-${state}-${view}.png`),canvas.toBuffer('image/png'));
 states.push({kind,state,view,width:W,height:H,cityUnits:g.enemies.filter(e=>e.cityUnit).map(e=>({kind:e.cityUnit,x:e.x,y:e.y,hp:e.hp,shot:e.cityShot})),bodies:[...g.stageBoss.stages.encounter?.bodies.values()||[]].map(b=>({kind:b.kind,x:b.x,y:b.y,hp:b.hp,dead:b.dead,coreVulnerable:b.coreVulnerable,scale:b.cityArtScale||b.regionalScale,rigOffsets:b.cityRigOffsets,shellLock:b.shellLock,parts:[...b.parts.values()].map(p=>({id:p.id,hp:p.hp,x:p.x,y:p.y,radius:p.radius,angle:p.angle}))})),mineCount:g.hostileMinefields.reduce((n,f)=>n+f.mines.filter(m=>!m.dead).length,0)});
 g.stageBoss.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,prefix+'render-check.json'),JSON.stringify({renderer:'actual drawStageBoss/drawCityAirLayer/TerrainRenderer and stageboss-host via native Canvas',browser:false,base:'641caba8176f75c0a887c14047868d3ec2408dbd',canvasStateBalanced:true,states,loaded:[...loaded].sort(),missing:[...missing].sort()},null,2));console.log(JSON.stringify({frames:states.length,missing:[...missing].sort()}));
