import runCycle from "../utils/runCycle.json";
import type { StrideCycle } from "../utils/StrideAnimator";

// These lengths are in game-world units at the current sprite scales, not atlas pixels.
// Keep existing travel per cycle until a contact-point art pass measures better values.
// Reference duration only defines what playbackRate=1 means; distance owns actual cadence.
export const HERO_RUN: StrideCycle = { strideLength: runCycle.heroStride, loopDuration: runCycle.count / 24, frameCount: runCycle.count };
export const HERO_DUCK: StrideCycle = { strideLength: 60, loopDuration: 4 / 8, frameCount: 4 };
export const KID_RUN: StrideCycle = { strideLength: runCycle.kidStride, loopDuration: runCycle.count / 24, frameCount: runCycle.count };
