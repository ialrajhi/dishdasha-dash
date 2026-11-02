# دشداشة Dash

A complete, original Kuwait-themed browser arcade game built with **Phaser 3, TypeScript, Vite, and HTML/CSS**. Run from الفريج to العرس, collect steaming tea glasses, avoid angry dallahs, and find five golden dallahs.

The arcade edition uses original illustrated Kuwait backgrounds and transparent sprite atlases, bundled in `public/assets/arcade/`. No third-party image service, backend, or audio download is needed at runtime. Sound and music use Web Audio; Arabic and English fonts are bundled locally. A loading screen protects the game until all art is ready and provides a retry if a download fails.

## What’s new in 2.0

- **Startup flow:** tea-glass loading screen → animated title (“Press any key / Tap to start”) with the hero running down the street → full-screen main menu. No web-page header or footer: the game fills a 16:9 frame and the letterbox shows a blurred copy of the stage art.
- **Tighter controls:** a tap is a reliable short hop (it clears every crate), holding gives a full leap, **double jump** in mid-air, and **Duck in mid-air slams** you to the ground.
- **Coins, shop and avatars:** spinning coin trails (arcs over pits, high lines that need a jump) fill the gap between obstacles. Coins buy six outfits (Bu Khalid, Navy Night, Desert Sand, Winter Charcoal, Emerald, Golden Legend with a sparkle trail) and magnet/shield upgrades.
- **Power-ups:** the magnet pulls coins and tea in; the bubble shield blocks one hit. HUD rings show the time left.
- **Juice:** pickups fly from the world into their HUD counter, sparkle bursts, rings, pop-in score text, combo multipliers (×2 at 10, ×3 at 25, ×4 at 50 pickups without a hit), hit-stop and screen shake on damage, a slow-motion flash for the golden dallah, confetti finishes, and 1–3 star ratings with animated results screens.
- **Chapter 2 · Kuwait Nights:** five new night stages (6–10) on the same streets, each moonlit at load time (night grade, glowing lanterns, stars only over open sky, a moon), with fireflies, a third pit, faster speeds, more moving hazards and a night soundtrack. The finale is now Stage 10, the zaffa.
- **Grounded running:** run poses advance with distance travelled, not a fixed frame rate, and each pose lasts exactly as long as its planted sandal travels in the artwork, so feet no longer skate. The title runner and the run over to the menu use the same stride. Ducking is a held power-slide pose with dust.
- **Proper shemagh colors:** outfit recoloring flood-fills the ghutra from the top of the head, so the whole scarf, flowing tail included, takes the headwear color and the robe keeps its own.
- **Stage intro card and iris reveal** at the start of every level, and contact shadows under every street hazard (the cat sits still and breathes instead of rocking).
- **New sound:** a synthesized mixer with compression and reverb, glass-clink tea, coin chimes that climb with the combo, thumps, whooshes, fanfares and a Hijaz-scale soundtrack with darbuka-style rhythm (separate menu and in-game tracks).

## Install and run

Use Node.js 22.12+ and npm (Node 24 was used for this release pass).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a phone on the same Wi-Fi network, open Vite’s Network URL and rotate to landscape. The game also allows portrait play.

```bash
npm run build
npm run preview
```

The production build is in `dist/` and can be served by any static web host. Vite creates an engine copy under ignored `build/engine/`, excluding the unused third-party video-frame polyfill with a unique-match assertion; this game does not use video. Use the committed `package-lock.json` with `npm ci` for reproducible installs. npm is the canonical package manager.

## Release builds

See [Release readiness](docs/RELEASE_READINESS.md) for verified checks and the remaining store gates. The Android project targets API 36 with Capacitor 8.5.1; Electron 44.2.0 provides desktop packaging. No store submission or production signing has been performed.

```sh
npm run build
npm run android:sync
# With JAVA_HOME (Java 21) and ANDROID_HOME configured:
cd android
./gradlew :app:assembleDebug :app:bundleRelease :app:lintRelease
```

The debug APK is for testing. The release AAB remains unsigned until the publisher configures their own upload key. Application ID `com.falrajhi.dishdashadash` is provisional until the publisher confirms the permanent identity. The current test package is version 1.4.1 / versionCode 6.

```sh
# From the project root, after building:
node scripts/package-desktop.mjs darwin arm64
node scripts/package-desktop.mjs win32 x64
```

Outputs go into `release/desktop/`. A Windows package built on macOS still requires Windows/Steam installation testing. Installed packages bundle all assets and work offline. macOS signing/notarization, Windows signing, Steam depots, and store listings are publisher release steps. `npm run assets:native` regenerates launcher icons; macOS icon conversion requires macOS iconutil.

