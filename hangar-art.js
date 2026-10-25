import {HANGAR_OUTLINE_ART,AIRCRAFT_OUTLINE_ART,AIRCRAFT_ART_REVISION} from './aircraft-outline-art.js?v=outline1&art=pilot-recovery2';

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

// Offline alpha bounds: match the protected D.VII wing width in this UI only.
const HANGAR_ART_BOUNDS={"sortie-aircraft/hangar/richthofen-dr1-20261023.webp":[576,640,85,130,491,478],"sortie-aircraft/hangar/baron_albatros.webp":[576,640,44,112,532,496],"sortie-aircraft/hangar/fokker_voss.webp":[576,640,85,130,491,478],"sortie-aircraft/voss_pfalz.webp":[576,640,37,90,539,518],"sortie-aircraft/hangar/boelcke_albatros.webp":[576,640,56,119,520,489],"sortie-aircraft/boelcke_eindecker.webp":[576,640,34,107,542,501],"sortie-aircraft/hangar/eindecker.webp":[576,640,34,107,542,501],"sortie-aircraft/hangar/udet_fokkerdv.webp":[576,640,59,112,517,496],"sortie-aircraft/udet_dr1.webp":[576,640,85,130,491,478],"sortie-aircraft/hangar/goering_fokkerd7.webp":[576,640,47,107,529,501],"sortie-aircraft/goering_dr1.webp":[576,640,85,130,491,478],"sortie-aircraft/hangar/halberstadt_duo.webp":[576,640,15,72,561,536],"sortie-aircraft/hangar/berthold_pfalz.webp":[576,640,37,91,539,517],"sortie-aircraft/berthold_d7.webp":[576,640,47,107,529,501],"sortie-aircraft/hangar/wolff_albatros.webp":[576,640,44,112,532,496],"sortie-aircraft/wolff_f1.webp":[576,640,85,130,491,478],"loewenhardt_fokkerd7.webp":[720,605,4,4,716,600],"sortie-aircraft/loewenhardt_albatros.webp":[720,565,0,0,720,564],"sortie-aircraft/hangar/fokker_jacobs.webp":[576,640,85,130,491,478],"sortie-aircraft/jacobs_d7.webp":[576,640,47,107,529,501],"sortie-aircraft/hangar/brumowski_albatros-alpha3.webp":[576,640,44,75,532,533],"sortie-aircraft/hansa_brandenburg_di.webp":[576,640,56,96,520,512],"sortie-aircraft/hangar/gontermann_fokker.webp":[576,640,85,130,491,478],"sortie-aircraft/hangar/lothar_dr1.webp":[576,640,85,130,491,478],"sortie-aircraft/lothar_albatros.webp":[576,640,44,112,532,496],"sortie-aircraft/hangar/junkers_d1.webp":[576,640,45,144,531,464],"sortie-aircraft/sachsenberg_d7.webp":[576,640,47,107,529,501],"sortie-aircraft/hangar/schleich_albatros.webp":[576,640,44,86,532,522],"sortie-aircraft/fonck_spad.webp":[576,640,61,126,515,482],"sortie-aircraft/fonck_caudron.webp":[576,640,15,131,561,477],"sortie-aircraft/hangar/collishaw_sopwith.webp":[576,640,65,120,511,488],"sortie-aircraft/collishaw_camel.webp":[576,640,55,76,521,532],"sortie-aircraft/hangar/baracca_nieuport.webp":[576,640,63,134,513,474],"sortie-aircraft/baracca_spad.webp":[576,640,61,126,515,482],"sortie-aircraft/guynemer_spad.webp":[576,640,67,132,509,476],"sortie-aircraft/morane_l.webp":[576,640,15,65,561,543],"sortie-aircraft/bishop_nieuport.webp":[576,640,63,134,513,474],"sortie-aircraft/bishop_se5a.webp":[576,640,64,117,512,491],"sortie-aircraft/hangar/mannock_se5a.webp":[576,640,64,117,512,491],"sortie-aircraft/mannock_nieuport.webp":[576,640,63,134,513,474],"sortie-aircraft/hangar/bristol_duo.webp":[576,640,15,91,561,517],"sortie-aircraft/hawker_dh2.webp":[576,640,54,102,522,506],"sortie-aircraft/bristol_scout_c.webp":[576,640,60,105,516,503],"sortie-aircraft/hangar/mccudden_se5a.webp":[576,640,64,117,512,491],"sortie-aircraft/mccudden_dh2.webp":[576,640,54,102,522,506],"sortie-aircraft/nungesser_nieuport24.webp":[576,640,62,109,514,499],"sortie-aircraft/voisin_iii.webp":[576,640,15,66,561,542],"sortie-aircraft/rickenbacker_spad.webp":[576,640,61,126,515,482],"sortie-aircraft/rickenbacker_n28.webp":[576,640,67,126,509,482],"sortie-aircraft/hangar/ball_se5a.webp":[576,640,64,117,512,491],"sortie-aircraft/ball_nieuport.webp":[576,640,63,134,513,474],"sortie-aircraft/hangar/barker_snipe.webp":[576,640,43,108,533,500],"sortie-aircraft/barker_re8.webp":[576,640,15,70,561,538],"sortie-aircraft/luke_spad.webp":[576,640,61,126,515,482],"sortie-aircraft/hangar/proctor_se5a.webp":[576,640,64,117,512,491],"sortie-aircraft/lufbery_nieuport17.webp":[576,640,63,134,513,474],"sortie-aircraft/baron_albatros_d5_redwings.webp":[576,640,40,82,536,526],"sortie-aircraft/baron_albatros_d5_red.webp":[576,640,40,82,536,526]};
export function hangarArtLayout(key,width,height,bottom=false){
 if(!width||!height||key.startsWith("loewenhardt"))return null;
 const path=hangarArtSource(key).split("?")[0].replace(/^\.\//,""),b=HANGAR_ART_BOUNDS[path.replace('halberstadt_duo-alpha2.webp','halberstadt_duo.webp')];
 if(!b)return null;
 const [iw,ih,l,t,r,d]=b,ref=HANGAR_ART_BOUNDS["loewenhardt_fokkerd7.webp"];
 const contain=Math.min(width/iw,height/ih),target=Math.min(width/ref[0],height/ref[1])*(ref[4]-ref[2]);
 const scale=target/((r-l)*contain);
 return {scale,x:-((l+r-iw)/2)*contain*scale,y:-(((t+d-ih)/2)*contain+(bottom?(height-ih*contain)/2:0))*scale};
}
