/** Continuous joint choreography. One beat clock keeps motion independent of display rate. */
export type Pose = {
  lean: number; hipX: number; drop: number;
  leftArm: [number, number]; rightArm: [number, number];
  leftFoot: [number, number]; rightFoot: [number, number];
};
const positive = (x: number) => Math.max(0, x);
export function dancePose(move: string, beat: number, gentle = false): Pose {
  const t = beat * Math.PI, s = Math.sin(t), c = Math.cos(t);
  const left = positive(s), right = positive(-s);
  const p: Pose = {
    lean: s * .055, hipX: s * .018, drop: (1 - Math.cos(t * 2)) * .012,
    leftArm: [.3 + s * .18, 1.1 + c * .2], rightArm: [-.3 + s * .18, -1.1 + c * .2],
    leftFoot: [-.095, 0], rightFoot: [.095, 0],
  };
  switch (move) {
    case 'shuffle': // Small alternating lifts, tucked arms, like the first GIF.
      p.leftArm = [.18 + s * .12, 1.8 + c * .1]; p.rightArm = [-.18 + s * .12, -1.8 + c * .1];
      p.leftFoot = [-.095 + left * .035, -left * .075]; p.rightFoot = [.095 - right * .035, -right * .075];
      p.hipX = -s * .025; break;
    case 'disco':
      p.leftArm = [.6 + s * .85, 1.1 + Math.sin(t - .5) * .55]; p.rightArm = [-.6 + s * .85, -1.1 + Math.sin(t - .5) * .55];
      p.leftFoot = [-.095 + left * .045, -left * .16]; p.rightFoot = [.095 - right * .045, -right * .16];
      p.lean = -s * .09; p.hipX = -s * .025; break;
    case 'crossstep':
      p.leftArm = [.85 + s * .8, .75]; p.rightArm = [-.85 + s * .8, -.75];
      p.leftFoot = [-.095 + left * .15, -left * .08]; p.rightFoot = [.095 - right * .15, -right * .08];
      p.hipX = -s * .03; p.lean = -s * .07; break;
    case 'sweep':
      p.leftArm = [.65 + s, .85 - s * .72]; p.rightArm = [-.65 + s, -.85 - s * .72];
      p.leftFoot = [-.13, 0]; p.rightFoot = [.13, 0]; p.lean = s * .075; p.drop += .018; break;
    case 'hands':
      p.leftArm = [2.7 + s * .22, -.5]; p.rightArm = [-2.7 + s * .22, .5];
      p.leftFoot[1] = -left * .05; p.rightFoot[1] = -right * .05; break;
    case 'clap': {
      const up = (1 - c) / 2;
      p.leftArm = [.3 + up * 2.9, 1 - up * 1.7]; p.rightArm = [-.3 - up * 2.9, -1 + up * 1.7];
      p.lean = 0; p.hipX = 0; p.drop = .03 * (1 - Math.cos(t * 2)); break;
    }
    case 'robot': {
      // Eased mechanical holds, never discontinuous jumps between poses.
      const pulse = Math.tanh(s * 3), delayed = Math.tanh(Math.sin(t - .7) * 3);
      p.leftArm = [.7 + pulse * .6, .8 - delayed * .6]; p.rightArm = [-.7 + pulse * .6, -.8 - delayed * .6];
      p.lean = pulse * .035; p.leftFoot[1] = -left * .028; p.rightFoot[1] = -right * .028; break;
    }
    case 'kick':
      p.leftArm = [.3 - s * .6, .3]; p.rightArm = [-.3 - s * .6, -.3];
      p.leftFoot = [-.095 - left * .11, -left * .12]; p.rightFoot = [.095 + right * .11, -right * .12];
      p.drop = .01; p.lean = -s * .07; break;
    case 'twist':
      p.leftArm = [.65 + Math.sin(t * 2) * .25, 1.5]; p.rightArm = [-.65 + Math.sin(t * 2) * .25, -1.5];
      p.hipX = s * .04; p.lean = -s * .10; p.leftFoot = [-.13, 0]; p.rightFoot = [.13, 0]; p.drop += .025; break;
    case 'bounce':
      p.drop = .045 * (1 - c); p.leftArm = [.7 + c * .5, 1.2]; p.rightArm = [-.7 - c * .5, -1.2]; p.lean = s * .025; break;
  }
  if (gentle) {
    // Lower amplitude retains joint motion and footwork instead of reducing frame rate.
    p.lean *= .5; p.hipX *= .6; p.drop *= .6;
    p.leftFoot[1] *= .65; p.rightFoot[1] *= .65;
  }
  return p;
}

export type Point = { x: number; y: number };
/** Positive/negative bend selects the knee side while both endpoints stay connected. */
export function solveLeg(hip: Point, foot: Point, upper: number, lower: number, bend: number): Point {
  const dx = foot.x - hip.x, dy = foot.y - hip.y;
  const distance = Math.max(.0001, Math.hypot(dx, dy));
  const d = Math.max(Math.abs(upper - lower) + .0001, Math.min(upper + lower - .0001, distance));
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const across = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
  return { x: hip.x + dx / distance * along - dy / distance * across,
    y: hip.y + dy / distance * along + dx / distance * across };
}
