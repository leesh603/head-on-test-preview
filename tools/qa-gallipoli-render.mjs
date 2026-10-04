// Optional Skia QA, not browser gameplay. Install @napi-rs/canvas outside repo.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:'',href:'file://'+root+'/index.html',hostname:'localhost'};
const missing=[];
globalThis.Image=class extends Image{
 constructor(...args){super(...args);this._decoded=false;const self=this;
  Object.defineProperty(this,'onload',{configurable:true,get(){return (...args)=>{self._decoded=true;self._loadHandler?.(...args)}},set(fn){self._loadHandler=fn}});
  Object.defineProperty(this,'onerror',{configurable:true,get(){return (...args)=>self._errorHandler?.(...args)},set(fn){self._errorHandler=fn}});
 }
 get complete(){return this._decoded}
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}addEventListener(type,fn){this['on'+type]=fn}
 set src(value){if(!value)return;const path=resolve(root,String(value).replace(/^file:\/\//,'').split('?')[0]);
  if(!existsSync(path)){missing.push(path);queueMicrotask(()=>this.onerror?.(new Error(path)));return;}
  super.src=readFileSync(path);
 }get src(){return super.src}
};
const view=await import('../gallipoli-view.js?v=gallipoli540'),{drawStageBoss}=await import('../stageboss-view.js'),{fxArtReady}=await import('../fx-art.js?v=perf538'),{fixture,step}=await import('../tests/stageboss-fixture94.mjs'),{createGallipoliRoute,gallipoliPoint,GALLIPOLI_ROUTE}=await import('../gallipoli-route.js');
await view.prepareGallipoliAssets(14);await fxArtReady;
const out=root+'/qa/gallipoli';mkdirSync(out,{recursive:true});const metrics={};
for(const [team,name]of [['entente','central'],['central','entente']])for(const [w,h,size]of [[1440,1000,'pc'],[390,844,'mobile']]){
 const f=fixture({teamFaction:team,stageIndex:14}),r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),anchor=gallipoliPoint(r,GALLIPOLI_ROUTE.fort),p=gallipoliPoint(r,GALLIPOLI_ROUTE.fort-160,-940);f.frame.players=[{id:'p',alive:true,...p,radius:12}];f.frame.bounds={left:p.x-w/2,right:p.x+w/2,top:p.y-h/2,bottom:p.y+h/2};f.addon.startBoss(anchor);const b=[...f.addon.stages.encounter.bodies.values()][0],g={...p,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]},cv=createCanvas(w,h),c=cv.getContext('2d');step(f,5.2);b.timers.set('coastal',.01);step(f,.2);
 const draw=()=>{view.paintGallipoli(c,g,g.x,g.y,w,h);drawStageBoss(c,g,w,h,{layer:'bodies'});drawStageBoss(c,g,w,h,{layer:'hazards'});};draw();writeFileSync(out+'/'+size+'-'+name+'.webp',await cv.encode('webp',94));
 for(const id of ['left','west-howitzer','aa-west'])f.addon.hit({bodyId:b.id,partId:id,damage:1e9,faction:team});step(f,3.2);draw();writeFileSync(out+'/'+size+'-'+name+'-damaged.webp',await cv.encode('webp',94));
 const times=[];for(let i=0;i<100;i++){step(f,.02);const t=performance.now();draw();c.getImageData(0,0,w,h);times.push(performance.now()-t);}metrics[size+'-'+name]={meanMs:times.reduce((a,b)=>a+b,0)/times.length,hazards:f.addon.hazards.pool.count,dropped:f.addon.hazards.pool.dropped};assert.equal(f.addon.hazards.pool.dropped,0);
 if(size==='pc'&&team==='entente'){const art=createCanvas(760,520),ac=art.getContext('2d');ac.translate(380,305);ac.scale(.22,.22);b.x=b.y=0;b.faction=null;b.phase='coastal-defense';b.captured.clear();b.coreVulnerable=false;b.hp=b.maxHp;for(const part of b.parts.values())part.hp=part.maxHp;view.drawGallipoliBoss(ac,b);writeFileSync(root+'/gallipoli-fortress-cut-in.webp',await art.encode('webp',95));}
}
{
 const r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),p=gallipoliPoint(r,GALLIPOLI_ROUTE.fort+200),f=fixture({teamFaction:'entente',stageIndex:14});f.addon.startBoss(gallipoliPoint(r,GALLIPOLI_ROUTE.fort));step(f,5.2);const g={...p,region:14,stageBoss:f.addon,gallipoliRoute:r,bossBuildings:[],bossCues:[]};const cv=createCanvas(1920,1400),c=cv.getContext('2d');c.scale(.42,.42);view.paintGallipoli(c,g,p.x,p.y,1920/.42,1400/.42);drawStageBoss(c,g,1920/.42,1400/.42,{layer:'bodies'});writeFileSync(out+'/siege-overview.webp',await cv.encode('webp',94));
}
for(const s of [3500,6400,7200,8500,12400]){const r=createGallipoliRoute({x:0,y:0,a:-Math.PI/2}),p=gallipoliPoint(r,s),cv=createCanvas(1440,1000),c=cv.getContext('2d');view.paintGallipoli(c,{...p,gallipoliRoute:r},p.x,p.y,1440,1000);writeFileSync(out+'/route-'+s+'.webp',await cv.encode('webp',94));}
assert.equal(missing.length,0);writeFileSync(out+'/render-metrics.json',JSON.stringify({missing,metrics},null,2));console.log(JSON.stringify(metrics));
