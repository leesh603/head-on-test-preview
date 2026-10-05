# 탄체·비행 표현 적용

기준: leesh603/head-on-test-preview main `bbc51492b13f67d2141b613bba8fe915292b2549`.
브랜치: `feat/ordnance-body-flight`. main 병합·본섭 배포 없음.

사용자가 확인한 시안에서 BODY와 FLIGHT만 투명 아틀라스로 분리했다. 모터카농, COW, 일반 포탄, 폭탄, 수류탄 5종 × 2표현. 기존 명중·폭발·소멸 그림과 처리, 이동·피해·충돌 수치는 수정하지 않았다.

공용 `fx` 렌더 경로로 솔로/협동, 함선 교전, 보스 포탄, 폭격기의 폭탄에 연결했다. 모터카농과 COW는 전용 키로 분리해 일반 중포탄과 구분한다. 수류탄은 비행 중에만 항적 그림을 쓰고 착지·도화선 단계에는 본체만 표시한다. 열차포는 우향 원본에 맞춰 기존 중복 90도 회전을 제거했다.

항적의 여백은 탄체 표시 크기에 포함하지 않는다. 실측한 탄체 중심을 회전·배치 기준으로 삼아 탄 위치가 뒤로 밀리는 문제를 막는다. 새 아틀라스 로드 실패 시 기존 에셋 경로가 남아 있으며 `?fx=0` 및 기존 모터카농/COW의 `?fx3=0` 되돌림 경로를 유지한다. 프레임마다 픽셀 스캔·캔버스 생성·이미지 할당은 없다.

## 수정 파일

- `fx-art.js`: 사전 로드와 본체/비행 그림 연결. 폭발·연기 키는 기존 경로 그대로.
- `projectiles.js`: 모터카농/COW 구분과 열차포 방향 교정.
- `weapon-effects156.js`: 수류탄 비행/착지 상태의 그림 선택만 변경.
- `ordnance-art.js`, `ordnance-atlas.js`, `fx-ordnance-body-flight.webp`: 공용 렌더, 실측 프레임/탄체 중심, 무손실 투명 아틀라스.
- `tools/pack-ordnance-atlas.py`, `tools/qa-ordnance.mjs`, `tests/ordnance-art.test.mjs`: 포장, 실제 렌더 비교, 폭발 키 비대상·회전 기준 검증.
- `qa/ordnance/`: 실제 표시 크기/4배 확대 비교, QA 결과, 전체 테스트 로그.

## 검증

- `node --test tests/*.test.mjs`: 490/490 통과, 실패·스킵 0.
- 수정 JS 및 QA 도구 문법 검사, `git diff --check` 통과.
- 네이티브 Skia에서 실제 `drawCannonProjectile`, `drawGrenade`, `fx` 함수로 5종 × 4방향 × 육지/바다 배경을 렌더. 새 에셋 누락 0, 렌더 전후 게임 엔티티 상태 동일.
- `qa/ordnance/runtime-scale.webp` 직접 확인: 실제 표시 크기와 확대본, 탄체 중심 및 항적 여백 확인.
- 브라우저 실제 플레이 및 모바일 성능은 미검증. 비교 화면은 네이티브 렌더 검증이며 라이브 플레이 스크린샷이 아니다.

재현: `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-ordnance.mjs`.

## 이미지 제작

내장 이미지 생성 도구로 승인된 비교판을 편집했다. 원본 그림에 색 변경이나 새 폭발 그림을 추가하지 않았다. Python은 무손실 형식 변환과 투명 영역 측정에만 사용했다.

제작 프롬프트: Edit the approved fictional 2D arcade game graphics review into a genuine transparent production SPRITE ATLAS. Keep EXACTLY the five BODY designs in the left column: thin MOTEUR, stubby COW, heavy tapered SHELL, olive BOMB, small segmented GRENADE. Preserve their muted worn metal artwork, thin dark contour, shapes and palette. Keep EXACTLY the five FLIGHT designs in the second column, matching the same five bodies with the approved thin ivory motion streaks or wisps. Do not redesign these approved game objects. Remove all text, all background, all HIT and FADE illustrations completely. No explosion graphics at all. Output ONLY two columns by five rows of ten isolated game sprites on genuine alpha transparency, left BODY and right FLIGHT. Horizontal right-facing orientation preserved, grenade body right-facing small bronze accent, its flight gently rotated as source. Equal row pitch, generous empty transparent gutters between every sprite; no shadow background, no drop shadows, no frame, no labels. Bodies occupy comparable optical widths within left cells; flight bodies EXACT SAME SIZE as corresponding left bodies, extra tail extends left. Every sprite fully inside its cell, no clipping. This is a fictional video game asset edit, not realistic weapon engineering or instructions.
