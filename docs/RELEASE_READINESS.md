# Dishdasha Dash — release readiness

Policy research checked **5 September 2026** against the official sources linked below. Recheck the relevant console and current policies before each submission.

This document separates work that can be prepared in the repository from checks that require signed packages, physical devices, developer accounts, or store review. A passing web build does not establish Android or Steam release readiness.

## Release status and evidence

| Area | Evidence / status |
| --- | --- |
| Source revision | Release 1.4.0 working tree reviewed on 6 September 2026; the publishing commit records this state. Native delivery hashes are in `release/SHA256SUMS.txt`. |
| Production web build | `npm run build` — TypeScript validation and Vite production bundle. Final build output is bundled in all native packages; no development-server URL or production test bridge. |
| Automated checks | 23 unit tests and 20 browser tests passed (43 total), 6 September 2026. Includes complete normal-physics traversal of all five courses, 15/30/60/120/144 Hz simulation, save recovery, reset ordering, controller focus, loading recovery and menus. No skipped tests. |
| Go Dance bonus mode | Twelve original characters with continuously animated body/limb parts, eleven movement styles, six original synthesized tracks. Chef removed, boy cap removed, black-abaya woman added. Mouse/touch placement, movement, clone/remove/undo, pause, and saved-party recovery passed browser checks. A maximum of 24 dancers bounds rendering and storage. |
| Jump and duck | All five courses contain overhead awnings introduced after two ground obstacles. Hold ↓ / S, touch Duck, or controller B / ○ / D-pad down. Crouch hitbox preserves foot position; safe clearance survives pause/resume, held controller input survives scene resets, and avoidance points wait for the trailing edge. All courses completed with zero awning hits in automation. |
| Motion comfort | Steady view enabled by default: fixed skyline, no camera shake or landing squash. Interpolated character/camera presentation and a 1920×1080 canvas reduce visual stepping and scaling softness. Twelve generated running poses replace the four-pose cycles. Three Chrome viewport profiles sampled approximately 60 fps without frames over 33.5 ms; these measurements are from the development Mac, not Android hardware (see `MOTION_REVIEW.md`). Gentle dance movement enabled by default, with a fixed floor and no flashing effects. Shoulder/elbow motion and foot-anchored leg joints replace pose swapping; a 24-dancer timing sample is recorded in `DANCE_PROFILE.json`. These are engineering changes, not a guarantee of individual comfort. |
| Browser and responsive-layout checks | Chrome desktop and touch emulation at 844×390, 390×844, 1280×800 and 800×1280 passed. Touch targets are at least 44 CSS pixels; dialogs and level selection scroll. Browser portrait is supported; Android prefers landscape. |
| Dependency and bundled-asset audit | npm audit: zero reported vulnerabilities (including a separate shipped-dependency audit). Original art/source inventory, exact Arabic signage, font/software notices and local-only runtime assets reviewed. Publisher rights confirmation remains a gate. |
| Android wrapper and target SDK | Generated Capacitor 8.5.1 project; min SDK 24, compile/target SDK 36, AGP 8.13.0, Gradle 8.14.3, Java 21. Version 1.4.0 / versionCode 5; provisional application ID `com.falrajhi.dishdashadash`. |
| Signed Android AAB / derived APK | Debug-signed test APK and unsigned release AAB built. Debug APK signature and 16 KB ZIP alignment checks passed; no packaged native `.so` libraries. This APK was not derived from a signed release AAB. See `release/android/` and SHA-256 manifest. |
| Android physical-device testing | Not performed. Android 16/API 36 ARM64 phone (915×412 CSS pixels) and tablet (1707×1067 CSS pixels) emulators: offline launch, touch jump, Back navigation, Home/return remaining paused, licenses and force-stop/relaunch save persistence passed. Those emulator checks used version 1.1.0; the 1.4.0 ducking and articulated-dance update has browser regressions and fresh APK/AAB build, signature, alignment and lint checks, but was not rerun on Android emulators. Emulator page size is 4 KB; a 16 KB runtime and representative physical phones/tablets remain gates. |
| Desktop packages | Electron 44.2.0: macOS ARM64 and Windows x64 packages built. Installed macOS package passed offline launch, English menus/Arabic HUD, jump/pause, fullscreen, local licenses, sandbox/network restrictions and settings persistence across relaunch. Windows was cross-packaged but has not been executed on Windows. |
| Steam installation and offline checks | No Steam installation or Steam Deck test performed. Standalone macOS offline tests passed. Windows, physical controllers, Steam Input and a clean Steam depot installation remain required before advertising support. |
| Privacy policy publication | Pending real developer/contact information and an accessible public policy URL unless evidence is recorded below |
| Store declarations and account gates | Not established by repository checks; record actual console evidence before release |
| Store review | Not submitted. No Google Play or Steam acceptance, store account completion, production signing, fee payment or certification is claimed. |

Test packages are prepared for evaluation, not store submission. Retain the final package hashes when moving from these tests to a signed release candidate. Android lint completed with no errors; remaining warnings concern generated framework resources, recommended newer tools, pre-26 app-category handling, game orientation, and the v26 icon definition (v33 themed icons are provided).

