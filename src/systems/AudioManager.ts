import { save } from "./SaveManager";
export type SoundName =
  | "jump"
  | "double"
  | "land"
  | "slam"
  | "whoosh"
  | "tea"
  | "coin"
  | "golden"
  | "powerup"
  | "shield"
  | "combo"
  | "checkpoint"
  | "damage"
  | "death"
  | "complete"
  | "victory"
  | "select"
  | "hover"
  | "back"
  | "pause"
  | "buy"
  | "deny"
  | "star"
  | "tick";
export type Track = "menu" | "game" | "night" | "none";

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
// Hijaz on D: D Eb F# G A Bb C. Eighth-note phrases, -1 rests.
const D4 = 62, Eb4 = 63, Fs4 = 66, G4 = 67, A4 = 69, Bb4 = 70, C5 = 72, D5 = 74, Eb5 = 75, _ = -1;
const MELODY_A = [D5, _, C5, Bb4, A4, _, Bb4, A4, G4, _, Fs4, G4, A4, _, _, _, A4, Bb4, C5, D5, C5, Bb4, A4, G4, Fs4, G4, A4, _, G4, Fs4, Eb4, D4];
const MELODY_B = [D5, _, D5, Eb5, D5, C5, Bb4, _, C5, _, Bb4, A4, G4, _, _, _, A4, _, Bb4, C5, Bb4, A4, G4, Fs4, G4, A4, Fs4, Eb4, D4, _, _, _];
const BASS = [38, 38, 36, 38];
// Maqsum: dum tak – tak dum – tak –
const DRUMS = ["D", "T", "", "T", "D", "", "T", ""];

