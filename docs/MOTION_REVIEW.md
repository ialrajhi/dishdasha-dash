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

## 1.4.0 — ducking and articulated dancing

The four supplied dance GIFs were reviewed as motion references: 64 frames / 2.56 s, 70 / 2.10 s, 24 / 1.44 s and 59 / 2.95 s respectively. They were not bundled. Eleven original joint-animation programs now use continuous beat phase, separate shoulder/elbow rotations and planted-foot leg solving. Rendering cadence is independent of the music tempo; Gentle moves reduces travel instead of dropping animation frames.

Twelve original five-part rigs were assembled and inspected at game size and enlarged size. The boy has visible hair and Maryam in a black abaya replaces the chef. Rounded overlapping limb sections reduce exposed rectangular joints. This remains stylized 2D cutout animation, with a rigid painted robe/body, not motion capture or full cloth animation.

Ducking uses four registered low poses and an 18-pixel collider with feet fixed at ground level. Awnings provide 34 pixels of floor clearance; standing collision is 39 pixels. An already crouched character waits for the trailing edge before standing, including after pause/resume. Ducking blocks buffered jumps. Gameplay tests cover keyboard, mixed touch/key sources, held controller recovery, collision/score timing and complete routes.

1.4.0 validation: 23 unit and 20 browser tests. Maximum-party timing results are recorded in `DANCE_PROFILE.json`; these are development-Mac browser measurements, not physical Android testing.

## 1.4.1 — crouch scale and dancer cleanup

The supplied 34.57-second recording confirms that scaling each crouch to a fixed 126-pixel height shrank the character’s anatomy. Crouch frames now use a uniform 0.70 source scale matched to the running atlas’s face, producing about 184 pixels of pose height without reducing head/hand proportions. A facial-landmark pixel regression guards against reintroducing the size change. Physics uses 58-pixel standing and 44-pixel crouching bodies with a shared foot baseline. Awnings now provide 50 pixels of clearance and retain their natural wide aspect ratio. Two textured ropes extend beyond the top of the viewport and are destroyed with their obstacle. The old Arabic duck word and popup/sign lettering were removed; the touch control shows a down arrow with an accessible label.

Targeted ImageGen edits remove shoulder discs and limb end caps from all twelve rigs. Upper arms tuck behind costumes while forearms stay in front. Long-robed characters’ knees bend beneath their hems. Connected-component crop bounds prevent neighboring atlas rows appearing as stray pieces. Enclosed dallah handle green is keyed out without removing the cat’s green eyes; this has a pixel regression. Representative disco phases were inspected enlarged for hero, boy, cat, dallah, abaya and fox, alongside actual gameplay at the awning. The remaining six cast members were inspected in raised-arm and sweeping poses. A fresh 24-dancer profile at desktop, phone and tablet viewport sizes returned median 16.7 ms, p95 16.7–16.8 ms and zero frames over 33.5 ms (development-Mac Chrome, not physical Android).

25 unit tests and all 20 browser regressions passed. The initial menu test was interrupted by a Vite reload during production packaging; it passed when rerun after packaging stopped changing assets. All five full courses completed with zero overhead hits, and the rebuilt macOS executable passed offline smoke and save recovery. Android test APK and unsigned AAB were rebuilt and verified; this revision has not been tested on a physical Android device.
