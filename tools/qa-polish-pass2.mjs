// Native production-renderer comparison. Not browser gameplay or device FPS.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require(process.env.HEADON_QA_CANVAS||'@napi-rs/canvas');
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'qa/polish-pass2';
mkdirSync(out+'/frames',{recursive:true});
globalThis.document={createElement:()=>createCanvas(1,1)};
globalThis.location={search:''};
const missing=[];
globalThis.Image=class extends Image{
 get naturalWidth(){return this.width}get naturalHeight(){return this.height}
 get complete(){return this.width>0}
 addEventListener(type,fn){if(type==='load')this.onload=fn;if(type==='error')this.onerror=fn}
 set src(v){try{super.src=readFileSync(String(v).startsWith('file:')?fileURLToPath(new URL(String(v).split('?')[0])):root+String(v).replace(/^\.\//,'').split('?')[0])}catch(e){missing.push(String(v));queueMicrotask(()=>this.onerror?.(e))}}
};
const {fx,fxArtReady}=await import('../fx-art.js');await fxArtReady;
const base='32f637d6ba5f56f2ae45b4d7bf2858b75ea7417a';
const oldSource=execFileSync('git',['show',base+':explosion-profiles.js'],{cwd:root,encoding:'utf8'});
const before=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
const after=await import('../explosion-profiles.js');
const terrain=new Image();terrain.src=readFileSync(root+'terrain-rural359.webp');await terrain.decode();
const kinds=['aircraft','groundShell','heavyShell','fuelFire','ammoCookoff'];
const rows=[];
for(const kind of kinds){
 let samples=0,maxCalls=0,maxAlphaDelta=0;
 for(let frame=0;frame<=240;frame++){
  const age=frame/240*after.EXPLOSION_LIFE[kind],f={fxProfile:kind,radius:64,maxLife:after.EXPLOSION_LIFE[kind],life:after.EXPLOSION_LIFE[kind]-age};
  const a=[],b=[];before.drawExplosionProfile({},f,0,0,(...args)=>a.push(args.slice(1)));after.drawExplosionProfile({},f,0,0,(...args)=>b.push(args.slice(1)));
  assert.equal(a.length,b.length);maxCalls=Math.max(maxCalls,a.length);
  for(let i=0;i<a.length;i++){assert.deepEqual(a[i].slice(0,6),b[i].slice(0,6));assert(b[i][6]>=0&&b[i][6]<=1);maxAlphaDelta=Math.max(maxAlphaDelta,Math.abs(a[i][6]-b[i][6]));}
  samples++;
 }
 rows.push({kind,samples,maxCalls,maxAlphaDelta});
}
assert.deepEqual(before.EXPLOSION_LIFE,after.EXPLOSION_LIFE);assert.deepEqual(before.EXPLOSION_LIMITS,after.EXPLOSION_LIMITS);
for(let frame=0;frame<84;frame++){
 const age=frame/30,cv=createCanvas(1000,560),c=cv.getContext('2d');
 c.fillStyle='#161a18';c.fillRect(0,0,1000,560);
 for(let side=0;side<2;side++){
  c.drawImage(terrain,0,0,500,500,side*500,40,500,500);
  c.fillStyle='#f0e9da';c.font='18px sans-serif';c.fillText(side?'AFTER':'BEFORE',side*500+20,27);
  for(let i=0;i<kinds.length;i++){
   const kind=kinds[i],T=after.EXPLOSION_LIFE[kind],x=side*500+120+(i%2)*240,y=110+Math.floor(i/2)*160;
   c.fillStyle='#f0e9da';c.font='13px sans-serif';c.fillText(kind,x-65,y-45);
   if(age<T)(side?after:before).drawExplosionProfile(c,{fxProfile:kind,radius:64,maxLife:T,life:T-age},x,y,fx);
  }
 }
 c.fillStyle='#f0e9da';c.font='12px sans-serif';c.fillText('Native game renderer / same assets and age / '+age.toFixed(2)+'s / not browser gameplay',20,551);
 writeFileSync(out+'/frames/'+String(frame).padStart(3,'0')+'.png',cv.toBuffer('image/png'));
 if(frame===16)writeFileSync(out+'/fx-before-after.png',cv.toBuffer('image/png'));
}
writeFileSync(out+'/fx-checks.json',JSON.stringify({base,rows,unchanged:['draw counts','sprites','positions','sizes','effect lifetime','pool limits'],missing},null,2));
assert.equal(missing.length,0);
console.log(JSON.stringify(rows));
