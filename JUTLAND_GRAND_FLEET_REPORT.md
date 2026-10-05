# 유틀란트 북해 함대전

- 저장소: leesh603/head-on-test-preview
- 브랜치: feat/jutland-grand-fleet
- 재개 시 확인한 최신 main: c5db36d49ec28589f9148ee5cfd7fcbfa3b74e80 (v484)
- main 변경·병합 및 본섭 배포 없음.

## 구현

16번째 전장 `jutland` (stageIndex 15). 북해 수면을 한 번만 주기 경계 처리하고 1px 외곽 샘플을 덧대어 카메라 소수점 위치에서도 타일 틈을 없앴다. 폭 7200의 월드 경로, 진행 거리 기반 출현, 침몰 선체와 연기 기둥, 해상 일반 함선/수상기 구성을 적용했다. 비행·파일럿·증강·랭킹·저장 규칙은 변경하지 않았다.

보스 `jutland-grand-fleet`: 기함 전함 1척, 호위 순양함 2척, 관측 비행선 1척. 기존 최대 HP 예산을 50/20/20/10%로 분배한다. 본체는 입장 연출 5초 후 언제든 공격할 수 있다. 함선 3척이 격파되면 비행선이 퇴각하여 완료한다. 부위 공격도 본체 HP에 한 번만 반영한다.

- 전열 사격 → 실제 선회 → T자 횡단 집중 사격 → 전투 반전·어뢰 엄호 → 전열 재정비.
- 함체는 최대 선회율을 지키며 항해하고 포탑은 조준 후 발사한다. 부위와 탄환의 swept 충돌도 함체 각도를 따른다.
- 사격지휘소 파괴: 횡단 집중 사격 수 감소. 관측 장비 파괴: 함포 경고 시간 증가. 보일러 파괴: 항해 속도 저하.
- 순양함 발사관: 2초 사선 경고 뒤 직선 어뢰. 발사관 파괴 시 소유 공격 취소.
- 기함 수상기: 19초 주기의 단발 정찰 패스, 탄환 난사 없음. 관측 전에 격추하면 보정 사격 차단. 발진 설비 파괴 시 정찰 중단. 동맹국 FF.33 / 협상국 Macchi M.3, 2기 상한.
- 선체·포탑의 정상/손상/잔해 아틀라스, 한국어 부위·전술 안내, 기함/호위함 화면 밖 방향 안내.

기존 모함의 공격 편대, 쥬비안 분열·돌진, 갈리폴리 점령·자동 수리 기믹은 사용하지 않는다.

## 검증

- `node --test tests/*.test.mjs`: 424/424 통과.
- 최신 main(v484)의 기존 테스트 참조는 v483에 남아 있어 단독 기준 검사에서 실패했다. 테스트 imports의 query만 v484로 동기화하여 기존 413개를 통과시켰고, 신규 유틀란트 11개를 추가했다. 기존 assertions 삭제/완화 없음. 지역 순환 개수는 15→16으로 갱신했다.
- `node tools/qa-jutland-engine.mjs`: 솔로/협동 × 양 진영 × 390/1440, 8개 사례 각각 60초. 기본 조작·실제 호스트 충돌/피해·함선 격파·관측 퇴각·보상 1회·다음 전장·공격 정리·pause 확인.
- 공격 풀 최대 6, 드롭 0, 실제 정찰 최대 1/총 2회. 신규 전장에 육상 열차포/관측기구가 나오지 않음.
- `tools/qa-jutland-render.mjs`: Skia 390×844 및 1440×900, 양 진영의 출현·횡단·포격·어뢰·손상 렌더. 파일 누락 0. 이 수치는 브라우저 FPS가 아니다.
- `git diff --check`: 통과.
- 실제 브라우저 플레이 검증은 업로드 후 별도 결과로 기록한다. 모바일 실제 장치 검증은 미검증.

## 수정 파일

핵심 신규 파일: `jutland-boss.js`, `jutland-route.js`, `jutland-view.js`, `jutland-atlas.js`.
신규 에셋: `jutland-sea.webp`, `jutland-battleship.webp`, `jutland-cruiser.webp`, `jutland-parts.webp`, `jutland-fleet-cut-in.webp`.
연결: stageboss host/patterns/runtime/render/view/HUD, app/index/coop-view, boss-feedback, transition-tips188. engine/coop-engine는 stage15를 해상 목록에 추가하고 변경 어댑터 import만 갱신했다. engine 모듈 자체 query(v484)는 통일 유지.
검증: `tests/jutland-stage.test.mjs`, 기존 테스트 query 동기화, `tools/qa-jutland-*.mjs`, `qa/jutland/` 결과.
