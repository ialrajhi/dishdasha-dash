# Dishdasha Dash — Google Play release audit

**Reviewed 6 September 2026 · Version 1.4.1 · Source 4a8dbfa0da195116594933912037a23681d1b83b**

**Recommendation: prepare a closed-test candidate; do not submit this package as the final public release yet.** The five-level game is playable, but two recovery bugs, publisher/privacy setup, release signing, and current Android device validation remain. Achievements and company branding can improve the experience; they do not replace those checks.

This was an audit only. No gameplay, artwork, settings defaults, native configuration, dependencies, or hosted version were changed. Only this report and its evidence files were added. Fault injection and save changes were confined to disposable test sessions.

## What passed today

- All **25 unit tests and 20 browser tests** passed in fresh runs, with no skipped tests. TypeScript validation passed.
- All five courses completed with normal physics, timed jumps and held ducking. No invincibility, teleporting past obstacles, or simulated finish was used in the full-course test. The automated player does read upcoming obstacle positions, so this proves traversability, not that a first-time human will find the difficulty appropriate.
- Jump height, coyote time, input buffering, no double jump, mixed touch/keyboard holds, controller inputs, pause/resume, death, checkpoint respawn, level transitions, saved progress, reset confirmation and loading-error recovery for image assets passed their existing tests.
- English menus, Arabic world labels, offline license access, and phone/tablet browser layouts passed. Go Dance placement, dragging, all twelve characters, eleven move options, six tracks, undo, cloning and party persistence passed.
- The actual published version was opened separately in a fresh 844×390 touch-enabled Chrome session. Menu, help, play, pause, options and credits worked with no page errors or failed requests. The session loaded version 1.4.1.
- Audio scheduling activated during gameplay and for all six dance tracks. Gameplay music scheduling stopped on pause; the short pause sound still plays. Suspending Go Dance stopped its music scheduler and active voices. This is a functional check, not a subjective music mix or physical-speaker review.
- The existing APK's debug signature and 16 KB ZIP alignment verified. The package matches the current production web entry point, bundles license notices and contains no native `.so` libraries. Its existing lint report has 0 errors and 12 warnings. The release AAB is unsigned.

| Level | Full-route result | Tea collected | Health at finish | Deaths | Awning hits |
| --- | --- | --- | --- | --- | --- |
| 1 — The Neighborhood / الفريج | Completed | 54 / 54 | 3 hearts | 0 | 0 |
| 2 — The Co-op / الجمعية | Completed | 66 / 66 | 3 hearts | 0 | 0 |
| 3 — Al-Mubarakiya / المباركية | Completed | 75 / 75 | 3 hearts | 0 | 0 |
| 4 — The Desert / البر | Completed | 78 / 78 | 3 hearts | 0 | 0 |
| 5 — The Wedding / العرس | Victory reached | 84 / 84 | 2 hearts | 0 | 0 |

The single hit on the automated Wedding route did not prevent completion. It is not, by itself, evidence of an unavoidable collision. Each stage's scenery, Arabic signs, HUD and hero were also inspected visually. The base campaign is approximately **5 minutes 57 seconds**, excluding menus, retries and Go Dance; replay goals would help extend its appeal.

## Issues to fix before the release candidate

### 1. Loading can remain stuck at 100% after an Arabic-font failure — high priority

**Reproduction:** start a fresh browser session, block the Changa Arabic `.woff2` request, and load the game. The loading overlay reaches 100%, remains over the menu and offers no Retry action. A rejected font-loading promise is reported.

**Cause found:** `BootScene.create()` awaits `document.fonts.load(...)` without a catch or recovery state. Image-download failures already have an error screen, but font preparation is outside that handling. See `src/scenes/BootScene.ts:25`.

**Proposed fix:** handle failed or stalled font preparation explicitly. Offer Retry and either a tested Arabic-capable fallback or a clear recoverable error. Keep progress below “ready” until preparation completes. Verify startup with a failed image, failed font, slow font and normal offline Android assets.

**Scope:** reproduced in browser fault injection. The native app bundles its fonts, so the same network failure is not a normal Android startup path. The underlying startup recovery gap should still be resolved before calling the product robust.

Evidence: `release-audit-2026-09-06/font-failure.png` and `edge-cases.json`.

