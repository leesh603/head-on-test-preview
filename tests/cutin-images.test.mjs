import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
async function fixture(){
 const loads=[],decodes=[];
 class Image{
  constructor(){this.style={};this.srcValue=''}
  set src(src){this.srcValue=src;loads.push(this)}get src(){return this.srcValue}
  decode(){return new Promise((resolve,reject)=>decodes.push({image:this,resolve,reject}))}
  cloneNode(){return new Image()}
  replaceWith(image){current=image}
 }
 let current=new Image();current.srcValue='previous-ace.webp';
 const context=vm.createContext({Image,Map,Promise});
 const source=(await readFile(new URL('../cutin-images.js',import.meta.url),'utf8')).replace(/export /g,'');
 vm.runInContext(source+'\nthis.api={prepareCutinImage,createCutinPresenter};',context);
 return {...context.api,loads,decodes,current:()=>current};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('preloading waits for decode and selected cut-ins share/promote the preload',async()=>{
 const f=await fixture();let ready=false;
 const promise=f.prepareCutinImage('boss.webp');promise.then(()=>ready=true);
 assert.equal(f.loads[0].fetchPriority,'low');
 assert.equal(f.prepareCutinImage('boss.webp','high'),promise);assert.equal(f.loads.length,1);assert.equal(f.loads[0].fetchPriority,'high');
 f.loads[0].onload();await tick();assert.equal(ready,false);
 f.decodes[0].resolve();assert.equal(await promise,f.loads[0]);
});
test('ace-to-boss swap hides old artwork immediately and only commits the decoded boss',async()=>{
 const f=await fixture(),show=f.createCutinPresenter(f.current);
 const ace=show('ace.webp','Ace');assert.equal(f.current().style.visibility,'hidden');
 const boss=show('boss.webp','Boss');
 f.loads[1].onload();await tick();f.decodes[0].resolve();await tick();
 assert.equal(f.current().src,'previous-ace.webp');assert.equal(f.current().style.visibility,'hidden');
 f.decodes[1].resolve();assert.equal(await boss,true);assert.equal(f.current().src,'boss.webp');assert.equal(f.current().alt,'Boss');assert.equal(f.current().style.visibility,'');
 f.loads[0].onload();await tick();f.decodes[2].resolve();assert.equal(await ace,false);assert.equal(f.current().src,'boss.webp');
});
test('a cut-in finishing after leaving the sortie cannot return to the screen',async()=>{
 const f=await fixture(),show=f.createCutinPresenter(f.current);let playing=true;
 const promise=show('boss.webp','Boss',()=>playing);playing=false;
 f.loads[0].onload();await tick();f.decodes[0].resolve();assert.equal(await promise,false);
 assert.equal(f.current().src,'previous-ace.webp');assert.equal(f.current().style.visibility,'hidden');
});
test('failed artwork never reveals the previous pilot',async()=>{
 const f=await fixture(),show=f.createCutinPresenter(f.current),promise=show('broken.webp','Boss');
 f.loads[0].onerror();assert.equal(await promise,true);assert.equal(f.current().style.visibility,'hidden');
});
