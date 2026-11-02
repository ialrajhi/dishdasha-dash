import Phaser from "phaser";
import { StrideAnimator } from "../utils/StrideAnimator";
import { KID_RUN } from "../config/Locomotion";
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
  private previousX = 0;
  private gait = new StrideAnimator(KID_RUN);
  private suspension: Phaser.GameObjects.TileSprite[] = [];
  /** Contact shadow: grounds every street hazard the way the hero's shadow grounds him. */
  private shadow?: Phaser.GameObjects.Ellipse;
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
      if (spec.kind !== "awning")
        this.shadow = scene.add.ellipse(spec.x, GROUND + 1, Math.min(44, this.displayWidth * 0.82), 5, 0x2b2318, 0.32).setDepth(8);
      if (spec.kind === "awning") {
        this.setDisplaySize(126, 52).setY(GROUND - 50);
        // Ropes continue above the viewport and meet the two metal suspension rings.
        const anchorY = this.y - this.displayHeight + 5;
        this.suspension = [-53, 53].map(dx => scene.add.tileSprite(this.x + dx, anchorY,
          32, (anchorY + 30) / .2, "arcade-suspension-rope").setOrigin(.5, 1).setScale(.2).setDepth(17));
      }
    }
  }
  capturePrevious() {
    this.previousX = this.x;
    // Complete/death scenes stop ticking hazards; discard the last moving interpolation.
    if (this.spec.kind === "kid") this.gait.advance(0, 0);
  }
  present(alpha: number) {
    if (this.spec.kind !== "kid") return;
    const x = Phaser.Math.Linear(this.previousX, this.x, alpha);
    this.shadow?.setX(x);
    this.setTexture(`arcade-kid-stride-${this.gait.frame(alpha)}`);
    this.setDisplayOrigin(this.width / 2 + (this.x - x) / this.artScale, this.height);
  }
  tick(now: number, playerX: number, level: number, seconds: number) {
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
      this.gait.advance(this.x - this.previousX, seconds);
      this.setAngle(0).setScale(this.artScale);
      this.y = GROUND;
    }
    if (this.spec.kind === "cat") {
      // A real cat sits still and breathes; rocking around its base made it look like it hovered.
      this.setAngle(0).setScale(this.artScale, this.artScale * (1 + Math.sin(now / 700 + this.originalX) * 0.018));
    } else if (["dallah", "goat", "pigeon", "waiter"].includes(this.spec.kind)) {
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
    this.updateShadow();
  }
  private updateShadow() {
    if (!this.shadow) return;
    const bottom = this.spec.kind === "ball" ? this.y + this.displayHeight / 2 : this.y;
    const lift = Math.max(0, GROUND - bottom);
    this.shadow.setPosition(this.x, GROUND + 1).setScale(Math.max(0.35, 1 - lift / 60)).setAlpha(Math.max(0.1, 0.32 - lift / 200));
  }
  destroy(fromScene?: boolean) {
    this.suspension.forEach(rope => rope.destroy());
    this.shadow?.destroy();
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
