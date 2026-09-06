import Phaser from "phaser";
import { runFrame } from "../utils/runFrame";
import { GROUND } from "../config/Constants";
import type { HazardSpec } from "../levels/levels";
import { propHeight, propTexture, runCycle } from "../utils/ArcadeArt";
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
  private previousX = 0;
  private suspension: Phaser.GameObjects.TileSprite[] = [];
  constructor(scene: Phaser.Scene, spec: HazardSpec) {
    super(scene, spec.x, GROUND, propTexture(spec.kind));
    this.spec = spec;
    this.originalX = spec.x;
    this.previousX = spec.x;
    scene.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(18);
    if (spec.kind === "waiter") this.setFlipX(true);
    const key = spec.kind === "kid" ? "arcade-kid-stride-0" : propTexture(spec.kind);
    if (scene.textures.exists(key)) {
      this.setTexture(key);
      this.artScale = (propHeight[spec.kind] ?? 36) / this.height;
      this.setScale(this.artScale);
      if (spec.kind === "ball") this.setOrigin(0.5).setY(GROUND - this.displayHeight / 2);
      if (spec.kind === "awning") {
        this.setDisplaySize(126, 52).setY(GROUND - 50);
        // Ropes continue above the viewport and meet the two metal suspension rings.
        const anchorY = this.y - this.displayHeight + 5;
        this.suspension = [-53, 53].map(dx => scene.add.tileSprite(this.x + dx, anchorY,
          32, (anchorY + 30) / .2, "arcade-suspension-rope").setOrigin(.5, 1).setScale(.2).setDepth(17));
      }
    }
  }
  capturePrevious() { this.previousX = this.x; }
  present(alpha: number) {
    if (this.spec.kind !== "kid") return;
    const x = Phaser.Math.Linear(this.previousX, this.x, alpha);
    this.setDisplayOrigin(this.width / 2 + (this.x - x) / this.artScale, this.height);
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
      if (["dallah", "waiter", "goat"].includes(this.spec.kind))
        this.y = GROUND - Math.abs(Math.sin(now / 85)) * 2;
    }
    if (this.spec.kind === "kid") {
      const phase = runFrame(this.originalX - this.x, runCycle.kidStride, runCycle.count);
      this.setTexture(`arcade-kid-stride-${phase}`).setAngle(0).setScale(this.artScale);
      this.y = GROUND;
    }
    if (["dallah", "cat", "goat", "pigeon", "waiter"].includes(this.spec.kind)) {
      this.setAngle(Math.sin(now / 125 + this.originalX) * 3);
      this.setScale(this.artScale * (1 + Math.sin(now / 125) * 0.025),
        this.artScale * (1 - Math.sin(now / 125) * 0.025));
    }
    if (this.spec.kind === "ball") this.angle = now * 0.04;
    if (
      this.spec.kind === "bag" &&
      this.x - playerX < 430 &&
      this.x - playerX > 330
    )
      this.y = GROUND - Math.max(0, (this.x - playerX - 330) * 0.65);
    else if (this.spec.kind === "bag" && this.x - playerX <= 330) this.y = GROUND;
  }
  destroy(fromScene?: boolean) {
    this.suspension.forEach(rope => rope.destroy());
    this.suspension = [];
    super.destroy(fromScene);
  }
  hitbox() {
    if (this.spec.kind === "awning") return new Phaser.Geom.Rectangle(this.x - 49, GROUND - 102, 98, 52);
    const [w, h] = sizes[this.spec.kind] ?? [27, 25];
    const bottom = this.spec.kind === "ball" ? this.y + this.displayHeight / 2 : this.y;
    return new Phaser.Geom.Rectangle(this.x - w / 2, bottom - h, w, h);
  }
}
