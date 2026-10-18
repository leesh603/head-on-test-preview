# 1페이지 열차포 디테일 리워크

기준: `leesh603/head-on-test-preview` main `4c0bdbe0c1f7ec69189fa8411c3ef37c9a5fef2e` (imm3). 브랜치: `feat/rail-artillery-detail`. main 병합 및 본섭 배포 없음.

## 동작

- 브루노: 기존 5발 순차 포격마다 개별 발사·섬광·포신 후퇴·빠른 복좌. 이전에는 한 번만 섬광이 발생했다.
- 랑콩파라블: 520mm 단발 초중포의 큰 후퇴와 느린 복좌. 차체 좌표를 순간 이동시키던 기존 55px 반동 대신, 차대 내부의 작은 충격과 포신 35px 후퇴로 표현한다.
- 주포는 레일 포가 허용하는 작은 각도만 움직인다. 조준 시 확정한 방향을 유지하며 공격 중 플레이어를 계속 추적하지 않는다.
- 고정 차대와 움직이는 포신·폐쇄기 분리. 제동 때 연결된 객차에 작은 시간차의 충격, 포격 때 차대와 객차의 감쇠 진동(브루노 화면 흔들림 2.8, 초중포 6), 포구 연기와 차륜 주변 먼지.
- 장전 트레이의 기존 포탄 아트 이동. 탄약차 파괴 후 느려진 실제 재장전 시간에 맞춰 늦게 장전한다.
- 기존 객차 순차 파괴, 관측차 조준 중단·맹목 포격, 탄약차 재장전 지연, 레일 파괴·폭주·탈선, HP 예산과 안전한 충격파 안쪽 유지. 고정 레일·분리 잔해는 반동으로 이동시키지 않는다.

## 소리

1페이지 두 보스 등장 시 증기 기적, 기관 배기, 바퀴·레일 접합부 충격과 접근 볼륨을 섞은 `trainApproach` 사용. 이동 속도에 맞춰 바퀴 소리 간격이 바뀌고 제동·장전·각 발사 시 실제 상태 이벤트에서 소리를 낸다. 캉브레 열차는 기존 기적 유지.

실차 녹음 파일은 아니다. `rail-audio.js`에서 물리 재질을 모사한 PCM을 생성하고, 기존 SFX 시스템 안에서 종류별 버퍼를 한 번 생성해 재사용한다. 각 큐는 단일 오디오 소스이며 기존 모바일 24개/PC 44개 상한과 음소거·일시정지 정리 규칙을 지킨다.

## 에셋

기존 정상 차체를 참조해 built-in imagegen으로 2개 분리 시트를 만들고 각 레이어를 투명 무손실 WebP로 포장했다. 수작업 도형이나 임시 스프라이트로 대체하지 않았다.

| 보스 | 차대 | 포신 |
|---|---|---|
| 브루노 | `rail-bruno-chassis-r1.webp` | `rail-bruno-gun-r1.webp` |
| 랑콩파라블 | `rail-lincomparable-chassis-r1.webp` | `rail-lincomparable-gun-r1.webp` |

기존 객차·파괴 에셋과 컷인 유지. 새 레이어 로딩 실패 시 기존 차체 이미지로 대체. 전체 보스 이미지 크기는 기존 390px 높이 안에서 조립한다. 프롬프트: `qa/rail-detail/asset-prompts.json`. 이미지 원본 좌표·투명도: `asset-audit.json`.

## 검증

- `node --test tests/*.test.mjs`: **556/556 통과**, 실패·취소·스킵 0. 기존 테스트에 쓰이는 불변 git 참조 2개도 받아 비교 테스트를 실제 실행했다.
- 열차포 기존 25개 테스트 유지. 추가: 실제 발사 수와 반동/발사음 대응, 반동 종료, 주포 각도 한계, pause, 고정 레일·잔해, 렌더 모델, 장전 지연, 소리 버퍼 재사용/상한/정리 및 PCM 유효성.
- 실제 solo/coop × 양 진영 × 390/1440 폭, 60초씩 8개 호스트 시뮬레이션. 8/8 성공, 공격 풀 최대 8~9개, 누락 0. 레일·객차 파괴 및 pause/cleanup 확인 (`engine-audit.json`).
- PC 1440×900 / 모바일 390×844: 실제 게임 렌더러와 스프라이트를 사용한 Skia 검증. 에셋 누락 0. `*-pc.webp`, `*-mobile.webp`, `*-recoil.webp`, `*-reload.webp`, `*-damage.webp` 및 반동 영상.
- 구문·`git diff --check` 통과.
- 현재 main 라이브 테스트랩에서 PC 열차포전 진입과 원본 장면 확인. **수정 브랜치의 브라우저 실플레이는 별도 검증 상태를 아래에 기록한다.** Skia 이미지·영상과 엔진 시뮬레이션을 실플레이로 간주하지 않는다.

## 수정 파일

구현: `rural-rail-artillery.js`, `rural-rail-combat.js`, `rural-rail-render.js`, `rail-audio.js`, `sfx.js`, `boss-feedback.js`, `headon-stageboss-render.js`, `stageboss-view.js`, `app.js`.

캐시 연결만 갱신: `index.html`, `engine.js`, `coop-engine.js`, `coop-view.js`, `stageboss-host.js`, `headon-stageboss-runtime.js`, `headon-stageboss-patterns.js`. 그 외 게임 규칙 변경 없음.

검증: `tests/rail-artillery-detail.test.mjs`, `tests/combat-voices.test.mjs`, `tools/qa-rail-detail.mjs`, `qa/rail-detail/*`, 이 보고서.

## 브라우저 검증

수정 브랜치 실플레이: **미검증**. 업로드된 구현 커밋 `ecea93b2f217f6657f5088f43d3721e6937ec622`의 raw.githack.com 테스트랩을 실제로 열고 모바일 390×844 보스전 시작을 눌렀다. 테스트 UI와 게임 HUD는 로드됐지만 기존 `icons.js`, `equipment.js`, `aircraft.js`, `battlefield-art.js` 이미지 로더의 Canvas 교차 출처 `getImageData` SecurityError가 발생했다. 오류 없는 PC·모바일 실플레이 통과로 처리하지 않았다. 보안 설정·공통 로더는 변경하지 않았고 main 배포도 하지 않았다. `browser-check.json` 참고.
