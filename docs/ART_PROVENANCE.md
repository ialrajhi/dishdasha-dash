# Artwork and content inventory

Reviewed 6 September 2026 for Dishdasha Dash 1.4.0.

The game uses original AI-generated raster artwork made for this project from the user's Kuwaiti arcade visual direction. Reference photographs guided landmark shapes; the reference photographs themselves are not distributed. No Metal Slug sprites, characters, music, code, branding, or other game files are included. Metal Slug was a stylistic reference supplied by the user.

| Shipped asset | Source and review |
|---|---|
| Neighborhood panorama | Generated for this project; reviewed against the supplied Kuwait Towers photograph. Three shafts: medium one-sphere tower, tall two-sphere tower with lower viewing band, slender sphere-free tower. No looping or mirrored landmark copies. |
| Co-op panorama | Generated for this project; revised to the supplied blue/cream striped, flared water-tower cluster. No duplicate Kuwait Towers. |
| Souq panorama | Generated for this project; blank sign surfaces receive exact Arabic text in code. |
| Desert panorama | Generated for this project; tall mesas removed for a flat open plain with shallow sandy ridges. Vehicles have no deliberate logos or written branding. |
| Wedding panorama | Generated for this project; ambiguous generated calligraphic text removed; ornamental patterns retained. |
| Hero, prop, and extra sprite atlases | Generated for this project; transparent backgrounds and reviewed extraction bounds. Idle, jump, fall, hurt, death, and celebration states. Superseded run poses are retained only in editable source. |
| Hero and boy running strips | Generated for this project using built-in ImageGen. Twelve distinct contact/compression/passing/recovery drawings per character. RGB green source retained; reproducible chroma extraction, uniform pose scaling, crown/sole normalization and horizontal head anchoring in `scripts/prepare-run-art.mjs`. Exact prompts retained in `art/source/run12-manifest.json`. |
| Go Dance cast | Twelve original characters assembled from five painted parts each, with continuously animated shoulder/elbow and hip/knee joints. Eleven original move programs. Built-in ImageGen; final source atlases `art/source/rig-parts-{a,b,c}.png`, exact prompts in `art/source/rig-parts-prompts.json`, bounds in `art/source/rig-parts-bounds.json`. Reproducible extraction in `scripts/prepare-rig-art.mjs`; background-connected green extraction preserves the cat’s green eyes. Boy has uncovered hair; Maryam in a black abaya replaces the chef. Prior pose sheets remain source-only. |
| Duck poses and overhead awning | Built-in ImageGen, four crouching drawings and one hanging awning; sources `art/source/hero-duck4-sheet.png` and `art/source/hanging-awning.png`. Exact prompts in `art/source/duck-prompts.md`, frame bounds in `art/source/duck-bounds.json`, reproducible conversion in `scripts/prepare-duck-art.mjs`. Controlled Arabic cue rendered in code. |
| Application icon | Generated for this project; friendly original hero with ghutra and agal on navy, no text. Technical icon conversions supply Android, macOS, and Windows formats. |
| Interface and world text | Authored/edited for this game, reviewed for language roles. English menus by default; Arabic HUD, dialogue and shop signs. AI-assisted text should be covered accurately in Steam's Content Survey. |
| Audio | Synthesized in TypeScript/Web Audio. Go Dance adds six original looping arrangements with distinct tempos, melodies, bass, percussion and timbres. No sampled commercial recordings or runtime AI generation. |

Arabic signs are rendered from controlled strings: بقالة بو خالد، الجمعية التعاونية، بهارات وتمور، أقمشة كويتية، المباركية. The Kuwait flag uses the green/white/red bands and black hoist trapezoid. Named landmarks are cultural setting details; the game does not claim an official affiliation or endorsement.

Editable source PNGs are stored in `art/source/`. Optimized WebP assets are in `public/assets/arcade/` and `public/assets/dance/`. Backgrounds use quality 93 WebP; sprite sheets use lossless WebP. Source images and prompts are not loaded at runtime. Floor/sign bounds are recorded in `src/utils/sceneryLayout.json`; sprite crop bounds are in `src/utils/arcadeFrames.json` and `ArcadeArt.ts`.

The publisher must still confirm rights to their supplied references and all final store marketing materials, and complete store declarations. This inventory documents origin and engineering review; it is not a legal clearance or store approval. Pre-generated AI disclosure is required for the generated player-facing content when completing Steam's Content Survey.

Third-party software and font license notices are bundled in `public/third-party-licenses.txt`, accessible through Options → About & privacy → Software & font licenses. Desktop distributions also retain Electron/Chromium license files supplied by Electron.

Embedded engine and Android runtime notices are retained under `docs/licenses/` and generated into the offline asset. The unused RVFC video polyfill is excluded during engine preparation; its differing upstream license is documented in the engine provenance file.

The supplied Metal Slug gameplay video was inspected through timestamped frames for movement principles only. It is not distributed. The generated twelve-pose cycle remains a stylized approximation: near/far ankle depth is not anatomically exact in every pose. Higher texture resolution and render interpolation do not imply hand-authored animation or guarantee individual motion comfort.

The four supplied dance GIFs were inspected as movement references (shuffle, knee lifts, crossing steps and arm sweeps). Their image frames, characters and recordings are not bundled. The shipped dances are original 2D skeletal approximations, not motion capture or exact copies of the GIF choreography.
