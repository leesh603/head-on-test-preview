// Local audition pack. The original rural melody remains in the new arrangement.
export const RURAL_RECORDING=Object.freeze({id:'rural-upgraded-20261102',base:'./',file:'audio/rural-upgraded.ogg',loopEnd:43.636371882086166});
const RURAL_SAMPLES=Object.freeze({mg:'sfx/rural-mg',hit:'sfx/rural-hit',kill:'sfx/rural-kill','engine-rotary':'sfx/rural-engine'});
export function ruralSamplePath(key,original,region){
 if(region!==0)return original;
 return RURAL_SAMPLES[key]||original;
}
export function isArtilleryImpactSound(sound){return ['railShellImpact','railShellImpact520','artilleryImpact'].includes(sound);}
