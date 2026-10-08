// Presentation derived from live boss state. Never changes damage or targeting.
const pair=(ko,en,locale)=>locale==='en'?en:ko;
const PHASES={'carrier-approach':['수상기 선행 편대 · 모함 접근','Seaplanes ahead · carrier inbound'],'carrier-evasive':['모함 회피 항해 · 기관부를 노리세요','Carrier evasive course · strike the boiler'],'carrier-final-sortie':['최후의 총출격 · 교차 돌입에 주의','Final sortie · staggered crossing passes'],'zubian-approach':['함포 관측탄 · 구축함 선회 진입','Ranging shots · destroyer turning in'],'zubian-pincer':['선수 돌입 · 선미 교차 포격','Bow approach · stern crossfire'],'zubian-bow-rush':['선수 급선회 · 어뢰 돌격','Bow hard turn · torpedo rush'],'zubian-stern-barrage':['선미 회피 항해 · 퇴로 차단 포격','Stern evasion · route-cutting barrage'],'cooling-runaway':['냉각 실패 · 불안정 폭주','Cooling failure · runaway'],overheated:['과열 · 증기 분출','Overheated · steam venting'],'engine-crippled':['엔진 파괴 · 이동 둔화','Engine ruptured · slowed'],'track-slew':['궤도 단절 · 편측 기동','Track severed · asymmetric drive'],'command-disrupted':['지휘부 파괴 · 불규칙 포격','Command destroyed · irregular salvos'],'escort-pressure':['육상함·호위 동시 압박','Landship and escorts advancing'],'fuel-fire':['연료 탱크 화재','Fuel tank burning'],'differential-drive':['전후 궤도 차등 파괴','Front/rear track damage'],'broadside-warning':['측면 순차 포격','Sequential broadside'],'support-silenced':['지원구획 파괴 · 호위 증원 차단','Support bay destroyed · reinforcements stopped'],'verdun-outer':['외곽 교차화망','Outer crossfire'],'verdun-heavy':['중포 포탑 가동','Heavy turrets active'],'verdun-ammo':['탄약고 노출','Ammunition exposed'],'verdun-core':['중앙 핵심 노출','Central core exposed'],'verdun-ambush':['폐허 매복 포좌','Hidden gun pits'],'verdun-observer-lost':['외부 관측 포격 중단','Observed artillery silenced'],'verdun-ruin-breach':['폐허 붕괴 · 지하 탄약고','Underground ammunition exposed'],'verdun-underground':['지하 핵심 노출','Underground core exposed'],'observation':['관측 조준 · 집중 포격 준비','Observer locking · coordinated barrage'],'blind-barrage':['관측소 파괴 · 고정 구역 포격','Observer lost · blind sectors'],'ammo-starved':['탄약고 유폭 · 연사 감소','Ammo lost · reduced cadence'],'weapon-disabled':['측면 무장 파괴 · 해당 사격 중단','Sponson destroyed · lane silenced'],'track-disabled':['한쪽 궤도 파괴 · 기동 둔화','One track destroyed · movement slowed'],'tracks-disabled':['양쪽 궤도 파괴 · 기동 정지','Both tracks destroyed · immobilized'],'engine-disabled':['기관부 파괴 · 유폭·분출 중단','Engine destroyed · vents silenced'],blackout:['탐조등 차단','Searchlight silenced'],'battery-silenced':['고사포 제압','Flak silenced'],'payload-lost':['폭탄창 파괴 · 폭격 중단','Bomb bay destroyed · raid stopped'],'engine-damaged':['엔진 손상 · 투하 지연','Engine damaged · drop delayed'],gliding:['양 엔진 정지 · 추락 중','Engines stopped · crashing'],'track-disabled':['한쪽 궤도 파괴 · 기동 둔화','One track destroyed · movement slowed'],'tracks-disabled':['양쪽 궤도 파괴 · 기동 정지','Both tracks destroyed · immobilized'],'battery-weakened':['포좌 무력화 · 해당 사격로 제거','Gun disabled · firing lane removed'],'searchlight-disabled':['탐조등 파괴 · 조준 추적 중단','Searchlight destroyed · tracking stopped'],locked:['탐조등 포착 · 집중 포격','Illuminated · focused flak'],doomed:['엔진 정지 · 동체 노출','Engines stopped · fuselage exposed'],exposed:['본체 노출','Hull exposed'],crippled:['차륜 붕괴 · 제자리 포격','Wheels destroyed · dug in'],enraged:['집중 포격','Concentrated fire'],reveal:['은폐 해제','Cover cleared'],escort:['호위 차량 접근','Ground escorts inbound'],locomotive:['기관차 노출','Locomotive exposed'],'seaplane-support':['수상기 지원편대','Seaplanes inbound'],breached:['외곽 장갑 붕괴','Outer armor breached'],'final-core':['중앙 코어 노출','Command core exposed'],'core-exposed':['코어 노출','Core exposed'],weakened:['포대 약화','Battery weakened'],'final-assault':['최후 돌진','Final assault'],'gas-vent':['연료 가스 분출','Fuel gas venting'],'gas-spray':['독가스 살포','Gas spray'],'bomb-surge':['폭탄 살포','Bombing surge'],'observer-destroyed':['관측 포격 중단','Spotter silenced'],'winch-destroyed':['기뢰 살포 중단','Mine deployment stopped'],'winch-exposed':['윈치 노출','Winch exposed'],'phase-2':['2단계 전술','Phase II'],'phase-3':['최종 전술','Final phase'],'bombing-run':['폭격 진입','Bombing run'],'bomb-bay-exposed':['폭탄창 개방','Bomb bay open'],'full-sortie':['전력 발진','Full sortie'],'front-last-stand':['전방 선체 최후 돌진','Bow last stand'],'rear-last-stand':['후방 선체 최후 포격','Stern last stand'],encirclement:['포위 공격','Encirclement'],'echelon-assault':['제대 강습','Echelon assault'],'concentrated-assault':['집중 강습','Concentrated assault'],'sun-hunt':['태양을 등진 사냥꾼','Hunter out of the sun'],'pair-split':['2기조 분산','Pairs split'],'bait-hunter':['미끼와 사냥꾼','Bait and hunter'],'cross-attack':['엇박자 교차공격','Offset cross-attack'],'headon-assault':['헤드온 강습','Head-on assault'],'flak-deaf':['청음기 파괴 · 포격 정확도 저하','Acoustic horns destroyed · blind fire'],'net-volley':['전 탑 일제 포격 · 목표 지점 이탈','Synchronized volley · clear the target']};
Object.assign(PHASES,{'a7v-entry':['철조망 돌파 · 대공요새 진입','Wire crushed · flak fortress approaching'],'a7v-tracking':['탐조 포착 · 정밀 교차사격','Searchlight tracking · precise crossfire'],'a7v-last-stand':['강철의 사냥망','Steel hunting net'],'a7v-steel-turret':['강철 회전포대 · 회전 사선을 읽으세요','Steel turret · follow the turning lanes'],'a7v-hunting-net':['강철의 사냥망 · 포격 뒤 반격','Hunting net · counter after the barrage'],'a7v-recovery':['대공포 냉각 · 차체 정지 · 반격 기회','AA cooling · hull stopped · counterattack window'],'a7v-light-lost':['탐조등 파괴 · 추적 약화','Searchlight destroyed · tracking weakened']});
Object.assign(PHASES,{'markv-entry':['참호 돌파 · 육상전함 진입','Trench crossed · landship approaching'],'markv-tracking':['방향 전환 · 측면포 연계 돌파','Turning broadside · pressure advance'],'markv-last-stand':['손상 측면 보호 · 근접 압박','Protecting the ruined flank · close pressure'],'markv-steel-waltz':['강철의 원무 · 살아남은 측면포 회전','Steel waltz · surviving sponsons rotate'],'markv-recovery':['급정지 · 재장전 · 반격 기회','Hard stop · reload · counterattack window'],'markv-runaway':['랜드십 폭주 · 돌파 후 회전 포격','Landship runaway · breakthrough and pivot']});
PHASES['emplacement']=['차륜 모두 파괴 · 고정 포대 전환','Both wheels down · fixed emplacement'];
PHASES['flak-disabled']=['대공포탑 파괴 · 주포 사격 중단','Turret destroyed · main gun silenced'];
PHASES['hull-exposed']=['장갑 해제 · 차체 노출','Armour disabled · hull exposed'];
PHASES['harbor-blockade']=['항만 봉쇄 · 기뢰 뒤 순차 포격','Harbor blockade · mines then staggered guns'];
PHASES['harbor-last-blockade']=['최후 봉쇄 포화 · 남은 포대에 주의','Last blockade · surviving batteries'];
PHASES['harbor-launch-disabled']=['수상기 시설 파괴 · 출격 중단','Seaplane dock destroyed · launches stopped'];
PHASES['rig-exposed']=['중앙 계류장치 노출','Central rig exposed'];
PHASES['sector-west-captured']=['서부 진지 무력화 · 지휘포대 생존 시 수리','West battery disabled · command keeps repairs active'];
PHASES['sector-east-captured']=['동부 진지 무력화 · 지휘포대 생존 시 수리','East battery disabled · command keeps repairs active'];
PHASES['sector-citadel-captured']=['후방 성채 무력화 · 지휘포대 생존 시 수리','Rear citadel disabled · command keeps repairs active'];
PHASES['defense-collapse']=['양익 방어선 점령 · 후방 성채 공략','Both wings secured · assault the rear citadel'];
PHASES['central-fortress']=['3구역 점령 완료 · 중앙 지휘포대 노출','All sectors secured · command battery exposed'];
PHASES['gallipoli-repair-warning']=['파괴 포대 수리 중 · 3초 뒤 재가동','Defense repairs · reactivation in 3 seconds'];
PHASES['gallipoli-repaired']=['포대 수리 완료 · 재가동 준비','Defense restored · preparing to fire'];
PHASES['gallipoli-command-destroyed']=['중앙 지휘포대 파괴 · 수리·요격기 증원 중단','Command destroyed · repairs and sorties stopped'];
PHASES['bruno-ranging']=['이동 포격 · 착탄 순서 확인','Mobile ranging · read the impact order'];
PHASES['bruno-tracking']=['추적·교차 포격 · 방향을 바꿔 이탈','Tracking and crossfire · turn out of the salvo'];
PHASES['lincomparable-heavy-shell']=['초중량 포격 · 착탄 후 충격파','Heavy shell · impact then shockwave'];
PHASES['lincomparable-shock-link']=['충격파 연계 · 착탄 후 안쪽 틈으로','Shock link · return inside after impact'];
PHASES['lincomparable-counter']=['최후 포격 발사 · 기관차 반격 기회','Final round fired · strike locomotive'];
PHASES['lincomparable-locked']=['최후 포격 조준 고정 · 급선회','Final aim locked · turn out now'];

