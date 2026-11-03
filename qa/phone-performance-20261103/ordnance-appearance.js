// Presentation only: these profiles never enter damage, timing or collision.
// Families have a fixed palette, so mixed barrages remain readable.
export const GUN_APPEARANCES=Object.freeze({
 scout:{color:'#d95636',core:'#ffd1a2',length:14,width:2.8},
 hunter:{color:'#cf503d',core:'#ffe4b8',length:22,width:2.5},
 bomber:{color:'#d78043',core:'#fff0be',length:16,width:3.5},
 heavyBomber:{color:'#bb4936',core:'#ffe2b0',length:20,width:4.2},
 boss:{color:'#ae342d',core:'#fff1d1',length:24,width:3.4},
 elite:{color:'#bc4937',core:'#fff0c2',length:19,width:3.5},
 zeppelin:{color:'#d76b40',core:'#ffe1ab',length:18,width:3.7},
 naval:{color:'#c45d3f',core:'#ffe3b4',length:18,width:3.8},
 balloon:{color:'#c86d45',core:'#ffe8bf',length:12,width:3.5},
 flak:{color:'#b9533c',core:'#ffeac2',length:12,width:3.8}
});
export function hostileGunAppearance(b){
 const base=GUN_APPEARANCES[b.ammoVisual]||GUN_APPEARANCES[b.visualType]||GUN_APPEARANCES.scout;
 return base;
}
const FRIENDLY=Object.freeze({special:{length:18,width:3.4},piercing:{length:27,width:2.5},ally:{length:16,width:2.4},normal:{length:20,width:2.8}});
export function friendlyGunAppearance(b){
 if(b.specialAmmo)return FRIENDLY.special;
 if(b.pierce)return FRIENDLY.piercing;
 if(b.formation||b.ally||b.patrol)return FRIENDLY.ally;
 return FRIENDLY.normal;
}
