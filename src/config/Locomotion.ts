import runCycle from "../utils/runCycle.json";
import heroRun from "../utils/heroRun8.json";
import type { StrideCycle } from "../utils/StrideAnimator";

// These lengths are in game-world units at the current sprite scales, not atlas pixels.
export const HERO_MAX_RUN_SPEED = 260; // Existing physics limit; this patch does not change movement.
/**
 * Planted-foot travel, in atlas pixels, while each of the eight poses is on screen (measured from the
 * soles in hero-run8-sheet: contact → compression → passing → push-off, twice). The two push-off poses
 * are brief, so they get a small floor. Pose time follows ground distance, so the planted sandal moves
 * backward exactly as fast as the street: no skating.
 */
export const HERO_RUN_WEIGHTS = [44, 47, 110, 22, 62, 40, 129, 22];
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
