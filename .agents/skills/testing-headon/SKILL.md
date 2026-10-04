---
name: testing-headon
description: How to drive and verify the HEAD-ON WWI shmup (hangar → solo/coop sorties) on the live GitHub Pages test server, including the built-in Test Lab, debug() state probes, deterministic collision/gas staging, and the known coop prototype-copy crash signature.
---

# HEAD-ON test server testing

Target: `https://leesh603.github.io/head-on-test-preview/?v=<build>` (GitHub Pages; bump `?v=` when a new build ships; allow ~1min for CDN after deploy).

## Built-in Test Lab (biggest time-saver)
`window.__HEADON_TEST__` is installed on the Pages build (app.js ~line 1086). Use it instead of long natural play:
- `__HEADON_TEST__.catalog` — pilots/planes/regions.
- `__HEADON_TEST__.start(options)` / autostart URL params: `?headonTest=1&region=N&pilot=X&ace=Y&boss=1&invincible=0&autostart=0`. Test mode defaults invuln=∞ and nextBossAt=∞ (pass `invincible=0` for damage checks).
- `__HEADON_TEST__.debug()` → the **live Game/CoopGame instance** — read `t`, `state`, `bullets`, `enemies`, `gasZones`, `stageBoss.stages.stageIndex`, `players[]`, etc.
- `status()` for a compact summary.

Regions 0–7: 전원 지대 / 아드리아해 / 참호 전선(gas) / 포화 / 도심 / 고공 / 알프스 / 제브뤼헤 군항.

## Fast staging tricks (console)
- **Region jump (solo):** `debug().distance=12000*N` or set `debug().stageBoss.stages.stageIndex=N` — for stageBoss-driven games also set `orderPosition=order.indexOf(N)`, `phase='explore'`, `encounter=null` (the test lab's own 4-field jump; a bare stageIndex write desyncs the addon).
- **Gas zones:** world-anchored and expire fast — push a pinned zone: `g.gasZones.push({x:g.x,y:g.y,r:185,warning:2.5,life:30})`.
- **Hunt marker (baron):** the bracket draw window is only ~0.35s — hold `g.huntDesignate=0.2` via setInterval to screenshot it.
- **Swept/elite collision check:** push a synthetic friendly bullet `g.bullets.push({x,y,vx,vy,enemy:false,damage:12,collisionRadius:6,life:2,hit:new Set()})` aimed at an elite member; read `members[i].hp` before/after.
- **Elites:** solo endless only; `g.distance=36000` → progressStage 4 → squadron spawns in ~2s.

## CRITICAL — coop crash signature
Coop freezes at t≈0.05–1s with a dark canvas: uncaught `TypeError` inside `frame()` kills the rAF loop **permanently** (no recovery until reload — even returning to hangar and restarting stays dead). Known missing methods in the coop prototype copy-lists (`coop-engine.js` line ~37 for PlayerState, ~line ~233 for CoopGame): `inSmoke`, `_pickHeavy`. Symptoms: `this.inSmoke is not a function` (trench-war1.js tailEligible) / `this._pickHeavy is not a function` (engine.js spawnEnemy, heavyBomber spawn). To unblock and verify coop mechanics anyway: `Object.defineProperty(Object.prototype,'inSmoke',{value:gp.inSmoke,...})` with real Game.prototype methods grabbed from a live solo game via `Object.getPrototypeOf(debug())`. Do **not** blanket-copy all Game methods onto Object.prototype — names like `hit` collide with bullet data fields (`b.hit??=new Set()` then `b.hit.has` crashes).

## Coop flow
Header **PC 2인 협동** → coop panel → P2 select (default voss) → same 출격 button. P1: WASD/Space/E/R; P2: arrows/RShift/Enter/`\`. Auto fly+fire. P-down → 15s respawn. Coop hidden under `pointer:coarse` (mobile emulation) — expected.

## Mobile viewport
DevTools device toolbar (Ctrl+Shift+M) → set 390×844. At ≤720px width the game uses pixelScale ~0.8 + mobile layout; touch controls (joystick + 선회기동/액티브) appear when the device emits pointer:coarse. Verify: sprites identifiable, no black regions, no giant FX covering the player, ~60s without stutter.

## Console hygiene
After ANY page reload, stale errors from a previous session do not carry — but crashed rAF loops persist as a frozen canvas. Arm `window.addEventListener('error'/'unhandledrejection')` early to capture which line killed the loop — the console's own error pane may be flooded by per-frame repeats.

## Devin Secrets Needed
None — public GitHub Pages site.
