// One presentation catalog for hangar, HUD, Korean/English and field record.
// Numbers below describe base pilot abilities before aircraft/gear multipliers.
const entry=(ko,en)=>({ko:{passive:ko[0],skill:ko[1],passiveShort:ko[2],activeShort:ko[3],passiveDetail:ko[4],activeDetail:ko[5]},en:{passive:en[0],skill:en[1],passiveShort:en[2],activeShort:en[3],passiveDetail:en[4],activeDetail:en[5]}});
// Skill titles preserve approved emblems, unit names and spoken foreign names.
// Fit the available title width; never shorten an approved name to a syllable cap.
// Aircraft-specific entries use the existing pilot:aircraft display key.
export const PILOT_IDENTITY_COPY={
 'baron:baron_albatros':entry(
 ['붉은 날개','태양의 사냥꾼','더 빠르게 비행하고 민첩하게 선회합니다.','전방 적을 제압하고 후방 공격 기회를 만듭니다.','이동속도와 선회력이 증가합니다.','4초간 전방 적을 제압합니다. 적의 바로 뒤에서 공격하면 추가 피해를 줍니다.'],
 ['Red Wings','Sun Hunter','Fly faster and turn more sharply.','Suppress forward enemies and exploit their rear.','Increases flight speed and turn rate.','Suppress enemies ahead for 4 seconds. Attacks from directly behind deal extra damage.']),
 baron:entry(
 ['사냥 본능','드라이데커','강한 적을 계속 맞히며 추적할수록 피해가 증가합니다.','4초간 감속해 급선회하며 사냥감에게 큰 피해를 줍니다.','강한 적을 계속 맞히며 추적할수록 피해가 증가합니다. 사냥감 격추 후 잠시 빨라집니다.','4초간 감속해 급선회하며 사냥감에게 큰 피해를 줍니다. 적의 후방을 잡으면 가속합니다.'],
 ['Hunting Instinct','Dreidecker','Keep hitting and tracking tough prey to build damage.','Slow down and turn tightly for 4 seconds to hit your prey harder.','Keep hitting and tracking tough prey to build damage. A kill briefly boosts speed.','Slow down and turn tightly for 4 seconds to hit your prey harder. Taking its tail boosts speed.']),
 voss:entry(
 ['고독한 후사르','세븐 투 원','주변 적이 많을수록 공격력과 기동성이 높아집니다.','2.4초간 기동성이 높아지고 잔상 6기가 흩어져 적의 조준을 속입니다.','주변 적이 많을수록 공격력과 기동성이 높아집니다.','2.4초간 기동성이 높아지고 잔상 6기가 흩어져 적의 조준을 속입니다.'],
 ['Lone Hussar','Seven to One','Nearby enemies increase your firepower and maneuverability.','Gain agility for 2.4 seconds while six decoys scatter to mislead enemy aim.','Nearby enemies increase your firepower and maneuverability.','Gain agility for 2.4 seconds while six decoys scatter to mislead enemy aim.']),
 boelcke:entry(
 ['딕타 뵐케','전술 협공','편대 2기가 표적을 나눠 맡습니다.','8초간 윙맨 4기가 추가 합류해 좌우에서 적의 후방을 협공합니다.','편대 2기가 표적을 나눠 맡습니다. 적의 측면과 후방을 공격하면 추가 피해를 줍니다.','8초간 윙맨 4기가 추가 합류해 좌우에서 적의 후방을 협공합니다.'],
 ['Dicta Boelcke','Tactical Pincer','Two permanent wingmen divide targets.','Four extra wingmen join for 8 seconds to flank an enemy and attack from behind.','Two permanent wingmen divide targets. Flank and rear attacks deal extra damage.','Four extra wingmen join for 8 seconds to flank an enemy and attack from behind.']),
 udet:entry(
 ['공중 곡예사','Du doch nicht! · 배럴 롤 역습','적탄을 아슬아슬하게 피하면 기관총 피해·선회가 강해집니다.','회피 중첩을 소비해 배럴 롤 뒤 빠른 반격 사격으로 전환합니다.','무적·회피기 중이 아닐 때 적 기관총탄을 근접 회피하면 6초간 기관총 피해 +8%, 선회 +8%. 최대 3중첩이며 다시 성공하면 지속시간이 갱신됩니다. 피격 시 초기화됩니다.','0.42초간 무적 배럴 롤로 감속하며 사격을 멈춘 뒤, 2.4초간 선회 +60%. 소비한 패시브 중첩당 연사 +15% (최대 +45%). 탄약을 사용하고 직접 조준합니다. 강화 시 반격 시간이 35% 증가합니다.'],
 ['Aerial Acrobat','Du doch nicht! · Barrel-Roll Counter','Narrowly dodge enemy gunfire to build machine-gun damage and turning.','Spend graze stacks to roll defensively, then counterattack.','A close pass by an enemy gun round grants +8% machine-gun damage and +8% turning for 6 seconds, up to 3 stacks. Successful grazes refresh the timer; taking damage clears it. Invulnerable and evade passes do not count.','Brake and stop firing during a 0.42-second invulnerable barrel roll, then gain +60% turning for 2.4 seconds. Each consumed graze stack adds +15% fire rate, up to +45%. Uses ammunition and manual aim. Enhanced: counter window lasts 35% longer.']),
 goering:entry(
 ['백색 편대장','화이트 플라이트','백색 윙맨 2기와 함께 출격합니다.','5초간 백색 윙맨이 좌우로 벌어져 강한 교차 사격을 합니다.','백색 윙맨 2기와 함께 출격합니다.','5초간 백색 윙맨이 좌우로 벌어져 강한 교차 사격을 합니다.'],
 ['White Flight Leader','White Flight','Begin each sortie with two permanent white wingmen.','White wingmen split left and right for powerful crossing fire for 5 seconds.','Begin each sortie with two permanent white wingmen.','White wingmen split left and right for powerful crossing fire for 5 seconds.']),
 immelmann:entry(
 ['릴의 독수리','임멜만 턴','급격히 방향을 바꾼 직후 잠시 사격이 정밀해지고 연사가 빨라집니다.','반원 선회로 방향을 바꾸며 탄막을 걷어내고 잠시 무적이 됩니다.','급격히 방향을 바꾼 직후 잠시 사격이 정밀해지고 연사가 빨라집니다.','반원 선회로 방향을 바꾸며 탄막을 걷어내고 잠시 무적이 됩니다. 반대 방향으로 관통 사격합니다.'],
 ['Eagle of Lille','Immelmann Turn','Sharp turns briefly tighten gun spread and increase fire rate.','Make a level half turn, clearing bullets and briefly becoming invulnerable.','Sharp turns briefly tighten gun spread and increase fire rate.','Make a level half turn, clearing bullets and briefly becoming invulnerable. Fire piercing rounds in the opposite direction.']),
 huffzky:entry(
 ['에만의 엄호','슐라스타 15','후방 사수가 적을 조준해 점사합니다.','3초간 추격기를 유도하며 후방으로 강한 점사를 네 차례 가합니다.','후방 사수가 적을 조준해 점사합니다. 명중하면 적의 조준을 흐트러뜨립니다.','3초간 추격기를 유도하며 후방으로 강한 점사를 네 차례 가합니다.'],
 ['Ehmann\'s Cover','Schlasta 15','The rear gunner aims and fires bursts, disrupting enemy aim on hit.','Draw in pursuers and fire four powerful rear-gunner bursts over 3 seconds.','The rear gunner aims and fires bursts, disrupting enemy aim on hit.','Draw in pursuers and fire four powerful rear-gunner bursts over 3 seconds.']),
 berthold:entry(
 ['날개 달린 검','아이언 나이트','큰 피해를 받으면 일부를 반격을 위해 축적합니다.','5초간 피격 흔들림을 억누릅니다.','큰 피해를 받으면 일부를 반격을 위해 축적합니다.','5초간 피격 흔들림을 억누릅니다. 피해를 충분히 버티면 마지막 일제사격을 합니다.'],
 ['Winged Sword','Iron Knight','Store part of a heavy hit for a retaliatory salvo.','Resist hit shake for 5 seconds.','Store part of a heavy hit for a retaliatory salvo.','Resist hit shake for 5 seconds. Endure enough damage to unleash a final salvo.']),
 wolff:entry(
 ['여린 꽃','붐 앤 줌','피격 없이 버틸수록 공격력과 속도가 증가합니다.','고도를 얻은 뒤 급강하합니다.','피격 없이 버틸수록 공격력과 속도가 증가합니다. 맞으면 쌓인 효과가 줄어듭니다.','고도를 얻은 뒤 급강하합니다. 속도와 화력이 강해지지만 선회가 둔해집니다.'],
 ['Tender Flower','Boom and Zoom','Avoiding hits builds damage and speed.','Climb, then dive.','Avoiding hits builds damage and speed. Taking a hit reduces the bonus.','Climb, then dive. Gain speed and firepower, but turn more slowly.']),
 loewenhardt:entry(
 ['옐로 포커','라이징 스트라이크','적과 정면으로 맞붙으면 기관총 피해가 증가합니다.','낮게 진입한 뒤 수직 상승하며 강한 연속 사격을 합니다.','적과 정면으로 맞붙으면 기관총 피해가 증가합니다.','낮게 진입한 뒤 수직 상승하며 강한 연속 사격을 합니다. 선회는 둔해집니다.'],
 ['Yellow Fokker','Rising Strike','Deal more machine-gun damage in a head-on engagement.','Enter low, then climb vertically with powerful rapid fire and slower turns.','Deal more machine-gun damage in a head-on engagement.','Enter low, then climb vertically with powerful rapid fire and slower turns.']),
 jacobs:entry(
 ['검은 악마','야스타 7','가까운 적을 계속 사격하면 적의 조준과 추적을 흐트러뜨립니다.','4초간 부채꼴로 사격합니다.','가까운 적을 계속 사격하면 적의 조준과 추적을 흐트러뜨립니다.','4초간 부채꼴로 사격합니다. 정면의 가까운 적에게 탄환을 집중합니다.'],
 ['Black Devil','Jasta 7','Sustained close-range fire disrupts enemy aim and pursuit.','Fire a narrow fan for 4 seconds, concentrating rounds on close enemies ahead.','Sustained close-range fire disrupts enemy aim and pursuit.','Fire a narrow fan for 4 seconds, concentrating rounds on close enemies ahead.']),
 gontermann:entry(
 ["기구 사냥꾼","집중 점화","같은 표적에 연속 명중하면 점화를 준비합니다.","관통 점사에 이어 소이 점사로 한 표적을 불태웁니다.","같은 표적에 연속 명중하면 연료 누출과 함께 집중 점화를 준비합니다. 표적을 바꾸거나 공격이 끊기면 다시 준비해야 합니다.","관통 점사 후 소이 점사를 가합니다. 준비된 표적이나 앞선 관통탄이 맞은 부위에 명중하면 강한 국소 화재가 발생합니다. 주변으로 번지지는 않습니다. 탄약이 필요합니다."],
 ["Balloon Hunter","Focused Ignition","Consecutive hits on one target prepare ignition.","Pierce, then ignite one target with an incendiary burst.","Consecutive hits on the same target produce a fuel-leak cue and prepare ignition. Switching targets or breaking contact resets preparation.","Fire a piercing burst followed by incendiaries. Hit the prepared target or the part pierced by the opening burst to start an intense local fire. It does not spread. Requires ammunition."]),
 lothar:entry(
 ['격추 확인 생략','한 놈 더','기관총 격추 후 다른 적을 맞히면 탄띠를 회수하고 빠르게 선회합니다.','5초간 연속 사격. 격추 후 재교전할 때마다 지속시간이 늘어납니다.','직접 기관총으로 적 항공기를 격추한 뒤 2.5초 안에 다른 항공기를 맞히면 탄띠 10%를 회수하고 1.5초간 선회력 +40%. 한 격추당 한 번이며, 재장전 중에는 탄약을 회수하지 않습니다.','5초간 기관총 연사 +50%, 비행속도 +15%. 패시브 재교전 성공마다 1초 연장되며 최대 3초까지 연장됩니다. 탄약을 소모하며 직접 조준해야 합니다. 강화 시 기본 지속시간 6.5초.'],
 ['No Confirmation','One More!','After a gun kill, hit another aircraft to recover ammunition and turn faster.','Keep firing for 5 seconds; re-engaging after a kill extends the attack.','After personally shooting down an aircraft with machine guns, hit another aircraft within 2.5 seconds to recover 10% of each belt and gain 40% turn rate for 1.5 seconds. Once per kill; ammunition is not recovered while reloading.','For 5 seconds, gain 50% machine-gun fire rate and 15% flight speed. Each passive re-engagement adds 1 second, up to 3 extra seconds. Requires ammunition and manual aim. Enhanced base duration: 6.5 seconds.']),
 sachsenberg:entry(
 ['융커스의 날개','발트해의 매','전금속 기체가 받는 피해를 줄입니다.','3초간 무적 상승 후 빠르게 급강하하며 강한 연속 사격을 합니다.','전금속 기체가 받는 피해를 줄입니다.','3초간 무적 상승 후 빠르게 급강하하며 강한 연속 사격을 합니다.'],
 ['Junkers Wings','Baltic Hawk','Your all-metal airframe reduces incoming damage.','Climb invulnerably, then dive into powerful rapid fire over 3 seconds.','Your all-metal airframe reduces incoming damage.','Climb invulnerably, then dive into powerful rapid fire over 3 seconds.']),
 proctor:entry(
 ["기선 제압","전선 돌파","새 표적을 맞히면 일반 적의 다음 사격을 늦춥니다.","네 차례의 관통 점사 사이에 방향을 바꿔 전열을 제압합니다.","새 표적에 명중하면 일반 적의 다음 사격을 잠깐 늦춥니다. 같은 적에게 연속으로 적용되지 않으며, 보스의 공격 패턴은 취소하지 않습니다.","관통 점사를 네 차례 가합니다. 각 점사 중에는 발사 방향이 고정되며, 점사 사이에 다음 방향을 잡습니다. 여러 적을 제압하거나 한 부위에 집중할 수 있습니다. 탄약이 필요합니다."],
 ["Seize the Initiative","Break the Line","A first hit briefly delays an ordinary enemy's next shot.","Re-aim between four piercing bursts to break the line.","Hitting a fresh target briefly delays an ordinary enemy's next shot. Repeated hits cannot keep it locked down, and boss attack patterns are never cancelled.","Fire four piercing bursts. Each burst holds its firing heading; re-aim in the gaps. Suppress several enemies or concentrate on one boss part. Requires ammunition."]),
 schleich:entry(
 ['흑기사','블랙 어드밴스','받는 피해가 감소합니다.','3초간 빠르게 돌입하며 받는 피해를 크게 줄입니다.','받는 피해가 감소합니다.','3초간 빠르게 돌입하며 받는 피해를 크게 줄입니다. 선회는 둔해집니다.'],
 ['Black Knight','Black Advance','Reduce incoming damage.','Advance faster and greatly reduce incoming damage for 3 seconds.','Reduce incoming damage.','Advance faster and greatly reduce incoming damage for 3 seconds. Turns are slower.']),
 lufbery:entry(
 ["라파예트 동료","라파예트 방어선회","동료기 1기가 후방 추격기를 우선 엄호합니다.","동료 2기가 추가 합류해 발동 지점에서 서로의 후미를 엄호합니다.","동료기 1기와 출격합니다. 뒤따르는 적을 우선 견제하며 실제 사격으로 후방을 엄호합니다.","동료 2기가 추가 합류해 기존 동료와 함께 발동 지점 주변을 선회하며 서로의 후미를 엄호합니다. 추격기를 편대 사선으로 유인하세요. 플레이어의 이동은 제한하지 않습니다."],
 ["Lafayette Comrade","Lafayette Defensive Turn","One comrade prioritizes covering your tail.","Two more comrades join to cover one another around the activation point.","Sortie with one comrade who prioritizes pursuing enemies and covers your tail with real gunfire.","Two additional comrades join your wingman, circling the activation point and covering one another's tails. Draw pursuers across their firing paths. Your own movement remains unrestricted."]),
 brumowski:entry(
 ['붉은 호위대','편대 재집결','호위기 2기와 출격합니다.','5초간 자기 편대를 주변으로 모아 가까운 적을 제압하고 받는 피해를 줄입니다.','호위기 2기와 출격합니다. 아군과 윙맨이 많을수록 기관총 피해가 증가합니다.','5초간 자기 편대를 주변으로 모아 가까운 적을 제압하고 받는 피해를 줄입니다.'],
 ['Red Escort','Flight Rally','Deploy with two escorts.','Regroup your flight nearby for 5 seconds to suppress close threats and reduce incoming damage.','Deploy with two escorts. Allied aircraft and wingmen increase gun damage.','Regroup your flight nearby for 5 seconds to suppress close threats and reduce incoming damage.']),
 fonck:entry(
 ["정밀의 에이스","필살의 일제사격","안정적으로 조준하면 적의 이동을 앞서 겨냥합니다.","짧게 준비한 뒤 한 방향으로 관통 일제사격을 합니다.","같은 적을 기수 정면에 안정적으로 조준하면 이동 방향을 앞서 겨냥합니다. 발사된 탄은 휘지 않습니다.","짧은 준비 후 한 방향으로 강한 관통 점사를 한 차례 가합니다. 발사 방향을 맞춰 겹친 적이나 보스 부위를 노리세요. 탄약이 필요하며 재장전 중에는 사용할 수 없습니다."],
 ["Precision Ace","Decisive Volley","Steady aim leads a moving target.","Prepare, then fire one decisive piercing volley.","Keep an enemy steadily in front of the nose to lead its movement. Rounds never home after firing.","After a brief preparation, fire one powerful piercing volley along a fixed heading. Line up enemies or an exposed boss part. Requires ammunition; unavailable while reloading."]),
 collishaw:entry(
 ['블랙 플라이트','블랙 마리아','검은 삼엽기 윙맨 2기가 서로 다른 적을 압박합니다.','6초간 검은 편대가 좌우로 갈라져 적을 협공합니다.','검은 삼엽기 윙맨 2기가 서로 다른 적을 압박합니다.','6초간 검은 편대가 좌우로 갈라져 적을 협공합니다.'],
 ['Black Flight','Black Maria','Two permanent Black Flight wingmen pressure separate enemies.','Black Flight splits left and right to attack from different angles for 6 seconds.','Two permanent Black Flight wingmen pressure separate enemies.','Black Flight splits left and right to attack from different angles for 6 seconds.']),
 baracca:entry(
 ['바라카의 말','카발리노 람판테','적과 정면으로 맞붙으면 기관총 피해가 증가합니다.','잠시 무적이 되어 정면으로 돌격하고 경로상의 적에게 피해를 줍니다.','적과 정면으로 맞붙으면 기관총 피해가 증가합니다.','잠시 무적이 되어 정면으로 돌격하고 경로상의 적에게 피해를 줍니다.'],
 ['Baracca\'s Horse','Cavallino Rampante','Deal more machine-gun damage in a head-on engagement.','Charge straight ahead, briefly invulnerable, damaging enemies in your path.','Deal more machine-gun damage in a head-on engagement.','Charge straight ahead, briefly invulnerable, damaging enemies in your path.']),
 guynemer:entry(
 ['모퇴르 카농','황새의 포화','4초마다 전방으로 강력한 관통 기관포를 발사합니다.','3초간 르 프리외르 로켓을 여러 방향으로 쏟아냅니다.','4초마다 전방으로 강력한 관통 기관포를 발사합니다.','3초간 르 프리외르 로켓을 여러 방향으로 쏟아냅니다.'],
 ['Moteur-Canon','Stork Barrage','Fire a powerful piercing cannon round ahead every 4 seconds.','Unleash Le Prieur rockets in multiple directions for 3 seconds.','Fire a powerful piercing cannon round ahead every 4 seconds.','Unleash Le Prieur rockets in multiple directions for 3 seconds.']),
 bishop:entry(
 ['근접 사냥','게릴라 나이트','적에게 가까이 접근할수록 기관총 피해가 증가합니다.','화면 밖으로 상승 후 재진입하며 폭탄 8발을 투하합니다.','적에게 가까이 접근할수록 기관총 피해가 증가합니다.','화면 밖으로 상승 후 재진입하며 폭탄 8발을 투하합니다.'],
 ['Close Hunter','Guerrilla Night','Machine-gun damage increases as you close on an enemy.','Rise off-screen and re-enter with eight bombs.','Machine-gun damage increases as you close on an enemy.','Rise off-screen and re-enter with eight bombs.']),
 mannock:entry(
 ['74비행대 지휘','74비행대 교차강하','아군 편대기와 윙맨의 연사가 15% 빨라집니다.','S.E.5a 7기씩 두 차례 진입해 교차 관통 사격합니다.','아군 편대기와 윙맨의 연사 속도가 15% 증가합니다.','S.E.5a 7기가 위에서 강하한 뒤, 다른 7기가 측면에서 가로질러 관통 사격합니다.'],
 ['74 Squadron Command','74 Sqn Cross Dive','Allied wingmen fire 15% faster.','Seven S.E.5as make two crossing strafing runs with piercing fire.','Increase allied wingmen fire rate by 15%.','Seven S.E.5as dive from above; seven more cross from the side, firing piercing rounds.']),
 mckeever:entry(
 ['파월의 엄호','호크 앤 냇','파월이 후방의 적을 독립적으로 조준해 견제합니다.','5초간 전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다.','파월이 후방의 적을 독립적으로 조준해 견제합니다.','5초간 전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다.'],
 ['Powell\'s Cover','Hawk & Gnat','Powell independently aims at and suppresses enemies behind you.','Front and rear gunners track and fire at separate enemies for 5 seconds.','Powell independently aims at and suppresses enemies behind you.','Front and rear gunners track and fire at separate enemies for 5 seconds.']),
 hawker:entry(
 ['연속 추적','어택 에브리싱','격추 후 다음 가까운 적을 표시합니다.','5초간 적을 격추하면 총구가 다음 가까운 적을 잠시 따라갑니다.','격추 후 다음 가까운 적을 표시합니다.','5초간 적을 격추하면 총구가 다음 가까운 적을 잠시 따라갑니다.'],
 ['Relentless Hunt','Attack Everything','After a kill, highlights the next nearby enemy.','For 5 seconds, each kill briefly guides your guns toward the next nearby enemy.','After a kill, highlights the next nearby enemy.','For 5 seconds, each kill briefly guides your guns toward the next nearby enemy.']),
 mccudden:entry(
 ['플라잉 메카닉','야전 정비','레벨업 선택지가 4개로 늘어납니다.','주변에 수리 보급품 3개를 투하합니다.','레벨업 선택지가 4개로 늘어납니다.','주변에 수리 보급품 3개를 투하합니다. 협동 아군도 회수할 수 있습니다.'],
 ['Flying Mechanic','Field Repair','Gain four choices at each level.','Drop three repair supplies nearby.','Gain four choices at each level.','Drop three repair supplies nearby. Co-op allies can collect them too.']),
 nungesser:entry(
 ['검은 심장의 반격','죽음의 기사 · 돌파','적탄을 가까스로 피하면 다음 사격에 관통탄 2발로 반격합니다.','3초간 기관총이 적을 관통하며 탄로에 닿은 적탄을 요격합니다.','무적·회피 중이 아닐 때 적탄을 근접 회피하면 2초 안의 다음 기관총 사격에 관통탄 2발을 추가합니다. 각 탄환은 일반 기관총탄 피해의 75%. 재발동 간격 1초.','3초간 직접 조준하는 기관총탄이 적을 관통하고, 탄로 9px 안의 적탄을 요격합니다. 발동 직후 0.5초만 무적이며 측후방과 탄로 밖 공격은 직접 피해야 합니다.'],
 ['Black Heart Reprisal','Knight of Death · Breakthrough','A close dodge arms two piercing rounds for your next shot.','For 3 seconds, machine-gun rounds pierce enemies and intercept incoming gunfire along their paths.','Narrowly dodge enemy gunfire while vulnerable to arm two piercing rounds for the next machine-gun shot within 2 seconds. Each deals 75% of normal round damage. Rearm interval: 1 second.','For 3 seconds, manually aimed machine-gun rounds pierce enemies and intercept hostile rounds within 9px of their paths. Only the first 0.5 seconds are invulnerable; dodge attacks from behind, the sides and outside your fire.']),
 rickenbacker:entry(
 ['레이서의 본능','햇 인 더 링 록온','반경 700px 내 적 1기당 기관총 공격력 +6% (최대 +30%).','4초간 사격할 때마다 반경 780px 내 각 적에게 자동 조준 관통탄을 추가 발사합니다.','반경 700px 내 적 1기당 기관총 공격력 +6% (최대 +30%).','4초간 사격할 때마다 반경 780px 내 각 적에게 자동 조준 관통탄을 추가 발사합니다.'],
 ['Racer\'s Instinct','Hat in the Ring Lock-On','Machine-gun damage +6% per enemy within 700px (max +30%).','For 4 seconds, every shot also launches an auto-aimed piercing round at each enemy within 780px.','Machine-gun damage +6% per enemy within 700px (max +30%).','For 4 seconds, every shot also launches an auto-aimed piercing round at each enemy within 780px.']),
 ball:entry(
 ['고독한 사냥꾼','구름 속의 매','주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.','1.5초간 잔상으로 적의 조준을 속입니다.','주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.','1.5초간 잔상으로 적의 조준을 속입니다. 재등장 후 혼자 적의 후방을 공격하면 큰 피해를 줍니다.'],
 ['Lone Hunter','Hawk in the Clouds','Deal more machine-gun damage when no ally or wingman is nearby.','Mislead enemy aim with a ghost for 1.5 seconds.','Deal more machine-gun damage when no ally or wingman is nearby.','Mislead enemy aim with a ghost for 1.5 seconds. Reappear alone behind an enemy for a powerful ambush.']),
 barker:entry(
 ['불굴의 각성','라스트 스탠드','피격될수록 잠시 공격력이 증가하고 기체 손상이 뚜렷해집니다.','6초간 체력이 1 아래로 떨어지지 않습니다.','피격될수록 잠시 공격력이 증가하고 기체 손상이 뚜렷해집니다.','6초간 체력이 1 아래로 떨어지지 않습니다. 피격될수록 기체 손상과 사격 반응이 격해집니다.'],
 ['Unbroken Will','Last Stand','Taking hits briefly boosts damage and adds visible aircraft damage.','Health cannot drop below 1 for 6 seconds.','Taking hits briefly boosts damage and adds visible aircraft damage.','Health cannot drop below 1 for 6 seconds. Hits intensify aircraft damage and gunfire effects.']),
 luke:entry(
 ["벌룬 버스터","연쇄 폭파","비행선과 비행선형 보스에게 기관총 피해 +20%.","점화 점사 후 기폭 점사로 가까운 표적들을 연쇄 폭파합니다.","비행선과 비행선형 보스에게 주는 기관총 피해가 20% 증가합니다. 일반 폭격기와 지상 보스에는 적용되지 않습니다.","소이 점사로 불을 붙인 뒤 기폭 점사를 가합니다. 불붙은 표적에 맞히면 주변의 불붙은 적까지 차례로 유폭합니다. 살아 있는 표적을 강제로 격추하지 않으며, 연쇄는 최대 6곳까지만 이어집니다. 탄약이 필요합니다."],
 ["Balloon Buster","Chain Detonation","Machine-gun damage +20% against airships and airship bosses.","Ignite, then detonate nearby burning targets in sequence.","Deal 20% more machine-gun damage to airships, including airship bosses. Ordinary bombers and ground bosses are excluded.","Fire incendiary bursts followed by detonating bursts. A hit on a burning target triggers nearby burning enemies in sequence, up to six detonations. Targets are damaged, not automatically killed. Requires ammunition."])
};
export const pilotIdentityCopy=(id,locale='ko')=>PILOT_IDENTITY_COPY[id]?.[locale==='en'?'en':'ko'];

