import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('all pilot surfaces retain the authored transparent bust, including both crews',async()=>{
 const previous=globalThis.Image,decoded=[];
 globalThis.Image=class{set src(value){this.url=value;queueMicrotask(()=>this.onload?.());}async decode(){decoded.push(this.url)}};
 let portraits;
 try{
  const source=await readFile(new URL('../portraits.js',import.meta.url),'utf8');
  portraits=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  assert.ok((await portraits.portraitsReady).every(Boolean));
 }finally{globalThis.Image=previous;}
 const audit=JSON.parse(await readFile(new URL('../qa/pilot-busts/asset-audit.json',import.meta.url),'utf8'));
 assert.deepEqual(Object.keys(portraits.portraitSources).sort(),audit.map(p=>p.id).sort());
 assert.equal(audit.length,32);
 assert.equal(new Set(decoded).size,32,'all pilots, including the nine field portraits, decode before combat');
 for(const entry of audit){
  const url=portraits.portraitSources[entry.id];
  assert.equal(url.split('?')[0],'./'+entry.asset,entry.id+' keeps its authored frame');
  const bytes=await readFile(new URL('../'+entry.asset,import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.toString('ascii',12,16),'VP8X');
  assert.ok(bytes[20]&16,entry.id+' has an alpha channel');
  const width=bytes.readUIntLE(24,3)+1,height=bytes.readUIntLE(27,3)+1;
  assert.ok(width>=1024);assert.equal(width,height);assert.equal(width,entry.width);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  const [left,top,right,bottom]=entry.opaqueBounds;
  assert.ok(left>0&&top>0&&right<width-1&&bottom<height-1,entry.id+' has room around both shoulders');
  assert.equal(entry.edgeOpaque,0);
 }
});
