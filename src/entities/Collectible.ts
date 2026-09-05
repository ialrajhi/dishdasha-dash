import Phaser from "phaser";
import type { TeaSpec } from "../levels/levels";
export class Collectible extends Phaser.GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    public spec: TeaSpec,
  ) {
    super(scene, spec.x, spec.y, spec.golden ? "golden" : "tea");
    scene.add.existing(this);
    this.setDepth(16);
  }
  tick(now: number) {
    this.y = this.spec.y + Math.sin(now / 280 + this.x) * 2;
    if (this.spec.golden) this.setAngle(Math.sin(now / 300) * 5);
  }
  hitbox() {
    return new Phaser.Geom.Rectangle(
      this.x - (this.spec.golden ? 18 : 11),
      this.y - 15,
      this.spec.golden ? 36 : 22,
      30,
    );
  }
}
