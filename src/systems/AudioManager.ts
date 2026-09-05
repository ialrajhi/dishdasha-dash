import { save } from "./SaveManager";
export type SoundName =
  | "jump"
  | "land"
  | "tea"
  | "golden"
  | "damage"
  | "death"
  | "complete"
  | "select"
  | "pause"
  | "victory";
const sounds: Record<SoundName, number[]> = {
  jump: [260, 470],
  land: [100],
  tea: [740, 990],
  golden: [523, 659, 784, 1047],
  damage: [130, 75],
  death: [340, 270, 200, 90],
  complete: [523, 659, 784, 1047],
  select: [440, 660],
  pause: [330, 220],
  victory: [523, 659, 784, 1047, 784, 1047],
};
export class AudioManager {
  private context?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private step = 0;
  private paused = false;
  private voices = new Set<OscillatorNode>();
  // Asset replacement seam: supply URLs here; procedural audio is the default.
  readonly soundFiles: Partial<Record<SoundName, string>> = {};
  musicFile?: string;
  private musicElement?: HTMLAudioElement;
  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
      }
      void this.context.resume().catch(() => {});
      this.sync();
    } catch {
      /* Browsers without audio still play the complete game. */
    }
  }
  sync() {
    if (this.master)
      this.master.gain.value = (save.data.settings.volume / 100) * 0.22;
    if (this.musicElement) {
      this.musicElement.volume = (save.data.settings.volume / 100) * 0.3;
      if (this.paused || !save.data.settings.music) this.musicElement.pause();
      else void this.musicElement.play().catch(() => {});
    }
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
    if (this.context && save.data.settings.music && !this.paused) {
      if (this.musicFile) {
        this.musicElement ??= new Audio(this.musicFile);
        this.musicElement.loop = true;
        this.musicElement.volume = (save.data.settings.volume / 100) * 0.3;
        void this.musicElement.play().catch(() => {});
      } else this.timer = window.setInterval(() => this.beat(), 240);
    }
  }
  private tone(
    freq: number,
    at: number,
    duration = 0.12,
    type: OscillatorType = "square",
    volume = 0.4,
  ) {
    if (!this.context || !this.master) return;
    const osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(gain);
    gain.connect(this.master);
    this.voices.add(osc);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.voices.delete(osc);
    };
    osc.start(at);
    osc.stop(at + duration + 0.01);
  }
  play(name: SoundName) {
    if (!save.data.settings.sfx) return;
    const url = this.soundFiles[name];
    if (url) {
      const a = new Audio(url);
      a.volume = save.data.settings.volume / 100;
      void a.play().catch(() => {});
      return;
    }
    if (!this.context) return;
    sounds[name].forEach((f, i) =>
      this.tone(
        f,
        this.context!.currentTime + i * 0.085,
        name === "death" ? 0.22 : 0.12,
        name === "land" ? "triangle" : "square",
      ),
    );
  }
  private beat() {
    if (!this.context) return;
    const notes = [
      262, 0, 330, 392, 0, 330, 294, 0, 220, 0, 294, 349, 0, 294, 262, 0,
    ];
    const n = notes[this.step % notes.length];
    if (n) this.tone(n, this.context.currentTime, 0.15, "triangle", 0.2);
    if (this.step % 4 === 0)
      this.tone(
        this.step % 16 < 8 ? 131 : 110,
        this.context.currentTime,
        0.3,
        "sine",
        0.4,
      );
    this.step++;
  }
  pause(value: boolean) {
    this.paused = value;
    if (value)
      for (const voice of this.voices) {
        try {
          voice.stop();
        } catch {}
      }
    this.sync();
  }
}
export const audio = new AudioManager();
