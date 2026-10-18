# 협상국·동맹국 함선 디자인 분리

기준: `leesh603/head-on-test-preview` main `c83ef138d78f194e1d64c61de47af93bcf5660b9`. 최신 main의 쥬비안 톤·분리 프레임 정리를 유지.
브랜치: `feat/naval-faction-hulls`. main 병합·본섭 배포 없음.

## 적용 범위

| 종류 | 협상국 | 동맹국 | 사용처 |
|---|---|---|---|
| 구축함 | 긴 선수·두 굴뚝·가벼운 갑판 | 세 굴뚝·밀집된 장갑 구조 | 일반 아군·적군 |
| 대공 호위함 | 둥근 선미·개방된 갑판·중앙 포열 | 각진 선미·세 굴뚝·장갑 지휘실 | 기존 대공순양함 슬롯 |
| 순양함 | 간결한 함교·두 굴뚝·분산된 설비 | 넓은 선수·장갑 함교·밀집된 설비 | 유틀란트 호위 보스 |
| 전함 | 긴 전방 갑판·두 굴뚝·후방 주포 | 넓은 선수·세 굴뚝·중앙 주포·장갑 지휘실 | 유틀란트 기함 보스 |

총 8개 별도 선체, 각 정상·손상·파괴 3개 상태 = 24개 프레임. image_gen으로 각각 제작한 아틀라스. 기존 유틀란트의 세밀한 장갑·리벳·목재·명암을 스타일 참조. 라운델/철십자는 작은 보조 표식으로 유지, 기함의 반복 표식 제거.

회전 포탑은 기존 아틀라스 유지. 새 포좌 위치를 기준으로 포탑 렌더·일반 함선 탄 발사·보스 부위 좌표를 함께 정렬. 선체 크기·회전·간격 분리·HP·공격 패턴·포 수 유지. 새로운 난이도나 함선 스폰 슬롯 추가 없음.

## 수정 파일

- 코드: `fleet-naval1.js`, `jutland-boss.js`, `jutland-view.js`, `naval-faction-art.js`, `naval-faction-atlas.js`.
- 새 에셋: `naval-entente-light.webp`, `naval-entente-capital.webp`, `naval-central-light.webp`, `naval-central-capital.webp`.
- 테스트/QA: `tests/naval-faction-art.test.mjs`, `tools/qa-naval-factions.mjs`, `tools/qa-jutland-factions-engine.mjs`, `qa/naval-factions/`.
- 보고서: 이 파일. 생성 프롬프트는 `qa/naval-factions/asset-prompts.md`.

## 검증

- `node --test tests/*.test.mjs`: 482/482 통과. 양 진영 독립 아틀라스·4종/3상태 선택, 렌더 폭·높이·회전 보존 회귀 검사 추가.
- 양 진영 × 솔로/협동 × 아드리아해·제브뤼헤·유틀란트 12개 조합 각각 60초: 해상 교전 유지, 일반 함선 간 겹침 0프레임, 항적 상한 24개, 아군 분리 유지.
- 유틀란트 양 진영 × 솔로/협동 × 390/1440 가상 폭 8개 조합 각각 60초: 피해·부위 충돌·일시정지·파괴·철수·정리 통과.
- 게임의 실제 렌더 함수로 각 함종·진영·손상 상태를 검수. `battleship-0.webp`, `aa-0.webp` 등은 왼쪽 협상국 / 오른쪽 동맹국 비교.
- 위 검증은 네이티브 엔진 및 Skia 렌더 검증. 실제 PC·모바일 브라우저 플레이·기기 성능 미검증.

재현: `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-naval-factions.mjs`, `node tools/qa-jutland-factions-engine.mjs`.
