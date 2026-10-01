// Actual game renderer and real co-op host; field backdrop, no browser or input.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const root=process.env.RURAL_ROOT||path.resolve(import.meta.dirname,'../..'),prefix=process.env.RURAL_PREFIX||'',missing=new Set(),loaded=new Set();
const nativeSrc=Object.getOwnPropertyDescriptor(NativeImage.prototype,'src');
class AssetImage extends NativeImage{constructor(){super();this.listeners={};this.onload=()=>{for(const fn of this.listeners.load||[])fn()};this.onerror=()=>{for(const fn of this.listeners.error||[])fn()};}addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}set src(url){const file=String(url).startsWith('file:')?fileURLToPath(new URL(String(url))):path.resolve(root,String(url).replace(/\?.*$/,'').replace(/^\.\//,''));try{nativeSrc.set.call(this,fs.readFileSync(file));loaded.add(path.relative(root,file));}catch{missing.add(path.relative(root,file));queueMicrotask(()=>this.onerror?.());}}get src(){return nativeSrc.get.call(this);}}
globalThis.Image=AssetImage;globalThis.localStorage={getItem:()=>null};globalThis.location={search:''};globalThis.document={createElement:name=>name==='canvas'?createCanvas(1,1):{},body:{classList:{toggle(){}}}};globalThis.window={addEventListener(){},matchMedia:()=>({matches:false})};
const mod=name=>import(pathToFileURL(path.join(root,name)).href+'?v=481');
const {drawStageBoss,prepareStageBossAssets}=await mod('stageboss-view.js'),{CoopGame}=await mod('coop-engine.js'),{enableStageBoss,beginStageBossFrame,endStageBossFrame}=await mod('stageboss-host.js');
await prepareStageBossAssets(0);const states=[];
function tick(g,seconds){for(let i=0;i<Math.ceil(seconds/.02);i++){g.t+=.02;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);}}
for(const [view,W,H]of [['pc',1280,800],['mobile',390,844]])for(const kind of ['paris-gun','lincomparable'])for(const state of ['tail','rear-loss','observer-loss','aim','fired','shock','reload','rail-broken','derailed']){
 const pilots=kind==='paris-gun'?[{pilot:'fonck'},{pilot:'fonck'}]:[{pilot:'baron'},{pilot:'voss'}],g=new CoopGame(pilots,{rng:()=>.37});g.viewWidth=W;g.viewHeight=H;g.camera={x:0,y:0,zoom:1};g.region=0;
 enableStageBoss(g,{teamFaction:g.teamFaction,heavyHp:1.65});g.stageBoss.stages.stageIndex=0;
 const enc=g.stageBoss.startBoss({x:0,y:-460}),b=[...enc.bodies.values()][0];if(b.kind!==kind)throw new Error('Wrong faction boss '+b.kind);
 function players(y){g.camera.x=0;g.camera.y=y;for(const [i,p]of g.players.entries()){p.x=(i?1:-1)*70;p.y=y;p.invuln=9999;p.previousX=p.x;p.previousY=p.y;}}
 players(130);
 if(state==='rear-loss'){b.hit({partId:'car-rear',damage:999999});tick(g,8);}
 if(state==='observer-loss'){for(const id of ['car-rear','car-middle'])b.hit({partId:id,damage:999999});b.rail129.velocity=0;b.rail129.enter('aim');tick(g,.1);}
 if(['aim','fired','shock','reload','rail-broken','derailed'].includes(state)){
  players(b.y+160);b.rail129.velocity=0;b.rail129.enter('aim');b.rail129.target=null;tick(g,.02);
  for(const id of b.railCarOrder)b.hit({partId:id,damage:999999});
  if(state==='rail-broken')b.hit({partId:'rail',damage:999999});
  if(state==='derailed'){b.hit({partId:'rail',damage:999999});b.hit({damage:999999});tick(g,1.05);players(b.y+150);}
  else{b.rail129.velocity=0;b.rail129.enter('aim');b.rail129.target=null;tick(g,.02);
   const aim=b.rail129.c.aimSeconds;tick(g,state==='aim'?.15:state==='fired'?aim+.03:state==='shock'?aim+.95:state==='reload'?aim+1.45:.15);
  }
 }
 const canvas=createCanvas(W,H),c=canvas.getContext('2d');c.fillStyle='#747455';c.fillRect(0,0,W,H);c.strokeStyle='#626347';c.lineWidth=1;for(let y=-20;y<H;y+=55){c.beginPath();c.moveTo(0,y);c.lineTo(W,y+45);c.stroke();}
 c.save();c.translate(.25,.125);const before=c.getTransform();drawStageBoss(c,g,W,H,{});const after=c.getTransform();for(const key of ['a','b','c','d','e','f'])if(before[key]!==after[key])throw new Error('Canvas state leak '+kind+' '+state);c.restore();
 fs.writeFileSync(path.join(import.meta.dirname,`${prefix}${kind}-${state}-${view}.png`),canvas.toBuffer('image/png'));
 states.push({kind,state,view,hp:b.hp,maxHp:b.maxHp,phase:b.phase,railPhase:b.rail129.phase,railPose:b.rail129.pose,recovery:b.recovery,aimPlan:b.aimPlan,coreVulnerable:b.coreVulnerable,parts:[...b.parts.values()].map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,angle:p.angle,detachedPose:p.detachedPose}))});g.stageBoss.dispose();
}
fs.writeFileSync(path.join(import.meta.dirname,prefix+'render-check.json'),JSON.stringify({renderer:'Actual drawStageBoss + stageboss-host / CoopGame on native Canvas; field backdrop',browser:false,base:'70e91c8753d2defc4ee92e8e548bfbc787ed3705',canvasStateBalanced:true,states,loaded:[...loaded].sort(),missing:[...missing].sort()},null,2));console.log(JSON.stringify({frames:states.length,missing:[...missing].sort()}));
