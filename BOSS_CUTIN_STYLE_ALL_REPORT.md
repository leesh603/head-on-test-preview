# 보스 컷인 전체 그림체 통일

- 기준: `leesh603/head-on-test-preview` main `f094bbdac4cf180581f7f8d564338c9c715e3992`.
- 작업 브랜치: `feat/boss-cutin-style-all`. main 병합 및 본섭 배포 없음.
- 이전 컷인 브랜치 `e0b539a555be3e28f1e4e7c30e3323868202783d`의 11종을 작업 브랜치에만 통합하고, 나머지 20종을 추가로 재작화했다. 최신 main의 항공기 외곽 정리, 편대 균형, 침몰 및 효과 수정은 유지했다.

## 결과

지역 보스 카탈로그 31종 모두 전용 컷인 사용. 기존 형태와 진영 표식을 참고해 짙은 세부 윤곽, 무광 채색, 올리브·갈색·강철색 및 풍화 재질로 통일했다. built-in imagegen으로 각 보스별로 원본과 공통 스타일 참조를 함께 사용했다. 20종의 프롬프트 및 원본 출처는 `qa/boss-cutins/style-prompts.json`에 기록했다.

컷인 전용 무손실 WebP 31종을 연결했다. 이미지 로드 실패 시 기존 이미지로 대체하며, 현재 지역의 컷인만 사전 로드한다. 전투 스프라이트, 보스 기믹, 한국어 UI 문구 및 공용 파일럿 초상화 32종은 수정하지 않았다.

## 검증

- `node --test tests/*.test.mjs`: **504/504 통과**, 실패·취소·스킵 0. 로그: `qa/boss-cutins/tests.log`.
- `node --check app.js`, `stageboss-view.js`, `boss-cutin-art.js` 및 `git diff --check` 통과.
- 컷인 31종 실제 이미지 디코딩 완료. 모두 투명 영역 포함, 사각 외곽의 alpha>32 픽셀 0. 감사: `qa/boss-cutins/after.json`.
- 카탈로그 31개 파일 연결, WebP 헤더, 지역별 사전 로드, 캐시 및 실패 대체 동작 검사.
- 기존 에이스 초상화 32개 참조 확인: `qa/boss-cutins/ace-audit.json`.
- PC 470×286 / 모바일 226×134의 실제 CSS 이미지 영역과 동일한 contain 배치로 합성 확인. `cards-0.webp`부터 `cards-7.webp`와 `desktop-mobile.webp`는 로컬 합성 자료이며 **실제 브라우저 또는 기기 플레이 검증은 수행하지 않았다**.

## 수정 파일

- 코드: `app.js`, `index.html`, `stageboss-view.js`, `boss-cutin-art.js` (컷인 연결, 지역 사전 로드, 캐시 갱신).
- 검증: `tests/boss-cutin-art.test.mjs`, `tools/qa-boss-cutins.py`.
- 자료: `qa/boss-cutins/`의 전체 목록·전후 비교·PC/모바일 합성·투명도 감사·프롬프트·시험 로그.
- 이전 작업 보고서 `BOSS_CUTIN_UNIFICATION_REPORT.md`는 최초 11종 작업 기록으로 유지했다. 이번 최종 결과는 이 문서를 기준으로 한다.

| 보스 ID | 이름 | 컷인 파일 |
|---|---|---|
| paris-gun | 브루노 열차포 | `cutin-paris-gun.webp` |
| lincomparable | 520mm 열차포 · 랑콩파라블 | `cutin-lincomparable.webp` |
| sms-stuttgart | 수상기 모함 · SMS 슈투트가르트 | `cutin-sms-stuttgart.webp` |
| hms-zubian | 분열 구축함 · HMS 쥬비안 | `cutin-hms-zubian.webp` |
| a7v-flak | A7V 플라크판처 | `cutin-a7v-flak.webp` |
| mark-v-cruiser | 대공 육상 전함 · 마크 V 크루이저 | `cutin-mark-v-cruiser.webp` |
| livens-flame-projector | 리벤스 대형 화염방사기 | `cutin-livens-flame-projector.webp` |
| minenwerfer-battery | 미넨베르퍼 교차 포격 진지 | `cutin-minenwerfer-battery.webp` |
| drachen-net | 드라헨 공중 기뢰 방어망 | `cutin-drachen-net.webp` |
| london-apron-raid | 런던 에이프런 방공망 | `cutin-london-apron-raid.webp` |
| flak-tower | QF 13파운드 방공탑 | `cutin-flak-tower.webp` |
| zeppelin-l70 | 슈퍼 체펠린 L 70 | `cutin-zeppelin-l70.webp` |
| hma23 | 공중 항모 · HMA 23급 | `cutin-hma23.webp` |
| gik | 한자-브란덴부르크 G.IK | `cutin-gik.webp` |
| ca4 | 카프로니 Ca.4 | `cutin-ca4.webp` |
| armored-harbor-fortress | 장갑 크레인 항구요새 | `cutin-armored-harbor-fortress.webp` |
| fliegerzug | 무인폭탄기 모함열차 · 플리거주크 | `cutin-fliegerzug.webp` |
| treffas-wagen | 대공개조형 트레파스바겐 · 거륜 육상전함 | `cutin-treffas-wagen.webp` |
| jasta11-circus | 야스타 11 플라잉 서커스 | `cutin-jasta11-circus.webp` |
| naval10-black-flight | 네이벌 10 — 블랙 플라이트 | `cutin-naval10-black-flight.webp` |
| mark4-wedge | 마크 I 최초 랜드십 돌파대 | `cutin-mark1-landships.webp` |
| morser-battery | 슈바벤 보루 · 지하 방어요새 | `cutin-schwaben-fortress.webp` |
| gotha-squadron | 고타 야간 폭격전대 | `cutin-gotha-squadron.webp` |
| fort-douaumont | 두오몽 요새 · Fort Douaumont | `cutin-douaumont.webp` |
| fort-souville | 수빌 요새 · Fort de Souville | `cutin-souville.webp` |
| wustenpanzer | 사막 육상순양함 · Wüstenpanzer | `cutin-wustenpanzer.webp` |
| jutland-grand-fleet | 유틀란트 전투전대 · 북해 함대전 | `cutin-jutland-fleet.webp` |
| gallipoli-fortress | 갈리폴리 대요새 · 다르다넬스 점령전 | `cutin-gallipoli.webp` |
| paris-staaken-rvi | Zeppelin-Staaken R.VI · 파리 폭격 | `cutin-paris-staaken.webp` |
| paris-searchlight-fortress | 파리 탐조등 방공요새 | `cutin-paris-fortress.webp` |
| sinai-landship | 시나이 육상함 · Sinai Landship | `cutin-sinai-landship.webp` |
