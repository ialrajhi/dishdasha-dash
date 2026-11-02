import runCycle from "../utils/runCycle.json";
import heroRun from "../utils/heroRun8.json";
import type { StrideCycle } from "../utils/StrideAnimator";

// These lengths are in game-world units at the current sprite scales, not atlas pixels.
export const HERO_MAX_RUN_SPEED = 260; // Existing physics limit; this patch does not change movement.
/**
 * Planted-foot travel, in atlas pixels, from each of the eight poses to the next, measured from the soles
 * touching the ground in hero-run8-sheet (contact → compression → passing → push-off, twice):
 *   left step  269 → 231.5 → 183.5 → 70.5 → 55.5 (right lands at 283.5) = 37.5, 48, 113, 15 (213.5)
 *   right step 283.5 → 228.5 → 186.5 → 54.5 (left lands at 270.5 → 269) = 55, 42, 132, 1.5  (230.5)
 * The drawn steps differ by 8%, which reads as a limp, so each step is scaled to the same 222 px.
 * Pose 7 already plants the left sandal where pose 0 does, so it only covers the end of the passing gap.
 * Pose time follows ground distance, so the planted sandal moves backward as fast as the street.
 */
export const HERO_RUN_WEIGHTS = [39, 50, 117.5, 15.5, 53, 40.5, 127, 1.5];
/** Atlas pixels → world units at the hero's display scale (HERO_SCALE in ArcadeArt). */
export const HERO_ATLAS_SCALE = 0.26;
export const HERO_RUN: StrideCycle = {
  strideLength: HERO_RUN_WEIGHTS.reduce((a, b) => a + b, 0) * HERO_ATLAS_SCALE,
  loopDuration: heroRun.count / 10,
  frameCount: heroRun.count,
  weights: HERO_RUN_WEIGHTS,
};
export const HERO_DUCK: StrideCycle = { strideLength: 60, loopDuration: 4 / 8, frameCount: 4 };
export const KID_RUN: StrideCycle = { strideLength: runCycle.kidStride, loopDuration: runCycle.count / 24, frameCount: runCycle.count };
