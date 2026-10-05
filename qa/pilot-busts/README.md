# Pilot bust unification

- Target: `leesh603/head-on-test-preview`, GitHub Pages test server.
- Initial baseline: `313af1b0a41a53c67aca754636d56345b89498b6`.
- Final baseline: `19a4333fd70c6d1baf74be4eb30ef74d2ee92aa4` (latest music update retained).
- Branch: `codex/portrait-test-preview-20261005`.

Lothar previously had a photographic texture and opaque horizontal bands. Pilot sources had different shoulder crops and resolutions. All 32 canonical WebP portraits now use transparent 1254 × 1254 painterly busts with complete outer shoulders, using Sachsenberg as the style reference. Both two-person crews remain two-person illustrations.

The hangar hero and roster fit the complete image on desktop and mobile. The mobile circle becomes a rounded square so it cannot clip the shoulders. Enemy arrival portraits and skill backgrounds also contain the shared image. Runtime crew matte removal/cropping is retired because it would discard the new authored transparent margins. Portrait files, their module and the affected styles use a dedicated cache token.

Changed production files: 32 `portrait-*.webp` assets, `portraits.js`, `app.js`, `index.html`, `hangar-ww1-403.css`, `main-ui-v2.css`. Added asset audit, regression test and QA evidence.

| Check | Result |
|---|---|
| Full suite | 475 passed, 0 failed |
| Deploy gate | 160 modules parse; 1538 relative references resolve |
| Asset audit | 32 square high-resolution alpha WebPs; zero opaque edge pixels |
| PC runtime | 1280 × 900; all 32 selected and loaded, contain fitting, no zoom/mask |
| Mobile runtime | 390 × 844 viewport; all 32 selected and loaded, contain fitting, no zoom/mask; no horizontal overflow |
| Console | No warnings/errors during portrait checks |
| Build | Static repository has no package.json or npm build/test scripts; actual CI deploy gate and Node test suite used |
| Deploy | Not merged or deployed by this task |
| Unverified | Physical phone GPU/memory performance; live battle boss-arrival/skill animation (references/styles inspected) |

Evidence: [asset audit](asset-audit.json), [runtime results](runtime.json), [full test log](full-tests.log), [deploy validation](validate.log), [all portraits](portrait-grid.png), [PC Lothar](pc-lothar.png), [mobile Lothar](mobile-lothar.png), [mobile detail](mobile-lothar-detail.png).
