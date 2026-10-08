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
const {enableStageBoss,beginStageBossFrame,endStageBossFrame}=await import('../stageboss-host.js?v=r5&rail=38');
const {drawAircraftCrash,enemyCrashScale}=await import('../aircraft-crash.js?v=r5');
const {fx}=await import('../fx-art.js?v=r5');
const {drawEnemyProjectile}=await import('../projectiles.js?v=r5');
await prepareStageBossAssets(9);await fxArtReady;await aircraftReady;await preloadTerrainProfile('arras');
const terrain=new TerrainRenderer({canvasFactory:createCanvas});mkdirSync(resolve(root,'qa/arras-formations'),{recursive:true});
for(const faction of (process.argv.includes('--jasta')?['entente']:['entente','central']))for(const [w,h]of [[390,844],[1280,800]]){
 const plane=faction==='entente'?'camel':'fokker',g=new Game(plane,faction==='entente'?'collishaw':'baron',()=>.5);
 g.viewWidth=w;g.viewHeight=h;g.region=9;g.spawn=g.nextBossAt=g.eventTimer=g.flakTimer=g.regionThreat=g.need=g.fire=g.patrolTimer=Infinity;g.invuln=Infinity;
 enableStageBoss(g,{teamFaction:faction});g.stageBoss.stages.stageIndex=9;g.spawnPatrol();g.stageBoss.startBoss({x:g.x,y:g.y-180});const b=[...g.stageBoss.stages.encounter.bodies.values()][0],saved=new Set();
 const save=name=>{const canvas=createCanvas(w,h),c=canvas.getContext('2d');terrain.draw(c,{key:'arras',camera:{x:g.x-w/2,y:g.y-h/2},width:w,height:h});drawStageBoss(c,g,w,h,{drawZeppelin(){},drawFieldArt(){}});
  for(const e of g.enemies)if(e.bossMinion&&e.hp>0)planeSprite(c,e.x-g.x+w/2,e.y-g.y+h/2,e.a,e.escortPlane,1,true,false,e.hitFlash,e.hp<e.maxHp*.5);
  for(const p of g.patrols){const x=p.x-g.x+w/2,y=p.y-g.y+h/2;if(p.crashing)drawAircraftCrash(c,p,x,y,g.t,fx);planeSprite(c,x,y,p.a,p.plane,.9*(p.crashing?enemyCrashScale(p):1),false,false,p.hitFlash,p.hp<p.maxHp*.5);}
  for(const round of g.bullets)if(round.enemy)drawEnemyProjectile(c,round,round.x-g.x+w/2,round.y-g.y+h/2);
  planeSprite(c,w/2,h/2,g.a,aircraftKey(plane,false,g.pilot),1,false,false);c.fillStyle='#10191edd';c.fillRect(8,h-38,w-16,30);c.fillStyle='#ecd8ad';c.font='12px sans-serif';c.fillText(`${name} · automated Game render`,16,h-18);
  const path=resolve(root,`qa/arras-formations/${b.kind}-${name}-${w}.webp`);writeFileSync(path,canvas.toBuffer('image/webp',82));console.log(path);saved.add(name);};
 for(let i=0;i<2500;i++){g.fire=Infinity;g.update(.02,{});
  if(!saved.has('approach')&&b.entryRoster&&b.entryAge>1.8)save('approach');
  if(!saved.has('crash')&&g.patrols.some(p=>p.crashing))save('crash');
  if(b.entryComplete&&!saved.has('formation')){g.patrolTimer=Infinity;save('formation');b.hit({damage:b.maxHp*.7});}
  if(b.finalAge>5.1&&!saved.has('final'))save('final');
  if(saved.has('final')&&b.finalAge===undefined)break;
 }g.stageBoss.dispose();
}
