// Read-only catalog report. Never registers aircraft, replaces art or changes a save.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {AIRCRAFT_MASTER, PILOT_AIRCRAFT, getAircraftRegistration} from '../dist/aircraft-master.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');
const engineRef = source => source.match(/from\s*['"](\.\/engine\.js[^'"]*)['"]/)[1];
const core = await import(new URL('../dist/' + engineRef(read('app.js')).replace(/^\.\//, ''), import.meta.url));
await import('../dist/campaign.js');
const expanded = await import(new URL('../dist/' + engineRef(read('campaign.js')).replace(/^\.\//, ''), import.meta.url));
const entries = Object.values(AIRCRAFT_MASTER);
const summary = {
  identities: entries.length,
  basic: entries.filter(a => a.category === 'basic').length,
  exclusive: entries.filter(a => a.category === 'exclusive').length,
  pilotAssociations: Object.keys(PILOT_AIRCRAFT).length,
  appRegistryFits: Object.getOwnPropertyNames(core.PLANES).length,
  campaignRegistryFits: Object.getOwnPropertyNames(expanded.PLANES).length,
};
const escaped = value => String(value ?? '—').replaceAll('|', '\\|');
const registration = (id, planes) => {
  const state = getAircraftRegistration(id, planes);
  return state?.registered ? (state.campaignOnly ? '등록·campaignOnly' : '등록') : '미등록';
};
const lines = [
  '# HEAD-ON 항공기 마스터 — 데이터·명칭 전용', '',
  `기준 main: \`${process.argv[2] || '실행 시점의 체크아웃'}\``, '',
  '이미지·초상화·효과·렌더링·전투·스킬·선택 로직을 변경하지 않는 메타데이터입니다.',
  '기본기/전용기를 주 분류로 두고 캠페인·복좌·수상·보스 등은 독립 태그로 기록합니다.',
  '목록에 있다는 것, PLANES에 등록됐다는 것, 실제 선택/플레이가 가능하다는 것은 서로 다릅니다.', '',
  `식별 항목 **${summary.identities}개**: 기본형 ${summary.basic}개 / 전용형 ${summary.exclusive}개. 파일럿 연결 ${summary.pilotAssociations}개.`,
  `현재 앱 엔진 레지스트리 ${summary.appRegistryFits}개, 캠페인 확장 레지스트리 ${summary.campaignRegistryFits}개.`,
  '이 개수는 고유 역사 기종 수나 플레이어블 기체 수가 아닙니다. 공유 fit의 전용 정체성, 캠페인 별도 ID와 특수 항공체를 포함합니다.', '',
  '## 보존 경계', '',
  '- `aircraft-master.js`에는 이미지 경로·스프라이트 키·FX·크기·좌표·전투 수치가 없습니다.',
  '- `PLANES`, `WEAPONS`, `PILOTS`, `PILOT_PLANES` 및 실제 선택 ID는 기존 구현을 그대로 사용합니다.',
  '- `baseAirframeId`는 기존 게임의 기본 fit 연결입니다. Fokker F.I처럼 표시 기종이 다르더라도 공유 전투 fit을 재설계하지 않습니다.',
  core.PLANES === expanded.PLANES ? '- 현재 앱과 캠페인은 같은 엔진 레지스트리를 공유합니다. 기존 등록·선택·활성화 정책은 이 데이터 작업에서 변경하지 않습니다.' : '- 앱과 캠페인의 엔진 참조가 분리되어 있어 각각의 실제 등록 상태를 표시합니다. 이 데이터 작업에서는 등록·선택·활성화 정책을 변경하지 않습니다.',
  '- 전장기록 기존 49개 기체 카드와 27명 파일럿 및 모든 이미지/성능/무장/설명은 유지하고 기체 이름과 분류 문구만 적용합니다.',
  '- main 병합과 Site 배포는 이 보고서 생성 작업에 포함되지 않습니다.', '',
  '## 항공기 마스터', '',
  '| ID | 표시명 | 분류·태그 | 기본 fit | 앱 등록 | 캠페인 등록 |',
  '|---|---|---|---|---|---|',
];
for (const a of entries) lines.push(`| \`${a.aircraftId}\` | ${escaped(a.displayNameKo)} | ${a.category === 'exclusive' ? '전용기' : '기본기'}${a.tags.length ? ' · '+a.tags.join(', ') : ''} | \`${a.baseAirframeId}\` | ${registration(a.aircraftId, core.PLANES)} | ${registration(a.aircraftId, expanded.PLANES)} |`);
lines.push('', '## 파일럿 ↔ 기체 연결 (설명용, 실제 탑승 ID를 변경하지 않음)', '',
  '| 파일럿 ID | 현재 파일럿명 | 기본 식별 ID | 대체 식별 ID | 앱 등록 | 캠페인 등록 |',
  '|---|---|---|---|---|---|');
for (const p of Object.values(PILOT_AIRCRAFT)) lines.push(`| \`${p.pilotId}\` | ${escaped(core.PILOTS[p.pilotId]?.name)} | \`${p.defaultAircraftId}\` | ${p.alternateAircraftIds.map(id=>'`'+id+'`').join(', ') || '—'} | ${registration(p.defaultAircraftId, core.PLANES)} | ${registration(p.defaultAircraftId, expanded.PLANES)} |`);
lines.push('', '## 재생성', '',
  '`node scripts/report-aircraft-master.mjs <검증한 기준-SHA>`', '',
  '테스트: `node --test tests/aircraft-master-data.test.mjs`', '');
fs.writeFileSync(path.join(root, 'docs/AIRCRAFT_MASTER_DATA.md'), lines.join('\n'));
console.log(JSON.stringify(summary, null, 2));
