// Presentation derived from live boss state. Never changes damage or targeting.
const pair=(ko,en,locale)=>locale==='en'?en:ko;
const PHASES={'track-disabled':['한쪽 궤도 파괴 · 기동 둔화','One track destroyed · movement slowed'],'tracks-disabled':['양쪽 궤도 파괴 · 기동 정지','Both tracks destroyed · immobilized'],'engine-disabled':['기관부 파괴 · 유폭·분출 중단','Engine destroyed · vents silenced'],blackout:['탐조등 차단','Searchlight silenced'],'battery-silenced':['고사포 제압','Flak silenced'],'payload-lost':['폭탄창 파괴 · 폭격 중단','Bomb bay destroyed · raid stopped'],'engine-damaged':['엔진 손상 · 투하 지연','Engine damaged · drop delayed'],gliding:['양 엔진 정지 · 추락 중','Engines stopped · crashing'],'track-disabled':['한쪽 궤도 파괴 · 기동 둔화','One track destroyed · movement slowed'],'tracks-disabled':['양쪽 궤도 파괴 · 기동 정지','Both tracks destroyed · immobilized'],'battery-weakened':['포좌 무력화 · 해당 사격로 제거','Gun disabled · firing lane removed'],'searchlight-disabled':['탐조등 파괴 · 조준 추적 중단','Searchlight destroyed · tracking stopped'],locked:['탐조등 포착 · 집중 포격','Illuminated · focused flak'],doomed:['엔진 정지 · 동체 노출','Engines stopped · fuselage exposed'],exposed:['본체 노출','Hull exposed'],crippled:['차륜 붕괴 · 제자리 포격','Wheels destroyed · dug in'],enraged:['집중 포격','Concentrated fire'],reveal:['은폐 해제','Cover cleared'],escort:['호위 차량 접근','Ground escorts inbound'],locomotive:['기관차 노출','Locomotive exposed'],'seaplane-support':['수상기 지원편대','Seaplanes inbound'],breached:['외곽 장갑 붕괴','Outer armor breached'],'final-core':['중앙 코어 노출','Command core exposed'],'core-exposed':['코어 노출','Core exposed'],weakened:['포대 약화','Battery weakened'],'final-assault':['최후 돌진','Final assault'],'gas-vent':['연료 가스 분출','Fuel gas venting'],'gas-spray':['독가스 살포','Gas spray'],'bomb-surge':['폭탄 살포','Bombing surge'],'observer-destroyed':['관측 포격 중단','Spotter silenced'],'winch-destroyed':['기뢰 살포 중단','Mine deployment stopped'],'winch-exposed':['윈치 노출','Winch exposed'],'phase-2':['2단계 전술','Phase II'],'phase-3':['최종 전술','Final phase'],'bombing-run':['폭격 진입','Bombing run'],'bomb-bay-exposed':['폭탄창 개방','Bomb bay open'],'full-sortie':['전력 발진','Full sortie'],'front-last-stand':['전방 선체 최후 돌진','Bow last stand'],'rear-last-stand':['후방 선체 최후 포격','Stern last stand'],encirclement:['포위 공격','Encirclement'],'echelon-assault':['제대 강습','Echelon assault'],'concentrated-assault':['집중 강습','Concentrated assault'],'sun-hunt':['태양을 등진 사냥꾼','Hunter out of the sun'],'pair-split':['2기조 분산','Pairs split'],'bait-hunter':['미끼와 사냥꾼','Bait and hunter'],'cross-attack':['엇박자 교차공격','Offset cross-attack'],'headon-assault':['헤드온 강습','Head-on assault'],'flak-deaf':['청음기 파괴 · 포격 정확도 저하','Acoustic horns destroyed · blind fire'],'net-volley':['전 탑 일제 포격 · 목표 지점 이탈','Synchronized volley · clear the target']};
PHASES['rig-exposed']=['중앙 계류장치 노출','Central rig exposed'];
export function bossPhaseLabel(phase,locale='ko'){const words=PHASES[phase];return words?words[locale==='en'?1:0]:pair('보스 전술 변화','Boss tactics changed',locale)}
export const BOSS_NAMES_EN=Object.freeze({
 'paris-gun':'Bruno railway gun',lincomparable:"520mm L’Incomparable",'sms-stuttgart':'SMS Stuttgart','hms-zubian':'HMS Zubian',
 'a7v-flak':'A7V Flakpanzer','mark-v-cruiser':'Mark V land cruiser','livens-flame-projector':'Livens flame projector','minenwerfer-battery':'Minenwerfer crossfire battery',
 'drachen-net':'Drachen mine network','london-apron':'London balloon apron','zeppelin-l70':'Zeppelin L 70',hma23:'HMA 23 carrier',gik:'Hansa-Brandenburg G.IK',ca4:'Caproni Ca.4','armored-harbor-fortress':'Armored harbor fortress',
 'fliegerzug':'Fliegerzug aerial torpedo carrier','treffas-wagen':'Treffas-Wagen landship',
 'jasta11-circus':'JASTA 11 · FLYING CIRCUS','naval10-black-flight':'NAVAL 10 · BLACK FLIGHT',
 'mark4-wedge':'Mark IV tank wedge','morser-battery':'21cm Mörser battery',
 'gotha-squadron':'Gotha night bomber squadron','london-apron-raid':'London balloon apron raid','staaken-rvi':'Staaken R.VI giant bomber','london-searchlight':'London searchlight battery','flak-tower':'QF 13-pounder flak towers'
});
const TACTIC_RAIL_ONLY=new Set(['paris-gun','lincomparable','a7v-flak','mark-v-cruiser','flak-tower']);
export function bossTactic(encounter,locale='ko'){
 // Tactic hints only ship for the rail guns — the rest read as noise.
 if(!TACTIC_RAIL_ONLY.has(encounter?.bossId))return '';
 const bodies=[...encounter?.bodies.values()||[]].filter(b=>!b.dead),b=bodies[0];if(!b)return '';
 const text=(ko,en)=>pair(ko,en,locale),gone=id=>b.parts.get(id)?.destroyed;
 switch(encounter.bossId){
  case 'paris-gun':case 'lincomparable':return b.phase==='runaway'?text('폭주 경로 이탈 → 탈선 후 기관차 공격','Clear the runaway track → strike after derailment'):b.coreVulnerable?text('기관차 노출 · 사격 후 이동 경로 추적','Locomotive exposed · follow its firing stops'):text('후미 차량부터 파괴 · 레일 파괴로 이동 봉쇄','Break rear carriages first · shoot the rail to halt it');
  case 'sms-stuttgart':return b.support129?.phase===1?text('보일러 파괴로 감속 · 덮개를 열어 연료 공략','Break boilers to slow the carrier · open the hangar'):text('연료로 출격 차단 · 함포 파괴로 포격 감소','Destroy fuel to stop sorties · silence each turret');
  case 'hms-zubian':return bodies.length>1?text('전방 돌파 예고 회피 · 후방 함포를 부숴 교차포격 차단','Evade the bow attack · break the stern gun to stop crossfire'):text('함포·기관 손상은 분리 후에도 유지 · 접합부 공략','Gun and engine damage persists after the split · attack the seam');
  case 'a7v-flak':return b.phase==='exposed'?text('차체 기관총 회피 · 노출된 본체 공격','Dodge the hull gun · strike the exposed chassis'):b.coreVulnerable?text('장갑 틈 노출 · 남은 포탑 또는 본체 공략','Armor breached · silence guns or attack the hull'):text('탐조등·교차 포격 회피 · 궤도로 기동 봉쇄','Evade spotlights and crossfire · break tracks to halt movement');
  case 'mark-v-cruiser':return b.phase==='final-assault'?text('차체 기관총 회피 · 궤도 파괴 후 본체 공략','Evade the hull gun · break tracks and finish the chassis'):b.coreVulnerable?text('장갑 틈 노출 · 남은 측면포와 차체 기관총 주의','Armor breached · watch the remaining sponson and hull gun'):text('측면포로 장갑 노출 · 궤도로 전진 봉쇄','Break a sponson to breach armor · tracks stop the advance');
  case 'livens-flame-projector':return b.coreVulnerable?text('코어 노출 · 회전 화염의 뒤를 따라 공격','Core exposed · attack behind the rotating flame'):text('압력장치로 화염 약화 · 연료통 4개 파괴','Break pressure to weaken flame · destroy four tanks');
  case 'minenwerfer-battery':{const live=[...b.parts.values()].filter(p=>!p.destroyed).length;return live===1?text('최후 진지 · 빠른 포격과 3연사를 피해 마무리','Last emplacement · evade rapid fire and triple salvos'):live===2?text('화력 감소 · 남은 두 진지의 교차 예측을 분리','Firepower reduced · split the two remaining firing lanes'):text('좌 추적 · 중앙 예측 · 우 회피 차단 — 포위망의 탈출구 확인','Left tracks · center leads · right blocks — find the encirclement gap');}
  case 'drachen-net':return text('비행선 3기 각각 격추 · 남은 기체는 기관총과 기뢰 재살포','Down all three airships · survivors keep firing and laying mines');
  case 'gotha-squadron':return text('폭탄창 파괴로 도시 보호 · 엔진 손상은 투하 지연 · 후방총좌 주의','Break bomb bays to protect the city · engines delay drops · beware rear guns');
  case 'london-apron-raid':return b.coreVulnerable?text('방벽 해체 · 중앙 윈치 공격','Barrier dismantled · attack the central winch'):text('탐조등·포대로 화망 약화 · 기구 3개 파괴로 윈치 노출','Silence lamp and flak · break 3 balloons to expose the winch');
  case 'london-apron':return text('그물은 본체와 피해 공유 · 비행선 격추로 통로와 화망 동시 개방','Net damage transfers to its airship · down it to open a lane and silence its gun');
  case 'zeppelin-l70':return b.phase==='cloud'?text('구름 아래 관측 곤돌라를 파괴해 폭격 요새 노출','Destroy the gondola beneath the cloud to reveal the bombing fortress'):b.lastStand?text('수소 화염 회랑 경고 · 엔진을 부숴 측면포와 기동 약화','Hydrogen fire corridor · break engines to reduce guns and drift'):text('엔진 파괴로 측면포·기동·본체 방어 약화','Destroy engines to reduce broadsides, drift and hull protection');
  case 'hma23':return b.coreVulnerable?text('최종 편대 출격 · 측면 대공포를 피해 항모 본체 공격','Final sortie · evade alternating deck flak and strike the carrier'):text('발진구별 좌우 공격로 확인 · 4개를 파괴해 장갑 해제','Read each port’s attack lane · destroy all four to expose the hull');
  case 'gik':return b.cannonLock?text('중포 방향 고정 · 예고선 옆으로 회피, 포구 사격으로 발사 차단','Cannon locked · sidestep the line or destroy the muzzle'):gone('cannon')?text('중포 무력화 · 후방 사수와 연속 폭탄 주의','Cannon disabled · watch the rear gun and stick bombs'):text('전방 중포·후방 사수 · 엔진 파괴로 기동과 동체 방호 약화','Front cannon, rear gun · engines reduce speed and hull armor');
  case 'ca4':return gone('bombBay')?text('폭탄창 유폭 · 폭격 중단, 남은 사수와 동체 공략','Payload ruptured · bombing stopped; attack surviving guns and hull'):b.parts.get('bombBay')?.hittable?text('폭탄창 개방 · 중앙창 사격으로 폭격 취소와 내부 유폭','Bomb bay open · hit the center hatch to cancel bombing and trigger cook-off'):text('3개 폭격로 중 빈 통로로 회피 · 엔진 파괴로 폭격 간격 증가','Use the open lane · engine losses delay bombing runs');
  case 'armored-harbor-fortress':return b.coreVulnerable?text('중앙 지휘시설 노출 · 남은 포대 주의','Command core exposed · watch surviving guns'):b.parts.get('crane-pivot')?.hittable?text('크레인 회전축 노출 · 파괴하면 중앙 코어 개방','Crane pivot exposed · destroy it to open the core'):text('외곽 3부위 파괴 → 회전축 · 탄약고 유폭 활용','Break 3 outer parts → pivot · detonate the ammo store');
   case 'fliegerzug':return b.phase==='runaway'?text('폭주 경로 이탈 → 탈선 후 기관차 공격','Clear the runaway track → strike after derailment'):b.phase==='derailed'?text('탈선 직후 · 노출된 기관차 집중 사격','Derailed · strike the locomotive'):b.coreVulnerable?text('기관차 방호 해제 · 남은 화차 화력 제거','Locomotive exposed · disable remaining wagons'):gone('car-launch-a')&&gone('car-launch-b')?text('양쪽 발진차 파괴 · 대공포차와 후미 화망 제거','Both launch cars down · disable flak and rear gun'):gone('car-launch-a')||gone('car-launch-b')?text('발진차 한 량 파괴 · 남은 무인폭탄기 발진 차단','One launch car down · stop the remaining unmanned bombers'):text('발진차 2량·대공포차·보급차 중 파괴 순서를 선택','Choose which launch, flak or supply car to disable');
   case 'treffas-wagen':return b.phase==='emplacement'?text('양쪽 차륜 파괴 · 고정식 대공포대 전환','Wheels down · fixed flak emplacement'):gone('turret')?text('포탑 파괴 · 플랙 중단, 차륜과 차체 공략','Turret down · flak disabled; strike wheels and hull'):b.coreVulnerable?text('차체 노출 · 포탑과 차륜도 계속 파괴 가능','Hull exposed · turret and wheels remain targets'):gone('wheel-left')||gone('wheel-right')?text('차륜 한쪽 파괴 · 남은 차륜으로 기동 중','One wheel down · mobility reduced'):text('대형 차륜과 대공포탑을 부수면 공격 양상이 달라짐','Destroy wheels or turret to change its attacks');
  case 'jasta11-circus':return text('좌우 공격축을 맡은 편대기를 격추해 포위망을 약화 · 리히트호펜 직접 격추 가능','Break the wing attack lanes to weaken the trap · Richthofen is always vulnerable');
  case 'naval10-black-flight':return text('2기조의 미끼와 사냥꾼을 분리 · 한 기가 사라지면 짝의 협공이 중단됨','Split each bait-hunter pair · losing either aircraft breaks that pair attack');
  case 'mark4-wedge':return b.coreVulnerable?text('전차대 무력화 · 중앙 지휘 장치 노출','Tanks disabled · central command mechanism exposed'):text('전차 3대를 각각 파괴 · 파괴된 전차의 사격로 제거','Destroy each tank · its sponson lane falls silent');
  case 'morser-battery':return b.coreVulnerable?text('주포 3문 무력화 · 중앙 지휘 장치 공략','Three guns disabled · strike the command mechanism'):text('포좌마다 포격 중단 · 탄약고 파괴 시 재장전 지연','Each destroyed pit stops its shells · ammo loss slows reload');
  case 'staaken-rvi':return b.coreVulnerable?text('엔진 전부 정지 · 잔여 폭탄을 피하며 동체 공략','All engines stopped · evade the bomb dump and strike fuselage'):text('실제 엔진 4개를 파괴 · 연속 폭격과 사수 사격 주의','Destroy all four nacelles · avoid stick bombs and gunners');
  case 'london-searchlight':return b.coreVulnerable?text('방공 장치 무력화 · 중앙 발전·지휘 장치 노출','Defense disabled · command generator exposed'):gone('light')?text('추적 중단 · 포좌와 탄약고를 무력화','Tracking stopped · disable gun and ammunition'):text('탐조등에 오래 잡히면 집중 포격 · 광원 우선 파괴','Sustained illumination triggers focused flak · destroy the lamp');
  case 'flak-tower':case 'flak-tower-cell':return b.coreVulnerable?text('방어 무장 전멸 · 큐폴라 코어를 공격','All mounts silenced · strike the cupola core'):gone('ears')?text('청음기 파괴 · 공성포가 맹포격으로 전환','Horns down · siege gun fires blind patterns'):text('네 꼭짓점의 방공탑 전멸 · 청음기 추적 전에 파괴 권장','Destroy all four corner towers · kill the acoustic horns early');
  default:return '';
 }
}
export function bossSoundFor(event,kind=''){
 const type=event.type,visual=event.visual||'';
 if(type==='phase-change'||type==='hangar-cover-ejected')return 'armorOpen';
 if(type==='part-destroyed'||type==='ammo-cookoff'||type==='rail-car-detached'||type==='rail-break')return 'metalBreak';
 if(type==='flame-warning')return 'flameValve';
 if(type==='mortar-launch')return 'mortarLaunch';
 if(type==='crane-drop'||type==='spawn-minefield')return 'winchRelease';
 if(type==='rail-aim'||type==='rail-runaway')return 'railClatter';
 if(type==='seaplane-launch')return 'formationPass';
 if(type==='minion-launched')return 'formationPass';
 if(type==='charge-warning'||type==='reentry-warning')return 'approachWarning';
 if(type==='aa-volley')return 'navalGun';
 if(type==='flak-burst')return 'flak';
 if(type==='muzzle')return ['gik','ca4'].includes(kind)?'enemyShot':/stuttgart|zubian|harbor/.test(kind)?'navalGun':kind==='minenwerfer-battery'?null:'heavyShot';
 if(type==='heavy-gun-fired')return 'heavyShot';
 if(type==='boss-destruction-start')return /stuttgart|zubian/.test(kind)?'shipBreak':'metalBreak';
 if(type==='hazard-activated'){
  if(visual==='livens-flame')return 'flameBurn';
  if(event.kind==='projectile')return ['alps-cannon','alps-mg'].includes(visual)?null:'enemyShot';
  if(event.kind!=='circle')return null;
  if(/minenwerfer|rail-shell|observer-shell/.test(visual))return 'earthImpact';
  if(/zubian|naval|harbor/.test(visual))return 'waterImpact';
  if(/flak/.test(visual))return 'flak';
  if(visual==='carpet-bomb')return 'earthImpact';
 }
 return null;
}
