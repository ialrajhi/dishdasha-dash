# Dishdasha Dash 1.5.2 — authored eight-frame run

Prepared 7 September 2026. The hero's 12-frame sheet has been replaced with eight new running drawings in the requested contact, compression, passing and reaching order. The two contact frames use opposite near-arm silhouettes, the passing poses are narrow with visibly raised knees, and the compression poses preserve the character's proportions.

The artwork uses one source scale and one runtime scale. Measured body dips are 2.86/2.34 world pixels and rises are 1.82/1.56 pixels. Both contact crowns align exactly; supporting sandals share the baseline within 0.26 world pixels. Landing squash/stretch was removed. Actual travel drives an 8–14 FPS readability range; stopping switches cleanly to idle, and jumping/falling retain their dedicated artwork. Player physics, collision boxes, courses, scoring and the boy's separate 12-frame cycle are unchanged.

See `RUN_CYCLE_REVIEW.md` for the full pose review, source/prompt provenance, rendering measurements and preview artifacts. The final eight poses were inspected individually on stationary ground at enlarged and game-world size before integration; a four-second real-time preview was recorded. The in-game gameplay screenshot was also inspected. This is a stylized drawn cycle, not a guarantee of subpixel longitudinal foot locking at every speed.

## Validation

- 37 distinct unit tests passed, including authored-art geometry, contact differences, crouch/run face proportions, readable cadence, stops, airborne holds and distance-driven legacy cycles.
- All 32 browser tests passed in one complete run. Hero and boy frame counts, constant visual scale with effects enabled, collider dimensions, idle exit, jump/fall poses, pause/resume, checkpoint respawn, onboarding, saves, graphics recovery and phone/tablet layouts were covered.
- All five complete courses passed with normal physics and timed jump/duck inputs: zero deaths and zero awning hits. Tea totals 54, 66, 75, 78, 84; final hearts 3, 3, 3, 3, 2. Automated obstacle-aware play demonstrates traversability, not novice difficulty testing.
- TypeScript and the production build passed. Android version code is 9. Package checks and hashes are recorded in `BUILD_VERIFICATION.json` and the local Android manifest.

The private test APK and standalone animation-preview route are refreshed. The existing Google Play review kit remains explicitly labeled 1.5.0; it is not relabeled as new device captures. No physical Android device was tested, no release upload key was generated, no Google Play submission was made, and desktop/Steam packages were not rebuilt in this pass. The installed-device and publisher/account tasks in the 1.5.0 release-preparation report remain outstanding.
