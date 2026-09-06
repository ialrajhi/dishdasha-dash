# Android upload signing

No upload key has been created, replaced or selected in this preparation pass. The current application ID is `com.falrajhi.dishdashadash`; confirm it before the first Play upload. The publisher keeps the upload key and an encrypted backup under their control. Never commit a keystore, password, credential file or backup to this project.

## Existing key

Use the publisher's existing upload key if this app already has one. Supply these values through a local password manager / private environment:

- `DASH_UPLOAD_KEYSTORE`: absolute path to the private keystore outside this repository.
- `DASH_UPLOAD_STORE_PASSWORD`: keystore password.
- `DASH_UPLOAD_KEY_ALIAS`: alias inside that keystore.
- `DASH_UPLOAD_KEY_PASSWORD`: key password.

Run `npm run android:release` from the project. The script checks required inputs first, builds production web assets, syncs Android, runs lint, creates the AAB and verifies that it is signed before naming it `upload-signed`. Missing signing inputs fail the release command rather than producing a mislabeled unsigned package. Passwords are read from the environment, not command-line arguments or committed Gradle properties.

If no key exists, use Android Studio's **Generate Signed Bundle / APK → Android App Bundle → Create new** flow with the publisher's real identity and a private location. Complete Play App Signing setup in the publisher's Play Console. Confirm certificate fingerprints against the actual Console record before uploading subsequent updates. Back up the upload key securely. Creating a local signed bundle does not register or publish the app.

## Test packages while signing is pending

Run `npm run android:package` to make a debug-signed APK and an explicitly **unsigned** AAB. These are preparation artifacts. The unsigned AAB is not ready for Play upload; the debug APK is for private device checks.

The current release-preparation version is **1.5.0 / version code 7**. Keep version codes increasing for future Play uploads. `scripts/prepare-site-download.mjs` can expose the current test APK on the existing private game site after Android packaging; it verifies that the bundled web entry point matches the current web build.

After signing, test a build delivered through Play internal testing. Record installation, offline cold start, upgrade/save retention and the Play pre-launch report for that exact version.

Source checked 6 September 2026: [Android app signing](https://developer.android.com/studio/publish/app-signing), [uploading the bundle](https://developer.android.com/studio/publish/upload-bundle).
