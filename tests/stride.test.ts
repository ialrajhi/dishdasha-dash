import { describe, expect, it } from "vitest";
import { StrideAnimator } from "../src/utils/StrideAnimator";

const run = { strideLength: 80, loopDuration: .5, frameCount: 12 };

describe("movement-driven stride clock", () => {
  it("implements velocity = stride / duration and follows acceleration, braking and stops", () => {
    const gait = new StrideAnimator(run);
    expect(gait.referenceVelocity).toBe(160);
    let distance = 0;
    for (const speed of [0, 40, 80, 160, 240, 80, 0]) {
      const dx = speed * .1; distance += dx;
      gait.advance(dx, .1);
      expect(gait.playbackRate).toBeCloseTo(speed / 160);
      expect(gait.sample()).toBeCloseTo(distance / 80 % 1);
    }
    const stopped = gait.sample();
    gait.advance(0, 5);
    expect(gait.sample()).toBe(stopped);
    expect(gait.playbackRate).toBe(0);
  });

  it("gives the same cadence for equal travel at different step rates, including reverse-facing actors", () => {
    for (const hz of [15, 30, 60, 120, 144]) {
      const gait = new StrideAnimator(run);
      // Integrate v(t)=30+100t exactly, then v(t)=130-100t, over two seconds.
      for (let i = 0; i < 2 * hz; i++) {
        const t = (i + .5) / hz;
        const speed = t < 1 ? 30 + 100 * t : 130 - 100 * (t - 1);
        gait.advance(-speed / hz, 1 / hz);
      }
      expect(Math.min(gait.sample(), 1 - gait.sample())).toBeLessThan(1e-10); // 160 units = two cycles
      expect(gait.frame()).toBe(0);
      expect(gait.velocity).toBeLessThan(0);
    }
  });

  it("interpolates across a wrap and multiple loops along the same path as position", () => {
    const gait = new StrideAnimator(run);
    gait.reset(.9);
    gait.advance(176, 1); // 2.2 full cycles; don't interpolate wrapped endpoints backwards
    expect(gait.sample(0)).toBeCloseTo(.9);
    expect(gait.sample(.5)).toBeCloseTo(0);
    expect(gait.sample(1)).toBeCloseTo(.1);
    expect(gait.frame(.5)).toBe(0);
  });

  it("holds phase in the air and during pause, and resets both interpolation endpoints on teleport", () => {
    const gait = new StrideAnimator(run);
    gait.advance(30, .2);
    gait.advance(500, 1, false);
    expect(gait.sample()).toBeCloseTo(.375);
    expect(gait.playbackRate).toBe(0);
    gait.advance(0, 0);
    expect(gait.sample(.2)).toBeCloseTo(.375);
    gait.reset();
    for (const alpha of [0, .5, 1]) expect(gait.frame(alpha)).toBe(0);
    gait.advance(10, .1);
    expect(gait.sample()).toBeCloseTo(.125);
  });

  it("changes stride length without jumping to a different leg phase", () => {
    const gait = new StrideAnimator(run);
    gait.advance(20, .2);
    gait.setCycle({ strideLength: 60, loopDuration: .5, frameCount: 4 });
    expect(gait.sample()).toBeCloseTo(.25);
    expect(gait.frame()).toBe(1);
    gait.advance(15, .1);
    expect(gait.sample()).toBeCloseTo(.5);
    gait.setCycle(run);
    expect(gait.frame()).toBe(6);
  });

  it("rejects invalid calibration and time without poisoning the clock", () => {
    for (const invalid of [{strideLength: 0}, {loopDuration: NaN}, {frameCount: 2.5}])
      expect(() => new StrideAnimator({...run, ...invalid})).toThrow(RangeError);
    const gait = new StrideAnimator(run);
    expect(() => gait.advance(NaN, .1)).toThrow(RangeError);
    expect(() => gait.advance(1, -1)).toThrow(RangeError);
    expect(() => gait.reset(Infinity)).toThrow(RangeError);
    expect(gait.sample()).toBe(0);
  });
});

describe("readable eight-pose hero cadence", () => {
  const eight = { strideLength: 80, loopDuration: 8 / 12, frameCount: 8,
    cadence: { minFPS: 8, maxFPS: 14, maxRunSpeed: 260 } };
  it("uses actual speed with a readable FPS cap, including acceleration and reverse travel", () => {
    const gait = new StrideAnimator(eight);
    for (const speed of [1, 65, 130, 195, 260, 520, -130]) {
      gait.advance(speed / 60, 1 / 60);
      expect(gait.animationFPS).toBeCloseTo(8 + 6 * Math.min(Math.abs(speed) / 260, 1));
      expect(gait.animationFPS).toBeGreaterThanOrEqual(8);
      expect(gait.animationFPS).toBeLessThanOrEqual(14);
    }
  });
  it("cleanly exits an awkward pose on stopping and restarts at contact", () => {
    const gait = new StrideAnimator(eight);
    gait.advance(65, .5); expect(gait.frame()).not.toBe(0);
    gait.advance(0, 1 / 60);
    expect(gait.animationFPS).toBe(0);
    expect(gait.frame(0)).toBe(0); expect(gait.frame(1)).toBe(0);
    gait.advance(130 / 120, 1 / 120);
    expect(gait.frame()).toBe(0);
    expect(gait.animationFPS).toBe(11);
  });
  it("holds the current step in the air without applying the stationary restart", () => {
    const gait = new StrideAnimator(eight);
    gait.advance(30, .2); const phase = gait.sample();
    gait.advance(200, .8, false);
    expect(gait.sample()).toBeCloseTo(phase);
    expect(gait.animationFPS).toBe(0);
  });
  it("plays the same eight-pose cycle across different render rates", () => {
    for (const hz of [15, 30, 60, 120, 144]) {
      const gait = new StrideAnimator(eight);
      for (let i=0;i<hz;i++) gait.advance(130/hz,1/hz);
      expect(gait.sample()).toBeCloseTo(3/8,9); // 11 fps: one full eight-pose loop plus 3 frames
      expect(gait.frame()).toBe(3);
    }
  });
});
