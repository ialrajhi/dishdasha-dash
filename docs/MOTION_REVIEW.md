# Motion and sharpness review — 1.3.0

The supplied Metal Slug recording was inspected for stable upper-body anchors, leg phases and ground contact. Reference frames are inspection material only and are not distributed in the game. The recording has variable frame timing, so it does not establish the original animation frame rate.

## Implemented

- Twelve separate generated running drawings for the hero and boy, replacing four poses. Travel distance selects the pose; standing still does not advance the running loop.
- Uniform per-pose scaling, upper-head anchors and a shared foot baseline. Hero textures are 384×320 instead of 192×160.
- A 1920×1080 framebuffer with the same logical play area and physical character size.
- Visual interpolation between fixed physics updates; camera and foreground follow the presented position. Collision rules and gameplay timing are unchanged.
- Steady view keeps pickups still, suppresses bursts and replaces invulnerability flashing with constant transparency. Menu scenery remains stationary.

## Evidence and limits

20 unit tests and 18 browser tests passed, including all five courses, 15–144 Hz simulation, touch layouts, Go Dance and a 120 Hz presentation interpolation check. Three 390-frame Chrome samples on the development Mac returned median 16.7 ms, p95 16.7–16.8 ms and zero frames over 33.5 ms; exact results are in `MOTION_PROFILE.json`.

Those samples use viewport/touch emulation, not Android hardware. No physical Android device was connected. The larger framebuffer increases GPU work and must be measured on target devices. Prior native Android emulator checks were for 1.1.0, not this revision.

The generated poses provide compression, passing and recovery phases, but near/far ankle separation and anatomy are not equivalent to a fully hand-authored animation. An actual-size playtest and animator cleanup remain useful. No guarantee of individual visual comfort or store readiness is implied.
