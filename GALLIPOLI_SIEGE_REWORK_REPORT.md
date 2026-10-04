# 갈리폴리 대요새 점령전 리워크 r2

기준: `leesh603/head-on-test-preview` main `31170dff4c1fb8d6aeaee12b39a21dff52df955c` (perf539).
작업 브랜치: `feat/gallipoli-siege-rework`. main 병합 및 배포 없음.

## 플레이 변경
- 가로 경계 1,640 → 7,200. 후방/복귀 경계도 -1,500~15,500으로 확대. 협동 양 플레이어에 동일 적용.
- 기존 소형 710폭 요새 → 3,280×2,600 방어영역의 고정 복합 요새. 서부/동부 포대와 후방 성채, 중앙 지휘포대 및 정문 연결.
- 중포 6문 + 중앙 쌍열 지휘포 1문 + 대공포 3문. 쌍열 해안포/공성 곡사포/대공포가 각기 다른 실루엣.
- 파괴 가능 시설 13개: 중포 6, 대공포 3, 탄약고 3, 관측소 1. 구역의 중포 2문과 AA를 모두 파괴하면 점령. 아군 깃발로 전환하며 해당 포격 취소. 탄약고 폭파는 해당 중포 두 문에 35% 유폭 피해 및 연사 감소.
- 양익 점령 후 후방 성채 공략, 세 구역 점령 완료 시 중앙 지휘포대 개방. 체력 75%는 시설, 최종 25%는 지휘포대에 배분. 시설 실제 피해를 한 번씩 전체 HP에 반영.
- 최다 두 중포 + 한 AA 동시 포격, 최대 5개 낙탄 경고. 160폭 회피 통로, 좌표 고정 경고, 포격 창 직렬화로 고회차 중첩 방지.
- 현재 미점령 무장 위치로 안내. 구역 점령 한국어 알림/보스 힌트. 기존 한국어 UI 유지.

## 자산 및 지형
Built-in imagegen으로 6개 신규 WebP 제작, 품질 95. 원본 알파 보존; 단순 벡터/도형으로 대체하지 않음.
- `gallipoli-siege-guns.webp`: 쌍열포/곡사포/AA × 정상/손상/파괴.
- `gallipoli-siege-facilities.webp`: 지휘부/탄약고/관측시설 × 3상태.
- `gallipoli-siege-bases.webp`: 성벽/포좌/정문·참호 × 3상태.
- `gallipoli-siege-star.webp`, `gallipoli-siege-wing.webp`: 대형 바닥의 확대 흐림을 줄인 개별 고해상도 요새 에셋.
- `gallipoli-siege-ground.webp`: 갈리폴리 전용 암석·마른 초지. 디코딩 시 한 번 주기 경계 정규화. 기존 해안/바다는 월드 좌표로 연결.
- 전선 곳곳의 참호, 탄약시설, 관측시설 배치. 기존 진영 오버레이 재사용, 새 보스 컷인 게임 렌더러 합성.
- `gallipoli540` 모듈/자산 핀: 캐시 때문에 이전 갈리폴리가 재사용되지 않도록 변경된 의존 경로 갱신.

### 생성 프롬프트 요약 (built-in)
1. Strict 90-degree overhead transparent 3×3 WW1 artillery atlas: twin coastal gun / siege howitzer / paired AA, full barrels; intact/damaged/wrecked columns; no labels/flags/smoke.
2. Transparent 3×3 command bunker / ammunition depot / signal post, same footprint across three damage states, dark muted masonry and steel.
3. Transparent 3×3 star fort / three-slot bastion / gate-trench foundations, three states, engineered masonry with empty gun plates.
4. Seamless overhead Gallipoli chalk earth, limestone gravel, sparse olive scrub, no grid/edge-crossing roads/buildings; opaque terrain.
5. Single high-detail overhead star fort foundation, 90% frame, empty courtyard, real transparency.
6. Single high-detail oval battery bastion, three aligned empty mounting plates, overhead masonry and contact shadows, real transparency.

## 검증
- `node --test tests/*.test.mjs`: 376/376 통과.
- 루트 JavaScript 146개 syntax 확인, 정적 모듈 참조 320개 누락 없음.
- `tools/qa-gallipoli-engine.mjs`: 1인/협동 × 양 진영 × 390/1440 총 8개, 각 60초. 실제 Game/CoopGame 및 host collision/damage 경로 사용. 일시정지 정지, 최대 hazard 5, pool dropped 0, 세 구역 점령/중앙 격파 성공. 자동 엔진 검증이며 실제 입력 플레이/브라우저 FPS와 구분.
- `tools/qa-gallipoli-render.mjs`: 실제 맵/보스/낙탄 렌더러 Skia PC/mobile 및 전체 전경 확인. 자산 누락 없음. CPU 렌더+readback 측정은 `qa/gallipoli/render-metrics.json`, 실제 기기 FPS 아님.
- `qa/gallipoli/alpha-check.json`: 투명 에셋 알파/모서리 확인, 밝은 불투명 붉은 잔여 픽셀 0. 지면은 완전 불투명.
- 브라우저 확인: 브랜치 업로드 후 별도 기록. 자동 렌더 결과를 브라우저 실플레이 통과로 표기하지 않음.

## 수정 범위
게임 동작: gallipoli-boss.js / gallipoli-route.js / gallipoli-view.js / stageboss-host.js / stageboss-view.js / boss-feedback.js / headon-stageboss-patterns.js / app.js.
캐시 의존 핀: index.html / engine.js / coop-engine.js / coop-view.js / headon-stageboss-runtime.js / headon-stageboss-hud.js.
자산: 신규 gallipoli-siege-*.webp 6개, gallipoli-fortress-cut-in.webp.
검증: tests/gallipoli-stage.test.mjs / tools/qa-gallipoli-{engine,render}.mjs / qa/gallipoli.

공통 비행·조종·파일럿·증강·랭킹·저장 동작의 로직 변경 없음. source 리포의 뒤처진 브랜치는 사용하지 않음.
