import Phaser from "phaser";
import { generateArt } from "../utils/PixelArtGenerator";
import { LEVELS } from "../levels/levels";
import { WorldRenderer } from "./WorldRenderer";
export class MenuScene extends Phaser.Scene {
  private world!: WorldRenderer;
  private runner!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  constructor() {
    super("Menu");
  }
  create() {
    generateArt(this);
    this.world = new WorldRenderer(this, LEVELS[0]);
    this.cameras.main.fadeIn(300);
    this.shadow = this.add.ellipse(440, 299, 25, 5, 0x534c38, 0.3).setDepth(5);
    this.runner = this.add
      .sprite(440, 300, "player-run-0")
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.add.image(560, 269, "tea").setScale(1.1);
    this.add.image(610, 259, "tea").setScale(1.1);
    this.game.events.emit("art-ready", this.textures);
  }
  update(time: number) {
    this.world.update(time, 190 + time * 0.005);
    const x = 400 + ((time / 30) % 310);
    this.runner.setX(x).setTexture(`player-run-${Math.floor(time / 100) % 4}`);
    this.shadow.setX(x);
  }
}
