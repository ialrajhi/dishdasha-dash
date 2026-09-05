import Phaser from "phaser";
import frames from "./arcadeFrames.json";
import { LEVELS } from "../levels/levels";

/** Source bounds are hand-reviewed: several poses cross their nominal grid cell. */
export const HERO_SCALE = 0.52;
export const floorY = frames.floorY;
export function preloadArcadeArt(scene: Phaser.Scene) {
  for (const level of LEVELS)
    scene.load.image(`scene-${level.id}`, `/assets/arcade/${level.theme}.png`);
  scene.load.image("hero-sheet", "/assets/arcade/hero-sheet.png");
  scene.load.image("props-sheet", "/assets/arcade/props-sheet.png");
  scene.load.image("extra-sheet", "/assets/arcade/extra-sheet.png");
}

function crop(
  scene: Phaser.Scene,
  sheet: string,
  name: string,
  bounds: number[],
  hero = false,
) {
  if (scene.textures.exists(name)) return;
  const [left, top, right, bottom] = bounds;
  const width = right - left,
    height = bottom - top;
  const canvas = document.createElement("canvas");
  canvas.width = hero ? 192 : width + 4;
  canvas.height = hero ? 160 : height + 4;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = hero ? 0.46 : 1;
  let source = scene.textures.get(sheet).getSourceImage() as
    | HTMLImageElement
    | HTMLCanvasElement;
  let sx = left,
    sy = top;
  // Neighboring death / celebration poses overlap bounding boxes, but not artwork.
  const masks: Record<string, number[]> = {
    "hero-dead": [658, 1084, 671, 1108],
    "hero-victoryFists": [664, 1150, 676, 1184],
  };
  if (masks[name]) {
    const clean = document.createElement("canvas");
    clean.width = width;
    clean.height = height;
    const cc = clean.getContext("2d")!;
    cc.drawImage(source, left, top, width, height, 0, 0, width, height);
    const [x1, y1, x2, y2] = masks[name];
    cc.clearRect(x1 - left, y1 - top, x2 - x1, y2 - y1);
    source = clean;
    sx = 0;
    sy = 0;
  }
  ctx.drawImage(
    source,
    sx,
    sy,
    width,
    height,
    (canvas.width - width * scale) / 2,
    canvas.height - height * scale - 2,
    width * scale,
    height * scale,
  );
  // Suppress the nearly transparent colored matte at the atlas edges.
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < pixels.data.length; i += 4)
    if (pixels.data[i] < 55) pixels.data[i] = 0;
  ctx.putImageData(pixels, 0, 0);
  scene.textures.addCanvas(name, canvas);
}

const objectNames: Record<string, string> = {
  tea: "tea",
  goldDallah: "golden",
  angryDallah: "dallah",
  cat: "cat",
  trolley: "cart",
  crate: "crate",
  cone: "cone",
  football: "ball",
  watermelon: "melon",
  carpetRoll: "carpet",
  cooler: "cooler",
  campChair: "chair",
  gift: "gift",
  coffeeTray: "tray",
  flowers: "flowers",
  pigeon: "pigeon",
};

/** Overlap the painted ends so scrolling never exposes a hard vertical image join. */
function loopTexture(
  scene: Phaser.Scene,
  key: string,
  source: HTMLImageElement | HTMLCanvasElement,
  overlap: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width - overlap;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    source,
    overlap,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const edge = document.createElement("canvas");
  edge.width = overlap;
  edge.height = source.height;
  const ec = edge.getContext("2d")!;
  ec.drawImage(
    source,
    0,
    0,
    overlap,
    source.height,
    0,
    0,
    overlap,
    source.height,
  );
  ec.globalCompositeOperation = "destination-in";
  const fade = ec.createLinearGradient(0, 0, overlap, 0);
  fade.addColorStop(0, "transparent");
  fade.addColorStop(1, "#fff");
  ec.fillStyle = fade;
  ec.fillRect(0, 0, overlap, source.height);
  ctx.drawImage(edge, canvas.width - overlap, 0);
  scene.textures.addCanvas(key, canvas);
}
export function prepareArcadeArt(scene: Phaser.Scene) {
  for (const [name, bounds] of Object.entries(frames.hero))
    crop(scene, "hero-sheet", `hero-${name}`, bounds, true);
  for (const [name, bounds] of Object.entries(frames.objects))
    crop(scene, "props-sheet", `arcade-${objectNames[name]}`, bounds);
  const extra: Record<string, number[]> = {
    bag: [46, 153, 356, 612],
    kid: [407, 167, 756, 613],
    waiter: [789, 93, 1242, 623],
    tire: [33, 708, 369, 1152],
    goat: [410, 680, 801, 1144],
    rope: [843, 883, 1238, 1155],
  };
  for (const [name, bounds] of Object.entries(extra))
    crop(scene, "extra-sheet", `arcade-${name}`, bounds);
  for (const level of LEVELS) {
    const source = scene.textures
      .get(`scene-${level.id}`)
      .getSourceImage() as HTMLImageElement;
    loopTexture(scene, `scenery-${level.id}`, source, 150);
    const canvas = document.createElement("canvas");
    canvas.width = source.width;
    canvas.height = source.height - floorY[level.id - 1];
    canvas
      .getContext("2d")!
      .drawImage(
        source,
        0,
        floorY[level.id - 1],
        source.width,
        canvas.height,
        0,
        0,
        source.width,
        canvas.height,
      );
    loopTexture(scene, `street-${level.id}`, canvas, 64);
    scene.textures.remove(`scene-${level.id}`);
  }
  for (const sheet of ["hero-sheet", "props-sheet", "extra-sheet"])
    scene.textures.remove(sheet);
}
export function heroFrame(state: string, time: number) {
  if (state === "run") return `hero-run${(Math.floor(time / 78) % 8) + 1}`;
  if (state === "idle" || state === "respawn")
    return Math.floor(time / 360) % 2 ? "hero-idleBreathe" : "hero-idle";
  if (state === "victory")
    return Math.floor(time / 260) % 2
      ? "hero-victoryWave"
      : "hero-victoryFists";
  if (state === "jump") return "hero-jumpUp";
  return `hero-${state}`;
}

export const propHeight: Record<string, number> = {
  tea: 28,
  golden: 44,
  dallah: 43,
  cat: 32,
  cart: 42,
  crate: 35,
  box: 35,
  cone: 33,
  ball: 26,
  melon: 32,
  carpet: 31,
  cooler: 34,
  chair: 42,
  gift: 38,
  tray: 32,
  flowers: 42,
  pigeon: 28,
  bag: 38,
  kid: 44,
  waiter: 51,
  tire: 33,
  goat: 38,
  rope: 20,
  dune: 20,
};
export function propTexture(kind: string) {
  return `arcade-${kind === "box" ? "crate" : kind === "dune" ? "rope" : kind}`;
}
