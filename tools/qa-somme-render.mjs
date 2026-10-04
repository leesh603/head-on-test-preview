// Optional render QA: npm install @napi-rs/canvas outside the game repository.
// Set HEADON_QA_CANVAS to that package directory if not installed locally.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.Image=class extends Image{get naturalWidth(){return this.width}get naturalHeight(){return this.height}addEventListener(type,fn){this['on'+type]=fn}set src(value){if(value)super.src=readFileSync(resolve(root,String(value).replace(/^file:\/\//,'').split('?')[0]));}get src(){return super.src}};
const art=await import('../somme-boss-render.js?v=531'),{createBossEncounter}=await import('../headon-stageboss-patterns.js?v=531'),{renderStageBossLayer}=await import('../headon-stageboss-render.js?v=531');
await art.prepareSommeAssets();
const ground=new Image();await new Promise((resolve,reject)=>{ground.onload=resolve;ground.onerror=reject;ground.src=readFileSync(root+'/terrain-somme359r2.webp')});
const out=root+'/qa/somme-r2';mkdirSync(out,{recursive:true});const metrics={};
for(const [id,label]of [['mark4-wedge','mark1'],['morser-battery','schwaben']])for(const [w,h,size]of [[1440,1000,'pc'],[390,844,'mobile']]){
 const e=createBossEncounter({id:'qa',bossId:id,x:w/2,y:h*.44,tuning:{maxHp:3000,damage:20,bulletSpeed:240,regionalViewWidth:w,regionalViewHeight:h},emit(){},rng:()=>.5});
 const c=createCanvas(w,h),d=c.getContext('2d');
 const players=[{id:'p',alive:true,x:w*.6,y:h*.7}],bounds={left:0,right:w,top:0,bottom:h};
 const draw=()=>{d.drawImage(ground,0,0,w,h);renderStageBossLayer({stages:{encounter:e},hazards:{pool:{visit(){}}}},{drawBody:b=>art.drawSommeBoss(d,b),drawPart(){},drawHazard(){}});};
 // Exercise the central AA sweeping across the observer for both screenshots.
 if(id==='morser-battery')e.bodies.values().next().value.parts.get('twin-aa').angle=-Math.PI/2;
 draw();writeFileSync(out+'/'+size+'-'+label+'.webp',await c.encode('webp',92));
 const times=[];
 for(let i=0;i<120;i++){e.update(1/60,{players,bounds});const start=performance.now();draw();d.getImageData(0,0,w,h);times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);metrics[label+'-'+size]={meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[114]};
 if(id==='mark4-wedge'&&size==='pc'){
  const frames=[];for(let i=0;i<60;i++){for(let j=0;j<4;j++)e.update(.05,{players,bounds});draw();frames.push(Buffer.from(await c.encode('png')));}
  // Optional frames are scratch output, not shipped game sprites.
  const framesOut=process.env.HEADON_QA_FRAMES;if(framesOut){mkdirSync(framesOut,{recursive:true});frames.forEach((f,i)=>writeFileSync(resolve(framesOut,String(i).padStart(3,'0')+'.png'),f));}
 }
}
writeFileSync(out+'/render-metrics.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));
