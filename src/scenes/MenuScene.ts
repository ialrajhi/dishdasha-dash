import Phaser from "phaser";
import { LEVELS } from "../levels/levels";
import { WorldRenderer } from "./WorldRenderer";
import { heroFrame } from "../utils/ArcadeArt";
import { save } from "../systems/SaveManager";
export class MenuScene extends Phaser.Scene {
  private world!: WorldRenderer;
  private runner!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private tea: Phaser.GameObjects.Image[] = [];
  constructor() {
    super("Menu");
  }
  create() {
    this.cameras.main.setZoom(2).centerOn(320, 180).fadeIn(300);
    this.world = new WorldRenderer(this, LEVELS[0]);
    this.shadow = this.add.ellipse(434, 300, 55, 8, 0x26212a, 0.28).setDepth(5);
    this.runner = this.add
      .sprite(434, 301, "hero-run1")
      .setOrigin(0.5, 1)
      .setScale(0.77)
      .setDepth(10);
    this.tea = [0, 1, 2].map((i) =>
      this.add
        .image(510 + i * 52, 244 - i * 10, "arcade-tea")
        .setDisplaySize(19, 28),
    );
    this.game.events.emit("art-ready", this.textures);
  }
  update(time: number) {
    if (save.data.settings.reducedMotion) { this.world.update(0, 0); this.runner.setTexture("hero-idle"); this.runner.y = 301; return; }
    this.world.update(time, time * 0.036);
    this.runner.setTexture(heroFrame("run", time));
    this.runner.y = 301 - Math.abs(Math.sin(time / 160)) * 1.1;
    this.shadow.setScale(1 + Math.sin(time / 160) * 0.04, 1);
    this.tea.forEach(
      (tea, i) => (tea.y = 244 - i * 10 + Math.sin(time / 400 + i) * 3),
    );
  }
}
