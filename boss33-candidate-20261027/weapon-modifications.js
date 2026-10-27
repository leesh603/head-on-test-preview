import {wimperisOrdnance} from './flight-equipment.js';
import {TACTICAL_DOCTRINES} from './tactical-doctrines.js?v=tactics20261023&td4=20261026';
// Compatibility exports for firing and encyclopedia consumers; never upgrade cards.
export const WEAPON_MODS=TACTICAL_DOCTRINES;
export const WEAPON_MOD_BY_ID=Object.freeze(Object.fromEntries(WEAPON_MODS.map(mod=>[mod.id,mod])));
export const ORDNANCE_STAGGER_DELAY=.24;
export function weaponModAvailable(p,mod){return !!mod&&(p.weaponModSelections?.[mod.family]||0)>=5&&!p.weaponMods?.[mod.family];}
export function modGunRounds(p,count,cap=10){
 return !p.cow37&&p.weaponMods?.GUN==='suppression'&&count>0?Math.min(cap,count+1):count;
}
export function modGunDamage(p,count,emitted){
 if(p.cow37)return 1;
 // Existing sqrt(shots) normalization is retained by every caller.
 return p.weaponMods?.GUN==='precision'?1.55:p.weaponMods?.GUN==='suppression'?.90:1;
}
export function modGunFan(p,fan){
 if(p.cow37)return fan;
 return p.weaponMods?.GUN==='precision'?fan*.23/Math.max(1,((p.shots||1)-1)/4):p.weaponMods?.GUN==='suppression'?fan*1.65:fan;
}
// Keep the invested forward volley; the added tracer sweeps the outer lanes.
// Widening every round left an avoidable hole in the original firing path.
export function modGunOffset(p,index,count,fan,clock=p){
 const centered=(index-(count-1)/2)*fan;
 if(p.cow37||p.weaponMods?.GUN!=='suppression'||p.pilot==='loewenhardt')return centered;
 const lane=[-1,0,1,0][clock.weaponModSweep??0];
 if(count<=1)return centered;
 const core=count-1;
 return index<core?(index-(core-1)/2)*fan/1.65:lane*core*fan*.5;
}
export function modGunInterval(p,base,clock=p,count=p.shots||1,cap=10){
 if(p.cow37)return base;
 if(p.weaponMods?.GUN==='precision'){
  clock.weaponModBurst=((clock.weaponModBurst||0)+1)%3;
  const short=Math.max(.005,base*.35);
  return clock.weaponModBurst?short:Math.max(.005,base*3.6-short*2);
 }
 // A modest volley-budget gain rewards a wider approach lane. Scale the
 // interval with rate upgrades, including high-rate and converted gun mounts.
 if(p.weaponMods?.GUN==='suppression'){
  clock.weaponModSweep=((clock.weaponModSweep??-1)+1)%4;
  return Math.max(.005,base*.90*modGunRounds(p,count,cap)/Math.max(1,count));
 }
 return base;
}
export function ordnancePattern(p,type,index,total){
 const branch=p.weaponMods?.EXPLOSIVE,side=total===1&&branch==='area'?(p.weaponModSingleLane?.[type]||1):index-(total-1)/2;
 const fan=type==='rocket'?(branch==='focus'?.018:branch==='area'?.23:.05):(branch==='focus'?.16:branch==='area'?.60:.30);
 let heading=p.a+(type==='grenade'?Math.PI:0)+side*fan,reach=125;
 // A single tube still has a choice: a small deliberate aim correction versus
 // alternating lanes. The existing launch count and damage budget are unchanged.
 const prediction=wimperisOrdnance(p,type,heading,reach);
 if(prediction)return prediction;
 if(total===1&&branch==='focus'){
  let closest=type==='rocket'?650:220,target=null;
  const w=p.combatWorld?.()||p;
  for(const e of [...(w.enemies||[]),...(w.eliteEnemies?.members||[])]){if(!(e.hp>0)||e.alive===false||e.dead||e.expired||e.crashing)continue;const d=Math.hypot(e.x-p.x,e.y-p.y),bearing=Math.atan2(e.y-p.y,e.x-p.x),error=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));if(d<closest&&Math.abs(error)<.3){closest=d;target={error,d};}}
  if(target){const correction=type==='rocket'?.12:.16;heading+=Math.max(-correction,Math.min(correction,target.error));if(type==='grenade')reach=Math.max(95,Math.min(155,target.d));}
 }
 return {angle:heading,distance:reach};
}