After building the final web assets and Android APK, `node scripts/prepare-site-download.mjs` adds a private `test-builds/` download page to `dist/`. Run this only after native packaging so native apps never include their own downloadable APK. It verifies the APK contains the current web index before copying it.

## Controls and rules

| Action       | Keyboard                       | Touch                                 |
| ------------ | ------------------------------ | ------------------------------------- |
| Run          | Automatic                      | Automatic                             |
| Jump         | Space, Up, W                   | Right side of the game or JUMP button |
| Jump higher  | Hold the jump key              | Hold the touch                        |
| Double jump  | Press jump again in mid-air    | Tap JUMP again in mid-air             |
| Duck         | Hold Down or S                 | Hold the Duck button                  |
| Slam down    | Down or S in mid-air           | Duck button in mid-air                |
| Pause/resume | Esc                            | Pause button / Resume                 |
| Menus        | Tab or arrow keys, Enter/Space | Tap a button                          |

Standard controllers use the bottom face button (A / ✕) for Jump/Select, the right face button (B / ○) for Duck while playing or Back in menus, Start for Pause, and the D-pad or left stick for menus. Physical controller and Steam Input certification remain release tests. Options includes Reduce effects, privacy/credits, licenses, and desktop Quit.

One air jump is allowed after leaving the ground; a press close to the ground stays buffered for a normal landing jump instead. Hold Duck to pass under hanging awnings; Duck in mid-air slams down. Ducking blocks jump buffering and keeps the character low until the trailing edge clears, including after pause/resume. Jump buffering is 140 ms; coyote time is 110 ms. Releasing jump early switches to stronger rising gravity, so a tap is a short hop rather than a stalled jump. The practice’s first press is always a full jump. Each stage begins with 3 hearts and 3 lives. Damage has 1.2 seconds of invulnerability. Death costs one life and respawns at the start or the invisible midpoint checkpoint, restoring hearts. Collected items and awarded obstacle points are retained to prevent farming by respawning.

Three lives means three total attempts. With zero lives, Retry begins a fresh attempt at that stage. Escape and focus loss pause gameplay, physics, enemy movement, and game timers; returning to the browser leaves a paused run for you to resume.

## Ten stages in two chapters

| Stage         | Setting                                                | Base speed | Approximate duration |
| ------------- | ------------------------------------------------------ | ---------- | -------------------- |
| 1 — الفريج    | Neighborhood, grocery shop, palm trees, Kuwait skyline | 145 px/s   | 68 s                 |
| 2 — الجمعية   | Co-op, parking, grocery carts and bags                 | 157 px/s   | 70 s                 |
| 3 — المباركية | Souq, spices, lanterns, fruit stalls                   | 165 px/s   | 72 s                 |
| 4 — البر      | Sunset desert, camps, SUVs, goats and wind             | 174 px/s   | 72 s                 |
| 5 — العرس     | Wedding hall, guests, gifts, coffee service            | 181 px/s   | 75 s                 |
| 6 — الفريج بالليل | Neighborhood Nights (moonlit)                      | 186 px/s   | 70 s                 |
| 7 — جمعية آخر الليل | Late-Night Co-op                                  | 190 px/s   | 70 s                 |
| 8 — المباركية بالفنر | Souq by Lantern Light                            | 195 px/s   | 70 s                 |
| 9 — ليلة بالبر | Desert Starlight                                     | 200 px/s   | 70 s                 |
| 10 — الزفة     | The Zaffa Parade (finale)                             | 206 px/s   | 72 s                 |

The final stage speeds up by 8% near its finish. Deaths and pauses add to the time. Stages 3–5 include two clearly marked small gaps and night stages three. Every stage contains exactly one golden dallah. Night stages set `night: true` and `art` (the day street they reuse) in `levels.ts`; `nightGrade()` in `ArcadeArt.ts` builds their moonlit art once at load.

## Scores and saves

Tea: **+100 × combo multiplier**. Coin: **+10 × multiplier** and one coin for the shop. Avoided obstacle: **+25**. Golden dallah: **+5,000**. Finish: **+1,000**. Every tea in a stage: **+2,000**. Remaining hearts: **+250 each**. Remaining lives: **+500 each**.

Stars: one for finishing, one for the golden dallah, one for collecting at least 90% of the tea. Finishing also pays 20 + 10 per star in bonus coins. Coins collected before a game over are kept.

Save format version 2 retains the LocalStorage key `dishdasha-dash:v1` for migration. Menus default to English; version-1 saves retain scores/unlocks and migrate to English. Version-2 saves preserve the chosen menu language. The HUD and world text always remain Arabic.

