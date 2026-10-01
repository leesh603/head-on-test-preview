# High-altitude airship damage assets

References: `boss-zeppelin-l7094.webp` and `boss-hma2394.webp` from test-preview main 6797ac0. Both retain the original ship identity, lateral top-down projection, nose-left/tail-right orientation, flags and established game art.

Authored using the image generation skill as transparent RGBA 2×2 sheets: light wear, moderate structural damage, heavy component/hull damage, collapsed wreck. No scenery, labels or UI. Original outputs: 1774×887. Converted to WebP at quality 92 / method 6 without resizing or painting. Total new atlas payload: 691,836 bytes.

- `l70-damage-20261001.webp`: 333,890 bytes.
- `hma23-damage-20261001.webp`: 357,946 bytes.
- Registered source rectangles are defined in `airship-render.js`.
- Draw size and original component centers are defined in `airship-layout.js`.
- Operational mounts are restored from the original normal sprite; destroyed mounts use the heavy-damage frame. Hull damage does not visually disable a still-live mount.
- Ground bombing animation interpolates from the actual moving bay emission point toward a locked warning target.

Verification captures replay the actual renderer on native Canvas with a neutral sky backdrop. They are not browser play captures. `AIRSHIP_RENDER_ROOT` selects a baseline checkout and `AIRSHIP_RENDER_PREFIX` selects before/after filenames; run `node review/airships-20261001/render.mjs` from the repository root with @napi-rs/canvas available.
