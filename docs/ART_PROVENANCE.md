# Artwork and content inventory

Reviewed 5 September 2026 for Dishdasha Dash 1.1.1.

The game uses original AI-generated raster artwork made for this project from the user's Kuwaiti arcade visual direction. Reference photographs guided landmark shapes; the reference photographs themselves are not distributed. No Metal Slug sprites, characters, music, code, branding, or other game files are included. Metal Slug was a stylistic reference supplied by the user.

| Shipped asset | Source and review |
|---|---|
| Neighborhood panorama | Generated for this project; reviewed against the supplied Kuwait Towers photograph. Three shafts: medium one-sphere tower, tall two-sphere tower with lower viewing band, slender sphere-free tower. No looping or mirrored landmark copies. |
| Co-op panorama | Generated for this project; revised to the supplied blue/cream striped, flared water-tower cluster. No duplicate Kuwait Towers. |
| Souq panorama | Generated for this project; blank sign surfaces receive exact Arabic text in code. |
| Desert panorama | Generated for this project; tall mesas removed for a flat open plain with shallow sandy ridges. Vehicles have no deliberate logos or written branding. |
| Wedding panorama | Generated for this project; ambiguous generated calligraphic text removed; ornamental patterns retained. |
| Hero, prop, and extra sprite atlases | Generated for this project; transparent backgrounds and reviewed extraction bounds. Idle, jump, fall, hurt, death, and celebration states. Superseded run poses are retained only in editable source. |
| Hero and boy running strips | Generated for this project using built-in ImageGen. Four alternating contact/passing poses per character. RGB green source retained; reproducible chroma extraction, shared scaling and foot baseline alignment in `scripts/prepare-run-art.mjs`. Exact prompts retained in `art/source/run-cycle-prompts.json`. |
| Application icon | Generated for this project; friendly original hero with ghutra and agal on navy, no text. Technical icon conversions supply Android, macOS, and Windows formats. |
| Interface and world text | Authored/edited for this game, reviewed for language roles. English menus by default; Arabic HUD, dialogue and shop signs. AI-assisted text should be covered accurately in Steam's Content Survey. |
| Audio | Synthesized in TypeScript/Web Audio. No sampled commercial recordings or runtime AI generation. |

Arabic signs are rendered from controlled strings: بقالة بو خالد، الجمعية التعاونية، بهارات وتمور، أقمشة كويتية، المباركية. The Kuwait flag uses the green/white/red bands and black hoist trapezoid. Named landmarks are cultural setting details; the game does not claim an official affiliation or endorsement.

Editable source PNGs are stored in `art/source/`. Optimized WebP assets are in `public/assets/arcade/`. Backgrounds use quality 93 WebP; sprite sheets use lossless WebP. Source images and prompts are not loaded at runtime. Floor/sign bounds are recorded in `src/utils/sceneryLayout.json`; sprite crop bounds are in `src/utils/arcadeFrames.json` and `ArcadeArt.ts`.

The publisher must still confirm rights to their supplied references and all final store marketing materials, and complete store declarations. This inventory documents origin and engineering review; it is not a legal clearance or store approval. Pre-generated AI disclosure is required for the generated player-facing content when completing Steam's Content Survey.

Third-party software and font license notices are bundled in `public/third-party-licenses.txt`, accessible through Options → About & privacy → Software & font licenses. Desktop distributions also retain Electron/Chromium license files supplied by Electron.

Embedded engine and Android runtime notices are retained under `docs/licenses/` and generated into the offline asset. The unused RVFC video polyfill is excluded during engine preparation; its differing upstream license is documented in the engine provenance file.
