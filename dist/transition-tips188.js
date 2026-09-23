export const REGION_TRANSITION_LABELS=Object.freeze({
 0:Object.freeze({ko:'전원 지대 · 기뢰지대',en:'Pastoral Minefields'}),
 1:Object.freeze({ko:'아드리아해 · 적 함대',en:'Adriatic Sea Front'}),
 2:Object.freeze({ko:'참호 전선 · 대공포',en:'Trench Front'}),
 3:Object.freeze({ko:'포화의 참호전선',en:'Saturated Trench Front'}),
 4:Object.freeze({ko:'도심 전역',en:'Urban Front'}),
 5:Object.freeze({ko:'고공 전역',en:'High Altitude Front'}),
 6:Object.freeze({ko:'알프스 산맥',en:'Alpine Front'}),
 7:Object.freeze({ko:'제브뤼헤 군항 · 해안포대',en:'Zeebrugge Harbor Front'})
});

export const COMMON_TRANSITION_TIPS=Object.freeze([
 {id:'reload-gap',ko:'재장전은 적과 거리가 벌어졌을 때 하세요.',en:'Reload when you have opened distance from the enemy.'},
 {id:'ace-first',ko:'에이스가 나오면 일반 적보다 먼저 처리하세요.',en:'Prioritize enemy aces over ordinary aircraft.'},
 {id:'outside-in',ko:'적 편대는 바깥쪽부터 끊어내는 편이 안전합니다.',en:'Break enemy formations from the outside in.'},
 {id:'evade-read',ko:'회피 직후엔 다음 탄막을 먼저 확인하세요.',en:'After evading, read the next barrage before re-engaging.'},
 {id:'level-survive',ko:'위험할 때는 생존이 다음 강화로 이어집니다.',en:'Survival now is what gets you to the next upgrade.'}
]);

export const REGION_TRANSITION_TIPS=Object.freeze({
 0:Object.freeze([
  {id:'mine-shoot',ko:'붉은 기뢰는 사격으로 파괴할 수 있습니다.',en:'Red mines can be destroyed by gunfire.'},
  {id:'rail-warning',ko:'열차포 조준 경고가 뜨면 원 밖으로 빠지세요.',en:'When the rail gun marks a target, leave the warning circle.'},
  {id:'rail-cars',ko:'열차 객차를 순서대로 부수면 기관차가 노출됩니다.',en:'Destroy the train cars in order to expose the locomotive.'}
 ]),
 1:Object.freeze([
  {id:'fleet-axis',ko:'함선 탄막은 사격축 옆으로 빠지는 게 안전합니다.',en:'Against ships, move off their firing axis.'},
  {id:'zubian-split',ko:'쥬비안은 분리된 뒤에도 두 선체가 공격합니다.',en:'After Zubian splits, both hull sections keep attacking.'},
  {id:'carrier-launch',ko:'수상기 모함은 지원기를 계속 출격시킵니다.',en:'Seaplane carriers keep launching support aircraft.'}
 ]),
 2:Object.freeze([
  {id:'a7v-light',ko:'탐조등에 잡히면 A7V 대공포가 더 정확해집니다.',en:'A7V flak becomes more accurate when a searchlight has you.'},
  {id:'a7v-turrets',ko:'A7V 포탑을 모두 부수면 본체가 노출됩니다.',en:'Destroy every A7V turret to expose the main body.'},
  {id:'markv-sponsons',ko:'마크 V는 좌우 스폰슨을 부수면 본체가 노출됩니다.',en:'Destroy both Mark V sponsons to expose the main body.'}
 ]),
 3:Object.freeze([
  {id:'livens-flame',ko:'리벤스 화염 경고가 뜨면 노즐 정면을 피하세요.',en:'When the Livens flame warning appears, leave the nozzle line.'},
  {id:'minen-ammo',ko:'미넨베르퍼 탄약고를 부수면 박격포 탄수가 줄어듭니다.',en:'Destroy the Minenwerfer ammo store to reduce mortar shell count.'},
  {id:'minen-command',ko:'미넨베르퍼 지휘부를 부수면 포격 예고가 길어집니다.',en:'Destroy the Minenwerfer command post to lengthen barrage warnings.'}
 ]),
 4:Object.freeze([
  {id:'drachen-balloon',ko:'드라헨 관측기구를 부수면 포격이 끊깁니다.',en:'Destroy the Drachen observation balloon to stop its artillery.'},
  {id:'london-gap',ko:'런던 방공망은 열린 통로로 빠져나가세요.',en:'Use the open corridor to pass through the London apron defense.'},
  {id:'drachen-chain',ko:'드라헨 기뢰를 부수면 연쇄 폭발이 일어납니다.',en:'Destroying Drachen mines triggers chain explosions.'}
 ]),
 5:Object.freeze([
  {id:'sky-gas',ko:'가스 경고가 뜨면 구역 밖으로 먼저 빠지세요.',en:'When a gas warning appears, leave the affected area first.'},
  {id:'sky-carrier',ko:'공중항모는 지원기를 계속 내보냅니다.',en:'Airborne carriers keep sending out support aircraft.'},
  {id:'sky-escort',ko:'비행선 호위기는 본체에서 떼어내 싸우세요.',en:'Separate airship escorts from the main airship before fighting them.'}
 ]),
 6:Object.freeze([
  {id:'alps-engine',ko:'알프스 보스는 엔진을 부수면 비행이 둔해집니다.',en:'Destroying Alpine boss engines reduces their flight performance.'},
  {id:'ca4-reentry',ko:'카프로니 재진입 경고가 뜨면 진입선을 피하세요.',en:'When Caproni re-entry is warned, move off its approach line.'},
  {id:'alps-bombs',ko:'폭격 경고원이 깔리면 빈 줄로 먼저 이동하세요.',en:'When bombing markers appear, move into an open lane first.'}
 ]),
 7:Object.freeze([
  {id:'harbor-guns',ko:'항구요새 포대를 부수면 함포 탄막이 줄어듭니다.',en:'Destroy harbor fortress gun emplacements to reduce shell fire.'},
  {id:'harbor-crane',ko:'크레인 암이 남아 있으면 기뢰 공격이 계속됩니다.',en:'As long as the crane arm survives, mine attacks continue.'},
  {id:'harbor-seaplane',ko:'수상기 시설을 부수면 지원기 출격을 막습니다.',en:'Destroy the seaplane facility to stop support launches.'}
 ])
});

export function transitionRegionLabel(region,locale='ko',fallback=''){
 const label=REGION_TRANSITION_LABELS[region];
 return label?(locale==='en'?label.en:label.ko):fallback;
}

export function chooseTransitionTip(region,locale='ko',rng=Math.random,excludeId=''){
 const regional=REGION_TRANSITION_TIPS[region]||[];
 const useRegional=regional.length&&rng()<.8;
 let pool=useRegional?regional:COMMON_TRANSITION_TIPS;
 let choices=pool.filter(item=>item.id!==excludeId);
 if(!choices.length)choices=pool;
 const item=choices[Math.floor(rng()*choices.length)]||COMMON_TRANSITION_TIPS[0];
 return {id:item.id,text:locale==='en'?item.en:item.ko};
}
