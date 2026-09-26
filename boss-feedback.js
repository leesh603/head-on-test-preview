// Presentation derived from live boss state. Never changes damage or targeting.
const pair=(ko,en,locale)=>locale==='en'?en:ko;
const PHASES={exposed:['본체 노출','Hull exposed'],crippled:['차륜 붕괴 · 제자리 포격','Wheels destroyed · dug in'],enraged:['집중 포격','Concentrated fire'],reveal:['은폐 해제','Cover cleared'],escort:['호위 차량 접근','Ground escorts inbound'],locomotive:['기관차 노출','Locomotive exposed'],'seaplane-support':['수상기 지원편대','Seaplanes inbound'],breached:['외곽 장갑 붕괴','Outer armor breached'],'final-core':['중앙 코어 노출','Command core exposed'],'core-exposed':['코어 노출','Core exposed'],weakened:['포대 약화','Battery weakened'],'final-assault':['최후 돌진','Final assault'],'gas-vent':['연료 가스 분출','Fuel gas venting'],'observer-destroyed':['관측 포격 중단','Spotter silenced'],'winch-destroyed':['기뢰 살포 약화','Mine deployment slowed'],'winch-exposed':['윈치 노출','Winch exposed'],'phase-2':['2단계 전술','Phase II'],'phase-3':['최종 전술','Final phase'],'bombing-run':['폭격 진입','Bombing run'],'bomb-bay-exposed':['폭탄창 개방','Bomb bay open'],'full-sortie':['전력 발진','Full sortie'],'front-last-stand':['전방 선체 최후 돌진','Bow last stand'],'rear-last-stand':['후방 선체 최후 포격','Stern last stand']};
export function bossPhaseLabel(phase,locale='ko'){const words=PHASES[phase];return words?words[locale==='en'?1:0]:pair('보스 전술 변화','Boss tactics changed',locale)}
export const BOSS_NAMES_EN=Object.freeze({
 'paris-gun':'Bruno railway gun',lincomparable:"520mm L’Incomparable",'sms-stuttgart':'SMS Stuttgart','hms-zubian':'HMS Zubian',
 'a7v-flak':'A7V Flakpanzer','mark-v-cruiser':'Mark V land cruiser','livens-flame-projector':'Livens flame projector','minenwerfer-battery':'Minenwerfer battery',
 'drachen-net':'Drachen mine network','london-apron':'London balloon apron','zeppelin-l70':'Zeppelin L 70',hma23:'HMA 23 carrier',gik:'Hansa-Brandenburg G.IK',ca4:'Caproni Ca.4','armored-harbor-fortress':'Armored harbor fortress',
 'fliegerzug':'Fliegerzug drone carrier','tsar-tank':'Tsar Tank landship'
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
  case 'minenwerfer-battery':return b.coreVulnerable?text('포대 무력화 · 중앙 코어 집중 사격','Guns disabled · attack the central core'):text('지휘소: 예측 약화 · 크레인: 장전 지연 · 포 3문 파괴','Command: worse aim · crane: slower reload · destroy 3 guns');
  case 'drachen-net':return b.coreVulnerable?text('본체 노출 · 기뢰 틈새로 진입','Core exposed · approach through mine gaps'):gone('balloon')?text('관측 포격 중단 · 윈치 파괴로 본체 노출','Spotter silenced · destroy the winch to expose the core'):text('관측 기구로 포격 차단 · 윈치로 기뢰 약화','Destroy the balloon to stop spotting · winch slows mines');
  case 'london-apron':return b.coreVulnerable?text('방벽 해체 · 중앙 윈치 공격','Barrier dismantled · attack the central winch'):text('기구 3개 파괴 · 각 기구의 와이어가 해제됨','Destroy 3 balloons · each removes its own wires');
  case 'zeppelin-l70':return b.phase==='cloud'?text('구름 아래 관측 곤돌라를 파괴해 비행선 노출','Destroy the gondola beneath the cloud to reveal the ship'):text('엔진 파괴로 탄막과 본체 방어 약화','Destroy engines to reduce fire and hull protection');
  case 'hma23':return b.coreVulnerable?text('격납고 무력화 · 공중 항모 본체 공격','Launch ports disabled · attack the carrier hull'):text('발진구 4개 파괴로 호위 편대와 장갑 해제','Destroy 4 launch ports to stop fighters and expose hull');
  case 'gik':return b.phase===3?text('최후 저공 포격 · 후방포 파괴 후 본체 공격','Final low barrage · silence rear gun and attack hull'):text('기관포로 중포 차단 · 엔진 파괴로 선회 둔화','Break the cannon · engine damage slows its patrol');
  case 'ca4':return b.hidden?text('산 뒤 재진입 · 열린 폭격 통로로 회피','Re-entry from the peaks · use the open bombing lane'):b.parts.get('bombBay')?.hittable?text('폭탄창 개방 · 집중 사격으로 내부 유폭','Bomb bay open · concentrate fire for an internal blast'):text('엔진 파괴 후 재진입 때 폭탄창 공략','Damage engines · attack the bay during re-entry');
  case 'armored-harbor-fortress':return b.coreVulnerable?text('중앙 지휘시설 노출 · 남은 포대 주의','Command core exposed · watch surviving guns'):b.parts.get('crane-pivot')?.hittable?text('크레인 회전축 노출 · 파괴하면 중앙 코어 개방','Crane pivot exposed · destroy it to open the core'):text('외곽 3부위 파괴 → 회전축 · 탄약고 유폭 활용','Break 3 outer parts → pivot · detonate the ammo store');
  case 'fliegerzug':return b.phase==='runaway'?text('폭주 경로 이탈 → 탈선 후 기관차 공격','Clear the runaway track → strike after derailment'):b.phase==='derailed'?text('탈선 직후 · 노출된 기관차 집중 사격','Derailed · pour fire into the exposed locomotive'):b.coreVulnerable?text('기관차 노출 · 사격 후 이동 경로 추적','Locomotive exposed · follow its launch stops'):gone('car-middle')?text('발사대 파괴됨 · 격납 화차의 호위 출격 차단','Launch car down · stop hangar fighter launches'):gone('car-rear')?text('격납 화차 파괴됨 · 대공 화차와 발사대 공략','Hangar down · break the flak and launch cars'):text('후미 격납 화차부터 순서대로 파괴','Destroy cars rear-first · shoot the rail to halt it');
  case 'tsar-tank':return b.coreVulnerable?text('본체 노출 · 집중 사격','Hull exposed · concentrate fire'):b.phase==='crippled'?text('차륜 붕괴 · 제자리 포격 중 — 본체 코어 공략','Wheels down · dug-in barrage — hit the hull'):gone('wheel-left')||gone('wheel-right')?text('남은 차륜을 부수면 전진이 멈춤','Break the last wheel to halt its advance'):text('차륜이 뿜는 파편을 피하며 차륜과 포탑 파괴','Dodge debris spray · break wheels and turret');
  default:return '';
 }
}
export function bossSoundFor(event,kind=''){
 const type=event.type,visual=event.visual||'';
 if(type==='phase-change'||type==='hangar-cover-ejected')return 'armorOpen';
 if(type==='part-destroyed'||type==='rail-car-detached'||type==='rail-break')return 'metalBreak';
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