### 2. A lost graphics context leaves an invisible game running — high priority

**Reproduction:** while playing, force WebGL context loss with the browser's `WEBGL_lose_context` extension. The scene disappears, while the HTML score and controls stay visible. After seven seconds the hero moved from x≈285 to x≈1,253 and health fell from 3 to 2.

**Proposed fix:** pause gameplay, held inputs and audio when the graphics context is lost. Show a recovery overlay; after restoration and a successfully rendered frame, require the player to resume. Provide Retry if restoration fails. Check that score, health and position stay fixed throughout the outage.

**Scope:** reproduced through deliberate GPU fault injection on development-Mac Chrome. It is not a claim that every Android device currently loses its graphics context. Temporary GPU resets and resource loss need a safe response. Current interruption handlers in `src/main.ts:287` cover visibility/focus/native lifecycle, not this event.

Evidence: `release-audit-2026-09-06/context-lost.png` and `graphics-loss-damage.json`.

### 3. First-time jump/duck teaching is too easy to miss — recommended before launch

The menu's Start game button immediately begins the run. How to play is optional, the down-arrow control does not explain that it must be held, and the compact phone gameplay layout hides the longer footer guidance. There is no persistent first-time tutorial state.

**Proposed fix:** a short, interactive first-run introduction: tap to jump, then hold the down arrow under a practice awning. Pause the lesson until the player succeeds, allow Skip, and make it replayable from How to play. Use icons and English instructional UI with the default English menu; keep the Arabic environment and avoid reintroducing the removed word. Then test with several people who have never seen the game.

Evidence: `live-phone-menu.png`, `live-phone-how.png` and `live-phone-playing.png` in the evidence folder.

## Google Play submission gates

| Gate | Current evidence | Required next step |
| --- | --- | --- |
| Release signing | APK certificate is Android Debug; AAB verification reports unsigned. No release signing configuration is present. | Confirm the final application ID and publisher account, configure an upload key securely, use Play App Signing, and upload a signed AAB to the intended testing track. Test the build delivered by Play. |
| Publisher and privacy policy | About & privacy explains local saves and no ads/accounts, but has no actual publisher identity, privacy contact, or public policy link. | Supply the real company/developer name and contact mechanism; publish a clearly labeled, publicly accessible privacy policy and link it in Play Console and the app. The owner-private game URL alone does not meet the public-policy requirement. |
| Console declarations | No current Play Console account or submission evidence was inspected. | Complete Data safety, ads declaration, target audience, content rating, app access, support contact and store listing. Declare children in the target audience if they are actually intended users; then complete the applicable Families requirements. Do not choose an older audience merely to avoid obligations. |
| Device validation | No physical Android device was connected. The available emulator failed to boot because required system-image files are missing. | Restore a usable test environment and run the actual APK/Play-delivered build on representative phones and tablets, including a modest device. Test fresh install, upgrade, offline cold start, native Back/Home, process death, audio, touch, safe areas, heat/battery and sustained performance. |
| Testing track / production access | Not verified in the account. | Start internal testing, review the pre-launch report, and conduct a real-user closed test. For personal developer accounts created after 13 November 2023, Google requires at least 12 continuously opted-in testers for 14 days before applying for production access. |
| Store artwork and rights | Original generated game art and software/font notices are documented. Reference images and GIFs are not shipped. No final store listing was reviewed. | Confirm rights to the final logo, company name, supplied references and marketing assets. Prepare accurate screenshots, icon, feature graphic, descriptions and support details. Use current gameplay, not a concept image that promises a different game. |

The configured **target SDK is 36**, meeting the currently published minimum for new phone/tablet submissions. No SDK upgrade is indicated by this audit. No packaged native libraries were found, which avoids native-library page-alignment work; actual 16 KB runtime validation is still useful. Prior Android emulator checks in the repository were for **1.1.0**, not proof of 1.4.1 behavior.

Primary Google sources, checked 6 September 2026:

