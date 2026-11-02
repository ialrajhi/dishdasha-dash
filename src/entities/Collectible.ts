import Phaser from "phaser";
import { save } from "../systems/SaveManager";

export type PickupKind = "tea" | "golden" | "coin" | "magnet" | "shield";
export interface PickupSpec {
  id: string;
  x: number;
  y: number;
  kind: PickupKind;
}
const textures: Record<PickupKind, string> = {
  tea: "arcade-tea",
  golden: "arcade-golden",
  coin: "fx-coin",
  magnet: "fx-magnet",
  shield: "fx-shield",
};
const heights: Record<PickupKind, number> = { tea: 27, golden: 43, coin: 15, magnet: 26, shield: 26 };
export class Collectible extends Phaser.GameObjects.Sprite {
  /** Set while the magnet is pulling this pickup toward the player. */
  attracted = false;
  private glow?: Phaser.GameObjects.Image;
  private baseScale: number;
  constructor(
    scene: Phaser.Scene,
    public spec: PickupSpec,
  ) {
    super(scene, spec.x, spec.y, textures[spec.kind]);
    scene.add.existing(this);
    this.setDepth(16);
    this.baseScale = heights[spec.kind] / this.height;
    this.setScale(this.baseScale);
    if (spec.kind === "golden" || spec.kind === "magnet" || spec.kind === "shield") {
      this.glow = scene.add
        .image(spec.x, spec.y, "fx-glow")
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(spec.kind === "golden" ? 0xffd560 : spec.kind === "magnet" ? 0xff8a8a : 0x8ccaff)
        .setAlpha(0.7)
        .setDisplaySize(spec.kind === "golden" ? 70 : 46, spec.kind === "golden" ? 70 : 46);
    }
  }
  get isItem() {
    return this.spec.kind === "magnet" || this.spec.kind === "shield";
  }
  tick(now: number, target?: { x: number; y: number }, seconds = 1 / 60) {
    if (this.attracted && target) {
      // Accelerate toward the hero's chest; collection happens on overlap.
      const dx = target.x - this.x, dy = target.y - this.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const speed = 260 + Math.max(0, 140 - d) * 4;
      this.x += (dx / d) * Math.min(d, speed * seconds);
      this.y += (dy / d) * Math.min(d, speed * seconds);
    } else if (!save.data.settings.reducedMotion) {
      this.y = this.spec.y + Math.sin(now / 280 + this.spec.x) * (this.isItem ? 3 : 2);
      if (this.spec.kind === "golden") this.setAngle(Math.sin(now / 300) * 5);
    } else this.y = this.spec.y;
    if (this.spec.kind === "coin") {
      // A flat sprite reads as a spinning coin by scaling its width with a cosine.
      const spin = Math.cos(now / 160 + this.spec.x * 0.03);
      this.setScale(this.baseScale * Math.max(0.12, Math.abs(spin)), this.baseScale);
      this.setTint(spin < 0 ? 0xf0c060 : 0xffffff);
    }
    if (this.glow) {
      this.glow.setPosition(this.x, this.y).setAlpha(0.45 + Math.sin(now / 220) * 0.2);
      if (this.isItem) this.setScale(this.baseScale * (1 + Math.sin(now / 200) * 0.06));
    }
  }
  collect() {
    this.setActive(false).setVisible(false);
    this.glow?.destroy();
    this.glow = undefined;
  }
  destroy(fromScene?: boolean) {
    this.glow?.destroy();
    super.destroy(fromScene);
  }
  hitbox() {
    const half = this.spec.kind === "golden" ? 18 : this.spec.kind === "coin" ? 9 : this.isItem ? 14 : 11;
    const h = this.spec.kind === "coin" ? 9 : this.isItem ? 14 : 15;
    return new Phaser.Geom.Rectangle(this.x - half, this.y - h, half * 2, h * 2);
  }
}
