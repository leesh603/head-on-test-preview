// Named squadrons used to fly their signature set piece, one aircraft at a time
// behind a warning, and then leave. Measured on main (each squadron alone, a
// pilot weaving without firing back, 0.75 s invulnerability): over 15-36 s a
// whole squadron landed 0-2 gun hits, and four of five aircraft flew away.
// When the set piece ends naturally (passes spent, cover finished, leader lost,
// courier resolved, timeout) the surviving aircraft now stay and hunt the pilot
// as free fighters: the ordinary pass machine with its lead-solution gunnery,
// their own elite hull, livery and name, a hunter's turn rate, heavier rounds
// and enough pace to stay with the pilot. They fight until
// shot down. Withdrawals for priority, restart or a finished run still leave.
export const ELITE_HUNT=Object.freeze({damageMultiplier:1.6,firstShot:.6,stagger:.4,cruiseBoost:1.1,pilotPace:1.08});
export const HUNT_REASONS=Object.freeze(new Set(['departed','timeout','cover-complete','cover-destroyed','leader-lost','evaded','courier-saved','courier-lost','destroyed']));
const UNIT_KEYS=/^(famousWing|expansion|legendWing|cigognes|hatRing)/;
const unitOf=e=>e.famousWingUnit||e.expansionWingUnit||e.legendWingUnit||(e.cigognesRole?'cigognes':e.hatRingGroup!=null?'hat-ring':'elite');
export function releaseEliteHunt(g,members,reason){
 if(!HUNT_REASONS.has(reason)||g?.state!=='playing')return 0;
 let n=0;const pilots=g.players?.length?g.players.filter(p=>p?.hp>0):[g],pace=Math.max(0,...pilots.map(p=>(p.speed||0)*(p.airframeSpeed??1)));
 for(const e of members||[]){
  if(!(e?.hp>0)||e.crashing||e.expired||!['scout','hunter'].includes(e.type))continue;
  const unit=unitOf(e);
  for(const k of Object.keys(e))if(UNIT_KEYS.test(k))delete e[k];
  for(const k of ['missionTarget','battlefieldEventId','arrivalAuthored','combatPassState','combatPassTimer','combatPassHeading','combatPassBreak'])delete e[k];
  // Fast enough to stay with the pilot: a hunter that falls behind is no threat.
  const cruise=Math.max((e.dogfightCruise||e.personalityCruise||e.speed||150)*ELITE_HUNT.cruiseBoost,pace*ELITE_HUNT.pilotPace);
  Object.assign(e,{eliteHunter:unit,type:'hunter',ace:false,fire:ELITE_HUNT.firstShot+n*ELITE_HUNT.stagger,burstLeft:0,aceDamageMultiplier:ELITE_HUNT.damageMultiplier,dogfightCruise:cruise,personalityCruise:cruise,cruiseSpeedCap:null,speed:Math.max(e.speed||0,cruise*.9)});
  n++;
 }
 return n;
}
