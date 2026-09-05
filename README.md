# دشداشة Dash

A complete, original Kuwait-themed browser arcade game built with **Phaser 3, TypeScript, Vite, and HTML/CSS**. Run from الفريج to العرس, collect steaming tea glasses, avoid angry dallahs, and find five golden dallahs.

No backend, login, image downloads, or audio files are required. Original placeholder art is generated with Canvas; procedural sound and music use Web Audio. Arabic and English fonts are bundled locally.

## Install and run

Use Node.js 20.19+ or Node.js 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a phone on the same Wi-Fi network, open Vite’s Network URL and rotate to landscape. The game also allows portrait play.

```bash
npm run build
npm run preview
```

The production build is in `dist/` and can be served by any static web host. npm is supported by `package-lock.json`; the workspace also retains the pnpm lockfile used during development.

## Controls and rules

| Action       | Keyboard                       | Touch                                 |
| ------------ | ------------------------------ | ------------------------------------- |
| Run          | Automatic                      | Automatic                             |
| Jump         | Space, Up, W                   | Right side of the game or JUMP button |
| Jump higher  | Hold the jump key              | Hold the touch                        |
| Pause/resume | Esc                            | Pause button / Resume                 |
| Menus        | Tab or arrow keys, Enter/Space | Tap a button                          |

One jump only. Jump buffering is 140 ms; coyote time is 110 ms. Releasing jump early cuts upward speed. Each stage begins with 3 hearts and 3 lives. Damage has 1.2 seconds of invulnerability. Death costs one life and respawns at the start or the invisible midpoint checkpoint, restoring hearts. Collected items and awarded obstacle points are retained to prevent farming by respawning.

Three lives means three total attempts. With zero lives, Retry begins a fresh attempt at that stage. Escape and focus loss pause gameplay, physics, enemy movement, and game timers; returning to the browser leaves a paused run for you to resume.

## Five stages

| Stage         | Setting                                                | Base speed | Approximate duration |
| ------------- | ------------------------------------------------------ | ---------- | -------------------- |
| 1 — الفريج    | Neighborhood, grocery shop, palm trees, Kuwait skyline | 145 px/s   | 68 s                 |
| 2 — الجمعية   | Co-op, parking, grocery carts and bags                 | 157 px/s   | 70 s                 |
| 3 — المباركية | Souq, spices, lanterns, fruit stalls                   | 165 px/s   | 72 s                 |
| 4 — البر      | Sunset desert, camps, SUVs, goats and wind             | 174 px/s   | 72 s                 |
| 5 — العرس     | Wedding hall, guests, gifts, coffee service            | 181 px/s   | 75 s                 |

The last stage speeds up by 8% near its finish. Deaths and pauses add to the time. Later stages include clearly marked small gaps. Every stage contains exactly one golden dallah.

## Scores and saves

Tea: **+100**. Avoided obstacle: **+25**. Golden dallah: **+5,000**. Finish: **+1,000**. Every tea in a stage: **+2,000**. Remaining hearts: **+250 each**. Remaining lives: **+500 each**.

LocalStorage key: `dishdasha-dash:v1`. The game saves unlocked stages, overall best score, best completed score and tea count per stage, golden dallahs, and audio/language settings. Goldens save immediately on collection, even if the current attempt fails. Better records are never replaced with worse ones.

Campaign totals on the victory screen represent stages played in that run; the golden count represents all five persistent discoveries. Starting from Level Select begins a new run at that selected stage. Restarting a stage keeps the campaign’s other completed stage results. Death totals include retries.

Saves belong to the current browser and site origin. A localhost save does not transfer to the hosted site or another device. If browser storage is unavailable, the game still runs with in-memory progress. Options → Reset progress has a Yes/No confirmation and preserves audio/language preferences.

## Project structure

```text
src/
  main.ts                     Phaser configuration, screen routing, lifecycle
  style.css                   Cabinet, bilingual menus, responsive controls
  config/Constants.ts         Resolution, scoring constants, development flags
  scenes/
    BootScene.ts              Replacement asset loading and generated fallback art
    MenuScene.ts              Animated title background
    GameScene.ts              Gameplay, health, checkpoints, progression
    WorldRenderer.ts          Parallax layers and environmental animation
  entities/
    Player.ts                 Body, input state, character animation selection
    Obstacle.ts               Hazard behavior and forgiving collision bounds
    Collectible.ts            Tea/golden animation and pickup bounds
  levels/levels.ts             Five level configurations and deterministic course builder
  systems/
    AudioManager.ts           Procedural audio plus file replacement hooks
    LocalizationManager.ts    Arabic / English labels and Kuwaiti messages
    SaveManager.ts            Validated versioned LocalStorage
    ScoreManager.ts           Level scoring and campaign statistics
  ui/
    GameUI.ts                 All menu screens, HUD, touch controls
    icons.ts                  Reusable interface icons
  utils/PixelArtGenerator.ts  Original art generation and asset override registry
tests/
  core.test.ts                Save corruption, persistence, scoring, level safety
  browser/                   Interaction and full-course browser tests
```