Android also writes native Preferences. Snapshots carry monotonic revisions, writes are serialized, and startup chooses the newest valid local/native save, including intentional resets. Failed saves display a Retry message. Android backup is disabled.

 The game saves unlocked stages, overall best score, best completed score and tea count per stage, golden dallahs, and audio/language settings. Goldens save immediately on collection, even if the current attempt fails. Better records are never replaced with worse ones.

Campaign totals on the victory screen represent stages played in that run; the golden count represents all five persistent discoveries. Starting from Level Select begins a new run at that selected stage. Restarting a stage keeps the campaign’s other completed stage results. Death totals include retries.

Saves belong to the current browser and site origin. A localhost save does not transfer to the hosted site or another device. If storage is unavailable, the game still runs with in-memory progress and a visible save warning. Browser, Android, and desktop saves do not sync across devices; Steam Cloud is not implemented. Options → Reset progress has a Yes/No confirmation and preserves audio/language preferences.

## Project structure

```text
src/
  main.ts                     Phaser configuration, screen routing, lifecycle
  ui/game.css                 Full-screen frame, title, menus, shop, HUD and results
  config/Constants.ts         Resolution, scoring constants, development flags
  scenes/
    BootScene.ts              Asset loading, progress, recovery, and atlas preparation
    MenuScene.ts              Animated title background
    GameScene.ts              Gameplay, health, checkpoints, progression
    WorldRenderer.ts          Bounded panorama pan and environmental animation
  entities/
    Player.ts                 Body, input state, character animation selection
    Obstacle.ts               Hazard behavior and forgiving collision bounds
    Collectible.ts            Tea/golden animation and pickup bounds
  levels/levels.ts             Five level configurations and deterministic course builder
  systems/
    AudioManager.ts           Procedural audio plus file replacement hooks
    LocalizationManager.ts    Arabic / English labels and Kuwaiti messages
    SaveManager.ts            Validated saves, revision ordering and write queue
    ScoreManager.ts           Level scoring and campaign statistics
    Economy.ts                Outfits, upgrades, power-up durations and star rules
    Fx.ts                     Particles, rings, pop text, shake and flash
  ui/
    GameUI.ts                 All menu screens, HUD, touch controls
    icons.ts                  Reusable interface icons
  utils/AvatarArt.ts          Outfit recoloring of every hero pose, shop previews
  utils/FxArt.ts              Procedural coin, sparkle, ring, power-up bubble textures
  utils/ArcadeArt.ts          Sprite extraction, pose normalization, looping street textures
  utils/arcadeFrames.json     Reviewed sprite source bounds
  utils/sceneryLayout.json    Landmark panoramas, exact signs and floor alignment
  platform/                  Android lifecycle/storage and controller input
  utils/PixelArtGenerator.ts  Original procedural art and collision-root texture
tests/
  core.test.ts                Save corruption, persistence, scoring, level safety
  browser/                   Interaction and full-course browser tests
```

The game renders at **1280 × 720** with responsive 16:9 scaling. A centered 2× camera preserves the original **640 × 360 logical world**, course spacing, and jump physics. HTML menus provide Arabic shaping, RTL layout, keyboard focus, and touch interaction.

## Arcade art and animation

The five 1672 × 941 backgrounds share a visual direction but have independently reviewed floor coordinates. `ArcadeArt.ts` renders exact Arabic shop signs and extracts a looping foreground street from each panorama. Each unique panorama pans slowly across its available width as the stage progresses. Landmarks never loop, mirror, or crossfade. The street moves at full speed. Birds, dust motes, wind, sparks, pickup movement, landing dust and confetti add motion.

The 1254 × 1254 hero atlas includes eight running frames, two idle poses, jump, fall, hurt, death, and two celebration poses. Custom rectangles in `arcadeFrames.json` preserve frames that cross nominal grid boundaries. Each frame is normalized to a 192 × 160 canvas with a shared foot baseline. The visible sprite follows an invisible 36 × 48 physics root after physics updates. Its **19 × 39 collision body at offset (9, 9)** remains unchanged. Landing squash affects only the visual sprite.

The main transparent prop atlas provides tea, both dallahs, cart, cat, crate, cone, football, melon, carpet, cooler, chair, gifts, tea tray, flowers and pigeon. An additional atlas supplies grocery bags, the boy, waiter, tire, goat and tent rope. Moving hazards sway, bounce or roll; collision bounds remain deliberately forgiving.

To replace artwork:

1. Replace the corresponding source PNG under `art/source/`, then run `npm run assets:prepare`.
2. Update `arcadeFrames.json` bounds for the main hero/props sheets, or the extra-hazard bounds in `ArcadeArt.ts`. Bounds are `[left, top, rightExclusive, bottomExclusive]`.
3. For backgrounds, update `sceneryLayout.json` and its `floorY` to the painted curb edge. The renderer aligns it to world y=300.
4. Adjust `propHeight` or `HERO_SCALE` for visual size, keeping collision geometry separate.
5. Run the browser tests and inspect all five stage screenshots at desktop and phone sizes.

