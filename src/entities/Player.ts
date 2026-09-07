import Phaser from "phaser";
import { StrideAnimator } from "../utils/StrideAnimator";
import { HERO_RUN, HERO_DUCK, HERO_MAX_RUN_SPEED } from "../config/Locomotion";
import { save } from "../systems/SaveManager";
import { HERO_SCALE, heroFrame } from "../utils/ArcadeArt";
export type PlayerState =
  | "idle"
  | "run"
  | "duck"
  | "jump"
  | "fall"
  | "hurt"
  | "dead"
  | "victory"
  | "respawn";
export class Player extends Phaser.Physics.Arcade.Sprite {
  state: PlayerState = "run";
  private lastFrame = "";
  private gait = new StrideAnimator(HERO_RUN);
  private strideState: PlayerState = "run";
  private visualAlpha = 1;
  private previousX = 0;
  private previousY = 0;
  visual: Phaser.GameObjects.Sprite;
  lastGrounded = -1000;
  bufferedAt = -1000;
  held = false;
  duckHeld = false;
  ducking = false;
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
      .sprite(x, y, "hero-run-stride-0")
      .setOrigin(0.5, 1)
      .setScale(HERO_SCALE)
      .setDepth(20);

    this.bodyRef.setSize(19, 58).setOffset(9, -10);
    this.setMaxVelocity(HERO_MAX_RUN_SPEED, 700);
    this.capturePrevious();
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
  setDucking(active: boolean) {
    if (active === this.ducking) return;
    this.ducking = active;
    // Both shapes share the same feet. Changing stance must not move the body.
    const bottom = this.bodyRef.bottom;
    this.bodyRef.setSize(19, active ? 44 : 58, false).setOffset(9, active ? 4 : -10);
    this.bodyRef.position.y = bottom - this.bodyRef.height;
    this.bodyRef.updateCenter();
  }
  syncMovement(seconds: number) {
    // The state captured before physics describes the movement just simulated.
    this.gait.setCycle(this.strideState === "duck" ? HERO_DUCK : HERO_RUN);
    const grounded = this.bodyRef.blocked.down || this.bodyRef.touching.down;
    this.gait.advance(this.x - this.previousX, seconds,
      grounded && (this.strideState === "run" || this.strideState === "duck"));
  }
  animate(now: number) {
    this.gait.setCycle(this.state === "duck" ? HERO_DUCK : HERO_RUN);
    const key = this.state === "run"
      ? this.gait.animationFPS === 0 ? heroFrame("idle", now) : `hero-run-stride-${this.gait.frame(this.visualAlpha)}`
      : this.state === "duck" ? `hero-duck-${this.gait.frame(this.visualAlpha)}` : heroFrame(this.state, now);
    if (key !== this.lastFrame) {
      this.visual.setTexture(key);
      this.lastFrame = key;
    }
    this.visual.setAlpha(
      now < this.invulnerableUntil ? (save.data.settings.steadyView || save.data.settings.reducedMotion ? 0.72 : Math.floor(now / 200) % 2 === 0 ? 0.35 : 1) : 1,
    );
  }
  capturePrevious() { this.previousX = this.x; this.previousY = this.y; this.strideState = this.state; }
  present(alpha: number) {
    const snap = Math.abs(this.x - this.previousX) > 80 || Math.abs(this.y - this.previousY) > 80;
    this.visualAlpha = snap ? 1 : alpha;
    this.visual.setPosition(snap ? this.x : Phaser.Math.Linear(this.previousX, this.x, alpha), (snap ? this.y : Phaser.Math.Linear(this.previousY, this.y, alpha)) + 1);
  }
  land() {
    // Compression is drawn into the poses. Never squash/stretch the whole character.
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE);
  }
  resetVisual() {
    this.setDucking(false);
    this.duckHeld = false;
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE).setAngle(0).clearTint().setAlpha(1);
    this.gait.reset();
    this.capturePrevious();
    this.present(1);
  }
  destroy(fromScene?: boolean) {
    if (!this.scene) return;

    this.visual.destroy();
    super.destroy(fromScene);
  }
}
