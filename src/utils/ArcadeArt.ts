import Phaser from "phaser";
import runCycle from "./runCycle.json";
export { default as runCycle } from "./runCycle.json";
import frames from "./arcadeFrames.json";
import sceneryLayout from "./sceneryLayout.json";
import { LEVELS } from "../levels/levels";

/** Source bounds are hand-reviewed: several poses cross their nominal grid cell. */
export const HERO_SCALE = 0.26;
export const floorY = sceneryLayout.floorY;
export function preloadArcadeArt(scene: Phaser.Scene) {
  for (const level of LEVELS)
    scene.load.image(`scene-${level.id}`, `${import.meta.env.BASE_URL}assets/arcade/${level.theme}.webp`);
  for (const key of ["hero-sheet", "props-sheet", "extra-sheet", "hero-run-sheet", "kid-run-sheet"])
    scene.load.image(key, `${import.meta.env.BASE_URL}assets/arcade/${key}.webp`);
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
  canvas.width = hero ? 384 : width + 4;
  canvas.height = hero ? 320 : height + 4;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = hero ? 0.92 : 1;
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
    if (!name.startsWith("run")) crop(scene, "hero-sheet", `hero-${name}`, bounds, true);
  for (const actor of ["hero", "kid"]) {
    const source = scene.textures.get(`${actor}-run-sheet`).getSourceImage() as HTMLImageElement;
    for (let frame = 0; frame < runCycle.count; frame++) {
      const canvas = document.createElement("canvas");
      canvas.width = runCycle.width;
      canvas.height = runCycle.height;
      canvas.getContext("2d")!.drawImage(source, frame % runCycle.columns * runCycle.width, Math.floor(frame / runCycle.columns) * runCycle.height, runCycle.width, runCycle.height, 0, 0, runCycle.width, runCycle.height);
      scene.textures.addCanvas(`${actor === "hero" ? "hero-run" : "arcade-kid"}-stride-${frame}`, canvas);
    }
  }
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
    const painted = document.createElement("canvas");
    painted.width = source.width;
    painted.height = source.height;
    const ctx = painted.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    const labels: Record<string, string> = { grocery: "بقالة بو خالد", mainFacade: "الجمعية التعاونية", spicesDates: "بهارات وتمور", textiles: "أقمشة كويتية", streetPlaque: "المباركية" };
    for (const sign of sceneryLayout.signs[level.theme]) {
      const label = labels[sign.id];
      if (!label) continue;
      const [left, top, right, bottom] = sign.bounds;
      let size = Math.floor((bottom - top) * 0.67);
      ctx.direction = "rtl";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      do { ctx.font = `700 ${size--}px "Changa Variable", sans-serif`; }
      while (ctx.measureText(label).width > right - left - 16 && size > 8);
      ctx.fillStyle = sign.suggestedTextColor;
      ctx.fillText(label, (left + right) / 2, (top + bottom) / 2);
    }
    scene.textures.addCanvas(`scenery-${level.id}`, painted);
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
  for (const sheet of ["hero-sheet", "props-sheet", "extra-sheet", "hero-run-sheet", "kid-run-sheet"])
    scene.textures.remove(sheet);
}
export function heroFrame(state: string, time: number) {
  if (state === "run") return `hero-run-stride-${Math.floor(time / 46) % runCycle.count}`;
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
