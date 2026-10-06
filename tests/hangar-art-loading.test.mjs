import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
async function artFixture(Image){
 const source=(await readFile(new URL('hangar-art.js',root),'utf8'))
  .replace(/^import .*;$/gm,'').replace(/export /g,'');
 const context=vm.createContext({Image,Promise,Map,Set,clearAircraftMatte(){},aircraftArt:{}});
 vm.runInContext(source+'\nthis.api={hangarArt,hangarArtSource};',context);
 return context.api;
}
test('affected hangar planes use existing alpha-clean game assets',async()=>{
 const api=await artFixture(class{});
 for(const key of ['halberstadt_duo','fokker_jacobs','gontermann_fokker','nungesser_nieuport24','rickenbacker_spad','luke_nieuport28']){
  const source=api.hangarArtSource(key);assert.ok(source.startsWith('./mech/'),key);
  await access(new URL(source.split('?')[0],root));
 }
 assert.equal(api.hangarArtSource('fokker_red').split('?')[0],'./fokker.webp');
 assert.equal(api.hangarArtSource('fokker_voss').split('?')[0],'./fokker_f1.webp');
});
test('boot preparation and repeated pilot visits share one load and wait for decode',async()=>{
 const requests=[],decodeDone=[];
 const api=await artFixture(class{
  set src(value){this.url=value;requests.push(value);queueMicrotask(()=>this.onload?.())}
  get src(){return this.url}
  decode(){return new Promise(done=>decodeDone.push(done))}
 });
 const first=api.hangarArt('fokker_jacobs');assert.equal(first,api.hangarArt('fokker_jacobs'));
 let ready=false;first.then(()=>ready=true);
 await new Promise(done=>setImmediate(done));
 assert.equal(ready,false);assert.equal(decodeDone.length,1);
 decodeDone[0]();const url=await first;
 assert.equal(url,api.hangarArtSource('fokker_jacobs'));
 const count=requests.length;assert.equal(await api.hangarArt('fokker_jacobs'),url);
 assert.equal(requests.length,count,'switching back never downloads or encodes another image');
});
test('missing root art falls back once, and missing clean art settles without a loop',async()=>{
 const requests=[];
 const api=await artFixture(class{
  set src(value){this.url=value;requests.push(value);queueMicrotask(()=>this.onerror?.())}
  get src(){return this.url}
 });
 assert.equal(await api.hangarArt('goering_fokkerd7'),'');
 assert.equal(requests.length,2);assert.ok(requests[1].startsWith('./mech/'));
 assert.equal(await api.hangarArt('fokker_jacobs'),'');assert.equal(requests.length,3);
});
test('hangar waits for every plane and portrait while sortie retains its aircraft gate',async()=>{
 const app=await readFile(new URL('app.js',root),'utf8');
 assert.match(app,/hangarCardsReady=.*\.map\(hangarArt\)/);
 const hangar=app.match(/const hangarReady=([^;]+);/)[1];
 // The hangar stays hidden until every plane is present: painted sprites on the canvases
 // (aircraftReady) plus the decoded display cards, not just the pilot on screen.
 assert.ok(hangar.includes('hangarArt(shownKey)'));assert.ok(hangar.includes('aircraftReady'));
 assert.match(app,/bootGate\?\.setRank\?\.\(u=>shownUrls\.has\(u\)\|\|HANGAR_UI\.test\(u\)\?0:near\.has\(u\)\?1/);assert.match(app,/function sortie\(\)\{window\.HEADON_GATE\?\.releaseAll\(\)/);
 assert.match(app,/const battleReady=.*aircraftReady/);
 assert.match(app,/function sortie\(\).*battleReady\.then\(go,go\)/);
});
test('both crew busts reach the card floor at desktop and phone sizes without scaling faces',async()=>{
 const source=await readFile(new URL('hangar-portrait186.js',root),'utf8');
 const start=source.indexOf('const CREW_BOTTOM186='),end=source.indexOf('const PORTRAIT_TUNE186=');
 const context=vm.createContext({ResizeObserver:class{observe(){}},portrait186:null});
 vm.runInContext(source.slice(start,end)+'\nthis.anchor=anchorCrew186;',context);
 for(const [id,bottom,top]of [['huffzky',1116,228],['mckeever',1141,88]])for(const [width,height]of [[96,120],[58,58],[66,66],[48,62]]){
  const props={};const image={naturalWidth:1254,naturalHeight:1254,clientWidth:width,clientHeight:height,dataset:{},style:{setProperty(k,v){props[k]=v},removeProperty(k){delete props[k]}},addEventListener(){}};
  context.anchor(image,id);const rendered=Math.min(width,height),offset=parseFloat(props['--crew-floor-offset']);
  assert.ok(Math.abs(height-rendered+offset+rendered*bottom/1254-height)<.001,id+' reaches the floor');
  assert.ok(height-rendered+offset+rendered*top/1254>0,id+' keeps both heads visible');
  context.anchor(image,'baron');assert.equal(image.dataset.crewFloor,undefined);assert.deepEqual(props,{});
 }
});
