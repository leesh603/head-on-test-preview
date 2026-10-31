// One presentation catalog for hangar, HUD, Korean/English and field record.
// Numbers below describe base pilot abilities before aircraft/gear multipliers.
const entry=(ko,en)=>({ko:{passive:ko[0],skill:ko[1],passiveShort:ko[2],activeShort:ko[3],passiveDetail:ko[4],activeDetail:ko[5]},en:{passive:en[0],skill:en[1],passiveShort:en[2],activeShort:en[3],passiveDetail:en[4],activeDetail:en[5]}});
// Skill titles preserve approved emblems, unit names and spoken foreign names.
// Fit the available title width; never shorten an approved name to a syllable cap.
// Aircraft-specific entries use the existing pilot:aircraft display key.
export const PILOT_IDENTITY_COPY={
 navarre:entry(
 ["열세의 사냥꾼","베르됭 봉쇄","주변 적기가 아군보다 많으면 기관총탄이 적 한 기를 추가 관통합니다.","방어 공역 안에서 직접 맞힌 적의 엔진을 손상시켜 느리게 합니다.","주변의 살아 있는 적기가 자신과 아군기보다 많으면 자신의 기관총탄이 적 한 기를 추가로 관통합니다.","발동 지점에 잠시 방어 공역을 설정합니다. 공역 안의 적을 직접 기관총으로 맞히면 엔진 손상으로 느려지며, 공역을 벗어나도 잠깐 유지됩니다."],
 ["Outnumbered Hunter","Verdun Blockade","Your machine-gun rounds pierce one extra enemy when nearby hostiles outnumber friendlies.","Direct gun hits inside a defensive airspace damage enemy engines and slow them.","When nearby live hostile aircraft outnumber you and friendly aircraft, your own machine-gun rounds pierce one additional enemy.","Establish temporary defensive airspace at your activation position. Direct machine-gun hits on enemies inside damage their engines and slow them, briefly persisting after they leave."]),
 frommherz:entry(
 ["비행 교관","강제 착륙","내가 맞힌 표적을 함께 공격하는 주변 내 윙맨의 사격이 정밀해집니다.","전방 제압 사격으로 약해진 일반 적기를 강제 착륙시킵니다.","최근 내가 직접 맞힌 표적을 함께 공격하는 주변의 내 윙맨은 사격 정확도가 높아집니다. 다른 플레이어의 윙맨에는 적용되지 않습니다.","잠시 전방 제압 사격을 가합니다. 체력이 낮은 일반 적기를 직접 맞히면 공격을 멈추고 하강 이탈하며 정상 격추 보상을 한 번 지급합니다. 에이스와 보스는 강제 이탈 없이 사격 피해만 받습니다."],
 ["Flight Instructor","Forced Landing","Nearby wingmen you own aim more accurately at a target you have hit.","Forward suppressive fire forces weakened ordinary enemies to land.","Your nearby wingmen gain accuracy while firing at the same target you recently hit directly. Other players’ wingmen do not receive this benefit.","Briefly fire forward suppressive bursts. Direct hits on low-health ordinary aircraft force a descending disengagement, stopping their attacks and granting normal kill rewards once. Aces and bosses take gunfire damage but cannot be forced out."]),
 'baron:baron_albatros':entry(
 ["붉은 날개","태양의 사냥꾼","이동속도와 선회력이 증가합니다.","전방의 적을 제압하고 후방 공격을 강화합니다.","이동속도와 선회력이 증가합니다.","4초간 전방 적을 제압합니다. 적의 바로 뒤에서 공격하면 추가 피해를 줍니다."],
 ["Red Wings","Sun Hunter","Increase flight speed and turn rate.","Suppress enemies ahead and strengthen rear attacks.","Increases flight speed and turn rate.","Suppress enemies ahead for 4 seconds. Attacks from directly behind deal extra damage."]),
 baron:entry(
 ["사냥 본능","드라이데커","강한 적을 계속 추적해 명중시키면 피해가 증가합니다.","감속해 급선회하며 추적 중인 적에게 큰 피해를 줍니다.","강한 적을 계속 맞히며 추적할수록 피해가 증가합니다. 사냥감 격추 후 잠시 빨라집니다.","4초간 감속해 급선회하며 사냥감에게 큰 피해를 줍니다. 적의 후방을 잡으면 가속합니다."],
 ["Hunting Instinct","Dreidecker","Keep tracking and hitting tough enemies to increase damage.","Slow down and turn tightly to deal heavy damage to your prey.","Keep hitting and tracking tough prey to build damage. A kill briefly boosts speed.","Slow down and turn tightly for 4 seconds to hit your prey harder. Taking its tail boosts speed."]),
 voss:entry(
 ["고독한 후사르","세븐 투 원","주변의 적이 많을수록 공격력과 기동성이 증가합니다.","기동성이 증가하고 잔상으로 적의 조준을 교란합니다.","주변 적이 많을수록 공격력과 기동성이 높아집니다.","2.4초간 기동성이 높아지고 잔상 6기가 흩어져 적의 조준을 속입니다."],
 ["Lone Hussar","Seven to One","Nearby enemies increase firepower and maneuverability.","Gain maneuverability and scatter decoys to disrupt enemy aim.","Nearby enemies increase your firepower and maneuverability.","Gain agility for 2.4 seconds while six decoys scatter to mislead enemy aim."]),
 boelcke:entry(
 ["딕타 뵐케","전술 협공","윙맨이 표적을 나눠 맡고 측후방 공격을 강화합니다.","추가 윙맨을 호출해 적의 후방을 협공합니다.","편대 2기가 표적을 나눠 맡습니다. 적의 측면과 후방을 공격하면 추가 피해를 줍니다.","8초간 윙맨 4기가 추가 합류해 좌우에서 적의 후방을 협공합니다."],
 ["Dicta Boelcke","Tactical Pincer","Wingmen divide targets and strengthen flank and rear attacks.","Call extra wingmen to attack enemies from behind.","Two permanent wingmen divide targets. Flank and rear attacks deal extra damage.","Four extra wingmen join for 8 seconds to flank an enemy and attack from behind."]),
 udet:entry(
 ["공중 곡예사","Du doch nicht! · 배럴 롤 역습","적탄을 가까스로 피하면 기관총 피해와 선회력이 증가합니다.","회피 중첩을 소모해 무적 배럴 롤 후 반격 사격을 강화합니다.","무적·회피기 중이 아닐 때 적 기관총탄을 근접 회피하면 6초간 기관총 피해 +8%, 선회 +8%. 최대 3중첩이며 다시 성공하면 지속시간이 갱신됩니다. 피격 시 초기화됩니다.","0.42초간 무적 배럴 롤로 감속하며 사격을 멈춘 뒤, 2.4초간 선회 +60%. 소비한 패시브 중첩당 연사 +15% (최대 +45%). 탄약을 사용하고 직접 조준합니다. 강화 시 반격 시간이 35% 증가합니다."],
 ["Aerial Acrobat","Du doch nicht! · Barrel-Roll Counter","Narrowly dodge gunfire to increase machine-gun damage and turn rate.","Spend graze stacks on an invulnerable barrel roll and stronger counterfire.","A close pass by an enemy gun round grants +8% machine-gun damage and +8% turning for 6 seconds, up to 3 stacks. Successful grazes refresh the timer; taking damage clears it. Invulnerable and evade passes do not count.","Brake and stop firing during a 0.42-second invulnerable barrel roll, then gain +60% turning for 2.4 seconds. Each consumed graze stack adds +15% fire rate, up to +45%. Uses ammunition and manual aim. Enhanced: counter window lasts 35% longer."]),
 goering:entry(
 ["백색 편대장","화이트 플라이트","백색 윙맨과 함께 출격합니다.","백색 윙맨이 좌우로 갈라져 교차 사격합니다.","백색 윙맨 2기와 함께 출격합니다.","5초간 백색 윙맨이 좌우로 벌어져 강한 교차 사격을 합니다."],
 ["White Flight Leader","White Flight","Deploy with white wingmen.","White wingmen split left and right to deliver crossing fire.","Begin each sortie with two permanent white wingmen.","White wingmen split left and right for powerful crossing fire for 5 seconds."]),
 immelmann:entry(
 ["릴의 독수리","임멜만 턴","급선회하면 잠시 사격 정확도와 연사 속도가 증가합니다.","잠시 무적 상태로 방향을 바꾸며 적탄을 제거하고 관통 사격합니다.","급격히 방향을 바꾼 직후 잠시 사격이 정밀해지고 연사가 빨라집니다.","반원 선회로 방향을 바꾸며 탄막을 걷어내고 잠시 무적이 됩니다. 반대 방향으로 관통 사격합니다."],
 ["Eagle of Lille","Immelmann Turn","Sharp turns briefly increase accuracy and fire rate.","Turn while briefly invulnerable, clearing hostile rounds and firing piercing shots.","Sharp turns briefly tighten gun spread and increase fire rate.","Make a level half turn, clearing bullets and briefly becoming invulnerable. Fire piercing rounds in the opposite direction."]),
 huffzky:entry(
 ["에만의 엄호","슐라스타 15","후방 사수가 추격하는 적을 견제하고 조준을 교란합니다.","추격하는 적을 유인하며 후방으로 강력한 점사를 가합니다.","후방 사수가 적을 조준해 점사합니다. 명중하면 적의 조준을 흐트러뜨립니다.","3초간 추격기를 유도하며 후방으로 강한 점사를 네 차례 가합니다."],
 ["Ehmann's Cover","Schlasta 15","The rear gunner pressures pursuers and disrupts their aim.","Lure pursuers and deliver powerful rear-gunner bursts.","The rear gunner aims and fires bursts, disrupting enemy aim on hit.","Draw in pursuers and fire four powerful rear-gunner bursts over 3 seconds."]),
 berthold:entry(
 ["날개 달린 검","아이언 나이트","큰 피해의 일부를 반격용으로 축적합니다.","피격 흔들림을 줄이고 피해를 충분히 버티면 일제사격합니다.","큰 피해를 받으면 일부를 반격을 위해 축적합니다.","5초간 피격 흔들림을 억누릅니다. 피해를 충분히 버티면 마지막 일제사격을 합니다."],
 ["Winged Sword","Iron Knight","Store part of heavy incoming damage for a counterattack.","Reduce hit shake and endure enough damage to unleash a salvo.","Store part of a heavy hit for a retaliatory salvo.","Resist hit shake for 5 seconds. Endure enough damage to unleash a final salvo."]),
 wolff:entry(
 ["여린 꽃","붐 앤 줌","피격되지 않을수록 공격력과 이동속도가 증가합니다.","상승 후 급강하하며 속도와 화력을 높이지만 선회가 둔해집니다.","피격 없이 버틸수록 공격력과 속도가 증가합니다. 맞으면 쌓인 효과가 줄어듭니다.","고도를 얻은 뒤 급강하합니다. 속도와 화력이 강해지지만 선회가 둔해집니다."],
 ["Tender Flower","Boom and Zoom","Avoid hits to build damage and flight speed.","Climb and dive to gain speed and firepower at the cost of turning.","Avoiding hits builds damage and speed. Taking a hit reduces the bonus.","Climb, then dive. Gain speed and firepower, but turn more slowly."]),
 loewenhardt:entry(
 ["옐로 포커","라이징 스트라이크","적과 정면으로 교전하면 기관총 피해가 증가합니다.","낮게 진입한 뒤 수직 상승하며 강력한 연속 사격을 가합니다.","적과 정면으로 맞붙으면 기관총 피해가 증가합니다.","낮게 진입한 뒤 수직 상승하며 강한 연속 사격을 합니다. 선회는 둔해집니다."],
 ["Yellow Fokker","Rising Strike","Head-on engagements increase machine-gun damage.","Enter low and climb vertically with powerful rapid fire.","Deal more machine-gun damage in a head-on engagement.","Enter low, then climb vertically with powerful rapid fire and slower turns."]),
 jacobs:entry(
 ["검은 악마","야스타 7","같은 적을 다른 사선에서 다시 맞히면 잠시 기관총 피해가 증가합니다.","부채꼴로 사격하며 정면의 가까운 적에게 화력을 집중합니다.","7초 안에 100px 이상 이동하고 사선을 60도 이상 바꿔 같은 적을 직접 맞히면, 이후 1.2초간 발사하는 기관총탄이 그 적에게 주는 피해가 35% 증가합니다. 재발동 간격은 3초입니다.","4초간 부채꼴로 사격합니다. 정면의 가까운 적에게 탄환을 집중합니다."],
 ["Black Devil","Jasta 7","Hit the same enemy again from a different firing approach to briefly strengthen gunfire.","Fire a fan of rounds and focus on close enemies ahead.","Within 7 seconds, travel at least 100px and change the firing approach by 60 degrees before hitting the same enemy. For 1.2 seconds, newly fired gun rounds deal 35% more damage to that enemy. Retrigger interval: 3 seconds.","Fire a narrow fan for 4 seconds, concentrating rounds on close enemies ahead."]),
 gontermann:entry(
 ["기구 사냥꾼","집중 점화","같은 표적에 연속 명중하면 집중 점화를 준비합니다.","관통 점사 후 소이 점사를 명중시켜 표적에 큰 화재를 일으킵니다.","같은 표적에 연속 명중하면 연료 누출과 함께 집중 점화를 준비합니다. 표적을 바꾸거나 공격이 끊기면 다시 준비해야 합니다.","관통 점사 후 소이 점사를 가합니다. 준비된 표적이나 앞선 관통탄이 맞은 부위에 명중하면 강한 국소 화재가 발생합니다. 주변으로 번지지는 않습니다. 탄약이 필요합니다."],
 ["Balloon Hunter","Focused Ignition","Consecutive hits on one target prepare focused ignition.","Land piercing and incendiary bursts to start an intense fire on the target.","Consecutive hits on the same target produce a fuel-leak cue and prepare ignition. Switching targets or breaking contact resets preparation.","Fire a piercing burst followed by incendiaries. Hit the prepared target or the part pierced by the opening burst to start an intense local fire. It does not spread. Requires ammunition."]),
 lothar:entry(
 ["격추 확인 생략","한 놈 더","기관총 격추 후 다른 적을 맞히면 탄약을 회수하고 선회력이 증가합니다.","연사 속도와 이동속도가 증가하고 격추 후 재교전하면 효과가 연장됩니다.","직접 기관총으로 적 항공기를 격추한 뒤 2.5초 안에 다른 항공기를 맞히면 탄띠 10%를 회수하고 1.5초간 선회력 +40%. 한 격추당 한 번이며, 재장전 중에는 탄약을 회수하지 않습니다.","5초간 기관총 연사 +50%, 비행속도 +15%. 패시브 재교전 성공마다 1초 연장되며 최대 3초까지 연장됩니다. 탄약을 소모하며 직접 조준해야 합니다. 강화 시 기본 지속시간 6.5초."],
 ["No Confirmation","One More!","After a gun kill, hit another enemy to recover ammunition and turn faster.","Gain fire rate and speed; re-engaging after kills extends the effect.","After personally shooting down an aircraft with machine guns, hit another aircraft within 2.5 seconds to recover 10% of each belt and gain 40% turn rate for 1.5 seconds. Once per kill; ammunition is not recovered while reloading.","For 5 seconds, gain 50% machine-gun fire rate and 15% flight speed. Each passive re-engagement adds 1 second, up to 3 extra seconds. Requires ammunition and manual aim. Enhanced base duration: 6.5 seconds."]),
 sachsenberg:entry(
 ["융커스의 날개","발트해의 매","받는 피해가 감소합니다.","무적 상태로 상승한 뒤 급강하하며 강력한 연속 사격을 가합니다.","전금속 기체가 받는 피해를 줄입니다.","3초간 무적 상승 후 빠르게 급강하하며 강한 연속 사격을 합니다."],
 ["Junkers Wings","Baltic Hawk","Reduce incoming damage.","Climb invulnerably, then dive with powerful rapid fire.","Your all-metal airframe reduces incoming damage.","Climb invulnerably, then dive into powerful rapid fire over 3 seconds."]),
 proctor:entry(
 ["기선 제압","전선 돌파","새 표적을 맞히면 일반 적의 다음 사격을 늦춥니다.","관통 점사 사이에 방향을 바꾸며 적을 제압합니다.","새 표적에 명중하면 일반 적의 다음 사격을 잠깐 늦춥니다. 같은 적에게 연속으로 적용되지 않으며, 보스의 공격 패턴은 취소하지 않습니다.","관통 점사를 네 차례 가합니다. 각 점사 중에는 발사 방향이 고정되며, 점사 사이에 다음 방향을 잡습니다. 여러 적을 제압하거나 한 부위에 집중할 수 있습니다. 탄약이 필요합니다."],
 ["Seize the Initiative","Break the Line","Hitting a fresh target delays an ordinary enemy's next shot.","Re-aim between piercing bursts to suppress enemies.","Hitting a fresh target briefly delays an ordinary enemy's next shot. Repeated hits cannot keep it locked down, and boss attack patterns are never cancelled.","Fire four piercing bursts. Each burst holds its firing heading; re-aim in the gaps. Suppress several enemies or concentrate on one boss part. Requires ammunition."]),
 schleich:entry(
 ["흑기사","블랙 어드밴스","받는 피해가 감소합니다.","이동속도가 증가하고 받는 피해가 크게 감소하지만 선회가 둔해집니다.","받는 피해가 감소합니다.","3초간 빠르게 돌입하며 받는 피해를 크게 줄입니다. 선회는 둔해집니다."],
 ["Black Knight","Black Advance","Reduce incoming damage.","Gain speed and greatly reduce incoming damage at the cost of turning.","Reduce incoming damage.","Advance faster and greatly reduce incoming damage for 3 seconds. Turns are slower."]),
 lufbery:entry(
 ["라파예트 동료","라파예트 방어선회","동료기가 후방의 추격하는 적을 우선 견제합니다.","추가 동료기를 호출해 발동 지점 주변에서 서로의 후방을 엄호합니다.","동료기 1기와 출격합니다. 뒤따르는 적을 우선 견제하며 실제 사격으로 후방을 엄호합니다.","동료 2기가 추가 합류해 기존 동료와 함께 발동 지점 주변을 선회하며 서로의 후미를 엄호합니다. 추격기를 편대 사선으로 유인하세요. 플레이어의 이동은 제한하지 않습니다."],
 ["Lafayette Comrade","Lafayette Defensive Turn","A comrade prioritizes covering your tail against pursuers.","Call extra comrades to circle the activation point and cover one another.","Sortie with one comrade who prioritizes pursuing enemies and covers your tail with real gunfire.","Two additional comrades join your wingman, circling the activation point and covering one another's tails. Draw pursuers across their firing paths. Your own movement remains unrestricted."]),
 brumowski:entry(
 ["붉은 호위대","편대 재집결","호위기와 함께 출격하며 주변 아군이 많을수록 기관총 피해가 증가합니다.","편대를 재집결해 가까운 적을 제압하고 받는 피해를 줄입니다.","호위기 2기와 출격합니다. 아군과 윙맨이 많을수록 기관총 피해가 증가합니다.","5초간 자기 편대를 주변으로 모아 가까운 적을 제압하고 받는 피해를 줄입니다."],
 ["Red Escort","Flight Rally","Deploy with escorts; nearby allies increase machine-gun damage.","Rally your flight to suppress close enemies and reduce incoming damage.","Deploy with two escorts. Allied aircraft and wingmen increase gun damage.","Regroup your flight nearby for 5 seconds to suppress close threats and reduce incoming damage."]),
 fonck:entry(
 ["정밀의 에이스","필살의 일제사격","같은 적을 안정적으로 조준하면 이동 방향을 앞서 겨냥합니다.","짧게 준비한 뒤 한 방향으로 강력한 관통 일제사격을 가합니다.","같은 적을 기수 정면에 안정적으로 조준하면 이동 방향을 앞서 겨냥합니다. 발사된 탄은 휘지 않습니다.","짧은 준비 후 한 방향으로 강한 관통 점사를 한 차례 가합니다. 발사 방향을 맞춰 겹친 적이나 보스 부위를 노리세요. 탄약이 필요하며 재장전 중에는 사용할 수 없습니다."],
 ["Precision Ace","Decisive Volley","Steady aim on one enemy leads its movement.","Prepare briefly, then fire a powerful piercing volley along a fixed heading.","Keep an enemy steadily in front of the nose to lead its movement. Rounds never home after firing.","After a brief preparation, fire one powerful piercing volley along a fixed heading. Line up enemies or an exposed boss part. Requires ammunition; unavailable while reloading."]),
 collishaw:entry(
 ["블랙 플라이트","삼연 강습","검은 삼엽기 윙맨이 서로 다른 적을 견제합니다.","지원기 두 대가 발동 방향에 종대로 진입해 시간차로 사격합니다.","검은 삼엽기 윙맨 2기가 서로 다른 적을 압박합니다.","6초간 본기는 직접 조종하고, 지원기 두 대가 발동 방향의 같은 사선에 종대로 진입해 시간차로 사격한 뒤 호위 대형으로 복귀합니다. 무적은 없습니다."],
 ["Black Flight","Threefold Assault","Black Flight wingmen pressure separate enemies.","Two wingmen enter a column along the activation heading and fire in sequence.","Two permanent Black Flight wingmen pressure separate enemies.","For 6 seconds, keep controlling the leader while two wingmen enter one fixed attack lane, fire in sequence, then return to escort formation. Grants no invulnerability."]),
 baracca:entry(
 ["바라카의 말","카발리노 람판테","적과 정면으로 교전하면 기관총 피해가 증가합니다.","잠시 무적 상태로 돌진하며 경로상의 적에게 피해를 줍니다.","적과 정면으로 맞붙으면 기관총 피해가 증가합니다.","잠시 무적이 되어 정면으로 돌격하고 경로상의 적에게 피해를 줍니다."],
 ["Baracca's Horse","Cavallino Rampante","Head-on engagements increase machine-gun damage.","Charge while briefly invulnerable, damaging enemies in your path.","Deal more machine-gun damage in a head-on engagement.","Charge straight ahead, briefly invulnerable, damaging enemies in your path."]),
 guynemer:entry(
 ["모퇴르 카농","황새의 포화","주기적으로 전방에 강력한 관통 기관포를 발사합니다.","여러 방향으로 르 프리외르 로켓을 발사합니다.","4초마다 전방으로 강력한 관통 기관포를 발사합니다.","3초간 르 프리외르 로켓을 여러 방향으로 쏟아냅니다."],
 ["Moteur-Canon","Stork Barrage","Periodically fire a powerful piercing cannon round ahead.","Fire Le Prieur rockets in multiple directions.","Fire a powerful piercing cannon round ahead every 4 seconds.","Unleash Le Prieur rockets in multiple directions for 3 seconds."]),
 bishop:entry(
 ["근접 사냥","게릴라 나이트","적에게 가까울수록 기관총 피해가 증가합니다.","화면 밖으로 상승한 뒤 재진입하며 폭탄을 투하합니다.","적에게 가까이 접근할수록 기관총 피해가 증가합니다.","화면 밖으로 상승 후 재진입하며 폭탄 8발을 투하합니다."],
 ["Close Hunter","Guerrilla Night","Closing on enemies increases machine-gun damage.","Climb off-screen, then return and drop bombs.","Machine-gun damage increases as you close on an enemy.","Rise off-screen and re-enter with eight bombs."]),
 mannock:entry(
 ["74비행대 지휘","74비행대 교차강하","아군 편대기와 윙맨의 연사 속도가 증가합니다.","두 편대를 호출해 서로 다른 방향에서 교차 관통 사격합니다.","아군 편대기와 윙맨의 연사 속도가 15% 증가합니다.","S.E.5a 7기가 위에서 강하한 뒤, 다른 7기가 측면에서 가로질러 관통 사격합니다."],
 ["74 Squadron Command","74 Sqn Cross Dive","Increase allied flight and wingman fire rate.","Call two flights for crossing strafing runs with piercing fire.","Increase allied wingmen fire rate by 15%.","Seven S.E.5as dive from above; seven more cross from the side, firing piercing rounds."]),
 mckeever:entry(
 ["파월의 엄호","호크 앤 냇","후방 사수가 독립적으로 적을 조준해 견제합니다.","전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다.","파월이 후방의 적을 독립적으로 조준해 견제합니다.","5초간 전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다."],
 ["Powell's Cover","Hawk & Gnat","The rear gunner independently aims at and suppresses enemies.","Front and rear gunners track and fire at separate enemies.","Powell independently aims at and suppresses enemies behind you.","Front and rear gunners track and fire at separate enemies for 5 seconds."]),
 hawker:entry(
 ["연속 추적","어택 에브리싱","적을 격추하면 다음 가까운 적을 표시합니다.","적을 격추하면 총구가 다음 가까운 적을 잠시 추적합니다.","격추 후 다음 가까운 적을 표시합니다.","5초간 적을 격추하면 총구가 다음 가까운 적을 잠시 따라갑니다."],
 ["Relentless Hunt","Attack Everything","After a kill, highlight the next nearby enemy.","After a kill, briefly guide your guns toward the next nearby enemy.","After a kill, highlights the next nearby enemy.","For 5 seconds, each kill briefly guides your guns toward the next nearby enemy."]),
 mccudden:entry(
 ["플라잉 메카닉","기내 응급수리","레벨업 시 강화 선택지가 증가합니다.","기체 내부에서 응급수리하여 자신의 내구도를 즉시 회복합니다.","레벨업 선택지가 4개로 늘어납니다.","자신의 최대 내구도 35%를 즉시 수리합니다. 강화 시 46.7%. 아군 보급품은 투하하지 않습니다."],
 ["Flying Mechanic","Onboard Emergency Repair","Gain more upgrade choices at each level.","Perform onboard emergency repairs to immediately restore your own hull.","Gain four choices at each level.","Immediately repair 35% of your maximum hull (46.7% when enhanced). Does not drop supplies for allies."]),
 nungesser:entry(
 ["검은 심장의 집념","죽음의 표식","교전을 끊었다가 같은 적을 다시 공격하면 잠시 피해가 증가합니다.","조준 중인 적을 표식하고 5초간 빠른 직접 관통 사격을 퍼붓습니다. 격추하면 남은 시간을 다음 조준 표적으로 넘깁니다.","같은 적에게 0.3초 이상에 걸쳐 기관총을 3번 명중한 뒤, 1.5초 이상 8초 이내에 다시 명중하면 2초간 그 적에게 기관총 피해 +25%. 재발동 간격 4초. 각도 조건 없음.","5초간 기관총 연사 속도 +60%, 표식 대상 피해 +50%와 관통. 집념과 동시 적용 시 피해 +75%. 직접 기관총 격추 시 남은 시간만 다음 조준 대상에게 이전. 자동 조준·추가 발사·무적·적탄 요격 없음."],
 ["Black Heart Tenacity","Death Mark","Re-engage the same enemy after breaking contact to briefly increase damage.","Mark the enemy in your sights for 5 seconds of rapid direct piercing gunfire. A direct kill passes the remaining time to the next aimed enemy.","Land 3 MG hits over at least 0.3 seconds, then hit that enemy again after a gap of 1.5 to 8 seconds: +25% MG damage against it for 2 seconds. Rearm interval 4 seconds. No angle condition.","For 5 seconds, MG fire rate +60%, marked-target damage +50%, and piercing shots. Combined with Tenacity: +75% damage. A direct MG kill transfers only remaining time to the next aimed target. No auto aim, extra projectiles, invulnerability or hostile-bullet interception."]),
 rickenbacker:entry(
 ["레이서의 본능","햇 인 더 링 · 질주","주변의 적이 많을수록 기관총 피해가 증가합니다.","링을 두르고 이동속도가 2배로 증가합니다. 직접 조종하며 사격합니다.","반경 700px 내 적 1기당 기관총 공격력 +6% (최대 +30%).","4초간 이동속도가 2배로 증가합니다. 기존 조종과 기관총 사격은 유지되며 자동 조준 추가탄은 발사하지 않습니다."],
 ["Racer's Instinct","Hat in the Ring · Sprint","Nearby enemies increase machine-gun damage.","Wear the ring and move at twice your normal speed. Steer and fire normally.","Machine-gun damage +6% per enemy within 700px (max +30%).","For 4 seconds, movement speed doubles. Normal steering and machine-gun fire are unchanged; no auto-aimed extra rounds are fired."]),
 ball:entry(
 ["고독한 사냥꾼","구름 속의 매","주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.","잔상으로 적의 조준을 교란한 뒤 단독 후방 기습을 강화합니다.","주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.","1.5초간 잔상으로 적의 조준을 속입니다. 재등장 후 혼자 적의 후방을 공격하면 큰 피해를 줍니다."],
 ["Lone Hunter","Hawk in the Clouds","Increase machine-gun damage when no ally or wingman is nearby.","Disrupt enemy aim with a decoy, then strengthen a solo rear ambush.","Deal more machine-gun damage when no ally or wingman is nearby.","Mislead enemy aim with a ghost for 1.5 seconds. Reappear alone behind an enemy for a powerful ambush."]),
 barker:entry(
 ["불굴의 각성","라스트 스탠드","피격되면 잠시 공격력이 증가합니다.","일정 시간 체력이 바닥나도 격추되지 않습니다.","피격될수록 잠시 공격력이 증가하고 기체 손상이 뚜렷해집니다.","6초간 체력이 1 아래로 떨어지지 않습니다. 피격될수록 기체 손상과 사격 반응이 격해집니다."],
 ["Unbroken Will","Last Stand","Taking damage briefly increases firepower.","Temporarily survive even when your health is depleted.","Taking hits briefly boosts damage and adds visible aircraft damage.","Health cannot drop below 1 for 6 seconds. Hits intensify aircraft damage and gunfire effects."]),
 luke:entry(
 ["벌룬 버스터","연쇄 폭파","비행선과 비행선형 보스에게 주는 기관총 피해가 증가합니다.","소이 점사 후 기폭 점사를 명중시켜 불붙은 적을 연쇄 폭파합니다.","비행선과 비행선형 보스에게 주는 기관총 피해가 20% 증가합니다. 일반 폭격기와 지상 보스에는 적용되지 않습니다.","소이 점사로 불을 붙인 뒤 기폭 점사를 가합니다. 불붙은 표적에 맞히면 주변의 불붙은 적까지 차례로 유폭합니다. 살아 있는 표적을 강제로 격추하지 않으며, 연쇄는 최대 6곳까지만 이어집니다. 탄약이 필요합니다."],
 ["Balloon Buster","Chain Detonation","Increase machine-gun damage against airships and airship bosses.","Land incendiary and detonating bursts to chain explosions through burning enemies.","Deal 20% more machine-gun damage to airships, including airship bosses. Ordinary bombers and ground bosses are excluded.","Fire incendiary bursts followed by detonating bursts. A hit on a burning target triggers nearby burning enemies in sequence, up to six detonations. Targets are damaged, not automatically killed. Requires ammunition."])
};
export const pilotIdentityCopy=(id,locale='ko')=>PILOT_IDENTITY_COPY[id]?.[locale==='en'?'en':'ko'];

