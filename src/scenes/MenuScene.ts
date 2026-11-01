import Phaser from "phaser";
import { RENDER_SCALE } from "../config/Constants";
import { LEVELS } from "../levels/levels";
import { WorldRenderer } from "./WorldRenderer";
import { save } from "../systems/SaveManager";
import { avatarById } from "../systems/Economy";
import { avatarKey, ensureAvatar } from "../utils/AvatarArt";
import { HERO_SCALE } from "../utils/ArcadeArt";
import { StrideAnimator } from "../utils/StrideAnimator";
import { HERO_RUN } from "../config/Locomotion";

/** The menu hero is drawn larger than in a level; strides scale with him. */
const MENU_SCALE = 1.45;
/** World units per millisecond: the title street scroll and the menu walk-over share one speed. */
const RUN_SPEED = 0.16;

/** Living backdrop for the title and menus: the street scrolls while the runner runs. */
export class MenuScene extends Phaser.Scene {
  private world!: WorldRenderer;
  private runner!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private pickups: Phaser.GameObjects.Image[] = [];
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;
  private avatar = "";
  private offset = 0;
  private runnerX = 320;
  private gait = new StrideAnimator(HERO_RUN);
  constructor() {
    super("Menu");
  }
  create() {
    this.cameras.main.setZoom(RENDER_SCALE).centerOn(320, 180).fadeIn(400);
    this.world = new WorldRenderer(this, LEVELS[0]);
    this.world.update(0, 0);
    this.shadow = this.add.ellipse(434, 300, 30, 6, 0x26212a, 0.3).setDepth(5);
    this.runner = this.add.sprite(434, 301, "hero-idle").setOrigin(0.5, 1).setScale(HERO_SCALE * MENU_SCALE).setDepth(10);
    this.sparkle = this.add.particles(0, 0, "fx-star", {
      emitting: false,
      speed: { min: 20, max: 70 },
      scale: { start: 0.25, end: 0 },
      lifespan: 500,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(11);
    for (let i = 0; i < 6; i++)
      this.pickups.push(this.add.image(0, 0, i % 3 === 1 ? "arcade-tea" : "fx-coin").setDepth(9));
    this.game.events.emit("art-ready", this.textures);
  }
  update(time: number, delta = 16) {
    const calm = save.data.settings.reducedMotion;
    const screen = this.registry.get("screen") as string;
    const running = screen === "title" && !calm;
    if (save.data.avatar !== this.avatar) {
      this.avatar = save.data.avatar;
      ensureAvatar(this.textures, this.avatar);
    }
    // Title: run in place mid-screen. Menu: run over to stand beside the menu panel.
    const targetX = screen === "title" ? 320 : save.data.settings.language === "ar" ? 170 : 470;
    const gap = targetX - this.runnerX;
    const step = Math.sign(gap) * Math.min(Math.abs(gap), RUN_SPEED * delta);
    const moving = !calm && Math.abs(gap) > 0.5;
    if (calm) this.runnerX = targetX;
    else this.runnerX += step;
    let travel = 0;
    if (running) {
      this.offset += RUN_SPEED * delta;
      travel = RUN_SPEED * delta;
    } else if (moving) travel = Math.abs(step);
    // Legs follow ground distance (street scroll on the title, his own travel on the menu).
    this.gait.advance(travel / MENU_SCALE, delta / 1000, running || moving);
    this.world.update(time, this.offset);
    this.runner.setFlipX(moving && gap < 0);
    let pose: string;
    if (running || moving) pose = `run-stride-${this.gait.frame()}`;
    else {
      const moment = time % 9000;
      pose = calm ? "idle" : moment > 6400 && moment < 7600 ? "victoryWave" : Math.floor(time / 420) % 2 ? "idleBreathe" : "idle";
    }
    this.runner.setTexture(avatarKey(this.avatar, pose)).setPosition(this.runnerX, 301);
    this.shadow.setPosition(this.runnerX, 301);
    const trail = avatarById(this.avatar).trail;
    if (trail && running && time % 90 < delta) {
      this.sparkle.particleTint = trail;
      this.sparkle.explode(1, this.runnerX - 10, 270);
    }
    // Coins and tea drift past on the title, and float gently beside the runner on the menu.
    this.pickups.forEach((p, i) => {
      const tea = i % 3 === 1;
      const h = tea ? 22 : 13;
      p.setScale(h / p.height);
      if (running) {
        p.setVisible(true).setPosition(680 - ((this.offset * 0.9 + i * 120) % 760), 248 - (i % 2) * 26 + Math.sin(time / 300 + i) * 3);
      } else {
        const side = save.data.settings.language === "ar" ? -1 : 1;
        p.setVisible(i < 3).setPosition(this.runnerX + side * (60 + i * 34), 230 - i * 12 + Math.sin(time / 500 + i) * 4);
      }
      if (!tea) p.setScale(Math.max(0.12, Math.abs(Math.cos(time / 180 + i))) * (h / p.height), h / p.height);
    });
  }
}
