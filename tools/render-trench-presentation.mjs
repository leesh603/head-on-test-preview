// Optional visual QA: @napi-rs/canvas. Runs real Game motion and the production terrain/boss renderer.
// Saved frames are automated renderer evidence, not browser gameplay captures.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const require=createRequire(import.meta.url),{createCanvas,Image,ImageData}=require('@napi-rs/canvas'),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const realTimer=setTimeout;globalThis.setTimeout=(f,ms,...args)=>{const timer=realTimer(f,ms,...args);if(ms>=10000)timer.unref();return timer;};
class LocalImage extends Image{
 constructor(){super();this.listeners={};}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
 decode(){return Promise.resolve();}
 set src(v){this.source=v;const before=this.onload;this.onload=()=>{before?.();for(const f of this.listeners.load||[])f();};this.onerror=e=>{for(const f of this.listeners.error||[])f(e);};
  try{const path=String(v).startsWith('file:')?fileURLToPath(v.split('?')[0]):resolve(root,String(v).split('?')[0]);super.src=readFileSync(path);}catch(e){this.onerror(e);}
 }
 get src(){return this.source;}
}
globalThis.Image=LocalImage;globalThis.ImageData=ImageData;globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.location={search:'',href:'file://'+root+'/index.html'};
const {prepareStageBossAssets,drawStageBoss}=await import('../stageboss-view.js?v=r5');
const {fxArtReady}=await import('../fx-art.js?v=r5');
const {planeSprite,aircraftKey,aircraftReady}=await import('../aircraft.js?v=r5');
const {TerrainRenderer,preloadTerrainProfile}=await import('../alps-terrain117.js?v=r5');
const {Game}=await import('../engine.js?v=r5');
const {enableStageBoss,beginStageBossFrame,endStageBossFrame}=await import('../stageboss-host.js?v=r5&rail=40');
await prepareStageBossAssets(3);await fxArtReady;await aircraftReady;await preloadTerrainProfile('burning');
const terrain=new TerrainRenderer({canvasFactory:createCanvas});mkdirSync(resolve(root,'qa/trench-presentation'),{recursive:true});
for(const faction of ['entente','central'])for(const [w,h]of [[390,844],[1280,800]]){
 const pilot=faction==='entente'?'fonck':'baron',plane=faction==='entente'?'camel':'fokker';
 const g=new Game(plane,pilot,()=>.5);g.viewWidth=w;g.viewHeight=h;g.region=3;g.spawn=Infinity;g.nextBossAt=Infinity;g.need=Infinity;g.fire=Infinity;g.invuln=Infinity;enableStageBoss(g,{teamFaction:faction});g.stageBoss.stages.stageIndex=3;g.t=100;beginStageBossFrame(g,.02);endStageBossFrame(g,.02);const b=[...g.stageBoss.stages.encounter.bodies.values()][0],saved=new Set();
 const save=name=>{const canvas=createCanvas(w,h),c=canvas.getContext('2d');terrain.draw(c,{key:'burning',camera:{x:g.x-w/2,y:g.y-h/2},width:w,height:h});drawStageBoss(c,{...g,bossBuildings:[],bossCues:[]},w,h,{drawZeppelin(){},drawFieldArt(){}});planeSprite(c,w/2,h/2,g.a,aircraftKey(plane,false,pilot),1,false,false);c.fillStyle='#10191edd';c.fillRect(8,h-38,w-16,30);c.fillStyle='#ecd8ad';c.font='12px sans-serif';c.fillText(`${name} · automated Game render`,16,h-18);const path=resolve(root,`qa/trench-presentation/${b.kind}-${name}-${w}.webp`);writeFileSync(path,canvas.toBuffer('image/webp',82));console.log(path);saved.add(name);};
 for(let i=0;i<850;i++){
  g.update(.02,{});
  if(faction==='central'){
   if(b.trenchEntry.state==='pressure'&&b.trenchEntry.age>.3&&!saved.has('pressure'))save('pressure');
   if(b.nozzleRevealed&&b.trenchEntry.revealAge<.15&&!saved.has('soil-reveal'))save('soil-reveal');
   if(b.flameMode==='entry'&&b.flameAge>b.flameWarn+.25&&!saved.has('first-flame'))save('first-flame');
   if(b.trenchEntry.firstDone){save('recovery');break;}
  }else if([...b.parts.values()].every(p=>p.discovered)){save('connected');b.hit({partId:'gun-left',damage:9999});save('left-destroyed');break;}
 }
 g.stageBoss.dispose();
}