/** All sound is synthesized: no files to license, download or load. */
export class AudioManager {
  private context?: AudioContext;
  private master?: GainNode;
  private sfxBus?: GainNode;
  private musicBus?: GainNode;
  private reverb?: GainNode;
  private noiseBuffer?: AudioBuffer;
  private timer?: number;
  private step = 0;
  private nextTime = 0;
  private paused = false;
  private track: Track = "none";
  private musicVoices = new Set<AudioScheduledSourceNode>();
  unlock() {
    try {
      if (!this.context) {
        const ctx = new AudioContext();
        this.context = ctx;
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.ratio.value = 4;
        this.master = ctx.createGain();
        this.master.connect(compressor).connect(ctx.destination);
        this.sfxBus = ctx.createGain();
        this.musicBus = ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        // A short generated room impulse gives everything a little space.
        const convolver = ctx.createConvolver();
        const length = ctx.sampleRate * 1.4;
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let c = 0; c < 2; c++) {
          const data = impulse.getChannelData(c);
          for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
        }
        convolver.buffer = impulse;
        this.reverb = ctx.createGain();
        this.reverb.gain.value = 0.22;
        this.reverb.connect(convolver).connect(this.master);
        this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const noise = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      }
      void this.context.resume().catch(() => {});
      this.sync();
    } catch {
      /* Browsers without audio still play the complete game. */
    }
  }
  sync() {
    if (!this.context || !this.master) return;
    const s = save.data.settings;
    const now = this.context.currentTime;
    this.master.gain.setTargetAtTime((s.volume / 100) * 0.8, now, 0.02);
    this.sfxBus!.gain.setTargetAtTime(s.sfx ? 1 : 0, now, 0.02);
    this.musicBus!.gain.setTargetAtTime(s.music && !this.paused ? 0.42 : 0, now, 0.08);
    const wantMusic = s.music && !this.paused && this.track !== "none";
    if (wantMusic && !this.timer) {
      this.nextTime = this.context.currentTime + 0.08;
      this.timer = window.setInterval(() => this.schedule(), 25);
    } else if (!wantMusic && this.timer) {
      window.clearInterval(this.timer);
      this.timer = undefined;
      this.stopMusicVoices();
    }
  }
  music(track: Track) {
    if (track === this.track) return;
    this.track = track;
    this.step = 0;
    if (this.timer) { window.clearInterval(this.timer); this.timer = undefined; }
    this.stopMusicVoices();
    this.sync();
  }
  pause(value: boolean) {
    this.paused = value;
    this.sync();
  }
  private stopMusicVoices() {
    const at = this.context?.currentTime ?? 0;
    for (const v of this.musicVoices) try { v.stop(at + 0.05); } catch { /* already stopped */ }
    this.musicVoices.clear();
  }
  // ——— building blocks ———
  private env(at: number, attack: number, decay: number, peak: number, bus: AudioNode, wet = 0) {
    const ctx = this.context!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(peak, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    gain.connect(bus);
    if (wet && this.reverb) {
      const send = ctx.createGain();
      send.gain.value = wet;
      gain.connect(send).connect(this.reverb);
    }
    return gain;
  }
  private osc(type: OscillatorType, freq: number, at: number, decay: number, peak: number, opts: { to?: number; attack?: number; bus?: AudioNode; wet?: number; filter?: number; music?: boolean } = {}) {
    const ctx = this.context!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, at + decay * 0.9);
    const out = this.env(at, opts.attack ?? 0.005, decay, peak, opts.bus ?? this.sfxBus!, opts.wet ?? 0);
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(opts.filter, at);
      f.frequency.exponentialRampToValueAtTime(Math.max(200, opts.filter * 0.25), at + decay);
      o.connect(f).connect(out);
    } else o.connect(out);
    o.start(at);
    o.stop(at + (opts.attack ?? 0.005) + decay + 0.05);
    if (opts.music) { this.musicVoices.add(o); o.onended = () => this.musicVoices.delete(o); }
  }
  private noise(at: number, decay: number, peak: number, type: BiquadFilterType, freq: number, opts: { to?: number; q?: number; bus?: AudioNode; music?: boolean; attack?: number } = {}) {
    const ctx = this.context!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer!;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = opts.q ?? 1;
    f.frequency.setValueAtTime(freq, at);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, at + decay);
    src.connect(f).connect(this.env(at, opts.attack ?? 0.003, decay, peak, opts.bus ?? this.sfxBus!));
    src.start(at, Math.random() * 0.5);
    src.stop(at + decay + 0.05);
    if (opts.music) { this.musicVoices.add(src); src.onended = () => this.musicVoices.delete(src); }
  }
  private bell(freq: number, at: number, decay = 0.5, peak = 0.18, wet = 0.5) {
    // Inharmonic partials read as glass or metal rather than an electronic beep.
    [[1, 1], [2.76, 0.45], [5.4, 0.2]].forEach(([ratio, level]) =>
      this.osc("sine", freq * ratio, at, decay / ratio ** 0.4, peak * level, { wet }));
  }
  /** Plays a sound; `step` raises the pitch for combo chains. */
  play(name: SoundName, step = 0) {
    if (!save.data.settings.sfx || !this.context || !this.sfxBus) return;
    const t = this.context.currentTime + 0.005;
    const up = 2 ** (step / 24);
    switch (name) {
      case "jump":
        this.osc("square", 240, t, 0.16, 0.12, { to: 560, filter: 2600 });
        this.noise(t, 0.08, 0.05, "highpass", 2500);
        break;
      case "double":
        this.osc("square", 360, t, 0.18, 0.11, { to: 980, filter: 3200 });
        this.osc("sine", 720, t + 0.04, 0.2, 0.08, { to: 1500, wet: 0.3 });
        this.noise(t, 0.12, 0.07, "bandpass", 1800, { to: 5000 });
        break;
      case "land":
        this.osc("sine", 110, t, 0.09, 0.22, { to: 55 });
        this.noise(t, 0.06, 0.08, "lowpass", 700);
        break;
      case "slam":
        this.osc("sine", 130, t, 0.22, 0.4, { to: 40 });
        this.noise(t, 0.18, 0.22, "lowpass", 900, { to: 200 });
        break;
      case "whoosh":
        this.noise(t, 0.26, 0.16, "bandpass", 500, { to: 3200, q: 1.4, attack: 0.04 });
        break;
      case "tea":
        this.bell(1320 * up, t, 0.45, 0.17);
        this.bell(1980 * up, t + 0.055, 0.35, 0.09);
        break;
      case "coin":
        this.osc("square", 988 * up, t, 0.06, 0.07, { filter: 6000 });
        this.osc("square", 1319 * up, t + 0.06, 0.22, 0.07, { filter: 6000, wet: 0.25 });
        this.osc("sine", 2638 * up, t + 0.06, 0.18, 0.05);
        break;
      case "golden":
        [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
          this.osc("triangle", f, t + i * 0.07, 0.5, 0.13, { wet: 0.6 });
          this.bell(f * 2, t + i * 0.07, 0.4, 0.05);
        });
        for (let i = 0; i < 10; i++) this.osc("sine", 2000 + Math.random() * 3000, t + 0.45 + i * 0.05, 0.25, 0.03, { wet: 0.8 });
        break;
      case "powerup":
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.osc("square", f, t + i * 0.045, 0.12, 0.07, { filter: 4000, wet: 0.2 }));
        this.osc("sine", 300, t, 0.4, 0.1, { to: 1200, wet: 0.4 });
        break;
      case "shield":
        this.noise(t, 0.2, 0.2, "highpass", 2000, { to: 6000 });
        this.osc("sine", 900, t, 0.3, 0.16, { to: 300, wet: 0.4 });
        break;
      case "combo":
        [784, 988, 1175, 1568].forEach((f, i) => this.osc("triangle", f, t + i * 0.04, 0.35, 0.1, { wet: 0.5 }));
        break;
      case "checkpoint":
        this.bell(880, t, 0.6, 0.15);
        this.bell(1318, t + 0.12, 0.7, 0.15);
        break;
      case "damage":
        this.osc("sawtooth", 320, t, 0.28, 0.16, { to: 70, filter: 1800 });
        this.noise(t, 0.14, 0.2, "bandpass", 900, { q: 0.8 });
        break;
      case "death":
        [392, 370, 349].forEach((f, i) => this.osc("triangle", f, t + i * 0.22, 0.2, 0.16, { filter: 2000 }));
        this.osc("triangle", 330, t + 0.66, 0.7, 0.16, { to: 240, filter: 1800 });
        break;
      case "complete":
      case "victory": {
        const notes = name === "victory" ? [523, 659, 784, 1047, 784, 1047, 1319] : [523, 659, 784, 1047];
        notes.forEach((f, i) => {
          const last = i === notes.length - 1;
          this.osc("square", f, t + i * 0.12, last ? 0.9 : 0.14, 0.08, { filter: 3500, wet: 0.35 });
          this.osc("triangle", f / 2, t + i * 0.12, last ? 0.9 : 0.14, 0.12);
        });
        const end = t + notes.length * 0.12;
        [659, 784, 1047].forEach((f) => this.osc("triangle", f, end - 0.12, 1, 0.07, { wet: 0.6 }));
        break;
      }
      case "select":
        this.osc("triangle", 660, t, 0.08, 0.14, { to: 990 });
        this.osc("sine", 1320, t + 0.03, 0.1, 0.05);
        break;
      case "hover":
        this.osc("sine", 1500, t, 0.035, 0.035);
        break;
      case "back":
        this.osc("triangle", 700, t, 0.1, 0.12, { to: 420 });
        break;
      case "pause":
        this.osc("triangle", 660, t, 0.1, 0.12);
        this.osc("triangle", 440, t + 0.09, 0.16, 0.12);
        break;
      case "buy":
        [988, 1319, 1568, 1976].forEach((f, i) => this.osc("square", f, t + i * 0.06, 0.18, 0.06, { filter: 6000, wet: 0.3 }));
        this.noise(t, 0.15, 0.06, "highpass", 5000);
        break;
      case "deny":
        this.osc("square", 200, t, 0.1, 0.1, { filter: 1200 });
        this.osc("square", 150, t + 0.11, 0.16, 0.1, { filter: 1200 });
        break;
      case "star":
        this.bell(1568 * up, t, 0.6, 0.14);
        this.osc("triangle", 784 * up, t, 0.3, 0.08, { wet: 0.4 });
        break;
      case "tick":
        this.osc("square", 2200, t, 0.02, 0.03);
        break;
    }
  }
  // ——— music sequencer (look-ahead scheduling keeps the beat steady) ———
  private schedule() {
    const ctx = this.context;
    if (!ctx) return;
    const night = this.track === "night";
    const game = this.track !== "menu";
    const eighth = 60 / (night ? 108 : game ? 118 : 92) / 2;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.note(this.step, this.nextTime, eighth, game, night);
      this.nextTime += eighth;
      this.step++;
    }
  }
  private note(step: number, at: number, eighth: number, game: boolean, night = false) {
    // Night stages: the same groove a fourth lower, with a starry bell every two bars.
    const shift = night ? -5 : 0;
    const bus = this.musicBus!;
    const beat = step % 8;
    const bar = Math.floor(step / 8) % 4;
    const section = Math.floor(step / 32) % (game ? 2 : 1);
    const drum = DRUMS[beat];
    if (drum === "D" || (!game && beat === 0)) this.osc("sine", 120, at, 0.22, game ? 0.55 : 0.4, { to: 52, bus, music: true });
    if (drum === "T" && (game || beat === 6)) {
      this.noise(at, 0.05, game ? 0.16 : 0.09, "bandpass", 3200, { q: 1.5, bus, music: true });
      this.osc("sine", 820, at, 0.03, 0.05, { bus, music: true });
    }
    if (game && beat % 2 === 1) this.noise(at, 0.025, 0.04, "highpass", 7000, { bus, music: true });
    if (beat === 0 || beat === 4) {
      const root = midi(BASS[bar] + shift + (beat === 4 && bar === 3 ? 7 : 0));
      this.osc("triangle", root, at, eighth * 3.5, 0.26, { bus, music: true, filter: 900 });
    }
    if (beat === 0) {
      // A soft drone fifth under each bar.
      this.osc("sine", midi(50 + shift), at, eighth * 7.5, 0.05, { attack: 0.3, bus, music: true, wet: 0.5 });
      this.osc("sine", midi(57 + shift), at, eighth * 7.5, 0.04, { attack: 0.3, bus, music: true, wet: 0.5 });
      if (night && bar % 2 === 0) [93, 98].forEach((n, i) => this.osc("sine", midi(n), at + i * eighth, eighth * 6, 0.03, { bus, music: true, wet: 0.8 }));
    }
    const phrase = section ? MELODY_B : MELODY_A;
    const n = phrase[step % 32];
    if (n > 0) {
      // A plucked, oud-like voice: a bright attack through a closing filter.
      this.osc("sawtooth", midi(n + shift), at, eighth * 1.6, game ? 0.09 : 0.07, { bus, music: true, filter: night ? 2400 : 3200, wet: night ? 0.5 : 0.35 });
      this.osc("triangle", midi(n + shift) * 2, at, eighth, 0.025, { bus, music: true });
    }
  }
}
export const audio = new AudioManager();
