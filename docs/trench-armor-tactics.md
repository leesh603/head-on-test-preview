# Trench armor tactics (A7V / Mark V only)

Base: `30cd6b569a9396c18f025a2bd60924ac9f3c4da0` (`origin/main`). Started on `761781d9cc43677b0e83460f8c9ccee1a9773882`, refreshed to `829645ea` for upstream HUD fixes, then refreshed to `30cd6b56` after the rural raid merge and its `raid1` module repin. Upstream raid changes are preserved; only the trench tank changes were reapplied, with matching current module tags. Main merge/deploy is not part of this change.

## Shared physical rig

Differential drive integrates left/right belt velocity, acceleration, braking, reverse, and hull yaw. Track animation phase comes from signed distance travelled by that belt, not elapsed time. The same live hull transform positions guns, recoil endpoints, searchlight, engine and part hit volumes. Narrow existing casemate traverse limits remain unchanged. A destroyed belt stops its animation and reduces turning to 0.14 rad/s; both belts destroyed prevent rotation. A7V engine destruction immobilizes the hull; Mark V retains a slow crippled crawl. Bounded ground marks (80 max, 9-second lifetime), per-belt dust, physical chassis rocking, and integrated gun recoil reuse existing FX.

HP, base damage, and destruction illustrations are unchanged. Existing armor opening rules, exposed hull gun, engine vent, part cancellation and defeat sequence remain active. Damage crossing 70%/35% pauses at that phase boundary; the final pattern has a short arrival protection, not additional health.

## A7V

- 2-second engine/track approach, intact-to-crushed barbed wire, then destructible searchlight capture.
- 100–70%: short advance, brake, sequential warned gun ports, reverse/reposition.
- 70–35%: steering reposition, illumination improves prediction/scatter; precision flak alternates with separated crossfire brackets.
- Below 35%: more active reposition and steel hunting net.
- Steel turret: 0.9-second brake, real counter-driven tracks and 4.8-second hull pivot, sequential surviving ports. Their narrow cones leave rotating gaps. Destroying a port removes its entire lane.
- Hunting net: searchlight follows the chosen pilot, real pivot salvo, then 1.2-second warned predictive flak brackets with an open centre and a 2-second stopped counterattack window. Searchlight destruction cancels its beam and removes the accuracy bonus.

## Mark V

- 2.4-second heavy approach over an intact-to-crushed timber-lined trench, track noise and dirt.
- 100–70%: continuous forward pressure with warned alternating sponsons; a short reverse regroup prevents endless advance.
- 70–35%: heavy steering toward the pilot, moving broadside and wide approach turns.
- Below 35%: put the surviving sponson toward the pilot, exposing the ruined side less while pressing closer.
- Steel waltz: 2.5-second wide arc, 0.85-second hard brake, actual counter-driven pivot for 3.8 seconds. Time-offset surviving sponsons fire narrow fans through their unchanged ports, leaving moving safe directions.
- Landship runaway: 1.1-second warning, 2.4-second accelerated advance with side blockades, hard brake, pivot salvo, 1.15-second final breakthrough with warned live-muzzle shots, then a 2.1-second stopped counterattack window.
- One belt destroyed immediately clamps the surviving belt and angular speed. Two belts stop the pivot. Engine destruction reduces acceleration, charge distance and turning; a destroyed sponson cannot fire scheduled or rotating salvos.

## Asset provenance

Built-in `image_gen` generated new transparent raster sprites against the original `boss-a7v-hull-rebuild.webp` and `boss-mark-v-hull-rebuild.webp` style references. Original hull/weapon/damage assets were not regenerated or overwritten. Only alpha crop, resize and atlas packaging used ImageMagick; no semantic repainting or screenshot composition.

- `boss-trench-treads-20261008.webp`: 512×512 lossless RGBA, four A7V gray-steel phases (top row), four Mark V mud-brown phases (bottom row). Cells 128×256, centered visible belt 64×240.
- `boss-trench-wire-20261008.webp`: intact/crushed flat overhead wire rows. The second generation corrects side-view posts to overhead stump discs.
- `boss-trench-crossing-20261008.webp`: 768×512 lossless RGBA, intact/crushed overhead timber-lined trench rows for Mark V entry.
- Existing searchlight + wreck, tank hulls, gun wrecks, engine breaches, dust/smoke/fire and tank defeat FX are reused.

Track generation brief: “Transparent overhead WWI tank tread animation sprite atlas, 4 columns × 2 rows. Top row A7V cold gray weathered riveted steel, bottom row Mark V warm brown muddy metal matching the referenced existing overhead painted game hulls. Four distinct sequential link-offset phases per tank, consistent length/width and overhead lighting, rich realistic wear, individual exposed plates, no hull, labels, shadows outside sprite, or background.”

Wire generation brief: “Two transparent horizontal overhead sprite rows of WWI barbed wire, three parallel strands with muted brown rusty wire and weathered wooden stakes matching the existing painted game art. First intact, second crushed with an open tank-width gap. Keep generous transparent separation.” Correction: “Keep the two rows and materials, but replace all upright side-view cylinder stakes with small round top faces visible straight from above; all wire lies parallel on the ground plane, no visible vertical height. Preserve alpha and crushed centre gap.”

## Reproduction

`node --test tests/trench-armor-gun.test.mjs tests/trench-armor-tactics.test.mjs tests/trench-armor-online.test.mjs`

`npm test` / `npm run build`

`PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chrome-headless-shell node tools/qa-trench-armor.mjs`

`PLAYWRIGHT_MODULE=/path/to/playwright CHROME_PATH=/path/to/chrome-headless-shell node tools/qa-trench-online.mjs`

