import Phaser from "phaser";
import { LEVELS } from "../levels/levels";
import { WorldRenderer } from "./WorldRenderer";
import { save } from "../systems/SaveManager";
export class MenuScene extends Phaser.Scene {
  private world!: WorldRenderer;
  private runner!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  constructor() {
    super("Menu");
  }
  create() {
    this.cameras.main.setZoom(2).centerOn(320, 180).fadeIn(300);
    this.world = new WorldRenderer(this, LEVELS[0]);
    this.world.update(0, 0);
    this.shadow = this.add.ellipse(434, 300, 55, 8, 0x26212a, 0.28).setDepth(5);
    this.runner = this.add
      .sprite(434, 301, "hero-idle")
      .setOrigin(0.5, 1)
      .setScale(0.77)
      .setDepth(10);
    [0, 1, 2].forEach((i) =>
      this.add
        .image(510 + i * 52, 244 - i * 10, "arcade-tea")
        .setDisplaySize(19, 28),
    );
    this.game.events.emit("art-ready", this.textures);
  }
  update(time: number) {
    const calm = save.data.settings.reducedMotion;
    const moment = time % 14000;
    const pose = calm ? "hero-idle" : moment > 10400 && moment < 11800
      ? "hero-victoryFists" : moment > 6500 && moment < 8200
      ? "hero-victoryWave" : "hero-idle";
    this.runner.setTexture(pose).setPosition(434, 301)
      .setScale(0.77, 0.77 * (calm ? 1 : 1 + Math.sin(time / 900) * 0.006))
      .setAngle(calm || pose === "hero-idle" ? 0 : Math.sin(time / 300) * 0.7);
  }
}
