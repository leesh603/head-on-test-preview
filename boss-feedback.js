// Presentation derived from live boss state. Never changes damage or targeting.
const pair=(ko,en,locale)=>locale==='en'?en:ko;
const PHASES={'battery-weakened':['포좌 무력화 · 해당 사격로 제거','Gun disabled · firing lane removed'],'searchlight-disabled':['탐조등 파괴 · 조준 추적 중단','Searchlight destroyed · tracking stopped'],locked:['탐조등 포착 · 집중 포격','Illuminated · focused flak'],doomed:['엔진 정지 · 동체 노출','Engines stopped · fuselage exposed'],exposed:['본체 노출','Hull exposed'],crippled:['차륜 붕괴 · 제자리 포격','Wheels destroyed · dug in'],enraged:['집중 포격','Concentrated fire'],reveal:['은폐 해제','Cover cleared'],escort:['호위 차량 접근','Ground escorts inbound'],locomotive:['기관차 노출','Locomotive exposed'],'seaplane-support':['수상기 지원편대','Seaplanes inbound'],breached:['외곽 장갑 붕괴','Outer armor breached'],'final-core':['중앙 코어 노출','Command core exposed'],'core-exposed':['코어 노출','Core exposed'],weakened:['포대 약화','Battery weakened'],'final-assault':['최후 돌진','Final assault'],'gas-vent':['연료 가스 분출','Fuel gas venting'],'observer-destroyed':['관측 포격 중단','Spotter silenced'],'winch-destroyed':['기뢰 살포 중단','Mine deployment stopped'],'winch-exposed':['윈치 노출','Winch exposed'],'phase-2':['2단계 전술','Phase II'],'phase-3':['최종 전술','Final phase'],'bombing-run':['폭격 진입','Bombing run'],'bomb-bay-exposed':['폭탄창 개방','Bomb bay open'],'full-sortie':['전력 발진','Full sortie'],'front-last-stand':['전방 선체 최후 돌진','Bow last stand'],'rear-last-stand':['후방 선체 최후 포격','Stern last stand'],encirclement:['포위 공격','Encirclement'],'echelon-assault':['제대 강습','Echelon assault'],'concentrated-assault':['집중 강습','Concentrated assault'],'sun-hunt':['태양을 등진 사냥꾼','Hunter out of the sun'],'pair-split':['2기조 분산','Pairs split'],'bait-hunter':['미끼와 사냥꾼','Bait and hunter'],'cross-attack':['엇박자 교차공격','Offset cross-attack'],'headon-assault':['헤드온 강습','Head-on assault']};
PHASES['rig-exposed']=['중앙 계류장치 노출','Central rig exposed'];
export function bossPhaseLabel(phase,locale='ko'){const words=PHASES[phase];return words?words[locale==='en'?1:0]:pair('보스 전술 변화','Boss tactics changed',locale)}
export const BOSS_NAMES_EN=Object.freeze({
 'paris-gun':'Bruno railway gun',lincomparable:"520mm L’Incomparable",'sms-stuttgart':'SMS Stuttgart','hms-zubian':'HMS Zubian',
 'a7v-flak':'A7V Flakpanzer','mark-v-cruiser':'Mark V land cruiser','livens-flame-projector':'Livens flame projector','minenwerfer-battery':'Minenwerfer crossfire battery',
 'drachen-net':'Drachen mine network','london-apron':'London balloon apron','zeppelin-l70':'Zeppelin L 70',hma23:'HMA 23 carrier',gik:'Hansa-Brandenburg G.IK',ca4:'Caproni Ca.4','armored-harbor-fortress':'Armored harbor fortress',
 'fliegerzug':'Fliegerzug drone carrier','treffas-wagen':'Treffas-Wagen landship',
 'jasta11-circus':'JASTA 11 · FLYING CIRCUS','naval10-black-flight':'NAVAL 10 · BLACK FLIGHT',
 'mark4-wedge':'Mark IV tank wedge','morser-battery':'21cm Mörser battery',
 'staaken-rvi':'Staaken R.VI giant bomber','london-searchlight':'London searchlight battery'
});
export function bossTactic(encounter,locale='ko'){
 const bodies=[...encounter?.bodies.values()||[]].filter(b=>!b.dead),b=bodies[0];if(!b)return '';
 const text=(ko,en)=>pair(ko,en,locale),gone=id=>b.parts.get(id)?.destroyed;
 switch(encounter.bossId){
  case 'paris-gun':case 'lincomparable':return b.phase==='runaway'?text('폭주 경로 이탈 → 탈선 후 기관차 공격','Clear the runaway track → strike after derailment'):b.coreVulnerable?text('기관차 노출 · 사격 후 이동 경로 추적','Locomotive exposed · follow its firing stops'):text('후미 차량부터 파괴 · 레일 파괴로 이동 봉쇄','Break rear carriages first · shoot the rail to halt it');
  case 'sms-stuttgart':return b.support129?.phase===1?text('격납고 덮개 파괴 → 연료와 함포 공략','Break the hangar cover → attack fuel and turrets'):text('연료 파괴로 지원기 차단 · 함포별 화망 제거','Destroy fuel to stop launches · silence each turret');
  case 'hms-zubian':return bodies.length>1?text('앞 선체 돌진 회피 · 뒤 선체 박격포 우선 공략','Dodge the bow charge · silence the stern mortars'):text('접합부 파괴 후 두 선체를 각각 격파','Break the seam, then defeat both hull halves');
  case 'a7v-flak':return b.coreVulnerable?text('포탑 무력화 · 노출된 본체 공격','Turrets disabled · strike the exposed hull'):text('탐조등 이탈 · 포탑 4개를 파괴해 본체 노출','Leave searchlights · destroy all four turrets');
  case 'mark-v-cruiser':return b.phase==='final-assault'?text('최후 돌진 · 이동하며 본체 집중 사격','Final advance · keep moving and attack the hull'):text('좌우 포곽 파괴로 측면 화망과 호위 차단','Destroy side sponsons to cut fire and escorts');
  case 'livens-flame-projector':return b.coreVulnerable?text('코어 노출 · 회전 화염의 뒤를 따라 공격','Core exposed · attack behind the rotating flame'):text('압력장치로 화염 약화 · 연료통 4개 파괴','Break pressure to weaken flame · destroy four tanks');
  case 'minenwerfer-battery':{const live=[...b.parts.values()].filter(p=>!p.destroyed).length;return live===1?text('최후 진지 · 빠른 포격과 3연사를 피해 마무리','Last emplacement · evade rapid fire and triple salvos'):live===2?text('화력 감소 · 남은 두 진지의 교차 예측을 분리','Firepower reduced · split the two remaining firing lanes'):text('좌 추적 · 중앙 예측 · 우 회피 차단 — 포위망의 탈출구 확인','Left tracks · center leads · right blocks — find the encirclement gap');}
  case 'drachen-net':return b.coreVulnerable?text('현수 장치 붕괴 · 중앙 노출 기관 공략','Suspension disabled · strike the exposed mechanism'):gone('winch')?text('추가 기뢰 없음 · 관측 풍선과 남은 기뢰 정리','No new mines · clear the observer and remaining mines'):gone('balloon')?text('관측 포격 중단 · 기뢰 살포 윈치 파괴','Observer silenced · destroy the mine-deploying winch'):text('풍선은 관측 포격 · 윈치는 기뢰 살포 · 각각 차단','Balloon directs artillery · winch deploys mines · disable both');
  case 'london-apron':return b.coreVulnerable?text('그물 붕괴 · 중앙 계류장치 공략','Net collapsed · strike the exposed central rig'):text('이동 그물·스위프·축소망 회피 · 풍선 파괴로 해당 구간 제거','Evade moving, sweeping and closing nets · each balloon removes its section');
  case 'zeppelin-l70':return b.phase==='cloud'?text('구름 아래 관측 곤돌라를 파괴해 폭격 요새 노출','Destroy the gondola beneath the cloud to reveal the bombing fortress'):b.lastStand?text('수소 화염 회랑 경고 · 엔진을 부숴 측면포와 기동 약화','Hydrogen fire corridor · break engines to reduce guns and drift'):text('엔진 파괴로 측면포·기동·본체 방어 약화','Destroy engines to reduce broadsides, drift and hull protection');
  case 'hma23':return b.coreVulnerable?text('최종 편대 출격 · 측면 대공포를 피해 항모 본체 공격','Final sortie · evade alternating deck flak and strike the carrier'):text('발진구별 좌우 공격로 확인 · 4개를 파괴해 장갑 해제','Read each port’s attack lane · destroy all four to expose the hull');
  case 'gik':return b.phase===3?text('최후 저공 포격 · 후방포 파괴 후 본체 공격','Final low barrage · silence rear gun and attack hull'):text('기관포로 중포 차단 · 엔진 파괴로 선회 둔화','Break the cannon · engine damage slows its patrol');
  case 'ca4':return b.hidden?text('산 뒤 재진입 · 열린 폭격 통로로 회피','Re-entry from the peaks · use the open bombing lane'):b.parts.get('bombBay')?.hittable?text('폭탄창 개방 · 집중 사격으로 내부 유폭','Bomb bay open · concentrate fire for an internal blast'):text('엔진 파괴 후 재진입 때 폭탄창 공략','Damage engines · attack the bay during re-entry');
  case 'armored-harbor-fortress':return b.coreVulnerable?text('중앙 지휘시설 노출 · 남은 포대 주의','Command core exposed · watch surviving guns'):b.parts.get('crane-pivot')?.hittable?text('크레인 회전축 노출 · 파괴하면 중앙 코어 개방','Crane pivot exposed · destroy it to open the core'):text('외곽 3부위 파괴 → 회전축 · 탄약고 유폭 활용','Break 3 outer parts → pivot · detonate the ammo store');
  case 'fliegerzug':return b.coreVulnerable?text('기관차 노출 · 폭주 후 탈선한 기관차 공략','Locomotive exposed · strike after derailment'):text('후미 격납차 → Bug 발진차 → 대공차 · 순서대로 기능 차단','Rear hangar → Bug launcher → flak car · disable in order');
  case 'treffas-wagen':return b.coreVulnerable?text('장갑 개방 · 중앙 노출 기관 집중 사격','Armor open · strike the exposed central engine'):b.wheelsAlive()===0?text('바퀴 정지 · 살아 있는 포탑과 후미 조향부 파괴','Wheels stopped · disable turret and steering tail'):text('거륜 2개 파괴로 전진 정지 · 포탑 파괴로 포격 중단','Break both wheels to halt it · destroy turret to stop shells');
  case 'jasta11-circus':return text('좌우 공격축을 맡은 편대기를 격추해 포위망을 약화 · 리히트호펜 직접 격추 가능','Break the wing attack lanes to weaken the trap · Richthofen is always vulnerable');
  case 'naval10-black-flight':return text('2기조의 미끼와 사냥꾼을 분리 · 한 기가 사라지면 짝의 협공이 중단됨','Split each bait-hunter pair · losing either aircraft breaks that pair attack');
  case 'mark4-wedge':return b.coreVulnerable?text('전차대 무력화 · 중앙 지휘 장치 노출','Tanks disabled · central command mechanism exposed'):text('전차 3대를 각각 파괴 · 파괴된 전차의 사격로 제거','Destroy each tank · its sponson lane falls silent');
  case 'morser-battery':return b.coreVulnerable?text('주포 3문 무력화 · 중앙 지휘 장치 공략','Three guns disabled · strike the command mechanism'):text('포좌마다 포격 중단 · 탄약고 파괴 시 재장전 지연','Each destroyed pit stops its shells · ammo loss slows reload');
  case 'staaken-rvi':return b.coreVulnerable?text('엔진 전부 정지 · 잔여 폭탄을 피하며 동체 공략','All engines stopped · evade the bomb dump and strike fuselage'):text('실제 엔진 4개를 파괴 · 연속 폭격과 사수 사격 주의','Destroy all four nacelles · avoid stick bombs and gunners');
  case 'london-searchlight':return b.coreVulnerable?text('방공 장치 무력화 · 중앙 발전·지휘 장치 노출','Defense disabled · command generator exposed'):gone('light')?text('추적 중단 · 포좌와 탄약고를 무력화','Tracking stopped · disable gun and ammunition'):text('탐조등에 오래 잡히면 집중 포격 · 광원 우선 파괴','Sustained illumination triggers focused flak · destroy the lamp');
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
 if(type==='muzzle')return /stuttgart|zubian|harbor/.test(kind)?'navalGun':kind==='minenwerfer-battery'?null:'heavyShot';
 if(type==='heavy-gun-fired')return 'heavyShot';
 if(type==='boss-destruction-start')return /stuttgart|zubian/.test(kind)?'shipBreak':'metalBreak';
 if(type==='hazard-activated'){
  if(visual==='livens-flame')return 'flameBurn';
  if(event.kind==='projectile')return visual==='alps-cannon'?'heavyShot':'enemyShot';
  if(event.kind!=='circle')return null;
  if(/minenwerfer|rail-shell|observer-shell/.test(visual))return 'earthImpact';
  if(/zubian|naval|harbor/.test(visual))return 'waterImpact';
  if(/flak/.test(visual))return 'flak';
  if(visual==='carpet-bomb')return 'earthImpact';
 }
 return null;
}
