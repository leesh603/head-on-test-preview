# Gallipoli siege refinement — 2026-10-08

## Status and base

- Repository: `leesh603/head-on-test-preview`.
- Branch: `feat/gallipoli-siege-20261008`.
- Initial freshly verified main: `ae5166462ca5aa6bc5f3f762f3ae8d8a85cabb6c`.
- Final base after main advanced: `188b144cfa4c75d52ed8d9ec18ee2b687bc1ab00`.
- Tested/pushed implementation: `b7fbff39405b2b3df835bf8a1c1f3ba079122525`.
- Scope: Gallipoli Grand Fortress / Dardanelles siege only. Main was neither merged nor deployed.
- **Implementation and automated verification are complete. Modified-branch browser gameplay and a real in-game before/after comparison remain incomplete.**

## Implemented behavior

The installed fortress is revealed as the camera reaches its existing fixed world position. Its preview appears when the authored extent reaches the viewport. The shortened shoreline (2800), cliffs (4000), fortress (8000), and lateral travel limits remain unchanged. Three approach shots come from actual western, eastern, and rear battery muzzles. The preview's turret pose carries into the encounter without moving or growing the fortress.

Coastal defense selects guns from opposing wings, permitting either destruction order. Twin guns fire a rapid pair; howitzers use a longer interval. Each shell waits for its real turret to align, then gets its own muzzle flash, recoil and flight from that muzzle to the fixed warned impact. Destroying a queued battery removes its remaining shots. Destroying local ammunition removes the second shell; losing the observer lengthens the warning. The rear citadel takes the main artillery role when both coastal sectors are disabled. Final defense follows the remaining offensive facilities and health, without adding damage gates.

The last barrage uses one surviving battery per sector, in west/east/citadel order, with an independent central finish if command remains alive. No destroyed facility rejoins a queue after repair. Removing command omits its finish; clearing all outer guns leaves central independently capable of fighting. The existing artillery safe corridor remains 160 world units wide. Prior battery AA/ring shots are cleared at final preparation and those attacks pause through the barrage/reload window. Each planned impact clears the corridor by its damage radius plus a 12-unit player radius. Existing interceptors retain their own attacks, so this corridor guarantees artillery clearance rather than immunity to all enemies. A 2.4-second artillery recovery follows the last impact.

All 13 installations, free destruction order, HP accounting, 18-second repair, two-second post-repair firing grace, hangar launch positions, four-interceptor cap, faction aircraft and original win condition remain. Repairs use existing wreck/damaged/intact atlas columns with short transitions: a long blurry crossfade was excluded after visual inspection. Destroying command still stops repair and new sorties while surviving guns resist. Central and AA muzzle offsets were calibrated to their authored gun sizes, including recoil.

## Files and artwork

- Combat: `gallipoli-boss.js`.
- Existing route and preview: `gallipoli-route.js`, `gallipoli-view.js`.
- Gallipoli-specific host/render dispatch and hints: `stageboss-host.js`, `stageboss-view.js`, `boss-feedback.js`.
- Verification: `tests/gallipoli-stage.test.mjs`, `tools/qa-gallipoli-engine.mjs`, `tools/qa-gallipoli-render.mjs`.
- This report: `docs/GALLIPOLI_SIEGE_20261008.md`.

No image, damage atlas, terrain, sound or cut-in asset was changed. Existing ordnance/muzzle/ground-impact artwork is reused. The render QA tool now writes only to its scratch output folder and never overwrites the shipped cut-in asset. No new AI or physics framework was added, and shared integrations are conditional on Gallipoli.

## Verified results

| Check | Result and limits |
|---|---|
| Gallipoli automatic tests | **26/26 passed** on the final base. Includes all component hit locations, repairs, HP accounting, free destruction order, phase changes, staggered aligned shots, ammo/observer effects, final variants, quiet recovery, approach shells, defeat, next-stage transition and a fresh attempt. |
| Full repository tests | **834/834 passed** after materializing required existing test files and installing the declared `ws` dependency. No dependency manifest changed. |
| Syntax/import validation | **180 modules parsed; 1591 imports resolved; zero missing references.** `git diff --check` passed. |
| Native Game/CoopGame | **8/8 combinations passed:** solo/local coop × both factions × 390/1440 widths. Each ran 60 seconds, then checked command-first destruction, halted repair/sorties and fortress defeat. Damage adapters and pause were checked; hazard pool dropped zero entries. This is scripted engine QA, not browser/device gameplay. |
| Native renderer | Original assets decoded with zero missing files. PC/mobile, both enemy factions, damage, repair stages, final barrage and hangar sprites inspected. Five matched before/after approach terrain frames were pixel-identical. This is the game's renderer through native canvas, not a browser screenshot or FPS measurement. |
| Published test server baseline | Test Lab PC entry/fortress view and mobile-size local-coop launch/render observed before the changes. These short observations do not constitute a full gameplay acceptance pass. |
| Modified-branch browser | Commit-pinned Test Lab HTML opened, but the game bridge failed to connect. One refresh/reconnect still returned **`Test bridge 연결 실패`**; no modified-branch combat could be started. No deployment was made to work around this. |

Reproduction:

```sh
node --test tests/gallipoli-stage.test.mjs
npm install --ignore-scripts --no-package-lock --no-save
npm test
npm run build
node tools/qa-gallipoli-engine.mjs
HEADON_QA_CANVAS=/path/to/@napi-rs/canvas HEADON_QA_OUT=/tmp/gallipoli-render node tools/qa-gallipoli-render.mjs
```

## Outstanding acceptance work

The requested modified-build test-server playthrough is **not verified**. All eight requested gameplay criteria still need real browser acceptance: complete coast/cliff discovery; sector differentiation; destructive facility effects; repair and sorties; final barrage triggering/dodging in destruction variants; art/FX/hit alignment in motion; PC/mobile and one/two-player play; defeat/restart/next-region flow. Their automated/native checks above must not be reported as that playthrough.

The real in-game before/after comparison, mobile touch input, subjective difficulty/evasion feel and browser performance also remain unverified. The branch is available for review; this report does not authorize a merge or deployment.
