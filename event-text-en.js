// English for in-game event toasts that were only written in Korean.
// Presentation only: wraps Game#event to swap the display text when the
// locale is English. Short technical tokens ('balloon', 'heal', …) pass through.
import {getLocale} from './i18n.js?v=428';

const EXACT = {
  '관측기구 격추 · 적 포병 관측망 붕괴 — 12초간 관측포격 중단': 'Observation balloon down · enemy spotting net broken — no observed fire for 12s',
  '기관차 탈선 · 최종 코어 노출': 'Locomotive derailed · final core exposed',
  '기관차 폭주! · 선로에서 이탈하기 전에 추격하세요': 'Runaway locomotive! · Chase it down before it leaves the line',
  '기뢰지대 발견 · 붉은 기뢰를 피하거나 사격으로 제거하세요': 'Minefield ahead · Avoid the red mines or shoot them',
  '기습! 고속 추격 편대': 'Ambush! Fast pursuit flight',
  '대공포 발사! 탄막을 피하세요': 'Flak! Dodge the barrage',
  '도심 방공망 — 탐조등에 잡히면 집중 화망이 올라옵니다': 'City air defence — get caught in a searchlight and the guns converge',
  '독가스 살포 예고 · 노란 경계 밖으로 이동하세요': 'Gas attack incoming · Move outside the yellow ring',
  '돌풍 발생! 풍압을 피하세요': 'Gust front! Keep out of the wind blast',
  '돌풍에 휘말렸다! 조준이 흔들린다': 'Caught in the gust! Aim is shaking',
  '두 기체 모두 격추 · 협동 작전 종료': 'Both aircraft down · co-op sortie over',
  '르네 퐁크 · 탄도학의 지옥': 'René Fonck · Ballistic hell',
  '베르너 포스 · 7대1 / 잔상 6기': 'Werner Voss · Seven to One / 6 afterimages',
  '베르너 포스 · 7대1 / 탄막 제거': 'Werner Voss · Seven to One / bullets cleared',
  '붉은 남작 · 태양을 등진 재돌입': 'The Red Baron · re-entry out of the sun',
  '붐 앤 줌 · 급강하 가속': 'Boom and Zoom · diving surge',
  '브록식 연막 · 적 추적 해제': 'Brock smoke screen · enemy lock broken',
  '비상수선 · 내구도 20% 회복': 'Field repair · 20% durability restored',
  '비행선 붕괴! 충격 돌풍 접근': 'Airship breaking up! Shock gust incoming',
  '비행선 호위 함대 전개': 'Airship escort deploying',
  '샤를 너겐서 · 불사조의 집념': 'Charles Nungesser · Phoenix Resolve',
  '선회기동기동': 'Maneuver',
  '수상 정찰기 접근 — 구름에 숨거나 격추해 함대 지원을 차단하세요': 'Seaplane scout inbound — hide in cloud or shoot it down to stop fleet support',
  '수상기가 함대에 위치를 송신 — 지원 함대 접근 중': 'Seaplane reported your position — support fleet inbound',
  '수소 화재 · 적과 아군 모두 접근 금지': 'Hydrogen fire · keep clear, friend and foe',
  '아군 지원 편대 도착': 'Friendly support flight arrived',
  '아군 폭격대 진입 · 폭탄 5발 투하': 'Friendly bombers inbound · five bombs released',
  '에리히 뢰벤하르트 · 수직 상승 사격': 'Erich Loewenhardt · Rising Strike',
  '열차 객차 파괴 · 기관차 방호 약화': 'Carriage destroyed · locomotive armour weakened',
  '이탈 구역 개방 · 녹색 원으로 복귀': 'Exit zone open · return to the green ring',
  '작전 실패': 'Mission failed',
  '재장전': 'Reloading',
  '재장전 완료': 'Reloaded',
  '적 비행선 강습': 'Enemy airship raid',
  '적 함대 접근 · 함선의 대공 탄막을 피하세요': 'Enemy fleet closing · avoid the ships’ flak',
  '전방 수리 보급품!': 'Repair supplies ahead!',
  '전선 보급 · 탄띠 보충': 'Front-line supply · ammo belts refilled',
  '전술 개조': 'Field modification',
  '제임스 맥커든 · 현장 수리': 'James McCudden · Field Repair',
  '카이저의 안개 · 적 추적 해제': 'Kaiser’s fog · enemy lock broken',
  '쿠르트 볼프 · 붐 앤 줌': 'Kurt Wolff · Boom and Zoom',
  '태양을 등진 사냥꾼': 'Hunter with the Sun at His Back',
  '포격 개시': 'Barrage begins',
  '포격 예고 — 이동 포격선 접근': 'Barrage warning — creeping fire line approaching',
  '포대 격제 사격 — 낙하지점을 피하세요': 'Battery crossfire — avoid the impact markers',
  '폭격 종료 · 탄약 소진, 재장전 필요': 'Bombing run over · out of ammo, reload needed',
  '폭격 투하! 붉은 표적을 벗어나세요': 'Bombs away! Get out of the red target',
  '폭격 편대 통과': 'Bomber formation passing',
  '퐁크 조준선 · 옆으로 선회하세요': 'Fonck’s sightline · turn out of it',
  '함대 교차 해역 — 양측 대공 화망이 교차합니다': 'Fleet crossfire — flak from both flanks',
  '항구요새 탄약고 유폭 · 중앙 회전축 방호 약화': 'Harbour fort magazine blown · central pivot armour weakened',
  '후방 확보 · 추격 가속': 'Rear secured · pursuit surge',
  '기습! 고속 추격 편대 ': 'Ambush! Fast pursuit flight',
  '제2파 · 추격기 접근': 'Wave 2 · pursuers inbound',
  '제3파 · 전선 돌파': 'Wave 3 · front breakthrough',
};
const PREFIX = [
  ['SPOTTED — 관측망에 포착됐습니다 · 대공포 연사 강화 10초', 'SPOTTED — the spotting net has you · flak rate up for 10s'],
  ['지역 보스 출현! · ', 'Area boss! · '],
  ['지역 작전 — ', 'Area operation — '],
  ['적 에이스 · ', 'Enemy ace · '],
  ['연쇄 끊김 ', 'Chain broken '],
];
export function eventTextEN(text) {
  if (typeof text !== 'string' || !/[가-힣]/.test(text)) return text;
  if (EXACT[text]) return EXACT[text];
  for (const [ko, en] of PREFIX) if (text.startsWith(ko)) return en + text.slice(ko.length);
  return text;
}
export function installEventTextEN(...classes) {
  for (const C of classes) {
    const P = C?.prototype; if (!P || typeof P.event !== 'function' || P.event.__en) continue;
    const orig = P.event;
    const wrapped = function (type, text, ...rest) { return orig.call(this, type, getLocale() === 'en' ? eventTextEN(text) : text, ...rest); };
    wrapped.__en = true; P.event = wrapped;
  }
}
