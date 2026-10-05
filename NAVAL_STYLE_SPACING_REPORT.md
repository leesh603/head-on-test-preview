# 함선 그림체·간격 수정

기준: leesh603/head-on-test-preview main `313af1b0a41a53c67aca754636d56345b89498b6`.
브랜치: `feat/naval-style-spacing`. main 병합·본섭 배포 없음.

## 변경

- 일반 아군·적군 함선 모두 유틀란트 보스의 기존 `jutland-cruiser.webp`, `jutland-parts.webp`를 직접 사용. 선체 재질·명암·손상 그림·회전 포탑을 통일하고 라운델/철십자로 진영을 구분.
- 회전한 선체 전체로 함선 간격을 판정. 스폰 공간 탐색, 전방 감속·회피, 이동 후 접촉 분리를 적용. 극단적으로 혼잡한 상태에서는 일반 함선을 철수 처리.
- 일반 함선은 해상 보스의 항로를 비켜가고, 유틀란트 주력함·순양함도 서로 분리. 공중 비행선과 플레이어 비행기는 해상 충돌 처리에서 제외.
- 분리 후 위치에 항적을 기록하여 선체와 항적의 좌표를 일치.

## 수정 파일

`fleet-naval1.js`, `jutland-view.js`, `adriatic-boss-layout.js`, `naval-spacing.js`, `jutland-boss.js`, `stageboss-host.js`, `tests/naval-spacing.test.mjs`, `tools/qa-naval-style.mjs`, 이 보고서와 `qa/naval-style/` 검증 자료.

## 검증

- `node --test tests/*.test.mjs`: 470/470 통과.
- 일반 함선 밀집·스폰·보스 회피·보스 함선 분리 회귀 테스트 4개 추가.
- 아드리아해(1)·제브뤼헤(7)·유틀란트(16), 양 진영 × 솔로/협동 12개 조합 각각 60초: 일반 함선 간 겹침 0프레임, 해상 교전 피해 발생, 항적 24개 상한 유지.
- 기존 유틀란트 엔진 검증 8개 조합 각각 60초: 일시정지, 피해, 보스 파괴, 비행선 철수, 다음 스테이지 정리 통과.
- Skia에서 실제 게임 렌더 함수를 사용한 이미지 검수 완료. `shared-art.webp`와 각 바다·진영 이미지 첨부.
- 실제 PC/모바일 브라우저 플레이 및 기기 성능은 미검증. Skia 검증을 브라우저 검증으로 간주하지 않음.

재현: `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-naval-style.mjs`.
