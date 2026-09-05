import { save } from '../systems/SaveManager';
export const TRACKS = [
  { name: 'Chai Chai Groove', ar: 'چاي چاي', bpm: 104, root: 60, melody: [0,4,7,9,7,4,2,4,0,0,7,4,2,4,7,2], type: 'triangle' },
  { name: 'Dallah Disco', ar: 'ديسكو الدلة', bpm: 116, root: 57, melody: [0,7,10,12,10,7,5,3,0,3,7,10,12,7,3,5], type: 'sawtooth' },
  { name: 'Fereej Funk', ar: 'إيقاع الفريج', bpm: 98, root: 55, melody: [0,-1,3,5,0,7,5,3,0,3,5,10,7,5,3,-1], type: 'triangle' },
  { name: 'Souq Shuffle', ar: 'خطوة المباركية', bpm: 108, root: 62, melody: [0,1,4,5,7,8,7,5,4,1,0,4,5,7,4,1], type: 'sine' },
  { name: 'Moonlight Majlis', ar: 'ديوانية القمر', bpm: 84, root: 60, melody: [0,4,7,11,9,7,4,2,0,2,5,9,7,5,2,4], type: 'sine' },
  { name: 'Robot Rumba', ar: 'رقصة الروبوت', bpm: 112, root: 64, melody: [0,0,7,12,7,3,5,10,0,7,12,15,12,10,7,5], type: 'square' },
] as const;
/** Original six arrangements, synthesized locally. Audio-clock scheduling avoids timer jitter. */
export class DanceMusic {
  context?: AudioContext;
  private master?: GainNode;
  private timer?: number;
  private next = 0;
  private step = 0;
  private generation = 0;
  private voices = new Set<OscillatorNode>();
  track = 0;
  async start(track: number) {
    this.stop(); const generation = this.generation; this.track = track;
    if (!save.data.settings.music || !save.data.settings.volume) return;
    try {
      this.context ??= new AudioContext();
      this.master ??= this.context.createGain();
      this.master.disconnect(); this.master.connect(this.context.destination);
      this.master.gain.value = save.data.settings.volume / 100 * .18;
      await this.context.resume();
      if (generation !== this.generation) return;
      this.next = this.context.currentTime + .04; this.step = 0;
      this.timer = window.setInterval(() => this.schedule(), 25); this.schedule();
    } catch { /* The scene and dances remain usable without sound. */ }
  }
  private note(freq: number, at: number, length: number, type: OscillatorType, gain: number, slide = false) {
    const c = this.context!; const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    if (slide) o.frequency.exponentialRampToValueAtTime(45, at + length);
    g.gain.setValueAtTime(.001, at); g.gain.exponentialRampToValueAtTime(Math.max(.002, gain), at + .009); g.gain.exponentialRampToValueAtTime(.001, at + length);
    // A low-pass filter rounds off the comedy synth's sharp edges.
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = type === 'square' || type === 'sawtooth' ? 1500 : 5000;
    o.connect(f); f.connect(g); g.connect(this.master!); this.voices.add(o);
    o.onended = () => { o.disconnect(); f.disconnect(); g.disconnect(); this.voices.delete(o); };
    o.start(at); o.stop(at + length + .02);
  }
  private schedule() {
    if (!this.context) return;
    const t = TRACKS[this.track]; const stepTime = 60 / t.bpm / 2;
    while (this.next < this.context.currentTime + .12) {
      const i = this.step % 32, bar = Math.floor(i / 8), chord = [0, 5, 7, 0][bar];
      const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
      const n = t.melody[i % 16];
      if (n !== -1) this.note(hz(t.root + n), this.next, stepTime * .65, t.type, .19);
      if (i % 2 === 0) this.note(hz(t.root - 24 + chord + (i % 4 ? 7 : 0)), this.next, stepTime * 1.3, 'triangle', .4);
      if (i % 4 === 0) this.note(145, this.next, .16, 'sine', .55, true);
      if (i % 4 === 2) { this.note(180, this.next, .075, 'triangle', .2); this.note(370, this.next + .012, .055, 'triangle', .13); }
      if (i % 2 === 1) this.note(2100 + this.track * 120, this.next, .028, 'square', .045);
      if (i % 8 === 0) for (const interval of [0, 4, 7]) this.note(hz(t.root + chord + interval), this.next, stepTime * 2, 'sine', .065);
      this.step++; this.next += stepTime;
    }
  }
  stop() { this.generation++; if (this.timer) clearInterval(this.timer); this.timer = undefined; for (const v of this.voices) { try { v.stop(); } catch {} } }
  destroy() { this.stop(); void this.context?.close(); }
}
