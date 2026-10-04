# 갈리폴리 / 다르다넬스 전선 구현

## 기준과 범위

첨부 `HEADON_GALLIPOLI_HANDOFF(1).zip`의 사양과 최종 어두운 아틀라스 시안을 사용했다. 이 대화의 권위 기준인 `leesh603/head-on-test-preview` 최신 main에 통합한다. 최초 기준 `8ffe018f990594743af4b5393c3d21d4842de2b2`(v528)에서 구현하고, 작업 중 추가된 스타일/항공기/전투 변경을 보존하기 위해 `9739b3eaa706484853b32e4058f25333f579f4db`(styles537)에 갈리폴리 변경분만 다시 적용했다. 최신 기준에서 모든 검증을 다시 수행했다.

브랜치 `feature/gallipoli-stage`. main 직접 commit/push/merge와 production 배포는 하지 않는다. 핵심 공중전, 파일럿, 증강, 랭킹, 세이브는 변경하지 않았다. 이전 main의 중복 Ma’an import 제거는 최신 main에 이미 반영되어 있어 최종 diff에는 별도 수정으로 포함되지 않는다.

## 신규 지역 14

기존 지역 ID는 유지하고 마안 뒤에 갈리폴리를 추가했다. 이후 순환에도 포함된다. 해상 → 해안 접근 → 절벽·참호 방어선 → 요새 접근 순서다.

- 전장 진입 위치와 진행 방향으로 월드 좌표축을 한 번 고정한다.
- 누적 비행 거리/90초 타임아웃 대신 실제 전방 좌표가 12000에 도달해야 보스가 활성화된다. 선회만으로 해안이 이동하지 않는다.
- 진행축 6600에 해안, 8500 이후 절벽·참호, 12580에 고정 요새를 배치한다. 횡방향 ±820, 후방 −420, 전방 13800 범위에서 자유 비행한다. 건물에 끼이는 지상 충돌은 추가하지 않았다.
- 보스는 접근 중 같은 위치에 미리 보이고, 실제 전투가 시작되어도 다른 위치로 재생성되지 않는다.
- `asset-bank/terrain/gallipoli_coast.webp`와 기존 `terrain-sea359r2.webp`의 실제 원화를 사용한다. 해안은 전진축에서 한 번만 나타나는 세트피스다. 해안의 수평 경계를 정규화해 혼합하고, 양끝을 페이드하여 기존 바다/내륙 타일과 연결한다. 바다·내륙도 이미지 로드 때 한 번만 반복 타일을 준비한다. 프레임당 getImageData 작업은 없다.
- 한국어 지역명, 단계 진입 메시지, HUD 전술 힌트, Test Lab 지역 목록을 추가했다.

## 요새 보스

공용 보스 ID `gallipoli-fortress`, 적 진영은 플레이어의 반대 진영이다. 중앙 주포와 좌우 해안포를 하나의 연결된 절벽 기단 위에 놓았다. 5초 출현 보호, 고정 월드 위치, 공용 native HP/보상/파괴 시퀀스를 사용한다.

1. **해안 방어선:** 좌우 교차 포격. 좌표를 발사 때 확정하고 1.5초 경고, 중앙 110 단위 회피 통로를 표시한다. 포격 반경 43과 조종사 반경 12를 포함해 통로가 비어 있다.
2. **방어망 붕괴:** 포대/관측소/탄약고 손실로 진입한다. 관측소 파괴 시 경고 2초와 더 넓은 고정 산포. 탄약고 파괴 시 해당 측 포대에 35% 연쇄 피해, 해당 측 포격 2발→1발. 포대 파괴 시 이미 대기 중인 해당 포격도 취소한다. 중앙 체력 55%에서 gate를 두고 최소 3초 유지한다.
3. **중앙 요새:** 좌우 포대가 모두 파괴되거나 중앙 HP 55%에 도달하면 중앙 장벽이 파손되고 주포가 개방된다. 2초 경고의 대형 낙탄 공격. 측면 통로가 표시되는 동안 중앙 포격과 벙커 공격을 겹치지 않는다.

