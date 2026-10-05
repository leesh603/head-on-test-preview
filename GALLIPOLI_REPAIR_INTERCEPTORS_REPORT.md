# 갈리폴리 포탑 선회·수리·요격기 개편

기준: `leesh603/head-on-test-preview` main `ac3463cd47fc212e4cc0a1b088a0eeda65017c07` (2026-10-05). 작업 브랜치: `feat/gallipoli-repair-interceptors`. main 병합 및 본섭 배포 없음.

## 변경

- 중포·대공포·중앙포가 제한된 각속도로 실제 선회하고 조준 완료 후 포구에서 발사한다. 공격 예고 위치는 조준 중 고정되며 발사 이후에도 기존 회피 경고 시간이 유지된다.
- 5초 등장 연출 이후 중앙 지휘포대를 처음부터 공격할 수 있다. 진지 점령 순서와 공격 잠금 조건을 제거했다.
- 중앙이 살아 있는 동안 파괴된 구역 설치물은 18초 후 완전 수리된다. 마지막 3초에 경고 링·카운트다운을 표시하고 재가동 직후 2초간 공격을 유예한다. 진지 무력화 표시는 수리되면 해제된다.
- 중앙 파괴 시 수리와 새 요격기 출격을 중단한다. 남아 있는 중포·대공포를 개별 파괴하면 전투가 종료된다. 잔여 보급·관측 시설은 이때 정리된다. 이미 출격한 기체는 계속 전투한다.
- 고정 격납고 한 곳에서 첫 출격 후 8초 간격으로 최대 4기까지 요격기를 증원한다. 요새 진영 기준 동맹국은 아인데커, 협상국은 니외포르 11이다. 실제 엔진의 기체·탄환·추적 AI를 사용하며 1.2초 직선 이륙 이후 교전한다.
- 기존 고품질 요새 아틀라스와 마안 격납고·기체 에셋을 재사용했다. 맵 폭·요새 규모는 유지했다. 한국어 전술 안내와 상태 메시지를 갱신했다.
- 해당 모듈 캐시 참조만 갱신했다. 공통 Game/PLANES 모듈 인스턴스가 갈라지지 않도록 engine/coop-engine의 기존 공통 참조는 유지했다.

## 검증

- `node --test tests/*.test.mjs`: **382/382 통과**. 갈리폴리 16개 테스트: 즉시 중앙 공격, 자유 파괴 순서, 반복 수리 HP 상한, 수리 예고·유예, 조준 속도와 정렬 후 발사, 파괴된 발사 계획 취소, 진영별 고정 출격점·동시 수 제한, 일시정지, 전투 종료.
- `tools/qa-gallipoli-engine.mjs`: 솔로/협동 × 양 진영 × 390/1440 폭, **8/8 통과**. 각 60초 시뮬레이션에서 7회 출격과 수리 확인. 중앙 먼저 파괴한 뒤 추가 20초에 수리·출격 중단 확인, 잔여 포대 파괴 후 네이티브 보스 종료 확인. 최대 동시 포격 hazard 5, 누락 0.
- `tools/qa-gallipoli-render.mjs`: 실제 게임 렌더러로 PC/모바일 양 진영, 파괴·수리 예고·수리 완료·중앙 파괴·격납고 출격·전체 요새 화면 생성. 에셋 누락 0, hazard 누락 0. CPU 캔버스 측정은 브라우저 FPS와 다르다.
- 루트 JavaScript 구문 검사 및 `git diff --check` 통과.
- 브라우저 확인: 구현 커밋 `20edb31296dc02aa2fd51f0c6e4be4cc7d744990`의 raw.githack 미리보기에서 요새·격납고·한국어 안내 표시, 등장 경고 종료, HUD 시간 00:00→00:02 진행, 일시정지·계속하기 동작을 확인했다. 공통 aircraft/portraits/equipment/battlefield-art 이미지 로더에서 cross-origin canvas `getImageData` SecurityError가 발생했고 Test Lab 전역도 설치되지 않아 장시간 전투·모바일 브라우저·실기기 FPS는 **미검증**이다. 공통 로더나 브라우저 보안은 변경하지 않았다. 네이티브 시뮬레이션과 정적 렌더는 실기기 플레이/FPS 검증을 대신하지 않는다.

## 수정 파일

주요 로직/표현: `gallipoli-boss.js`, `gallipoli-view.js`, `stageboss-host.js`, `headon-stageboss-runtime.js`, `boss-feedback.js`.

캐시 참조: `app.js`, `index.html`, `engine.js`, `coop-engine.js`, `coop-view.js`, `stageboss-view.js`, `headon-stageboss-patterns.js`, `headon-stageboss-hud.js`.

테스트/검증: `tests/gallipoli-stage.test.mjs`, `tools/qa-gallipoli-engine.mjs`, `tools/qa-gallipoli-render.mjs`, `qa/gallipoli/*` 변경 이미지 및 JSON.

등장 이미지: `gallipoli-fortress-cut-in.webp`. 보고서: 이 파일.
