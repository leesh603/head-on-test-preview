// One equipment ID, two faction presentations; pilot mechanics live in passive-medals.js.
export const PASSIVE_MEDAL_ID='passiveMedal';
export const PASSIVE_MEDAL_EFFECTS=Object.freeze({
 baron:['강적 추적 단계·격추 가속','사냥 3단계 명중 후 사냥감 격추 시 가속 2초 연장. 알바트로스는 선회 후 재진입 명중 시 2초간 장전 가속.'],
 fonck:['집중 조준·선행 사격','집중 조준 완료 후 첫 기관총 사격이 관통하며 같은 표적에 20% 추가 피해. 대기 4초.'],
 voss:['근거리 적 수에 따른 기동·화력','400 안에 적 3기 이상일 때 회피 성공 시 기동 대기 2초 회복·1.5초간 연사 +25%. 대기 6초.'],
 boelcke:['측후방 사격·상시 편대','측후방 명중 시 3초간 편대 집중 표적 지정. 해당 표적의 편대 첫 명중 피해 +35%. 대기 4초.'],
 collishaw:['검은 편대 분산 공격','편대가 1초 안에 서로 다른 적 2기를 맞히면 두 적의 연사를 중단하고 사격을 0.6초 지연. 대기 5초.'],
 baracca:['정면 교전 추가 피해','정면 명중 성공 시 2초간 전방 피해 30% 감소·다음 기관총 1발 관통. 대기 5초.'],
 udet:['실제 탄환 근접 통과 중첩','3중첩 근접 통과에 성공하면 기동 대기 1.5초 회복·다음 사격 1발 관통. 대기 3초.'],
 guynemer:['4초마다 관통 중포','패시브 포탄의 첫 실명중에 30% 화염 폭발 추가. 폭발은 재발동하지 않습니다.'],
 bishop:['초근거리 사격','180 이내 같은 적에 3회 명중하면 현재 연사를 끊고 사격을 0.5초 지연·탄약 5% 회복. 대기 4초.'],
 goering:['백색 윙맨 동행','상시 윙맨이 본체를 향하는 추격기를 맞히면 0.7초 사격 차단·그 윙맨의 다음 점사 준비. 대기 5초.'],
 immelmann:['선회 후 독수리 사격','90도 선회로 얻은 독수리 사격의 첫 명중이 기동 대기 1초 회복·탄약 5% 회복. 대기 4초.'],
 mannock:['편대 연사·아군 엄호','본인 편대가 아군을 조준 중인 적을 맞히면 그 적의 연사 중단·아군 2초 엄호. 대기 5초.'],
 huffzky:['후방 포착·교란 점사','같은 추격기에 후방 3회 명중하면 연사 중단·조준 교란 1.2초. 대기 4초.'],
 mckeever:['전후방 독립 사격','1초 안에 전후방이 서로 다른 적을 맞히면 후방 표적을 0.6초 제압·후방 탄약 8% 회복. 대기 4초.'],
 wolff:['무피격 6단계 축적','6단계를 모은 뒤 실제 피격 시 잃은 중첩 1개 복구·1.5초간 이탈 선회 +35%. 대기 12초.'],
 loewenhardt:['전방 420 사격 강화','전방 같은 적에 3회 명중하면 다음 사격 2발이 관통. 대기 5초.'],
 mccudden:['일반 강화 4장 선택','4장 중 일반 강화를 선택하면 내구도 5% 수리·진행 중 장전 시간 30% 단축. 선택당 1회.'],
 nungesser:['같은 적과 재교전','집념 재교전 성공 시 같은 적 강화 1초 연장·다음 사격 1발 관통. 기존 재발동 제한 유지.'],
 jacobs:['새 사선에서 같은 적 명중','사선 전환 성공 후 같은 표적에 기관총 20% 추가 피해·다음 사격 1발 관통. 지속 1.2초.'],
 hawker:['격추 후 다음 적 강조','강조된 다음 적을 맞히면 탄약 8% 회복·다음 사격 1발 관통. 대기 3초.'],
 berthold:['버틴 피격 기억','실제로 최대 내구도의 9% 이상 피격 시 다음 기관총 2발이 50% 강화·관통. 대기 6초.'],
 brumowski:['동행 편대에 따른 화력','180 안의 본인 편대 2기와 사격 명중 시 본체·해당 편대가 2초간 피해 20% 감소. 대기 6초.'],
 rickenbacker:['주변 적 수에 따른 화력','주변 적 3기 이상일 때 다른 적으로 사격 전환 성공 시 1.5초간 연사 +30%·탄약 5% 회복. 대기 4초.'],
 ball:['아군과 떨어진 단독 교전','단독 상태에서 적 후방 명중 시 2초간 이탈 속도 +20%·받는 피해 20% 감소. 대기 5초.'],
 barker:['피격 중첩 각성','피격 3중첩 도달 시 탄약 15% 회복·2초간 받는 피해 25% 감소. 대기 12초.'],
 gontermann:['3회 명중으로 연료 누출 준비','누출 준비 후 다음 일반 기관총 명중이 2초간 소형 화재를 일으킵니다. 표적당 대기 5초.'],
 luke:['비행선에 추가 피해','비행선 같은 부위에 6회 명중 시 3초 화재. 피해는 일반 기관총의 15%씩 0.25초 간격. 표적당 대기 6초.'],
 sachsenberg:['기본 피해 감소','실피격 후 직선 이탈 시 2초간 가속 +25%·후방 피해 25% 감소. 대기 8초.'],
 lothar:['격추 후 새 적 재교전','재교전 성공 후 새 표적에 다음 2발 30% 강화·관통. 1.5초 이내 사격.'],
 proctor:['명중한 적 사격 지연','기존 제압 성공 시 현재 연사도 중단·180 안의 다른 일반 적 1기도 0.4초 지연. 기존 표적당 5초 제한.'],
 schleich:['기본 장갑 감소','전방 경탄 피격을 버티면 다음 사격 1발 60% 강화·관통·1.5초 정면 피해 20% 감소. 대기 7초.'],
 lufbery:['라파예트 윙맨 후방 엄호','상시 라파예트 윙맨의 후방 추격기 명중 시 해당 적 0.8초 제압·윙맨 방호 1초. 대기 4초.'],
 navarre:['수적 열세 시 1회 추가 관통','열세 관통탄이 두 번째 항공기를 실제 맞히면 기동 대기 1초 회복·2초간 이탈 선회 +30%. 대기 4초.'],
 frommherz:['실명중 표적에 편대 선행 조준','지정 표적을 본인 편대가 맞히면 다음 개인 사격 2발이 그 표적에 35% 강화·편대 점사 준비. 대기 4초.']
});
export function passiveMedalName(faction,locale='ko'){return locale==='en'?(faction==='entente'?'Distinguished Flying Cross':'Iron Cross 1st Class'):(faction==='entente'?'수훈비행십자훈장':'철십자 훈장 1급');}
export function passiveMedalDescription(p,locale='ko'){const row=PASSIVE_MEDAL_EFFECTS[typeof p==='string'?p:p?.pilot];return row?(locale==='en'?'Pilot-specific Passive evolution. ':'파일럿 고유 패시브 강화 · ')+row[1]:(locale==='en'?'Enhances the pilot’s unique Passive.':'파일럿 고유 패시브 강화');}
const CENTRAL_PILOTS=new Set(['baron','voss','boelcke','udet','goering','immelmann','huffzky','wolff','loewenhardt','jacobs','berthold','brumowski','gontermann','sachsenberg','lothar','schleich','frommherz']);
export function passiveMedalFaction(p,planes={}){return p?.pilot?(CENTRAL_PILOTS.has(p.pilot)?'central':'entente'):(planes[p?.plane]?.faction||'central');}
