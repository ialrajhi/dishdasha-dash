# Running movement and sprite synchronization

**1.5.2 update:** The hero now uses eight redrawn poses and a velocity-driven 8–14 FPS readability range, as documented in `RUN_CYCLE_REVIEW.md`. The fixed-distance formulas below remain supported by `StrideAnimator` and used by the boy and crouch cycles, but the hero's `cadence` option deliberately replaces that unbounded FPS with `8 + 6 * clamp(abs(speed)/260, 0, 1)`. A stopped hero exits to idle and restarts at contact. The remainder of this document records the original 1.5.1 distance-sync design and calibration method.

The game uses `src/utils/StrideAnimator.ts` for the hero and moving boy. Physics determines speed; the sprite follows actual travel after collision resolution. This preserves level timing, obstacle spacing and jump difficulty when animation cadence changes.

## Formula and units

```text
referenceVelocity = strideLength / loopDuration
actualVelocity    = (currentWorldX - previousWorldX) / elapsedSeconds
playbackRate      = abs(actualVelocity) / referenceVelocity
cycleAdvance      = playbackRate * elapsedSeconds / loopDuration
                  = abs(currentWorldX - previousWorldX) / strideLength
```

`strideLength` means the distance covered during a complete left-and-right cycle, not one footstep. Length uses world units at the displayed sprite scale. `loopDuration` uses seconds at reference playback rate; `frameCount / referenceFPS` supplies it. Camera scrolling, canvas resolution and device pixel ratio do not enter the calculation.

With an 80-unit stride, 12 frames and a 0.5-second reference loop:

| Actual speed | Playback multiplier | Actual loop duration |
| --- | --- | --- |
| 0 units/s | 0 (hold the frame) | Stopped |
| 80 units/s | 0.5× | 1 second |
| 145 units/s | 0.90625× | About 0.552 seconds |
| 160 units/s | 1× | 0.5 seconds |
| 240 units/s | 1.5× | About 0.333 seconds |

The script integrates distance incrementally. It does **not** multiply total elapsed time by the latest speed, which would jump the cycle whenever speed changes. It also does not use requested velocity: a character blocked by a wall has zero travel, so its running cadence stops.

## Reusing the script

```ts
import { StrideAnimator } from './StrideAnimator';

const gait = new StrideAnimator({
  strideLength: 80,
  loopDuration: 12 / 24,
  frameCount: 12,
});

// Each fixed physics step:
const previousX = character.x;
// Run movement and resolve collisions here.
gait.advance(character.x - previousX, fixedDeltaSeconds, grounded);

// Each rendered frame: interpolate position AND phase with the same alpha.
visual.x = previousX + (character.x - previousX) * alpha;
visual.setTexture(`hero-run-stride-${gait.frame(alpha)}`);

// A teleport or respawn is not running distance.
gait.reset(); // Also reset previousX to the destination.
```

Use `frame()` without alpha in a variable-step game that renders its current position directly. Signed displacement supports characters facing either direction; the caller selects/flips artwork to match travel. Backpedalling would need its own animation policy. Use `grounded=false` while airborne or otherwise showing non-running poses. Call `advance(0, dt)` when stopped; do not advance the game clock while paused. `reset()` clears both interpolation endpoints, so respawn cannot interpolate through an old stride.

`setCycle()` changes stride length, reference duration and frame count while preserving normalized leg phase. Run and crouch artwork must share a compatible pose order for this transition to look natural. Do not additionally call an engine animation timer on these textures: `frame(alpha)` already owns playback.

## Integration in Dishdasha Dash

- `Locomotion.ts` centralizes existing travel lengths: hero 80 units, crouch 60 units, boy 28 units. Reference loops are 0.5 seconds; this is a playback-rate reference, not a claim about the artwork's original authoring rate.
- `GameScene` advances the hero's gait after each fixed physics step. Grounded distance is attributed per step, including when one low-refresh render contains several physics steps.
- `Player.present()` and `Player.animate()` share one interpolation alpha. Running/crouching preserve phase, and stationary movement stops frame advance.
- The boy's texture now uses the same interpolated phase as his visible position, removing the previous one-physics-step lead. Hazard completion holds the final frame.
- Airborne state selection no longer falls through to running at low vertical velocity near the jump apex.
- Respawn protection no longer holds idle artwork while the player moves. Invulnerability duration and visual protection remain independent of the locomotion pose.

## Artwork calibration and limits

The existing 12-frame sheets have uneven foot placements. This change corrects timing and state selection; it does not redraw feet, add in-between drawings or guarantee perfectly planted contacts. Existing stride lengths are retained pending a measured contact pass.

To calibrate, track the same planted foot across consecutive contact frames. Measure its backward displacement relative to a stable character root, in atlas pixels, and multiply by display scale. If it travels backward `d` world units during `k` equally timed frames in an `N`-frame loop, estimate `strideLength = d * N / k`. Check both feet and several contact intervals. In the ideal contact phase, root displacement plus foot displacement equals zero. If the estimates differ substantially between frames or feet, repair the poses/contact timing; a single stride value cannot eliminate that inconsistency. Recalibrate if the character's world-space scale changes.

Verification covers the formula, acceleration/deceleration, zero travel, reverse-facing travel, wrap interpolation, airborne holds, duck transitions and resets. Browser integration checks both characters, jump/landing agreement across 15/60/120 Hz, 120 Hz position interpolation and real checkpoint respawning. See the release verification record for completed regression results and native-device limitations.
