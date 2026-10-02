# Mobile hot-path optimization — 2026-10-02

## Baseline and scope
- Repository: `leesh603/head-on-test-preview`.
- Baseline: `ce0110523bf5d08f4cfa7467490a649bb6f2cb59` (v499), the most recent deployment target named in the conversation. The current production URL could not be fetched, so live equality is NOT verified.
- Branch: `perf/mobile-hotpaths-v499-20261002`.
- Three runtime files only. No FPS caps, resolution/asset changes, effect thinning, gameplay changes, version-pin edits, ranking changes, merge or deployment.
- The newer v500 battery-saver patch is not included. Its `war-ambience.js` changes overlap this file: preserve those controls when integrating into newer main; do not overwrite the whole newer main with this branch.

## Changes
1. `collision-grid.js`: collision-free numeric cell keys in the normal range, original string fallback for distant cells, reuse only the last query's sorted indices, clear only used buckets. Re-materialize enemy references every query. Original candidate order, complex-boss inclusion and exact collision path remain intact. Unsafe integer coordinates fall back rather than risk a non-advancing loop.
2. `war-ambience.js`: cache deterministic emitter seeds only for the current viewport cell range; reuse arrays and fixed ember/bird seeds. No accumulated world-history cache. All drawing commands, effects, density and phases remain unchanged.
3. `flight-viewport.js`: coalesce address-bar/orientation/viewport event bursts to one pending callback; skip unchanged CSS-height writes; cancel pending work on unlock and do not schedule viewport work in the hangar. Touch and fullscreen behavior preserved.

## Validation
Run `node --test tests/mobile-perf-20261002.mjs` in a full clone. The script obtains its immutable original fixtures using `git show` and checks all three Git blob hashes. No network or packages required.

12 tests passed: 20,000 randomized candidate comparisons; negative/distant coordinate boundaries; complex bosses and fallbacks; source/result mutation; cache invalidation/retention; 2,400 exact Canvas-command frame comparisons across all 12 regions; resize bursts, pinch, dialog gestures, unlock, dvh and no-rAF fallback.

Separate isolated Chromium renderer test: 72 frames at logical 390x844, render scales 1.0 and 0.8, deviceScaleFactor 3. Compared 19,431,360 pixels; zero differing pixels. This is NOT full-game testing or a physical phone test.

## CPU microbenchmarks
Run `node tests/mobile-perf-20261002.mjs --benchmark`.
Node v22.16.0, four warm-up pairs and median of nine alternating-order samples:

| Isolated workload | Before | After |
| --- | ---: | ---: |
| Grid: 120 enemies, 360 dispersed projectiles, 200 frames | 29.598 ms | 21.655 ms |
| Grid: same count, grouped volleys, 200 frames | 28.413 ms | 9.582 ms |
| Region 3 ambience JS, 10,000 frames, no-op drawing context | 28.485 ms | 10.209 ms |
| Viewport burst: 200 events, queued callbacks | 200 | 1 |
| Same viewport burst: CSS writes | 400 | 1 |

Ambience sine calls over 600 frames: 96,600 -> 30,065. Timings depend on workload/JIT/hardware. They do not measure whole-game FPS, GPU load, phone temperature, power use, or battery duration.

## Release / rollback
Review/test this branch before integration. Keep the existing coherent version-pin release process when eventually deploying; this patch does not repin modules individually. The patch is one commit and can be reverted as one commit. Baseline SHA above remains the rollback reference. No production/test-server deployment performed.

Remaining verification: full-game solo/co-op and long physical-phone sessions, especially heavy bosses, pilot actives and background/resume. Do not report phone heat or total-frame-time improvements as measured until those checks are performed.
