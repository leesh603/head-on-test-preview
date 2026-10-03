// One presentation catalog for hangar, HUD, Korean/English and field record.
// Numbers below describe base pilot abilities before aircraft/gear multipliers.
const entry=(ko,en)=>({ko:{passive:ko[0],skill:ko[1],passiveShort:ko[2],activeShort:ko[3],passiveDetail:ko[4],activeDetail:ko[5]},en:{passive:en[0],skill:en[1],passiveShort:en[2],activeShort:en[3],passiveDetail:en[4],activeDetail:en[5]}});
export const PILOT_IDENTITY_COPY={
 baron:entry(
 ['사냥 본능','드라이데커','강한 사냥감을 추적할수록 강해지고 격추하면 가속합니다.','급선회로 적의 후방을 잡으면 추격 가속으로 전환합니다.','에이스·엘리트·중폭격기·폭격기 순으로 사냥감 지정. 명중 후 추적을 유지하면 0.8초마다 대상 피해 +15% / +30% / +45%. 2.2초간 명중하지 않으면 해제. 직접 격추 시 4초간 속도 +20%.','4초간 속도 −25%, 선회 +60%, 선회 감속 계수 0.3배. 발동 무적 1초. 후방 잠금 성공 시 종료하고 1.2초간 속도 +30%. 강화: 지속시간 +35%.'],
 ['Hunting Instinct','Dreidecker','Track hardened prey to build damage, then accelerate on the kill.','Turn tightly into the enemy rear, then switch to pursuit acceleration.','Prioritizes aces, elites, heavy bombers, then bombers. Hits build target damage +15% / +30% / +45% at 0.8s intervals; expires after 2.2s without a hit. Credited prey kill: +20% speed for 4s.','4s: speed −25%, turn +60%, turning drag coefficient ×0.3. Initial invulnerability 1s. Rear lock ends the maneuver and grants +30% speed for 1.2s. Enhanced: duration +35%.']),
 voss:entry(
 ['포위전의 명수','7대 1','주변 적이 많을수록 공격력과 기동성이 높아집니다.','분산 잔상으로 조준을 흩트리고 포위에서 빠져나옵니다.','400px 내 적마다 피해·속도·선회 +4%, 최대 6기 / +24%.','2.4초간 속도·선회 +35%. 발동 무적 0.45초. 잔상 6기가 1.2초간 분산하여 적 조준 교란. 탄막 삭제·강제 반전 없음.'],
 ['Encirclement Fighter','Seven Against One','Gain firepower and agility as enemies surround you.','Scatter decoys and maneuver out of encirclement.','+4% damage, speed and turn per enemy within 400px, up to 6 enemies / +24%.','2.4s: speed and turn +35%; initial invulnerability 0.45s. Six decoys scatter for 1.2s and distract aiming. No bullet clearing or forced reversal.']),
 boelcke:entry(
 ['딕타 뵐케','전술 지휘','자기 편대가 표적을 나누고 적 후방으로 접근합니다.','기존 편대의 후방 접근과 협동 사격을 지휘합니다.','상시 편대 2기. 편대원별 표적 분담·후방 접근. 적 측면·후방에서 기관총 피해 +25%.','8초간 윙맨 4기가 추가 합류해 좌우로 벌어져 같은 적의 후방을 협공. 기관총 피해 2.2배.'],
 ['Dicta Boelcke','Tactical Command','Assign separate targets and approach their rear with your flight.','Direct existing wingmen into coordinated rear attacks.','Two permanent wingmen, divided targets and rear approach. +25% machine-gun damage against enemy flanks and rear.','8s: four extra wingmen split left and right to strike the same enemy from behind. Machine-gun damage ×2.2.']),
 udet:entry(
 ['공중 곡예사','곡예 반격','탄환을 아슬아슬하게 피하면 다음 공격이 강해집니다.','회피로 쌓은 기세를 기동과 반격 화력으로 바꿉니다.','탄환과 18~42px 거리로 스친 후 피격 없이 이탈하면 3초간 기관총 피해 +10%, 최대 3중첩. 같은 탄환은 1회만 인정.','0.55초간 속도 +20%, 선회 +30%, 기관총 피해 +20%. 보유 회피 중첩을 소비해 중첩당 추가 +10%. 발동 무적 0.55초. HP 소모 없음.'],
 ['Aerial Acrobat','Acrobatic Counter','Escaping a near miss strengthens your next attack.','Convert stored dodges into agility and counterfire.','Passing a bullet at 18–42px then exiting without damage grants +10% gun damage for 3s, max 3 stacks. Each bullet counts once.','0.55s: speed +20%, turn +30%, gun damage +20%, plus +10% per consumed dodge stack. Initial invulnerability 0.55s. No HP cost.']),
 goering:entry(
 ['백색 편대','집중 포화','백색 윙맨과 함께 출격해 화력을 보탭니다.','자기 편대의 사격을 지정한 표적에 집중시킵니다.','상시 백색 윙맨 2기. 각 윙맨은 자기 지휘관에게 귀속.','5초간 전방 표적을 지정해 자기 윙맨 집중사격. 편대 피해 +65%, 연사 +60%. 표적 격파 시 재지정. 추가 소환 없음.'],
 ['White Flight','Concentrated Fire','Deploy with white wingmen for sustained support.','Concentrate your own flight on a designated target.','Two permanent white wingmen, each assigned to its owner.','5s: designate a forward target for own wingmen. Wing damage +65%, fire rate +60%; reacquire on target destruction. No summons.']),
 immelmann:entry(
 ['독일의 독수리','임멜만 턴','회피기동이나 반전 직후의 공격 기회를 살립니다.','상승 반전으로 사격 위치를 바꾸고 관통탄을 쏩니다.','단발 기관총 피해 +45%. 큰 방향전환·선회기동 직후 1.5초간 탄 퍼짐 감소·연사 +20%.','0.9초 상승 후 정점에서 반전하며 기관총 기본 피해 3.5배의 관통탄 5발 살포. 발동 무적 1.1초. 강화: 관통탄 7발, 무적 1.35초.'],
 ['Eagle of Lille','Immelmann Turn','Exploit the attack window after evasive maneuvers and reversals.','Reverse your firing position and release piercing rounds.','Single-gun damage +45%. After a major heading change: tighter spread and +20% fire rate for 1.5s.','Climb for 0.9s, reverse at the apex and spray five piercing rounds at 3.5× base gun damage. 1.1s invulnerable. Enhanced: seven rounds, 1.35s invulnerable.']),
 huffzky:entry(
 ['후방 제압','슐라스타 근접지원','후방 사수가 가까운 추격자를 견제합니다.','후방 제압 사격을 강화하며 근거리 소형폭탄을 투하합니다.','후방 사수 조준 반경 420px, 후방 중심 ±1.2rad. 전방·후방 동시 사격.','5초간 연사 +30%. 250px 내 표적에 1.2초마다 소형폭탄 투하, 비행 0.5초 후 반경 65px / 기본 폭발 피해 32. 강제 회전 없음.'],
 ['Rear Suppression','Schlasta Close Support','A rear gunner suppresses nearby pursuers.','Intensify rear fire and drop small close-support bombs.','Rear gunner engages within 420px and ±1.2rad of the tail. Forward and rear guns fire together.','5s: fire rate +30%. Every 1.2s, drop a small bomb at a target within 250px; 0.5s travel, 65px blast, base damage 32. No forced spin.']),
 berthold:entry(
 ['강철의 의지','충격 분산','받은 피해 일부를 나중에 나누어 받습니다.','지연된 피해를 더 긴 시간에 걸쳐 견딥니다.','최종 피격 피해의 40%를 4초에 나누어 받음. 총 피해량은 보존되며 지연 피해도 치명적일 수 있음.','5초간 새 지연 피해의 분할 시간을 6초로 연장. 발동 시 기존 미지급 피해도 최소 6초로 재분할. 피해 삭제·무적 없음.'],
 ['Iron Will','Disperse the Shock','Spread part of incoming damage over time.','Extend the time available to withstand delayed damage.','40% of final incoming damage is paid over 4s. Total damage is conserved; delayed damage can be lethal.','5s: new deferred damage is paid over 6s. Existing unpaid damage is redistributed over at least 6s. No damage deletion or invulnerability.']),
 wolff:entry(
 ['여린 작은꽃','붐 앤 줌','무피격 비행으로 꽃잎을 쌓아 화력과 속도를 높입니다.','고도를 얻은 뒤 가속하는 급강하 사격을 펼칩니다.','무피격 3초마다 피해 +5%·속도 +3%, 최대 6중첩. 피격 시 2중첩 손실.','2.8초. 처음 0.75초 상승·무적 후 급강하하며 최대 속도 2.05배, 피해 +55%, 연사 +80%, 선회 −50%. 강화: 지속시간 +35%.'],
 ['Tender Little Flower','Boom and Zoom','Build petals through clean flying to gain damage and speed.','Gain altitude, then accelerate into a firing dive.','Every 3s without a hit: damage +5%, speed +3%, max 6 stacks. Taking a hit removes 2 stacks.','2.8s. First 0.75s: invulnerable climb; then dive up to 2.05× speed, +55% damage, +80% fire rate, −50% turn. Enhanced: duration +35%.']),
 loewenhardt:entry(
 ['노란색 포커를 타는 미친놈','라이징 스트라이크','적과 정면으로 마주칠수록 강해집니다.','하방으로 진입한 뒤 수직 상승 사격을 펼칩니다.','적과 정면으로 마주칠 때 기관총 피해 +35%.','0.55초간 하방으로 진입한 뒤 수직 상승 사격. 상승할수록 속도가 감소하며 공격속도 +200%, 공격력 +45%, 선회력 −65%. 강화: 지속시간 +35%.'],
 ['Madman in a Yellow Fokker','Rising Strike','Grow stronger when facing the enemy head-on.','Dive below, then climb vertically while firing.','+35% machine-gun damage when facing an enemy head-on.','Dive under for 0.55s, then vertical climb fire. Speed bleeds off during the climb: +200% fire rate, +45% damage, −65% turn. Enhanced: duration +35%.']),
 jacobs:entry(
 ['선회전의 베테랑','검은 매의 선회','선회전을 이어갈수록 사격이 빨라지고 에너지를 회복합니다.','선회 감속을 줄여 적의 꼬리를 오래 물고 늘어집니다.','0.35rad/s 이상 선회를 2초 유지하면 연사 최대 +30%. 직진 시 1초에 감소. 에너지 회복 계수 +0.6, 선회 감속 계수 0.8배. 격추 시 3초간 연사 +10% 중첩 (최대 3단).','4초간 선회 +20%, 선회 감속 계수 0.45배. 무적 없음.'],
 ['Turning Veteran','Black Hawk Turn','Sustained turning builds fire rate while recovering energy.','Reduce turning drag to stay on an enemy tail.','Turn above 0.35rad/s for 2s to reach +30% fire rate; decays in 1s when straight. Energy recovery coefficient +0.6; turn drag ×0.8. Kills grant +10% fire rate for 3s, stacking up to 3.','4s: turn +20%, turn drag coefficient ×0.45. No invulnerability.']),
 gontermann:entry(
 ['점화 조준','집중 소이탄','같은 표적의 사격선을 유지해 점화탄을 준비합니다.','조준을 유지한 표적에 강한 소이탄을 집중합니다.','780px / 전방 ±0.13rad에서 같은 표적을 1.5초 조준. 준비 후 1.2초마다 점화탄, 직접 피해 +20%. 화상 3초, 0.25초당 기본 기관총 피해의 45%. 재장전 −12%.','5초간 조준 준비 완료 상태의 모든 기관총탄이 지정 표적을 점화하며 직접 피해 +60%. 표적 변경 시 재조준.'],
 ['Ignition Sight','Focused Incendiaries','Hold one target in your firing line to prepare an incendiary.','Concentrate powerful incendiary fire on the prepared target.','Hold the same target within 780px / ±0.13rad for 1.5s. Then an incendiary every 1.2s: direct damage +20%; burn for 3s at 45% base gun damage every 0.25s. Reload −12%.','5s: every prepared gun round ignites the designated target and deals +60% direct damage. Changing targets resets preparation.']),
 lothar:entry(
 ['돌격 명수','난폭한 돌격','정면의 적에게 강한 일격을 꽂습니다.','기수를 들이박으며 편대를 정면으로 돌파합니다.','전방 60° 내 적에게 기관총 피해 +25%.','2.6초간 직선 돌격: 속도 +85%, 선회 −50%, 연사 +80%, 전방 피해 +55%. 기수 앞 55px의 적을 들이박아 240 피해 (대상당 1회). 발동 무적 0.5초.'],
 ['Head-On Fighter','Reckless Charge','Strike hard at anything ahead of your nose.','Ram the nose through a formation head-on.','+25% gun damage on enemies within your front 60° arc.','2.6s straight charge: +85% speed, −50% turn, +80% fire rate, +55% frontal damage. Rams enemies within 55px of the nose for 240 damage once each. 0.5s initial invulnerability.']),
 sachsenberg:entry(
 ['전금속 기체','발트해의 매','융커스 전금속 기체가 피격 피해를 덜 받습니다.','급상승으로 빠져나간 뒤 급강하 사격으로 되돌아옵니다.','받는 피해 −12%.','3초간 2단 기동: 1초 급상승(무적) 후 2초 급강하 — 속도 최대 +80%, 연사 +100%, 피해 최대 +30%. 발동 무적 0.8초.'],
 ['All-Metal Airframe','The Baltic Eagle','The all-metal Junkers shrugs off incoming fire.','Climb out of the fight, then return in a diving gun run.','Incoming damage −12%.','3s two-phase maneuver: 1s climb (invulnerable), then a 2s dive — up to +80% speed, +100% fire rate, +30% damage. 0.8s initial invulnerability.']),
 proctor:entry(
 ['사격의 명수','얼룩말 살보','탄줄기를 하나로 모아 쏘는 명사수입니다.','모은 화력을 한 방향으로 쏟아붓습니다.','탄 퍼짐 −35%.','2.4초간 연사 +140%, 피해 +35%, 탄 퍼짐 −65%, 모든 탄 관통. 발동 무적 0.35초.'],
 ['Master Shot','Zebra Salvo','Fire every barrel as one.','Pour concentrated fire down one line.','Gun spread −35%.','2.4s: +140% fire rate, +35% damage, −65% spread, every round pierces. 0.35s initial invulnerability.']),
 schleich:entry(
 ['흑기사','흑기사의 진격','눈부신 용기로 피격을 덜 받습니다.','강철 갑주를 두른 듯 정면으로 밀고 들어갑니다.','받는 피해 −8%.','3초간 받는 피해 −55%, 속도 +40%, 선회 −25%. 발동 무적 0.6초.'],
 ['The Black Knight','Black Advance','Fearlessness absorbs part of every hit.','Push straight ahead as if armored in steel.','Incoming damage −8%.','3s: incoming damage −55%, +40% speed, −25% turn. 0.6s initial invulnerability.']),
 lufbery:entry(
 ['기교의 장인','라파예트의 사격술','정교한 기동으로 에너지를 아껴 씁니다.','계산된 사격선이 탄을 표적으로 이끕니다.','에너지 회복 계수 +0.4.','3초간 전방 23° 내 표적을 기관총이 자동 조준, 연사 +43%, 피해 +20%. 발동 무적 0.3초.'],
 ['Master Technician','Lafayette Marksmanship','Precise flying spends less energy.','A computed firing line leads rounds to the mark.','Energy recovery coefficient +0.4.','3s: guns auto-aim at targets within a 23° frontal arc, +43% fire rate, +20% damage. 0.3s initial invulnerability.']),
 brumowski:entry(
 ['붉은 호위대','편대 재집결','자기 호위 편대와 함께 출격합니다.','자기 편대를 주변으로 모아 근접 위협을 막습니다.','상시 호위 편대 2기. 각 편대는 자기 지휘관에게 귀속.','5초간 자기 편대가 반경 100px로 재집결, 340px 내 적 우선 제압. 180px 내 자기 편대마다 받는 피해 −10%, 최대 −20%.'],
 ['Red Escort','Regroup the Flight','Deploy with your own escort flight.','Regroup your wingmen nearby to suppress close threats.','Two permanent escorts, assigned to their own commander.','5s: regroup into a 100px orbit, prioritize threats within 340px. Incoming damage −10% per own escort within 180px, max −20%.']),
 fonck:entry(
 ['정밀 조준','관통 사격선','한 표적을 좁은 사격선에 오래 유지할수록 강해집니다.','정돈된 사격선으로 조준한 표적을 관통합니다.','780px / 전방 ±0.13rad에서 같은 표적을 1.5초 유지하면 기관총 피해 최대 +35%. 탄 퍼짐 −75%. 표적을 놓치면 초기화.','4초간 기관총 관통. 같은 표적 조준 보상 최대 +80%로 증가. 탄 퍼짐 75% 감소, 스킬 자동유도 없음.'],
 ['Precision Sight','Piercing Firing Line','Hold one target in a narrow firing line to build damage.','Pierce the sighted target with disciplined gunfire.','Hold one target within 780px / ±0.13rad for 1.5s: up to +35% gun damage. Gun spread −75%; losing the target resets focus.','4s of piercing gunfire; focused-target bonus rises to +80%. Gun spread reduced 75%; no skill homing.']),
 collishaw:entry(
 ['블랙 플라이트','분산 협공','검은 윙맨이 좌우에서 서로 다른 표적을 압박합니다.','기존 편대를 넓게 벌려 여러 방향에서 협공합니다.','상시 검은 윙맨 2기. 좌우 110px 배치와 표적 분담.','6초간 좌우 220px로 분산하고 서로 다른 표적을 향해 사격. 추가 소환 없음.'],
 ['Black Flight','Split Pincer','Black wingmen pressure separate targets from both flanks.','Spread your existing flight for attacks from several directions.','Two permanent black wingmen, 110px flank offsets and divided targets.','6s: spread to 220px flank offsets and fire toward separate targets. No extra summons.']),
 baracca:entry(
 ['기사도의 결투','검은 말의 돌파','서로 마주보는 실제 정면 교전에서 화력이 강해집니다.','직선 돌격으로 적의 정면을 관통합니다.','단발 기관총 피해 +45%. HEAD-ON 표시와 같은 조건: 거리 70~420px, 내 기수 내적 ≥0.94 / 적 기수 내적 ≥0.90일 때 기관총 피해 +30%.','0.9초간 무적 직선 돌격. 경로에서 각 적에게 기본 기관총 피해 18배를 1회 적용(대형 중폭격기 85px, 그 외 52px 판정). 강화: 지속시간 +35%.'],
 ['Chivalrous Duel','Prancing Horse Breakthrough','Gain firepower when both aircraft truly face one another.','Break through the enemy front in a straight charge.','Single-gun damage +45%. Uses the HEAD-ON cue condition: 70–420px, own nose dot ≥0.94 / enemy nose dot ≥0.90; gun damage +30%.','0.9s invulnerable straight charge. Each crossed enemy takes 18× base gun damage once (85px heavy-bomber contact radius; otherwise 52px). Enhanced: duration +35%.']),
 guynemer:entry(
 ['모퇴르 카농','황새 편대 · 로켓 폭우','주기적으로 강한 대구경 관통탄을 발사합니다.','날개에서 르 프리외르 로켓을 여러 방향으로 연속 발사합니다.','4초마다 기본 피해 90의 관통 기관포탄. 폭발물 강화 적용.','3초간 날개에서 르 프리외르 로켓 48발을 여러 방향으로 연속 발사합니다. 강화: 발사 파형 수 증가.'],
 ['Moteur-Canon','Stork Flight · Rocket Deluge','Periodically fire a powerful heavy piercing shell.','Fire Le Prieur rockets from the wings in multiple directions.','A piercing cannon shell every 4s; base damage 90, scaled by payload upgrades.','Fire 48 Le Prieur rockets in multiple directions over 3 seconds. Enhanced: more launch waves.']),
 bishop:entry(
 ['근접기습','기습 돌입','적에게 가까이 접근할수록 기관총 피해가 증가합니다.','가속하며 접근해 근접 화력을 끌어올립니다.','거리 360px부터 가까워질수록 기관총 피해 최대 +65%. 고정 사거리 패널티 없음.','3초간 속도 +25%, 거리 기반 기관총 보상 최대 +110%. 무적·폭격 없음.'],
 ['Close Ambush','Ambush Entry','Machine-gun damage rises as you close the distance.','Accelerate into close range for stronger ambush fire.','Gun damage rises below 360px, up to +65% at contact range. No fixed range penalty.','3s: speed +25%, distance-based gun bonus rises to +110%. No invulnerability or bombing.']),
 mannock:entry(
 ['동료의 수호자','교차 엄호','아군을 추격하는 적에게 더 강한 사격을 가합니다.','아군 추격자를 향해 교차 엄호 사격을 보냅니다.','아군·편대·초계기 400px 내에서 아군 방향 ±0.65rad를 향하는 가장 가까운 적에게 기관총 피해 +30%. 자기 편대 연사 +15%. 사거리 패널티 없음.','5초간 엄호 표적 기관총 피해 +65%. 표적이 650px 안이면 0.65초마다 기본 지원 피해 12의 관통 엄호탄.'],
 ['Guardian of the Flight','Crossing Cover','Deal more damage to enemies pursuing your allies.','Send covering fire across an ally pursuer’s path.','Gun damage +30% against the closest enemy within 400px of an ally, wingman or patrol, pointing within ±0.65rad toward it. Own flight fire rate +15%. No range penalty.','5s: gun damage +65% against the covering target. If within 650px, fire a piercing cover round every 0.65s, base support damage 12.']),
 mckeever:entry(
 ['파월의 표적인계','전후방 연계','전방에서 맞힌 적을 후방 사수가 이어받습니다.','자유롭게 비행하며 후방 인계 표적을 집중 공격합니다.','전방 명중 표적을 3초간 기억. 650px / 후방 ±1.2rad 진입 시 후방사수가 조준하며 피해 +30%.','5초간 연사 +25%, 인계된 표적에 후방 기관총 피해 +75%. 강제 회전 없음.'],
 ['Powell’s Handoff','Fore-and-Aft Relay','Hand targets hit by the front gun to the rear gunner.','Fly freely while concentrating rear fire on the handed-off target.','Remember a front-gun target for 3s. Within 650px / rear ±1.2rad, the rear gunner tracks it with +30% damage.','5s: fire rate +25%; rear gun damage +75% against the handed-off target. No forced spin.']),
 hawker:entry(
 ['지속 사격선','모든 것을 공격하라','같은 표적을 계속 조준하면 연사와 탄도가 안정됩니다.','탄약 소모를 멈추고 안정된 사격을 이어갑니다.','780px / 전방 ±0.13rad에서 같은 적을 2초 조준하면 연사 최대 +30%, 탄 퍼짐 최대 −70%. 기존 선회 감속 −25%·직진 속도 최대 +20% 유지.','5초간 기관총 탄약 무제한·연사 +100%. 조준 유지 보상과 함께 작동.'],
 ['Sustained Firing Line','Attack Everything','Keeping one target sighted stabilizes cadence and spread.','Sustain disciplined fire without ammunition consumption.','Hold one target within 780px / ±0.13rad for 2s: fire rate up to +30%, spread up to −70%. Retains −25% turn drag and up to +20% straight-flight speed.','5s: unlimited gun ammunition and +100% fire rate; works with the maintained-sight bonus.']),
 mccudden:entry(
 ['엔지니어링 에이스','야전 정비','일반 강화 선택에서 무료로 다시 추첨할 수 있습니다.','수리 보급품을 투하해 자신과 동료를 정비합니다.','일반 강화 선택지 4개, 해당 선택 단계에서 무료 리롤 1회. 공통 특수장비 리롤 규칙 유지.','낙하 후 착지하는 수리 보급품 3개, 개당 최대 HP의 11.67% 회복 (총 35%). 협동 아군 회수 가능. 강화: 보급품 4개.'],
 ['Engineering Ace','Field Maintenance','Reroll ordinary upgrade choices for free.','Drop repair supplies for yourself and your partner.','Four ordinary upgrade choices, with one free reroll per choice step. Shared special-equipment reroll rules remain unchanged.','Three airdropped supplies that heal 11.67% max HP each once landed (35% total). Cooperative allies can collect them. Enhanced: four supplies.']),
 nungesser:entry(
 ['죽음의 기사','위험한 돌파','남은 내구도 비율이 낮을수록 더 빠르고 거세게 싸웁니다.','낮은 내구도의 공격 기세를 유지하며 피해를 줄입니다.','현재 HP / 최대 HP 기준. HP 100%→20% 구간에서 연사 최대 +60%, 속도 최대 +35%. HP 20% 이하에서 최대 보상.','3초간 완전 무적·받는 피해 −25%. 저체력 보상 유지.'],
 ['Knight of Death','Risky Breakthrough','Fight faster and harder as your remaining health ratio falls.','Keep your low-health momentum while reducing incoming damage.','Uses current HP / max HP. From 100% to 20% HP: up to +60% fire rate and +35% speed; maximum below 20% HP.','3s: full invulnerability and incoming damage −25%, retaining the low-health bonus.']),
 rickenbacker:entry(
 ['빠른 표적전환','햇 인 더 링','서로 다른 적을 빠르게 바꿔 맞히면 화력이 쌓입니다.','표적전환으로 얻는 공격 보상을 강화합니다.','2초 안에 새로운 적 명중 시 3초간 기관총 피해 +10%, 최대 3중첩. 2초 안에 다시 맞힌 같은 적은 전환 보상 제외.','4초간 전환 중첩당 기관총 피해 +18%, 최대 +54%. 자동 다중표적 사격 없음.'],
 ['Rapid Target Switch','Hat in the Ring','Build firepower by rapidly hitting different enemies.','Strengthen the reward for rapid target changes.','Hit a fresh target within 2s for +10% gun damage for 3s, max 3 stacks. A target hit within the previous 2s cannot grant another switch reward.','4s: +18% gun damage per switch stack, max +54%. No automatic multi-target volley.']),
 ball:entry(
 ['고독한 사냥꾼','구름 속의 매','아군과 떨어져 홀로 접근하면 기관총 화력이 강해집니다.','잔상으로 조준을 속인 뒤 후방 기습을 가합니다.','320px 내 살아 있는 협동 아군·윙맨이 없으면 기관총 피해 +15%.','1.5초간 잔상 위치로 적 조준 유도, 발동 무적 0.25초. 재등장 후 2초간 단독 상태에서 적 후방 0.72π 바깥 사격 시 피해 2.2배.'],
 ['Lone Hunter','Hawk in the Clouds','Gain gun damage while approaching alone, away from allies.','Deceive aiming with a ghost, then strike from behind.','Gun damage +15% when no living cooperative partner or wingman is within 320px.','1.5s: enemies aim at the ghost position; initial invulnerability 0.25s. For 2s after reappearance, isolated shots from beyond 0.72π behind the target deal 2.2× damage.']),
 barker:entry(
 ['불굴의 각성','살아서 귀환하라','피격을 견디면 잠시 반격 화력이 높아집니다.','치명타를 한 번 버티고 이탈하면 일부 내구도를 회복합니다.','피격 시 3초간 기관총 피해 +13%, 최대 3중첩.','6초간 치명타 1회를 HP 1로 버팀. 이후 4초간 속도 +35%; 발동 위치에서 260px 이상 이탈하고 1초간 무피격이면 최대 HP 20% 회복. 강화: 회복 25%. 추가 치명타는 방지하지 않음.'],
 ['Unbroken Resolve','Return Alive','Surviving hits briefly strengthens counterfire.','Survive one lethal hit and recover some health after escaping.','Taking a hit grants +13% gun damage for 3s, max 3 stacks.','6s: prevent one lethal hit at 1 HP. Then +35% speed for up to 4s; move 260px from the lethal hit and avoid damage for 1s to restore 20% max HP. Enhanced: restore 25%. Further lethal hits are not prevented.']),
 luke:entry(
 ['소이탄 사냥꾼','소이탄 연쇄 격파','기관총으로 적을 점화하고 불붙은 적을 더 강하게 공격합니다.','점화한 적이나 보스 부위를 파괴하면 한 번 폭발시킵니다.','기관총 명중 시 3초 화상. 0.25초당 기본 기관총 피해의 20%. 불붙은 적 기관총 피해 +20%.','6초간 점화 표적 기관총 피해 +55%. 점화된 적·보스 부위 격파 시 반경 110px, 기본 폭발 피해 36의 1회 폭발. 연쇄폭발로 추가 연쇄 금지. 단독 보스에도 직접 피해·화상 적용.'],
 ['Incendiary Hunter','Incendiary Chain Kill','Ignite enemies with gunfire and hit burning targets harder.','Destroy an ignited enemy or boss part to trigger one explosion.','Gun hits burn for 3s, dealing 20% base gun damage every 0.25s. Gun damage +20% against burning targets.','6s: gun damage +55% against ignited targets. Destroy an ignited enemy or boss part for one 110px explosion, base damage 36. Chain explosions cannot trigger another chain. Direct damage and burns also work on a lone boss.'])
};
export const pilotIdentityCopy=(id,locale='ko')=>PILOT_IDENTITY_COPY[id]?.[locale==='en'?'en':'ko'];
