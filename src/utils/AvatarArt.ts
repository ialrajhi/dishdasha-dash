import type Phaser from "phaser";
import { avatarById, type AvatarDef, type RGB } from "../systems/Economy";

/** Every hero texture the player can show; avatars are recolored copies of these. */
const POSES = ["idle", "idleBreathe", "jumpUp", "fall", "hurt", "dead", "victoryFists", "victoryWave"];
const BASES = [
  ...POSES,
  ...Array.from({ length: 8 }, (_, i) => `run-stride-${i}`),
  ...Array.from({ length: 4 }, (_, i) => `duck-${i}`),
];

/** Texture key for one pose of an avatar. The classic outfit uses the original art. */
export const avatarKey = (avatar: string, base: string) =>
  avatar === "classic" ? `hero-${base}` : `avatar-${avatar}-${base}`;

/** Light, nearly neutral cloth: warm off-white highlights and cool lavender folds. Skin and sandals are far more saturated. */
function isCloth(r: number, g: number, b: number) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const warm = r > b;
  // Deep folds are strongly blue; nothing else on the hero has blue as its dominant channel.
  if (b === max && b > 120 && lum >= 80) return true;
  return !(lum < 110 || max - min > (warm ? 58 : 92) || (warm && lum < 150));
}

/** Cloth reachable from seeds in the top band without crossing the art's dark outlines or the limit line. */
function flood(cloth: Uint8Array, width: number, height: number, top: number, bottom: number, seedBand: number, limit: number) {
  const head = new Uint8Array(width * height);
  const queue: number[] = [];
  const band = top + (bottom - top) * seedBand, line = top + (bottom - top) * limit;
  for (let p = 0; p < cloth.length; p++)
    if (cloth[p] && p / width <= band) { head[p] = 1; queue.push(p); }
  while (queue.length) {
    const p = queue.pop()!;
    const x = p % width;
    for (const n of [p - 1, p + 1, p - width, p + width]) {
      if (n < 0 || n >= cloth.length || head[n] || !cloth[n] || Math.abs((n % width) - x) > 1 || n / width > line) continue;
      head[n] = 1;
      queue.push(n);
    }
  }
  return head;
}

/** Shrinks a mask by one pixel per pass, breaking thin bridges where the scarf touches the robe. */
function erode(mask: Uint8Array, width: number, passes: number) {
  let current = mask;
  for (let k = 0; k < passes; k++) {
    const next = new Uint8Array(mask.length);
    for (let p = width; p < mask.length - width; p++) {
      const x = p % width;
      if (current[p] && x > 0 && x < width - 1 && current[p - 1] && current[p + 1] && current[p - width] && current[p + width]) next[p] = 1;
    }
    current = next;
  }
  return current;
}

/** Grows a region back over the original cloth after an eroded fill. */
function grow(region: Uint8Array, cloth: Uint8Array, width: number, passes: number) {
  let current = region;
  for (let k = 0; k < passes; k++) {
    const next = current.slice();
    for (let p = width; p < cloth.length - width; p++)
      if (!current[p] && cloth[p] && (current[p - 1] || current[p + 1] || current[p - width] || current[p + width])) next[p] = 1;
    current = next;
  }
  return current;
}

/**
 * Separates the ghutra (including its long flowing tail) from the dishdasha by flood-filling the cloth
 * connected to the top of the head, then recolors each region.
 */
function tint(data: Uint8ClampedArray, width: number, height: number, avatar: AvatarDef) {
  const cloth = new Uint8Array(width * height);
  let top = height, bottom = 0, clothCount = 0;
  for (let p = 0; p < cloth.length; p++) {
    const i = p * 4;
    if (data[i + 3] < 40) continue;
    const y = Math.floor(p / width);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    if (isCloth(data[i], data[i + 1], data[i + 2])) { cloth[p] = 1; clothCount++; }
  }
  const share = (mask: Uint8Array) => mask.reduce((a, b) => a + b, 0) / Math.max(1, clothCount);
  // A ghutra is 8–40% of the visible cloth; outside that range the fill leaked into the robe or missed.
  const plausible = (mask: Uint8Array) => share(mask) >= 0.08 && share(mask) <= 0.4;
  const plain = flood(cloth, width, height, top, bottom, 0.12, 1);
  const candidates = [
    () => plain,
    // Where scarf and robe touch, break the bridge, fill, then grow back to the true edge.
    () => grow(flood(erode(cloth, width, 3), width, height, top, bottom, 0.12, 1), cloth, width, 4),
    // Raised arms can still join them; then stop at shoulder height.
    () => flood(cloth, width, height, top, bottom, 0.12, 0.4),
  ];
  // Crouched poses start with the black agal, and the bent-over scarf covers more of the cloth:
  // seed deeper, stop above the knees, and accept the result.
  const crouched = share(plain) < 0.08;
  let head: Uint8Array = crouched ? flood(cloth, width, height, top, bottom, 0.35, 0.42) : plain;
  if (!crouched && !plausible(head)) for (const candidate of candidates.slice(1)) {
    head = candidate();
    if (plausible(head)) break;
  }
  for (let p = 0; p < cloth.length; p++) {
    if (!cloth[p]) continue;
    const color: RGB | null = head[p] ? avatar.head : avatar.body;
    if (!color) continue;
    const i = p * 4;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const shade = Math.min(1.15, lum / 236);
    const shine = Math.max(0, (lum - 248) / 7) * 0.25;
    data[i] = Math.min(255, color[0] * shade + 255 * shine);
    data[i + 1] = Math.min(255, color[1] * shade + 255 * shine);
    data[i + 2] = Math.min(255, color[2] * shade + 255 * shine);
  }
}

/** Lazily builds an avatar's textures (≈20 small canvases) the first time it is needed. */
export function ensureAvatar(textures: Phaser.Textures.TextureManager, id: string) {
  const avatar = avatarById(id);
  if (avatar.id === "classic") return;
  for (const base of BASES) {
    const key = avatarKey(avatar.id, base);
    if (textures.exists(key) || !textures.exists(`hero-${base}`)) continue;
    const source = textures.get(`hero-${base}`).getSourceImage() as HTMLCanvasElement;
    const c = document.createElement("canvas");
    c.width = source.width;
    c.height = source.height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height);
    tint(pixels.data, c.width, c.height, avatar);
    ctx.putImageData(pixels, 0, 0);
    textures.addCanvas(key, c);
  }
}

/** Square portrait or full-body preview of an avatar for HTML screens. */
export function avatarPreview(textures: Phaser.Textures.TextureManager, id: string, pose = "idle", portrait = false) {
  ensureAvatar(textures, id);
  const source = textures.get(avatarKey(id, pose)).getSourceImage() as HTMLCanvasElement;
  const c = document.createElement("canvas");
  if (portrait) {
    c.width = c.height = 128;
    c.getContext("2d")!.drawImage(source, 122, 48, 156, 144, 0, 0, 128, 128);
  } else {
    c.width = 288;
    c.height = 240;
    c.getContext("2d")!.drawImage(source, 0, 0, 384, 320, 0, 0, 288, 240);
  }
  return c.toDataURL();
}
