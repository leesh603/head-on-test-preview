# 신규 파일럿 4인 초상화·선택창 수정

기준: `leesh603/head-on-test-preview` main `92485ec26dae768829b08e40a5ed666eff973263`.
브랜치: `feat/pilot-four-portraits-roster`. main 병합·배포 없음.

## 초상화

뷰챔프-프록터(`proctor`), 러프베리(`lufbery`), 고트하르트 작센베르크(`sachsenberg`), 폰 슐라이히(`schleich`)를 전부 새로 그렸다. 기존 리히트호펜·폰크 초상화를 스타일 참조, 기존 대상 초상화를 얼굴·제복 참조로 사용했다. 기존의 사진 채색 느낌과 불투명한 가로 줄무늬를 제거하고, 흙빛 팔레트·붓질·명암·제복 질감이 있는 투명 일러스트로 교체했다.

내장 image_gen 사용. 최종 생성 프롬프트는 `qa/pilot-four/generation-prompts.json`에 기록했다. WebP 품질 95로 인코딩하며 원본 알파 값을 그대로 보존한다. 초상화 공통 소스를 갱신해 선택 카드·격납고·컷인·적 에이스 도착 화면에서 동일한 새 파일을 사용한다.

## 선택창

같은 진영에서 파일럿을 선택할 때 `pilotTabs.replaceChildren()`으로 모든 버튼을 제거·재생성하던 동작을 없앴다. 기존 버튼·초상화·표시 순서·포커스·스크롤 위치를 유지하고 선택 상태만 갱신한다. 진영이 바뀔 때만 다른 파일럿 목록을 만든다.

Astra 인터페이스는 기존 카드의 선택 상태 변경도 관찰하도록 수정했다. 화면 밖 파일럿을 표시하는 계산은 서로 다른 offsetParent의 offsetLeft를 빼던 방식에서 실제 사각형 좌표 기준으로 고쳤다. 이미 보이는 카드 선택은 재정렬·자동 중앙 이동 없이 유지된다.

## 수정 파일

- 초상화: `portrait-proctor-field.webp`, `portrait-lufbery-field.webp`, `portrait-sachsenberg-field.webp`, `portrait-schleich-field.webp`.
- UI: `app.js`, `astra-interface180.js`.
- 소스·캐시 참조: `portraits.js`, `main-ui-v2.js`, `index.html`.
- 검증·인계: 이 보고서, `qa/pilot-four/*`.

## 검증

- `node --test tests/*.test.mjs`: **413/413 통과**.
- 변경 JavaScript 구문 검사·`git diff --check` 통과.
- 새 이미지 4개의 실제 투명 알파 및 WebP 인코딩 후 알파 보존 확인.
- 브라우저 검증: 구현 커밋 `47393f542e65cd2c1a524f9af7e3e836b4181914` 미리보기에서 네 명을 모두 선택했다. 동맹국 슐라이히→작센베르크, 협상국 러프베리→프록터 선택 전후 스크롤 838px 유지, 목록 순서·포커스 유지, 파일럿 이름·패시브·기체 갱신, 새 1254px 초상화 표시를 확인했다. `browser-proctor.jpg`는 실제 브라우저 검증 화면이다.
- raw.githack의 교차 출처 이미지 때문에 기존 aircraft/crew portraits/battlefield 이미지 로더에서 canvas SecurityError가 발생했다. 새 4인 초상화와 선택 동작은 직접 확인했으나 장시간 전투·실기기 모바일은 미검증이다. 범위 밖 공통 이미지 로더는 변경하지 않았다.
