// Optional Skia QA, not browser gameplay. Install @napi-rs/canvas outside repo.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,Image,GlobalFonts}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const qaFont=process.env.HEADON_QA_FONT||'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
if(existsSync(qaFont))GlobalFonts.registerFromPath(qaFont,'Maan QA');
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
const view=await import('../maan-view.js?v=maan-r3'),{drawStageBoss}=await import('../stageboss-view.js?v=483-qa'),{fxArtReady,fxReady}=await import('../fx-art.js?v=tame3'),{fixture,step}=await import('../tests/stageboss-fixture94.mjs');
await view.prepareMaanAssets(13);await fxArtReady;
for(const key of ['smokeDust','dustPuff','dirtBurst','bombfx0','shellHeavy'])assert(fxReady(key),key+' must use native FX');
const out=process.env.HEADON_QA_OUT||root+'/qa/maan-r3';mkdirSync(out,{recursive:true});const metrics={};
const make=(team,w,h)=>{const f=fixture({teamFaction:team,stageIndex:13});f.frame.bounds={left:0,right:w,top:0,bottom:h};f.frame.players=[{id:'p',alive:true,x:w/2,y:h*.72,radius:12}];f.addon.startBoss({x:w/2,y:h*.39});return{f,b:[...f.addon.stages.encounter.bodies.values()][0],g:{x:w/2,y:h*.52,t:0,region:13,stageBoss:f.addon,bossBuildings:[],bossCues:[],maanWeather:{cells:[{x:w*.4,y:h*.7,rx:145,ry:84,age:6,life:24,seed:1}]}}};};
const draw=(c,g,w,h)=>{view.paintMaan(c,g,g.x,g.y,w,h);drawStageBoss(c,g,w,h,{layer:'bodies'});drawStageBoss(c,g,w,h,{layer:'hazards'});};
const workshop=createCanvas(1024,1024),wc=workshop.getContext('2d'),wb=make('entente',1024,1024).b;
wb.entryAge=9.2;wb.workshop={x:512,y:512,width:420,height:640,openingY:768,destroyedAt:2.8};
view.drawMaanWorkshop(wc,wb);
const roofPixels=wc.getImageData(0,0,1024,1024).data;
for(let y=192;y<832;y++)for(let x=388;x<636;x++)assert.equal(roofPixels[(y*1024+x)*4+3],0,'settled roof must leave the hull corridor open');
metrics.workshop={settledCorridorClear:true,hullWidth:248};
const tileProbe=createCanvas(1254,1254),probe=tileProbe.getContext('2d');const ground=new Image();await new Promise((resolve,reject)=>{ground.onload=resolve;ground.onerror=reject;ground.src=readFileSync(root+'/terrain-maan-r2.webp')});probe.drawImage(ground,0,0);
const {periodicSandPixels}=await import('../maan-ground.js');const baked=periodicSandPixels(probe.getImageData(0,0,1254,1254).data,1254,1254);for(let y=0;y<baked.height;y++)assert.deepEqual([...baked.data.subarray(y*baked.width*4,y*baked.width*4+4)],[...baked.data.subarray((y*baked.width+baked.width-1)*4,(y*baked.width+baked.width)*4)]);
metrics.tile={width:baked.width,height:baked.height,edgesExact:true};
const repeat=createCanvas(1440,1000),rc=repeat.getContext('2d');view.paintMaan(rc,{},baked.width-.2,baked.height-.2,1440,1000);const groundPixels=rc.getImageData(0,0,1440,1000).data;let brightness=0;for(let i=0;i<groundPixels.length;i+=4){assert.equal(groundPixels[i+3],255);brightness+=groundPixels[i]+groundPixels[i+1]+groundPixels[i+2];}assert(brightness/(1440*1000*3)>50,'decoded terrain must have visible painted pixels');writeFileSync(out+'/ground-seam.webp',await repeat.encode('webp',94));
const seamTimes=[];for(let i=0;i<100;i++){const start=performance.now();view.paintMaan(rc,{},baked.width-70+i*1.4,baked.height-50+i,1440,1000);rc.getImageData(0,0,1440,1000);seamTimes.push(performance.now()-start);}metrics.groundMeanMs=seamTimes.reduce((a,b)=>a+b,0)/seamTimes.length;
for(const [team,name]of [['entente','wusten'],['central','sinai']])for(const [w,h,size]of [[1440,1000,'pc'],[390,844,'mobile']]){
 const {f,b,g}=make(team,w,h),canvas=createCanvas(w,h),c=canvas.getContext('2d');step(f,9.2);g.t=9.2;
 b.parts.get(team==='entente'?'heavy-gun':'lewis').hp*=.4; // Mixed atlas state must stay registered.
 draw(c,g,w,h);writeFileSync(out+'/'+size+'-'+name+'.webp',await canvas.encode('webp',94));
 const pattern=make(team,w,h);step(pattern.f,9.1);pattern.b.timers.set(team==='entente'?'heavy':'broadside',.01);step(pattern.f,1.2);const warnings=[];pattern.f.addon.hazards.pool.visit(h=>warnings.push({visual:h.visual,phase:h.phase,x:h.x,y:h.y,radius:h.radius}));assert(warnings.some(h=>h.phase==='warning'));metrics[name+'-'+size+'-warnings']=warnings;draw(c,pattern.g,w,h);assert.equal(c.globalAlpha,1);writeFileSync(out+'/'+size+'-pattern-'+name+'.webp',await canvas.encode('webp',94));
 const times=[];for(let i=0;i<120;i++){f.addon.tick(1/60,f.frame);g.t+=1/60;const start=performance.now();draw(c,g,w,h);c.getImageData(0,0,w,h);times.push(performance.now()-start);}times.sort((a,b)=>a-b);metrics[name+'-'+size]={meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[114]};
 if(size==='pc'){
  const sheet=createCanvas(1040,1280),d=sheet.getContext('2d');let j=0;
  for(const age of [3.8,4.3,5.4,9.2]){const q=make(team,520,620);step(q.f,age);const cell=createCanvas(520,620);draw(cell.getContext('2d'),q.g,520,620);d.drawImage(cell,j%2*520,Math.floor(j/2)*640);d.fillStyle='#e6d7b7';d.font='16px "Maan QA"';d.fillText(age.toFixed(1)+'s',j%2*520+18,Math.floor(j/2)*640+632);j++;}
  writeFileSync(out+'/arrival-'+name+'.webp',await sheet.encode('webp',94));
  if(process.env.HEADON_QA_FRAMES){const q=make(team,960,720),movie=createCanvas(960,720),m=movie.getContext('2d'),dir=resolve(process.env.HEADON_QA_FRAMES,name);mkdirSync(dir,{recursive:true});for(let i=0;i<80;i++){step(q.f,.1);draw(m,q.g,960,720);writeFileSync(dir+'/'+String(i).padStart(3,'0')+'.png',await movie.encode('png'));}}
 }
}
metrics.missingAssetCount=missing.length;if(missing.length)metrics.missingAssetPaths=missing.map(p=>p.replace(root+'/',''));
writeFileSync(out+'/render-metrics.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
