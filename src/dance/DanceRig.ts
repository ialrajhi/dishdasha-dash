import rigParts from './rigParts.json';
import { dancePose, solveLeg, type Point } from './DanceMotion';

/** Five original raster parts per character; joints move continuously at render cadence. */
export type RigLayout = { bodyHeight: number; shoulderY: number; shoulderX: number; hipY: number; hipX: number; armLength: number; armWidth: number; legLength: number; legWidth: number; bodyWidth: number; bodyShift?: number };
export const RIG_LAYOUT: Record<string, RigLayout> = {};
const human: RigLayout = {bodyHeight:.87, shoulderY:.34, shoulderX:.16, hipY:.73, hipX:.075, armLength:.38, armWidth:.10, legLength:.28, legWidth:.105, bodyWidth:.39};
const short: RigLayout = {...human, bodyHeight:.77, shoulderY:.38, shoulderX:.15, hipY:.70, armLength:.30, legLength:.31, bodyWidth:.40};
Object.assign(RIG_LAYOUT, {
 hero:{...human,shoulderY:.32,shoulderX:.135}, woman:{...human,shoulderY:.35,shoulderX:.14},
 boy:{...human,shoulderY:.35,shoulderX:.12},girl:{...human,shoulderY:.30,shoulderX:.13},
 grandpa:{...human,shoulderY:.28,shoulderX:.155},abaya:{...human,shoulderY:.32,shoulderX:.145},
 drummer:{...human,shoulderY:.37,shoulderX:.15},
 cat:{...short,shoulderY:.47,shoulderX:.15,bodyShift:-.054},dallah:{...short,shoulderY:.51,shoulderX:.17,bodyShift:-.027},
 robot:{...short,shoulderY:.53,shoulderX:.18},alien:{...short,shoulderY:.58,shoulderX:.17},fox:{...short,shoulderY:.52,shoulderX:.15,bodyShift:.098},
});
function layout(kind: string) { return RIG_LAYOUT[kind] ?? (['robot','alien','fox','cat','dallah'].includes(kind) ? short : human); }

export class DanceRig {
  readonly parts: HTMLCanvasElement[];
  constructor(image: HTMLImageElement) {
    // Atlas: five square cells. Source aspect ratios are restored from rigParts when drawing.
    const cell = image.width / 5;
    this.parts = Array.from({length:5}, (_, i) => {
      const canvas = document.createElement('canvas'); canvas.width = cell; canvas.height = image.height;
      const c = canvas.getContext('2d')!; c.drawImage(image, i * cell, 0, cell, image.height, 0, 0, cell, image.height);
      return canvas;
    });
  }
  private part(c: CanvasRenderingContext2D, index: number, x: number, y: number, width: number, height: number) {
    c.drawImage(this.parts[index], x - width / 2, y, width, height);
  }
  private limb(c: CanvasRenderingContext2D, index: number, root: Point, end: Point, knee: Point, width: number) {
    // Two overlapping sections of one painted limb bend without a detached elbow/knee.
    const source = this.parts[index], overlap = .07;
    const segment = (a: Point, b: Point, sy: number, sh: number, extend: number) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      c.save(); c.translate(a.x, a.y); c.rotate(Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2);
      c.beginPath(); c.roundRect(-width / 2, -extend, width, length + extend * 2, width * .42); c.clip();
      c.drawImage(source, 0, source.height * sy, source.width, source.height * sh, -width / 2, -extend, width, length + extend * 2); c.restore();
    };
    segment(root, knee, 0, .5 + overlap, width * .14);
    segment(knee, end, .5 - overlap, .5 + overlap, width * .14);
  }
  draw(c: CanvasRenderingContext2D, kind: string, move: string, beat: number, gentle: boolean, still = false) {
    const l = layout(kind), pose = dancePose(move, still ? 0 : beat, gentle);
    const ratios = (rigParts as Record<string,{ratios:number[]}>)[kind]?.ratios ?? [l.bodyWidth/l.bodyHeight,.3,.3,.38,.38];
    const origin = {x:pose.hipX, y:-.27 + pose.drop};
    const transform = (x:number,y:number): Point => ({x:origin.x + x*Math.cos(pose.lean) - (y + .27)*Math.sin(pose.lean), y:origin.y + x*Math.sin(pose.lean) + (y+.27)*Math.cos(pose.lean)});
    for (const side of [-1,1]) {
      const hip = transform(side * l.hipX, -1 + l.hipY);
      const f = side < 0 ? pose.leftFoot : pose.rightFoot;
      const foot = {x:f[0], y:f[1] - .016};
      const knee = solveLeg(hip, foot, l.legLength * .5, l.legLength * .5, side * -1);
      this.limb(c, side < 0 ? 3 : 4, hip, foot, knee, l.legLength * ratios[side < 0 ? 3 : 4]);
    }
    c.save(); c.translate(origin.x,origin.y); c.rotate(pose.lean);
    this.part(c,0,l.bodyShift ?? 0,-.73,l.bodyHeight * ratios[0],l.bodyHeight);
    for (const side of [-1,1]) {
      const [a,e] = side < 0 ? pose.leftArm : pose.rightArm;
      const root = {x:side*l.shoulderX,y:-.73+l.shoulderY};
      const half = l.armLength*.5;
      const elbow = {x:root.x-Math.sin(a)*half,y:root.y+Math.cos(a)*half};
      const hand = {x:elbow.x-Math.sin(a-e)*half,y:elbow.y+Math.cos(a-e)*half};
      this.limb(c,side<0?1:2,root,hand,elbow,l.armLength * ratios[side < 0 ? 1 : 2]);
    }
    c.restore();
  }
}
