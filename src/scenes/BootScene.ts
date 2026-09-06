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
      this.game.events.emit("asset-progress", progress * 0.9),
    );
    this.load.on("loaderror", () => {
      this.failed = true;
    });
    preloadArcadeArt(this);
    for (const [key, url] of Object.entries(ASSET_OVERRIDES))
      this.load.image(key, url);
  }
  async create() {
    if (this.failed) {
      this.game.events.emit("asset-error");
      return;
    }
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // Arabic labels are baked into textures, so a failed font must be retryable
      // before preparing the artwork, rather than silently baking missing glyphs.
      await Promise.race([
        document.fonts.load('700 48px "Changa Variable"', 'بقالة بو خالد'),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error("Font preparation timed out")), 8000);
        }),
      ]);
      generateCoreArt(this);
      prepareArcadeArt(this);
      this.game.events.emit("asset-progress", 1);
      this.game.events.emit("assets-ready");
      this.scene.start("Menu");
    } catch {
      this.game.events.emit("asset-error");
    } finally {
      clearTimeout(timeout);
    }
  }
}