6개 독립 부위: `left`, `right`, `observer`, `ammo-left`, `ammo-right`, `bunker`. 중앙부는 native core hit 경로다. 부위 우선 swept collision으로 한 탄환이 부위와 코어에 중복 피해를 주지 않는다. 정상/손상/파괴 아트가 동일 앵커에서 바뀐다. 그림의 긴 포신을 실제 조준각으로 회전시키고, 그 끝에서 native muzzle cue를 발생시킨다. 중앙 포신이 보급시설에 묻히지 않게 벙커를 후방 측면에 놓았다.

## 에셋과 진영 오버레이

- `gallipoli-fortress-atlas.webp`: 1536×1024 공용 RGBA. 기단 / 긴 포신 포함 주포 / 관측·탐조시설 / 보급·벙커의 정상·손상·파괴 3열. 기존 첨부 최종 어두운 시안을 기반으로 built-in imagegen을 사용했다. 행 좌표는 실측하여 renderer에 고정했다. 깃발·연기·화염은 아틀라스에 굽지 않았다.
- `gallipoli-overlay-central.webp`, `gallipoli-overlay-entente.webp`: 동일 크기의 독립 오스만/영국 깃발 RGBA. built-in imagegen 2열 원본에서 열만 추출했다. 공용 요새의 같은 앵커에 올리고 해당 포대가 파괴되면 숨긴다.
- `gallipoli-fortress-cut-in.webp`: 같은 게임 렌더러로 공용 요새를 투명 배경에 내보낸 컷인. 특정 진영 깃발을 포함하지 않는다.
- 원본 시안과 기존 게임 에셋은 덮어쓰지 않았다. WebP quality 95, 실제 alpha 0~254/255, 모든 모서리 alpha 0을 확인했다. `qa/gallipoli/alpha-check.json`에 크기/알파 결과를 기록했다.

생성 프롬프트 사양: (1) 첨부 최종 어두운 WWI 요새 톤과 긴 포신을 보존한 엄격한 탑뷰, 공용 정상/손상/파괴 3열, 기단·주포·관측소·탄약 벙커 4행, 진짜 투명 배경, 깃발/연기/문구 제외. (2) 마모된 오스만 및 영국 깃발 2열, 동일 앵커/발판 없음/진짜 투명 배경, 어두운 WWI 픽셀 질감. 코드로 새 도형 에셋을 대신 그리지 않았다.

## 검증

최신 기준에서 `node --test tests/*.test.mjs` **373/373**, fail 0. 새 갈리폴리 회귀 7개. 기존 Verdun 순환 테스트는 신규 지역 추가에 따라 순서/개수 기대값만 14→15로 갱신했다.

`node tools/validate.mjs`: **146 모듈 문법 / 1497 참조 / 누락 0**, git diff --check 통과. 별도 번들 빌드가 없는 native ES modules 프로젝트다.

실제 `Game`/`CoopGame` 엔진 60초 × 양 진영 × 폭390/1440 = 8개 시나리오: 모두 playing, native 부위 충돌·피해 20, pause 동결, hazard 최대5, pool dropped0. `qa/gallipoli/engine-results.json`.

PC 1440×1000 / 모바일 크기390×844의 양 진영 정상·손상, 해상·해안·참호·요새 접근을 실제 `paintGallipoli`와 `drawStageBoss`로 Skia Canvas 렌더했다. `qa/gallipoli/*.webp`. **이는 브라우저 실플레이/실기기 터치 검증이 아니다.** 렌더 수치는 CPU 렌더+RGBA readback이며 FPS로 주장하지 않는다.

브라우저 실플레이: 아직 미검증. 브랜치 푸시 후 미리보기에서 가능한 검증을 진행하고 결과를 후속 커밋에 기록한다. main/본섭 배포 없이 브라우저 결과를 과장하지 않는다.

## 재현과 파일

```sh
node --test tests/*.test.mjs
node tools/validate.mjs
node tools/qa-gallipoli-engine.mjs
HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-gallipoli-render.mjs
```

게임 변경: app.js, boss-feedback.js, headon-stageboss-patterns.js, headon-stageboss-runtime.js, stageboss-host.js, stageboss-view.js. 신규 gallipoli-boss.js, gallipoli-route.js, gallipoli-view.js. 아트 4개, 신규 tests/gallipoli-stage.test.mjs, 기존 tests/verdun-fortresses.test.mjs의 지역 수 기대값, tools/qa-gallipoli-engine.mjs, tools/qa-gallipoli-render.mjs, 본 문서 및 qa/gallipoli/.
