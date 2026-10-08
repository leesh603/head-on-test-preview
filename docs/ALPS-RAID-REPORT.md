# Alps bomber raid verification

Initial main: a5600935a2caa3e30b5560f306557abe1f2b112e.
Latest main integrated before the G.IK checkpoint: 9d5d1118693f2b7852834a6be40329cfa19ee31b.
Branch: feat/alps-cannon-carpet-raid. No main merge or deployment.

## G.IK checkpoint

Physical flight into the current viewport, a forward threat shell with a frozen warning, and discovery-triggered cut-in/HUD. HP 68% opens lateral firing-lane maneuvers and rear-gun/stick-bomb defense; HP 32% uses damaged-engine asymmetric turns and increased prediction. HP 22% starts Alpine Iron Cage once: staggered locked precision shots, a longer final prediction warning, and 3.2 seconds of weapon cooling afterward. Engine losses reduce turn/movement and final shots. Destroyed cannon cancels owned rounds and replaces the final with only the surviving rear mount's normal sector-limited defense. No anonymous replacement rounds.

Phone-sized viewports scale the same original airframe, local mounts and swept-hit geometry together. Flight remains continuous; no camera/player writes. Warning lines are drawn again after clouds. Existing original/damage art and FX are reused; no new runtime assets.

Verification: existing Alpine pose/parts/swept-collision/engine/bomb-bay tests plus six G.IK raid tests. Stationary final attack takes actual projectile damage; warning-line sidestep simulation takes zero damage without invulnerability. Pausing freezes state; destruction clears hazards and advances once.

Live GitHub Pages Test Lab: existing deployed G.IK observed in 390x844 solo. Boss drifted out of view while the pilot flew onward. This is baseline evidence, not verification of the branch implementation. Branch browser verification and Ca.4 work follow this checkpoint.
