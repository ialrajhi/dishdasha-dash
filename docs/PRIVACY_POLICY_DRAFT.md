# Dishdasha Dash — privacy copy draft

This file contains proposed player-facing text followed by publication requirements. Confirm it against the final Android/desktop packages and any future features before publication. Replace the publisher/contact placeholders with real information; do not show internal publication notes to players.

## Short in-app version

### Privacy

Dishdasha Dash runs offline. The game does not collect or share your personal data, and it has no ads, analytics, in-app purchases, or game accounts.

Your progress and settings are saved on your device. The game uses these local saves to remember your progress and preferences between sessions. Its sounds are synthesized on your device; the game does not record audio.

You can erase local saves by clearing the game's app data, or by clearing this game's site data when playing in a browser. Removing local data resets your progress and settings.

Privacy policy: [PUBLIC PRIVACY POLICY URL]

Privacy contact: [REAL PRIVACY CONTACT]

## Full policy draft

# Dishdasha Dash Privacy Policy

Effective date: [PUBLICATION DATE]

Developer/publisher: [REAL DEVELOPER OR PUBLISHER NAME]

Privacy contact: [REAL EMAIL ADDRESS OR OTHER WORKING CONTACT MECHANISM]

### Information handled by the game

Dishdasha Dash is an offline single-player game. The game does not collect or share personal data. It has no advertising, analytics, in-app purchases, game accounts, or developer-operated online gameplay services.

### Local progress and settings

The game stores progress and preferences locally on your device so they can be restored between sessions. These saves are not sent to the developer by the game.

Local saves remain until they are removed, cleared, or replaced. In Options → Reset progress, you can erase game progress while retaining audio and language preferences. You can erase them by clearing the game's app data in your device settings. If you play in a web browser, clear the game's site data using the browser's settings. This resets locally saved progress and preferences. The developer cannot retrieve a copy of your local saves.

### Audio

Game sounds are synthesized on your device. The game does not record your voice or other audio.

### Stores and device services

If you obtain the game through an app store, that store handles its own account, download, purchase, and related platform information under its own privacy policy. Device and operating-system services also operate under their own settings and policies. This policy describes the behavior of Dishdasha Dash itself.

### Changes and contact

If the game's data practices change, this policy will be updated to describe those changes. You can contact [REAL PRIVACY CONTACT] with questions about this policy.

## Publication blockers — internal only

- Supply a real developer/publisher name and working privacy contact. Do not invent a company, email address, postal address, or policy URL.
- Publish the final policy at an active, publicly accessible, non-geofenced URL. Google Play requires a policy even where no personal/sensitive data is accessed. The public policy must not be a PDF or a document that visitors can edit. Link it in Play Console and include policy text or a link within the game. [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- Confirm the exact native save implementation, Android backup configuration, desktop save location, browser fallback, and any in-game reset action. Adjust deletion/retention wording if the shipped behavior differs. If an in-game reset control exists, include its exact visible label in the player-facing deletion instructions.
- Audit the final release dependencies and wrapper for analytics, crash reporting, advertisements, remote resources, external services, or data transfer before using the no-collection/no-sharing statements. The current product scope includes none; adding one requires reassessment.
- Complete the actual Play Data Safety form separately. On-device-only processing does not need a collection declaration, but the form must account for relevant third-party SDK behavior and remain consistent with this policy. [Data Safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-EN)
- Supply a real effective date only when the final policy is published. Verify the public URL works without sign-in from the regions where the game will be distributed.
