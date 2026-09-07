# Hero run artwork — 1.5.2

The previous 12-frame sheet repeated the same forward fist in both halves, hid most of the leg exchange beneath similar crouched silhouettes, and used per-pose full-height normalization. Correcting playback cadence alone did not make it read as running.

The replacement is eight newly authored drawings. Contact frames have different near-arm silhouettes; passing poses are narrow and upright with a clearly raised recovery knee. The near leg is on the viewer's side. The long dishdasha still naturally covers the upper legs; visible ankles, knee folds, silhouette and counter-swing together communicate the exchange.

| Frame | Drawing | Near leg | Near arm | Body height relative to contact |
| --- | --- | --- | --- | --- |
| 1 | Left contact | Forward, supporting | Back | Normal |
| 2 | Left compression | Supporting beneath front hip | Back | 2.86 world pixels lower |
| 3 | Passing | Supporting/trailing; far knee advances | Crossing forward | 1.82 pixels higher |
| 4 | Right reach | Trailing as far leg reaches | Forward | Normal |
| 5 | Right contact | Trailing as far foot contacts | Forward | Normal |
| 6 | Right compression | Recovering; far leg supports | Forward | 2.34 pixels lower |
| 7 | Passing | Raised knee passes forward | Back | 1.56 pixels higher |
| 8 | Left reach | Reaching forward | Back | 0.52 pixels lower |

## Registration and visual review

- Built-in image generation was used. All five prompts and the selected/rejected drawing record are saved in `art/source/hero-run8-prompts.json`. Final crops are specified in `art/source/hero-run8-manifest.json` and all consumed source images are in that directory.
- Only the selected drawings are imported. Several failed corrections are deliberately excluded: repeated back-half arm swing, baked checkerboard, overdeep compression and an overly upright replacement.
- `scripts/prepare-hero-run8.mjs` applies one global source scale **0.815**, aligns the head anchor and sandal baseline, and writes eight **384×320** cells. There is no per-pose full-height normalization, runtime stretching or added whole-body bob. The body movement is in the drawings.
- Runtime scale remains **0.26**. Contact height is approximately 67 pixels in the game world, matching the previous character size. Existing crouch-to-running face-size regression passes.
- Final raster crowns are at y `[60,71,53,60,60,69,54,62]`; the lowest opaque sandal pixels are `[317,317,317,317,317,316,317,317]`. Thus planted feet stay on the same baseline within one source pixel (0.26 world pixels).
- Contacts differ across about **58%** of their combined opaque pixel area. That is a duplicate-frame regression measure, not automatic proof of anatomical correctness. All eight rendered poses were separately inspected at enlarged and game-world size for arm exchange, lifted knee, width changes and ground contact.
- A four-second, real-time canvas preview plays the eight drawings at 12 FPS against a stationary ground line. It shows both an enlarged character and the actual game-world size, with no translating scenery or body transforms. The rendered pose sequence and its frame-by-frame output were inspected before gameplay integration. Preview: `art/review/run8-review.html`; clip: `art/review/hero-run8-in-place.mp4`.

## Game integration

Only the hero uses this eight-frame sheet; the boy retains his separate 12-frame atlas. `Player` computes actual horizontal speed from the displacement resolved by each physics step. Running FPS is `8 + 6 * clamp(abs(speed)/260, 0, 1)`, capped at 14. At zero travel the visual cleanly switches to the dedicated idle drawing, resets to contact for the next start, and does not freeze in a running pose. Airborne movement preserves gait phase and uses dedicated jump/fall artwork. Pausing still freezes the game normally.

The FPS clamp deliberately prioritizes readable authored poses over exact constant-distance stride at every possible speed. It is not an IK foot-lock system. Physics limits, player position, collider sizes, jump parameters, course geometry and scoring are unchanged. Landing squash/stretch was removed; compression now comes from the artwork.

Source regeneration: run `scripts/prepare-hero-run8.mjs`, then `scripts/review-run8.mjs` for the standalone review. The historical `prepare-run-art.mjs` generates the old sheet and boy art; it is not the new hero pipeline.
