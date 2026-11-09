// Shared player-facing equipment copy. Runtime values are read from existing descriptions.
export const EQUIPMENT_COPY={
 "prototypeAmmo": [
  "발사체와 폭발·독가스 범위가 커집니다. 최고 속도가 줄어듭니다.",
  "Projectile size +50%, compatible rounds' hit radius and blast radius +30%, gas radius +40%. Top speed −6%."
 ],
 "steelCore": [
  "발사체가 관통합니다.",
  "Machine gun rounds pierce twice, retaining 70% of their remaining damage each time. Compatible bombs pierce once and explode at two locations, each for 70% of their original damage."
 ],
 "wingman": [
  "편대기 1기가 합류합니다. 출격당 2회 선택할 수 있으며, 상시 편대기는 최대 7기입니다.",
  "Permanent wingmen +1. At most 2 selections per sortie; 7 permanent wingmen total."
 ],
 "spread": ["기본 기관총 일제사격 +1발. 추가 최대 4발(총 5발). 일반 사격은 발사한 만큼 탄약을 소모합니다.", "Adds one round to the base MG volley, up to 4 extra (5 total). Normal fire spends ammo per round."],
 "precisionSynchronizer": [
  "같은 적을 6회 연속 맞히면 다음 탄환이 강해집니다.",
  "Hit the same target 6 times with your machine guns, with at most 1.5s between hits. The next MG round deals +25% damage. 3s cooldown."
 ],
 "directFuse": [
  "로켓·수류탄의 직격 피해가 늘고 폭발 피해가 줄어듭니다.",
  "Rocket/grenade direct-hit damage +25%; surrounding blast damage −15%."
 ],
 "fragmentationFuse": [
  "로켓·수류탄의 폭발 범위가 넓어지고 직격 피해가 줄어듭니다.",
  "Rocket/grenade blast radius +20%; direct-hit damage −10%."
 ],
 "inertiaRetainer": [
  "직진 후 급선회할 때 속도 손실이 줄어듭니다.",
  "Charge with 1s of straight flight. A hard turn preserves 50% of turning speed loss for 0.6s, without increasing top speed."
 ],
 "maneuverSpring": [
  "회피 후 잠시 선회력이 높아집니다.",
  "Turn rate +20% for 1.5s after evasion ends. 6s cooldown."
 ],
 "emergencyPlating": [
  "연속 피격 시 잠시 탄환 피해가 줄어듭니다.",
  "A second bullet hit within 2s reduces bullet damage by 18% for 1.5s, including that hit. 12s cooldown."
 ],
 "emergencyDope": [
  "출격당 1회, 내구도 25% 이하에서 최대 내구도의 12%를 회복합니다. 치명 피해에는 발동하지 않습니다.",
  "The first time durability drops to 25% or less, immediately restore 12% max durability. Once per sortie; cannot prevent lethal damage."
 ],
 "fighterSupply": ["상시 편대의 피해와 연사력이 증가합니다.", "Permanent wing damage increases by 35% and firing intervals decrease by 20%. Specialist wingmen use your equipment; ace wingmen are excluded."],
 "mercedesEngine": [
  "속도가 증가합니다. 직진하면 더 빨라집니다.",
  "Base flight speed +20%; 1.2s straight flight raises total speed to +55%. Hard turns reduce output over 0.75s."
 ],
 "combinedProjectiles": ["주무장과 쿠퍼 폭탄을 시간차로 발사합니다.", "Fires primary volleys and Cooper bombs in staggered bursts. Each shot uses your position and aim when it fires."],
 "amatolCharge": ["폭발 피해와 범위가 40% 증가하고 일반탄도 명중하면 폭발합니다. 화살 12발 묶음당 소폭발은 최대 3회, 같은 표적에는 1회만 발생합니다.", "Increases explosion damage and radius by 40%. Ordinary primary rounds gain small impact blasts. Each dart bundle can explode up to 3 times, once per target, without creating chain explosions."],
 "lufberyCircle": ["가까운 편대기가 엄호해 받는 피해가 줄어듭니다.", "Nearby permanent wingmen reduce your damage taken. Specialist wingmen circle their targets and provide less cover at a distance."],
 "redScarf": [
  "속도가 증가하고 적 후방을 더 쉽게 포착합니다.",
  "Speed +20%, or +35% while tail-locked. Pursuit range +25%, lock time −35%."
 ],
 "prancingHorse": [
  "속도가 증가하고 전방 피해를 덜 받습니다.",
  "Flight speed +20% and damage taken from the front −25%. The emblem appears only when the defense triggers."
 ],
 "ironCross": [
  "액티브가 강화되고 재사용 대기시간이 20% 줄어듭니다.",
  "Active cooldown is reduced by 20% and the ability is enhanced."
 ],
 "telescope": [
  "전방 표적을 향해 조준을 보정합니다.",
  "Focuses on enemies within roughly 21° forward and corrects aim by up to 17° during the first 0.8 seconds. Shows the correction path and target marker."
 ],
 "flightGloves": [
  "고속 급선회 후 1.5초간 근접 사격 간격이 30% 줄어듭니다. 사거리는 20% 줄며 무적 중에는 발동하지 않습니다.",
  "Primary range −20%; at 70% cruise speed, turn 45° within 1s and acquire a close enemy within the forward 45° arc for 30% shorter firing intervals for 1.5s. Cooldown: 3s; unavailable while invulnerable."
 ],
 "sparkPlug": [
  "내구도를 주기적으로 회복하고 수리품 효과를 높입니다.",
  "Restores 8% max durability every 10s; repair pickups add 12% once per 10s."
 ],
 "goeringBaton": [
  "편대기 3기가 합류하고 편대 피해가 증가합니다.",
  "Permanent wingmen +3 and wingman damage +25%."
 ],
 "immelmannManual": [
  "선회 기동을 더 자주 쓰고 기동 중 잠시 무적이 됩니다.",
  "Maneuver cooldown −50% and maneuver invulnerability lasts 1.05 seconds."
 ],
 "motorCannon": ["3초마다 비관통 37 mm 포탄을 자동 발사합니다. 직격 피해는 240이며, 주변에 직격 피해의 50%만큼 폭발 피해를 줍니다.", "Automatically fires a non-piercing 37 mm shell every 3 seconds for 240 damage. On impact, nearby enemies take 50% of its direct damage as blast damage; explosive upgrades apply."],
 "loEmblem": [
  "내구도가 절반으로 줄고 화력과 기동성이 높아집니다.",
  "Maximum durability −50%; machine-gun, explosive, and formation damage +50%; formation fire rate +30%; flight speed and turn rate +25%."
 ],
 "sacredCowling": [
  "근거리에서 더 큰 피해를 주고 탄환 피해를 덜 받습니다.",
  "Damage against nearby enemies +25%. Incoming bullet damage decreases by up to 20% as the attacker gets closer."
 ],
 "steelPlate": [
  "소구경 탄환 피해가 줄고 기동성이 낮아집니다.",
  "Machine-gun and small-caliber bullet damage taken −30%; flight speed and turn rate −10%."
 ],
 "mauserAceKiller": [
  "에이스와 정예를 우선 공격합니다.",
  "Every 0.65s, prioritize aces, elites, then ordinary enemies: damage 72/36/18, or 120/54 against aces/elites directly hit within 1.5s. Cockpit kills: 8% (aces: 2% after 12s); inherits 75% each of gun and explosive upgrades, capped at +150% damage."
 ],
 "boelckeDicta": [
  "경험치를 30% 더 얻습니다.",
  "Experience gain +30%, applied only to its owner in co-op."
 ],
 "rearGunner": ["주무장 총좌가 초당 약 66° 회전합니다. COW와 쿼드 루이스에도 적용됩니다.", "Rotates the primary turret at about 66° per second. Also applies to COW and Quad Lewis."],
 "quadLewis": ["주무장 발사 갈래가 3개 늘고 탄약 소모가 증가합니다.", "Adds three firing lanes to the primary weapon. Each fired round consumes ammunition."],
 "cow37": ["기관총을 비관통 37 mm 포로 교체합니다. 포탄은 명중하면 폭발하며 발사할 때마다 탄약을 소모합니다.", "Replaces the machine guns with a non-piercing 37 mm cannon. Shells explode on impact and consume ammunition when fired."],
 "rankinShell": ["후방 또는 COW·쿠퍼·갈고리에서 파편을 방출해 적을 공격하고 가벼운 적탄을 제거합니다. 중화기와 예고된 보스 공격은 제거하지 못합니다.","Releases shrapnel behind you or through COW, Cooper or hooks to damage enemies and clear bullets. Heavy and warned boss attacks cannot be cleared."],
 "grunkreuz": [
  "독가스에 면역이 되고 후방과 쿠퍼·갈고리에서 가스를 뿌립니다. 지원폭격·폭격 액티브·전술 후속탄은 착탄 지점에 3초간 가스를 남깁니다. 같은 주인의 가스 피해는 중첩되지 않습니다.",
  "Gas immunity and rear venting. Cooper and hooks carry gas; support bombing, bombing actives and tactical follow-ups also leave 3-second gas fields on impact. Overlapping payload gas fields from the same owner do not stack damage. Rear venting lasts 4.5s with a 7s recharge, reduced by Active cooldown bonuses."
 ],
 "kaiserFog": [
  "주기적으로 연막에 숨어 적의 추적을 끊습니다.",
  "Every 12 seconds, hides the aircraft in smoke for 3 seconds, excluding it from enemy targeting and resetting aggression."
 ],
 "fogCompass": [
  "멀리 있는 경험치와 수리품을 끌어당깁니다.",
  "Attracts distant experience and repair supplies. Repair supplies can be collected from farther away than experience."
 ],
 "maximBelt": [
  "기관총 피해와 탄띠 용량이 늘고 재장전이 빨라집니다.",
  "Machine-gun damage bonus +25 percentage points, belt capacity +75% and reload time −35%."
 ],
 "urLeica": ["출격 종료 시 격추 기록이 10% 증가합니다.", "Increases the final kill record by 10% at the end of the sortie."],
 "badinGauge": [
  "직진으로 얻은 추가 속도가 무장 피해를 높입니다.",
  "After 1.2s of straight flight, convert 75% of sustained speed gains into gun/explosive damage, up to +30%. This fades over 0.75s during hard turns; Mercedes output counts, but dodges, charges and brief boosts do not."
 ],
 "heineckeRettungsfallschirm": [
  "치명 피해를 받으면 예비기로 재출격합니다. 출격당 2회, 재사용 대기시간은 180초입니다.",
  "Escape lethal damage and return in a reserve aircraft. Two escapes per sortie, with a 180-second cooldown."
 ],
 "aceWingman": [
  "무작위 아군 에이스가 합류합니다.",
  "One random allied ace joins, firing machine guns and a random additional weapon while scaling with your aircraft and formation upgrades."
 ],
 "buckinghamBelt": ["기관총과 폭발물로 적에게 불을 붙입니다.", "Three gun hits ignite. Darts, shells, hooks and blasts from support bombing, bombing actives and tactical follow-ups also ignite targets for burn-based skills. Burns scale with their weapon, refresh to 3s on another owned incendiary hit, and do not stack."],
 "cooperRack": ["전방에 폭탄 2발을 투하합니다. 장착한 탄두 효과가 적용됩니다.", "Drops two bombs at forward targets every 4 seconds. Carries the effects of equipped fire, dart, gas, smoke and shrapnel equipment."],
 "fieryGrapnel": ["가까운 적에게 폭발하는 화염 갈고리를 붙입니다.", "A close flyby attaches a burning hook and delivers one ready Cooper bomb or shrapnel/gas charge. If the target is destroyed first, the attached payload detonates once at its last position."],
 "flechettes": ["기관총을 유지하며 3초마다 관통 화살 12발을 별도로 발사합니다. 독립 화살은 기관총 성장을, COW·쿠퍼에 실린 화살은 운반 무장의 성장을 반영합니다.", "Keeps machine guns and fires separate bursts of 12 piercing darts every 3 seconds. COW shells and Cooper bombs also carry darts, scaling with their carrier weapon. Combines with incendiary and Amatol equipment."],
 "veryPistol": [
  "9초마다 표적을 지정해 6초간 편대가 집중 공격합니다. 표적을 잃으면 한 번 재지정하며, 재장전 중인 주인을 준비된 특수무장 편대기가 자기 탄약으로 엄호합니다.",
  "Every 9s, mark a forward target for 6s of wing focus, retargeting once if lost. Wimperis also prioritizes the designation. Ready specialist wingmen cover your reload using their own ammunition."
 ],
 "hytheCamera": [
  "3회 연속 명중한 표적에 6초간 사격 피해가 30% 증가합니다. COW도 적용되며 쿼드 일제사격은 1회로 셉니다. 망원경·폰크·윔페리스는 분석한 표적을 우선합니다.",
  "Three consecutive primary hits analyze a target for 6s, adding 30% direct-fire damage. Includes COW; a quad volley counts once. Reveals attack preparation; telescope aim, Fonck's fire and Wimperis prioritize the analyzed target."
 ],
 "strutterAirbrake": [
  "선회 기동이 감속 후 급선회로 바뀝니다.",
  "Turns fighter evasion into a brake turn, slowing briefly before reaccelerating. Cannot be equipped with an airframe conversion."
 ],
 "wimperisSight": [
  "이동 표적의 예상 위치에 폭발물을 조준합니다. 베리 지정 표적과 하이스 분석 표적을 차례로 우선하며, 발사 후 유도나 추가 발사체는 추가되지 않습니다.",
  "Aims rockets, grenades and dropped bombs at a moving target’s predicted position when released. Within aiming limits, prioritizes Very designations, then Hythe analysis. Does not add homing or extra projectiles."
 ],
 "bomberTransfer": [
  "중폭격기로 전환해 폭격과 후방 사격을 합니다. 내구도가 늘고 속도·선회력이 줄며, 다른 기체 전환과 함께 장착할 수 없습니다.",
  "Become a heavy bomber with bombs every 4.5–4.8s, a rear gunner and defensive barrage instead of maneuver. Durability ×3.2–3.5 (cap 480–520), speed −20–24%, turn −34–38%, larger target; retains explosive upgrades and excludes other airframe conversions."
 ],
 "mgTransfer": [
  "중무장기로 전환해 추적 기관총 2정을 사용합니다. 내구도가 늘고 속도·선회력이 줄며, 다른 기체 전환과 함께 장착할 수 없습니다.",
  "Become a gunship with two tracking guns, +40% forward damage, double durability (cap 360), retained rear gunner and an interception barrage instead of maneuver. Speed −14%, turn −22%, larger target; excludes other airframe conversions."
 ],
 "airshipTransfer": [
  "비행선으로 전환하고 호위기 3기가 합류합니다. 내구도가 늘고 속도·선회력이 줄며, 다른 기체 전환과 함께 장착할 수 없습니다.",
  "Become an airship with three escorts (seven total), +35% formation damage, quadruple durability (cap 600), retained formation upgrades and an AA barrage instead of maneuver. Speed −38%, turn −50%, much larger target; excludes other airframe conversions."
 ]
};
const VARIABLE_IDS=new Set(['damage','rate','rockets','mines','explosives','command','turn','armor','regen','cooldown','bomber']);
export function conciseEquipmentDescription(id,raw,locale='ko',translated=raw){
 const en=locale==='en',copy=EQUIPMENT_COPY[id];
 if(copy)return copy[en?1:0];
 if(!VARIABLE_IDS.has(id))return translated;
 const text=String(raw||''),n=[...text.matchAll(/[−+]?\d+(?:\.\d+)?/g)].map(m=>m[0].replace(/^[−+]/,''));
 const first=n[0];if(!first)return translated;
 // Already formatted text keeps its exact values on repeated UI passes.
 if((en&&/^(?:Machine-gun damage|Firing interval|Add (?:one|1)|Explosive damage|Wingman and formation|Turn rate|Maximum durability|Restore|Active cooldown|(?:A|1) bomber drops)/.test(text))||(!en&&/(?:증가합니다|줄어듭니다|강화됩니다|늘어납니다|회복합니다|투하합니다)/.test(text)&&!text.includes('중복 시')))return translated;
 switch(id){
 case 'damage':return en?`Machine-gun damage increases by ${first}%.`:`기관총 피해가 ${first}% 증가합니다.`;
 case 'rate':return en?`Firing interval decreases by ${first}%, down to 0.045s.`:`기관총 발사 간격이 ${first}% 줄어듭니다. 최소 간격은 0.045초입니다.`;
 case 'rockets':case 'mines':{
 const extra=text.match(/폭발물 피해 \+([\d.]+)%p/),bonus=extra?(en?` Explosive damage +${extra[1]} percentage points.`:` 폭발물 피해 증가량이 ${extra[1]}%p 늘어납니다.`):'';
 return (id==='rockets'?(en?'Add 1 rocket-launcher level, up to 5.':'로켓 발사대가 1단계 강화됩니다(최대 5단계).'):(en?'Add 1 rear grenade per deployment, up to 5.':'후방 수류탄 투척 수가 1개 늘어납니다(최대 5개).'))+bonus;}
 case 'explosives':{const m=text.match(/피해 \+([\d.]+)%p/);if(!m)return translated;return en?`Explosive damage increases by ${m[1]} percentage points.`:`폭발물 피해 증가량이 ${m[1]}%p 늘어납니다.`;}
 case 'command':return en?`Wingman and formation Active damage +${n[0]} percentage points; fire rate +${n[1]} percentage points. Total manual bonuses are capped at +150% damage and +50% fire rate.`:`편대기·편대 액티브의 피해 증가량이 ${n[0]}%p, 연사 증가량이 ${n[1]}%p 늘어납니다. 교범 누적 증가량은 각각 150%, 50%까지 적용됩니다.`;
 case 'turn':return en?`Turn rate +${n[0]}%, speed +${n[1]}%, straight-flight recovery +${n[2]}%. Total bonuses are capped at +150%, +40% and +60%, respectively.`:`선회력 ${n[0]}%, 속도 ${n[1]}%, 직선 비행 회복이 ${n[2]}% 증가합니다. 누적 증가량은 각각 150%, 40%, 60%까지 적용됩니다.`;
 case 'armor':return en?`Maximum durability increases by ${first}; restore the actual increase immediately. Hull upgrades add at most 180 durability.`:`최대 내구도가 ${first} 증가하고 실제 증가량만큼 회복합니다. 동체 강화로 얻는 내구도는 최대 180입니다.`;
 case 'regen':return en?`Restore an extra ${first}% of maximum durability per second, up to 4% total.`:`초당 최대 내구도 회복량이 ${first}%p 증가합니다(누적 최대 4%).`;
 case 'cooldown':return en?`Active cooldown decreases by ${first}%, down to 50% of its base duration.`:`액티브 재사용 대기시간이 ${first}% 줄어듭니다(기본의 50%까지).`;
 case 'bomber':return en?`1 bomber drops 5 bombs every ${first}s. Each repeat reduces the interval by 2s, down to 10s.`:`${first}초마다 폭격기 1대가 폭탄 5발을 투하합니다. 중복 획득 시 주기가 2초 줄어듭니다(최소 10초).`;
 }
 return translated;
}
// Selection summaries prioritize the decision and its main cost, not a full parameter sheet.
export const EQUIPMENT_CHOICE_COPY={
 "ironCross": ["액티브 강화 · 재사용 대기 −20%.", "Upgraded Active · cooldown −20%."],
 "cooperRack": ["전방에 폭탄 2발을 투하합니다. 장착한 탄두 효과가 적용됩니다.", "Drops 2 bombs every 4s, carrying equipped payloads."],
 "buckinghamBelt": ["기관총과 폭발물로 적에게 불을 붙입니다.", "Three gun hits ignite; burns scale with weapon growth."],
 "spread": ["기관총 +1발(총 5발). 탄약 소모 증가.", "MG volley +1 (5 total max). Uses extra ammo."],
 "flightGloves": [
  "고속 급선회 후 근접 연사가 빨라집니다. 사거리가 줄어듭니다.",
  "Fast turns boost close fire. Primary range −20%."
 ],
 "mauserAceKiller": [
  "에이스와 정예를 우선 공격합니다.",
  "Auto-fires at aces first; stronger after your hits."
 ],
 "cow37": ["주무장을 폭발탄을 쏘는 37 mm 기관포로 교체합니다.", "Replaces guns with an ammo-consuming, non-piercing 37 mm cannon."],
 "grunkreuz": [
  "독가스에 면역이 되고 후방과 폭격 지점에 가스를 뿌립니다.",
  "Gas immunity; bombing and tactical follow-ups leave gas."
 ],
 "badinGauge": [
  "직진으로 얻은 추가 속도가 무장 피해를 높입니다.",
  "Straight flight: speed gains add damage, up to 30%. No brief boosts."
 ],
 "flechettes": ["주무장과 별도로 관통 화살을 발사합니다.", "Keeps machine guns and fires separate bursts of 12 piercing darts every 3 seconds."],
 "hytheCamera": [
  "3회 연속 명중한 표적에 사격 피해가 증가합니다.",
  "3 hits: +30% direct fire; shares analysis with Wimperis."
 ],
 "bomberTransfer": ["중폭격기로 전환해 폭격과 후방 사격을 합니다.", "Becomes a slow bomber with bombs and rear fire. No other conversions."],
 "mgTransfer": ["중무장기로 전환해 추적 기관총 2정을 사용합니다.", "Becomes a slow gunship with two tracking guns. No other conversions."],
 "airshipTransfer": ["비행선으로 전환하고 호위기 3기가 합류합니다.", "Becomes a slow airship with three escorts. No other conversions."],
 "wingman": ["편대기 +1(총 7기). 출격당 2회.", "Wingman +1 (7 total max). Twice per sortie."],
 "precisionSynchronizer": ["같은 적을 6회 연속 맞히면 다음 탄환이 강해집니다.", "Six consecutive same-target hits boost the next round 25%."],
 "directFuse": ["로켓·수류탄의 직격 피해가 늘고 폭발 피해가 줄어듭니다.", "Rocket/grenade hits deal 25% more; splash deals 15% less."],
 "fragmentationFuse": ["로켓·수류탄의 폭발 범위가 넓어지고 직격 피해가 줄어듭니다.", "Rocket/grenade blast radius +20%; direct-hit damage −10%."],
 "inertiaRetainer": [
  "직진 후 급선회할 때 속도 손실이 줄어듭니다.",
  "1s straight, then turn: half speed loss for 0.6s."
 ],
 "emergencyPlating": ["연속 피격 시 잠시 탄환 피해가 줄어듭니다.", "Repeated hits cut bullet damage 18% for 1.5s."],
 "emergencyDope": ["내구도 25% 이하에서 한 번 회복합니다.", "Once a sortie, repairs 12% at 25% HP unless lethal."],
 "fighterSupply": ["상시 편대의 피해와 연사력이 증가합니다.", "Wing damage rises 35%; fire intervals drop 20%. Excludes aces."],
 "mercedesEngine": ["속도가 증가합니다. 직진하면 더 빨라집니다.", "Speed rises 20%, reaching 55% in straight flight."],
 "combinedProjectiles": ["주무장과 쿠퍼 폭탄을 시간차로 발사합니다.", "Fires primary volleys and Cooper bombs in staggered bursts."],
 "amatolCharge": ["폭발이 강해지고 일반탄도 명중하면 폭발합니다.", "Blast damage and radius rise 40%. Ordinary rounds also explode."],
 "lufberyCircle": ["가까운 편대기가 엄호해 받는 피해가 줄어듭니다.", "Nearby permanent wingmen reduce your damage taken."],
 "redScarf": ["속도가 증가하고 적 후방을 더 쉽게 포착합니다.", "Speed +20%, or +35% tailing; easier tail lock."],
 "prancingHorse": ["속도가 증가하고 전방 피해를 덜 받습니다.", "Speed rises 20%; damage taken from the front drops 25%."],
 "telescope": [
  "전방 표적을 향해 조준을 보정합니다.",
  "Brief forward aim correction; analyzed targets first."
 ],
 "sparkPlug": ["내구도를 주기적으로 회복하고 수리품 효과를 높입니다.", "Repairs 8% every 10s. Pickups repair 12% extra, once per 10s."],
 "immelmannManual": ["선회 기동을 더 자주 쓰고 기동 중 잠시 무적이 됩니다.", "Halves maneuver cooldown; grants 1.05s invulnerability."],
 "motorCannon": ["폭발하는 37 mm 포탄을 자동 발사합니다.", "Fires blast shells every 3s. Does not pierce."],
 "loEmblem": ["내구도가 절반으로 줄고 화력과 기동성이 높아집니다.", "Halves HP; boosts damage, wing fire rate and agility."],
 "sacredCowling": ["근거리에서 더 큰 피해를 주고 탄환 피해를 덜 받습니다.", "Close damage rises 25%; nearby bullet damage taken drops up to 20%."],
 "steelPlate": ["소구경 탄환 피해가 줄고 기동성이 낮아집니다.", "Small-caliber damage taken drops 30%; speed and turning drop 10%."],
 "rearGunner": ["주무장 총좌가 회전합니다.", "Rotates the primary turret, including COW and Quad Lewis."],
 "quadLewis": ["주무장 발사 갈래가 3개 늘고 탄약 소모가 증가합니다.", "Adds three primary firing lanes. Each round consumes ammunition."],
 "rankinShell": ["파편으로 적을 공격하고 가벼운 적탄을 제거합니다.", "Shrapnel clears light rounds, not boss warning attacks."],
 "kaiserFog": [
  "주기적으로 연막에 숨어 적의 추적을 끊습니다.",
  "Break enemy tracking for 3s every 12s."
 ],
 "fogCompass": [
  "멀리 있는 경험치와 수리품을 끌어당깁니다.",
  "Attracts distant XP and repairs; repairs reach farther."
 ],
 "maximBelt": ["기관총 피해와 탄띠 용량이 늘고 재장전이 빨라집니다.", "Boosts gun damage and belt capacity; cuts reload time by 35%."],
 "urLeica": ["출격 종료 시 격추 기록이 10% 증가합니다.", "Increases the final kill record by 10% at the end of the sortie."],
 "heineckeRettungsfallschirm": ["치명 피해를 받으면 예비기로 재출격합니다.", "Escapes lethal damage: two relaunches per sortie, 180s cooldown."],
 "aceWingman": [
  "무작위 아군 에이스가 합류합니다.",
  "A random allied ace provides machine-gun and secondary weapon support."
 ],
 "fieryGrapnel": ["가까운 적에게 폭발하는 화염 갈고리를 붙입니다.", "A close flyby attaches fire. Attached payloads survive target loss."],
 "veryPistol": [
  "지정한 적을 편대가 집중 공격하고 재장전을 엄호합니다.",
  "Focus fire for 6s every 9s; ready specialist wings cover reloads."
 ],
 "strutterAirbrake": [
  "선회 기동이 감속 후 급선회로 바뀝니다.",
  "Brake, turn, reaccelerate. No airframe conversions."
 ],
 "wimperisSight": [
  "이동 표적의 예상 위치에 폭발물을 조준합니다.",
  "Predictive ordnance aim; prioritizes Very and Hythe targets."
 ]
};
export function conciseEquipmentChoice(id,description,locale='ko'){
 const en=locale==='en',n=[...String(description||'').matchAll(/\d+(?:\.\d+)?/g)].map(m=>m[0]);
 if(n.length)switch(id){
 case 'rate':return en?`Fire interval −${n[0]}% (min 0.045s).`:`발사 간격 −${n[0]}% (최소 0.045초).`;
 case 'armor':return en?`Hull +${n[0]} HP (cap +180). Heals the gain.`:`동체 +${n[0]} HP (상한 +180). 증가량 회복.`;
 case 'command':return en?`Formation damage +${n[0]}pp (cap +150%). Fire rate +${n[1]}pp (cap +50%).`:`편대 피해 +${n[0]}%p(상한 +150%). 연사 +${n[1]}%p(상한 +50%).`;
 case 'turn':return en?`Turn +${n[0]}%, speed +${n[1]}%, recovery +${n[2]}%. Caps: +150% / +40% / +60%.`:`선회 +${n[0]}%, 속도 +${n[1]}%, 회복 +${n[2]}%. 상한 +150% / +40% / +60%.`;
 case 'regen':return en?`Repairs ${n[0]}% more max HP per second, up to 4%.`:`초당 내구도 회복량이 ${n[0]}%p 늘어납니다(최대 4%).`;
 case 'cooldown':return en?`Active cooldown −${n[0]}% (min 50% of base).`:`액티브 재사용 대기 −${n[0]}% (기본의 최소 50%).`;
 case 'bomber':{const t=en?(String(description).match(/every ([\d.]+)s/)?.[1]||n[0]):n[0];return en?`5 bombs every ${t}s (min 10s).`:`${t}초마다 폭탄 5발 (최소 10초).`;}
 case 'rockets':case 'mines':{const bonus=String(description).match(/(?:증가량이 |damage \+|damage increases by )([\d.]+)(?:%p| percentage points)/);return en?`${id==='rockets'?'Adds 1 rocket level':'Adds 1 grenade'} (max 5).${bonus?` Blast damage gains ${bonus[1]}pp.`:''}`:`${id==='rockets'?'로켓이 1단계 강화됩니다':'수류탄이 1개 늘어납니다'}(최대 5).${bonus?` 폭발 피해가 ${bonus[1]}%p 늘어납니다.`:''}`;}
 }
 return EQUIPMENT_CHOICE_COPY[id]?.[en?1:0]||conciseEquipmentDescription(id,description,locale,description);
}