PHASES['jutland-ranging']=["거리 측정 사격 · 착탄 표식 이탈", "Ranging fire · leave impact markers"];
PHASES['jutland-crossing-turn']=["함대 선회 · T자 횡단 사격 준비", "Fleet turn · preparing crossing fire"];
PHASES['jutland-crossing-fire']=["T자 횡단 사격 · 함포와 사격지휘소 공략", "Crossing fire · attack turrets and director"];
PHASES['jutland-turn-away']=["전투 반전 · 순양함 어뢰 엄호", "Battle turn-away · cruiser torpedo screen"];
PHASES['jutland-reform']=["전열 재정비 · 개별 함선 공략", "Reforming · attack individual vessels"];
PHASES['jutland-director-lost']=["사격지휘소 파괴 · 횡단 집중 사격 약화", "Director destroyed · coordinated fire reduced"];
PHASES['jutland-observer-lost']=["관측 장비 파괴 · 함포 조준 지연", "Observer disabled · slower gunnery targeting"];
PHASES['jutland-recon-disabled']=["발진 설비 파괴 · 수상기 정찰 중단", "Launch deck destroyed · reconnaissance stopped"];
PHASES['jutland-tubes-lost']=["어뢰 발사관 파괴 · 해당 사선 해제", "Torpedo tubes destroyed · lane cleared"];
PHASES['jutland-boilers-lost']=["보일러 파괴 · 함선 속도 저하", "Boilers destroyed · vessel slowed"];
PHASES['jutland-recon-pass']=["수상기 관측 비행 · 격추하면 보정 사격 차단", "Seaplane reconnaissance · shoot down to stop corrected fire"];
PHASES['last-stand']=['잔여 포대 최후 방어','Remaining batteries make their final defense'];
PHASES['minenwerfer-prediction']=['이동 예측 · 교차 포격','Prediction · crossing impacts'];
PHASES['minenwerfer-encirclement']=['원형 포위 · 진행 방향의 빈틈','Encirclement · open flight corridor'];
PHASES['minenwerfer-crossing']=['시간차 교차 착탄','Staggered crossing impacts'];
PHASES['minenwerfer-focused']=['잔존 포대 · 집중 방어','Surviving guns · focused defense'];
PHASES['minenwerfer-last-prediction']=['최후의 포대 · 불규칙 예측','Last gun · irregular prediction'];
PHASES['minenwerfer-final-order']=['최후의 포격 명령','Final bombardment order'];
PHASES['livens-sweep']=['연료 누출 · 좌우 화염 쓸기','Fuel leaks · alternating flame sweep'];
PHASES['livens-unstable']=['압력 불안정 · 단속 분사와 회전','Unstable pressure · pulses and rotation'];
PHASES['livens-depressurized']=['압력 저하 · 본체 반격 기회','Depressurized · strike the core'];
export function bossPhaseLabel(phase,locale='ko'){const words=PHASES[phase];return words?words[locale==='en'?1:0]:pair('보스 전술 변화','Boss tactics changed',locale)}
export const BOSS_NAMES_EN=Object.freeze({'jutland-grand-fleet':'Jutland Battle Squadron','paris-staaken-rvi':'Zeppelin-Staaken R.VI · Paris raid','paris-searchlight-fortress':'Paris searchlight fortress','gallipoli-fortress':'Gallipoli Grand Fortress · Siege','wustenpanzer':'Wüstenpanzer · Desert cruiser','sinai-landship':'Sinai Landship','fort-douaumont':'Fort Douaumont','fort-souville':'Fort de Souville',
 'paris-gun':'Bruno railway gun',lincomparable:"520mm L’Incomparable",'sms-stuttgart':'SMS Stuttgart','hms-zubian':'HMS Zubian',
 'a7v-flak':'A7V Flakpanzer','mark-v-cruiser':'Mark V land cruiser','livens-flame-projector':'Livens flame projector','minenwerfer-battery':'Minenwerfer crossfire battery',
 'drachen-net':'Drachen mine network','london-apron':'London balloon apron','zeppelin-l70':'Zeppelin L 70',hma23:'HMA 23 carrier',gik:'Hansa-Brandenburg G.IK',ca4:'Caproni Ca.4','armored-harbor-fortress':'Armored harbor fortress',
 'fliegerzug':'Fliegerzug aerial torpedo carrier','treffas-wagen':'Treffas-Wagen landship',
 'jasta11-circus':'JASTA 11 · FLYING CIRCUS','naval10-black-flight':'NAVAL 10 · BLACK FLIGHT',
 'mark4-wedge':'Mark I landship breakthrough','morser-battery':'Schwaben underground fortress',
 'gotha-squadron':'Gotha night bomber squadron','london-apron-raid':'London balloon apron raid','staaken-rvi':'Staaken R.VI giant bomber','london-searchlight':'London searchlight battery','flak-tower':'QF 13-pounder flak towers'
});
const TACTIC_RAIL_ONLY=new Set(['paris-gun','lincomparable','a7v-flak','mark-v-cruiser','flak-tower','fliegerzug','treffas-wagen']);
export function bossTactic(encounter,locale='ko'){
 // Keep existing hint visibility; Somme's new component choices need cues.
 if(!TACTIC_RAIL_ONLY.has(encounter?.bossId)&&!['mark4-wedge','morser-battery','wustenpanzer','sinai-landship','gallipoli-fortress','paris-staaken-rvi','paris-searchlight-fortress','jutland-grand-fleet'].includes(encounter?.bossId))return '';
 const bodies=[...encounter?.bodies.values()||[]].filter(b=>!b.dead),b=bodies[0];if(!b)return '';
 const text=(ko,en)=>pair(ko,en,locale),gone=id=>b.parts.get(id)?.destroyed;
 switch(encounter.bossId){
  case 'jutland-grand-fleet':return text('함포와 사격지휘소를 부숴 공격을 줄이고, 함선 3척을 격파하세요.','Destroy three ships · disable director, tubes and observers to interrupt attacks');
  case 'gallipoli-fortress':return b.commandDestroyed?text('수리와 증원이 멈췄습니다. 남은 포대를 파괴하세요.','Command destroyed · no repairs or sorties / clear remaining guns'):text('지휘포대를 부수면 수리와 요격기 증원이 멈춥니다.','Destroy command to stop repairs and sorties · attack any battery');
  case 'wustenpanzer':return b.serviceWindow>0?text('증기를 피해 노출된 본체를 공격하세요.','Avoid steam circles · strike the open hull'):b.sandBlind?text('모래바람 속에 숨고, 마지막으로 포착된 위치에서 벗어나세요.','Sand cover breaks tracking · watch the last observed target'):gone('radiator')?text('증기 사이로 공격하고, 엔진을 부숴 폭주를 억제하세요.','Cooling destroyed · attack between vents · break engine'):text('포격을 옆으로 피하고, 증기를 내뿜을 때 본체를 공격하세요.','Dodge walking artillery sideways · strike during pressure release');
  case 'sinai-landship':return gone('command')?text('협공이 멈췄습니다. 남은 측면포와 장갑차를 파괴하세요.','Coordinated barrage stopped · silence guns and escorts'):gone('support')?text('증원이 멈췄습니다. 남은 장갑차와 측면포를 파괴하세요.','Reinforcements stopped · destroy escorts and flank guns'):text('포격 사이로 피하고, 지휘부를 부숴 협공을 끊으세요.','Use the central barrage gap · break command to stop coordination');
  case 'paris-searchlight-fortress':
   if(b.phase==='last-stand')return [...b.parts.values()].some(p=>p.kind==='gun'&&!p.destroyed)?text('포격과 기관총을 피해 남은 포대를 파괴하세요.','Dodge warned flak and MG fire · silence remaining batteries'):text('방공 무장이 멈췄습니다. 노출된 지휘부를 공격하세요.','Air defenses silenced · strike the exposed command');
   return b.coreVulnerable?text('불이 꺼지면 지휘부를 공격하세요. 발전기를 부수면 틈이 길어집니다.','BLACKOUT · strike command! Generator destruction extends the opening'):text('빛을 피해 탐조등과 발전기를 부수세요. 발각되면 집중 포격을 받습니다.','Read the light rhythm · illumination draws heavy fire · break lamps and generator');
  case 'paris-staaken-rvi':return text('엔진을 부숴 감속시키고, 폭탄창을 파괴해 도시 폭격을 막으세요.','Engines → slow/yaw · guns → approach lanes · bomb bay → stop city bombing');
  case 'paris-gun':return b.phase==='arrival'?text('철로 위 열차 접근 · 정차 후 첫 포격','Train approaching on the rail · first shot after braking'):b.phase==='runaway'?text('철의 폭우 · 번호 순서에서 급선회해 이탈, 철로 파괴로 중단','Iron rain · turn out of the numbered march; break the rail to interrupt'):b.phase==='derailed'?text('탈선 · 포격 종료, 기관차에 집중 사격','Derailed · barrage ended; strike the locomotive'):b.coreVulnerable?text('기관차 공략 · HP 28%에서 폭주, 미리 철로를 파괴하세요.','Attack locomotive · runaway at 28% HP; break the rail first'):gone('car-middle')?text('관측차 파괴 · 이전 구역으로 포격, 탄약차를 부숴 장전을 늦추세요.','Observer down · old sector shelled; break ammunition to slow reload'):b.raidPhase===2?text('추적·교차 포격 · 번호 순서를 벗어나 관측차를 공략하세요.','Tracking and crossfire · turn out of the numbered order; attack observer'):text('이동 포격 · 착탄 표식 이탈, 후방 방어차부터 공략하세요.','Mobile ranging · leave impact markers; attack the rear defense car');
  case 'lincomparable':return b.phase==='arrival'?text('육중한 열차 접근 · 긴 제동 후 첫 발','Heavy train approaching · first shot after long braking'):b.finalAim?text('520mm 최후 포격 · 중심 이탈 후 충격파 안쪽으로, 잔류 원 주의','Final 520mm · clear center, return inside wave; avoid residue'):b.phase==='derailed'?text('탈선 · 기관차에 집중 사격, 남은 충격파·잔류 원 주의','Derailed · strike locomotive; watch remaining wave and residue'):b.coreVulnerable&&b.recovery>0?text('재장전 중 기관차를 공격하면 최후 포격 범위가 줄어듭니다.','Strike the reloading locomotive to shrink the final blast'):b.raidPhase===2?text('착탄 후 충격파 안쪽으로 복귀 · 잔류 원 반대쪽이 안전','After impact return inside wave · use the side opposite residue'):text('중심 폭발과 원형 충격파를 피하고, 후방 방어차부터 공략하세요.','Evade center and expanding wave · break rear defense first');
  case 'sms-stuttgart':return b.support129?.phase===1?text('덮개를 부숴 연료를 공격하세요. 보일러를 부수면 느려집니다.','Break boilers to slow the carrier · open the hangar'):text('격납시설·연료를 부수면 출격이 멈춥니다. 대공포 파괴로 퇴로를 여세요.','Destroy hangar or fuel to stop sorties · silence AA guns for escape lanes');
  case 'hms-zubian':return bodies.length>1?text('앞쪽 선체의 돌진을 피하고, 뒤쪽 함포를 부숴 교차 포격을 끊으세요.','Evade the bow attack · break the stern gun to stop crossfire'):text('접합부를 공격하세요. 분리된 뒤에도 함포와 기관의 손상은 유지됩니다.','Gun and engine damage persists after the split · attack the seam');
  case 'a7v-flak':return b.tacticalState==='recovery'?text('포격이 끝났습니다. 멈춘 차체와 노출된 기관부를 공격하세요.','Barrage ended · strike the stopped hull and exposed engine'):b.rotation?text('회전하는 포문 사이로 피하세요. 궤도·탐조등 파괴로 사냥망을 약화시키세요.','Read rotating ports · tracks and searchlight weaken the hunting net'):b.phase==='exposed'?text('차체 기관총을 피해 노출된 본체를 공격하세요.','Dodge the hull gun · strike the exposed chassis'):b.coreVulnerable?text('장갑이 열렸습니다. 남은 포탑이나 본체를 공격하세요.','Armor breached · silence guns or attack the hull'):text('탐조등과 교차 포격을 피하고, 궤도를 부숴 이동을 막으세요.','Evade spotlights and crossfire · break tracks to halt movement');
  case 'mark-v-cruiser':return b.tacticalState==='recovery'?text('폭주가 끝났습니다. 멈춘 전차의 남은 측면포와 기관부를 공격하세요.','Runaway ended · attack surviving sponsons and the engine'):b.rotation?text('돌파 경로를 비우고, 파괴된 측면포 방향으로 피하세요. 회전 뒤 반격하세요.','Clear the advance · broken sponson is the safe flank · punish recovery'):b.phase==='final-assault'?text('기관총을 피하며 궤도를 부수고, 본체를 공격하세요.','Evade the hull gun · break tracks and finish the chassis'):b.coreVulnerable?text('장갑이 열렸습니다. 남은 측면포와 기관총을 주의하세요.','Armor breached · watch the remaining sponson and hull gun'):text('측면포를 부수면 장갑이 열리고, 궤도를 부수면 전진이 멈춥니다.','Break a sponson to breach armor · tracks stop the advance');
  case 'livens-flame-projector':return !b.discovered?text('진동하는 매설 노즐을 찾아 접근하세요.','Approach the buried nozzle beneath the tremors'):b.stormActive?text('화염폭풍 · 회전 뒤 0.65초 틈, 압력장치를 부숴 분사를 끊으세요.','Firestorm · 0.65s gaps; break pressure to interrupt the jet'):b.recovery>0?text('압력이 낮아졌습니다. 노출된 본체에 반격하세요.','Pressure down · counterattack the exposed core'):b.raidPhase>=2?text('표시된 회전 방향과 누출 원을 피하고, 압력장치를 공략하세요.','Read sweep direction and leak circles · attack pressure'):text('조준이 고정되면 화염 옆으로 선회하고, 분사 후 본체를 공격하세요.','Turn beside the locked flame · strike core after discharge');
  case 'minenwerfer-battery':{const live=[...b.parts.values()].filter(p=>!p.destroyed).length;return !b.discovered?text('착탄을 피해 포연 방향으로 접근해 진지를 찾으세요.','Evade impacts and follow the mortar smoke'):b.mortarPlan?.final?text('번호 순서로 착탄합니다. 진행 방향을 바꾸고 마지막 예측탄을 피하세요.','Impacts follow numbers · change direction before the final prediction'):b.recovery?text('포격망 종료 · 장전 중인 포대를 제압하세요.','Barrage complete · counterattack the reloading guns'):live===1?text('최후의 한 문 · 순차 포격 뒤 불규칙 예측을 피하세요.','Last gun · evade rapid sequence and irregular predictions'):text('좌우 포대 파괴로 포위를 해제하고, 중앙을 부숴 중박격포를 제거하세요.','Break either side to open encirclement · destroy center to remove heavy shells');}
  case 'drachen-net':return text('비행선 3기를 모두 격추하세요. 남은 비행선은 계속 기뢰를 뿌립니다.','Down all three airships · survivors keep firing and laying mines');
  case 'fort-douaumont':return b.coreVulnerable?text('마지막 집중 포격을 피해 노출된 중앙부를 공격하세요.','Core exposed · dodge the final barrage'):b.phase==='verdun-ammo'?text('노출된 좌우 탄약고를 부수면 해당 구역의 포격이 약해집니다.','Destroy exposed flank ammunition → weaken that sector'):text('외곽 포대부터 중포까지 부수세요. 관제부를 파괴하면 포격이 약해집니다.','Outer mounts → heavy turrets · control loss weakens salvos');
  case 'fort-souville':return b.coreVulnerable?text('남은 포대를 피하며 노출된 지하 핵심부를 공격하세요.','Underground core exposed · silence remaining pits'):b.phase==='verdun-ruin-breach'?text('노출된 지하 탄약고를 부숴 내부 진지를 연쇄 폭발시키세요.','Underground ammunition exposed → interior chain blast'):text('관측소를 부수면 포격이, 지휘소를 부수면 증원이 멈춥니다.','Hit open pits · observer=artillery / command=reserves');
  case 'gotha-squadron':return text('후방 사격을 피하며 폭탄창을 부수세요. 엔진을 파괴하면 투하가 늦어집니다.','Break bomb bays to protect the city · engines delay drops · beware rear guns');
  case 'london-apron-raid':return b.coreVulnerable?text('방벽이 해체됐습니다. 중앙 윈치를 공격하세요.','Barrier dismantled · attack the central winch'):text('탐조등과 포대를 제압하고, 기구 3개를 부숴 윈치를 노출시키세요.','Silence lamp and flak · break 3 balloons to expose the winch');
  case 'london-apron':return text('그물을 공격해도 비행선이 피해를 받습니다. 격추하면 통로가 열립니다.','Net damage transfers to its airship · down it to open a lane and silence its gun');
  case 'zeppelin-l70':return b.phase==='cloud'?text('구름 아래 관측 곤돌라를 부숴 본체를 드러내세요.','Destroy the gondola beneath the cloud to reveal the bombing fortress'):b.lastStand?text('화염 통로를 피하고, 엔진을 부숴 측면포와 기동을 약화시키세요.','Hydrogen fire corridor · break engines to reduce guns and drift'):text('엔진을 부수면 측면포, 기동, 본체 방어가 약해집니다.','Destroy engines to reduce broadsides, drift and hull protection');
  case 'hma23':return b.coreVulnerable?text('마지막 편대가 출격합니다. 측면 대공포를 피해 본체를 공격하세요.','Final sortie · evade alternating deck flak and strike the carrier'):text('좌우 공격을 피하며 발진구 4개를 부숴 장갑을 해제하세요.','Read each port’s attack lane · destroy all four to expose the hull');
  case 'gik':return b.cannonLock?text('예고선 옆으로 피하세요. 포구를 부수면 중포 발사를 막을 수 있습니다.','Cannon locked · sidestep the line or destroy the muzzle'):gone('cannon')?text('중포가 멈췄습니다. 후방 사격과 연속 폭탄을 피하세요.','Cannon disabled · watch the rear gun and stick bombs'):text('전후방 사격을 피하세요. 엔진을 부수면 기동과 방어가 약해집니다.','Front cannon, rear gun · engines reduce speed and hull armor');
  case 'ca4':return gone('bombBay')?text('폭격이 멈췄습니다. 남은 사수와 동체를 공격하세요.','Payload ruptured · bombing stopped; attack surviving guns and hull'):b.parts.get('bombBay')?.hittable?text('열린 폭탄창에 사격을 집중하면 폭격을 막고 내부 폭발을 일으킵니다.','Bomb bay open · hit the center hatch to cancel bombing and trigger cook-off'):text('빈 폭격로로 피하세요. 엔진을 부수면 폭격 간격이 길어집니다.','Use the open lane · engine losses delay bombing runs');
  case 'armored-harbor-fortress':if(b.craneState==='recover'&&!b.coreVulnerable)return text('포격 예고선을 피하고, 사격이 끝나면 시설을 공격하세요.','Evade marked gun lines · counterattack after the salvo');if(b.craneState==='sweep')return text('와이어 끝을 따라 기뢰가 떨어집니다 · 기뢰 사이로 이동하세요.','Mines follow the cable · move through the gaps');return b.coreVulnerable?text('중앙 지휘시설을 공격하며 남은 포대를 주의하세요.','Command core exposed · watch surviving guns'):b.parts.get('crane-pivot')?.hittable?text('노출된 크레인 회전축을 부수면 중앙부가 열립니다.','Crane pivot exposed · destroy it to open the core'):text('크레인 팔이나 외곽 부위 3개를 부수고, 회전축을 공격하세요.','Break the boom or 3 outer parts → pivot · ammo loss stops replenishment');
   case 'fliegerzug':return b.phase==='runaway'?text('폭주하는 열차를 피하고, 탈선한 뒤 기관차를 공격하세요.','Clear the runaway track → strike after derailment'):b.phase==='derailed'?text('탈선했습니다. 노출된 기관차에 사격을 집중하세요.','Derailed · strike the locomotive'):b.coreVulnerable?text('기관차가 노출됐습니다. 남은 화차의 무장을 파괴하세요.','Locomotive exposed · disable remaining wagons'):gone('car-launch-a')&&gone('car-launch-b')?text('발진이 멈췄습니다. 대공포차와 후미 무장을 파괴하세요.','Both launch cars down · disable flak and rear gun'):gone('car-launch-a')||gone('car-launch-b')?text('발진차 하나가 남았습니다. 파괴해 무인폭탄기 출격을 막으세요.','One launch car down · stop the remaining unmanned bombers'):text('발진차를 부숴 출격을, 대공포차를 부숴 포격을 끊으세요.','Choose which launch, flak or supply car to disable');
   case 'treffas-wagen':return gone('turret')?text('주포가 멈췄습니다. 차체 기관총을 피하세요.','Turret down · main gun silenced; hull guns remain'):b.phase==='emplacement'?text('이동이 멈췄습니다. 번갈아 쏘는 포격을 피하세요.','Fixed emplacement · bracket and aimed line alternate'):b.coreVulnerable?text('노출된 차체를 공격하세요. 포탑과 바퀴도 파괴할 수 있습니다.','Hull exposed · turret and wheels remain targets'):gone('wheel-left')||gone('wheel-right')?text('바퀴 하나가 남았습니다. 나머지도 부숴 이동을 막으세요.','One wheel down · mobility reduced'):text('바퀴를 부수면 이동이 멈추고, 포탑을 부수면 주포가 멈춥니다.','Destroy wheels or turret to change its attacks');
  case 'jasta11-circus':return text('좌우 편대기를 격추해 포위를 푸세요. 리히트호펜도 바로 공격할 수 있습니다.','Break the wing attack lanes to weaken the trap · Richthofen is always vulnerable');
  case 'naval10-black-flight':return text('두 기 중 하나를 격추하면 해당 조의 협공이 끊깁니다.','Split each bait-hunter pair · losing either aircraft breaks that pair attack');
  case 'mark4-wedge':return b.tacticalState==='halt-fire'?text('엄호 사격을 피해 멈춰 선 전차의 측면을 공격하세요.','Male halts to fire · avoid female covering guns and flank'):text('궤도를 부숴 이동을 막고, 측면 무장을 파괴해 장갑을 여세요.','Advance and reverse regroup · break tracks to stop, sponsons to expose armor');
  case 'morser-battery':return b.coreVulnerable?text('남은 포격을 피해 노출된 중앙 지휘부를 공격하세요.','Command core exposed · evade surviving guns and strike center'):gone('observer')?text('추적 포격이 멈췄습니다. 표시된 안전 통로로 피하세요.','Observer destroyed · blind sectors; use the marked clear corridor'):gone('ammo')?text('포격이 느려졌습니다. 중포 2문을 부숴 중앙부를 노출시키세요.','Ammo cooked off · slower fire; break two heavy mounts to expose core'):text('표시된 통로로 피하고, 관측소와 탄약고를 부숴 포격을 약화시키세요.','Curtain and creeping barrage alternate · use the marked lane; silence observer or ammo');
  case 'staaken-rvi':return b.coreVulnerable?text('엔진이 모두 멈췄습니다. 남은 폭탄을 피하며 동체를 공격하세요.','All engines stopped · evade the bomb dump and strike fuselage'):text('폭탄과 사수의 사격을 피하며 엔진 4개를 파괴하세요.','Destroy all four nacelles · avoid stick bombs and gunners');
  case 'london-searchlight':return b.coreVulnerable?text('방공 장치가 멈췄습니다. 노출된 중앙 지휘부를 공격하세요.','Defense disabled · command generator exposed'):gone('light')?text('추적이 멈췄습니다. 남은 포좌와 탄약고를 파괴하세요.','Tracking stopped · disable gun and ammunition'):text('탐조등을 먼저 부수세요. 오래 비춰지면 집중 포격을 받습니다.','Sustained illumination triggers focused flak · destroy the lamp');
  case 'flak-tower':case 'flak-tower-cell':return b.coreVulnerable?text('본체가 열렸습니다. 중앙부에 사격을 집중하세요.','Two mounts down · strike the open cupola'):gone('ears')?text('추적이 멈췄습니다. 정해진 구역으로 쏘는 포격은 계속됩니다.','Horns down · tracking stops; watch fixed blind sectors'):text('청음기를 부숴 추적을 끊으세요. 부위 2개를 부수면 본체가 드러납니다.','Silence tracking or guns · two broken mounts open each core');
  default:return '';
 }
}
export function bossSoundFor(event,kind=''){
 const type=event.type,visual=event.visual||'';
 if(type==='armor-drive')return 'armorDrive';
 if(type==='armor-entry')return 'armorEntry';
 if(type==='armor-brake')return 'armorBrake';
 if(type==='phase-change'||type==='hangar-cover-ejected')return 'armorOpen';
 if(type==='split-start'||type==='split')return 'shipBreak';
 if(type==='seam-warning')return 'approachWarning';
 if(type==='part-destroyed'||type==='ammo-cookoff'||type==='rail-car-detached'||type==='rail-break')return 'metalBreak';
 if(type==='flame-warning'||type==='livens-pressure-rise'||type==='livens-firestorm')return 'flameValve';
 if(type==='minenwerfer-final-order')return 'approachWarning';
 if(type==='mortar-launch')return 'mortarLaunch';
 if(type==='crane-drop'||type==='spawn-minefield')return 'winchRelease';
 if(type==='rural-rail-roll')return 'trainRoll';
 if(type==='rural-rail-brake')return 'trainBrake';
 if(type==='rural-rail-load')return 'railBreech';
 if(['bruno-rail-discovered','bruno-iron-rain','lincomparable-last-520','lincomparable-rail-discovered'].includes(type))return 'trainApproach';
 if(type==='rail-aim'||type==='rural-aim'||type==='rail-runaway')return 'railClatter';
 if(type==='seaplane-launch')return 'formationPass';
 if(type==='minion-launched')return 'formationPass';
 if(type==='charge-warning'||type==='reentry-warning')return 'approachWarning';
 if(type==='aa-volley')return 'navalGun';
 if(type==='flak-burst')return 'flak';
 if(type==='muzzle')return ['gik','ca4'].includes(kind)?'enemyShot':/stuttgart|zubian|harbor/.test(kind)?'navalGun':kind==='minenwerfer-battery'?null:'heavyShot';
 if(type==='heavy-gun-fired')return event.railArtillery?'railGunFire':'heavyShot';
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
