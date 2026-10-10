import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fixture(){
 const source=app.slice(app.indexOf('function swapArt('),app.indexOf('function bossCutinHeld('));
 const swap=runInNewContext(source+';swapArt',{URL,document:{baseURI:'https://example.test/'}});
 const pending=[];
 const image={src:'',complete:false,naturalWidth:0,style:{},
  decode(){return new Promise((resolve,reject)=>pending.push({resolve,reject}))},
  removeAttribute(){this.src='';this.complete=false;this.naturalWidth=0}};
 return {swap,image,pending};
}

test('failed cut-in remains hidden and the same URL can be retried',async()=>{
 const {swap,image,pending}=fixture();
 const failed=swap(image,'portrait.webp');
 pending[0].reject(new Error('network failure'));
 await failed;
 assert.equal(image.style.visibility,'hidden');
 const retry=swap(image,'portrait.webp');
 assert.equal(pending.length,2);
 image.complete=true;image.naturalWidth=512;pending[1].resolve();await retry;
 assert.equal(image.style.visibility,'');
});

test('late completion of an old cut-in cannot reveal the next image',async()=>{
 const {swap,image,pending}=fixture();
 const old=swap(image,'old.webp'),next=swap(image,'next.webp');
 pending[0].resolve();await old;
 assert.equal(image.style.visibility,'hidden');
 image.complete=true;image.naturalWidth=512;pending[1].resolve();await next;
 assert.equal(image.style.visibility,'');
});

test('successful repeated requests reuse decoding',async()=>{
 const {swap,image,pending}=fixture();
 const first=swap(image,'portrait.webp');
 assert.equal(swap(image,'portrait.webp'),first);
 image.complete=true;image.naturalWidth=512;pending[0].resolve();await first;
 await swap(image,'portrait.webp');
 assert.equal(pending.length,1);
});

test('clearing a cut-in invalidates pending image work',async()=>{
 const {swap,image,pending}=fixture();
 const first=swap(image,'portrait.webp');
 await swap(image,'');pending[0].resolve();await first;
 assert.equal(image.src,'');assert.equal(image.style.visibility,'');
});

test('browsers without decode retain their existing image path',async()=>{
 const {swap,image}=fixture();delete image.decode;
 await swap(image,'portrait.webp');
 assert.equal(image.style.visibility,'');
});
