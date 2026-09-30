# Pilot ability feedback integration correction

Base: `36d541252c7723ed75aa42a52cf366ad6a8b1405`. Branch: `fix/astra-pilot-feedback-20260930`. No PR, merge or deployment.

- Install pilot identities after every historical player override; remove the conflicting old Loewenhardt vertical frame and Udet low-HP FX.
- Assign solo ally owners at creation and isolate formation commands/supply conversion by owner.
- Make Boelcke flank and approach rear targets; make Collishaw spread from each wing’s existing side and attack divided targets. No additional summons.
- Show real ability state with existing painted aircraft echoes, wingtip wakes, muzzle bursts, metal impact, smoke, ignition and petals. Remove obsolete passive circles and decorative Collishaw aircraft.
- New tests cover actual moving-bullet graze/hit/distant cases, physical maneuvering, ownership and all 27 normal/enhanced lifecycle combinations in solo, co-op and armed campaign. All five tests pass. Run `node tests/pilot-feedback.test.mjs`.
- Chromium verification: six real E-key/touch activations for Boelcke/Collishaw/Udet on PC/mobile; 108 native FX render samples for all 27 normal/enhanced actives. No page errors, non-finite state or FX cap violations.

[Full correction report and actual captures](https://github.com/leesh603/head-on-aces-source/blob/fix/astra-pilot-feedback-20260930/docs/pilot-feedback-20260930.md). Physical iOS/Android performance and extended balance playtests remain unverified. Existing other main changes, including enemy projectile presentation and hangar artwork routing, are preserved.
