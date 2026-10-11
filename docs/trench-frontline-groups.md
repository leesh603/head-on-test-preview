# 참호전선 집단 전장 연출

기준 main: `49aa69849cb4c3f614ebe7a516ee0aa566f4ffcf`.
처음 조회한 `068124e61fd34eb6ffe655bc4bed1ba2f487194c` 이후 main 갱신을 확인했고, 별도 작업 브랜치를 위 SHA로 맞췄다. 추가된 main 변경은 항공기 에셋 뱅크였다.
브랜치: `codex/trench-frontline-groups-20261011`. main 병합 및 배포 없음.

## 범위와 동작

`drawGroundLife`의 `key === 'trenches'` 분기만 새 연출을 사용한다. 기존 지형, 충돌, 피해, 가스, 공중전 및 다른 맵의 경로는 그대로다.

1254px 기존 참호 마스터에 6개 구간을 배치했다. 서부·중앙·남서부는 6~8명 돌격조가 사격 → 전진 → 엄폐 → 재전진 → 산개/포복 → 후퇴한다. 동부·동남부·남부는 6~8명의 방어조가 응사하고 포격 시 엄폐하며 진지를 교대한다. 각 구간에는 3명 기관총 팀과 탄약 운반조, 예비병 또는 들것반이 붙는다. 기존 야포에는 3명 포반이 붙으며 발포 후 서부 돌격조 전방에 포탄이 떨어진다.

포탄은 짧은 흙·화염 섬광에서 먼지와 잔류 연기로 이어진다. 2곳의 파손 진지 화재, 끊어진 철조망, 파괴된 흙벽·목재, 전사자와 루프 중 발생한 부상/전사 표현을 묶었다. 병력 수나 무작위 착탄 수만 늘리는 방식은 사용하지 않는다.

## 비용 제한

- 화면 내 최대 6개 구간 / 96명, 모바일 최대 3개 구간 / 48명. 인원 제한 때문에 실제 최대 구간 수는 줄어들 수 있다.
- FX 이미지 최대 48회 / 모바일 24회, 지속 화재 최대 2곳. 기존 탱크 1대 경로 유지.
- 중앙 병력 자세 24Hz, 주변부 12Hz 샘플링. 위치는 게임 시간에서 재구성하며 개별 AI, 엔티티, 파티클 풀, 게임 RNG 소비 없음.
- 가시 후보 캐시는 최대 54개이고 이동 이력을 쌓지 않는다. 보병 명암과 지원 소품은 최초 1회만 굽는다. 실시간 필터, shadowBlur, 픽셀 읽기 없음.
- 새 지원 아틀라스는 참호전선에 들어갈 때만 로드한다. WebP 216,098 bytes.

## 확인 결과

- 관련 테스트 10개 통과. 전체 테스트 1,130개 중 1,127개 통과.
- 전체 테스트의 기존 실패 3개는 수정 전 원본에서도 재현: `aircraft-tiers.test.mjs`, `pilot-five-combat.test.mjs`, `player-effects-import.test.mjs`.
- 빌드 검사: 207개 JS 문법 검사 통과. 기존 갤러리 파일 참조 문제 7건 때문에 전체 validate는 실패한다. `make-gallery.js`의 동적 문자열과 `asset-gallery.html`의 누락된 보스 이미지 6개이며 이번 변경 파일과 무관하다.
- 다른 지형 8개 × density 2종, 총 16개 지상 레이어 픽셀 비교 동일. 읽기용 Canvas는 `willReadFrequently`로 CPU 경로를 고정해 GPU 읽기 전환 시 반올림 차이를 제거했다.
- 1280×900 실제 게임 비교 녹화: 기존 지상 렌더 p95 0.30ms, 최종 변경 후 0.60ms. 전체 rAF 간격 p95는 두 버전 모두 16.8ms. 영상 인코딩을 포함한 동일 PC 측정이다.
- 390×844 터치 에뮬레이션: 변경 후 60초 연속 실행, 지상 렌더 p95 0.40ms, rAF p95 16.8ms. 브라우저 런타임 오류 없음.
- 공개 GitHub Pages 테스트 서버 현재판에서도 약 21초 native game loop 실행 확인. `version.txt`는 `bomb4`; `test-build.json`은 과거 previewBase를 가리켜 실제 배포 SHA 증명에는 사용하지 않았다.
- 변경 브랜치는 배포하지 않았다. 물리 모바일 기기의 발열, 배터리, 장시간 프레임 성능과 변경본의 공개 서버 실행은 미확인이다.

## 재현

로컬 HTTP 서버로 저장소를 제공한 뒤 `tools/qa-trench-frontline.mjs` 실행. `PLAYWRIGHT_MODULE`, `CHROME_PATH`, `QA_URL`, `QA_OUTPUT`으로 환경 지정. 기본은 전후 desktop 영상, `QA_ONLY=mobile`은 60초 모바일 실행, `regression`은 다른 맵 픽셀 비교, `live`는 기존 공개 서버 실행, `after`는 최종 desktop 영상이다. baseline은 `QA_BASE`로 고정하며 기본값은 위 main SHA다.

영상은 실제 Canvas의 MediaRecorder 출력이다. Test Lab의 무적과 일정한 선회 입력을 사용하고 강화 선택창의 정지만 비활성화한다. 공중 적기·총탄·위험물·native update/render는 유지한다. 사전 렌더 영화나 별도 장면 모형이 아니다. 병력, 탱크, 군수품 렌더는 실제 게임 내 모듈이다.

## 지원 아틀라스 제작

`trench-support-20261011.webp`: 내장 imagegen으로 투명 배경 생성 후 WebP 형식 변환. 기존 `ground-life-20261011.webp`와 FX는 재사용하며 수정하지 않았다.

생성 프롬프트:

> Use case: historical-scene. Asset: one production sprite atlas for HEAD-ON WWI overhead aerial combat ground scenery. Generate a square transparent 2 by 2 atlas with four isolated painted cutouts centered separately in equal quadrants, generous transparent margins, no grid or text. Strict orthographic 90 degree top down view, subdued muddy khaki, weathered brown wood, muted gray metal, restrained painterly realistic textures matching a gritty WWI map. Top left: two British WWI helmeted stretcher bearers carrying a canvas stretcher with a fully clothed casualty, all moving upward, viewed from directly above, legs and arms anatomically clear; no blood. Top right: a wooden ammunition crate with handles, isolated, long axis horizontal. Bottom left: a broken section of sandbag parapet and splintered duckboards around a shell hole, no background terrain, elongated horizontal footprint. Bottom right: low entangled rusty barbed wire between snapped wooden posts with a clear breach in the middle, horizontal footprint. No modern gear, no cartoon outlines, no bright highlights, no 3d isometric angle, no fake transparency/checkerboard, actual transparent alpha. Designed to remain legible scaled down to 20-65 pixels in game; each group is complete and separated.
