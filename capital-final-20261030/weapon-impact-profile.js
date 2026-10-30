// Shared presentation classification. Never infer a bomb model from its size,
// faction or damage: authored source metadata owns Cooper/PuW identity.
const WEAPONS=new Set(['grenade','cooper','puw','bomb','rocket','cannon','incendiary']);
export function weaponImpactKind(f){
 if(!f||f.fxHidden||f.killExplosion||f.fxProfile||['aircraft','aircraftHeavy','aircraftMedium','bossFinal','structure','hydrogen'].includes(f.kind))return null;
 if(WEAPONS.has(f.impactWeapon))return f.impactWeapon;
 const source=f.fxSource||f.kind;
 if(source==='cow'||source==='moteur'||source==='cannon')return 'cannon';
 if(source==='lePrieur'||source==='rocket')return 'rocket';
 if(source==='cooper'||source==='puw'||source==='bomb')return source;
 if(source==='incendiary')return 'incendiary';
 return f.grenade?'grenade':null;
}
