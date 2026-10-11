# 참호전선 집단 전장 연출

보완 작업 직전 확인한 최신 main: `15564e8d059ce98fc70e2c7deeaa1b1d0af3c5cd`.
작업 브랜치에만 최신 main을 통합했다. 아래 최초 구현 측정 당시 기준은 `49aa69849cb4c3f614ebe7a516ee0aa566f4ffcf`였다.
브랜치: `codex/trench-frontline-groups-20261011`. main 병합 및 배포 없음.

## 범위와 동작

`drawGroundLife`의 `key === 'trenches'` 분기만 새 연출을 사용한다. 기존 지형, 충돌, 피해, 가스, 공중전 및 다른 맵의 경로는 그대로다.

1254px 기존 참호 마스터에 6개 구간을 배치했다. 서부·중앙·남서부는 6~8명 돌격조가 사격 → 전진 → 엄폐 → 재전진 → 산개/포복 → 후퇴한다. 동부·동남부·남부는 6~8명의 방어조가 응사하고 포격 시 엄폐하며 진지를 교대한다. 각 구간에는 3명 기관총 팀과 탄약 운반조, 예비병 또는 들것반이 붙는다. 기존 야포에는 3명 포반이 붙으며 발포 후 서부 돌격조 전방에 포탄이 떨어진다.

포탄은 짧은 흙·화염 섬광에서 먼지와 잔류 연기로 이어진다. 2곳의 파손 진지 화재, 끊어진 철조망, 파괴된 흙벽·목재, 전사자와 루프 중 발생한 부상/전사 표현을 묶었다. 병력 수나 무작위 착탄 수만 늘리는 방식은 사용하지 않는다.

## 밀도 보완

6개 교전 구간의 양옆 약 250px에 무너진 방어선과 끊어진 철조망을 연장하고, 후방에 탄약 적재물을 묶었다. 기존 정적 소품까지 1024×1024 투명 Canvas 한 장(픽셀 버퍼 4 MiB)에 최초 1회만 굽고 타일마다 재사용한다. 화면 이동으로 캐시가 늘어나지 않는다. 보완 과정에서 새 이미지나 다운로드 자산은 추가하지 않았다.

각 구간의 전방과 측면에 총 18개 포연 위치를 설계했다. 화면 내 넓은 포연은 PC 14개 / 모바일 7개까지이며, 그중 파손 진지의 잔불은 PC 4곳 / 모바일 2곳까지 추가한다. 기존 2곳 진지 화재와 착탄 연출은 유지한다. 포연은 기존의 타이트하게 잘라 캐시한 FX 이미지 한 번씩으로 표현하고, 위치와 크기는 PC 12Hz / 모바일 8Hz로 샘플링한다. 추가 파티클 풀, 개별 AI, 실시간 필터는 없다. 전체 FX 상한과 움직이는 병력 상한은 유지한다.

전후 영상의 보완 전 기준은 첫 구현 커밋 `a9a223521bbc119753e057164b2e7f7dd45f7d04`다. QA는 두 지상 모듈을 함께 이 커밋으로 고정하므로 새 포연이 비교 전 영상에 섞이지 않는다. 앱/엔진은 양쪽 모두 최신 기준 main을 사용한다.

보완 후 확인: 관련 테스트 10개와 수정 JS 문법 검사 통과, 다른 8개 맵 × 밀도 2종의 지상 레이어 픽셀 16개가 최신 main과 동일했다. PC 약 36초 녹화의 지상 렌더 p95는 보완 전 0.80ms / 보완 후 0.70ms, 모바일 60초 실행은 보완 전후 0.40ms였다. 전체 프레임 간격 p95는 모두 16.8ms다. 측정 오차 범위의 차이를 성능 향상으로 단정하지 않는다. 각 실행에서 캐시는 1회 생성되었고 브라우저 오류는 없었다. 전체 테스트 및 공개 서버 플레이는 이번 밀도 보완에서 재실행하지 않았다. 변경본은 미배포이며 실물 휴대폰 성능은 미확인이다.

## 비용 제한

- 화면 내 최대 6개 구간 / 96명, 모바일 최대 3개 구간 / 48명. 인원 제한 때문에 실제 최대 구간 수는 줄어들 수 있다.
- FX 이미지 최대 48회 / 모바일 24회. 기존 탱크 1대 경로 유지.
- 중앙 병력 자세 24Hz, 주변부 12Hz 샘플링. 위치는 게임 시간에서 재구성하며 개별 AI, 엔티티, 파티클 풀, 게임 RNG 소비 없음.
- 가시 후보 캐시는 최대 54개이고 이동 이력을 쌓지 않는다. 보병 명암과 지원 소품은 최초 1회만 굽는다. 실시간 필터, shadowBlur, 픽셀 읽기 없음.
- 새 지원 아틀라스는 참호전선에 들어갈 때만 로드한다. WebP 216,098 bytes.

## 최초 구현 확인 결과 (밀도 보완 전)

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
