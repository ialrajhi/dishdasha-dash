import runCycle from "../utils/runCycle.json";
import heroRun from "../utils/heroRun8.json";
import type { StrideCycle } from "../utils/StrideAnimator";

// These lengths are in game-world units at the current sprite scales, not atlas pixels.
export const HERO_MAX_RUN_SPEED = 260; // Existing physics limit; this patch does not change movement.
// Eight authored poses: actual horizontal travel drives a readable 8–14 FPS cadence.
export const HERO_RUN: StrideCycle = { strideLength: runCycle.heroStride, loopDuration: heroRun.count / 12,
  frameCount: heroRun.count, cadence: { minFPS: 8, maxFPS: 14, maxRunSpeed: HERO_MAX_RUN_SPEED } };
export const HERO_DUCK: StrideCycle = { strideLength: 60, loopDuration: 4 / 8, frameCount: 4 };
export const KID_RUN: StrideCycle = { strideLength: runCycle.kidStride, loopDuration: runCycle.count / 24, frameCount: runCycle.count };
