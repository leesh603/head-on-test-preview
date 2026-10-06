# 보스 컷인 통일

기준: `leesh603/head-on-test-preview` main `738d7dbd62f0661ca602f300f1736dcf384a482d`.
작업 브랜치: `feat/boss-cutin-unification`. main 병합·본섭 배포 없음.

실제 지역 보스 31종의 컷인 연결과 파일을 검사했다. 파일 자체가 없는 보스는 없었지만, 게임용 탑다운 스프라이트나 맵 미리보기를 사용하던 11종을 전용 일러스트로 교체했다. 기존 20종과 에이스 등장에 쓰이는 파일럿 초상 32종은 비교 시트에서 확인했고 기존 그림체를 유지했다.

## 새 컷인 11종

| 보스 ID | 파일 |
|---|---|
| mark4-wedge | cutin-mark1-landships.webp |
| morser-battery | cutin-schwaben-fortress.webp |
| gotha-squadron | cutin-gotha-squadron.webp |
| fort-douaumont | cutin-douaumont.webp |
| fort-souville | cutin-souville.webp |
| wustenpanzer | cutin-wustenpanzer.webp |
| sinai-landship | cutin-sinai-landship.webp |
| gallipoli-fortress | cutin-gallipoli.webp |
| paris-staaken-rvi | cutin-paris-staaken.webp |
| paris-searchlight-fortress | cutin-paris-fortress.webp |
| jutland-grand-fleet | cutin-jutland-fleet.webp |

기존 파리포·Ca.4·슈투트가르트 컷인의 군용 모형풍 채색, 낮은 채도, 금속·석재 질감에 맞췄다. 실제 알파를 유지한 무손실 WebP로 저장했다. 양 진영 공용인 유틀란트 컷인의 비행선 철십자와 수상기 국적 표식을 제거했다.

## 연결 변경

- `boss-cutin-art.js`: 31종 등록, 11종 새 이미지, 구역별 사전 로드, 로드 실패 시 기존 이미지로 대체.
- `app.js`: 지역 보스 컷인 소스를 새 등록부에서 선택.
- `stageboss-view.js`: 구역 전환 시 해당 구역 컷인만 사전 로드.
- `index.html`: 변경된 앱과 모듈의 캐시 버전 갱신.
- `tests/boss-cutin-art.test.mjs`: 실제 보스 전원 연결, 파일 존재, 구역별 로드·재사용·실패 대체 검증.
- `tools/qa-boss-cutins.py`, `qa/boss-cutins/*`: 파일·알파 감사, 전체 비교 및 PC·모바일 크기 구도 시트, 테스트 로그.

## 검증

- `node --test tests/*.test.mjs`: **499 / 499 통과**, 실패·스킵 없음.
- `node --check`: app.js, stageboss-view.js, boss-cutin-art.js 통과.
- `git diff --check`: 통과.
- 31종 지역 보스 컷인과 32종 에이스 초상 파일 존재 확인.
- 새 11종 모두 투명 알파 확인. 이미지 테두리의 알파 > 32 픽셀은 모두 0.
- 전체 비교 시트 및 CSS의 이미지 영역에 맞춘 470×286 / 226×134 구도 시트를 육안 확인했다. 스프라이트 대신 전용 일러스트를 연결했고 한국어 UI·등장 시간·전투 동작은 유지했다.
- 실기기/브라우저의 실제 전투 재생은 수행하지 않았다. 구도 시트는 이미지 합성 결과이며 플레이 화면 캡처가 아니다.

## 이미지 제작 기록

내장 imagegen으로 제작한 기존 11종 결과를 복구해 사용했다. 원본의 생성 프롬프트 전문은 복구되지 않아 재현 원문으로 기록하지 않는다. 공통 제작 사양은 기존 보스 디자인 보존, 기존 컷인 그림체 참조, 풍화된 군용 모형풍 채색, 낮은 채도, 얇은 윤곽, 투명 배경, UI·문구·외부 그림자 없음이었다.

이번 유틀란트 표식 수정 프롬프트: “Remove ONLY the black iron-cross national insignia on the airship and the green-white-red stripe/roundels on the tiny seaplane. Replace those emblem areas with the immediately surrounding weathered steel grey fabric or muted grey-green aircraft paint. This is a shared illustration for either faction, so no national markings anywhere. Keep the three ships, airship, seaplane, all composition, silhouette, perspective, tiny details, painted military miniature texture, lighting, muted colours exactly as reference. Preserve full transparent alpha background, no halo, no smoke, no ocean, no background, no ground shadow. Fit complete illustration inside canvas with a small clear margin, do not crop mast or hull. This is an emblem cleanup only.”