The game renders at 640 × 360 with pixel-art filtering and responsive 16:9 scaling. Menus use semantic HTML over the canvas for Arabic shaping, RTL layout, keyboard focus, and touch interaction. Levels share the same scene and data-driven behavior.

## Replace character sprites

Put art in `public/assets/`. Add paths to `ASSET_OVERRIDES` in `src/utils/PixelArtGenerator.ts`:

```ts
export const ASSET_OVERRIDES: Record<string, string> = {
  "player-run-0": "/assets/player/run-0.png",
  "player-run-1": "/assets/player/run-1.png",
  "player-run-2": "/assets/player/run-2.png",
  "player-run-3": "/assets/player/run-3.png",
};
```

Character states are `idle`, `run`, `jump`, `fall`, `hurt`, `dead`, `victory`, `respawn`, each with frame indices 0–3. Current frames are **36 × 48**, with feet at the bottom and origin `(0.5, 1)`. The 19 × 39 collision body starts at offset `(9, 9)`; update `Player.ts` if your art changes size. You can duplicate a single frame for static states. Missing overrides automatically use generated artwork. For a sprite sheet, load it in BootScene and replace frame lookup in Player.animate.

## Replace environments and items

Use the same override registry. The generated key contract is:

| Key                           | Size       | Purpose                                               |
| ----------------------------- | ---------- | ----------------------------------------------------- |
| `sky-1` … `sky-5`             | 640 × 360  | Screen-space sky                                      |
| `far-1` … `far-5`             | 1280 × 360 | Transparent distant skyline, 0.15 scroll factor       |
| `mid-1` … `mid-5`             | 1280 × 360 | Transparent buildings and scenery, 0.55 scroll factor |
| `ground-1` … `ground-5`       | 640 × 60   | Repeating ground strip at y=300                       |
| `finish-1` … `finish-5`       | 120 × 120  | Finish arch, origin bottom-center                     |
| `tea`                         | 18 × 24    | Tea pickup                                            |
| `golden`                      | 40 × 40    | Golden dallah                                         |
| `box`, `cart`, `dallah`, etc. | 44 × 44    | Obstacles; use names from `ObstacleKind`              |

Keep pixel art integer-aligned and transparent where appropriate. Preserve obstacle silhouettes inside the forgiving hitboxes in `Obstacle.ts`, or update those bounds to match replacement art. The level-card thumbnails are generated from these same environment textures.

## Add music and sounds

The procedural soundtrack starts only after a user interaction because browsers restrict autoplay. The game remains playable if audio is unavailable. In `AudioManager.ts`, set:

```ts
musicFile = '/assets/audio/music.ogg';
readonly soundFiles = {
  jump: '/assets/audio/jump.wav',
  tea: '/assets/audio/tea.wav',
};
```

Available effect names: `jump`, `land`, `tea`, `golden`, `damage`, `death`, `complete`, `select`, `pause`, `victory`. Omitted effects keep their procedural fallback. Use short effects and browser-compatible files. Music and effects have separate toggles and share the 0–100% volume control.

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
2. Reuse an existing theme, or extend `Theme` and the environment painter with a new setting.
3. Replace the five-level limits in SaveManager, `main.ts`, development validation, and final-victory routing with `LEVELS.length`. Update HUD totals and menu route markers in GameUI, then add a `--level-art-6` CSS binding.
4. Include the new stage in progression and full-course tests. Check gaps, pickup placement, checkpoint safety, and final-sprint behavior.

All course contents are generated deterministically from level data. Hazard spacing, opening tea trail, midpoint, gaps, and golden placement live in `createCourse`; there is no copy of gameplay code for each level.

## Tests

```bash
npm test
npx playwright test
```

Start `npm run dev` before browser tests. By default the browser test config uses installed macOS Google Chrome. Set `CHROME_PATH` to a Chrome executable on another system. These tests use fresh browser contexts and do not modify your personal save data.

The test suite covers tea, hearts, death, midpoint respawn, game over/retry, pause/resume, settings, language, touch, all five completion transitions, and persistent unlocks. A full-course test advances the actual Phaser loop at normal 60 Hz simulation steps with jump inputs and normal collision rules, traversing every meter of all five levels; it does not teleport the player or enable invincibility. Separate transition tests teleport only to exercise end screens quickly.

## Art and font credits

Game artwork and synthesized audio are original project placeholders, with no third-party character art or business logos. Changa and Space Grotesk are bundled via Fontsource under the SIL Open Font License; their license files are included in the corresponding packages.
Phaser documentation: https://docs.phaser.io/phaser/concepts/physics/arcade
