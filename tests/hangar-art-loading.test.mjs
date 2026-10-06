import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
async function artFixture(Image){
 const source=(await readFile(new URL('hangar-art.js',root),'utf8'))
  .replace(/^import .*;$/gm,'').replace(/export /g,'');
 const context=vm.createContext({Image,Promise,Map,Set,clearAircraftMatte(){},aircraftArt:{}});
 vm.runInContext(source+'\nthis.api={hangarArt,hangarArtSource,hangarArtKey};',context);
 return context.api;
}
test('affected hangar planes use existing alpha-clean game assets',async()=>{
 const api=await artFixture(class{});
 for(const key of ['halberstadt_duo','fokker_jacobs','gontermann_fokker','nungesser_nieuport24','rickenbacker_spad','luke_nieuport28','goering_fokkerd7','loewenhardt_fokkerd7','mccudden_se5a']){
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
 assert.equal(await api.hangarArt('missing_hangar_plane'),'');
 assert.equal(requests.length,2);assert.ok(requests[1].startsWith('./mech/'));
 assert.equal(await api.hangarArt('fokker_jacobs'),'');assert.equal(requests.length,3);
});
test('first hangar card is independent of other planes and the combat module graph',async()=>{
 const app=await readFile(new URL('app.js',root),'utf8');
 const hangar=app.match(/const hangarReady=([^;]+);/)[1];
 assert.ok(hangar.includes('hangarArt(aircraftKey(plane,false,pilot))'));
 for(const gate of ['hangarCardsReady','aircraftReady','portraitsReady','iconsReady'])assert.ok(!hangar.includes(gate),gate);
 assert.match(app,/hangarCardsReady=hangarReady\.then/);
 assert.match(app,/const battleReady=.*aircraftReady,portraitsReady,iconsReady/);
 assert.match(app,/function sortie\(\).*battleReady\.then\(go,go\)/);
 const sources=await Promise.all(['main-ui-v2.js','astra-interface180.js','hangar-art.js'].map(file=>readFile(new URL(file,root),'utf8')));
 for(const source of sources)assert.doesNotMatch(source,/^import .*from ['"]\.\/aircraft\.js/gm);
 const html=await readFile(new URL('index.html',root),'utf8');
 assert.match(html,/<script type="module" async src="\.\/main-ui-v2\.js/);
 assert.match(html,/<link rel="preload" as="image" href="\.\/fokker\.webp/);
});
test('both crew busts occupy 90% of card height and reach the floor without clipping heads',async()=>{
 const source=await readFile(new URL('hangar-portrait186.js',root),'utf8');
 const start=source.indexOf('const CREW_BOUNDS186='),end=source.indexOf('function crewPilot186');
 const context=vm.createContext({});vm.runInContext(source.slice(start,end)+'\nthis.fit=crewFit186;',context);
 for(const [id,bottom,top]of [['huffzky',1116,228],['mckeever',1141,88]])for(const [width,height]of [[100,125],[58,58],[64,64],[50,50]]){
  const fit=context.fit(height,id),paintedBottom=height+fit.offset-fit.height+fit.height*bottom/1254;
  const paintedTop=height+fit.offset-fit.height+fit.height*top/1254;
  assert.ok(Math.abs(paintedBottom-height)<.001,id+' reaches the floor');
  assert.ok(Math.abs(paintedTop-height*.1)<.001,id+' leaves visible head clearance');
  assert.ok(fit.height>height,id+' enlarges transparent artwork');
  const [headLeft,headRight]=id==='huffzky'?[300,1000]:[220,1090];
  assert.ok((width-fit.width)/2+fit.width*headLeft/1254>=0,id+' keeps the left head');
  assert.ok((width-fit.width)/2+fit.width*headRight/1254<=width,id+' keeps the right head');
 }
});
test('selected art promotes a background request instead of starting a second download',async()=>{
 const images=[];
 const api=await artFixture(class{constructor(){images.push(this)}set src(value){this.url=value}get src(){return this.url}});
 const background=api.hangarArt('camel','low');assert.equal(images[0].fetchPriority,'low');
 assert.equal(api.hangarArt('camel'),background);assert.equal(images.length,1);assert.equal(images[0].fetchPriority,'high');
 assert.equal(api.hangarArtKey('fokker','baron'),'fokker_red');
 assert.equal(api.hangarArtKey('fokker','voss'),'fokker_voss');
 assert.equal(api.hangarArtKey('fokker','jacobs'),'fokker_jacobs');
 assert.equal(api.hangarArtKey('camel','baron'),'camel');
});