## Product and data scope

The intended release is an original, offline, single-player Kuwait-themed autorunner with locally stored progress/settings and synthesized audio. It has no developer-operated accounts, advertising, in-app purchases, analytics, or gameplay networking. Verify that the final native wrappers and every bundled SDK preserve this scope before using these statements in privacy or store declarations.

Ship all game code, fonts, textures, and audio-generation code with the package. Preserve asset provenance and required license notices. Generated artwork does not remove the need to check intellectual-property rights or prohibited content.

## Android engineering preparation

- Use Capacitor 8 with the built Vite `dist` directory as `webDir`. The official release checked for this document is **8.5.1**. Keep the Capacitor core, CLI, Android package, and plugins on compatible versions and record the installed versions in the lockfile. [Capacitor release](https://github.com/ionic-team/capacitor/releases/tag/8.5.1), [installation workflow](https://capacitorjs.com/docs/getting-started)
- The documented Capacitor 8 baseline requires Node 22+, Android Studio Otter 2025.2.1+, `minSdkVersion = 24`, and `compileSdkVersion = targetSdkVersion = 36`; its Android migration baseline uses AGP 8.13.0 and Gradle 8.14.3. Treat these as the checked baseline, not a reason to downgrade newer compatible tools. [Capacitor 8 requirements](https://capacitorjs.com/docs/updating/8-0)
- **Target Android 16 / API 36.** New phone/tablet apps and updates submitted from **31 August 2026** require API 36+. API 35 is the separate availability threshold for existing apps, not the target for a new release. Do not assume an account-specific extension. [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- Select and retain the permanent application ID and release versioning scheme. Produce a signed **Android App Bundle**, the required format for new Play apps. Keep upload/signing keys and passwords outside version control. [Android App Bundles](https://developer.android.com/guide/app-bundle)
- Bundle the production assets; remove development-server URLs and live-reload settings from the release configuration. Check the merged manifest and native dependencies for unexpected permissions, network behavior, or SDKs.
- Handle display cutouts and system bars with safe-area insets. Target API 36 removes the Android 16 edge-to-edge opt-out. Set `android:appCategory="game"` accurately; games are exempt from Android 16's large-screen orientation/resizability restrictions, but still need tablet and window-size testing. Verify native back navigation on API 36. [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Use a native Preferences adapter for small persistent saves/settings, with a web fallback and migration from existing browser storage. Capacitor documents WebView `localStorage` as transient and recommends Preferences for small durable values. Handle missing/corrupt saves without blocking startup. [Capacitor storage](https://capacitorjs.com/docs/guides/storage)

Documented build workflow, once the app ID and native project are configured:

```sh
npm run build
npx cap sync android
npx cap open android
```

With release signing configured securely, Capacitor also supports:

```sh
npx cap build android --androidreleasetype AAB
```

These commands prepare packages; they do not submit or publish them. [Capacitor build command](https://capacitorjs.com/docs/cli/commands/build)

### Android package and device gates

- Inspect the final APK/AAB for native `.so` libraries. If 32-bit native ABIs are included, include the corresponding 64-bit ABIs. A Java/Kotlin-only dependency set already supports 64-bit, but that must be checked against the packaged dependencies. [64-bit requirements](https://developer.android.com/google/play/requirements/64-bit)
- Verify **16 KB page compatibility**. The current Android guide says apps targeting API 35+ must support 16 KB pages and that incompatible **updates** will be blocked starting **1 February 2027**. Older announcements still mention November 2025; do not treat those as the only current source or assume a universal new-app exemption. Build compatible packages now. For native libraries, use compatible prebuilts, AGP 8.5.1+ and preferably NDK r28+, then check alignment and runtime behavior. [Current 16 KB guide](https://developer.android.com/guide/practices/page-sizes)
- Test an APK generated from the release AAB, including a 64-bit-only environment and a 16 KB emulator/device. Record device/OS, package version, launch/install results, and any alignment warnings. Useful documented checks are `adb shell getconf PAGE_SIZE` (expect `16384` in the 16 KB environment) and `zipalign -c -P 16 -v 4 <package.apk>`.
- Test representative phones and tablets: fresh install, upgrade, offline cold start, touch controls, safe areas, both supported orientations/window sizes, background/foreground transitions, native back, pause/resume, audio activation/mute, process termination, and save recovery. Record physical-device performance and crashes separately from browser emulation.
- Run and resolve applicable Play pre-release checks against the actual candidate package. Record any unresolved device-specific warnings rather than treating a successful upload as approval.

## Google Play declarations and account gates

- **Privacy policy:** supply real developer identity and a privacy contact mechanism, an active public non-geofenced non-PDF policy URL in Play Console, and policy text or a link in the app. Include local-data retention/deletion behavior. A policy is required even if no personal data is collected. Account deletion requirements apply if account creation is introduced; this game currently has no such account feature. [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- **Data Safety:** complete it for closed/open/production distribution, even with no collection. Exclusively internal-test apps are exempt. On-device-only processing is outside the collection declaration, but the final wrapper and all SDK behavior must be checked before declaring no collection/sharing. [Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-EN)
- Declare no ads only if that remains true in the shipped package. Provide accurate app-access instructions and complete the content-rating questionnaire. Do not claim a rating until it is assigned. [Review preparation](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
- Select the intended age groups honestly and align artwork, description, and gameplay with them. Including children invokes Families requirements. Do not choose an older audience merely to avoid those requirements. [Target audience guidance](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en)
- A WebView is not categorically banned. The policy prohibits unauthorized website wrappers, affiliate spam, repetitive content, and inadequate/broken functionality. The original bundled game must provide a stable, responsive, engaging experience. [Spam policy](https://support.google.com/googleplay/android-developer/answer/9899034?hl=en), [functionality policy](https://support.google.com/googleplay/android-developer/answer/9898783?hl=en)
- **If the publisher uses a personal account created after 13 November 2023:** complete a closed test with at least **12 testers opted in continuously for 14 days**, then apply for production access with actual engagement, feedback, and readiness evidence. Meeting the count/time threshold does not grant access automatically. [New personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- Check the publisher's identity/device verification and app registration status in its actual account. Android developer verification has a **30 September 2026** milestone for participating stores in Brazil, Indonesia, Singapore and Thailand; automatic registration of most Play apps is not evidence that this particular app is registered. [Developer verification](https://developer.android.com/developer-verification)

## Steam desktop preparation

- Package the local game using a maintained Electron version. The official stable release checked here is **44.2.0**, dated 3 September 2026. Electron supports its latest three stable major lines; record and update the actual runtime used for release. [Electron releases](https://releases.electronjs.org/?channel=stable), [support policy](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- Keep renderer Node integration disabled, context isolation and sandboxing enabled, web security enabled, and a restrictive Content Security Policy. Restrict navigation, new windows, permissions, and exposed IPC. Prefer a stable custom local protocol for bundled assets; validate any protocol-path and IPC handling. [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- This repository uses the official `@electron/packager` library through `scripts/package-desktop.mjs` to produce self-contained packages. Electron Forge is an alternative packaging workflow. Produce a package for each OS/architecture actually intended for release. [Electron packaging](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)
- Configure the real Steam App ID, depots, package membership, branch, and launch executable. Upload the packaged executable/resources, then test a clean installation through Steam on each advertised OS. Repository packaging success is not a Steam installation test. [Steam build/depot workflow](https://partner.steamgames.com/doc/sdk/uploading)
- Test offline play after installation, including cold start and local saves. Test windowed/fullscreen transitions, focus loss, pause/resume, quit, audio, and each advertised input method. Claims about offline behavior must describe what the delivered game actually supports.

## Steam store, content, and account gates

- Both the store page and near-final build require Valve review. The documented typical review is three to five business days; plan at least seven business days for each submission and possible corrections. All listed operating systems must launch the game, and all advertised supported features must exist. Use gameplay screenshots and readable product branding in capsules. [Steam review process](https://partner.steamgames.com/doc/store/review_process)
- Complete the Content Survey accurately. **Disclose AI-assisted generated artwork as Pre-Generated AI content**, including any other player-consumed generated content such as narrative/localization. Current Steam guidance focuses on shipped content consumed by players. The game's procedural WebAudio synthesis is not itself a live generative-AI service. Do not select Live-Generated unless runtime AI generation is actually introduced. [Steam Content Survey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey?l=english)
- Maintain an asset/source/license inventory covering art, fonts, code, and store marketing materials. Review generated art for infringement and prohibited content. The publisher must own or hold adequate distribution rights to shipped content. [Steam content rules](https://partner.steamgames.com/doc/gettingstarted/onboarding)
- Claim **Full Controller Support** only after controller-only navigation, startup, menus, gameplay, settings, pause, and exit are verified. Do not claim Steam Cloud, achievements, supported OSes, or Steam Deck verification without the corresponding implementation, testing, or actual status. [Controller definitions](https://help.steampowered.com/en/faqs/view/3725-76D3-3F31-FB63), [feature review](https://partner.steamgames.com/doc/store/review_process)
- The publisher must complete the actual Steamworks agreements, identity, banking/tax details, and product fee requirements. Initial releases may require the documented 30-day period after the app fee and at least two weeks of public Coming Soon visibility. No account completion, fee payment, waiting-period completion, or review result is established by this document. [Steam onboarding](https://partner.steamgames.com/doc/gettingstarted/onboarding)

## Submission blockers to close

1. Repeat the recorded checks against the signed release candidate and close the untested device/OS gates.
2. Supply the real publisher identity, privacy contact, support details, and public privacy-policy URL; align the in-app text and store declarations.
3. Complete signed-package, physical-device, desktop-OS, and Steam-installation checks that have not been performed.
4. Finish the applicable account verification, testing access, signing, store assets, content/AI declarations, and license inventory.
5. Submit the actual near-final packages and listings for the relevant store review, then record and address the actual outcome.

Store acceptance remains a decision by the respective store based on the submitted product, account, declarations, and applicable policies.
