import Phaser from "phaser";
import { HERO_SCALE, heroFrame } from "../utils/ArcadeArt";
export type PlayerState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "hurt"
  | "dead"
  | "victory"
  | "respawn";
export class Player extends Phaser.Physics.Arcade.Sprite {
  state: PlayerState = "run";
  private lastFrame = "";
  visual: Phaser.GameObjects.Sprite;
  lastGrounded = -1000;
  bufferedAt = -1000;
  held = false;
  wasGrounded = false;
  invulnerableUntil = 0;
  hurtUntil = 0;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player-run-0");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(20);
    // Keep collision geometry stable while giving the illustrated hero room to move.
    this.setVisible(false);
    this.visual = scene.add
      .sprite(x, y, "hero-run1")
      .setOrigin(0.5, 1)
      .setScale(HERO_SCALE)
      .setDepth(20);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncVisual, this);
    this.bodyRef.setSize(19, 39).setOffset(9, 9);
    this.setMaxVelocity(260, 700);
  }
  get bodyRef() {
    return this.body as Phaser.Physics.Arcade.Body;
  }
  press(now: number) {
    this.held = true;
    this.bufferedAt = now;
  }
  release() {
    if (!this.held) return;
    this.held = false;
    if (this.bodyRef.velocity.y < -140)
      this.setVelocityY(this.bodyRef.velocity.y * 0.48);
  }
  animate(now: number) {
    const key = heroFrame(this.state, now);
    if (key !== this.lastFrame) {
      this.visual.setTexture(key);
      this.lastFrame = key;
    }
    this.visual.setAlpha(
      now < this.invulnerableUntil && Math.floor(now / 200) % 2 === 0 ? 0.35 : 1,
    );
  }
  private syncVisual() {
    this.visual.setPosition(this.x, this.y + 1);
  }
  land() {
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE);
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: HERO_SCALE * 1.08,
      scaleY: HERO_SCALE * 0.92,
      duration: 75,
      yoyo: true,
    });
  }
  resetVisual() {
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE).setAngle(0).clearTint().setAlpha(1);
    this.syncVisual();
  }
  destroy(fromScene?: boolean) {
    if (!this.scene) return;
    this.scene.events.off(
      Phaser.Scenes.Events.POST_UPDATE,
      this.syncVisual,
      this,
    );
    this.visual.destroy();
    super.destroy(fromScene);
  }
}
