import Phaser from "phaser";
import { GROUND, DEV, RENDER_SCALE, CAMERA_PAD_X } from "../config/Constants";
import {
  LEVELS,
  createCourse,
  type Course,
  type LevelConfig,
} from "../levels/levels";
import { Player } from "../entities/Player";
import { Obstacle } from "../entities/Obstacle";
import { Collectible } from "../entities/Collectible";
import { WorldRenderer } from "./WorldRenderer";
import {
  ScoreManager,
  campaign,
  type LevelResult,
} from "../systems/ScoreManager";
import { save } from "../systems/SaveManager";
import { audio } from "../systems/AudioManager";
import { worldT } from "../systems/LocalizationManager";
export interface Snapshot {
  level: number;
  score: number;
  tea: number;
  totalTea: number;
  hearts: number;
  lives: number;
  progress: number;
  golden: boolean;
}
export interface GameHooks {
  hud: (state: Snapshot) => void;
  notice: (text: string, duration?: number) => void;
  pause: () => void;
  over: (state: Snapshot, deaths: number) => void;
  complete: (result: LevelResult) => void;
  practice: (step: "jump" | "duck" | "done", retry?: boolean) => void;
}
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
  private stepAccumulator = 0;
  private jumpSources = new Set<string>();
  private duckSources = new Set<string>();
  private world!: WorldRenderer;
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
      length: 1600, checkpoint: 1500, tea: [], gaps: [],
      hazards: [{ id: "practice-jump", x: 280, kind: "box", moving: false },
        { id: "practice-duck", x: 700, kind: "awning", moving: false }],
    } : createCourse(this.level);
    this.score = new ScoreManager();
    this.hearts = 3;
    this.lives = 3;
    this.phase = "running";
    this.checkpoint = 210;
    this.gameTime = 0;
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
    } else this.hooks.notice(this.level.intro, 2400);
    this.publish();
  }
  private populate() {
    this.hazards.forEach((h) => h.destroy());
    this.collectibles.forEach((c) => c.destroy());
    this.hazards = this.course.hazards
      .filter((h) => h.x > this.checkpoint - 80)
      .map((h) => new Obstacle(this, h));
    this.collectibles = this.course.tea
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
    if (this.practiceWaiting) { this.practiceWaiting = false; this.player.lastGrounded = this.gameTime; }
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
    return {
      level: this.level.id,
      score: this.score.score,
      tea: this.score.tea,
      totalTea: this.course.tea.filter((c) => !c.golden).length,
      hearts: this.hearts,
      lives: this.lives,
      progress: Math.min(
        1,
        Math.max(0, (this.player.x - 210) / (this.course.length - 210)),
      ),
      golden: this.score.golden,
    };
  }
  private publish() {
    this.hooks.hud(this.snapshot());
  }
  private burst(x: number, y: number, color: number, count = 8) {
    if (save.data.settings.reducedMotion || save.data.settings.steadyView) return;
    for (let i = 0; i < count; i++) {
      const p = this.add.image(x, y, "pixel").setTint(color).setDepth(25);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-26, 26),
        y: y - Phaser.Math.Between(5, 32),
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(250, 500),
        onComplete: () => p.destroy(),
      });
    }
  }
  private floating(text: string, x: number, y: number, color = "#fff2bc") {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "monospace",
        fontSize: "11px",
        fontStyle: "bold",
        color,
        stroke: "#456057",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.tweens.add({
      targets: label,
      y: y - 27,
      alpha: 0,
      delay: 100,
      duration: 700,
      onComplete: () => label.destroy(),
    });
  }
  damage(force = false) {
    if (this.practiceStep) { this.resetPractice(true); return; }
    if (
      this.phase !== "running" ||
      (!force &&
        (DEV.invincible || this.gameTime < this.player.invulnerableUntil))
    )
      return;
    this.hearts--;
    this.player.invulnerableUntil = this.gameTime + 1200;
    this.player.hurtUntil = this.gameTime + 220;
    this.player.setVelocityX(-55);
    this.player.visual.setTint(0xff9b82);
    this.time.delayedCall(140, () => this.player.visual.clearTint());
    if (!save.data.settings.reducedMotion && !save.data.settings.steadyView) this.cameras.main.shake(140, 0.004);
    this.burst(this.player.x, this.player.y - 20, 0xf1a080);
    audio.play("damage");
    this.publish();
    if (this.hearts <= 0) this.die();
  }
  die() {
    if (this.phase !== "running") return;
    this.phase = "dead";
    this.lives--;
    this.score.deaths++;
    campaign.deaths++;
    this.player.state = "dead";
    this.player.setVelocity(0, 0);
    this.player.bodyRef.enable = false;
    this.cameras.main.stopFollow();
    this.burst(this.player.x, this.player.y - 20, 0xffe4bb, 16);
    audio.play("death");
    this.hooks.notice("يا ساتر!", 1700);
    this.publish();
    this.time.delayedCall(650, () =>
      this.cameras.main.fadeOut(400, 30, 39, 41),
    );
    this.time.delayedCall(1150, () => {
      if (this.lives <= 0) {
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
    this.clearInput();
    const result = this.score.finish(
      this.level.id,
      this.snapshot().totalTea,
      this.hearts,
      this.lives,
    );
    campaign.results.set(this.level.id, result);
    save.complete(
      result.id,
      result.score,
      result.tea,
      result.golden,
      campaign.total(),
    );
    audio.play(this.level.id === 5 ? "victory" : "complete");
    this.hooks.notice(this.level.finish, 1700);
    this.publish();
    for (let i = 0; i < (save.data.settings.reducedMotion ? 0 : 60); i++) {
      const p = this.add
        .image(
          this.player.x + Phaser.Math.Between(-160, 280),
          Phaser.Math.Between(-80, 130),
          "pixel",
        )
        .setTint([0xeec67a, 0xf29191, 0x84c6b5, 0xffffff][i % 4])
        .setDepth(40);
      this.tweens.add({
        targets: p,
        y: 360,
        x: p.x + Phaser.Math.Between(-70, 70),
        angle: 360,
        duration: 1600 + i * 14,
        onComplete: () => p.destroy(),
      });
    }
    this.time.delayedCall(2100, () => this.hooks.complete(result));
  }
  update(_time: number, delta: number) {
    if (this.practiceWaiting) {
      this.player.animate(this.gameTime);
      return;
    }
    // One fixed clock owns physics, hazards, pickups and jump eligibility on every display.
    if (delta > 250 && this.phase === "running") { this.requestPause(); return; }
    const step = 1000 / 60;
    this.stepAccumulator += Math.min(delta, 250);
    while (this.stepAccumulator + 0.00001 >= step) {
      this.player.capturePrevious();
      this.hazards.forEach(h => h.capturePrevious());
      this.physics.world.update(this.gameTime, step);
      this.physics.world.postUpdate();
      this.tick(step);
      this.stepAccumulator -= step;
      if (this.practiceWaiting) { this.stepAccumulator = 0; break; }
    }
    const alpha = Phaser.Math.Clamp(this.stepAccumulator / step, 0, 1);
    this.player.present(alpha);
    this.player.animate(this.gameTime, this.player.visual.x);
    for (const hazard of this.hazards) hazard.present(alpha);
    const camera = this.cameras.main;
    camera.stopFollow();
    const follow = 1 - Math.exp(-Math.min(delta, 250) / 100);
    camera.scrollX = camera.clampX(Phaser.Math.Linear(camera.scrollX, this.player.visual.x + 110 - camera.width / 2, follow));
    this.world.update(this.gameTime + this.stepAccumulator);
    this.shadow.setPosition(this.player.visual.x, GROUND + 1)
      .setScale(Math.max(0.35, 1 - (GROUND - this.player.y) / 180));
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
    this.player.setDucking(grounded && (this.player.duckHeld || underAwning));
    if (grounded) {
      this.player.lastGrounded = now;
      if (!this.player.wasGrounded) {
        this.burst(this.player.x, this.player.y - 2, 0xf0d6a4, 6);
        audio.play("land");
        this.player.land();
      }
    }
    if (
      !this.player.ducking && !this.player.duckHeld && now - this.player.bufferedAt <= 140 &&
      now - this.player.lastGrounded <= 110
    ) {
      this.player.setVelocityY(-430);
      this.player.lastGrounded = -1000;
      this.player.bufferedAt = -1000;
      this.burst(this.player.x, this.player.y - 2, 0xf0d6a4, 5);
      audio.play("jump");
    }
    this.player.wasGrounded = grounded;
    if (this.player.duckHeld || this.player.ducking) this.player.bufferedAt = -1000;
    body.setGravityY(!this.player.held && body.velocity.y < 0 ? 450 : 0);
    const finalSprint =
      this.level.id === 5 &&
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
        : now < this.player.invulnerableUntil && this.player.state === "respawn"
          ? "respawn"
          : body.velocity.y < -15
            ? "jump"
            : !grounded && body.velocity.y > 15
              ? "fall"
              : this.player.ducking ? "duck" : "run";
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
      audio.play("select");
    }
    const playerBox = new Phaser.Geom.Rectangle(
      body.x,
      body.y,
      body.width,
      body.height,
    );
    for (const h of this.hazards) {
      h.tick(now, this.player.x, this.level.id);
      const distance = h.x - this.player.x;
      if (h.spec.kind === "awning" && distance < 290 && distance > 0 && !h.warned) {
        h.warned = true;
      }
      if (distance < 320 && distance > 0 && !h.warned && h.spec.moving) {
        h.warned = true;
        if (h.spec.kind === "dallah" || h.spec.kind === "cart")
          this.floating(
            h.spec.kind === "dallah" ? "دلة جايتك!" : "عربانة!",
            h.x,
            GROUND - 62,
            "#ffe1a0",
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
    for (const c of this.collectibles) {
      if (!c.active) continue;
      c.tick(now);
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(playerBox, c.hitbox()) &&
        this.score.collect(c.spec.id, c.spec.golden)
      ) {
        c.setActive(false).setVisible(false);
        this.burst(c.x, c.y, c.spec.golden ? 0xffd166 : 0xffe5a3, 10);
        this.floating(c.spec.golden ? "+5,000" : "+100", c.x, c.y - 13);
        audio.play(c.spec.golden ? "golden" : "tea");
        if (c.spec.golden) {
          save.golden(this.level.id);
          this.hooks.notice(
            "لقيت الدلة الذهبية!",
            1900,
          );
        }
      }
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
