# Online Co-op MVP — test-preview only

Baseline: `leesh603/head-on-test-preview/main` at
`4c0bdbe0c1f7ec69189fa8411c3ef37c9a5fef2e`.
Branch: `codex/online-coop-mvp-20261007`.

This branch adds playable two-browser co-op. Neither test main nor production
is merged or deployed. A public relay has not been provisioned.

## Run locally

Use Node 22 or newer. Install the locked dependencies, then run:

```sh
npm install
npm run dev:coop
```

Open `http://127.0.0.1:8787/` in two independent browser sessions. Select pilots
from the same faction, open **온라인 Co-op**, create a room in the first session,
and enter its six-character code in the second. Both players press **준비**.
Both clients use their usual keyboard or touch controls for their own aircraft.
The existing automatic weapons fire on both aircraft.

The equivalent pnpm commands also work. This Windows verification environment
has bundled pnpm but no npm executable.

## Transport and ownership

`server/coop-relay.mjs` is a separate, in-memory Node WebSocket relay using `ws`.
It handles two seats, room codes, readiness, reconnect tokens, heartbeat,
message limits and role-based routing. It never simulates combat or submits
scores. No existing ranking backend was modified; the inspected test repository
contains a static Pages deployment and client ranking calls, without its server
implementation.

`OnlineCoopGame` reuses the existing `CoopGame`. Only the Host advances the world:
seeded RNG, Battle Director, spawning, AI, damage, deaths, boss phases and parts,
stage progression, upgrades and revival. Guest code does not call the world
update or collision loop.

Networking runs at 15 Hz while the existing RAF renders. State includes compact
pose tuples and changed entity fields; unchanged descriptors are not resent.
Projectiles send their initial trajectory and retirement, with Guest visual
integration between messages. Guest movement reacts immediately, then smoothly
reconciles to Host positions. Other entities interpolate. Each camera follows
its own pilot; a 1,100-world-unit soft tether discourages excessive separation.
The bounded codec preserves Maps, Sets, timers and exact HP, and omits callbacks,
collision caches and cyclic world links. Full snapshots recover the initial
baseline, rejoining clients and send backpressure.

Single-player mode creates no online socket or synchronization timer. Core engine,
Director, assets and production `dist/` were not edited. Existing Co-op balance
and AI wingmen are reused; no new blanket two-times HP multiplier is added.

## Upgrades, death and connection loss

Upgrade approach **A**: shared XP awards and stage progress, with a native choice
for each pilot. Existing aircraft XP modifiers remain. Choosing pauses the
shared world; each player can select only their own pending upgrade. This
preserves the current per-pilot build and balance rules.

One downed pilot leaves the survivor fighting. Existing partner-assisted timed
revival restores them; both down ends the run. The downed client's camera follows
the survivor. Online result screens disable both local and server ranking writes.

A lost Guest transport pauses the Host and reserves the Guest seat for 30 seconds.
The Guest retries, or can reload and rejoin the same code in the same browser
session using its stored token. Full state and fresh input sequence counters
restore play. A prior manual pause or upgrade choice stays paused. The existing
visibility handler can pause during reload; use the shared pause button to resume.
Explicit leave,
expired rejoin or Host loss ends the session visibly. There is no Host migration.

## Public test setup, when separately authorized

Static GitHub Pages cannot run the relay. Host this service behind HTTPS/WSS and
configure the client with `window.HEADON_COOP_RELAY` before the app loads, or with
`?coopRelay=wss%3A%2F%2FYOUR-RELAY%2Fcoop`. HTTPS pages require WSS.
No public service URL is assumed.

Relay configuration:

| Variable | Default / purpose |
| --- | --- |
| `HOST` | `127.0.0.1`; choose a bind address for the intended host |
| `PORT` | `8787` |
| `COOP_ORIGINS` | Comma-separated allowed browser origins; defaults to local port 8787 and `https://leesh603.github.io` |
| `COOP_STATIC` | Set `0` for relay-only service; otherwise serves the local game for development |

Rooms live only in one process and disappear on restart. A public setup needs
one process or sticky routing, TLS and the correct allowed test origin.

## Verification

```sh
npm test
npm run build
node --test tests/mobile-perf-20261002.mjs
```

The Windows Node runtime does not accept the requested `node --test tests/`
directory form, so `tools/test-all.mjs` passes every `*.test.mjs` explicitly.
The historical mobile performance regression is also executed separately.
Build runs the repository's existing syntax and import validator; this static
game has no generated bundle build.

Final automated results: 564 suite tests passed (546 existing and 18 new),
plus 12 historical mobile performance regression tests. The build validator
checked 173 root modules and resolved 1,575 imports with no missing references;
7 dynamic/development references were explicitly skipped by the existing tool.

`tools/qa-online-coop.mjs` drives two real independent Chromium contexts against
the local relay: PC Host (1280×900) and touch mobile Guest (390×844). It requires
Playwright and optionally `PLAYWRIGHT_MODULE` and `CHROME_PATH`. Captures and
results go to ignored `reports/online-coop/`.

The browser checks cover create/join/ready, independent controls and autofire,
touch actions, the same enemy's combat death, Director/formation replication,
both upgrade choices, boss HP/part destruction, all 17 regional boss renderers,
one death/revival, Guest transport loss/reload/rejoin, both-down gameover,
Host loss, ranking exclusion and returning to an ordinary single-player sortie.
Controlled staging accelerates boss/death cases; it is not a natural full
17-stage campaign playthrough.

Final real-browser run: 35 checks passed, no captured game console or page
errors. PC and mobile gameplay captures were inspected for HUD and touch-control
overlap. Reload rejoin and shared resume completed before both-down gameover,
Host termination and the ordinary solo sortie regression check.

Remaining verification: real Samsung Internet hardware, WAN latency/jitter,
long-session mobile performance and a publicly hosted WSS relay. Host authority
is suitable for friends' co-op, not cheat-proof competitive scores. Public
deployment remains outside this authorized branch-and-verification phase.