The browser script starts the repository's real local test server, opens the real app/Test Lab, applies damage through native part/hull hit paths, runs native update frames and real RAF input, and captures actual rendered canvas/UI. It does not create mock screenshots. `QA_BOSS` and `QA_VIEW` can isolate a boss or viewport.

Known baseline race: the unchanged `app.js:748` `iconsReady` callback calls solo `hud()` even in local coop. Opening Test Lab before all icon loads complete can throw `weapon.gunProfile` undefined. This exact callback existed in the initial SHA `761781d9`; upstream HUD work arrived in the refreshed main. The boss QA waits for `iconsReady` in the hangar before starting coop; no unrelated UI/system fix is bundled here.

## Changed files

| Files | Change |
| --- | --- |
| `headon-stageboss-patterns.js` | Only TrenchArmor/A7V/Mark V drive, phases, port attacks, final tactics and part effects |
| `trench-armor-drive.js` (new) | Differential physics, signed belt distance, bounds, rocking, recoil and trail caps |
| `trench-armor-render.js` (new) | New tread frames, entry overlays, existing dust/engine FX |
| `stageboss-view.js` | Trench asset lifecycle, actual track/entry drawing, live port/hull-gun warnings |
| `headon-stageboss-render.js` | Publish the same live belt/hull/entry state to the renderer |
| `headon-stageboss-runtime.js` | A7V attached searchlight pose only |
| `boss-feedback.js` / `sfx.js` | Targeted phase tips and rate-limited mechanical audio |
| Three `boss-trench-*-20261008.webp` assets | New transparent tread, wire and trench atlases |
| `tests/trench-armor-tactics.test.mjs` / `tests/trench-armor-online.test.mjs` | Native tactic/physics/damage/cap/pause and host/guest tests |
| `tools/qa-trench-armor.mjs` / `tools/qa-trench-online.mjs` | Actual branch app browser + live-relay QA runners |
| `reports/trench-armor` / this document | Actual captures, machine-readable checks, reproduction and limits |

No hull/destruction asset, other boss class, base HP/damage, main ref or deployed server was changed by this branch.

## Validation

- Refreshed main: `30cd6b569a9396c18f025a2bd60924ac9f3c4da0`.
- `npm test`: **674/674 passed**. Focused existing gun + new tank + online protocol tests: **27/27 passed**.
- `npm run build`: **179 modules syntax-checked, 1,587 imports resolved, zero missing**.
- `git diff --check`: passed.
- Actual Chromium 155 branch app at a local test server: desktop 1280×900 solo and 390×844 touch-capable viewport local coop for each boss. Native phase gates, actual rotating chassis/opposite belts, warnings/projectiles, destroyed tracks/engine/ports, wreck FX and encounter clear checked. Four solo/local-coop scenarios passed with zero page/frame errors; see `browser-results.json`.
- Two-minute native solo/coop mobile-width simulations: finite live coordinates, bounded ground marks and hazard counts, no pool drops, pause stops mechanics.
- Actual online browser QA: two separate Chromium processes join a real local relay through the native room UI. For **both bosses**, PC host / mobile guest agree on counter-driven belts and hull yaw, a broken belt freezes on the guest, and a real CDP touchscreen joystick turn runs through RAF and the relay. Both scenarios passed with zero page/frame errors; see `online-browser-results.json`. Tests explicitly point the client at the local relay; no production relay configuration is changed.
- Real host/guest protocol tests: belt phase/speed, yaw, mounts, ground marks and destroyed parts survive serialization and render from the guest state.

### Limits

These are controlled Test Lab scenarios: damage and elapsed combat are advanced through native hit/update paths, and coop automatic-fire timers are temporarily held during observation to keep pilots from clearing the boss before the requested phase capture. Short real RAF input also runs. This is not a natural campaign clear or a human difficulty assessment.

Physical mobile frame rate/thermal behaviour, audible audio quality, public deployed test-server gameplay and real internet latency are **unverified**. The app was tested from the branch locally; the public main build was not merged or deployed. Headless software rendering is not a mobile FPS claim.


Trench crossing generation brief (built-in `image_gen`): “Production transparent straight top-down WWI trench atlas, two wide horizontal strips. Muted muddy umber/ochre/gray, detailed painted timber revetments, boards, sandbags and feathered irregular earth fringes. First intact; second with centre crushed and bridged by a heavy tank, flattened timber, crumbled soil and perpendicular tread compression. Same scale/alignment, no tank/humans/flames/text/scenery; transparent gap and surrounding area.” Source generated RGBA 1536×1024 was resized to the lossless 768×512 atlas.

Review captures: actual branch app pixels, converted from the browser PNGs to WebP for a smaller repository footprint. No scene/content editing or screenshot compositing. Full phase/damage snapshots are in the JSON reports.

| Actual captures | A7V | Mark V |
| --- | --- | --- |
| Entry | [Wire entry](../reports/trench-armor/a7v-flak-desktop-solo-entry.webp) | [Trench crossing](../reports/trench-armor/mark-v-cruiser-desktop-solo-entry.webp) |
| Real hull pivot | [Hunting net](../reports/trench-armor/a7v-flak-desktop-solo-final.webp) | [Landship waltz](../reports/trench-armor/mark-v-cruiser-desktop-solo-final.webp) |
| Original wreck FX | [A7V defeat](../reports/trench-armor/a7v-flak-desktop-solo-wreck.webp) | [Mark V defeat](../reports/trench-armor/mark-v-cruiser-desktop-solo-wreck.webp) |
| Live online mobile guest | [A7V guest](../reports/trench-armor/a7v-flak-online-mobile-guest.webp) | [Mark V guest](../reports/trench-armor/mark-v-cruiser-online-mobile-guest.webp) |
