import {BOSS_CATALOG} from './headon-stageboss-patterns.js?v=tame3&rail=33';

export const BOSS_CUTIN_FALLBACKS=Object.freeze({'jutland-grand-fleet':'jutland-fleet-cut-in.webp?v=tame3','paris-staaken-rvi':'paris-staaken-preview1918.webp?v=tame3','paris-searchlight-fortress':'paris-fortress-preview1918.webp?v=tame3','gallipoli-fortress':'gallipoli-fortress-cut-in.webp?v=tame3','wustenpanzer':'boss-maan-wusten-cut-in-r2.webp?v=tame3','sinai-landship':'boss-maan-sinai-cut-in-r2.webp?v=tame3','fort-douaumont':'boss-douaumont-cut-in.webp?v=tame3','fort-souville':'boss-souville-cut-in.webp?v=tame3','gotha-squadron':'gotha_night.webp?v=tame3','london-apron-raid':'boss-art-london-apron.webp?v=tame3&b=326','paris-gun':'boss-art-paris-gun.webp?v=tame3&b=326','lincomparable':'boss-art-lincomparable.webp?v=tame3&b=326','sms-stuttgart':'boss-art-sms-stuttgart.webp?v=tame3&b=326','hms-zubian':'boss-art-hms-zubian.webp?v=tame3&b=326','a7v-flak':'boss-art-a7v-flak.webp?v=tame3&b=326','mark-v-cruiser':'boss-art-mark-v-cruiser.webp?v=tame3&b=326','livens-flame-projector':'boss-art-livens-flame-projector.webp?v=tame3&b=326','minenwerfer-battery':'boss-art-minenwerfer-battery.webp?v=tame3&b=326','drachen-net':'boss-art-drachen-net.webp?v=tame3&b=326','london-apron':'boss-art-london-apron.webp?v=tame3&b=326','zeppelin-l70':'boss-art-zeppelin-l70.webp?v=tame3&b=326','hma23':'boss-art-hma23.webp?v=tame3&b=326','gik':'boss-art-gik.webp?v=tame3&b=326','ca4':'boss-art-ca4.webp?v=tame3&b=326','armored-harbor-fortress':'boss-art-armored-harbor-fortress.webp?v=tame3&b=326','fliegerzug':'boss-art-fliegerzug.webp?v=tame3','treffas-wagen':'boss-art-treffas.webp?v=tame3','jasta11-circus':'portrait-baron.webp?v=tame3&b=326','naval10-black-flight':'portrait-collishaw.webp?v=tame3&b=326','mark4-wedge':'boss-art-mark1-20261001.webp?v=tame3','morser-battery':'boss-art-schwaben20261001.webp?v=tame3','staaken-rvi':'boss-art-staaken-rvi.webp?v=tame3&b=345','london-searchlight':'boss-art-london-searchlight.webp?v=tame3&b=345','flak-tower':'boss-art-flak-tower.webp?v=tame3'});
export const REDRAWN_BOSS_CUTINS=Object.freeze({
  "mark4-wedge": "cutin-mark1-landships.webp",
  "morser-battery": "cutin-schwaben-fortress.webp",
  "gotha-squadron": "cutin-gotha-squadron.webp",
  "fort-douaumont": "cutin-douaumont.webp",
  "fort-souville": "cutin-souville.webp",
  "wustenpanzer": "cutin-wustenpanzer.webp",
  "sinai-landship": "cutin-sinai-landship.webp",
  "gallipoli-fortress": "cutin-gallipoli.webp",
  "paris-staaken-rvi": "cutin-paris-staaken.webp",
  "paris-searchlight-fortress": "cutin-paris-fortress.webp",
  "jutland-grand-fleet": "cutin-jutland-fleet.webp",
  "paris-gun": "cutin-paris-gun.webp",
  "lincomparable": "cutin-lincomparable.webp",
  "sms-stuttgart": "cutin-sms-stuttgart.webp",
  "hms-zubian": "cutin-hms-zubian.webp",
  "a7v-flak": "cutin-a7v-flak.webp",
  "mark-v-cruiser": "cutin-mark-v-cruiser.webp",
  "livens-flame-projector": "cutin-livens-flame-projector.webp",
  "minenwerfer-battery": "cutin-minenwerfer-battery.webp",
  "drachen-net": "cutin-drachen-net.webp",
  "london-apron-raid": "cutin-london-apron-raid.webp",
  "flak-tower": "cutin-flak-tower.webp",
  "zeppelin-l70": "cutin-zeppelin-l70.webp",
  "hma23": "cutin-hma23.webp",
  "gik": "cutin-gik.webp",
  "ca4": "cutin-ca4.webp",
  "armored-harbor-fortress": "cutin-armored-harbor-fortress.webp",
  "fliegerzug": "cutin-fliegerzug.webp",
  "treffas-wagen": "cutin-treffas-wagen.webp",
  "jasta11-circus": "cutin-jasta11-circus.webp",
  "naval10-black-flight": "cutin-naval10-black-flight.webp"
});
export const BOSS_CUTIN_ART=Object.freeze(Object.fromEntries(
 Object.keys(BOSS_CATALOG).map(id=>[id,REDRAWN_BOSS_CUTINS[id]?
 './'+REDRAWN_BOSS_CUTINS[id]+'?v=tame3':BOSS_CUTIN_FALLBACKS[id]])));
const pending=new Map(),failed=new Set();let currentRegion=null;
// Preload only the current region's cut-ins, without retaining decoded artwork.
export function prepareBossCutins(region){
 if(currentRegion!==region){pending.clear();currentRegion=region;}
 const ids=Object.keys(BOSS_CATALOG).filter(id=>BOSS_CATALOG[id].stage===region);
 return Promise.all(ids.map(id=>{
  if(pending.has(id))return pending.get(id);
  if(typeof Image==='undefined')return Promise.resolve(false);
  const p=new Promise(resolve=>{
   const im=new Image();im.decoding='async';
   im.onload=()=>{failed.delete(id);resolve(true)};
   im.onerror=()=>{failed.add(id);resolve(false)};
   im.src=BOSS_CUTIN_ART[id];
  });pending.set(id,p);return p;
 }));
}
export function bossCutinSource(id){
 return failed.has(id)?BOSS_CUTIN_FALLBACKS[id]:BOSS_CUTIN_ART[id]||'';
}
