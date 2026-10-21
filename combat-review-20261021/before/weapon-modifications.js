// Six sortie-local choices. Combat stays in the existing firing/wing loops.
export const WEAPON_MODS=Object.freeze([
 {id:'gunPrecision',family:'GUN',value:'precision',icon:'damage',name:'정밀 집중 사격',description:'좁은 탄도로 고위력 3연속 점사 후 사격 공백. 정예·단일 표적에 유리하며 다방향 대응은 약합니다. 추가탄·쿼드 루이스·스카프링·중무장기와 연계.',enName:'Precision Burst',enDescription:'Three powerful, tightly grouped volleys, then a firing gap. Strong against priority targets; weaker against scattered enemies. Works with extra rounds, Quad Lewis, Scarff Ring and gunship fits.'},
 {id:'gunSuppression',family:'GUN',value:'suppression',icon:'spread',name:'연속 제압 사격',description:'넓은 탄도로 한 발 더 분산 사격. 개별 위력은 낮고 지속 화망·편대 대응에 유리합니다. 발사 간격을 보정해 탄환 수를 제한하며 탄띠·추가탄·총좌와 연계.',enName:'Sustained Suppression',enDescription:'One extra round in a wider fan with lower individual damage. Covers formations and flight paths; weaker against a single target. Cadence bounds projectile load. Supports belts, extra rounds and gun mounts.'},
 {id:'explosiveFocus',family:'EXPLOSIVE',value:'focus',icon:'rockets',name:'집중 폭격',description:'로켓 발사각과 후방 수류탄 배열을 좁혀 밀집 표적에 집중합니다. 넓게 퍼진 적에는 불리합니다. 시차 투사·아마톨과 독립 조합, 폭격 지원 경로 유지.',enName:'Concentrated Ordnance',enDescription:'Tight rocket angles and a compact rear grenade pattern concentrate hits on large or clustered targets. Weak against scattered enemies. Combines with staggered release and Amatol; support bomber paths stay intact.'},
 {id:'explosiveArea',family:'EXPLOSIVE',value:'area',icon:'mines',name:'광역 차단',description:'로켓을 넓은 부채꼴로, 수류탄을 후방 여러 경로로 분산합니다. 광역 교전에 유리하고 단일 표적 집중률은 낮습니다. 시차 투사·아마톨과 독립 조합.',enName:'Area Denial',enDescription:'Wide rocket fans and dispersed rear grenades cover multiple approach paths. Strong against formations; lower hit concentration on one target. Combines independently with staggered release and Amatol.'},
 {id:'wingStrike',family:'FORMATION',value:'strike',icon:'command',name:'집중 출격 전술',description:'상시 편대가 주요 표적에 공격 시점을 맞춰 출격한 뒤 이탈·복귀합니다. 순간 화력은 강하지만 출격 중 본체 엄호가 약합니다. 편대 강화·비행선과 연계, 전용 액티브·진형 우선.',enName:'Coordinated Strike',enDescription:'Permanent wings launch together against a priority target, then break and return. Strong burst pressure leaves the owner less protected. Supports formation upgrades and airships; pilot abilities and special formations take priority.'},
 {id:'wingCover',family:'FORMATION',value:'cover',icon:'wingman',name:'교대 엄호 전술',description:'두 조가 공격과 본체 주변 교전을 교대합니다. 지속 화력·근거리 방어에 유리하며 동시 집중 화력은 낮습니다. 편대 강화·비행선과 연계, 전용 액티브·진형 우선.',enName:'Rotating Cover',enDescription:'Two groups alternate attack passes and real close-range cover around the owner. Sustained protection trades away simultaneous strike power. Supports formation upgrades and airships; pilot abilities and special formations take priority.'}
]);
export const WEAPON_MOD_BY_ID=Object.freeze(Object.fromEntries(WEAPON_MODS.map(mod=>[mod.id,mod])));
export const ORDNANCE_STAGGER_DELAY=.24;
export function weaponModAvailable(p,mod){
 if(!mod||(p.weaponModSelections?.[mod.family]||0)<5||p.weaponMods?.[mod.family])return false;
 if(mod.family==='GUN')return !p.cow37;
 if(mod.family==='EXPLOSIVE')return p.rockets>0||p.mineCount>0;
 return (p.permanentWingman||0)>=2;
}
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
 const side=index-(total-1)/2,branch=p.weaponMods?.EXPLOSIVE;
 const fan=type==='rocket'?(branch==='focus'?.018:branch==='area'?.23:.05):(branch==='focus'?.16:branch==='area'?.60:.30);
 return {angle:p.a+(type==='grenade'?Math.PI:0)+side*fan,distance:125};
}
