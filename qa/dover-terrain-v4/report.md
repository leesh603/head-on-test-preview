# Dover native-detail terrain revision

## Baseline and branch
- Source: `leesh603/head-on-aces-source`, latest main `e83603bdafd865f591d4fb3072222c50b52d299c`.
- Preview: `leesh603/head-on-test-preview`, latest main `e20435b9bce5d9a7264e6ae0515abaf5ea6331fd`.
- Both feature branches: `feat/dover-terrain-native-detail`.
- Prior Dover finite-map and bomber changes are already merged into both latest mains. This patch changes terrain rendering and its loading references only. The latest five-ace implementation is preserved.

## Before and after
The old 1024×1536 image was stretched across 6144×9216 world units, magnifying every pixel six times. Its side-view cliffs and enormous surf did not match the overhead aircraft or the navigation coastline.

The replacement uses the existing native sea and rural materials through TerrainRenderer. A newly authored 887×1774 transparent overhead chalk material is wrapped along the unique finite coastline, below its native pixel size. The coastline geometry never tiles or wraps. The map remains 6144×9216, with the existing wide flight limits and sea-only hull/wake navigation. Material coordinates stay fixed in world space; clipped triangle joins share world vertices, with a subpixel overlap to avoid raster hairlines. Only visible mesh segments are painted. No per-frame pixel processing or image allocation is added.

The new alpha WebP is lossless, retains the authored pixel dimensions, and has Git blob SHA `00af6005092dc816b20ddefab862c996f6f5bebc`. Sea was removed with the image-generation editor so the existing sea can show through. Its measured opaque band is x234–632 of 887; navigation clearance is retained inland of the rendered coast. Fixed batteries now follow the actual rendered land side.

## Changed files
`app.js`, `dover-night-view.js`, `index.html`, `stageboss-host.js`, `stageboss-view.js`, `test-lab.html`: focused renderer integration, cache queries, and coast-inspection positions. New `dover-terrain-render.js`, `terrain-dover-chalk-material-v4.webp`, and `tests/dover-terrain-native.test.mjs`. Source game paths are under `dist/`; source tests remain under `tests/`. Actual captures and this report are review files.

## Tests
- Dover focused tests: **48/48 pass** on source and preview.
- New terrain tests: native material layers, bounded draw counts, finite transforms, both shores/PC/mobile, world anchoring across vertical segment and material joins, full patrol hull clearance, and exact alpha-asset identity.
- Latest source main baseline: **848 tests, 526 pass, 322 fail**. Feature: **853 tests, 531 pass, 322 fail**. Normalized failing-test names are identical; no new failures. The existing failures prevent the npm test chain from reaching app-smoke.
- Preview baseline: **1116 tests, 1115 pass, 1 fail**. Feature: **1121 tests, 1120 pass, 1 fail**. The existing player-effects-import fixture remains missing on both.
- Preserved five-ace source tests: **23/23 pass**.

## Build
- Source `npm run build`: **exit 0**, Worker with 235 text assets and 229 encoded images; authored new WebP is copied intact. Production deployment was not performed.
- Preview `npm run build`: syntax checks **205 modules**; seven pre-existing validator failures also present in baseline (204 modules): make-gallery.js dynamic template path and six missing gallery-only boss assets. No new missing imports.

## PC and mobile runtime
Actual public branch gameplay was inspected at 1280×800 and 390×844 through Test Lab. Checked English and French shores, native-detail water, boats and wakes at sea, coast movement, and the northern finite boundary. Captures are exact browser JPEG bytes; no screenshots were synthesized or edited. The new ground draws before aircraft, projectiles, hazards and HUD. Captured runtime is the graphics implementation at preview commit `3874ebac8daabb59a4b035692a0fc12c50941e78`; subsequent changes only add review files and stronger terrain tests. Browser error logs contained extension metadata errors; no game-source exception was observed.

## Review and limits
Read-only combat/render review found no concrete defect. Browser visual checks cover raster clips and alpha blending that the Proxy unit tests cannot render. This is not an FPS benchmark, exhaustive multi-hour flight check, or a fresh full boss-mechanics validation. The map size, boss movement, attacks and hitboxes remain those of current main.

Two unchanged >1MiB archived asset-bank plane images (caproni_ca3.webp and salmson_2a2.webp) could not be materialized through the connector's contents API. They remain untouched in the remote Git tree. Worker build success verifies the available production staging and changed paths, not completeness of those two archived images.

## Deploy and commit
Feature branches only. No merge to main or production Site deployment. See the feature branch history for the final commit and this directory's index.html for actual before/after captures.
