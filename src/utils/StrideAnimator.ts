export interface StrideCycle {
  /** World units travelled by the root during one full left + right cycle. */
  readonly strideLength: number;
  /** Duration in seconds at the animation's reference playback rate. */
  readonly loopDuration: number;
  readonly frameCount: number;
}

/** Movement owns the speed; the sprite follows collision-resolved travel. */
export class StrideAnimator {
  private cycle!: StrideCycle;
  private previousPhase = 0;
  private stepCycles = 0;
  private phase = 0;
  velocity = 0;
  playbackRate = 0;

  constructor(cycle: StrideCycle) { this.setCycle(cycle); }

  get referenceVelocity() { return this.cycle.strideLength / this.cycle.loopDuration; }

  /** Preserve normalized leg phase when switching between run and crouch cycles. */
  setCycle(cycle: StrideCycle) {
    if (cycle === this.cycle) return;
    if (!Number.isFinite(cycle.strideLength) || cycle.strideLength <= 0 ||
        !Number.isFinite(cycle.loopDuration) || cycle.loopDuration <= 0 ||
        !Number.isSafeInteger(cycle.frameCount) || cycle.frameCount < 1)
      throw new RangeError("A stride needs positive length, duration and integer frame count.");
    this.cycle = cycle;
    this.playbackRate = Math.abs(this.velocity) / this.referenceVelocity;
  }

  /** Call once per physics step, after collision resolution. Signed dx supports either facing. */
  advance(dx: number, seconds: number, grounded = true) {
    if (!Number.isFinite(dx) || !Number.isFinite(seconds) || seconds < 0)
      throw new RangeError("Stride displacement and elapsed seconds must be finite; time cannot be negative.");
    this.previousPhase = this.phase;
    this.velocity = grounded && seconds > 0 ? dx / seconds : 0;
    this.playbackRate = Math.abs(this.velocity) / this.referenceVelocity;
    // rate * dt / reference loop duration simplifies to |dx| / stride length.
    // Using actual travel also prevents running against a wall or through a pause.
    this.stepCycles = grounded && seconds > 0 ? Math.abs(dx) / this.cycle.strideLength : 0;
    this.phase = this.wrap(this.previousPhase + this.stepCycles);
  }

  /** Use the SAME interpolation alpha as the displayed root position. */
  sample(alpha = 1) {
    const blend = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 1;
    return this.wrap(this.previousPhase + this.stepCycles * blend);
  }

  frame(alpha = 1) {
    // Stabilize exact frame boundaries after repeated floating-point physics steps.
    return Math.floor(this.sample(alpha) * this.cycle.frameCount + 1e-7) % this.cycle.frameCount;
  }

  /** Respawn/teleport: reset explicitly instead of treating the position jump as running. */
  reset(phase = 0) {
    if (!Number.isFinite(phase)) throw new RangeError("Stride phase must be finite.");
    this.phase = this.previousPhase = this.wrap(phase);
    this.stepCycles = this.velocity = this.playbackRate = 0;
  }

  private wrap(value: number) { return ((value % 1) + 1) % 1; }
}
