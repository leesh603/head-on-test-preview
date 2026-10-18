import {HANGAR_OUTLINE_ART,AIRCRAFT_OUTLINE_ART,AIRCRAFT_ART_REVISION} from './aircraft-outline-art.js?v=outline1&art=pilot-recovery1';

export const hangarKeyFile={fokker_voss:'fokker_f1',fokker_red:'fokker',dh2:'airco_dh2',fokker_e1:'eindecker',fokker_d7_campaign:'fokkerd7',oeffag:'albatros',bristol:'bristol_duo',spad7:'spad',halberstadt:'halberstadt_duo',fokker_campaign:'fokker_standard',fokker:'fokker_standard'};
const artCache=new Map(),artReady=new Map();
export function hangarArtNow(key){return artReady.get(key)?.url||''}
export function hangarArtSource(key){
 const file=hangarKeyFile[key]||key;
 const path=HANGAR_OUTLINE_ART[key]||HANGAR_OUTLINE_ART[file]||AIRCRAFT_OUTLINE_ART['mech/'+file];
 return path?`./${path}?v=${AIRCRAFT_ART_REVISION}`:'';
}
// Both views use offline-prepared alpha/outline artwork from the same master.
// Keep just the loaded image: no Canvas readback, blob encode, second decode,
// or silent fallback to a different ace's/raw/damaged aircraft.
export function hangarArt(key){
 if(artCache.has(key))return artCache.get(key);
 const src=hangarArtSource(key);
 const pending=new Promise(resolve=>{
  const image=new Image();image.decoding='async';let settled=false;
  const finish=ok=>{
   if(settled)return;settled=true;clearTimeout(deadline);image.onload=image.onerror=null;
   if(ok){artReady.set(key,{url:src,display:image});resolve(src)}
   else{
    console.error('[HEAD-ON] Missing aircraft artwork',{key,source:src});
    setTimeout(()=>artCache.delete(key),4000);resolve('');
   }
  };
  const deadline=setTimeout(()=>finish(false),15000);
  image.onload=()=>finish(image.naturalWidth>0&&image.naturalHeight>0);
  image.onerror=()=>finish(false);
  if(src)image.src=src;else finish(false);
 });
 artCache.set(key,pending);return pending;
}
