import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../boot-gate.js',import.meta.url),'utf8');

test('Canvas-safe image loading applies only to an explicit supported branch test session',()=>{
 for(const [hostname,search,expected] of [['raw.githack.com','?headonTest=1','anonymous'],['raw.githack.com','',undefined],['leesh603.github.io','?headonTest=1',undefined],['game.example','',undefined]]){
  class Img{get src(){return this.url}set src(v){this.url=v}get complete(){return true}decode(){return Promise.resolve()}addEventListener(){}removeEventListener(){}}
  const ctx={HTMLImageElement:Img,URL,URLSearchParams,location:{hostname,search},document:{baseURI:'https://'+hostname+'/index.html'},queueMicrotask(){},setTimeout(){}};ctx.window=ctx;
  runInNewContext(source,ctx);ctx.HEADON_GATE.releaseAll();
  const image=new Img();image.src='./plane.webp';
  assert.equal(image.crossOrigin,expected);assert.equal(image.src,'./plane.webp');assert.equal(image.complete,true);
 }
});
