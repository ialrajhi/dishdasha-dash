# GitHub backup

Private repository: https://github.com/ialrajhi/dishdasha-dash

Backup snapshot: **2026-11-01**, game version **1.5.2**.

The repository contains the complete local Git history, source code, original
artwork and prompts, prepared game assets, Android and desktop projects, tests,
dependency lockfile, licenses, and release documentation. `main` is the backup
default branch; the original `codex/dishdasha-dash` branch is also retained.

The private release `backup-2026-11-01` holds the larger files normally excluded
from Git:

- `desktop-windows.tar.zst`: all existing Windows release ZIPs, versions 1.1.0–1.4.1.
- `desktop-macos.tar.zst`: all existing macOS release ZIPs, versions 1.1.0–1.4.1.
- `android-builds.tar.zst`: every existing Android APK, unsigned AAB, and build manifest,
  through version 1.5.2.
- `desktop-unpacked.tar.gz`: the unpacked desktop applications, including symlinks.
- `supporting-files.tar.gz`: the Google Play 1.5.0 kit, release QA evidence, staged
  website (`dist`), intermediate web/desktop files (`build`), browser screenshots,
  and extra animation review captures.

Archives preserve their paths relative to the project root. The release includes
`backup-manifest.json` with file hashes, archive hashes, and the exact source
commit, plus `SHA256SUMS.txt` for checking the downloaded archives.

## Restore on another computer

Install GitHub CLI and Zstandard (`zstd`), then authenticate GitHub CLI with the
account that can access the private repository. For example, Homebrew on macOS
provides them with `brew install gh zstd`.

```sh
gh repo clone ialrajhi/dishdasha-dash
cd dishdasha-dash
gh release download backup-2026-11-01 --dir /tmp/dishdasha-backup
cd /tmp/dishdasha-backup
shasum -a 256 -c SHA256SUMS.txt
cd -
for archive in /tmp/dishdasha-backup/*.tar.gz; do
  tar -xf "$archive"
done
for archive in /tmp/dishdasha-backup/*.tar.zst; do
  zstd -d --memory=512MB -c "$archive" | tar -xf -
done
npm ci
npm run dev
```

Use Node.js 22.12 or newer. Android builds also require an Android SDK and a
compatible Java installation; configure the local SDK path on the new computer.
See `README.md`, `store/google-play/signing.md`, and the versioned release notes
for build and signing instructions.

Dependencies, Gradle caches/build intermediates, machine-specific SDK paths, and
OS metadata are excluded. No signing keystore or environment-secret file was
found in the project when this backup was prepared. Browser/player progress and
files elsewhere on the computer are outside this project backup.

This is a dated backup, not an automatic recurring backup. Future source changes
must be committed and pushed, and newly packaged builds uploaded separately.
