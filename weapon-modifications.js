import {TACTICAL_DOCTRINES} from './tactical-doctrines.js';
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
 return p.weaponMods?.GUN==='precision'?1.4:p.weaponMods?.GUN==='suppression'?.82:1;
}
export function modGunFan(p,fan){
 if(p.cow37)return fan;
 return p.weaponMods?.GUN==='precision'?fan*.23/Math.max(1,((p.shots||1)-1)/4):p.weaponMods?.GUN==='suppression'?fan*1.65:fan;
}
export function modGunInterval(p,base,clock=p,count=p.shots||1,cap=10){
 if(p.cow37)return base;
 if(p.weaponMods?.GUN==='precision'){
  clock.weaponModBurst=((clock.weaponModBurst||0)+1)%3;
  return clock.weaponModBurst?Math.max(.02,base*.35):Math.max(.28,base*3.5);
 }
 // One extra tracer per volley; compensate cadence to retain the original projectile budget.
 if(p.weaponMods?.GUN==='suppression')return Math.max(.045,(base+(clock===p?0:.04))*modGunRounds(p,count,cap)/Math.max(1,count));
 return base;
}
export function ordnancePattern(p,type,index,total){
 const branch=p.weaponMods?.EXPLOSIVE,side=total===1&&branch==='area'?(p.weaponModSingleLane?.[type]||1):index-(total-1)/2;
 const fan=type==='rocket'?(branch==='focus'?.018:branch==='area'?.23:.05):(branch==='focus'?.16:branch==='area'?.60:.30);
 let heading=p.a+(type==='grenade'?Math.PI:0)+side*fan,reach=125;
 // A single tube still has a choice: a small deliberate aim correction versus
 // alternating lanes. The existing launch count and damage budget are unchanged.
 if(total===1&&branch==='focus'){
  let closest=type==='rocket'?650:220,target=null;
  for(const e of (p.combatWorld?.()||p).enemies||[]){if(!(e.hp>0)||e.dead||e.crashing)continue;const d=Math.hypot(e.x-p.x,e.y-p.y),bearing=Math.atan2(e.y-p.y,e.x-p.x),error=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));if(d<closest&&Math.abs(error)<.3){closest=d;target={error,d};}}
  if(target){const correction=type==='rocket'?.12:.16;heading+=Math.max(-correction,Math.min(correction,target.error));if(type==='grenade')reach=Math.max(95,Math.min(155,target.d));}
 }
 return {angle:heading,distance:reach};
}
