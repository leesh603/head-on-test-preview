// Boot image queue (classic script, loaded before every module).
// At boot the game asks for ~80 MB of art at once, so the hangar's own pilot portrait and
// aircraft illustration wait behind battle atlases. Until the sortie, image loads set through
// `img.src` (except data:/blob: and small interface art) go through a small priority queue:
// a few downloads at a time, most urgent first, and nothing less urgent while it loads.
// app.js ranks what the hangar shows; everything else follows in request order. Held images report complete=false and decode() waits
// for the real load, so loader code behaves exactly as on a slow network. The queue drains at
// once on sortie, and a safety timer drains it after 45 s whatever happens.
(()=>{
 const P=typeof HTMLImageElement!=='undefined'&&HTMLImageElement.prototype;
 const src=P&&Object.getOwnPropertyDescriptor(P,'src'),complete=P&&Object.getOwnPropertyDescriptor(P,'complete');
 if(!src?.set||!complete?.get){window.HEADON_GATE={raise(){},releaseAll(){},open:true};return}
 const decode=P.decode,held=new Map(),waiting=new WeakMap(),LIMIT=4;let open=false,serial=0;const active=new Map();
 // Inline and vector art never waits.
 const pass=/^(data:|blob:)|\.svg(\?|$)|favicon/;
 const abs=u=>{try{return new URL(u,document.baseURI).href}catch{return String(u)}};
 let rank=()=>2;
 const done=img=>{active.delete(img);pump()};
 const go=img=>{const h=held.get(img);held.delete(img);active.set(img,h.rank);
  const end=()=>{img.removeEventListener('load',end);img.removeEventListener('error',end);done(img)};
  img.addEventListener('load',end);img.addEventListener('error',end);src.set.call(img,h.url);
  const w=waiting.get(img);if(w){waiting.delete(img);w()}};
 function pump(){
  // Strict priority: nothing less urgent starts while something more urgent is still loading.
  while(held.size&&(open||active.size<LIMIT)){
   let best=null,bestKey=Infinity;
   for(const [img,h] of held){const key=h.rank*1e9+h.n;if(key<bestKey){bestKey=key;best=img}}
   if(!open&&active.size&&held.get(best).rank>Math.min(...active.values()))break;
   go(best);
  }
 }
 Object.defineProperty(P,'src',{configurable:true,enumerable:src.enumerable,get(){return held.has(this)?held.get(this).url:src.get.call(this)},set(v){
  const url=abs(v);if(active.delete(this))queueMicrotask(pump);// a re-set aborts the load in flight
  if(open||pass.test(url)){held.delete(this);src.set.call(this,v);return}
  held.set(this,{url,n:serial++,rank:rank(url)});queueMicrotask(pump);
 }});
 Object.defineProperty(P,'complete',{configurable:true,enumerable:complete.enumerable,get(){return held.has(this)?false:complete.get.call(this)}});
 if(decode)P.decode=function(){if(!held.has(this))return decode.call(this);return new Promise(r=>waiting.set(this,r)).then(()=>decode.call(this))};
 window.HEADON_GATE={
  get open(){return open},
  // rank(url) → 0 now, 1 soon, 2 later. Re-ranks everything still waiting.
  setRank(fn){rank=fn;for(const h of held.values())h.rank=fn(h.url);pump()},
  // Move these URLs to the front (a pilot the player just picked).
  raise(urls){const want=new Set([...urls].map(abs));for(const h of held.values())if(want.has(h.url))h.rank=-1;for(const [img,r] of active)if(want.has(src.get.call(img)))active.set(img,-1);pump()},
  releaseAll(){if(open)return;open=true;pump()}
 };
 setTimeout(()=>window.HEADON_GATE.releaseAll(),45000);
})();
