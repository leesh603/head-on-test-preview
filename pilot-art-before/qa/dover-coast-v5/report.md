# Dover coast visibility and ribbon repair (v5)

## Baselines and branch
- Source of truth: `leesh603/head-on-aces-source`, main `101589da52e67c5bb314908e4dd7ab7a4eb32b94`.
- Preview test baseline: `leesh603/head-on-test-preview`, main `16998da0ea66192764382c3d00d50cf403ce1e0f`.
- Latest preview base tree: `42abe775168e3b79114c666d97ae5782392e574e`; concurrent sprite cleanup retained. Full test counts above use the preceding bomb-rendering main, with final preview runtime rechecked after sprite integration.
- Both feature branches: `feat/dover-coast-visibility-fix`.
- Bishop forward carpet / off-screen ascent and newest nose-down bomb graphics changes from current main are preserved. No combat or boss changes in this patch.

## Before / after
The previous entry was deep in open water: a normal 390×844 start showed no cliff. Local shoreline turns folded 144/383 English and 155/383 French ribbon quads; repeating a nonseamless material joined unrelated top and bottom image rows.

The shared, finite coast profile now uses broad smooth headlands and a narrower navigable channel (2426.88–3001.54 world units). Full flight world remains 6144×9216. Normal entry places the English ribbon centerline 150 world units left of the plane, making the cliff immediately visible on mobile and PC. This is a rendering-centerline distance, not 150 units from the visible surf: the visible cliff reaches roughly 34 units from the player at entry. Aircraft can fly above coastal terrain; the stricter water corridor is used for ships.

Rendering and naval navigation use the same smooth profile. Vertical material periods alternate forward and reverse, joining the exact same source rows and alpha edges. Existing HEAD-ON rural, sea and chalk material assets are reused. No new raster asset or placeholder geometry was introduced. Material can still exhibit mirrored visual motifs; the measured pixel-edge discontinuity and folded ribbon have been fixed.

## Changed production files
`app.js`, `dover-night-view.js`, `dover-patrol-chart.js`, `dover-terrain-profile.js`, `dover-terrain-render.js`, `index.html`, `stageboss-host.js`, `stageboss-view.js`, `test-lab.html` (under `dist/` in source). Tests: `tests/dover-terrain-native.test.mjs`, new `tests/dover-coast-visibility.test.mjs`. Additional files in this folder are review evidence only.

## Verification
- Focused Dover tests: **52/52 pass**, both source and preview.
- New four regression tests: **0/4 pass before**, **4/4 pass after**. Cover normal mobile/PC entry, every coast segment orientation, identical repeated material rows, channel width/full map space.
- Independent read-only geometry review: **0/766 folded quads**; minimum triangle Jacobian magnitude 11287.7 English / 8757.5 French; maximum adjacent normal turn .476° / .376°.
- Mirrored painter sweep: **2932 source slices, 0 invalid**.
- Conservative full-hull clearance to visible coast: at least **107.7 English / 136.8 French world units**.
- Source full suite on latest main: baseline **853 tests, 531 pass, 322 fail**; patched **857 tests, 535 pass, 322 fail**. Normalized failing-test-name sets identical. Full suite is not green; failures include existing missing fixtures/assets and historical renderer assertions. No extra failing test was introduced.
- Preview full suite: baseline **1121 tests, 1120 pass, 1 fail**; patched **1125 tests, 1124 pass, 1 fail**. Same existing `tests/player-effects-import.test.mjs` fixture failure.
- Source `npm run build`: **exit 0**, 235 text assets, 229 external images, 233.7 MiB →34.6 MiB. The current Bishop modules and latest nose-down bomb graphic changes were included. Local archived asset-bank planes `caproni_ca3.webp` and `salmson_2a2.webp` could not be materialized via connector (>1 MiB binary API limitation); their unchanged remote blobs are preserved in the source base tree. Build success does not certify complete archived asset-bank materialization.
- Preview validator `npm run build`: baseline and patch retain the same seven issues (gallery dynamic import and six absent archived boss images). All 205 JS syntax checks pass; no new import target failure.
- `git diff --check`: pass.
- Actual browser runtime: normal start 390×844, forward flight at2.1 and6.1 seconds; normal start1280×800; French shore supplemental inspection. No game console errors.

## Screenshots
All images are actual game captures, not mockups. `before-start-mobile.jpg` and `after-start-mobile.jpg` use normal entry with no QA teleport. `after-flight-mobile.jpg` and `after-flight6-mobile.jpg` are normal forward travel. `after-start-pc.jpg` is normal PC entry. Only `after-french-pc.jpg` uses the explicit shoreline inspection tool; ships are visibly on water.

## Deploy / unverified
Feature branches pushed; no merge to main, no production Site deployment. Initial runtime checks and movement evidence use preview draft `f488d8a2125c957ecc1be58b3fb7b85d34ce56d8`; normal mobile and PC starts were rechecked and recaptured on latest-main integrated runtime `4dfd41b7f17479295313e7b1e6c7e3b23f09cd3a`. Final evidence commits do not change runtime code. Complete gameplay balance and every possible camera turn were not revalidated; this change targets map rendering, entry framing and ship corridor agreement.
