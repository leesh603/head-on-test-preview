globalThis.Image??=class{set src(v){this._src=v;queueMicrotask(()=>this.onload?.())}};
globalThis.document??={createElement:()=>({getContext:()=>null})};
globalThis.performance??={now:()=>Date.now()};
const {fixture,step}=await import('./tests/stageboss-fixture94.mjs');
for(const si of [4,8,11]){
 const f=fixture({teamFaction:'central',stageIndex:si});
 f.addon.startBoss({x:400,y:300});
 const times=[];
 for(let i=0;i<3000;i++){const t0=performance.now();step(f,.02);times.push(performance.now()-t0)}
 times.sort((a,b)=>a-b);
 const pct=p=>times[Math.floor(p*times.length)].toFixed(2);
 console.log(`stage ${si}: p50=${pct(.5)} p95=${pct(.95)} p99=${pct(.99)} max=${times.at(-1).toFixed(2)}ms ticks=${times.length}`);
}
