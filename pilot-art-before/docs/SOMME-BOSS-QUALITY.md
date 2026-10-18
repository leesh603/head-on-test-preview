# Somme boss quality review

Initial main: e90905055ff8fed033f9acdb96b2bd5763715d69. Final upstream main incorporated: 7a8775c9f7af5c8f40a0a50b2c2b48b766fce32b (Arras merge arrived during this task). Branch: feat/somme-boss-quality. No main merge or deployment.

## Mark I checkpoint

Live baseline Test Lab: stage 10, baron, 390×844 and 1280×800. Original authored hull/sponson/track art and three independent vehicles confirmed. The old immediate 90px spawn placed tanks beside/behind the aircraft; forward flight lost the important approach within about two seconds.

Changes retain all original atlases, independent HP, sponson traverse, stop-before-cannon, female covering fire, track slowdown/bias/immobilization, swept collision and wreck rendering. Production and Test Lab now approach real tanks ahead of the aircraft; the male leads, females follow and spread with native drive. Visible movement gates discovery/HUD/cut-in. Independent flank headings and speeds replace identical escort legs during flank pressure or formation losses.

At combined HP ≤35% (also reached by two full hull losses), surviving hulls align, drive, then stop. A surviving male commits one longer warned cannon salvo; surviving females use separate firing windows. Three seconds of stationary reload permit counterattack. Broken tracks remain fixed and destroyed weapons never fire. No new assets or common AI system.

Automated checkpoint: 26 Somme tests passed, including original drive/traverse/muzzle/atlas/collision/coop cases and new visible-entry/final-push/loss/immobilization checks. Actual revised-branch play and before/after quality judgment remain pending. Test Lab adds ordinary friendly projectile stimuli for part damage, final HP threshold, and individual hull kills.

## Verification boundary and remaining work

**This is not a completed two-boss rework.** The revised branch QA page at rawcdn.githack.com returned HTTP 429 after its external-content notice and one reload. The synchronized local-file browser preview was rejected by browser URL policy (only HTTP/HTTPS allowed). No attempt to bypass that policy or deploy was made. Actual revised-branch gameplay comparison cannot be completed through the available browser routes. User requires this before quality approval and before Schwaben, so Schwaben work is deferred.

The latest Mark I refinement corrects outward flank steering and aims female sponsons during preparation so their short firing windows actually produce shots when reachable. Final fire remains limited by real traverse, settled hull, live mount state and tank losses. Approaches, discovery/HUD changes and QA entry distance are restricted to Mark I; Schwaben keeps its original placement and combat behavior.

Automated: all 771 repository tests passed (no skips); 27 Somme tests passed; syntax 180 modules/imports 1588 targets, zero missing; Test Lab inline JS and QA tool parse. Native Game and production terrain/boss renderer captured entry, final drive, cannon lock, staggered MG stage, counter window, part damage and wreck on 390×844 and 1280×800. All use original atlases; hazard pool dropped zero. These 16 frames are **automated renders**, not actual browser gameplay or a mobile FPS measurement.

Unverified: revised-browser first attack/cut-in timing, subjective before/after movement and impact quality, realistic dodge routes through every final volley, browser local coop, mobile frame rate, actual player boss defeat/restart/region transition and ranking-server integration. Original live PC/mobile art and motion were viewed; original complete part/wreck destruction was not exercised in that live session. Automated tests cover damage, surviving mounts, native host collision, solo/coop, defeat ownership and disposal, but do not replace those live checks.

## Modified files

Runtime: `somme-boss-combat.js` (Mark I tactics and MG preparation), `somme-landship-drive.js` (native drive orders), `somme-boss-render.js` (existing cannon windup radius/duration), `headon-stageboss-patterns.js` (actual male-leading entry layout), `headon-stageboss-runtime.js` (Mark I approach only), `headon-stageboss-hud.js` (Mark I discovery), `stageboss-host.js` (Mark I forward approach/discovery), `app.js` (Mark I cut-in and QA spawn), `boss-feedback.js` (Mark I tactics/original sound cues). Existing source files stay in place; no art or sound asset additions.

QA: `test-lab.html` (Mark I projectile stimuli only), `tests/somme-quality.test.mjs`, `tools/render-somme-quality.mjs`, `qa/somme-quality/*`, this report. No other region or boss tuning/behavior changes.

Run: `npm test`; `npm run build`; `node --test tests/somme-{quality,boss,rework,host}.test.mjs`; `HEADON_QA_CANVAS=/path/to/@napi-rs/canvas node tools/render-somme-quality.mjs`.
