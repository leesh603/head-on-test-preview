// One equipment ID, two faction presentations; pilot mechanics live in passive-medals.js.
export const PASSIVE_MEDAL_ID='passiveMedal';
export const PASSIVE_MEDAL_EFFECTS=Object.freeze({
 friedrich_karl:['집중 표적·지원 화력','표적 지정 9초. 그 적에게 주무장 피해 +12%·자신의 폭발물·편대 피해 +22%(보스 +6%·+12%).','Designate a target for 9s. Primary damage +12%; owned explosives and wingmen +22% (+6% and +12% vs bosses).'],
 robinson:['주요 위협 요격·추격','접근 속도 +18%·선회 +22%. 직접 명중한 표적에 8초간 주무장 피해 +18%(보스 +9%). 직접 격추 후 재배치 가속 3.5초.','Approach speed +18%, turn +22%. The directly hit target takes +18% primary damage for 8s (+9% vs bosses). Personal kills grant 3.5s of repositioning speed.'],
 baron:["강적 추적 단계·격추 가속","사냥 3단계 명중 후 사냥감 격추 시 가속 2초 연장. 알바트로스는 선회 후 재진입 명중 시 2초간 장전 가속.","Kill your prey after a tier-three hit to extend hunting acceleration by 2s. In an Albatros, a hit on re-entry after turning grants 2s of faster reloading."],
 fonck:["집중 조준·선행 사격","집중 조준 완료 후 첫 기관총 사격이 관통하며 같은 표적에 20% 추가 피해. 대기 4초.","After completing steady aim, the first gun shot pierces and deals +20% damage to that target. Retrigger: 4s."],
 voss:["근거리 적 수에 따른 기동·화력","400 안에 적 3기 이상일 때 회피 성공 시 기동 대기 2초 회복·1.5초간 연사 +25%. 대기 6초.","Evade while at least three enemies are close: reduce maneuver cooldown by 2s and gain +25% fire rate for 1.5s. Retrigger: 6s."],
 boelcke:["측후방 사격·상시 편대","측후방 명중 시 3초간 편대 집중 표적 지정. 해당 표적의 편대 첫 명중 피해 +35%. 대기 4초.","A flank or rear hit designates the enemy for wingmen for 3s. Their first hit on it deals +35% damage. Retrigger: 4s."],
 collishaw:["검은 편대 분산 공격","편대가 1초 안에 서로 다른 적 2기를 맞히면 두 적의 연사를 중단하고 사격을 0.6초 지연. 대기 5초.","When your wingmen hit two different enemies within 1s, interrupt both enemies’ bursts and delay their next shots by 0.6s. Retrigger: 5s."],
 baracca:["정면 교전 추가 피해","정면 명중 성공 시 2초간 전방 피해 30% 감소·다음 기관총 1발 관통. 대기 5초.","A head-on hit grants 30% less frontal damage taken for 2s and makes the next gun round pierce. Retrigger: 5s."],
 udet:["실제 탄환 근접 통과 중첩","3중첩 근접 통과에 성공하면 기동 대기 1.5초 회복·다음 사격 1발 관통. 대기 3초.","Reach three graze stacks to reduce maneuver cooldown by 1.5s and make the next gun round pierce. Retrigger: 3s."],
 guynemer:["4초마다 관통 중포","패시브 포탄의 첫 실명중에 30% 화염 폭발 추가. 폭발은 재발동하지 않습니다.","The passive cannon’s first accepted hit adds a fire blast at 30% damage. The blast cannot trigger itself."],
 bishop:["초근거리 사격","180 이내 같은 적에 3회 명중하면 현재 연사를 끊고 사격을 0.5초 지연·탄약 5% 회복. 대기 4초.","Land three very close hits on the same enemy to interrupt its current burst, delay its next shot by 0.5s and recover 5% ammunition. Retrigger: 4s."],
 goering:["백색 윙맨 동행","상시 윙맨이 본체를 향하는 추격기를 맞히면 0.7초 사격 차단·그 윙맨의 다음 점사 준비. 대기 5초.","When a permanent wingman hits a pursuer aiming at you, block its fire for 0.7s and ready that wingman’s next burst. Retrigger: 5s."],
 immelmann:["선회 후 독수리 사격","90도 선회로 얻은 독수리 사격의 첫 명중이 기동 대기 1초 회복·탄약 5% 회복. 대기 4초.","The first Eagle Fire hit after a 90-degree turn reduces maneuver cooldown by 1s and restores 5% ammunition. Retrigger: 4s."],
 mannock:["편대 연사·아군 엄호","본인 편대가 아군을 조준 중인 적을 맞히면 그 적의 연사 중단·아군 2초 엄호. 대기 5초.","When your wing hits an enemy aiming at an ally, interrupt its burst and protect the ally for 2s. Retrigger: 5s."],
 huffzky:["후방 포착·교란 점사","같은 추격기에 후방 3회 명중하면 연사 중단·조준 교란 1.2초. 대기 4초.","Three rear hits on one pursuer interrupt its burst and disrupt its aim for 1.2s. Retrigger: 4s."],
 mckeever:["전후방 독립 사격","1초 안에 전후방이 서로 다른 적을 맞히면 후방 표적을 0.6초 제압·후방 탄약 8% 회복. 대기 4초.","Hit separate enemies with front and rear guns within 1s: suppress the rear target for 0.6s and restore 8% rear ammunition. Retrigger: 4s."],
 wolff:["무피격 6단계 축적","6단계를 모은 뒤 실제 피격 시 잃은 중첩 1개 복구·1.5초간 이탈 선회 +35%. 대기 12초.","After reaching six stacks, an accepted hit restores one lost stack and grants +35% escape turning for 1.5s. Retrigger: 12s."],
 loewenhardt:["전방 420 사격 강화","전방 같은 적에 3회 명중하면 다음 사격 2발이 관통. 대기 5초.","Three frontal hits on one enemy make the next two gun rounds pierce. Retrigger: 5s."],
 mccudden:["일반 강화 4장 선택","4장 중 일반 강화를 선택하면 내구도 5% 수리·진행 중 장전 시간 30% 단축. 선택당 1회.","Choosing an ordinary upgrade from four options repairs 5% durability and shortens an ongoing reload by 30%. Once per choice."],
 nungesser:["근거리 연속 명중","근거리 3회 명중으로 집념 발동 시 같은 적 피해 강화가 3초→4초로 연장·다음 사격 1발 관통. 표적별 대기 4초.","Triggering Tenacity with three close hits extends its damage bonus against that target from 3s to 4s and makes the next gun round pierce. Per-target retrigger: 4s."],
 jacobs:["새 사선에서 같은 적 명중","사선 전환 성공 후 같은 표적에 기관총 20% 추가 피해·다음 사격 1발 관통. 지속 1.2초.","After changing your firing approach successfully, deal +20% gun damage to that target for 1.2s and make the next round pierce."],
 hawker:["격추 후 선회 연속 공격","강조된 다음 적을 맞히면 탄약 8% 회복·다음 사격 1발 관통. 대기 3초.","Hit the highlighted next enemy to recover 8% ammunition and make the next gun round pierce. Retrigger: 3s."],
 berthold:["버틴 피격 기억","실제로 최대 내구도의 9% 이상 피격 시 다음 기관총 2발이 50% 강화·관통. 대기 6초.","An accepted hit worth at least 9% maximum durability empowers the next two gun rounds by 50% and makes them pierce. Retrigger: 6s."],
 brumowski:["가까운 자신의 호위 편대","가까운 본인 윙맨 2기와 사격 명중 시 본체·해당 윙맨이 2초간 받는 피해 20% 감소. 대기 6초.","Land a shot while two owned wingmen are close: you and those wingmen take 20% less damage for 2s. Retrigger: 6s."],
 rickenbacker:["주변 적 수에 따른 화력","주변 적 3기 이상일 때 다른 적으로 사격 전환 성공 시 1.5초간 연사 +30%·탄약 5% 회복. 대기 4초.","With at least three enemies nearby, successfully switch fire to another target to gain +30% fire rate for 1.5s and restore 5% ammunition. Retrigger: 4s."],
 ball:["아군과 떨어진 단독 교전","단독 상태에서 적 후방 명중 시 2초간 이탈 속도 +20%·받는 피해 20% 감소. 대기 5초.","A solo rear hit grants +20% escape speed and 20% less damage taken for 2s. Retrigger: 5s."],
 barker:["피격 중첩 각성","피격 3중첩 도달 시 탄약 15% 회복·2초간 받는 피해 25% 감소. 대기 12초.","Reach three damage stacks to recover 15% ammunition and take 25% less damage for 2s. Retrigger: 12s."],
 gontermann:["3회 명중으로 연료 누출 준비","누출 준비 후 다음 일반 기관총 명중이 2초간 소형 화재를 일으킵니다. 표적당 대기 5초.","After preparing a fuel leak, the next ordinary gun hit starts a small 2s fire. Per-target retrigger: 5s."],
 luke:["비행선·관측기구 추가 피해","비행선·관측기구의 같은 부위에 6회 명중 시 3초 화재. 피해는 일반 기관총의 15%씩 0.25초 간격. 표적당 대기 6초.","Six hits on the same airship or observation-balloon part start a 3s fire, dealing 15% ordinary gun damage every 0.25s. Per-target retrigger: 6s."],
 sachsenberg:["기본 피해 감소","실피격 후 직선 이탈 시 2초간 가속 +25%·후방 피해 25% 감소. 대기 8초.","Fly straight out after an accepted hit to gain +25% speed and take 25% less rear damage for 2s. Retrigger: 8s."],
 lothar:["격추 후 새 적 재교전","재교전 성공 후 새 표적에 다음 2발 30% 강화·관통. 1.5초 이내 사격.","After successful re-engagement, the next two rounds against the new target gain +30% damage and pierce. Fire within 1.5s."],
 proctor:["명중한 적 사격 지연","기존 제압 성공 시 현재 연사도 중단·180 안의 다른 일반 적 1기도 0.4초 지연. 기존 표적당 5초 제한.","Successful suppression also interrupts the current burst and delays one other nearby ordinary enemy by 0.4s. The existing 5s per-target limit remains."],
 schleich:["기본 장갑 감소","전방 경탄 피격을 버티면 다음 사격 1발 60% 강화·관통·1.5초 정면 피해 20% 감소. 대기 7초.","Endure a frontal light-round hit: the next round deals +60% damage and pierces; take 20% less frontal damage for 1.5s. Retrigger: 7s."],
 lufbery:["라파예트 윙맨 후방 엄호","상시 라파예트 윙맨의 후방 추격기 명중 시 해당 적 0.8초 제압·윙맨 방호 1초. 대기 4초.","When the permanent Lafayette wingman hits a rear pursuer, suppress it for 0.8s and protect the wingman for 1s. Retrigger: 4s."],
 navarre:["수적 열세 시 관통·직접 피해 보상","열세 관통탄이 두 번째 항공기를 실제 맞히면 기동 대기 1초 회복·2초간 이탈 선회 +30%. 대기 4초.","An outnumbered piercing round must hit a second aircraft: reduce maneuver cooldown by 1s and gain +30% escape turning for 2s. Retrigger: 4s."],
 frommherz:["동료기 동행·명중 표적 선행 조준","지정 표적을 본인 편대가 맞히면 다음 개인 사격 2발이 그 표적에 35% 강화·편대 점사 준비. 대기 4초.","When your wingman hits the designated target, your next two personal rounds deal +35% damage to it and the wing prepares another burst. Retrigger: 4s."]
});
// Replacement cannon charges keep their direct-hit reward, never MG piercing.
const COW_PASSIVE_MEDAL_COPY=Object.freeze({
 fonck:['집중 조준 후 첫 COW 일제사격이 같은 표적에 직접 피해 +20%. 대기 4초. 포탄은 관통하지 않습니다.','After steady aim, the first COW salvo deals +20% direct damage to that target. Retrigger: 4s. Shells do not pierce.'],
 baracca:['정면 명중 시 2초간 전방 피해 30% 감소·다음 COW 일제사격 직접 피해 +20%. 대기 5초. 포탄은 관통하지 않습니다.','A head-on hit grants 30% less frontal damage for 2s and +20% direct damage on the next COW salvo. Retrigger: 5s. Shells do not pierce.'],
 udet:['근접회피 3중첩 도달 시 기동 대기 1.5초 회복·다음 COW 일제사격 직접 피해 +20%. 대기 3초. 포탄은 관통하지 않습니다.','Reach three graze stacks to reduce maneuver cooldown by 1.5s and empower the next COW salvo by 20%. Retrigger: 3s. Shells do not pierce.'],
 loewenhardt:['전방 같은 적 3회 명중 시 다음 COW 일제사격 2회 직접 피해 +20%. 대기 5초. 포탄은 관통하지 않습니다.','Three frontal hits on one enemy empower the next two COW salvos by 20%. Retrigger: 5s. Shells do not pierce.'],
 nungesser:['집념 발동 시 같은 적 피해 강화가 3초에서 4초로 연장·다음 COW 일제사격 직접 피해 +20%. 표적별 대기 4초. 포탄은 관통하지 않습니다.','Tenacity lasts 4s instead of 3s and empowers the next COW salvo by 20%. Per-target retrigger: 4s. Shells do not pierce.'],
 jacobs:['사선 전환 성공 후 같은 적에게 1.2초간 주무장 피해 +20%, 다음 COW 일제사격도 직접 피해 +20%. 포탄은 관통하지 않습니다.','After changing approach successfully, gain +20% primary damage to that target for 1.2s; the next COW salvo also gains +20% direct damage. Shells do not pierce.'],
 hawker:['강조된 다음 적 명중 시 탄약 8% 회복·다음 COW 일제사격 직접 피해 +20%. 대기 3초. 포탄은 관통하지 않습니다.','Hit the highlighted next enemy to restore 8% ammunition and empower the next COW salvo by 20%. Retrigger: 3s. Shells do not pierce.'],
 berthold:['최대 내구도의 9% 이상 실제 피격 시 다음 COW 일제사격 2회 직접 피해 +50%. 대기 6초. 포탄은 관통하지 않습니다.','An accepted hit worth at least 9% maximum durability empowers the next two COW salvos by 50%. Retrigger: 6s. Shells do not pierce.'],
 lothar:['재교전 성공 후 새 표적에 다음 COW 일제사격 2회 직접 피해 +30%. 1.5초 안에 사격해야 하며 포탄은 관통하지 않습니다.','After successful re-engagement, the next two COW salvos against the new target gain +30% direct damage. Fire within 1.5s; shells do not pierce.'],
 schleich:['전방 경탄 피격을 버티면 다음 COW 일제사격 직접 피해 +60%·1.5초 정면 피해 20% 감소. 대기 7초. 포탄은 관통하지 않습니다.','Endure a frontal light-round hit: the next COW salvo gains +60% direct damage and frontal damage taken falls 20% for 1.5s. Retrigger: 7s. Shells do not pierce.'],
 navarre:['추가 관통으로 두 번째 적을 맞히는 훈장 보상은 기관총 전용입니다. COW는 관통하지 않아 이 추가 보상을 발동하지 못하며, 열세 시 기본 직접 피해 +20%는 유지됩니다.','The medal reward for piercing into a second aircraft requires machine guns. COW shells cannot trigger it because they do not pierce; the base +20% outnumbered direct damage still applies.']
});
export function passiveMedalName(faction,locale='ko'){return locale==='en'?(faction==='entente'?'Distinguished Flying Cross':'Iron Cross 1st Class'):(faction==='entente'?'수훈비행십자훈장':'철십자 훈장 1급');}
export function passiveMedalDescription(p,locale='ko'){const id=typeof p==='string'?p:p?.pilot,row=PASSIVE_MEDAL_EFFECTS[id],cannon=(p?.cow37||p?.upgrades?.cow37)&&COW_PASSIVE_MEDAL_COPY[id];return row?(locale==='en'?'Pilot-specific Passive evolution. ':'파일럿 고유 패시브 강화 · ')+(cannon?cannon[locale==='en'?1:0]:locale==='en'&&row[2]?row[2]:row[1]):(locale==='en'?'Enhances the pilot’s unique Passive.':'파일럿 고유 패시브 강화');}
const CENTRAL_PILOTS=new Set(['baron','voss','boelcke','udet','goering','immelmann','huffzky','wolff','loewenhardt','jacobs','berthold','brumowski','gontermann','sachsenberg','lothar','schleich','frommherz','friedrich_karl']);
export function passiveMedalFaction(p,planes={}){return p?.pilot?(CENTRAL_PILOTS.has(p.pilot)?'central':'entente'):(planes[p?.plane]?.faction||'central');}
