import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Isolate terrain painters so the test doesn't pull the browser game's boot
// graph into Node. The exact checked-in renderer source is compiled unchanged
// apart from ESM import/export declarations; production imports stay untouched.
const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8')
 .split('\n').filter(line=>!/^import\b/.test(line.trim())).join('\n')
 .replace(/\bexport (function|const)\b/g,'$1');
const renderContext=()=>{
 const counts={images:0,positions:[],fx:[]};
 const ctx=new Proxy({globalAlpha:1,
  save(){},restore(){},
  translate(x,y){counts.positions.push([x,y])},
  drawImage(){counts.images++},
  createRadialGradient(){return {addColorStop(){}}}
 },{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});
 return {ctx,counts};
};
const Img=class{constructor(){this.naturalWidth=400;this.naturalHeight=300}
 set src(v){this.path=v;this.onload?.()}decode(){return Promise.resolve()}};

test('ground vehicles animate only in hand-authored land regions, not sea',()=>{
 const {drawMovingDressing,drawRepeatedDressing}=new Function('fx','Image',source('background-dressing.js')+'\nreturn {drawMovingDressing,drawRepeatedDressing};')(()=>true,Img);
 const {ctx,counts}=renderContext();
 drawMovingDressing(ctx,'trenches',0,0,1920,1080,768,2,1);
 const first=counts.positions.map(p=>p.join(':')).join(',');
 assert.ok(counts.images>0,'tank sprites are visible');
 counts.positions=[];counts.images=0;
 drawMovingDressing(ctx,'trenches',0,0,1920,1080,768,4,1);
 assert.notEqual(counts.positions.map(p=>p.join(':')).join(','),first,'vehicles actually move');
 counts.images=0;
 drawMovingDressing(ctx,'sea',0,0,1920,1080,768,2,1);
 assert.equal(counts.images,0,'sea never contains a moving tank or ambulance');
});

test('infantry render only on configured land battlefields, smoke uses existing FX',()=>{
 const fxKeys=[],document={createElement(){return {width:0,height:0,getContext(){return renderContext().ctx}}}};
 const {drawTrenchSkirmishes,drawWarAmbience}=new Function('fx','document',source('war-ambience.js')+'\nreturn {drawTrenchSkirmishes,drawWarAmbience};')((c,key)=>{fxKeys.push(key);return true},document);
 const {ctx,counts}=renderContext();
 drawTrenchSkirmishes(ctx,1,0,0,1920,1080,3,1,768);
 assert.equal(counts.images,0,'no infantry on the sea');
 drawTrenchSkirmishes(ctx,2,0,0,1920,1080,3,1,768);
 assert.ok(counts.images>0,'trench infantry fight in world space');
 drawWarAmbience(ctx,3,1180,940,1920,1080,3,1,768);
 assert.ok(fxKeys.includes('smokeDark'),'terrain plumes use the existing smoke atlas');
});

test('reduced-detail mode remains bounded on portrait mobile viewports',()=>{
 const document={createElement(){return {width:0,height:0,getContext(){return renderContext().ctx}}}};
 let fxCalls=0;
 const {drawWarAmbience}=new Function('fx','document',source('war-ambience.js')+'\nreturn {drawWarAmbience};')(()=>{fxCalls++;return true},document);
 const {ctx,counts}=renderContext();
 for(let frame=0;frame<120;frame++){
  drawWarAmbience(ctx,3,800+frame*5,900+frame*7,412,915,frame/60,.45,768);
 }
 assert.ok(counts.images<120*28,'mobile skirmish art keeps a small per-frame bound');
 assert.ok(fxCalls<120*45,'mobile terrain FX avoids unbounded emitters');
});
