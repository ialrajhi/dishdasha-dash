import Phaser from "phaser";
import { GROUND } from "../config/Constants";
import type { LevelConfig, Course } from "../levels/levels";
export class WorldRenderer {
  private layers: { sprite: Phaser.GameObjects.TileSprite; rate: number }[] =
    [];
  private bird: Phaser.GameObjects.Text;
  private steam: Phaser.GameObjects.Graphics;
  private level: LevelConfig;
  constructor(
    private scene: Phaser.Scene,
    level: LevelConfig,
    course?: Course,
  ) {
    this.level = level;
    scene.add
      .image(0, 0, `sky-${level.id}`)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-30);
    this.layers.push({
      sprite: scene.add
        .tileSprite(0, 0, 640, 360, `far-${level.id}`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-25),
      rate: 0.15,
    });
    this.layers.push({
      sprite: scene.add
        .tileSprite(0, 0, 640, 360, `mid-${level.id}`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-20),
      rate: 0.55,
    });
    this.layers.push({
      sprite: scene.add
        .tileSprite(0, GROUND, 640, 60, `ground-${level.id}`)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(-5),
      rate: 1,
    });
    scene.add
      .rectangle(320, 294, 640, 12, level.id === 5 ? 0xba6967 : 0xc4b68f, 0.5)
      .setScrollFactor(0)
      .setDepth(-10);
    this.bird = scene.add
      .text(0, 80, "⌁", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: level.id > 3 ? "#d6c1b5" : "#315f5b",
      })
      .setScrollFactor(0)
      .setDepth(-21);
    this.steam = scene.add.graphics().setScrollFactor(0).setDepth(-18);
    if (course) {
      for (const gap of course.gaps) {
        scene.add
          .rectangle(gap.x, GROUND, gap.width, 60, 0x414343)
          .setOrigin(0)
          .setDepth(-4);
        scene.add
          .rectangle(gap.x, GROUND, gap.width, 5, 0x786a50)
          .setOrigin(0)
          .setDepth(-3);
        for (const x of [gap.x - 18, gap.x + gap.width + 18])
          scene.add
            .image(x, GROUND, "cone")
            .setOrigin(0.5, 1)
            .setScale(0.48)
            .setDepth(2);
      }
      scene.add
        .image(course.length, GROUND, `finish-${level.id}`)
        .setOrigin(0.5, 1)
        .setDepth(1);
    }
  }
  update(now: number, offset?: number) {
    const x = offset ?? this.scene.cameras.main.scrollX;
    for (const l of this.layers)
      l.sprite.tilePositionX = Math.round(x * l.rate);
    this.bird.setPosition(
      660 - ((now / 34) % 730),
      83 + Math.sin(now / 500) * 7,
    );
    this.steam.clear();
    if (this.level.id === 4) {
      this.steam.fillStyle(0xeac09b, 0.38);
      for (let i = 0; i < 7; i++)
        this.steam.fillRect(
          ((now / 22 + i * 111) % 680) - 20,
          215 + (i % 3) * 21,
          9,
          1,
        );
    } else {
      this.steam.fillStyle(0xfbe7a6, 0.25 + 0.15 * Math.sin(now / 300));
      for (let i = 0; i < 8; i++)
        this.steam.fillRect(
          (i * 111 - x * 0.55) % 640,
          190 + (i % 2) * 30,
          3,
          3,
        );
    }
  }
}
