# Play Console setup — draft, not submitted

Prepared for Dishdasha Dash 1.5.0 on 6 September 2026. Account verification is pending, as reported by the publisher. Do not infer account type or completion from that status.

| Console item | Prepared answer / next input |
| --- | --- |
| App | Dishdasha Dash · Game · English default listing |
| Application ID | Current candidate: `com.falrajhi.dishdashadash`; publisher confirmation before first upload |
| Developer / studio name | **Publisher to provide**; align with account and privacy policy |
| Support email | **Publisher to provide** a public working address |
| Website and privacy URL | Final public policy page still required; the private game preview is not a public policy page |
| Free / paid | **Publisher decision**. No price promise is included in listing copy |
| Ads | Proposed **No** for the current package; verify again if monetization changes |
| In-app purchases | None in the current package |
| App access | Installed Android game requires no login, membership, payment gate, invitation or special access instructions |
| Data Safety | Proposed **No collection / No sharing** for the current offline game. Final check must include all shipped native libraries and platform services before submission |
| Accounts / deletion | No in-game account creation. Local data can be cleared using Android app storage settings; Reset progress clears progress/party and retains settings |
| Target audience | **Publisher to specify actual intended age groups**. Do not guess an older age to avoid children’s requirements |
| Content rating | Complete the actual IARC questionnaire after reviewing all game/dance content; no rating has been assigned |
| Distribution | **Publisher to choose** Kuwait, GCC or other countries |
| Testing track | Internal test with Play-delivered candidate first; satisfy closed-test requirements applicable to the actual account |
| Release notes | See below |

## Proposed initial release notes

Explore five Kuwaiti stages, learn to jump and duck in a short practice area, collect tea and golden dallahs, and build your own party in Go Dance. English and Arabic menus, adjustable sound and visual effects, and local saved progress.

## Privacy review details

- Current JavaScript/native runtime inventory: Phaser; Capacitor Android with App and Preferences plugins; bundled fonts; original game artwork; locally synthesized audio. No ad, analytics, crash-reporting or Play Games SDK has been added.
- The Android manifest requests INTERNET for its WebView runtime, has cleartext networking disabled, and disables backup/data extraction. A permission is not itself evidence of data collection. Inspect actual final network behavior before declarations.
- The local save now includes practice status alongside progress, scores, settings and Go Dance party. Update any future policy when cloud saves, accounts, ads, purchases or analytics are introduced.
- User-supplied publisher identity and contact must be added to both the public policy and in-app About & privacy before submission. The draft contains placeholders only in internal documents, not in the game.

## Content and credits

Keep the original illustrated characters and music. Do not add Metal Slug footage, third-party GIFs, logos or celebrity imagery to the package or store graphics. Reference media informed motion, not licensed distribution assets. Maintain `docs/ART_PROVENANCE.md` and bundled software/font notices. Confirm rights to all final marketing artwork separately.

Credits already exist in About & privacy. Publisher/company credit can be added once its exact name is supplied. A separate company splash or an achievement system is not a submission prerequisite.

## Sources checked

- [Review preparation](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
- [Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Privacy policy requirements](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [Target audience](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en)
- [Personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

These are preparation notes, not completed declarations or a guarantee of store acceptance.
