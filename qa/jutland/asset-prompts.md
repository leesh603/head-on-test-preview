# 생성 에셋 프롬프트 기록

기존 `boss-sms-stuttgart94.webp`, `boss-hms-zubian94.webp`, `terrain-sea359r2.webp`를 그림체 참조로 사용했다. 게임 내 이미지는 생성 PNG에서 알파를 보존한 quality95 WebP로 변환했다. 픽셀 그림을 임의로 덧그리거나 저해상도로 축소하지 않았다. 최종 아틀라스는 실제 출력의 경계를 측정했다.

- 북해: Cold North Sea top-down water texture for HEAD-ON WW1 game, reference fine painterly waves. Seamless square texture, dark slate blue and grey teal, small whitecaps and long varied swells, no ships, land, sky, text. Muted, detailed, no tropical cyan. 1536 square.
- 전함: Strict orthographic top-down WW1 dreadnought sprite atlas, same hull intact/damaged/wreck in three equal columns, long narrow hull facing 12 o'clock. Muted weathered gunmetal/teak, funnels, bridge, detailed lifeboats/rigging/rivets. Four empty port/starboard gun rings; separate rotating modules. No perspective, smoke, flags or water; true transparency.
- 순양함: Strict orthographic top-down WW1 light cruiser sprite atlas in muted gunmetal/teak detail. Same slender hull intact/damaged/wreck, whole hull facing 12 o'clock, funnels, bridge/lifeboats, empty bow/stern gun rings and torpedo plinths. No perspective/scenery/text, true transparency.
- 모듈: HEAD-ON WW1 naval module atlas, strict topdown muted charcoal metal. Three columns intact/damaged/destroyed, four rows: twin dreadnought turret, single cruiser turret, triple torpedo rack, optical director. Complete barrels face 12 o'clock, same mounting pivots, isolated hardware; no hull/scenery/smoke/text, true transparency.
