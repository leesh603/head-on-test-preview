# 쥬비안 그림체·톤 통일

기준: `leesh603/head-on-test-preview` main `75bb75456b26ccdd5da9bb03b039680c0d57e11f`.
브랜치: `feat/naval-faction-zubian-art`. 이번 커밋 범위는 쥬비안 톤 수정.

- 기존 쥬비안 정상/분리 아틀라스와 손상/파괴 아틀라스를 image_gen으로 편집. 유틀란트 순양함과 포탑을 스타일 참조로 사용.
- 노란 갑판과 황동, 붉은 구명정을 저채도 갈색·회색으로 조정. 선체 형태, 포 배치, 분리 단면과 기존 프레임 구조 유지.
- 신규 `zubian-atlas-tone.webp`(1536×1024), `zubian-damage-tone.webp`(1024×1536), 실제 투명 알파. 원본 에셋 보존.
- `stageboss-view.js`의 정상/손상 시트 참조만 변경. 보스 기믹·충돌·크기 변경 없음.
- 양 진영 함선의 신규 디자인 분리는 이 커밋에 포함하지 않음.

검증: `node --test tests/*.test.mjs` 480/480 통과. Skia에서 `drawZubianShip` 실제 함수로 정상, 손상, 분리, 앞·뒤, 앞·뒤 파괴 7개 상태 검수. 실제 유틀란트 순양함과 나란히 렌더하여 톤 비교. 이미지 빈 공간의 알파 0 확인. 실제 PC/모바일 브라우저 플레이·성능 미검증.

수정 파일: `stageboss-view.js`, 신규 에셋 2개, `tools/qa-zubian-tone.mjs`, 이 보고서와 `qa/zubian-tone/` 렌더·테스트·프롬프트 기록.
재현: `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-zubian-tone.mjs`.
main 병합·본섭 배포 없음.
