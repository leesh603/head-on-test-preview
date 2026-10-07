import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {BOSS_CATALOG} from '../headon-stageboss-patterns.js?v=ui2';
import {BOSS_CUTIN_ART,BOSS_CUTIN_FALLBACKS,REDRAWN_BOSS_CUTINS,prepareBossCutins,bossCutinSource} from '../boss-cutin-art.js?v=ui2';

test('Every playable area boss has a registered existing cut-in',()=>{
 assert.deepEqual(Object.keys(BOSS_CUTIN_ART).sort(),Object.keys(BOSS_CATALOG).sort());
 for(const file of Object.values(BOSS_CUTIN_ART)){
  const path=new URL('../'+file.split('?')[0],import.meta.url);
  assert(existsSync(path),file);
  const bytes=readFileSync(path);
  assert(bytes.length>12,file+' is empty');
  assert.equal(bytes.toString('ascii',0,4),'RIFF',file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',file);
 }
 assert.equal(Object.keys(REDRAWN_BOSS_CUTINS).length,31);
});
test('Cut-in preload is region scoped, cached and falls back after an image decode error',async()=>{
 const original=globalThis.Image,urls=[];
 globalThis.Image=class{set src(url){urls.push(url);queueMicrotask(()=>url.includes('cutin-gotha')?this.onerror():this.onload());}};
 try{
  await prepareBossCutins(11);
  const count=Object.values(BOSS_CATALOG).filter(b=>b.stage===11).length;
  assert.equal(urls.length,count);
  await prepareBossCutins(11);assert.equal(urls.length,count);
  assert.equal(bossCutinSource('gotha-squadron'),BOSS_CUTIN_FALLBACKS['gotha-squadron']);
  await prepareBossCutins(12);
  assert.equal(urls.length-count,2);
  assert(urls.slice(count).every(url=>url.includes('douaumont')||url.includes('souville')));
  assert.equal(bossCutinSource('missing'),'');
 }finally{if(original===undefined)delete globalThis.Image;else globalThis.Image=original;}
});
