import Phaser from "phaser";
import { ASSET_OVERRIDES, generateCoreArt } from "../utils/PixelArtGenerator";
import { preloadArcadeArt, prepareArcadeArt } from "../utils/ArcadeArt";
export class BootScene extends Phaser.Scene {
  private failed = false;
  constructor() {
    super("Boot");
  }
  preload() {
    this.load.on("progress", (progress: number) =>
      this.game.events.emit("asset-progress", progress),
    );
    this.load.on("loaderror", () => {
      this.failed = true;
    });
    preloadArcadeArt(this);
    for (const [key, url] of Object.entries(ASSET_OVERRIDES))
      this.load.image(key, url);
  }
  create() {
    if (this.failed) {
      this.game.events.emit("asset-error");
      return;
    }
    generateCoreArt(this);
    prepareArcadeArt(this);
    this.game.events.emit("assets-ready");
    this.scene.start("Menu");
  }
}
