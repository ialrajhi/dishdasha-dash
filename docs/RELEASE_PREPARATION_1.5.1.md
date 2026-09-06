# Dishdasha Dash 1.5.1 — stride synchronization

Prepared 6 September 2026. This patch follows the 1.5.0 release-preparation pass.

## Changes

- Reusable `StrideAnimator.ts` implements `referenceVelocity = strideLength / loopDuration` and derives playback rate from actual collision-resolved travel.
- Hero and boy frames now use the same interpolation point as their displayed positions. Hero gait advances per fixed physics step, so low-refresh rendering cannot misattribute a whole frame's travel across a jump or landing.
- Changing between running and crouching preserves normalized cycle phase. Stopping holds the frame; respawn explicitly resets gait.
- Corrected running poses at the jump apex and idle artwork during moving, protected respawns. Health protection, level speeds, jump physics and obstacle layouts are unchanged.
- Existing stride lengths and sprite drawings are retained. The script solves cadence/state issues; uneven painted foot contacts still need an artwork pass for completely planted feet. Calibration instructions and a reusable example are in `STRIDE_SYNC.md`.

## Verification

- 32 unit tests passed, including six stride-clock tests.
- All 31 browser tests passed in one full suite, with no skipped tests. Tests cover acceleration/deceleration, zero travel, frame wrapping, hero and boy interpolation, run/duck changes, jump/landing phase agreement at 15/60/120 Hz, real respawns, startup/graphics recovery, input/pause, saving and phone/tablet layouts.
- All five full courses completed using normal physics and timed jump/duck input. Tea totals were 54, 66, 75, 78 and 84; every course had zero deaths and zero awning hits. The final stage ended with two hearts; the other stages ended with three. Automated obstacle-aware play is traversability evidence, not player difficulty testing.
- TypeScript validation passed. Current gameplay screenshot inspected for pose/ground placement and layout.
- Android build and release lint passed: zero errors and 11 warnings. Test APK signature and 16 KB ZIP alignment verified. AAB remains explicitly unsigned; no upload key was generated.

## Release status

Version 1.5.1 uses Android version code 8. The private Android test download is refreshed separately from the existing, clearly labeled **1.5.0 Google Play preparation kit**; its store artwork and submission drafts remain useful but are not new 1.5.1 device captures. Current package checks and hashes are recorded in `BUILD_VERIFICATION.json` and the Android artifact manifest.

No physical Android device was tested in this patch. Installed-device performance, offline/lifecycle/upgrade checks, upload signing and Play Console submission remain outstanding as documented in the 1.5.0 preparation report. No Play release was submitted, and no desktop/Steam package was rebuilt.
