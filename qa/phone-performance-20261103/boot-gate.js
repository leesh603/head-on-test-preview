// Boot image queue (classic script, loaded before every module).
// At boot the game asks for ~80 MB of art at once, so the hangar's own pilot portrait and
// aircraft illustration wait behind battle atlases. Until the sortie, image loads set through
// `img.src` (except data:/blob: and small interface art) go through a small priority queue:
// a few downloads at a time, most urgent first, and nothing less urgent while it loads.
// app.js ranks what the hangar shows; everything else follows in request order. Held images report complete=false and decode() waits
// for the real load, so loader code behaves exactly as on a slow network. At
// sortie (or after45s) priority holds relax; the download limit stays in place.
(()=>{
 const P=typeof HTMLImageElement!=='undefined'&&HTMLImageElement.prototype;
 const src=P&&Object.getOwnPropertyDescriptor(P,'src'),complete=P&&Object.getOwnPropertyDescriptor(P,'complete');
 if(!src?.set||!complete?.get){window.HEADON_GATE={raise(){},releaseAll(){},open:true};return}
 const decode=P.decode,held=new Map(),waiting=new WeakMap(),LIMIT=6;let open=false,serial=0;const active=new Map();
 // Inline and vector art never waits.
 const pass=/^(data:|blob:)|\.svg(\?|$)|favicon|lobby-ic-(?:ranking|aces|medals|home)420\.webp(?:\?|$)/;
 const abs=u=>{try{return new URL(u,document.baseURI).href}catch{return String(u)}};
 let rank=()=>2;
 // Selection stays urgent for newly created display images and retry URLs too.
 // raise() can run before their src setter, or after the boot hold was released.
 let urgency=0;
 const urgent=new Map(),key=u=>abs(u).replace(/([?&])r=\d+$/,'').replace(/\?$/,'');
 const priority=u=>urgent.get(key(u))??rank(u);
 const wake=img=>{const w=waiting.get(img);if(w){waiting.delete(img);for(const f of w)f()}};
 const done=img=>{active.delete(img);pump()};let relaxed=false;
 const go=(img,immediateUrl)=>{const h=held.get(img);held.delete(img);active.set(img,h.rank);
  const end=()=>{img.removeEventListener('load',end);img.removeEventListener('error',end);done(img)};
  img.addEventListener('load',end);img.addEventListener('error',end);src.set.call(img,immediateUrl??h.url);
  wake(img)};
 function pump(){
  // Strict priority: nothing less urgent starts while something more urgent is still loading.
  while(held.size){
   let best=null,bestKey=Infinity;
   for(const [img,h] of held){const key=h.rank*1e9+h.n;if(key<bestKey){bestKey=key;best=img}}
   // Keep one extra slot for the current selection. Reordering the waiting
   // queue alone cannot start its flight art when all six background requests
   // are stalled. Ambient loads still use only the original six slots.
   if(active.size>=LIMIT&&(active.size>LIMIT||held.get(best).rank!==urgency))break;
   if(!open&&!relaxed&&active.size&&held.get(best).rank>Math.min(...active.values()))break;
   go(best);
  }
 }
 Object.defineProperty(P,'src',{configurable:true,enumerable:src.enumerable,get(){return held.has(this)?held.get(this).url:src.get.call(this)},set(v){
  // The supported branch review host redirects bitmaps to another origin.
  // Opt into CORS only in its explicit test session so canvas atlases can bake.
  if(typeof location!=='undefined'&&location.hostname==='raw.githack.com'&&new URLSearchParams(location.search).get('headonTest')==='1')this.crossOrigin='anonymous';
  const url=abs(v);
  // Roster updates often assign the same URL. Restarting it loses a download
  // slot and can repeatedly cancel the image's decode on slower phones.
  if((held.get(this)?.url||src.get.call(this))===url&&(held.has(this)||active.has(this)||this.naturalWidth>0))return;
  if(active.delete(this))queueMicrotask(pump);// a re-set aborts the load in flight
  if(pass.test(url)){held.delete(this);src.set.call(this,v);wake(this);queueMicrotask(pump);return}
  held.set(this,{url,n:serial++,rank:priority(url)});
  // Once released, preserve a native synchronous assignment when a download
  // slot is free and no older request is waiting; it still counts toward LIMIT.
  if(open&&held.size===1&&active.size<LIMIT)go(this,v);else queueMicrotask(pump);
 }});
 Object.defineProperty(P,'complete',{configurable:true,enumerable:complete.enumerable,get(){return held.has(this)?false:complete.get.call(this)}});
 // Every decode() caller waits (several modules may decode the same held image).
 if(decode)P.decode=function(){if(!held.has(this))return decode.call(this);return new Promise(r=>{const w=waiting.get(this)||[];w.push(r);waiting.set(this,w)}).then(()=>decode.call(this))};
 window.HEADON_GATE={
  get open(){return open},
  // rank(url) → 0 now, 1 soon, 2 later. Re-ranks everything still waiting.
  setRank(fn){rank=fn;for(const h of held.values())h.rank=priority(h.url);pump()},
  // Move these URLs to the front (a pilot the player just picked).
  raise(urls){const level=--urgency;for(const u of urls)if(u)urgent.set(key(u),level);for(const h of held.values())h.rank=priority(h.url);for(const [img,r] of active){const p=urgent.get(key(src.get.call(img)));if(p!=null)active.set(img,p)}pump()},
  // Drop the strict-priority hold but keep draining in rank order — a late
  // releaseAll would re-queue every warm behind hundreds of earlier requests.
  relax(){relaxed=true;pump()},
  releaseAll(){if(open)return;open=true;relaxed=true;pump()}
 };
 setTimeout(()=>window.HEADON_GATE.relax(),45000);
})();