Hero and prop artwork uses true transparency. The runtime removes almost transparent colored edge pixels. Menus and HUD portraits use the prepared frames, and stage thumbnails use the same original backgrounds. Asset downloads stay within the game’s own origin.

## Add music and sounds

All audio is synthesized in `AudioManager.ts`: no files to license or load. Audio starts on the title screen’s first key press or tap, because browsers restrict autoplay. The game remains playable if audio is unavailable.

Effects are recipes in `play()` built from oscillators, filtered noise and a bell helper (inharmonic partials for glass and metal). `play(name, step)` raises the pitch by `step` quarter-tones for combo chains. The soundtrack is a look-ahead sequencer (`schedule()` / `note()`) with Hijaz-scale phrases (`MELODY_A`, `MELODY_B`), a maqsum drum pattern and a drone; `music("menu" | "game" | "none")` switches tracks. Music and effects have separate toggles and share the 0–100% volume control.

## Development flags

In `src/config/Constants.ts`:

```ts
export const UNLOCK_ALL_LEVELS = false;
export const DEV = {
  unlockAllLevels: UNLOCK_ALL_LEVELS,
  invincible: false,
  showHitboxes: false,
  startLevel: 0, // 0: menu; 1–5: start directly in a development build
};
```

Level Select is the developer level selector when all levels are unlocked. Set every flag back to the defaults before sharing the game.

`?testing=1` exposes a browser test bridge only in a Vite development build. Production builds never expose that bridge. The bridge allows reproducible physics testing without changing shipped rules or adding player-facing cheats.

## Add Level 6

1. Add a configuration to `LEVELS`, with id 6, speed, duration, colors, messages, and an obstacle list.
2. Reuse an existing theme, or extend `Theme` and supply a background PNG plus its floor coordinate in `ArcadeArt.ts`.
3. Replace the five-level limits in SaveManager, `main.ts`, development validation, and final-victory routing with `LEVELS.length`. Update HUD totals and menu route markers in GameUI, then add a `--level-art-6` CSS binding.
4. Include the new stage in progression and full-course tests. Check gaps, pickup placement, checkpoint safety, and final-sprint behavior.

All course contents are generated deterministically from level data. Hazard spacing, opening tea trail, midpoint, gaps, and golden placement live in `createCourse`; there is no copy of gameplay code for each level.

## Tests

```bash
npm test
npm run test:browser
```

Start `npm run dev` before browser tests. By default the browser test config uses installed macOS Google Chrome. Set `CHROME_PATH` to a Chrome executable on another system. These tests use fresh browser contexts and do not modify your personal save data.

The test suite covers cold loading, download failure/retry, HD rendering, all stage assets, stable physics geometry, tea, hearts, death, midpoint respawn, game over/retry, pause/resume, settings, language, touch, all five completion transitions, and persistent unlocks. A full-course test advances the actual Phaser loop at normal 60 Hz simulation steps with jump inputs and normal collision rules, traversing every meter of all five levels; it does not teleport the player or enable invincibility. Separate transition tests teleport only to exercise end screens quickly.

## Art and font credits

Game artwork was generated for this project from the user’s supplied visual direction, then integrated as sprite atlases and scrolling scenes. It uses original Kuwaiti characters and settings; no Metal Slug characters or game assets are included. Synthesized audio is original. Changa and Space Grotesk are bundled via Fontsource under the SIL Open Font License; their license files are included in the corresponding packages.
Phaser documentation: https://docs.phaser.io/phaser/concepts/physics/arcade

Release-specific regression tests cover fixed simulation at 15/30/60/120/144 fps, mixed-input release, pause velocity, finish landing, reset ordering, native recovery, controller background gating, phone/tablet targets, and local license navigation. See `scripts/check-android.mjs` and `scripts/check-desktop.mjs` for isolated installed-build smoke tests. Native smoke tests use an Android emulator through ADB and a separate desktop profile.

[Artwork provenance](docs/ART_PROVENANCE.md) · [Privacy draft requiring publisher details](docs/PRIVACY_POLICY_DRAFT.md)

## Go Dance

Twelve original characters use continuously animated body/limb rigs with eleven moves and six original music tracks. Drag or tap guests to place them, then select a move. The boy has uncovered hair; Maryam in a black abaya replaces the removed chef. Saved parties retain valid guests and moves. `node scripts/prepare-dance-art.mjs` rebuilds the current rig atlases; source art and prompts are retained under `art/source/`.
