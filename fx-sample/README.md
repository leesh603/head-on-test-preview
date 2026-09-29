# FX sample round (direction check — not merged, not deployed)

Preview: open the game with `?fxs=1` (e.g. `index.html?fxs=1`). Without the flag nothing changes.

- `fx-sample-atlas.webp` / `.png` + `fx-sample.json` — sprite atlas and rects (2048×2048).
- `../fx-sample-preview.js` — swaps FX keys for atlas cells behind `?fxs=1`; adds tracer, rocket trail and bomb-fall drawing hooks.
- `../tools/fx-sample/gen.py` — regenerates the atlas (deterministic). `sheets.py` builds the review sheets.

Families: A machine gun (muzzle ×4, tracer core/glow, spark, hit puff) · B rocket (exhaust, trail, impact ×4)
· C bomb (fall shadow, ground blast ×4, debris, heavy smoke) · D fire/smoke (small ×4, medium ×4, engine fire,
flash, ground fire, flame jet, trail, puffs) · E cannon (COW / moteur hits ×4) · F heavy (boss/bomber ×4,
structures ×4) · G flak, shock ring, water splash/foam, dust, dirt, wing fire.

Round 2: glow budget cut (halos ~40%, cores smaller and cream, spark streaks halved).

Hooks touched (all gated by `FXS`): fx-art.js (`fx`, `fxTint`, `fxReady`, `fxImage`, tint cache),
app.js (player tracer line, bomb-zone / friendly-bomb fall).
