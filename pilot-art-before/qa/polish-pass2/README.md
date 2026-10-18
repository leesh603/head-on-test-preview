# HEAD-ON 폴리싱 2차 — 변경 및 검증 기록

작업 시작 main: `32f637d6ba5f56f2ae45b4d7bf2858b75ea7417a`.
작업 중 main 갱신을 재확인하고 `c543b84b0246950d314299e51065747da943b0f0` 위로 충돌 없이 재배치했다. 최신 main의 컷인 수정도 보존했다.
브랜치: `polish/quality-pass2-20261010`. main 병합·배포 없음.

## 항목별 결과

| 분야 | 판정 | 변경 전 문제 → 실제 수정과 효과 | 수정 파일 / 단계 |
|---|---|---|---|
| 문구·용어 | 개선 | 강화 설명에 px·각도·어그로 등 내부 표현이 노출되고 일부 미션 보상이 모호했다. 실제 효과를 확인해 자연어로 정리하고 7종 미션을 작전 지시형으로 수정했다. 마우저 대상별 피해, 사진 정찰의 단일 부위 효과, 보급의 완전 수리 등이 명확해졌다. | augmentation-overhaul150.js, i18n.js / 1 |
| UI | 개선 | 미션 본문 3줄 제한과 긴 강화 팝업의 위·아래 초과 가능성이 있었다. 본문 생략을 제거하고 화면 높이에 맞춰 스크롤하며 팝업 위치·폭·높이를 제한한다. 한국어 설명은 단어 단위로 줄바꿈한다. | battlefield-event-ui.css, app.js / 1 |
| 전투 FX | 개선 | 연료 화재·탄약 유폭·중포탄의 2차 화염·연기·흙먼지가 지연 후 높은 불투명도로 갑자기 나타났다. 기존 레이어의 진입·종료 불투명도만 완만하게 연결했다. 첫 충격 섬광은 즉시 발생한다. | explosion-profiles.js / 2 |
| 그래픽 | 개선 | 작은 보급품도 강제 nearest-neighbor 축소되어 윤곽 계단이 남았다. 원본보다 작게 그릴 때만 보간한다. 원본 크기·확대 표시와 모든 원화 파일은 유지한다. | equipment.js / 3 |
| 애니메이션 | 개선 | 추락 끝에 기체 부착 연기·불꽃이 한 프레임에 사라졌다. 마지막 0.18초에 해당 부착 레이어만 감쇠한다. 독립 연기, 기체 궤적, 충돌·폭발 시점은 그대로다. | aircraft-crash.js / 3 |
| 사운드 | 개선 | 음량 설정이 새 소리에만 적용되어 재생 중인 폭발 잔향·엔진과 반영 시점이 달랐다. 기존 출력 버스에서 15ms 평활화로 적용한다. 음원·피치·기본 피크 레벨·컴프레서·동시 발음 제한은 보존한다. | sfx.js / 4 |
| 파일럿·기체·보스 전용 표현 | 유지 | 파일럿 32명·66개 기술명 데이터, 기존 전용 FX와 원화·보스 기믹을 교체하지 않았다. 대체 원화의 우월성을 입증하지 못하므로 새 에셋·필터를 넣지 않았다. 명칭·설명 보존 테스트 통과. | 변경 없음 |
| 전체 음량 재조정·모바일 최종 품질 | 보류 | 실기기 청취·프레임·메모리 비교와 수정 브랜치의 테스트 서버 실플레이는 미완료다. 근거 없는 볼륨·이펙트 밀도 조정은 하지 않았다. | 변경 없음 |

## 전후 비교 자료

- [FX 애니메이션](fx-before-after.gif), [동일 시각 정지 비교](fx-before-after.png)
- [보급품 축소 비교](pickup-before-after.png): 실제 46px 표시와 확대 뷰.
- [추락 종료 비교](crash-tail-before-after.png): 충돌까지 0.18 / 0.09 / 0.01초.
- [비교 수치](fx-checks.json): 5개 폭발 유형 × 241 시점 = 1,205쌍.

이 자료는 실제 게임 렌더러와 원본 에셋을 Native Canvas에서 실행한 비교다. **브라우저 실플레이 영상이나 모바일 FPS 증거가 아니다.** 비교 기준 32f와 최신 c543 사이에는 해당 렌더러 변경이 없다.

FX의 draw 수, sprite 키, 위치·크기·회전, 수명·풀 제한이 전후 동일하다. 새로운 런타임 에셋·입자·캐시·오디오 노드를 추가하지 않았다. 이것만으로 실기기 성능 무퇴보를 확정하지 않는다.

## 검증

관련 자동 테스트 **63개 통과**:

```sh
node --test tests/combat-voices.test.mjs tests/polish-presentation.test.mjs tests/polish-fx.test.mjs tests/combat-feedback.test.mjs tests/combat-haptics.test.mjs tests/mission-rewards.test.mjs tests/skill-names.test.mjs tests/build-combat-identity.test.mjs tests/formation-manual-balance.test.mjs tests/cutin-image-swap.test.mjs
```

팝업 기하 테스트는 320×568, 390×844, 1280×800 화면의 위·아래 배치를 확인한다. DOM 모형 기반이며 실제 브라우저의 폰트·레이아웃 검증을 대체하지 않는다. 편대 교범 테스트의 기대 용어만 ‘공격 속도’에서 ‘연사’로 바꿨으며 수치 검증은 유지했다.

`git diff --check` 통과. 전체 validator의 모듈 syntax 검사는 통과하나 import/asset 검사는 기존 갤러리 6건 때문에 실패한다: make-gallery.js의 동적 `./${it.f}`, asset-gallery.html의 tmp-gal-open.png, tmp-gal.png, tmp-reveal-fast-15s.png, tmp-reveal-fast.png, tmp-ui4.png. 시작 main에서도 동일하게 재현했으며 이 작업에서 갤러리를 수정하지 않았다.

공개 테스트 서버의 기존 main에서 격납고·설정·Test Lab 모바일 390×844 일반 전투를 확인했다. **수정 브랜치는 서버에 배포하지 않았으므로 변경 후 실플레이 검증 완료로 판정하지 않는다.** 일반전·에이스전·보스전의 수정 후 시인성, 전체 스킬 회귀, 실기기 FPS·메모리·청취 평가는 미완료다.

## 커밋 구분

1. `polish: clarify equipment and mission copy and contain long popups`
2. `polish: ease smoke and secondary fire without extra FX draws`
3. `polish: smooth reduced pickup art and finish crash trails gradually`
4. `polish: apply SFX volume smoothly to active voices and record QA`

각 단계가 별도 커밋이다. 검증되지 않은 부분을 포함해 전체 최종 합격을 선언하지 않는다.
