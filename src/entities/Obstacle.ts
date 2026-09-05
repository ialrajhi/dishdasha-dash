import Phaser from "phaser";
import { GROUND } from "../config/Constants";
import type { HazardSpec } from "../levels/levels";
import { propHeight, propTexture } from "../utils/ArcadeArt";
const sizes: Record<string, [number, number]> = {
  cone: [16, 26],
  cat: [28, 23],
  ball: [22, 22],
  dallah: [27, 32],
  cart: [33, 30],
  kid: [17, 30],
  waiter: [25, 30],
  tray: [32, 19],
  rope: [30, 12],
  dune: [34, 16],
  pigeon: [27, 20],
  flowers: [27, 33],
};
export class Obstacle extends Phaser.GameObjects.Sprite {
  spec: HazardSpec;
  warned = false;
  hit = false;
  motionStart?: number;
  private originalX: number;
  private artScale = 1;
  constructor(scene: Phaser.Scene, spec: HazardSpec) {
    super(scene, spec.x, GROUND, spec.kind);
    this.spec = spec;
    this.originalX = spec.x;
    scene.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(18);
    if (spec.kind === "waiter") this.setFlipX(true);
    const key = propTexture(spec.kind);
    if (scene.textures.exists(key)) {
      this.setTexture(key);
      this.artScale = (propHeight[spec.kind] ?? 36) / this.height;
      this.setScale(this.artScale);
    }
  }
  tick(now: number, playerX: number, level: number) {
    if (
      this.spec.moving &&
      this.x - playerX < 530 &&
      this.motionStart === undefined
    )
      this.motionStart = now;
    if (this.motionStart !== undefined) {
      const speed =
        this.spec.kind === "dallah"
          ? 25 + level * 5
          : this.spec.kind === "kid"
            ? 38
            : 19;
      this.x = this.originalX - ((now - this.motionStart) / 1000) * speed;
      if (["dallah", "kid", "waiter", "goat"].includes(this.spec.kind))
        this.y = GROUND - Math.abs(Math.sin(now / 85)) * 2;
      if (["dallah", "cat", "goat", "pigeon"].includes(this.spec.kind)) {
        this.setAngle(Math.sin(now / 100) * 4);
        this.setScale(
          this.artScale * (1 + Math.sin(now / 100) * 0.025),
          this.artScale * (1 - Math.sin(now / 100) * 0.025),
        );
      }
      if (this.spec.kind === "ball") this.angle -= 1.5;
    }
    if (
      this.spec.kind === "bag" &&
      this.x - playerX < 430 &&
      this.x - playerX > 330
    )
      this.y = GROUND - Math.max(0, (this.x - playerX - 330) * 0.65);
  }
  hitbox() {
    const [w, h] = sizes[this.spec.kind] ?? [27, 25];
    return new Phaser.Geom.Rectangle(this.x - w / 2, this.y - h, w, h);
  }
}
