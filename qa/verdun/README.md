# Verdun siege refinement — implementation review

Base: latest test repository main `ef5a55e6472cba80b30cc3e0b2527403ea64a388`, rechecked 2026-10-08. The requested `7a8775c` was not the latest main. No main merge or deployment is included.

## Changes

- Keep the current giant fortress dimensions, approved atlases, part layouts, hitboxes, HP budget and existing sound/FX assets.
- Blend world-aligned terrain into the outer hull berm with a cached alpha mask; reduce the detached contact shadow. Internal walls and courts retain their original artwork.
- Register muzzle origins with animated barrel recoil. Keep damaged mount artwork in place, ease into wreck artwork, animate pit opening/closing, and show AA restoration using existing intact/wreck frames and repair FX.
- Douaumont: retain staggered heavy artillery and original flank/core dependencies; add a final alternating barrage from surviving heavy guns, an open central escape lane and a reload interval.
- Souville: retain sequential pits, observation artillery and command reserves; add surviving-pit final resistance, weakened by observer/command destruction, followed by a reload interval.
- Cancel pending AA restoration immediately when its ammunition is destroyed. Destroyed mounts cannot contribute to final attacks. Replace imaginary central firing sources with surviving authored mounts.

## Verification

`node --test tests/verdun*.test.mjs`: 37 tests passed. Covers existing encounter ownership, geometry, part destruction/exposure, AA repair, collapse/reward/region transition; added final-barrage escape lanes, genuine muzzle positions, transition state, pause, and real OnlineCoopGame host/guest state synchronization.

`npm run build`: passed; 180 modules checked, 1,590 imports resolved, 7 dynamic/dev imports skipped, 0 missing. `git diff --check`: passed.

`tools/qa-verdun-render.mjs` renders the existing native fortress/map/FX modules at PC 1280×800 and mobile 390×844 for intact, firing, damaged, wreck, repair and ammunition/core states. Run with `CANVAS_MODULE` pointing to an installed `@napi-rs/canvas` module; `QA_ROOT` selects a before/after checkout and `QA_OUTPUT` selects an output folder. These are offline renderer snapshots, **not browser gameplay screenshots**. Its native timing samples do not establish browser/mobile FPS.

## Outstanding acceptance checks

The public test lab's existing deployed Douaumont was opened and inspected. The modified branch was not deployed, in accordance with the request. The browser could not access the local test server, so modified actual gameplay, before/after in-game comparison, mobile frame stability, and complete manual solo/two-player clear-to-region-transition runs remain unverified. The automated tests and offline renders do not satisfy these mandatory manual criteria.

This branch is an implementation for review, not a claim that every requested quality gate has passed. Main and its existing deployed version remain preserved. Entrance staging uses the existing fortress approach/offscreen artillery behavior; this change does not add a new entrance sequence.
