import Phaser from "phaser";
import runCycle from "./runCycle.json";
import heroRun from "./heroRun8.json";
export { default as runCycle } from "./runCycle.json";
import frames from "./arcadeFrames.json";
import sceneryLayout from "./sceneryLayout.json";
import { LEVELS } from "../levels/levels";

/** Source bounds are hand-reviewed: several poses cross their nominal grid cell. */
export const HERO_SCALE = 0.26;
export const floorY = sceneryLayout.floorY;
/** One painted street per art id; night stages reuse their day stage's street. */
const STREETS = LEVELS.filter((level) => level.id === level.art);
export function preloadArcadeArt(scene: Phaser.Scene) {
  for (const level of STREETS)
    scene.load.image(`scene-${level.id}`, `${import.meta.env.BASE_URL}assets/arcade/${level.theme}.webp`);
  for (const key of ["hero-sheet", "props-sheet", "extra-sheet", "hero-run8-sheet", "kid-run-sheet", "hero-duck-sheet"])
    scene.load.image(key, `${import.meta.env.BASE_URL}assets/arcade/${key}.webp`);
  scene.load.image("arcade-suspension-rope", `${import.meta.env.BASE_URL}assets/arcade/suspension-rope.webp`);
  scene.load.image("arcade-awning", `${import.meta.env.BASE_URL}assets/arcade/awning.webp`);
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
/**
 * Moonlit copy of a painting: multiply by a night gradient, bring warm light sources (lanterns, lamps,
 * lit signs) back with a soft bloom, and scatter stars and a moon only over smooth, dark sky.
 */
function nightGrade(source: HTMLCanvasElement, withSky: boolean, seed: number) {
  const w = source.width, h = source.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  const original = source.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, w, h);
  // Warm, bright, saturated pixels become light sources.
  const lights = document.createElement("canvas");
  lights.width = w;
  lights.height = h;
  const lctx = lights.getContext("2d")!;
  const glow = lctx.createImageData(w, h);
  const src = original.data, g = glow.data;
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], gr = src[i + 1], b = src[i + 2];
    const lum = 0.299 * r + 0.587 * gr + 0.114 * b;
    // Near-white cores (a painted sun) stay dark; lamps and lanterns are warmer and dimmer.
    if (lum > 165 && lum < 226 && r > b + 70 && gr > b + 25) {
      g[i] = r; g[i + 1] = gr; g[i + 2] = b; g[i + 3] = Math.min(255, (lum - 165) * 3);
    }
  }
  lctx.putImageData(glow, 0, 0);
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, withSky ? "#1c2350" : "#3a4278");
  shade.addColorStop(0.55, "#4a5288");
  shade.addColorStop(1, "#7a7fa8");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = "blur(10px)";
  ctx.globalAlpha = 0.55;
  ctx.drawImage(lights, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 0.85;
  ctx.drawImage(lights, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (!withSky) return out;
  const graded = ctx.getImageData(0, 0, w, h).data;
  const skyAt = (x: number, y: number) => {
    const i = (Math.floor(y) * w + Math.floor(x)) * 4;
    const j = (Math.floor(y) * w + Math.min(w - 1, Math.floor(x) + 9)) * 4;
    const k = (Math.min(h - 1, Math.floor(y) + 9) * w + Math.floor(x)) * 4;
    const smooth = Math.abs(graded[i] - graded[j]) + Math.abs(graded[i + 2] - graded[j + 2]) + Math.abs(graded[i + 2] - graded[k + 2]) < 22;
    return smooth && graded[i + 2] >= graded[i] && graded[i] + graded[i + 1] + graded[i + 2] < 330;
  };
  let state = seed * 9301 + 49297;
  const random = () => ((state = (state * 9301 + 49297) % 233280) / 233280);
  for (let n = 0; n < 420; n++) {
    const x = random() * w, y = random() * h * 0.42;
    if (!skyAt(x, y)) continue;
    const size = random() < 0.12 ? 2.2 : 1.1;
    ctx.fillStyle = `rgba(255,255,240,${0.45 + random() * 0.5})`;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  }
  // A moon where the sky is open, searched from the upper right.
  for (const [mx, my] of [[0.84, 0.12], [0.7, 0.1], [0.55, 0.09], [0.3, 0.1]]) {
    const x = mx * w, y = my * h, r = h * 0.045;
    if (![[0, 0], [-r, 0], [r, 0], [0, -r], [0, r]].every(([dx, dy]) => skyAt(x + dx, y + dy))) continue;
    const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 4);
    halo.addColorStop(0, "rgba(220,230,255,.35)");
    halo.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.fillStyle = "#f4f1dc";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(190,190,170,.35)";
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.arc(x + r * 0.35, y + r * 0.3, r * 0.15, 0, Math.PI * 2); ctx.fill();
    break;
  }
  return out;
}

export function prepareArcadeArt(scene: Phaser.Scene) {
  const duck = scene.textures.get("hero-duck-sheet").getSourceImage() as HTMLImageElement;
  for (let i = 0; i < 4; i++) {
    const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 320;
    canvas.getContext("2d")!.drawImage(duck, i * 384, 0, 384, 320, 0, 0, 384, 320);
    scene.textures.addCanvas(`hero-duck-${i}`, canvas);
  }
  for (const [name, bounds] of Object.entries(frames.hero))
    if (!name.startsWith("run")) crop(scene, "hero-sheet", `hero-${name}`, bounds, true);
  for (const actor of ["hero", "kid"]) {
    const atlas = actor === "hero" ? heroRun : runCycle;
    const source = scene.textures.get(actor === "hero" ? "hero-run8-sheet" : "kid-run-sheet").getSourceImage() as HTMLImageElement;
    for (let frame = 0; frame < atlas.count; frame++) {
      const canvas = document.createElement("canvas");
      canvas.width = atlas.width;
      canvas.height = atlas.height;
      canvas.getContext("2d")!.drawImage(source, frame % atlas.columns * atlas.width, Math.floor(frame / atlas.columns) * atlas.height, atlas.width, atlas.height, 0, 0, atlas.width, atlas.height);
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
  for (const level of STREETS) {
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
    const nightly = LEVELS.some((l) => l.night && l.art === level.id);
    if (nightly) scene.textures.addCanvas(`scenery-night-${level.id}`, nightGrade(painted, true, level.id));
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
    if (nightly) loopTexture(scene, `street-night-${level.id}`, nightGrade(canvas, false, level.id), 64);
    scene.textures.remove(`scene-${level.id}`);
  }
  for (const sheet of ["hero-sheet", "props-sheet", "extra-sheet", "hero-run8-sheet", "kid-run-sheet", "hero-duck-sheet"])
    scene.textures.remove(sheet);
}
export function heroFrame(state: string, time: number) {
  // Running is owned by Player's authored-pose clock, never by a second wall-time loop.
  if (state === "run") return "hero-idle";
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
