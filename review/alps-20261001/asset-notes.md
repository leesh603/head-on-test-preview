# 손상 이미지

생성 방식: imagegen 스킬의 built-in 이미지 생성/편집 도구. 원본 라이브 스프라이트를 참고하여 각각 3×2 투명 아틀라스를 생성했다. 원본 정상 이미지는 유지한다. 후처리는 WebP 형식 변환만 수행했다.

프로젝트 소비 파일:

- `alps-gik-damage-20261001.webp`
- `alps-ca4-damage-20261001.webp`

최종 프롬프트 원문은 `asset-prompts.json`에, 프레임 정의와 원본 blob SHA는 `asset-manifest.json`에 저장했다. `alps-bomber-render.js`에서 부위별 손상 프레임과 최종 잔해를 렌더링하며 `stageboss-view.js`는 알프스에서만 해당 아틀라스를 미리 읽는다.
