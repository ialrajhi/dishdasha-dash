import Phaser from "phaser";
import { ASSET_OVERRIDES, generateArt } from "../utils/PixelArtGenerator";
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    for (const [key, url] of Object.entries(ASSET_OVERRIDES))
      this.load.image(key, url);
  }
  create() {
    generateArt(this);
    this.scene.start("Menu");
  }
}
