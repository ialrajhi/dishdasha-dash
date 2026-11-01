import Phaser from "phaser";
import { save } from "./SaveManager";

/** World-space game feel: particles, rings, pop text, flashes and shakes. */
export class Fx {
  private sparkle: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private confetti: Phaser.GameObjects.Particles.ParticleEmitter;
  constructor(private scene: Phaser.Scene) {
    this.sparkle = scene.add.particles(0, 0, "fx-star", {
      emitting: false,
      speed: { min: 40, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.32, end: 0 },
      alpha: { start: 1, end: 0.2 },
      rotate: { min: 0, max: 180 },
      lifespan: { min: 320, max: 620 },
      gravityY: 120,
      blendMode: Phaser.BlendModes.ADD,
    }).setDepth(32);
    this.dust = scene.add.particles(0, 0, "fx-dot", {
      emitting: false,
      speedX: { min: -70, max: 10 },
      speedY: { min: -40, max: -6 },
      scale: { start: 0.55, end: 1.4 },
      alpha: { start: 0.55, end: 0 },
      lifespan: { min: 260, max: 520 },
      tint: 0xf0dcb0,
    }).setDepth(19);
    this.confetti = scene.add.particles(0, 0, "fx-confetti", {
      emitting: false,
      speedX: { min: -160, max: 160 },
      speedY: { min: -320, max: -120 },
      gravityY: 380,
      rotate: { start: 0, end: 720 },
      scaleX: { min: 0.35, max: 0.6 },
      scaleY: { min: 0.35, max: 0.6 },
      lifespan: 2200,
      tint: [0xffc93c, 0xe5484d, 0x3fb5a3, 0xffffff, 0x6aa6ff, 0xf28fb5],
    }).setDepth(40);
  }
  private get calm() {
    return save.data.settings.reducedMotion;
  }
  sparkles(x: number, y: number, color = 0xffe39a, count = 10) {
    if (this.calm) count = Math.min(count, 3);
    this.sparkle.particleTint = color;
    this.sparkle.explode(count, x, y);
  }
  puff(x: number, y: number, count = 6) {
    if (this.calm) return;
    this.dust.explode(count, x, y);
  }
  ring(x: number, y: number, color = 0xffffff, size = 46, duration = 380) {
    const ring = this.scene.add.image(x, y, "fx-ring").setTint(color).setDepth(31)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(size * 0.2, size * 0.2);
    this.scene.tweens.add({
      targets: ring, displayWidth: size, displayHeight: size, alpha: 0,
      duration, ease: "Cubic.easeOut", onComplete: () => ring.destroy(),
    });
  }
  glow(x: number, y: number, color: number, size = 60) {
    const glow = this.scene.add.image(x, y, "fx-glow").setTint(color).setDepth(30)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(size, size);
    this.scene.tweens.add({ targets: glow, alpha: 0, scale: glow.scale * 1.6, duration: 320, onComplete: () => glow.destroy() });
  }
  /** Score text that pops in with overshoot, then rises and fades. */
  pop(text: string, x: number, y: number, color = "#fff2bc", size = 12, stroke = "#3a2a14") {
    // Stroking joined Arabic letters traces the font's overlapping contours, so Arabic gets a shadow outline.
    const arabic = /[\u0600-\u06FF]/.test(text);
    const label = this.scene.add.text(x, y, text, {
      fontFamily: '"Changa Variable", sans-serif',
      fontSize: `${size}px`,
      fontStyle: "800",
      color,
      stroke,
      strokeThickness: arabic ? 0 : Math.max(2, size / 4),
      resolution: 4,
      padding: { x: 4, y: 6 },
    }).setOrigin(0.5).setDepth(34).setScale(0.3);
    if (arabic) label.setShadow(0, 1, stroke, 3, false, true);
    this.scene.tweens.chain({
      targets: label,
      tweens: [
        { scale: 1.25, duration: 110, ease: "Back.easeOut" },
        { scale: 1, duration: 90 },
        { y: y - 26, alpha: 0, duration: 620, delay: 220, ease: "Cubic.easeIn" },
      ],
      onComplete: () => label.destroy(),
    });
  }
  confettiBurst(x: number, y: number, count = 70) {
    if (this.calm) return;
    this.confetti.explode(count, x, y);
  }
  rays(x: number, y: number, color = 0xffe08a) {
    const rays = this.scene.add.image(x, y, "fx-rays").setDepth(14).setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(30, 30).setAlpha(0.9);
    this.scene.tweens.add({ targets: rays, displayWidth: 190, displayHeight: 190, angle: 90, alpha: 0, duration: 1100, ease: "Cubic.easeOut", onComplete: () => rays.destroy() });
  }
  shake(duration = 140, intensity = 0.004) {
    if (this.calm || save.data.settings.steadyView) return;
    this.scene.cameras.main.shake(duration, intensity);
  }
  flash(duration = 160, r = 255, g = 255, b = 255) {
    if (this.calm) return;
    this.scene.cameras.main.flash(duration, r, g, b);
  }
}
