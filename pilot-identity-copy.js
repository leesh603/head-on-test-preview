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
 ['공중 곡예사','두 도흐 니히트','연속 사격할수록 총열 스파크와 정밀도가 높아집니다.','2.6초간 급선회하며 가까운 적을 따라 사격합니다.','연속 사격할수록 총열 스파크와 정밀도가 높아집니다. 재장전하면 초기화됩니다.','2.6초간 급선회하며 가까운 적을 따라 사격합니다.'],
 ['Aerial Acrobat','Du doch nicht!','Sustained fire builds barrel sparks and accuracy.','Make tight turns for 2.6 seconds while your guns track a nearby enemy.','Sustained fire builds barrel sparks and accuracy. Reloading resets the effect.','Make tight turns for 2.6 seconds while your guns track a nearby enemy.']),
 goering:entry(
 ['백색 편대장','화이트 플라이트','백색 윙맨 2기와 함께 출격합니다.','5초간 백색 윙맨이 좌우로 벌어져 강한 교차 사격을 합니다.','백색 윙맨 2기와 함께 출격합니다.','5초간 백색 윙맨이 좌우로 벌어져 강한 교차 사격을 합니다.'],
 ['White Flight Leader','White Flight','Begin each sortie with two permanent white wingmen.','White wingmen split left and right for powerful crossing fire for 5 seconds.','Begin each sortie with two permanent white wingmen.','White wingmen split left and right for powerful crossing fire for 5 seconds.']),
 immelmann:entry(
 ['릴의 독수리','임멜만 턴','급격히 방향을 바꾼 직후 잠시 사격이 정밀해지고 연사가 빨라집니다.','상승 반전으로 탄막을 걷어내고 잠시 무적이 됩니다.','급격히 방향을 바꾼 직후 잠시 사격이 정밀해지고 연사가 빨라집니다.','상승 반전으로 탄막을 걷어내고 잠시 무적이 됩니다. 반대 방향으로 관통 사격합니다.'],
 ['Eagle of Lille','Immelmann Turn','Sharp turns briefly tighten gun spread and increase fire rate.','Reverse in a climb, clearing bullets and briefly becoming invulnerable.','Sharp turns briefly tighten gun spread and increase fire rate.','Reverse in a climb, clearing bullets and briefly becoming invulnerable. Fire piercing rounds on re-entry.']),
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
 ['기구 사냥꾼','플레임 살보','같은 표적을 계속 조준하면 소이탄을 준비합니다.','5초간 조준한 표적에 강한 소이탄을 집중합니다.','같은 표적을 계속 조준하면 소이탄을 준비합니다. 명중한 적은 불타며 지속 피해를 받습니다.','5초간 조준한 표적에 강한 소이탄을 집중합니다. 표적을 바꾸면 다시 조준해야 합니다.'],
 ['Balloon Hunter','Flame Salvo','Hold aim on one enemy to prepare incendiaries.','Concentrate powerful incendiaries on your sighted target for 5 seconds.','Hold aim on one enemy to prepare incendiaries. Hits ignite it for damage over time.','Concentrate powerful incendiaries on your sighted target for 5 seconds. Switching targets resets aim.']),
 lothar:entry(
 ['황색 날개','캐벌리 차지','정면의 적에게 기관총 피해가 증가합니다.','2.6초간 정면으로 돌격하며 사격하고, 기수 앞의 적을 들이받습니다.','정면의 적에게 기관총 피해가 증가합니다.','2.6초간 정면으로 돌격하며 사격하고, 기수 앞의 적을 들이받습니다.'],
 ['Yellow Wings','Cavalry Charge','Deal extra machine-gun damage to enemies ahead.','Charge and fire straight ahead for 2.6 seconds, ramming enemies in front of your nose.','Deal extra machine-gun damage to enemies ahead.','Charge and fire straight ahead for 2.6 seconds, ramming enemies in front of your nose.']),
 sachsenberg:entry(
 ['융커스의 날개','발트해의 매','전금속 기체가 받는 피해를 줄입니다.','3초간 무적 상승 후 빠르게 급강하하며 강한 연속 사격을 합니다.','전금속 기체가 받는 피해를 줄입니다.','3초간 무적 상승 후 빠르게 급강하하며 강한 연속 사격을 합니다.'],
 ['Junkers Wings','Baltic Hawk','Your all-metal airframe reduces incoming damage.','Climb invulnerably, then dive into powerful rapid fire over 3 seconds.','Your all-metal airframe reduces incoming damage.','Climb invulnerably, then dive into powerful rapid fire over 3 seconds.']),
 proctor:entry(
 ['사격의 명수','버스터 살보','기관총 탄퍼짐이 줄어 정밀하게 사격합니다.','2.4초간 전방으로 빠르고 강한 관통 사격을 집중합니다.','기관총 탄퍼짐이 줄어 정밀하게 사격합니다.','2.4초간 전방으로 빠르고 강한 관통 사격을 집중합니다.'],
 ['Master Shot','Buster Salvo','Tighter gun spread improves accuracy.','Concentrate powerful, rapid piercing fire ahead for 2.4 seconds.','Tighter gun spread improves accuracy.','Concentrate powerful, rapid piercing fire ahead for 2.4 seconds.']),
 schleich:entry(
 ['흑기사','블랙 어드밴스','받는 피해가 감소합니다.','3초간 빠르게 돌입하며 받는 피해를 크게 줄입니다.','받는 피해가 감소합니다.','3초간 빠르게 돌입하며 받는 피해를 크게 줄입니다. 선회는 둔해집니다.'],
 ['Black Knight','Black Advance','Reduce incoming damage.','Advance faster and greatly reduce incoming damage for 3 seconds.','Reduce incoming damage.','Advance faster and greatly reduce incoming damage for 3 seconds. Turns are slower.']),
 lufbery:entry(
 ['기교의 장인','라파예트 살보','에너지가 더 빠르게 회복됩니다.','3초간 전방의 적을 자동 조준해 빠르고 강하게 사격합니다.','에너지가 더 빠르게 회복됩니다.','3초간 전방의 적을 자동 조준해 빠르고 강하게 사격합니다.'],
 ['Flight Craft','Lafayette Salvo','Recover energy faster.','Auto-aim powerful rapid fire at enemies ahead for 3 seconds.','Recover energy faster.','Auto-aim powerful rapid fire at enemies ahead for 3 seconds.']),
 brumowski:entry(
 ['붉은 호위대','편대 재집결','호위기 2기와 출격합니다.','5초간 자기 편대를 주변으로 모아 가까운 적을 제압하고 받는 피해를 줄입니다.','호위기 2기와 출격합니다. 아군과 윙맨이 많을수록 기관총 피해가 증가합니다.','5초간 자기 편대를 주변으로 모아 가까운 적을 제압하고 받는 피해를 줄입니다.'],
 ['Red Escort','Flight Rally','Deploy with two escorts.','Regroup your flight nearby for 5 seconds to suppress close threats and reduce incoming damage.','Deploy with two escorts. Allied aircraft and wingmen increase gun damage.','Regroup your flight nearby for 5 seconds to suppress close threats and reduce incoming damage.']),
 fonck:entry(
 ['정밀의 에이스','핀포인트 살보','기관총 탄퍼짐이 줄고 탄환이 빨라집니다.','4초간 전방으로 탄도를 집중해 강력한 관통 사격을 합니다.','기관총 탄퍼짐이 줄고 탄환이 빨라집니다.','4초간 전방으로 탄도를 집중해 강력한 관통 사격을 합니다.'],
 ['Precision Ace','Pinpoint Salvo','Tighter machine-gun spread and faster bullets.','Fire a focused volley of powerful piercing rounds for 4 seconds.','Tighter machine-gun spread and faster bullets.','Fire a focused volley of powerful piercing rounds for 4 seconds.']),
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
 ['근접 사냥','게릴라 어택','적에게 가까이 접근할수록 기관총 피해가 증가합니다.','3초간 가속하며 돌입하고, 가까운 적에게 더 큰 피해를 줍니다.','적에게 가까이 접근할수록 기관총 피해가 증가합니다.','3초간 가속하며 돌입하고, 가까운 적에게 더 큰 피해를 줍니다.'],
 ['Close Hunter','Guerrilla Attack','Machine-gun damage increases as you close on an enemy.','Accelerate into close range and deal extra damage for 3 seconds.','Machine-gun damage increases as you close on an enemy.','Accelerate into close range and deal extra damage for 3 seconds.']),
 mannock:entry(
 ['동료의 수호자','타이거 스쿼드런','아군을 추격하는 적에게 추가 피해를 줍니다.','5초간 아군을 추격하는 적에게 강한 관통 엄호 사격을 가합니다.','아군을 추격하는 적에게 추가 피해를 줍니다. 자기 편대의 연사가 빨라집니다.','5초간 아군을 추격하는 적에게 강한 관통 엄호 사격을 가합니다.'],
 ['Flight Guardian','Tiger Squadron','Deal extra damage to enemies pursuing allies.','Fire powerful piercing cover shots at enemies pursuing allies for 5 seconds.','Deal extra damage to enemies pursuing allies. Your flight fires faster.','Fire powerful piercing cover shots at enemies pursuing allies for 5 seconds.']),
 mckeever:entry(
 ['파월의 엄호','호크 앤 냇','파월이 후방의 적을 독립적으로 조준해 견제합니다.','5초간 전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다.','파월이 후방의 적을 독립적으로 조준해 견제합니다.','5초간 전방과 후방 사수가 서로 다른 적을 추적하며 사격합니다.'],
 ['Powell\'s Cover','Hawk & Gnat','Powell independently aims at and suppresses enemies behind you.','Front and rear gunners track and fire at separate enemies for 5 seconds.','Powell independently aims at and suppresses enemies behind you.','Front and rear gunners track and fire at separate enemies for 5 seconds.']),
 hawker:entry(
 ['연속 추적','어택 에브리싱','격추 후 다음 가까운 적을 표시합니다.','5초간 적을 격추하면 총구가 다음 가까운 적을 잠시 따라갑니다.','격추 후 다음 가까운 적을 표시합니다.','5초간 적을 격추하면 총구가 다음 가까운 적을 잠시 따라갑니다.'],
 ['Relentless Hunt','Attack Everything','After a kill, highlights the next nearby enemy.','For 5 seconds, each kill briefly guides your guns toward the next nearby enemy.','After a kill, highlights the next nearby enemy.','For 5 seconds, each kill briefly guides your guns toward the next nearby enemy.']),
 mccudden:entry(
 ['플라잉 메카닉','야전 정비','레벨업 선택지가 4개로 늘고, 무료로 한 번 다시 뽑을 수 있습니다.','주변에 수리 보급품 3개를 투하합니다.','레벨업 선택지가 4개로 늘고, 무료로 한 번 다시 뽑을 수 있습니다.','주변에 수리 보급품 3개를 투하합니다. 협동 아군도 회수할 수 있습니다.'],
 ['Flying Mechanic','Field Repair','Gain four choices at each level and one free reroll.','Drop three repair supplies nearby.','Gain four choices at each level and one free reroll.','Drop three repair supplies nearby. Co-op allies can collect them too.']),
 nungesser:entry(
 ['검은 심장','죽음의 기사','체력이 낮아지면 검은 연무가 짙어지고, 스치는 탄환에 연무가 찢어집니다.','3초간 무적이 되어 적 탄환을 검은 연무 속에서 소멸시킵니다.','체력이 낮아지면 검은 연무가 짙어지고, 스치는 탄환에 연무가 찢어집니다.','3초간 무적이 되어 적 탄환을 검은 연무 속에서 소멸시킵니다.'],
 ['Black Heart','Knight of Death','Black fog thickens at low health and tears as bullets pass close by.','Become invulnerable for 3 seconds, extinguishing enemy rounds in black fog.','Black fog thickens at low health and tears as bullets pass close by.','Become invulnerable for 3 seconds, extinguishing enemy rounds in black fog.']),
 rickenbacker:entry(
 ['레이서의 본능','햇 인 더 링','서로 다른 적을 빠르게 맞히면 잠시 공격력이 쌓입니다.','4초간 빠른 표적전환으로 얻는 공격력 증가가 더 강해집니다.','서로 다른 적을 빠르게 맞히면 잠시 공격력이 쌓입니다.','4초간 빠른 표적전환으로 얻는 공격력 증가가 더 강해집니다.'],
 ['Racer\'s Instinct','Hat in the Ring','Rapid hits on different enemies build a temporary damage bonus.','Strengthen the damage bonus from rapid target switches for 4 seconds.','Rapid hits on different enemies build a temporary damage bonus.','Strengthen the damage bonus from rapid target switches for 4 seconds.']),
 ball:entry(
 ['고독한 사냥꾼','구름 속의 매','주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.','1.5초간 잔상으로 적의 조준을 속입니다.','주변에 아군이나 윙맨이 없으면 기관총 피해가 증가합니다.','1.5초간 잔상으로 적의 조준을 속입니다. 재등장 후 혼자 적의 후방을 공격하면 큰 피해를 줍니다.'],
 ['Lone Hunter','Hawk in the Clouds','Deal more machine-gun damage when no ally or wingman is nearby.','Mislead enemy aim with a ghost for 1.5 seconds.','Deal more machine-gun damage when no ally or wingman is nearby.','Mislead enemy aim with a ghost for 1.5 seconds. Reappear alone behind an enemy for a powerful ambush.']),
 barker:entry(
 ['불굴의 각성','라스트 스탠드','피격될수록 잠시 공격력이 증가하고 기체 손상이 뚜렷해집니다.','6초간 체력이 1 아래로 떨어지지 않습니다.','피격될수록 잠시 공격력이 증가하고 기체 손상이 뚜렷해집니다.','6초간 체력이 1 아래로 떨어지지 않습니다. 피격될수록 기체 손상과 사격 반응이 격해집니다.'],
 ['Unbroken Will','Last Stand','Taking hits briefly boosts damage and adds visible aircraft damage.','Health cannot drop below 1 for 6 seconds.','Taking hits briefly boosts damage and adds visible aircraft damage.','Health cannot drop below 1 for 6 seconds. Hits intensify aircraft damage and gunfire effects.']),
 luke:entry(
 ['벌룬 버스터','연쇄 폭파','기관총으로 적을 점화합니다.','6초간 불붙은 적을 더 강하게 공격합니다.','기관총으로 적을 점화합니다. 불붙은 적에게 추가 피해를 줍니다.','6초간 불붙은 적을 더 강하게 공격합니다. 격파한 적이나 보스 부위가 폭발해 주변 적을 타격합니다.'],
 ['Balloon Buster','Chain Blast','Gunfire ignites enemies.','Hit burning enemies harder for 6 seconds.','Gunfire ignites enemies. Burning targets take extra damage.','Hit burning enemies harder for 6 seconds. Destroyed burning enemies or boss parts explode, damaging nearby foes.'])
};
export const pilotIdentityCopy=(id,locale='ko')=>PILOT_IDENTITY_COPY[id]?.[locale==='en'?'en':'ko'];
