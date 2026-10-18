# Arras squadron raid rework

Work began on test-preview main `7c6dfee9e82f5dd79632a8c926d440288f787cdf`.
Final upstream base `7ef9173991003e0b2f2a2ca9716ee8dafb45a77b` was integrated before the final commit; its four changed audio/Test Lab files were preserved with a clean three-way merge.
Branch: `feat/arras-squadron-raid`. No main merge or deployment performed.

## Scope and preserved content

Only Jasta 11 and Naval 10 opt into the entrance and final attack changes. Existing Baron/Collishaw aircraft, all four named wingmen, pilot labels, painted art, bullet FX, patrol flight/HP, wing HP, defeat transition and original formation behaviors remain. No game art assets, health budgets, attack damage tables, camera controls or player inputs were replaced.

Runtime files: `headon-stageboss-patterns.js`, `stageboss-host.js`, `engine.js`, `coop-engine.js`, `coop-view.js`, `app.js`, `headon-stageboss-runtime.js`, `headon-stageboss-hud.js`, `stageboss-view.js`.
QA: `test-lab.html`, `tests/arras-formations.test.mjs`, `tools/render-arras-formations.mjs`, this report and `qa/arras-formations/*.webp`.

## Actual entrance combat

The real leader and four once-launched wingmen enter usable screen positions. The entrance captures visible ordinary patrol NPCs and briefly includes other NPCs entering the same view. If fewer than two NPCs are available, the host requests one ordinary `spawnPatrol()` batch; it does not clone actors, alter NPC HP or delete them. Ordinary patrols bank back toward their patrol waypoint when leaving the encounter view. Reinforcement scheduling pauses during the captured entrance encounter.

Boss forward rounds travel through the existing solo/co-op swept hostile-round collision route. Damage, hit flashes, smoke and loss counts use `hitPatrol()`. The actual dying NPC stays in the patrol list while the existing `beginAircraftCrash` / `advanceAircraftCrash` choreography completes. Disappearance cannot count as an entrance kill. Player 2 and augmentation wingmen are excluded from the entrance victim roster; augmentation wingmen are excluded from Arras formation-round collisions.

Jasta wingmen converge for coordinated forward fire. Black Flight enters at separated front/rear positions, crosses from opposite flanks, and leaves the final captured patrol to Collishaw's actual gun. No forced last-kill HP write is used. Cut-in and boss HP display wait until the final crash interval ends. All player controls remain live.

## Tactics and final attacks

| Boss | Normal tactics | Loss response | Final attack |
| --- | --- | --- | --- |
| Jasta 11 | Encirclement → echelon attack → concentrated assault → pursuit, retaining the original cycle | Dead role disappears; surviving echelon slots compact | Surviving wingmen spread → staggered cross passes → Baron head-on pass |
| Black Flight | Pair split → bait pass followed by rear/flank hunter → alternating cross attack → Collishaw head-on | Incomplete pair regroups; regular cooperation and already-queued final cooperation stop | Surviving complete pairs: bait, hunter, next pair; Collishaw follows last |

The final triggers once after entrance recovery at leader HP ≤32% or at most one wingman remaining. A 4.5-second approach precedes the passes. Each wing gets 1.2 seconds of visible nose-direction warning, a 0.6-second committed straight pass, and a 1.8-second slot. The leader warns for 1.25 seconds before its final straight pass. Warnings follow the actual aiming nose; committed projectiles keep the locked heading. Gun origins match the actual nose, and the old automatic omnidirectional suppressive fan is disabled for these two forward-gun formations. A 2.4-second recovery follows the finale.

Black pair losses cancel queued cooperation, even if a final order was already given. Role snapshots do not respawn dead wingmen. A leader-only final remains possible. Breaking either Black pair member removes that group's coordinated rear attack; breaking Jasta wingmen removes their cross-pass direction. Turn out of the warning line after aim commits, then close in during recovery.

## Verification

Automated checks use real `Game` / `CoopGame` update, real NPCs, actual rounds/collision and actual crash state. Thirteen targeted tests cover:

- 960×700 solo, 390×844 solo and 1280×800 co-op entrances for both bosses.
- All five original boss aircraft fire; original NPCs die from boss rounds and finish crashing; fatal hits stay inside the usable viewport.
- Collishaw fires the final fatal Black Flight round.
- Real steering input during entrance, permanent/temporary augmentation wingman exclusion.
- Distinct Jasta phases, survivor role removal, no resurrection, victory/region transition and fresh restart.
- Black pair loss, including cancellation after a final was queued.
- Leader-only fallback; full five-aircraft final warnings/shots, at most one active wing pass, and a successful unprotected turn route for both bosses.
- Ordinary patrol fallback and rejection of disappearance as a fake kill.

`qa/arras-formations` contains 16 automated production-terrain/painted-aircraft/boss-renderer frames: approach, crash, formation and final for both bosses at 390px and 1280px. These are **automated renderer evidence, not browser gameplay screenshots**.

Test Lab adds Arras-only QA controls: named aircraft collision-test rounds, a leader HP-30% final-entry round, and selection of the existing tactical cycle. These controls do not respawn aircraft or bypass the entrance.

Full suite: **766/766 passed**, zero skipped. Build: **179 JS modules syntax-checked**, 1,587 imports resolved and zero missing. Test Lab inline JavaScript syntax checked separately. The same 766/766 result and build checks passed after upstream integration; final entrance headings were rechecked with all 13 targeted cases.

## Browser checks and limitations

The existing live GitHub Pages Test Lab was opened and the existing Jasta and Black Flight mobile scenes inspected for baseline art/UI comparison. A branch-review attempt at the source checkpoint `6a4ed60cb0add85f677f82219a0c6e20de5bcf19` returned HTTP 429 from raw.githack; one reload did not provide a playable branch session. No publication/deployment was used to work around the restriction.

**The revised branch has not passed browser play verification.** Touch-device frame rate, real browser co-op gameplay, final difficulty/feel and unrestricted player escape trajectories remain unverified. Automated fixed-seed routes and rendered frames establish the implemented collision/sequence behavior, not exhaustive fairness under every player movement or actual mobile GPU performance.
