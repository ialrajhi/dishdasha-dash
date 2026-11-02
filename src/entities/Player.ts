import Phaser from "phaser";
import { StrideAnimator } from "../utils/StrideAnimator";
import { HERO_RUN, HERO_DUCK, HERO_MAX_RUN_SPEED } from "../config/Locomotion";
import { save } from "../systems/SaveManager";
import { HERO_SCALE, heroFrame } from "../utils/ArcadeArt";
import { avatarKey, ensureAvatar } from "../utils/AvatarArt";
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
  /** Whether the last grounded step covered ground. Air time keeps it, so landing never flashes idle. */
  private striding = false;
  private visualAlpha = 1;
  private previousX = 0;
  private previousY = 0;
  visual: Phaser.GameObjects.Sprite;
  bubble: Phaser.GameObjects.Image;
  avatar: string;
  lastGrounded = -1000;
  bufferedAt = -1000;
  held = false;
  duckHeld = false;
  ducking = false;
  wasGrounded = false;
  /** Air jumps used since leaving the ground (one double jump allowed). */
  airJumps = 0;
  /** True while a mid-air Duck is slamming the hero to the ground. */
  slamming = false;
  invulnerableUntil = 0;
  hurtUntil = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, avatar = save.data.avatar) {
    super(scene, x, y, "player-run-0");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.avatar = avatar;
    ensureAvatar(scene.textures, avatar);
    this.setOrigin(0.5, 1).setDepth(20);
    // Keep collision geometry stable while giving the illustrated hero room to move.
    this.setVisible(false);
    this.visual = scene.add
      .sprite(x, y, avatarKey(avatar, "run-stride-0"))
      .setOrigin(0.5, 1)
      .setScale(HERO_SCALE)
      .setDepth(20);
    this.bubble = scene.add
      .image(x, y, "fx-bubble")
      .setDisplaySize(76, 76)
      .setDepth(21)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setVisible(false);

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
    // Early release is handled by stronger rising gravity, so even a tap clears a crate.
    this.held = false;
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
    const onFoot = grounded && (this.strideState === "run" || this.strideState === "duck");
    this.gait.advance(this.x - this.previousX, seconds, onFoot);
    if (onFoot && seconds > 0) this.striding = this.gait.animationFPS > 0;
  }
  animate(now: number) {
    this.gait.setCycle(this.state === "duck" ? HERO_DUCK : HERO_RUN);
    const base = this.state === "run"
      ? !this.striding ? heroFrame("idle", now).slice(5) : `run-stride-${this.gait.frame(this.visualAlpha)}`
      // Ducking is a power slide on the sandals: one low pose held while dust sprays, never a crouch-walk
      // whose tiny steps would skate across the street.
      : this.state === "duck" ? "duck-0" : heroFrame(this.state, now).slice(5);
    const key = avatarKey(this.avatar, base);
    if (key !== this.lastFrame) {
      this.visual.setTexture(key);
      this.lastFrame = key;
    }
    this.visual.setAlpha(
      now < this.invulnerableUntil ? (save.data.settings.reducedMotion ? 0.72 : Math.floor(now / 100) % 2 === 0 ? 0.4 : 1) : 1,
    );
  }
  capturePrevious() { this.previousX = this.x; this.previousY = this.y; this.strideState = this.state; }
  present(alpha: number) {
    const snap = Math.abs(this.x - this.previousX) > 80 || Math.abs(this.y - this.previousY) > 80;
    this.visualAlpha = snap ? 1 : alpha;
    const x = snap ? this.x : Phaser.Math.Linear(this.previousX, this.x, alpha);
    this.visual.setPosition(x, (snap ? this.y : Phaser.Math.Linear(this.previousY, this.y, alpha)) + 1);
    this.bubble.setPosition(this.visual.x, this.visual.y - (this.ducking ? 20 : 27));
  }
  land() {
    // Compression is drawn into the poses. Never squash/stretch the whole character.
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE);
  }
  resetVisual() {
    this.setDucking(false);
    this.duckHeld = false;
    this.airJumps = 0;
    this.slamming = false;
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(HERO_SCALE).setAngle(0).clearTint().setAlpha(1);
    this.gait.reset();
    this.striding = false;
    this.capturePrevious();
    this.present(1);
  }
  destroy(fromScene?: boolean) {
    if (!this.scene) return;
    this.visual.destroy();
    this.bubble.destroy();
    super.destroy(fromScene);
  }
}
