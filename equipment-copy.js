// Shared player-facing equipment copy. Runtime values are read from existing descriptions.
export const EQUIPMENT_COPY={
 "wingman": [
  "상시 편대기 1기가 합류합니다. 출격당 2회, 전체 편대는 최대 7기까지 가능합니다.",
  "Permanent wingmen +1. At most 2 selections per sortie; 7 permanent wingmen total."
 ],
 "spread": ["주무장의 추가탄이 1발 늘어납니다(최대 5발). 발사한 탄환마다 탄약을 소모합니다.", "Adds one primary round, up to five extra rounds. Each fired round consumes ammunition."],
 "precisionSynchronizer": [
  "1.5초 간격 안에 같은 적에게 기관총을 6회 연속 맞히면 다음 탄환 피해가 25% 증가합니다. 재발동 대기시간은 3초입니다.",
  "Hit the same target 6 times with your machine guns, with at most 1.5s between hits. The next MG round deals +25% damage. 3s cooldown."
 ],
 "directFuse": [
  "로켓·수류탄의 직접 피해가 25% 증가하고 주변 폭발 피해가 15% 감소합니다.",
  "Rocket/grenade direct-hit damage +25%; surrounding blast damage −15%."
 ],
 "fragmentationFuse": [
  "로켓·수류탄의 폭발 반경이 20% 증가하고 직접 피해가 10% 감소합니다.",
  "Rocket/grenade blast radius +20%; direct-hit damage −10%."
 ],
 "inertiaRetainer": [
  "1초간 직진한 뒤 급선회하면 0.6초간 선회 속도 손실이 절반으로 줄어듭니다. 최고속도는 변하지 않습니다.",
  "Charge with 1s of straight flight. A hard turn preserves 50% of turning speed loss for 0.6s, without increasing top speed."
 ],
 "maneuverSpring": [
  "회피 후 1.5초간 선회력이 20% 증가합니다. 재사용 대기시간은 6초입니다.",
  "Turn rate +20% for 1.5s after evasion ends. 6s cooldown."
 ],
 "emergencyPlating": [
  "2초 안에 다시 탄환에 맞으면 그 피격부터 1.5초간 탄환 피해가 18% 감소합니다. 재발동 대기시간은 12초입니다.",
  "A second bullet hit within 2s reduces bullet damage by 18% for 1.5s, including that hit. 12s cooldown."
 ],
 "emergencyDope": [
  "내구도가 처음 25% 이하가 되면 최대 내구도의 12%를 회복합니다. 출격당 1회이며 치명 피해에는 발동하지 않습니다.",
  "The first time durability drops to 25% or less, immediately restore 12% max durability. Once per sortie; cannot prevent lethal damage."
 ],
 "fighterSupply": ["상시 편대의 피해가 35% 증가하고 발사 간격이 20% 줄어듭니다. 특수무장 편대기가 보유 장비로 엄호하며 에이스 윙맨은 제외됩니다.", "Permanent wing damage increases by 35% and firing intervals decrease by 20%. Specialist wingmen use your equipment; ace wingmen are excluded."],
 "mercedesEngine": [
  "기본 속도가 20% 증가하며 1.2초간 직진하면 총 55%까지 증가합니다. 급선회하면 0.75초에 걸쳐 추가 출력이 줄어듭니다.",
  "Base flight speed +20%; 1.2s straight flight raises total speed to +55%. Hard turns reduce output over 0.75s."
 ],
 "combinedProjectiles": ["주무장과 쿠퍼 폭탄을 한꺼번에 쏘지 않고 시간차로 발사합니다. 각 탄환은 발사 순간의 기체 위치와 조준 방향을 따릅니다.", "Fires primary volleys and Cooper bombs in staggered bursts. Each shot uses your position and aim when it fires."],
 "amatolCharge": ["폭발 피해와 반경이 40% 증가합니다. 일반 주무장 탄환에도 작은 착탄 폭발을 추가합니다. 화살은 한 묶음당 최대 3회, 같은 표적에는 1회만 폭발하며 연쇄 폭발을 만들지 않습니다.", "Increases explosion damage and radius by 40%. Ordinary primary rounds gain small impact blasts. Each dart bundle can explode up to 3 times, once per target, without creating chain explosions."],
 "lufberyCircle": ["가까운 상시 편대기가 본기를 엄호해 피해를 줄입니다. 특수무장 편대기는 표적을 돌며 공격하고, 멀어지면 엄호 효과가 줄어듭니다.", "Nearby permanent wingmen reduce your damage taken. Specialist wingmen circle their targets and provide less cover at a distance."],
 "redScarf": [
  "속도가 20%, 후방 추적 중에는 총 35% 증가합니다. 추적 거리는 25% 늘고 포착 시간은 35% 줄어듭니다.",
  "Speed +20%, or +35% while tail-locked. Pursuit range +25%, lock time −35%."
 ],
 "prancingHorse": [
  "속도가 20% 증가하고 전방에서 받는 피해가 25% 감소합니다.",
  "Flight speed +20% and damage taken from the front −25%. The emblem appears only when the defense triggers."
 ],
 "ironCross": [
  "액티브 쿨타임이 20% 줄고 강화됩니다.",
  "Active cooldown is reduced by 20% and the ability is enhanced."
 ],
 "telescope": [
  "전방 약 21° 안의 표적을 포착하면 0.8초간 최대 17°까지 조준을 보정합니다. 하이스 분석 표적을 우선합니다.",
  "Focuses on enemies within roughly 21° forward and corrects aim by up to 17° during the first 0.8 seconds. Shows the correction path and target marker."
 ],
 "flightGloves": [
  "주무장 사거리가 20% 줄며, 순항속도 70% 이상에서 1초 안에 45° 선회 후 전방 45°의 근접 적을 포착하면 1.5초간 발사 간격이 30% 줄어듭니다. 재사용 3초이며 무적 중에는 발동하지 않습니다.",
  "Primary range −20%; at 70% cruise speed, turn 45° within 1s and acquire a close enemy within the forward 45° arc for 30% shorter firing intervals for 1.5s. Cooldown: 3s; unavailable while invulnerable."
 ],
 "sparkPlug": [
  "10초마다 최대 내구도의 8%를 회복합니다. 수리품 회수 시 12%를 추가 회복하며 추가 회복은 10초마다 가능합니다.",
  "Restores 8% max durability every 10s; repair pickups add 12% once per 10s."
 ],
 "goeringBaton": [
  "상시 편대기 3기가 합류하고 편대기 피해가 25% 증가합니다.",
  "Permanent wingmen +3 and wingman damage +25%."
 ],
 "immelmannManual": [
  "선회기동 쿨타임이 50% 줄고 기동 중 1.05초간 무적이 됩니다.",
  "Maneuver cooldown −50% and maneuver invulnerability lasts 1.05 seconds."
 ],
 "motorCannon": ["3초마다 피해 240의 비관통 37mm 포탄을 자동 발사합니다. 명중하면 주변 적에게 직격 피해의 50%만큼 폭발 피해를 주며 폭발물 강화가 적용됩니다.", "Automatically fires a non-piercing 37mm shell every 3 seconds for 240 damage. On impact, nearby enemies take 50% of its direct damage as blast damage; explosive upgrades apply."],
 "loEmblem": [
  "최대 내구도가 50% 줄고 기관총·폭발물·편대 피해가 50% 증가합니다. 편대 연사는 30%, 속도와 선회력은 25% 증가합니다.",
  "Maximum durability −50%; machine-gun, explosive, and formation damage +50%; formation fire rate +30%; flight speed and turn rate +25%."
 ],
 "sacredCowling": [
  "근거리 피해가 25% 증가합니다. 가까운 적에게 받는 탄환 피해가 최대 20% 감소합니다.",
  "Damage against nearby enemies +25%. Incoming bullet damage decreases by up to 20% as the attacker gets closer."
 ],
 "steelPlate": [
  "기관총·소구경 피해가 30% 감소합니다. 속도와 선회력은 10% 감소합니다.",
  "Machine-gun and small-caliber bullet damage taken −30%; flight speed and turn rate −10%."
 ],
 "mauserAceKiller": [
  "0.65초마다 에이스→정예→일반 순으로 공격하며 피해는 일반 18·정예 36·에이스 72, 최근 1.5초 내 직접 맞힌 정예 54·에이스 120입니다. 조종석 격추확률 8%(에이스는 등장 12초 후 2%)이며 기관총·폭발물 강화의 75%씩을 합산해 최대 150% 추가 피해를 줍니다.",
  "Every 0.65s, prioritize aces, elites, then ordinary enemies: damage 72/36/18, or 120/54 against aces/elites directly hit within 1.5s. Cockpit kills: 8% (aces: 2% after 12s); inherits 75% each of gun and explosive upgrades, capped at +150% damage."
 ],
 "boelckeDicta": [
  "경험치 획득량이 30% 증가합니다. 협동에서는 본인에게만 적용됩니다.",
  "Experience gain +30%, applied only to its owner in co-op."
 ],
 "rearGunner": ["주무장 총좌가 초당 약 66°씩 회전합니다. COW 포와 쿼드 루이스에도 적용됩니다.", "Rotates the primary turret at about 66° per second. Also applies to COW and Quad Lewis."],
 "quadLewis": ["주무장 발사 갈래가 3개 늘어납니다. 발사한 탄환마다 탄약을 소모합니다.", "Adds three firing lanes to the primary weapon. Each fired round consumes ammunition."],
 "cow37": ["기관총을 비관통 37mm 포로 교체합니다. 포탄은 명중하면 폭발하며 발사할 때마다 탄약을 소모합니다.", "Replaces the machine guns with a non-piercing 37mm cannon. Shells explode on impact and consume ammunition when fired."],
 "rankinShell": ["후방이나 COW·쿠퍼·갈고리에서 파편을 퍼뜨려 공격하고 적탄을 제거합니다. 중탄과 보스 경고 공격은 제거하지 못합니다.","Releases shrapnel behind you or through COW, Cooper or hooks to damage enemies and clear bullets. Heavy and warned boss attacks cannot be cleared."],
 "grunkreuz": [
  "독가스에 면역이 되고 4.5초간 0.35초마다 후방으로 가스를 분출하며, 가스는 3초간 남아 0.6초마다 최대 내구도의 9% 피해를 줍니다. 충전은 7초이며 분출·충전시간에 액티브 쿨타임 감소가 최대 50% 적용됩니다.",
  "Become gas-immune and vent gas every 0.35s for 4.5s; clouds last 3s and deal 9% of your maximum durability every 0.6s. Recharge: 7s; Active cooldown reductions shorten venting and recharge by up to 50%."
 ],
 "kaiserFog": [
  "12초마다 3초간 연막에 숨어 적의 추적을 끊습니다.",
  "Every 12 seconds, hides the aircraft in smoke for 3 seconds, excluding it from enemy targeting and resetting aggression."
 ],
 "fogCompass": [
  "먼 경험치와 수리품을 끌어당깁니다. 수리품은 더 먼 거리에서 회수합니다.",
  "Attracts distant experience and repair supplies. Repair supplies can be collected from farther away than experience."
 ],
 "maximBelt": [
  "기관총 피해 증가량이 25%p, 탄띠 용량이 75% 늘어납니다. 재장전 시간은 35% 줄어듭니다.",
  "Machine-gun damage bonus +25 percentage points, belt capacity +75% and reload time −35%."
 ],
 "urLeica": ["출격 종료 시 격추 기록이 10% 증가합니다.", "Increases the final kill record by 10% at the end of the sortie."],
 "badinGauge": [
  "직진 1.2초로 지속 속도 증가분의 75%를 기관총·폭발물 피해로 전환하며 최대 30% 증가합니다. 급선회 시 0.75초에 감소하고 메르세데스 출력은 반영하지만 회피·돌진·순간가속은 제외합니다.",
  "After 1.2s of straight flight, convert 75% of sustained speed gains into gun/explosive damage, up to +30%. This fades over 0.75s during hard turns; Mercedes output counts, but dodges, charges and brief boosts do not."
 ],
 "heineckeRettungsfallschirm": [
  "치명 피해를 받으면 예비기로 재출격합니다. 출격당 2회, 재사용 대기시간은 180초입니다.",
  "Escape lethal damage and return in a reserve aircraft. Two escapes per sortie, with a 180-second cooldown."
 ],
 "aceWingman": [
  "아군 에이스 1명이 무작위로 합류합니다. 주력 무장과 반대 계열로 엄호하며 기체 성장에 따라 강해집니다.",
  "One random allied ace joins, covering you with machine guns or rockets opposite your main weapon and growing stronger with your aircraft."
 ],
 "buckinghamBelt": ["기관총을 3회 맞히면 적에게 불을 붙입니다. 화살·포탄·폭탄·갈고리에도 적용됩니다. 화상은 해당 무장의 성장에 따라 강해지며 본인의 소이 공격 재명중 시 3초로 갱신됩니다. 화상 피해는 중첩되지 않습니다.", "Three machine-gun hits ignite the target. Darts, shells, bombs and hooks also carry fire. Burns scale with their weapon and refresh to 3s on another incendiary hit by the same owner; burn damage does not stack."],
 "cooperRack": ["4초마다 전방 표적에 폭탄 2발을 투하합니다. 보유한 소이·화살·가스·연막·파편 장비의 효과도 전달합니다.", "Drops two bombs at forward targets every 4 seconds. Carries the effects of equipped fire, dart, gas, smoke and shrapnel equipment."],
 "fieryGrapnel": ["근접 명중으로 화염 갈고리를 부착하고 준비된 쿠퍼 폭탄 1발이나 파편·가스를 전달합니다. 표적이 먼저 격추돼도 부착한 폭약은 마지막 위치에서 한 번 폭발합니다.", "A close flyby attaches a burning hook and delivers one ready Cooper bomb or shrapnel/gas charge. If the target is destroyed first, the attached payload detonates once at its last position."],
 "flechettes": ["기관총을 유지하며 3초마다 관통 화살 12발을 별도로 발사합니다. COW 포탄·쿠퍼 폭탄에도 실리며 각 운반 무장의 성장을 따릅니다. 소이·아마톨 장비와도 연계됩니다.", "Keeps machine guns and fires separate bursts of 12 piercing darts every 3 seconds. COW shells and Cooper bombs also carry darts, scaling with their carrier weapon. Combines with incendiary and Amatol equipment."],
 "veryPistol": [
  "9초마다 최근 맞힌 전방 표적을 우선 지정해 6초간 집중 공격합니다. 표적 소실 시 한 번 재지정합니다. 본기가 재장전할 때 준비된 특수무장 편대기가 자기 탄약으로 엄호 사격합니다.",
  "Every 9 s, prioritize a recently hit forward target for 6 s of focused fire, retargeting once if lost. When you reload, ready specialist wingmen cover the marked target using their own ammunition."
 ],
 "hytheCamera": [
  "전방·후방 주무장 각각 3회 연속 명중으로 표적을 6초간 분석해 직접 사격 피해가 30% 증가합니다. COW 주포에도 적용되며 쿼드 일제사격은 1회로 셉니다. 적의 공격 준비가 표시되고 망원경·폰크 사격이 분석 표적을 우선합니다.",
  "Three consecutive primary hits analyze a target for 6s, increasing direct-fire damage by 30%. Includes COW; a quad volley counts once. Reveals attack preparation; telescope aim and Fonck fire prioritize analyzed targets."
 ],
 "strutterAirbrake": [
  "선회기동이 감속 후 재가속하는 급선회로 바뀝니다. 기체 전환 장비와 함께 장착할 수 없습니다.",
  "Turns fighter evasion into a brake turn, slowing briefly before reaccelerating. Cannot be equipped with an airframe conversion."
 ],
 "wimperisSight": [
  "로켓·수류탄·폭탄을 발사할 때 이동 표적의 예상 위치를 조준합니다. 발수나 발사 후 유도는 추가되지 않습니다.",
  "Aims rockets, grenades and dropped bombs at a moving target’s predicted position when released. Does not add homing or extra projectiles."
 ],
 "bomberTransfer": [
  "중폭격기로 바뀌어 4.5~4.8초마다 융단·집중폭격을 하고 후방 사수가 합류하며, 선회기동은 방어탄막으로 바뀝니다. 내구도 3.2~3.5배(최대 480~520)·속도 20~24%감소·선회 34~38%감소·피탄면적 증가가 적용되고 폭발물 강화는 유지되며 다른 기체 전환과 함께 장착할 수 없습니다.",
  "Become a heavy bomber with bombs every 4.5–4.8s, a rear gunner and defensive barrage instead of maneuver. Durability ×3.2–3.5 (cap 480–520), speed −20–24%, turn −34–38%, larger target; retains explosive upgrades and excludes other airframe conversions."
 ],
 "mgTransfer": [
  "중무장기로 바뀌어 추적 기관총 2정·전방 피해 40%증가·내구도 2배(최대 360)를 얻고 후방 사수를 유지하며 선회기동은 요격 화망으로 바뀝니다. 속도 14%·선회 22%가 줄고 피탄면적이 증가하며 다른 기체 전환과 함께 장착할 수 없습니다.",
  "Become a gunship with two tracking guns, +40% forward damage, double durability (cap 360), retained rear gunner and an interception barrage instead of maneuver. Speed −14%, turn −22%, larger target; excludes other airframe conversions."
 ],
 "airshipTransfer": [
  "비행선으로 바뀌어 호위기 3기(전체최대 7기)·편대 피해 35%증가·내구도 4배(최대 600)를 얻고 기존 편대 강화를 유지하며 선회기동은 대공 방어망으로 바뀝니다. 속도 38%·선회 50%가 줄고 피탄면적이 크게 증가하며 다른 기체 전환과 함께 장착할 수 없습니다.",
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
 case 'command':return en?`Wingman and formation Active damage +${n[0]} percentage points; fire rate +${n[1]} percentage points. Total manual bonuses are capped at +150% damage and +50% fire rate.`:`윙맨·편대 액티브의 피해 증가량이 ${n[0]}%p, 연사 증가량이 ${n[1]}%p 늘어납니다. 교범 누적 증가량은 각각 150%, 50%까지 적용됩니다.`;
 case 'turn':return en?`Turn rate +${n[0]}%, speed +${n[1]}%, straight-flight recovery +${n[2]}%. Total bonuses are capped at +150%, +40% and +60%, respectively.`:`선회력 ${n[0]}%, 속도 ${n[1]}%, 직선 비행 회복이 ${n[2]}% 증가합니다. 누적 증가량은 각각 150%, 40%, 60%까지 적용됩니다.`;
 case 'armor':return en?`Maximum durability increases by ${first}; restore the actual increase immediately. Hull upgrades add at most 180 durability.`:`최대 내구도가 ${first} 증가하고 실제 증가량만큼 회복합니다. 동체 강화로 얻는 내구도는 최대 180입니다.`;
 case 'regen':return en?`Restore an extra ${first}% of maximum durability per second, up to 4% total.`:`초당 최대 내구도 회복량이 ${first}%p 증가합니다(누적 최대 4%).`;
 case 'cooldown':return en?`Active cooldown decreases by ${first}%, down to 50% of its base duration.`:`액티브 쿨타임이 ${first}% 줄어듭니다(기본의 50%까지).`;
 case 'bomber':return en?`1 bomber drops 5 bombs every ${first}s. Each repeat reduces the interval by 2s, down to 10s.`:`${first}초마다 폭격기 1대가 폭탄 5발을 투하합니다. 중복 획득 시 주기가 2초 줄어듭니다(최소 10초).`;
 }
 return translated;
}
// Selection summaries prioritize the decision and its main cost, not a full parameter sheet.
export const EQUIPMENT_CHOICE_COPY={
 "cooperRack": ["4초마다 폭탄 2발을 투하하며 보유한 탄두 효과도 전달합니다.", "Drops 2 bombs every 4s, carrying equipped payloads."],
 "buckinghamBelt": ["기관총 3회 명중 시 점화합니다. 화상도 무장 성장에 따라 강해집니다.", "Three gun hits ignite; burns scale with weapon growth."],
 "spread": ["추가탄이 1발 늘어납니다(최대 5발). 탄약도 소모합니다.", "Adds 1 extra round (max 5), consuming extra ammo."],
 "flightGloves": [
  "고속 급선회 후 근접 연사가 빨라집니다. 사거리는 20% 줄어듭니다.",
  "Fast turns boost close fire. Primary range −20%."
 ],
 "mauserAceKiller": [
  "에이스·정예를 우선 쏩니다. 최근 맞힌 적에게 더 강합니다.",
  "Auto-fires at aces first; stronger after your hits."
 ],
 "cow37": ["기관총을 탄약을 소모하는 비관통 37mm 포로 바꿉니다.", "Replaces guns with an ammo-consuming, non-piercing 37mm cannon."],
 "grunkreuz": [
  "독가스에 면역이 되고 후방에 가스를 분출합니다.",
  "Gas immunity and rear gas bursts, then recharge."
 ],
 "badinGauge": [
  "직진 시 지속 속도 증가분만 피해로 바꿉니다(최대 30%).",
  "Straight flight: speed gains add damage, up to 30%. No brief boosts."
 ],
 "flechettes": ["기관총을 유지하며 3초마다 관통 화살 12발을 별도로 발사합니다.", "Keeps machine guns and fires separate bursts of 12 piercing darts every 3 seconds."],
 "hytheCamera": [
  "3연속 명중한 적에게 6초간 사격 피해가 30% 증가합니다.",
  "3 gun hits in a row: +30% gun damage for 6s."
 ],
 "bomberTransfer": ["느린 중폭격기로 바뀌어 폭격·후방 사격을 합니다(다른 기체 전환 불가).", "Becomes a slow bomber with bombs and rear fire. No other conversions."],
 "mgTransfer": ["느린 중무장기로 바뀌어 추적 기관총 2정을 씁니다(다른 기체 전환 불가).", "Becomes a slow gunship with two tracking guns. No other conversions."],
 "airshipTransfer": ["느린 비행선으로 바뀌고 호위기 3기가 합류합니다(다른 기체 전환 불가).", "Becomes a slow airship with three escorts. No other conversions."],
 "wingman": ["상시 편대기 1기가 합류합니다(출격당 2회, 전체 최대 7기).", "Adds 1 wingman, twice per sortie (7 total max)."],
 "precisionSynchronizer": ["같은 적을 연속 6회 맞히면 다음 탄 피해가 25% 증가합니다.", "Six consecutive same-target hits boost the next round 25%."],
 "directFuse": ["로켓·수류탄 직격은 25% 강해지고 폭발은 15% 약해집니다.", "Rocket/grenade hits deal 25% more; splash deals 15% less."],
 "fragmentationFuse": ["로켓·수류탄 반경이 20% 늘고 직격 피해는 10% 줄어듭니다.", "Rocket/grenade blast radius +20%; direct-hit damage −10%."],
 "inertiaRetainer": [
  "1초 직진 후 급선회하면 0.6초간 속도 손실이 절반으로 줄어듭니다.",
  "1s straight, then turn: half speed loss for 0.6s."
 ],
 "emergencyPlating": ["연속 피격 시 1.5초간 탄환 피해가 18% 줄어듭니다.", "Repeated hits cut bullet damage 18% for 1.5s."],
 "emergencyDope": ["내구도 25% 이하에서 12% 회복합니다(출격당 1회, 치명 피해 제외).", "Once a sortie, repairs 12% at 25% HP unless lethal."],
 "fighterSupply": ["상시 편대 피해가 35% 늘고 사격 간격이 20% 줄어듭니다(에이스 제외).", "Wing damage rises 35%; fire intervals drop 20%. Excludes aces."],
 "mercedesEngine": ["속도가 20%, 직진 시 총 55%까지 증가합니다.", "Speed rises 20%, reaching 55% in straight flight."],
 "combinedProjectiles": ["주무장과 쿠퍼 폭탄을 시간차로 나누어 발사합니다.", "Fires primary volleys and Cooper bombs in staggered bursts."],
 "amatolCharge": ["폭발 피해·반경이 40% 늘고 일반탄에도 착탄 폭발이 생깁니다.", "Blast damage and radius rise 40%. Ordinary rounds also explode."],
 "lufberyCircle": ["가까운 상시 편대기가 본기를 엄호해 피해를 줄입니다.", "Nearby permanent wingmen reduce your damage taken."],
 "redScarf": ["속도가 20%, 후방 추적 중 35% 늘고 포착이 빨라집니다.", "Speed +20%, or +35% tailing; easier tail lock."],
 "prancingHorse": ["속도가 20% 늘고 전방에서 받는 피해가 25% 줄어듭니다.", "Speed rises 20%; damage taken from the front drops 25%."],
 "telescope": [
  "전방 표적을 짧게 조준 보정합니다. 분석 표적을 우선합니다.",
  "Brief forward aim correction; analyzed targets first."
 ],
 "sparkPlug": ["10초마다 8% 수리하고 수리품은 12% 더 회복합니다(대기 10초).", "Repairs 8% every 10s. Pickups repair 12% extra, once per 10s."],
 "immelmannManual": ["선회기동 쿨타임이 50% 줄고 기동 중 1.05초간 무적이 됩니다.", "Halves maneuver cooldown; grants 1.05s invulnerability."],
 "motorCannon": ["3초마다 비관통 포탄을 쏴 주변까지 폭발 피해를 줍니다.", "Fires blast shells every 3s. Does not pierce."],
 "loEmblem": ["내구도가 50% 줄고 피해·편대 연사·속도·선회력이 증가합니다.", "Halves HP; boosts damage, wing fire rate and agility."],
 "sacredCowling": ["근거리 피해가 25% 늘고 받는 근거리 탄환 피해는 최대 20% 줄어듭니다.", "Close damage rises 25%; nearby bullet damage taken drops up to 20%."],
 "steelPlate": ["소구경 탄환 피해가 30%, 속도·선회력이 10% 줄어듭니다.", "Small-caliber damage taken drops 30%; speed and turning drop 10%."],
 "rearGunner": ["주무장 총좌가 회전합니다. COW 포와 쿼드에도 적용됩니다.", "Rotates the primary turret, including COW and Quad Lewis."],
 "quadLewis": ["주무장 발사 갈래가 3개 늘며 탄환마다 탄약을 소모합니다.", "Adds three primary firing lanes. Each round consumes ammunition."],
 "rankinShell": ["파편으로 공격하고 경량 적탄을 지웁니다(보스 경고 공격 제외).", "Shrapnel clears light rounds, not boss warning attacks."],
 "kaiserFog": [
  "12초마다 3초간 연막에 숨어 적 추적을 끊습니다.",
  "Break enemy tracking for 3s every 12s."
 ],
 "fogCompass": [
  "경험치와 수리품을 멀리서 회수합니다. 수리품은 더 멀리 끌어옵니다.",
  "Attracts distant XP and repairs; repairs reach farther."
 ],
 "maximBelt": ["기관총 피해·탄띠 용량이 늘고 재장전이 35% 빨라집니다.", "Boosts gun damage and belt capacity; cuts reload time by 35%."],
 "urLeica": ["출격 종료 시 격추 기록이 10% 증가합니다.", "Increases the final kill record by 10% at the end of the sortie."],
 "heineckeRettungsfallschirm": ["치명 피해 시 재출격합니다(출격당 2회, 대기 180초).", "Escapes lethal damage: two relaunches per sortie, 180s cooldown."],
 "aceWingman": [
  "무작위 에이스 1명이 주력 무장과 반대 계열로 엄호합니다.",
  "A random allied ace covers the opposite weapon family."
 ],
 "fieryGrapnel": ["근접 명중으로 화염 갈고리를 붙입니다. 부착 폭약은 격추돼도 터집니다.", "A close flyby attaches fire. Attached payloads survive target loss."],
 "veryPistol": [
  "9초마다 6초간 집중 공격하고 준비된 특수무장 편대가 재장전을 엄호합니다.",
  "Focus fire for 6s every 9s; ready specialist wings cover reloads."
 ],
 "strutterAirbrake": [
  "감속 급선회 후 재가속합니다. 기체 전환과 중복되지 않습니다.",
  "Brake, turn, reaccelerate. No airframe conversions."
 ],
 "wimperisSight": [
  "폭발물을 발사할 때 선행 조준합니다. 유도·추가탄은 없습니다.",
  "Predictive ordnance aim; no homing or extra rounds."
 ]
};
export function conciseEquipmentChoice(id,description,locale='ko'){
 const en=locale==='en',n=[...String(description||'').matchAll(/\d+(?:\.\d+)?/g)].map(m=>m[0]);
 if(n.length)switch(id){
 case 'armor':return en?`Adds ${n[0]} max durability and repairs the gain.`:`최대 내구도가 ${n[0]} 늘고 증가량만큼 회복합니다.`;
 case 'command':return en?`Wing damage gains ${n[0]}pp and fire rate gains ${n[1]}pp.`:`편대 피해 증가량이 ${n[0]}%p, 연사 증가량이 ${n[1]}%p 늘어납니다.`;
 case 'turn':return en?`Turning rises ${n[0]}%, speed ${n[1]}%, speed recovery ${n[2]}%.`:`선회력이 ${n[0]}%, 속도가 ${n[1]}%, 속도 회복이 ${n[2]}% 증가합니다.`;
 case 'regen':return en?`Repairs ${n[0]}% more max HP per second, up to 4%.`:`초당 내구도 회복량이 ${n[0]}%p 늘어납니다(최대 4%).`;
 case 'cooldown':return en?`Cuts Active cooldown by ${n[0]}%, to half its base at most.`:`액티브 쿨타임이 ${n[0]}% 줄어듭니다(기본의 50%까지).`;
 case 'bomber':{const t=en?(String(description).match(/every ([\d.]+)s/)?.[1]||n[0]):n[0];return en?`1 bomber drops 5 bombs every ${t}s.`:`${t}초마다 폭격기 1대가 폭탄 5발을 투하합니다.`;}
 case 'rockets':case 'mines':{const bonus=String(description).match(/(?:증가량이 |damage \+|damage increases by )([\d.]+)(?:%p| percentage points)/);return en?`${id==='rockets'?'Adds 1 rocket level':'Adds 1 grenade'} (max 5).${bonus?` Blast damage gains ${bonus[1]}pp.`:''}`:`${id==='rockets'?'로켓이 1단계 강화됩니다':'수류탄이 1개 늘어납니다'}(최대 5).${bonus?` 폭발 피해가 ${bonus[1]}%p 늘어납니다.`:''}`;}
 }
 return EQUIPMENT_CHOICE_COPY[id]?.[en?1:0]||conciseEquipmentDescription(id,description,locale,description);
}
