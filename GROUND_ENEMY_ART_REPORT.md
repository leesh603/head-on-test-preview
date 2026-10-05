# 지상 잡몹 아트 리워크

기준: leesh603/head-on-test-preview main `01243221a8abe3fbdfb09e9cb046b228f980cf7e`.
작업 브랜치: `feat/ground-enemy-art`. main 병합 및 본섭 배포 없음.

## 적용 범위

- 양 진영 각각 대공포좌, 이동 대공전차, 일반 임무 전차, 열차포, 탐조등 진지, 쌍열 기관총 진지.
- 4개 무손실 WebP 아틀라스: 정상·손상·파괴 차체 36개, 독립 회전 포신 6개. 새 그림의 재질과 명암을 기존 장갑 보스에 맞춤.
- 협상국 전차는 긴 마름모 궤도·측면 포좌·탈출용 목재 빔, 동맹국은 짧은 장갑 차체·밀집 환기구로 구분. 표시 문양이나 색 변경만으로 구분하지 않음.
- 실제 렌더 연결: 솔로·협동의 호위 대공전차/열차포/일반 탄막 진지, 캠페인의 적 전차/포대와 아군 전차, 도심 및 런던의 일반 탐조등·대공포.
- 회전 포신은 기존 gunAim/fieldSalvoAim/cityShot을 사용. 런던 포대는 기존 조명 표적을 바라보는 렌더 방향만 계산. 차체 장착 위치와 회전축을 분리.
- 기존 HP가 55% 미만이면 손상 그림 표시. 파괴 그림은 hp<=0 또는 명시적 artState=2 렌더에 제공하며, 기존 사망 제거 시점은 그대로 유지.
- 항공기·관측기구·보스 본체, 전투 수치·충돌 범위·출현/사격 AI는 수정하지 않음. 한국어 UI 문구 유지.

## 수정 파일

`app.js`, `coop-view.js`, `campaign-view.js`, `city-air1.js`, `london-art.js`, `battlefield-art.js`: 기존 지상 유닛의 새 그림 연결 및 사전 로드.

`ground-enemy-art.js`, `ground-enemy-atlas.js`: 진영/종류/상태별 아틀라스 선택, 실측 투명 경계, 차체·포신 렌더.

`ground-{entente,central}-{vehicles,defenses}.webp`: 신규 아트 4개.

`tests/ground-enemy-art.test.mjs`, `tools/pack-ground-atlas.py`, `tools/qa-ground-enemies.mjs`: 종류 매핑·상태 완전성·독립 회전 검증, 무손실 포장 및 실제 렌더 비교.

`qa/ground-enemies/`: 비교 화면, 회전 화면, 테스트 로그 및 QA 결과. `GROUND_ENEMY_ART_PROMPTS.md`: 제작 프롬프트.

## 검증 결과

- `node --test tests/*.test.mjs`: **483/483 통과**, 실패·스킵 0.
- 수정한 JavaScript 9개 문법 검사 및 `git diff --check` 통과.
- 네이티브 Skia에서 게임이 사용하는 `drawGroundEnemy`로 양 진영 36개 차체 상태 및 12개 독립 차체/포신 각도 렌더. 에셋 누락 0.
- 비교/회전 화면 직접 확인: 진영 실루엣 차이, 손상 상태, 투명 여백 및 장착 위치 확인. 픽셀 스캔은 포장 도구에서만 실행하며 매 프레임 실행하지 않음.
- 브라우저 실제 플레이·모바일 성능 검증은 수행하지 않음. 자동 테스트와 네이티브 렌더 결과를 브라우저 검증으로 간주하지 않음.

재현: `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-ground-enemies.mjs`.
