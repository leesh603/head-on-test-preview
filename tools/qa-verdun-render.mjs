// Offline native renderer QA. This is not a browser or a natural gameplay clear.
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas,Image:NativeImage}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
const root=resolve(process.env.QA_ROOT||'.'),out=resolve(process.env.QA_OUTPUT||'/tmp/verdun-render');mkdirSync(out,{recursive:true});
globalThis.document={createElement(){return createCanvas(1,1)}};
globalThis.location={search:'',href:'file://'+root+'/index.html'};
globalThis.Image=class extends NativeImage{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 set src(value){if(!value)return;let path=value.split('?')[0];if(path.startsWith('file:'))path=fileURLToPath(path);else path=resolve(root,path);super.src=path;}
};
const {FortDouaumont,FortSouville}=await import('file://'+root+'/verdun-fortresses.js?v=sfx2');
const {prepareVerdunAssets,paintVerdun,drawVerdunFort,drawVerdunHazard}=await import('file://'+root+'/verdun-art.js?v=sfx2');
const {fxArtReady}=await import('file://'+root+'/fx-art.js?v=sfx2');
console.log('loading fortress atlases');await prepareVerdunAssets();console.log('loading FX');await fxArtReady;console.log('rendering');
const results=[];
for(const Ctor of [FortDouaumont,FortSouville])for(const mobile of [false,true]){
 const W=mobile?390:1280,H=mobile?844:800,events=[],b=new Ctor({id:'fort',x:0,y:-500,tuning:{maxHp:4000,damage:20,bulletSpeed:260,regionalViewWidth:W,verdunScale:mobile?.8:1},emit:e=>events.push(e)});
 const frame={players:[{id:'p1',alive:true,x:0,y:-390,vx:0,vy:0}],bounds:{left:-W/2,right:W/2,top:-390-H/2,bottom:-390+H/2}};
 const tick=seconds=>{for(let t=0;t<seconds;t+=.02)b.update(.02,frame)};
 const shot=name=>{const cv=createCanvas(W,H),c=cv.getContext('2d');paintVerdun(c,{},0,-390,W,H);c.save();c.translate(W/2,H/2+390);drawVerdunFort(c,b);c.restore();writeFileSync(out+'/'+b.kind+'-'+(mobile?'mobile':'pc')+'-'+name+'.png',cv.toBuffer('image/png'));};
 tick(.6);shot('intact');
 if(Ctor===FortDouaumont){tick(11);shot('guns');b.hit({partId:'heavy-left',damage:1e9});tick(.12);shot('damage-transition');tick(.5);shot('heavy-wreck');b.hit({partId:'aa-left',damage:1e9});tick(16);shot('repair');b.hit({partId:'ammo-left',damage:1e9});tick(1);shot('ammo');}
 else{tick(1);shot('opening');tick(1.4);shot('open');b.hit({partId:'pit-left',damage:1e9});tick(.5);shot('pit-wreck');b.hit({partId:'observer',damage:1e9});b.hit({partId:'command',damage:1e9});b.hit({partId:'ammo',damage:1e9});tick(1);shot('core');}
 const cv=createCanvas(W,H),c=cv.getContext('2d');const times=[];for(let n=0;n<20;n++){const begin=performance.now();c.clearRect(0,0,W,H);tick(.02);paintVerdun(c,{},0,-390,W,H);c.save();c.translate(W/2,H/2+390);drawVerdunFort(c,b);c.restore();c.getImageData(0,0,1,1);times.push(performance.now()-begin);}times.sort((a,b)=>a-b);results.push({boss:b.kind,mobile,p95:times[Math.floor(times.length*.95)],events:events.length});
}
writeFileSync(out+'/results.json',JSON.stringify({results,limitations:['Native canvas rendering and boss update only; no browser input or full game verification.']},null,2));console.log(JSON.stringify(results));
