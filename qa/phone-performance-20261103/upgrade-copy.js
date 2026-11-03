// Translate the live description's values instead of duplicating rarity balance tables.
// This module changes presentation only; it never computes or applies an upgrade.
export function liveUpgradeDescriptionEnglish(id, text=''){
 const numbers=String(text).match(/\d+(?:\.\d+)?/g)||[];
 const n=i=>numbers[i];
 switch(id){
  case 'damage':return numbers.length?`Machine-gun damage +${n(0)}%.`:null;
  case 'rate':return numbers.length>=2?`Machine-gun firing interval −${n(0)}% (minimum ${n(1)}s).`:null;
  case 'rockets':return numbers.length>=2?`Le Prieur rocket launcher +${n(0)} level (maximum ${n(1)}).${numbers.length>2?` Ordnance damage +${n(2)} percentage points.`:''}`:null;
  case 'mines':return numbers.length>=3?`Rear grenades per deployment +${n(0)} (${n(1)}–${n(2)} grenades).${numbers.length>3?` Ordnance damage +${n(3)} percentage points.`:''}`:null;
  case 'explosives':{const amount=String(text).match(/\+([\d.]+)%/);return amount?`All explosive weapon damage +${amount[1]} percentage points, including rockets, grenades, bombs and 37 mm shells.`:null;}
  case 'command':return numbers.length>=4?`Wingman and formation Active damage +${n(0)} percentage points; fire rate +${n(1)} percentage points. Manual bonuses are capped at +${n(2)}% damage and +${n(3)}% fire rate; only the remaining amount is added.`:null;
  case 'turn':return numbers.length>=6?`Turn rate +${n(0)}%, flight speed +${n(1)}%, straight-flight recovery +${n(2)}%. Total caps: +${n(3)}% turn rate, +${n(4)}% speed and +${n(5)}% recovery.`:null;
  case 'armor':return numbers.length>=2?`Maximum durability +${n(0)}; immediately restores the amount gained. Standard armor adds up to ${n(1)} durability before bomber scaling. Bomber limits and LO's durability penalty still apply.`:null;
  case 'regen':return numbers.length>=2?`Restores an additional ${n(0)}% maximum durability per second (total cap ${n(1)}%).`:null;
  case 'cooldown':return numbers.length>=2?`Active cooldown −${n(0)}%, down to ${n(1)}% of its base value.`:null;
  case 'wingman':return numbers.length>=3?`Permanent wingmen +${n(0)}. At most ${n(1)} selections per sortie; ${n(2)} permanent wingmen total.`:null;
  case 'bomber':return numbers.length>=5?`${n(1)} bomber drops ${n(2)} bombs every ${n(0)}s. Each additional selection reduces the interval by ${n(3)}s, down to ${n(4)}s.`:null;
  default:return null;
 }
}
