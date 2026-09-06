# Dishdasha Dash — release preparation 1.5.0

Prepared 6 September 2026 while the publisher's Google Play developer account is awaiting verification.

## Completed in the game

- **Startup recovery:** Arabic-font failure, delayed font preparation and artwork preparation errors now lead to a Retry screen. Progress stays below ready until fonts/art are prepared. Retrying reloads the game without clearing saved data.
- **Graphics recovery:** loss of the WebGL picture pauses the run, clears held inputs, stops sound and pauses Go Dance. Position, health, lives and score remain fixed during the interruption. After Phaser restores its textures and renders a frame, the player explicitly continues; a running stage returns to its pause menu. Reload remains available if recovery cannot finish. A loss during initial loading requires reload.
- **First-run practice:** a short box-jump lesson followed by a held-duck awning lesson. Both use the real game physics. The street waits for the correct input. Failed attempts reset the lesson without losing hearts, lives or campaign progress. Players can pause, skip and replay from How to play. Completion/skip is saved locally; established players with saved progress are not forced through the new introduction.
- English instructions follow the default menu language; Arabic world signs remain unchanged. No removed awning text, third-party dance media, new ads, accounts, tracking, achievements or company identity were introduced.

## Validation

- **26 unit tests passed**, including save migration and persistence for completed/skipped practice.
- **28 distinct browser tests passed** across the complete 27-test suite and focused reruns after the controller-practice addition. No final tests were skipped. The final focused runs cover all three practice tests and ten recovery/release tests. TypeScript passed.
- All five full-length courses completed with normal physics and timed jump/duck inputs. The automated player reads upcoming obstacle positions; this is traversability evidence, not novice-playtesting or a difficulty guarantee.

| Stage | Tea | Hearts | Deaths | Awning hits | Result |
| --- | --- | --- | --- | --- | --- |
| Neighborhood | 54/54 | 3 | 0 | 0 | Complete |
| Co-op | 66/66 | 3 | 0 | 0 | Complete |
| Al-Mubarakiya | 75/75 | 3 | 0 | 0 | Complete |
| Desert | 78/78 | 3 | 0 | 0 | Complete |
| Wedding | 84/84 | 2 | 0 | 0 | Victory |

- Font request rejection, 10-second font delay and image request failure each showed Retry, recovered on reload, and produced no uncaught page errors.
- A forced seven-second graphics outage preserved the full game state, rejected gameplay actions during recovery and required explicit resumption. Repeated loss while paused and loss in the menu/Go Dance were checked.
- Practice passed keyboard, on-screen pointer controls in a touch-enabled phone layout, and a standard-controller simulation, including selecting Start game after lesson completion. These are browser input tests, not evidence of a physical controller on Android.
- Phone/tablet menu layouts, 15–144 Hz fixed-physics agreement, jump/duck mechanics, pause/death/checkpoint/save behavior and Go Dance regressions passed.
- Current Android build: version 1.5.0, version code 7, target API 36. Build and release lint completed; 0 lint errors, 11 warnings. Test APK signature and 16 KB ZIP alignment verified. No native `.so` libraries. Bundled web entry point matches the production build. AAB is explicitly **unsigned**.
- The upload-signing command rejects missing credentials before building. No permanent upload key was generated, selected or replaced, and no signed Play release was submitted.

## Android environment limitation

No physical Android device was attached. The installed emulator environment was missing its system images. Official Android 16 ARM64 image revision 7 and stable emulator 37.1.11 were downloaded with verified repository checksums into temporary storage. A completely isolated AVD then booted successfully in approximately 23 seconds. Its ADB connection remained unavailable/offline, including the actual local socket reported by the host, so the current APK could not be installed or exercised in that session.

The temporary emulator processes were stopped. The installed Android SDK/AVD configuration was not replaced. **Current Android offline launch, native Back/Home/lock behavior, package upgrade/save retention, physical performance/audio and 16 KB runtime checks remain unverified.** Prior 1.1.0 emulator results are historical and are not substituted for 1.5.0 evidence. Desktop/Steam packages were not rebuilt or retested in this Android-focused preparation pass.

## Release materials

Source drafts and instructions: `store/google-play/`.

Review kit: `release/google-play/1.5.0/`.

- English and Arabic store copy, with names and short descriptions within the store's size limits.
- 512×512 icon from the existing icon artwork.
- 1024×500 feature graphic using the game's current Kuwait scenery and bilingual name.
- Five 1920×1080 previews of actual browser game scenes in the packaged layout. These are labeled **browser previews**, not native-device captures. Replace or supplement with final Android screenshots after installed-device validation.
- Privacy policy draft, Play Console declaration worksheet, signing guide and tester card.

The feature graphic and screenshots were inspected, and their dimensions and absence of alpha were checked. No new gameplay feature or assigned rating is advertised in the store copy. Price and final intended audience remain publisher decisions.

## Remaining before Play submission

1. Publisher name, support/privacy contact and a public privacy-policy URL; add real details in-app and to the final policy. The owner-private game site cannot serve as the required public policy page without a separate access decision.
2. Intended age groups, monetization and launch countries.
3. Final application ID confirmation, secure upload-key management, signed AAB and Play App Signing setup.
4. Current physical-phone/tablet checks and a Play-delivered internal test with its actual pre-launch report.
5. Account verification and whichever closed-test/production-access requirements apply to the publisher's account.

Achievements and company splash presentation remain optional follow-up work. The earlier recommendation is 12 launch achievements; none is advertised as implemented.
