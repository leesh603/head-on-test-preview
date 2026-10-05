# HEAD-ON HUD/UI map — read this first

Single HTML page (`index.html`, minified ~15 lines) + vanilla JS modules + layered CSS.
No framework, no build step, no virtual DOM. The browser loads ES modules directly.

Repos (same files, different layout):
- **test-preview** (this repo, flat layout): live lab — https://leesh603.github.io/head-on-test-preview/ , harness `test-lab.html`
- **source** `head-on-aces-source`: same files under `dist/`. Port UI changes to both.

## Cache-tag rule (critical)
Every `<script>`, `<link>`, image URL carries `?v=478`. ANY content change requires bumping
`?v=` to the same new number across ~47 files (html/js/css), or modules go stale.
One-line node replace on `?v=\d+` — do NOT bump only the file you edited.

## DOM skeleton (index.html — everything lives here)
```
header            brand, #localeSelect (ko/en), #sound, #help
.field
  .field-top      #missionLabel, #record
  #viewport       position root for ALL HUD layers
    canvas#game   the world renderer (canvas, not DOM)
    .vignette
    #stageBossHud boss bar: #stageBossTitle #stageBossParts .bar>#stageBossHp
    #coopXpHud    p1/p2 xp bars
    #coopHud      .coop-instrument p1/p2 (name, gun canvas, stats, hp bar, relics) + .coop-team
    #coopCutins   p1/p2 skill cut-ins
    #hud          HP text + #healthBar, #clock
    #xpHud        #level, #xpBar, #pause
    #missionMap   campaign radar canvas
    #campaignHud  phase/objective/nav arrow/#altitudeButton
    #eventMissionHud
    #ammoHud      gun-icon canvas, #ammoLabel #ammoCount .bar>#ammoProgress, #kills, #reload
    #hangar       pre-game screen (mode tabs, campaign panel, dossier, coop panel, #start)
    #modal        result/dialog card (#modalTag/Title/Text/Actions)
    #skillCutin   player skill cut-in
    #bossArrival  boss card (img + name)
    #bossWarning  WARNING band
    #bossCutin    boss illustration cut-in
    #toast
    .map-label
    #legendaryInventory  item badges
    #touch        mobile: #stick + touch actions (#touchEvade #touchSkill)
  .field-bottom
aside#flightRoster  pilot/aircraft picker (factions, portrait, pilot-tabs, skill-info,
                    #selectedAircraft canvas, #aircraftSelect103, airframe brief, weapon-spec, #loadout)
footer
```

## ⚠ DOM order ≠ layout
Two modules **re-parent** the live nodes at runtime — never rely on index.html order:
- `hud-layout94.js` — builds `#flightStack151 > #flightTop151` (survival | center#flightCenter156 | status) and moves `#hud` `#ammoHud` `#coopHud` etc. into it. ResizeObserver-driven.
- `astra-interface180.js` — "Astra presentation" layer, also moves controls. Rule it follows: *move nodes, never clone state or handlers*.
- `main-ui-v2.js` — injects `nav#mainOperations` into the hangar.

CSS must select by **id/class of the node itself**, not by source-order siblings.

## Who owns what (JS)
| File | Owns |
|---|---|
| `app.js` (~1150 lines, entry) | EVERYTHING state→DOM: `show(id,bool)` toggles `.hidden`; `start()`/`returnHangar()` swap hangar↔HUD; `hud()` writes bars/text every frame (health/ammo/xp/skill/clock/kills/touch buttons); `events()` → toast/bossPhase/bossSound; `campaignHud()`, `coopHud()`; bossArrival/Warning/Cutin timing (`bossArrivalUntil` `bossCutinUntil`); modal/result/ranking |
| `headon-stageboss-hud.js` | `bossHudModel(encounter)` → `{name,fraction}` consumed by app's `updateStageBossHud` |
| `i18n.js` | KO/EN dictionaries, `t()`, `subscribe`, `applyTranslations`, name helpers. All strings keyed; DOM uses `data-i18n` attrs |
| `icons.js` | atlas→frame extraction, `drawGameIcon(c,key,x,y,w)`, `LEGENDARY_ICON_KEYS` — fills the small canvases (gun icon, skill icon, relics) |
| `portraits.js` | `portraitSources` per pilot (cleaned-canvas webp) |
| `equipment.js` | pickup/item sprites |
| `hangar-portrait186.js` | hangar portrait fit tuning only |
| `battlefield-event-ui.js` | builds `#battlefieldEventShell` dialog dynamically |
| `gamepad-input.js` | input abstraction (kb/touch/gamepad → controller.inputMode) |
| `field-record.html` | standalone dossier page — own inline CSS, separate world |
| `test-lab.html` | test harness — iframe hosts the game, debug bridge `__HEADON_TEST__` |

## Per-mode HUD sets (toggled by app.js, not separate pages)
- endless: `#hud` `#ammoHud` `#xpHud` `#touch` `#stageBossHud` `#legendaryInventory` `body.playing`
- coop2: `#coopHud` `#coopXpHud` `#coopCutins` + `body.coop-playing`
- campaign: `#campaignHud` `#missionMap` `#eventMissionHud` + `body.campaign-playing`
- body classes drive CSS variation: `.playing`, `.coop-playing`, `.campaign-playing`, `.astra-ui`

## CSS files (all linked in index.html head)
`style.css`(143) base/layout · `interface58.css`(235) · `hangar69.css`(100) · `coop.css`(3) ·
`stageboss.css`(7) · `result-names100.css`(4) · `presentation129.css`(94) · `mobile-ui142.css`(85) ·
`reinforcement151.css`(55) · `flight-polish156.css`(219) · `battlefield-event-ui.css`(5) ·
`main-ui-v2.css`(1078 — the big one, Astra skin) · `hangar-portrait186.css` · `xp-hud94.css`(54)

Layering: generic first, `main-ui-v2.css` near last → it wins most ties. Numbered suffix = vintage of the pass (58/69/94/129/142/151/156/180/186).

## Conventions / gotchas
- `show(id)`/`show(id,false)` = `.hidden` class. Add a node → it's hidden by default class or shown via show().
- Small canvases inside HUD (gun icon, radar, portraits) are painted in JS every frame — don't restyle their *pixels* via CSS, only layout.
- `data-i18n` / `t()` for every user-facing string — add keys in BOTH ko and en dicts.
- Mobile = `#touch` overlay + `matchMedia('(max-width:720px),(pointer:coarse) and (max-height:600px)')`.
- Boss cut-in recently moved up for touch (`#bossCutin` bottom margin) — don't regress.
- `flightViewport.lock()` + `document.documentElement.flight-fullscreen` during play; `.field-top`/`.field-bottom`/footer hidden in play.
- test-lab: `test-lab.html` iframe → `__HEADON_TEST__.debug()` bridge (`start/pause`, `stageBoss.stages.encounter.bodies`, bossState line). Verify UI changes live there before shipping.
- Local static server on this box: `fxgen/server.js` port 8791 serves this repo + CDP scripts for screenshots.

## Safe-change recipe
1. Edit CSS/JS/HTML → bump `?v=` everywhere to next number.
2. `node --check` any edited JS.
3. Verify via test-lab (desktop + narrow viewport) — watch for the runtime re-parenting breaking assumptions.
4. Port the same change into `head-on-aces-source` `dist/` via branch+PR (never push source main directly).
