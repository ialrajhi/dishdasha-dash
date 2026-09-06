# Dishdasha Dash — Google Play preparation kit

Version 1.5.0 · 6 September 2026

This kit prepares the work that does not depend on the publisher's pending developer-account approval. It is not a completed Play submission.

## Prepared

- English and Arabic app descriptions with short descriptions under 80 characters and names under 30.
- Existing game icon: 512 × 512 PNG, no alpha.
- Feature graphic: 1024 × 500 PNG, no alpha, using existing game artwork and bilingual branding.
- Five 1920 × 1080 browser previews of actual gameplay, ducking, Al-Mubarakiya, Go Dance and the menu. These use the packaged app layout at phone pixel density; they are explicitly labeled browser previews. Replace or supplement them with final Android captures after installed-device checks.
- Draft privacy policy, Console declaration worksheet, upload-signing instructions and a physical-device tester card.
- An Android test APK and explicitly unsigned AAB in `release/android`. No upload key has been created or changed.

`npm run store:prepare` regenerates the local review kit under `release/google-play/1.5.0` while the local game preview is running. The feature-graphic HTML in that output folder is self-contained for review. Store materials and test APKs are not bundled into the Android game.

## Still needs the publisher

1. Exact publisher/studio name, public support/privacy email and final public policy location.
2. Intended age groups, price/monetization and launch countries.
3. Confirmation of the application ID before its first Play upload; final upload-key management and Play App Signing enrollment.
4. Account verification and applicable testing/production access in the actual Console.
5. Real Android phone/tablet feedback and the pre-launch report from the Play-delivered signed candidate.

The existing in-game credits remain accessible through Options → About & privacy. Add the exact studio credit when supplied. Company splash animation and achievements remain optional follow-up features; they have not been added or advertised as existing.

## Asset guidance

The first three previews show gameplay directly. The separate feature graphic is marketing artwork, not a screenshot. All previews use this game's own assets; no external reference video, GIF, brand logo or celebrity image is included.

The chosen image sizes follow Google's current [preview asset guidance](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en), checked 6 September 2026. Screenshot recommendations for larger promotional formats are distinct from basic listing requirements; these dimensions do not guarantee placement or review approval.
