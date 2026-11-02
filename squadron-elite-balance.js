/** Bounded elite pressure: durability and counterplay timings stay unit-specific. */
export function traceDirector(g,type,detail={}){if(!g?.directorDebug&&!Array.isArray(g?.battleDirectorTrace))return;const log=g.battleDirectorTrace??=[];log.push({at:g.t||0,type,...detail});if(log.length>512)log.splice(0,log.length-512);}
export function observeSquadron(g,unit,entities){if(!g?.directorDebug&&!Array.isArray(g?.battleDirectorTrace))return;for(const e of entities){if(e.squadronObservedHp==null)e.squadronObservedHp=e.maxHp??e.hp;if(e.hp<e.squadronObservedHp&&!e.squadronFirstHit){e.squadronFirstHit=true;traceDirector(g,'firstHit',{unit,entity:e.id,hp:e.hp});}if((e.hp<=0||e.crashing)&&!e.squadronDeathRecorded){e.squadronDeathRecorded=true;traceDirector(g,'memberDead',{unit,entity:e.id});}e.squadronObservedHp=e.hp;}}
// A handled fireEnemy call is not proof of a projectile. Tick owners count only this serial.
export function squadronShotCreated(g,e,unit){e.directorLastShotAt=g.t||0;e.squadronShotsCreated=(e.squadronShotsCreated||0)+1;if(e.squadronFirstActionAt==null){e.squadronFirstActionAt=g.t||0;traceDirector(g,'firstAction',{unit,entity:e.id,after:Math.max(0,(g.t||0)-(e.squadronSpawnAt||0))});}traceDirector(g,'shotCreated',{unit,entity:e.id});}
export function attemptSquadronShot(g,e,unit,fire){const before=e.squadronShotsCreated||0;traceDirector(g,'shotAttempt',{unit,entity:e.id});fire(g,e);const created=(e.squadronShotsCreated||0)>before;if(!created)traceDirector(g,'shotDenied',{unit,entity:e.id,reason:(g.bullets?.length||0)>=180?'projectile-cap':e.directorAttackDeniedReason||'firing-window'});return created;}
const elapsed=g=>Math.max(0,Number.isFinite(g?.t)?g.t:0);
// Match the established early durability curve; late sorties no longer freeze at 2x HP.
export const squadronHpScale=g=>1+elapsed(g)/500;
export const SQUADRON_ELITE_BALANCE=Object.freeze({damageRampSeconds:300,maxDamageBonus:2,cannonRampSeconds:500,maxCannonBonus:1.2,courierMaxBonus:.25});
export const squadronDamage=(g,base)=>Math.max(Math.round(base*(1+Math.min(2,elapsed(g)/300))),Math.round(base*(1+elapsed(g)/240)*1.10));
export const squadronCannonDamage=(g,base)=>Math.round(base*(1+Math.min(1.2,elapsed(g)/500)));
// Rescue pressure has its own low ceiling: never apply fighter damage scaling to an 80HP courier.
export const squadronCourierDamage=(g,base=8)=>Math.round(base*(1+Math.min(.25,elapsed(g)/2400)));

