// Presentation-only hit snapshots. No simulation fields, RNG, or wall clocks.
const armorHits=new WeakMap();
const alive=p=>p?.hp>0&&p.status!=='downed'&&!(p.heineckeEscape>0);
export function recordEquipmentHit(p,before,source,time){
 const b=source?.bullet;
 if(!alive(p)||!p.jArmorCapsule||!(p.hp<before)||!Number.isFinite(time)||!b||b.flak||b.heavy||b.heavyShell||b.rocket||b.actualExplosion||b.blast||b.gas)return;
 if(!Number.isFinite(source.x)||!Number.isFinite(source.y))return;
 armorHits.set(p,{at:time,angle:Math.atan2(source.y-p.y,source.x-p.x)});
}
export function equipmentArmorFeedback(p,time){
 const hit=armorHits.get(p);
 if(!hit)return null;
 const elapsed=time-hit.at;
 if(!alive(p)||!p.jArmorCapsule||!Number.isFinite(elapsed)||elapsed<0||elapsed>=.24){armorHits.delete(p);return null;}
 return {remaining:.24-elapsed,angle:hit.angle};
}
