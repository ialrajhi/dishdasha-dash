import Phaser from "phaser";
import { GROUND, DEV, RENDER_SCALE, CAMERA_PAD_X } from "../config/Constants";
import {
  LEVELS,
  FINAL_LEVEL,
  createCourse,
  type Course,
  type LevelConfig,
} from "../levels/levels";
import { Player } from "../entities/Player";
import { Obstacle } from "../entities/Obstacle";
import { Collectible, type PickupKind } from "../entities/Collectible";
import { WorldRenderer } from "./WorldRenderer";
import {
  ScoreManager,
  campaign,
  type LevelResult,
} from "../systems/ScoreManager";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
import { worldT } from "../systems/LocalizationManager";
import { Fx } from "../systems/Fx";
import { avatarById, powerSeconds, rateStars } from "../systems/Economy";
export interface Snapshot {
  level: number;
  score: number;
  tea: number;
  totalTea: number;
  coins: number;
  hearts: number;
  lives: number;
  progress: number;
  checkpoint: number;
  goldenAt: number;
  golden: boolean;
  combo: number;
  multiplier: number;
  /** Remaining power-up time, 0–1. */
  magnet: number;
  shield: number;
}
export interface GameHooks {
  hud: (state: Snapshot) => void;
  notice: (text: string, duration?: number) => void;
  pause: () => void;
  over: (state: Snapshot, deaths: number) => void;
  complete: (result: LevelResult) => void;
  practice: (step: "jump" | "duck" | "done", retry?: boolean) => void;
  /** A pickup at a page position, for the HUD fly-in animation. */
  collect: (kind: PickupKind, x: number, y: number) => void;
  hit: (shielded: boolean) => void;
}
const COMBO_WINDOW = 1500;
const multiplierFor = (combo: number) => combo >= 50 ? 4 : combo >= 25 ? 3 : combo >= 10 ? 2 : 1;
export class GameScene extends Phaser.Scene {
  player!: Player;
  level!: LevelConfig;
  course!: Course;
  score!: ScoreManager;
  hazards: Obstacle[] = [];
  collectibles: Collectible[] = [];
  hearts = 3;
  lives = 3;
  phase: "running" | "dead" | "complete" = "running";
  checkpoint = 210;
  gameTime = 0;
  combo = 0;
  comboUntil = 0;
  magnetUntil = 0;
  shieldUntil = 0;
  private magnetLength = 1;
  private shieldLength = 1;
  private freezeMs = 0;
  private slowMs = 0;
  private banked = 0;
  private lastDust = 0;
  /** The practice's opening press is always a full jump, however briefly it is held. */
  private holdAssistUntil = 0;
  private stepAccumulator = 0;
  private jumpSources = new Set<string>();
  private duckSources = new Set<string>();
  private world!: WorldRenderer;
  private fx!: Fx;
  private aura!: Phaser.GameObjects.Image;
  private hooks!: GameHooks;
  private keys = new Set<string>();
  private lastHud = 0;
  private debug?: Phaser.GameObjects.Graphics;
  private finalNotice = false;
  private shadow!: Phaser.GameObjects.Ellipse;
  practiceStep?: "jump" | "duck" | "done";
  practiceWaiting = false;
  practiceRetry = false;
  constructor() {
    super("Game");
  }
  init(data: { level: number; hooks: GameHooks; practice?: boolean }) {
    this.level = LEVELS[data.level - 1];
    this.hooks = data.hooks;
    this.practiceStep = data.practice ? "jump" : undefined;
    this.practiceWaiting = !!data.practice;
    this.practiceRetry = false;
    this.course = data.practice ? {
      length: 1600, checkpoint: 1500, tea: [], gaps: [], coins: [], powerups: [],
      hazards: [{ id: "practice-jump", x: 280, kind: "box", moving: false },
        { id: "practice-duck", x: 700, kind: "awning", moving: false }],
    } : createCourse(this.level);
    this.score = new ScoreManager();
    this.hearts = 3;
    this.lives = 3;
    this.phase = "running";
    this.checkpoint = 210;
    this.gameTime = 0;
    this.combo = 0;
    this.comboUntil = 0;
    this.magnetUntil = 0;
    this.shieldUntil = 0;
    this.freezeMs = 0;
    this.slowMs = 0;
    this.banked = 0;
    this.stepAccumulator = 0;
    this.jumpSources.clear();
    this.duckSources.clear();
    this.keys.clear();
    this.lastHud = 0;
    this.finalNotice = false;
  }
  create() {
    this.physics.disableUpdate();
    this.world = new WorldRenderer(this, this.level, this.course);
    this.fx = new Fx(this);
    const ground = this.physics.add.staticGroup();
    let start = 0;
    for (const gap of [
      ...this.course.gaps,
      { x: this.course.length + 500, width: 0 },
    ]) {
      const slab = this.add
        .rectangle(start, GROUND, gap.x - start, 100, 0, 0)
        .setOrigin(0);
      ground.add(slab);
      (slab.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      start = gap.x + gap.width;
    }
    this.player = new Player(this, 210, GROUND);
    this.physics.add.collider(this.player, ground);
    this.shadow = this.add
      .ellipse(210, GROUND, 26, 5, 0x524c3c, 0.27)
      .setDepth(8);
    this.aura = this.add.image(210, GROUND, "fx-ring").setDepth(19).setTint(0xff8a8a)
      .setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.populate();
    this.cameras.main
      .setZoom(RENDER_SCALE)
      .setBounds(0, 0, this.course.length + 260, 360)
      .startFollow(this.player, false, 0.15, 1, -110, 0)
      .setRoundPixels(false)
      .fadeIn(350);
    this.cameras.main.stopFollow();
    this.input.keyboard?.on("keydown", this.keyDown, this);
    this.input.keyboard?.on("keyup", this.keyUp, this);
    this.input.on("pointerdown", this.pointerDown, this);
    this.input.on("pointerup", this.pointerUp, this);
    this.input.on("pointerupoutside", this.pointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bank();
      this.input.keyboard?.off("keydown", this.keyDown, this);
      this.input.keyboard?.off("keyup", this.keyUp, this);
      this.input.off("pointerdown", this.pointerDown, this);
      this.input.off("pointerup", this.pointerUp, this);
      this.input.off("pointerupoutside", this.pointerUp, this);
      this.keys.clear();
    });
    if (DEV.showHitboxes) this.debug = this.add.graphics().setDepth(100);
    if (this.practiceStep) {
      this.player.state = "idle";
      this.hooks.practice(this.practiceStep);
    } else this.time.delayedCall(1700, () => this.hooks.notice(this.level.intro, 2000));
    this.publish();
  }
  private populate() {
    this.hazards.forEach((h) => h.destroy());
    this.collectibles.forEach((c) => c.destroy());
    this.hazards = this.course.hazards
      .filter((h) => h.x > this.checkpoint - 80)
      .map((h) => new Obstacle(this, h));
    const pickups = [
      ...this.course.tea.map((t) => ({ id: t.id, x: t.x, y: t.y, kind: (t.golden ? "golden" : "tea") as PickupKind })),
      ...this.course.coins.map((c) => ({ ...c, kind: "coin" as PickupKind })),
      // Power-ups behind a checkpoint come back after a respawn so a death never strands the player.
      ...this.course.powerups.filter((p) => p.x > this.checkpoint).map((p) => ({ ...p, id: `${p.id}-${this.score.deaths}` })),
    ];
    this.collectibles = pickups
      .filter((c) => !this.score.collected.has(c.id))
      .map((c) => new Collectible(this, c));
  }
  private keyDown(e: KeyboardEvent) {
    if (["ArrowDown", "KeyS"].includes(e.code)) {
      e.preventDefault();
      if (!this.keys.has(e.code)) { this.keys.add(e.code); this.pressDuck(`key:${e.code}`); }
    }
    if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
      e.preventDefault();
      if (!this.keys.has(e.code)) {
        this.keys.add(e.code);
        this.pressJump(`key:${e.code}`);
      }
    }
    if (e.code === "Escape" && !e.repeat) this.requestPause();
  }
  private keyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
    if (["Space", "ArrowUp", "KeyW"].includes(e.code))
      this.releaseJump(`key:${e.code}`);
    if (["ArrowDown", "KeyS"].includes(e.code)) this.releaseDuck(`key:${e.code}`);
  }
  private pointerDown(pointer: Phaser.Input.Pointer) {
    if (pointer.x > this.cameras.main.width * 0.38) this.pressJump(`canvas:${pointer.id}`);
  }
  private pointerUp(pointer: Phaser.Input.Pointer) {
    this.releaseJump(`canvas:${pointer.id}`);
  }
  pressJump(source = "external") {
    if (this.practiceStep === "done" || this.practiceStep === "duck" && this.practiceWaiting) return;
    if (this.phase !== "running" || !this.scene.isActive() || this.jumpSources.has(source)) return;
    const first = this.jumpSources.size === 0;
    this.jumpSources.add(source);
    if (this.practiceWaiting) {
      this.practiceWaiting = false;
      this.player.lastGrounded = this.gameTime;
      this.holdAssistUntil = this.gameTime + 450;
    }
    if (first) this.player.press(this.gameTime);
  }
  releaseJump(source = "external") {
    if (!this.jumpSources.delete(source)) return;
    if (!this.jumpSources.size && this.player) this.player.release();
  }
  pressDuck(source = "external") {
    if (this.practiceStep === "done" || this.practiceStep === "jump" && this.practiceWaiting) return;
    if (this.phase !== "running" || !this.scene.isActive()) return;
    this.duckSources.add(source);
    if (this.practiceWaiting) this.practiceWaiting = false;
    this.player.duckHeld = true;
    this.player.bufferedAt = -1000;
  }
  releaseDuck(source = "external") {
    this.duckSources.delete(source);
    if (this.player) this.player.duckHeld = this.duckSources.size > 0;
  }
  clearInput() {
    this.keys.clear();
    this.jumpSources.clear();
    this.duckSources.clear();
    if (this.player) {
      this.player.held = false;
      this.player.bufferedAt = -1000;
      this.player.duckHeld = false;
    }
  }
  requestPause() {
    if (this.scene.isActive() && this.phase !== "complete") {
      this.clearInput();
      this.hooks.pause();
    }
  }
  snapshot(): Snapshot {
    const span = this.course.length - 210;
    const golden = this.course.tea.find((t) => t.golden);
    return {
      level: this.level.id,
      score: this.score.score,
      tea: this.score.tea,
      totalTea: this.course.tea.filter((c) => !c.golden).length,
      coins: this.score.coins,
      hearts: this.hearts,
      lives: this.lives,
      progress: Math.min(1, Math.max(0, (this.player.x - 210) / span)),
      checkpoint: (this.course.checkpoint - 210) / span,
      goldenAt: golden ? (golden.x - 210) / span : -1,
      golden: this.score.golden,
      combo: this.gameTime < this.comboUntil ? this.combo : 0,
      multiplier: this.gameTime < this.comboUntil ? multiplierFor(this.combo) : 1,
      magnet: Math.max(0, (this.magnetUntil - this.gameTime) / this.magnetLength),
      shield: Math.max(0, (this.shieldUntil - this.gameTime) / this.shieldLength),
    };
  }
  private publish() {
    this.hooks.hud(this.snapshot());
  }
  /** Page coordinates of a world point, so HTML effects can start exactly on a pickup. */
  private toPage(x: number, y: number) {
    const cam = this.cameras.main;
    const rect = this.game.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((x - cam.worldView.x) * cam.zoom * rect.width) / this.scale.width,
      y: rect.top + ((y - cam.worldView.y) * cam.zoom * rect.height) / this.scale.height,
    };
  }
  /** Moves collected coins into the persistent wallet exactly once. */
  bank() {
    const fresh = this.score.coins - this.banked;
    if (fresh > 0) save.addCoins(fresh);
    this.banked = this.score.coins;
  }
  damage(force = false) {
    if (this.practiceStep) { this.resetPractice(true); return; }
    if (
      this.phase !== "running" ||
      (!force &&
        (DEV.invincible || this.gameTime < this.player.invulnerableUntil))
    )
      return;
    if (!force && this.gameTime < this.shieldUntil) {
      // The bubble absorbs one hit and buys a moment of safety.
      this.shieldUntil = 0;
      this.player.invulnerableUntil = this.gameTime + 900;
      this.fx.ring(this.player.x, this.player.y - 27, 0x8ccaff, 110, 450);
      this.fx.sparkles(this.player.x, this.player.y - 27, 0xbfe3ff, 18);
      this.fx.shake(90, 0.003);
      audio.play("shield");
      this.hooks.hit(true);
      this.publish();
      return;
    }
    this.hearts--;
    this.combo = 0;
    this.player.invulnerableUntil = this.gameTime + 1200;
    this.player.hurtUntil = this.gameTime + 220;
    this.player.setVelocityX(-55);
    this.player.visual.setTint(0xff9b82);
    this.time.delayedCall(140, () => this.player.visual.clearTint());
    this.freezeMs = 70;
    this.fx.shake(180, 0.006);
    this.fx.sparkles(this.player.x, this.player.y - 24, 0xff9b82, 12);
    this.fx.ring(this.player.x, this.player.y - 24, 0xff7a6a, 70);
    audio.play("damage");
    this.hooks.hit(false);
    this.publish();
    if (this.hearts <= 0) this.die();
  }
  die() {
    if (this.phase !== "running") return;
    this.phase = "dead";
    this.lives--;
    this.score.deaths++;
    campaign.deaths++;
    this.combo = 0;
    this.magnetUntil = this.shieldUntil = 0;
    this.player.state = "dead";
    this.player.setVelocity(0, 0);
    this.player.bodyRef.enable = false;
    this.player.bubble.setVisible(false);
    this.cameras.main.stopFollow();
    this.fx.sparkles(this.player.x, this.player.y - 20, 0xffe4bb, 16);
    this.fx.shake(260, 0.008);
    audio.play("death");
    this.hooks.notice("يا ساتر!", 1700);
    this.publish();
    this.time.delayedCall(650, () =>
      this.cameras.main.fadeOut(400, 30, 39, 41),
    );
    this.time.delayedCall(1150, () => {
      if (this.lives <= 0) {
        this.bank();
        save.highScore(campaign.total() + this.score.score);
        this.hooks.over(this.snapshot(), this.score.deaths);
      } else this.respawn();
    });
  }
  private respawn() {
    this.clearInput();
    this.hearts = 3;
    this.phase = "running";
    this.populate();
    this.player.bodyRef.enable = true;
    this.player.bodyRef.reset(this.checkpoint, GROUND);
    this.player.setVelocity(0, 0);
    this.player.state = "respawn";
    this.player.resetVisual();
    this.player.held = false;
    this.player.bufferedAt = -1000;
    this.player.invulnerableUntil = this.gameTime + 1400;
    this.player.hurtUntil = 0;
    this.player.lastGrounded = -1000;
    this.cameras.main.scrollX = Math.max(0, this.checkpoint - 210) - CAMERA_PAD_X;
    this.cameras.main
      .startFollow(this.player, false, 0.15, 1, -110, 0)
      .fadeIn(350);
    this.publish();
  }
  finish() {
    if (this.practiceStep) return;
    if (this.phase !== "running") return;
    this.phase = "complete";
    this.player.setVelocityX(0);
    this.player.bodyRef.allowGravity = true;
    this.player.bodyRef.setGravityY(0);
    this.player.state = this.player.bodyRef.blocked.down ? "victory" : "fall";
    this.player.bubble.setVisible(false);
    this.aura.setVisible(false);
    this.clearInput();
    const totalTea = this.snapshot().totalTea;
    const stars = rateStars(this.score.golden, this.score.tea, totalTea);
    const result = this.score.finish(
      this.level.id,
      totalTea,
      this.hearts,
      this.lives,
      stars,
    );
    campaign.results.set(this.level.id, result);
    this.bank();
    save.addCoins(result.coinBonus);
    save.rateLevel(result.id, stars);
    save.complete(
      result.id,
      result.score,
      result.tea,
      result.golden,
      campaign.total(),
    );
    audio.play(this.level.id === FINAL_LEVEL ? "victory" : "complete");
    this.hooks.notice(this.level.finish, 1700);
    this.publish();
    this.fx.confettiBurst(this.player.x + 60, 40, 90);
    this.time.delayedCall(350, () => this.fx.confettiBurst(this.player.x - 40, 30, 60));
    this.time.delayedCall(2100, () => this.hooks.complete(result));
  }
  update(_time: number, rawDelta: number) {
    if (this.practiceWaiting) {
      this.player.animate(this.gameTime);
      return;
    }
    // One fixed clock owns physics, hazards, pickups and jump eligibility on every display.
    if (rawDelta > 250 && this.phase === "running") { this.requestPause(); return; }
    let delta = Math.min(rawDelta, 250);
    if (this.freezeMs > 0) {
      // Hit-stop: a few frozen frames make an impact read clearly.
      this.freezeMs -= delta;
      delta = 0;
    } else if (this.slowMs > 0) {
      this.slowMs -= delta;
      delta *= 0.35;
    }
    const step = 1000 / 60;
    this.stepAccumulator += delta;
    while (this.stepAccumulator + 0.00001 >= step) {
      this.player.capturePrevious();
      this.hazards.forEach(h => h.capturePrevious());
      this.physics.world.update(this.gameTime, step);
      this.physics.world.postUpdate();
      this.player.syncMovement(step / 1000);
      this.tick(step);
      this.stepAccumulator -= step;
      if (this.practiceWaiting) { this.stepAccumulator = 0; break; }
    }
    const alpha = Phaser.Math.Clamp(this.stepAccumulator / step, 0, 1);
    this.player.present(alpha);
    this.player.animate(this.gameTime);
    for (const hazard of this.hazards) hazard.present(alpha);
    const camera = this.cameras.main;
    camera.stopFollow();
    const follow = 1 - Math.exp(-Math.min(rawDelta, 250) / 100);
    camera.scrollX = camera.clampX(Phaser.Math.Linear(camera.scrollX, this.player.visual.x + 110 - camera.width / 2, follow));
    this.world.update(this.gameTime + this.stepAccumulator);
    this.shadow.setPosition(this.player.visual.x, GROUND + 1)
      .setScale(Math.max(0.35, 1 - (GROUND - this.player.y) / 180));
    const shieldLeft = this.shieldUntil - this.gameTime;
    this.player.bubble.setVisible(this.phase === "running" && shieldLeft > 0 && (shieldLeft > 2000 || Math.floor(shieldLeft / 120) % 2 === 0));
    const magnetLeft = this.magnetUntil - this.gameTime;
    this.aura.setVisible(this.phase === "running" && magnetLeft > 0)
      .setPosition(this.player.visual.x, this.player.visual.y - 26)
      .setDisplaySize(70 + Math.sin(this.gameTime / 90) * 6, 70 + Math.sin(this.gameTime / 90) * 6)
      .setAlpha(magnetLeft < 2000 ? 0.15 + (Math.floor(magnetLeft / 120) % 2) * 0.2 : 0.3);
  }
  private jumpEffects(x: number, y: number, air: boolean) {
    this.fx.puff(x, y, air ? 4 : 6);
    if (air) this.fx.ring(x, y - 4, 0xffffff, 34, 300);
    audio.play(air ? "double" : "jump");
  }
  private tick(delta: number) {
    this.gameTime += delta;
    const now = this.gameTime;
    if (this.phase !== "running") {
      if (this.phase === "complete") {
        const grounded = this.player.bodyRef.blocked.down && this.player.bodyRef.velocity.y >= 0;
        this.player.state = grounded ? "victory" : this.player.bodyRef.velocity.y < 0 ? "jump" : "fall";
      }
      return;
    }
    const body = this.player.bodyRef;
    const grounded = (body.blocked.down || body.touching.down) && body.velocity.y >= 0;
    // Keep a crouch until the trailing edge clears, including after pause/resume.
    const underAwning = this.player.ducking && this.hazards.some(h => h.spec.kind === "awning" &&
      h.hitbox().right > body.left && h.hitbox().left < body.right);
    const wasDucking = this.player.ducking;
    this.player.setDucking(grounded && (this.player.duckHeld || underAwning));
    if (this.player.ducking && !wasDucking && !this.practiceStep) audio.play("whoosh");
    if (grounded) {
      this.player.lastGrounded = now;
      this.player.airJumps = 0;
      if (!this.player.wasGrounded) {
        if (this.player.slamming) {
          this.fx.puff(this.player.x, this.player.y - 2, 14);
          this.fx.ring(this.player.x, this.player.y - 2, 0xf0dcb0, 50, 300);
          this.fx.shake(90, 0.003);
          audio.play("slam");
        } else {
          this.fx.puff(this.player.x, this.player.y - 2, 6);
          audio.play("land");
        }
        this.player.slamming = false;
        this.player.land();
      } else if (this.player.ducking && now - this.lastDust > 50) {
        this.lastDust = now;
        this.fx.puff(this.player.x + 4, this.player.y - 1, 2);
      } else if (!this.player.ducking && now - this.lastDust > 170) {
        this.lastDust = now;
        this.fx.puff(this.player.x - 6, this.player.y - 1, 1);
      }
    } else if (this.player.duckHeld && !this.player.slamming && body.velocity.y > -260) {
      // Duck in mid-air slams down, so a late Duck still makes an awning.
      this.player.slamming = true;
      this.player.setVelocityY(480);
      audio.play("whoosh");
    }
    const buffered = now - this.player.bufferedAt <= 140;
    if (!this.player.ducking && !this.player.duckHeld && buffered && now - this.player.lastGrounded <= 110) {
      this.player.setVelocityY(-430);
      this.player.lastGrounded = -1000;
      this.player.bufferedAt = -1000;
      this.jumpEffects(this.player.x, this.player.y - 2, false);
    } else if (buffered && !grounded && this.player.airJumps < 1 && !this.player.duckHeld &&
      (body.velocity.y < 0 || this.player.y < GROUND - 22)) {
      // One air jump. Near the ground the press stays buffered for a normal landing jump.
      this.player.airJumps++;
      this.player.slamming = false;
      this.player.setVelocityY(-370);
      this.player.bufferedAt = -1000;
      this.jumpEffects(this.player.x, this.player.y - 4, true);
    }
    this.player.wasGrounded = grounded;
    if (this.player.duckHeld || this.player.ducking) this.player.bufferedAt = -1000;
    // Rising without the button held falls back sooner: a tap is a short hop, a hold a full leap.
    body.setGravityY(body.velocity.y < 0 ? (this.player.held || now < this.holdAssistUntil ? 0 : 700) : 250);
    const finalSprint =
      this.level.id === FINAL_LEVEL &&
      this.player.x > this.course.length - this.level.speed * 15;
    if (finalSprint && !this.finalNotice) {
      this.finalNotice = true;
      this.hooks.notice("شد حيلك! العرس ناطرك!", 2000);
    }
    if (now >= this.player.hurtUntil)
      this.player.setVelocityX(this.level.speed * (finalSprint ? 1.08 : 1));
    this.player.state =
      now < this.player.hurtUntil
        ? "hurt"
        : !grounded || body.velocity.y < 0
          ? body.velocity.y < 0 ? "jump" : "fall"
          : this.player.ducking ? "duck" : "run";
    const trail = avatarById(this.player.avatar).trail;
    if (trail && now % 80 < delta) this.fx.sparkles(this.player.x - 8, this.player.y - 20, trail, 1);
    if (this.player.y > 365) {
      if (DEV.invincible) {
        this.player.bodyRef.reset(this.player.x + 75, GROUND - 80);
        this.player.setVelocityY(-100);
      } else this.die();
      return;
    }
    if (this.checkpoint === 210 && this.player.x >= this.course.checkpoint) {
      this.checkpoint = this.course.checkpoint;
      this.hooks.notice(worldT("checkpoint"), 2000);
      this.fx.sparkles(this.player.x, this.player.y - 40, 0x9ff0d0, 14);
      audio.play("checkpoint");
    }
    const playerBox = new Phaser.Geom.Rectangle(
      body.x,
      body.y,
      body.width,
      body.height,
    );
    for (const h of this.hazards) {
      h.tick(now, this.player.x, this.level.id, delta / 1000);
      const distance = h.x - this.player.x;
      if (h.spec.kind === "awning" && distance < 290 && distance > 0 && !h.warned) {
        h.warned = true;
      }
      if (distance < 320 && distance > 0 && !h.warned && h.spec.moving) {
        h.warned = true;
        if (h.spec.kind === "dallah" || h.spec.kind === "cart")
          this.fx.pop(
            h.spec.kind === "dallah" ? "دلة جايتك!" : "عربانة!",
            h.x,
            GROUND - 62,
            "#ffe1a0",
            11,
          );
      }
      if (
        !h.hit &&
        Phaser.Geom.Intersects.RectangleToRectangle(playerBox, h.hitbox())
      ) {
        h.hit = true;
        this.score.resolved.add(h.spec.id);
        this.damage();
      }
      if (!this.practiceStep && h.hitbox().right < playerBox.left && !h.hit) this.score.avoid(h.spec.id);
    }
    const magnet = now < this.magnetUntil;
    const chest = { x: this.player.x, y: this.player.y - 26 };
    for (const c of this.collectibles) {
      if (!c.active) continue;
      if (magnet && !c.isItem && c.spec.kind !== "golden" && !c.attracted &&
        Math.abs(c.x - chest.x) < 150 && Math.abs(c.y - chest.y) < 130) c.attracted = true;
      c.tick(now, chest, delta / 1000);
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBox, c.hitbox())) this.pickup(c);
    }
    if (now - this.lastHud > 70) {
      this.lastHud = now;
      this.publish();
    }
    if (this.practiceStep === "jump" && this.player.x >= 580 && grounded) {
      this.practiceStep = "duck";
      this.resetPractice(false);
    } else if (this.practiceStep === "duck" && body.left > this.hazards[1].hitbox().right + 12) {
      this.practiceStep = "done";
      this.clearInput();
      this.player.setVelocity(0, 0);
      this.player.setDucking(false);
      this.player.state = "victory";
      this.practiceWaiting = true;
      save.tutorial("completed");
      this.hooks.practice("done");
    }
    if (this.player.x >= this.course.length) this.finish();
    if (this.debug) {
      this.debug.clear().lineStyle(1, 0xff3344).strokeRectShape(playerBox);
      this.hazards.forEach((h) => this.debug!.strokeRectShape(h.hitbox()));
    }
  }
  private pickup(c: Collectible) {
    const { kind, id } = c.spec;
    const now = this.gameTime;
    if (kind === "magnet" || kind === "shield") {
      if (this.score.collected.has(id)) return;
      this.score.collected.add(id);
      c.collect();
      const seconds = powerSeconds(kind, save.data.upgrades[kind]) * 1000;
      if (kind === "magnet") { this.magnetUntil = now + seconds; this.magnetLength = seconds; }
      else { this.shieldUntil = now + seconds; this.shieldLength = seconds; }
      this.fx.ring(c.x, c.y, kind === "magnet" ? 0xff8a8a : 0x8ccaff, 80, 420);
      this.fx.sparkles(c.x, c.y, kind === "magnet" ? 0xffb0b0 : 0xbfe3ff, 16);
      this.fx.pop(kind === "magnet" ? "مغناطيس!" : "درع!", c.x, c.y - 20, "#ffffff", 13, kind === "magnet" ? "#9b1c22" : "#1d4f9b");
      audio.play("powerup");
      const page = this.toPage(c.x, c.y);
      this.hooks.collect(kind, page.x, page.y);
      this.publish();
      return;
    }
    this.combo = now < this.comboUntil ? this.combo + 1 : 1;
    this.comboUntil = now + COMBO_WINDOW;
    this.score.bestCombo = Math.max(this.score.bestCombo, this.combo);
    const multiplier = multiplierFor(this.combo);
    const gained = kind === "coin"
      ? this.score.collectCoin(id, multiplier)
      : this.score.collect(id, kind === "golden", multiplier);
    if (!gained) return;
    c.collect();
    const page = this.toPage(c.x, c.y);
    this.hooks.collect(kind, page.x, page.y);
    if (kind === "coin") {
      this.fx.sparkles(c.x, c.y, 0xffe066, 5);
      this.fx.glow(c.x, c.y, 0xffd040, 26);
      audio.play("coin", Math.min(this.combo, 14));
    } else if (kind === "tea") {
      this.fx.sparkles(c.x, c.y, 0xffe5a3, 9);
      this.fx.ring(c.x, c.y, 0xfff1c4, 40);
      this.fx.pop(`+${100 * multiplier}`, c.x, c.y - 14, multiplier > 1 ? "#ffd166" : "#fff6dc", multiplier > 1 ? 13 : 11);
      audio.play("tea", Math.min(this.combo, 14));
    } else {
      // The golden dallah is the stage's big moment.
      this.slowMs = 650;
      this.fx.rays(c.x, c.y);
      this.fx.flash(220, 255, 230, 160);
      this.fx.sparkles(c.x, c.y, 0xffd560, 34);
      this.fx.ring(c.x, c.y, 0xffd560, 130, 600);
      this.fx.pop("+5,000", c.x, c.y - 24, "#ffd560", 18, "#5a3200");
      audio.play("golden");
      save.golden(this.level.id);
      this.hooks.notice("لقيت الدلة الذهبية!", 2200);
    }
    if ([10, 25, 50].includes(this.combo)) {
      this.fx.pop(`×${multiplier} COMBO`, this.player.x + 10, this.player.y - 70, "#ffffff", 14, "#c2410c");
      audio.play("combo");
    }
    this.publish();
  }
  private resetPractice(retry: boolean) {
    this.clearInput();
    this.practiceRetry = retry;
    this.practiceWaiting = true;
    this.player.bodyRef.reset(this.practiceStep === "jump" ? 210 : 580, GROUND);
    this.player.setVelocity(0, 0);
    this.player.resetVisual();
    this.player.state = "idle";
    this.hazards.forEach(h => { h.hit = false; });
    this.hooks.practice(this.practiceStep!, retry);
  }
}