- [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en): new submissions target API 36 from 31 August 2026.
- [User Data / privacy policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en): policy, developer/contact information and public URL requirements apply even without personal-data collection.
- [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) and [app review preparation](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en): complete declarations for the actual final app and SDKs.
- [Personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en): account-specific closed-test and production-access requirements.
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en) and [16 KB compatibility](https://developer.android.com/guide/practices/page-sizes): validate final distribution packages, not only the debug APK.

## Startup, company name and credits

**Use one brief native launch splash, then the menu.** An icon-based Android splash is already configured. Its current native appearance could not be retested because the emulator did not boot. Keep the game icon on the dark background, with no artificial delay after the game is ready. Avoid stacking a company movie, a game-logo screen, and a separate loading screen. Android recommends short splash animation and discourages an extra bottom branding image. [Android splash guidance](https://developer.android.com/develop/ui/views/launch/splash-screen)

Put **“A game by [your company name]”** discreetly on the main menu, and put the full publisher name in credits and the privacy policy. Use the real name you intend to publish under; a company splash is a design choice, not a Google Play acceptance requirement. The menu hero is quite dark on the tested phone layout; a small brightness adjustment would help the greeting read, while keeping the background stationary.

Credits already exist at **Options → About & privacy → Credits**, followed by software/font licenses. Expand this with the creator/studio, actual art/animation and music contributors, QA/localization acknowledgments and support contact. Retain the existing notices. A small direct Credits link on the menu would make them easier to find. End-of-game credits can be optional and skippable.

One fresh hosted-browser launch took about 7.6 seconds from navigation to the playable menu, including private hosting/network delivery; a local development load took about 1.9 seconds. These single samples are not an Android cold-start benchmark and should not drive an added waiting period.

## Achievements: recommend 12 at launch

There is currently **no achievement system**. Saved scores, level unlocks and golden-dallah flags provide some existing progress data, but jump/duck/clean-run counters and achievement unlock storage must be implemented and tested.

I recommend **12 visible achievements**, with at least four easy early rewards, rather than stretching five short stages into forty repetitive tasks. Google’s voluntary Level Up program specifies a ten-achievement baseline and recommends forty-plus for deeper games; this is not a requirement that every basic Play Store release must integrate Play Games Services. [Level Up scope and requirements](https://developer.android.com/games/guidelines), [achievement design](https://developer.android.com/games/pgs/achievements)

| # | Proposed name | Unlock condition |
| --- | --- | --- |
| 1 | First Sip | Collect your first tea. |
| 2 | Off the Ground | Safely jump over your first ground obstacle. |
| 3 | Keep It Low | Safely duck beneath your first awning. |
| 4 | Party Starter | Place your first dancer in Go Dance. |
| 5 | Neighborhood Hero | Complete The Neighborhood. |
| 6 | Shopping Done | Complete The Co-op. |
| 7 | Souq Explorer | Complete Al-Mubarakiya. |
| 8 | Desert Runner | Complete The Desert. |
| 9 | Wedding Guest | Complete The Wedding. |
| 10 | Golden Tour | Find the golden dallah in all five stages. |
| 11 | Clean Dishdasha | Finish any full stage without taking damage or dying. |
| 12 | Full House | Place eight different character types together in Go Dance. |

Start with offline achievements that persist between sessions and work on phones, tablets and desktop. Add Play Games synchronization if platform achievements/Level Up participation are part of the launch scope. Do not advertise Google Play achievements before that integration exists. Adding the service also requires revisiting SDK/data declarations.

Each achievement needs a clear condition, its own icon, progress where applicable, duplicate-unlock protection and save migration. Existing level and golden-dallah records should grant corresponding awards on upgrade. Do not retroactively grant Clean Dishdasha from remaining hearts alone: deaths can restore hearts, and the current save does not prove a no-damage run. Show unlock messages away from obstacles and test reset, offline play, interrupted saving and any later cloud synchronization. No daily streaks or forced waiting are needed.

## Suggested order of work

1. **Reliability:** fix the font and graphics recovery bugs, add the brief jump/duck introduction, and run targeted regression checks.
2. **Presentation and replay:** company credit, clearer credits access, modest menu-hero visibility adjustment, and the twelve achievements.
3. **Release validation:** signed test AAB, public privacy/support information, actual phone/tablet and Play pre-launch testing, real-user feedback, then production submission when the remaining gates are satisfied.

No store acceptance, physical-device performance, current native splash appearance, final content rating or Play Console completion is claimed by this report.
