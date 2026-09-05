import Phaser from "phaser";
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
    this.held = false;
    if (this.bodyRef.velocity.y < -140)
      this.setVelocityY(this.bodyRef.velocity.y * 0.48);
  }
  animate(now: number) {
    const f = Math.floor(now / (this.state === "run" ? 95 : 190)) % 4,
      key = `player-${this.state}-${f}`;
    if (key !== this.lastFrame) {
      this.setTexture(key);
      this.lastFrame = key;
    }
    this.setAlpha(
      now < this.invulnerableUntil && Math.floor(now / 85) % 2 === 0 ? 0.35 : 1,
    );
  }
}
