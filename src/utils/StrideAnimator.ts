export interface StrideCycle {
  /** World units travelled by the root during one full left + right cycle. */
  readonly strideLength: number;
  /** Duration in seconds at the animation's reference playback rate. */
  readonly loopDuration: number;
  readonly frameCount: number;
  /** Optional authored-pose cadence. The hero prioritizes readable poses over an unbounded FPS. */
  readonly cadence?: { readonly minFPS: number; readonly maxFPS: number; readonly maxRunSpeed: number };
  /**
   * Optional ground travel from each pose to the next, e.g. how far the planted foot moves between
   * them in the artwork. Unevenly spaced artwork then keeps the foot on the ground instead of skating.
   */
  readonly weights?: readonly number[];
}

/** Movement owns speed. Authored pose cadence can clamp FPS for small-sprite readability. */
export class StrideAnimator {
  private cycle!: StrideCycle;
  private previousPhase = 0;
  private stepCycles = 0;
  private phase = 0;
  velocity = 0;
  playbackRate = 0;
  animationFPS = 0;

  constructor(cycle: StrideCycle) { this.setCycle(cycle); }

  get referenceVelocity() { return this.cycle.strideLength / this.cycle.loopDuration; }

  /** Preserve normalized leg phase when switching between run and crouch cycles. */
  setCycle(cycle: StrideCycle) {
    if (cycle === this.cycle) return;
    if (!Number.isFinite(cycle.strideLength) || cycle.strideLength <= 0 ||
        !Number.isFinite(cycle.loopDuration) || cycle.loopDuration <= 0 ||
        !Number.isSafeInteger(cycle.frameCount) || cycle.frameCount < 1)
      throw new RangeError("A stride needs positive length, duration and integer frame count.");
    if (cycle.weights && (cycle.weights.length !== cycle.frameCount || cycle.weights.some((w) => !Number.isFinite(w) || w <= 0)))
      throw new RangeError("Stride weights need one positive value per frame.");
    if (cycle.cadence && (!Number.isFinite(cycle.cadence.minFPS) || cycle.cadence.minFPS <= 0 ||
        !Number.isFinite(cycle.cadence.maxFPS) || cycle.cadence.maxFPS < cycle.cadence.minFPS ||
        !Number.isFinite(cycle.cadence.maxRunSpeed) || cycle.cadence.maxRunSpeed <= 0))
      throw new RangeError("Cadence needs a positive speed and an ordered, positive FPS range.");
    this.cycle = cycle;
    this.updateRate();
  }

  /** Call once per physics step, after collision resolution. Signed dx supports either facing. */
  advance(dx: number, seconds: number, grounded = true) {
    if (!Number.isFinite(dx) || !Number.isFinite(seconds) || seconds < 0)
      throw new RangeError("Stride displacement and elapsed seconds must be finite; time cannot be negative.");
    this.previousPhase = this.phase;
    this.velocity = grounded && seconds > 0 ? dx / seconds : 0;
    this.updateRate();
    // Without a cadence range, this simplifies to |dx| / stride length.
    // With one, integrate the clamped pose FPS. Actual travel still decides speed/stops.
    this.stepCycles = this.animationFPS * seconds / this.cycle.frameCount;
    // A stationary hero exits to its dedicated idle pose and restarts at a clean contact.
    // Preserve the in-progress phase in the air; jumping must not restart the step clock.
    if (this.cycle.cadence && grounded && seconds > 0 && this.animationFPS === 0)
      this.previousPhase = 0;
    this.phase = this.wrap(this.previousPhase + this.stepCycles);
  }

  /** Use the SAME interpolation alpha as the displayed root position. */
  sample(alpha = 1) {
    const blend = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1;
    return this.wrap(this.previousPhase + this.stepCycles * blend);
  }

  frame(alpha = 1) {
    const phase = this.sample(alpha);
    const weights = this.cycle.weights;
    if (weights) {
      // Pose i lines up with the ground at the start of its span. Show it from halfway after the previous
      // pose to halfway before the next, so the drawn foot drifts at most half a gap either way.
      const total = weights.reduce((a, b) => a + b, 0);
      let start = 0;
      for (let i = 0; i < weights.length; i++) {
        if (phase < (start + weights[i] / 2) / total - 1e-7) return i;
        start += weights[i];
      }
      return 0;
    }
    // Stabilize exact frame boundaries after repeated floating-point physics steps.
    return Math.floor(phase * this.cycle.frameCount + 1e-7) % this.cycle.frameCount;
  }

  /** Respawn/teleport: reset explicitly instead of treating the position jump as running. */
  reset(phase = 0) {
    if (!Number.isFinite(phase)) throw new RangeError("Stride phase must be finite.");
    this.phase = this.previousPhase = this.wrap(phase);
    this.stepCycles = this.velocity = this.playbackRate = this.animationFPS = 0;
  }

  private updateRate() {
    const speed = Math.abs(this.velocity), cadence = this.cycle.cadence;
    this.animationFPS = cadence
      ? speed <= .1 ? 0 : cadence.minFPS + (cadence.maxFPS - cadence.minFPS) * Math.min(1, speed / cadence.maxRunSpeed)
      : speed / this.cycle.strideLength * this.cycle.frameCount;
    this.playbackRate = this.animationFPS / (this.cycle.frameCount / this.cycle.loopDuration);
  }

  private wrap(value: number) { return ((value % 1) + 1) % 1; }
}
