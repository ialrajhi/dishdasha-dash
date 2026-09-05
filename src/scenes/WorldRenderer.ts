import Phaser from "phaser";
import { GROUND } from "../config/Constants";
import type { LevelConfig, Course } from "../levels/levels";
import { floorY } from "../utils/ArcadeArt";
import { save } from "../systems/SaveManager";

/** A richly painted middle distance and a separate street scrolling at walking speed. */
export class WorldRenderer {
  private scenery: Phaser.GameObjects.Image;
  private street: Phaser.GameObjects.TileSprite;
  private atmosphere: Phaser.GameObjects.Graphics;
  private artScale: number;
  private courseLength: number;
  constructor(
    private scene: Phaser.Scene,
    private level: LevelConfig,
    course?: Course,
  ) {
    this.artScale = (GROUND / floorY[level.id - 1]) * 1.06;
    this.courseLength = course?.length ?? 0;
    // Phaser's centered, zoomed camera shifts fixed objects by half the logical viewport.
    const fixed = scene.add
      .container(320, 180)
      .setScrollFactor(0)
      .setDepth(-20);
    this.scenery = scene.add
      .image(0, GROUND - floorY[level.id - 1] * this.artScale, `scenery-${level.id}`)
      .setOrigin(0)
      .setScale(this.artScale);
    this.street = scene.add
      .tileSprite(0, GROUND, 640, 60, `street-${level.id}`)
      .setOrigin(0)
      .setTileScale(this.artScale);
    this.atmosphere = scene.add.graphics();
    fixed.add([this.scenery, this.street, this.atmosphere]);
    if (course) {
      for (const gap of course.gaps) {
        const g = scene.add.graphics().setDepth(-4);
        g.fillStyle(0x111b24).fillRect(gap.x, GROUND, gap.width, 70);
        g.fillStyle(0x253641).fillRect(
          gap.x + 5,
          GROUND + 10,
          gap.width - 10,
          60,
        );
        g.lineStyle(4, 0x80634a).strokeRect(
          gap.x - 1,
          GROUND + 2,
          gap.width + 2,
          68,
        );
        g.fillStyle(0x13282f).fillRect(
          gap.x + 7,
          GROUND + 35,
          gap.width - 14,
          35,
        );
        for (const x of [gap.x - 18, gap.x + gap.width + 18])
          scene.add
            .image(x, GROUND, "arcade-cone")
            .setOrigin(0.5, 1)
            .setDisplaySize(17, 23)
            .setDepth(2);
      }
      const x = course.length;
      const gate = scene.add.graphics().setDepth(1);
      gate
        .fillStyle(0x342c28)
        .fillRect(x - 61, GROUND - 123, 9, 123)
        .fillRect(x + 52, GROUND - 123, 9, 123);
      gate
        .fillStyle(0xc29450)
        .fillRect(x - 58, GROUND - 121, 3, 121)
        .fillRect(x + 55, GROUND - 121, 3, 121);
      gate
        .fillStyle(0x182332)
        .fillRoundedRect(x - 72, GROUND - 133, 144, 41, 3);
      gate
        .fillStyle(0xffe8b6)
        .fillRoundedRect(x - 69, GROUND - 130, 138, 35, 2);
      scene.add
        .text(x, GROUND - 112, level.end, {
          fontFamily: '"Changa Variable", sans-serif',
          fontSize: "18px",
          fontStyle: "bold",
          color: "#28232a",
        })
        .setOrigin(0.5)
        .setDepth(2);
      for (let i = 0; i < 7; i++) {
        gate.fillStyle([0xe64032, 0xf9cc54, 0x46b991][i % 3]);
        gate.fillTriangle(
          x - 48 + i * 16,
          GROUND - 90,
          x - 36 + i * 16,
          GROUND - 90,
          x - 42 + i * 16,
          GROUND - 76,
        );
      }
    }
  }
  update(now: number, offset?: number) {
    const x = offset ?? this.scene.cameras.main.scrollX + 320;
    // A unique landmark panorama: never duplicate, mirror, or blend the towers.
    const progress = save.data.settings.steadyView ? .25 : this.courseLength ? Phaser.Math.Clamp(x / this.courseLength, 0, 1) : (1 - Math.cos(now / 24000)) / 2;
    this.scenery.x = -Math.max(0, this.scenery.displayWidth - 640) * progress;
    this.street.tilePositionX = x / this.artScale;
    const g = this.atmosphere;
    g.clear();
    if (save.data.settings.reducedMotion || save.data.settings.steadyView) return;
    if (this.level.id < 3) {
      g.lineStyle(0.9, 0x354c62, 0.65);
      for (let i = 0; i < 5; i++) {
        const bx = 690 - ((now / 70 + i * 37) % 760),
          by = 86 + Math.sin(now / 1500 + i) * 8 + i * 5;
        const flap = Math.sin(now / 140 + i) * 3;
        g.beginPath()
          .moveTo(bx - 4, by + flap)
          .lineTo(bx, by)
          .lineTo(bx + 4, by + flap)
          .strokePath();
      }
    }
    for (let i = 0; i < 15; i++) {
      const drift = this.level.id === 4 ? now / 24 : -now / 110;
      const px = ((((i * 83 + drift - x * 0.6) % 670) + 670) % 670) - 15;
      const py = 150 + ((i * 31) % 135) + Math.sin(now / 900 + i) * 7;
      g.fillStyle(
        this.level.id > 2 ? 0xffcf71 : 0xfff5d4,
        0.12 + (1 + Math.sin(now / 600 + i)) * 0.13,
      );
      g.fillCircle(px, py, this.level.id === 4 ? 0.7 : 0.9);
    }
  }
}
