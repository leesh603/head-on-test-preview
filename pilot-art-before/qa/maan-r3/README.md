# 마안 보스 아트 R3

Wüstenpanzer와 Sinai Landship의 본체·포대·궤도·냉각기·기관실을 정상 / 손상 / 파괴 3상태로 다시 제작했다. 부위별로 정해진 장갑 패널 안에서만 상태를 교체하며, 파괴된 그림의 투명한 구멍은 정상 그림을 먼저 지워 배경이 보이게 한다. 임의의 넓은 영역을 부위에 배정하던 기존 합성을 제거했다.

- Wüstenpanzer 9부위, Sinai Landship 12부위의 독립적인 손상·파괴.
- 본체 사망은 손상 그림 대신 완전 파괴 프레임을 사용.
- 정상·손상 궤도만 움직이고, 파괴 궤도는 움직이거나 정상 프레임으로 덮이지 않음.
- Sinai의 앞뒤 궤도, 측면포, Lewis 부위와 발사 위치를 새 그림에 맞춤. 체력·공격 주기·부분파괴 효과는 유지했지만 일부 부위의 위치와 피격 범위는 조정됨.
- Wüstenpanzer 중포 반동은 현재 부위 합성 그림의 포신만 이동.
- 철도공창은 80개의 지붕 조각 대신 전용 붕괴·잔해 그림 사용. 두 지붕 날개가 벌어져 전진 시작 전에 본체 폭 + 24의 통로 확보.

## 제작 파일

내장 imagegen 도구로 생성·수정 후 원본 알파를 보존하여 WebP로 변환했다. Python 이미지 편집이나 대체 도형은 사용하지 않았다. 모두 1536 × 1024, 동일 크기의 3열 아틀라스다.

- `boss-maan-wusten-r3.webp`
- `boss-maan-sinai-r3.webp`
- `maan-workshop-r3.webp`

## 검증

기준 main: `bdb1456dd4ef1b7640ea5126dd17dbc2e316d8e7`. 작업 중 main에 반영된 갈리폴리 R10 및 기체 에셋 보정을 포함하여 그 위에 적용했다.

- `npm test`: 1,020개 통과, 실패 0. 실제 게임 엔진의 마안 테스트에는 양 진영, 솔로·협동, 390 / 1280px, 부분파괴·최종 패턴·일시정지·재시작 검사가 포함됨.
- `npm run build`: 모듈 190개 구문 검사, 상대 참조 1,649개 해석, 누락 0.
- `tools/qa-maan-art.mjs`: 21개 부위를 각각 손상/파괴했을 때 서로 다른 픽셀인지, 지정 패널 밖의 픽셀이 정상 상태와 정확히 같은지, 반복 프레임이 캐시를 재사용하는지, 사망 상태가 세 번째 아틀라스와 같은지 검사.
- `tools/qa-maan-render.mjs`: 1440 × 1000 및 390 × 844, 두 보스·공창 출현·실제 포격 예고 렌더. 누락 에셋 0. 붕괴 공창의 본체 폭 통로에 지붕 픽셀이 남지 않는 것을 검사.
- `render-metrics.json`은 네이티브 Skia Canvas 측정값이다. 실제 브라우저 FPS 또는 모바일 기기 성능을 의미하지 않는다.

브라우저에서 새 브랜치의 실플레이는 미검증이다. 현재 공개 페이지는 main 빌드이며 이 PR의 새 에셋을 아직 사용하지 않는다. PR은 배포 전 검토용으로 작성했다.

기존 선택 도구 `tools/qa-maan-engine.mjs`도 실행했으나 7.4초 시점에 보호가 끝났다고 가정하는 충돌 검사에서 실패했다. 현재 도입 보호는 9초이며, 해당 레거시 도구는 수정하거나 통과로 기록하지 않았다. 위의 정식 게임 엔진 통합 테스트는 9.2초 이후 충돌을 검사하며 통과했다.

재현 (별도로 설치한 `@napi-rs/canvas` 경로 지정):

```sh
HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-maan-art.mjs
HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/qa-maan-render.mjs
```

## 최종 수정 프롬프트

초기 작업은 기존 R2 에셋을 참고하여 정사영, 동일 프레임 등록, 절제된 사막 장갑색, 금속·천·리벳 구분, 연기·불꽃 없는 3상태 아틀라스를 요청했다. 아래는 최종 선택된 그림에 적용한 마지막 수정 요청이다.

### Wüstenpanzer

“Use case: precise-object-edit. Edit this 1536x1024 three-column top-down WWI Wustenpanzer game damage atlas. Preserve all positions, registration, column cell centers, colors and proportions. Targeted correction: in CENTER column add moderate battle damage to EVERY weapon emplacement, both upper AA emplacements, both mid side horizontal sponson guns, cooling radiator pair and engine rear, as well as BOTH track belts. LEFT column unchanged intact. In RIGHT column EVERY weapon must be visibly destroyed and unable to fire: BOTH upper left and upper right AA guns snapped, collapsed breeches with black fractured metal sockets, BOTH mid side horizontal gun emplacements destroyed with short severed barrel stubs and ruptured plates. Break BOTH left and right full track belts with missing links and exposed sprockets. Open up the cooling radiator pair at mid center and engine rear to scorched twisted metal. Central long gun broken at tip already, keep it. Use actual material wreckage not black flat patches, keep same full silhouette bounds. Do not move anything and do not change perspective. Three equal 512x1024 cells, registered. Real transparent alpha background, no backdrop or shadows, no smoke, fire, text labels, extra debris floating away.”

### Sinai Landship

“Precise-object-edit. Keep this Sinai Landship three-column top-down game atlas 1536x1024 exactly registered, all original shape and details unchanged except ONE specific correction: there must be ONLY TWO SIDE GUN PAIRS per vehicle: upper pair at existing local y=277, and lower pair at existing local y=648. REMOVE the middle side gun barrels and gun sockets at local y=462 on BOTH left and right edges, in ALL THREE columns. Preserve the Union Jack flag plates at y420..493, replace only removed middle barrels and their sockets with plain riveted sand-colored armor panels, no weapon. Keep upper and lower side gun pairs and central AA gun and all track positions unchanged. Intact column no holes, damage column scarring, destroyed column the same torn flag plates. Real transparent alpha background. Absolutely no new weapons, no text labels, no smoke or fire.”

### 철도공창

“Precise-object-edit: keep LEFT intact column absolutely unchanged. Keep 1536x1024 three columns and overall building alignment. In CENTER and RIGHT columns only, WIDEN THE COMPLETELY TRANSPARENT CENTRAL CORRIDOR drastically: within each 512px cell remove ALL roof, beams, rubble and doors within LOCAL x=100 through x=412 inclusive, from y=0 through y=1023. This full-height 312 pixel corridor must contain ZERO artwork, ZERO roof, ZERO beams, genuine transparent alpha. Only narrow broken building side remnants may remain within local x=20..100 and x=412..492. Their INNER edges should be natural jagged fracture, not straight crop, and outward fragments may spill away from center. Center state upright bent roof edges, right state lower settled brick and roofing rubble. Retain exact scale, axes, no perspective change, no fire or smoke. Dark timber and grey corrugated steel as original. TRUE transparent empty central exit path wide enough for a huge tank. No background.”

공창 생성 결과는 요청한 통로 폭을 정확히 지키지 않아, 렌더러에서 두 날개를 바깥으로 이동하여 통로를 확보하고 픽셀 검사로 확인했다.
