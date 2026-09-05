import { SAVE_KEY } from "../config/Constants";
export type Language = "ar" | "en";
export interface Settings {
  music: boolean;
  sfx: boolean;
  volume: number;
  language: Language;
  reducedMotion: boolean;
}
export interface LevelRecord {
  score: number;
  tea: number;
  golden: boolean;
}
export interface SaveData {
  version: 2;
  revision: number;
  unlocked: number;
  best: number;
  levels: Record<number, LevelRecord>;
  settings: Settings;
}
const defaults = (): SaveData => ({
  version: 2,
  revision: 0,
  unlocked: 1,
  best: 0,
  levels: {},
  settings: { music: true, sfx: true, volume: 55, language: "en", reducedMotion: typeof matchMedia !== "undefined" && matchMedia('(prefers-reduced-motion: reduce)').matches },
});
const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
export class SaveManager {
  data: SaveData = defaults();
  storageAvailable = true;
  private writer?: (value: string) => Promise<void>;
  private pending: Promise<void> = Promise.resolve();
  constructor() {
    this.load();
  }
  load() {
    try {
      this.hydrate(localStorage.getItem(SAVE_KEY));
    } catch {
      this.storageAvailable = false;
    }
  }
  hydrate(serialized: string | null): boolean {
    try {
      const raw = JSON.parse(serialized || "null");
      if (!raw || ![1, 2].includes(raw.version)) return false;
      this.data = defaults();
      this.data.revision = safeNumber(raw.revision);
      this.data.unlocked = Math.min(
        5,
        Math.max(1, safeNumber(raw.unlocked, 1)),
      );
      this.data.best = safeNumber(raw.best);
      for (let id = 1; id <= 5; id++) {
        const r = raw.levels?.[id];
        if (r)
          this.data.levels[id] = {
            score: safeNumber(r.score),
            tea: safeNumber(r.tea),
            golden: r.golden === true,
          };
      }
      const s = raw.settings ?? {};
      this.data.settings = {
        music: s.music !== false,
        sfx: s.sfx !== false,
        volume: Math.min(100, safeNumber(s.volume, 55)),
        language: raw.version === 2 && s.language === "ar" ? "ar" : "en",
        reducedMotion: typeof s.reducedMotion === "boolean" ? s.reducedMotion : this.data.settings.reducedMotion,
      };
      return true;
    } catch {
      return false;
    }
  }
  setWriter(writer: (value: string) => Promise<void>) { this.writer = writer; }
  flush() { return this.pending; }
  private status(available: boolean) {
    this.storageAvailable = available;
    if (typeof window !== "undefined") window.dispatchEvent(new Event("save-status"));
  }
  persist() {
    this.data.revision++;
    const value = JSON.stringify(this.data);
    let localAvailable = true;
    try {
      localStorage.setItem(SAVE_KEY, value);
    } catch {
      localAvailable = false;
    }
    if (!this.writer) { this.status(localAvailable); return; }
    // Serialize writes so an older asynchronous save cannot replace newer progress.
    this.pending = this.pending.then(() => this.writer!(value)).then(
      () => this.status(true), () => this.status(false),
    );
  }
  settings(changes: Partial<Settings>) {
    Object.assign(this.data.settings, changes);
    this.persist();
  }
  golden(id: number) {
    const r = this.data.levels[id] ?? { score: 0, tea: 0, golden: false };
    this.data.levels[id] = { ...r, golden: true };
    this.persist();
  }
  complete(
    id: number,
    score: number,
    tea: number,
    golden: boolean,
    total: number,
  ) {
    const old = this.data.levels[id] ?? { score: 0, tea: 0, golden: false };
    this.data.levels[id] = {
      score: Math.max(old.score, score),
      tea: Math.max(old.tea, tea),
      golden: old.golden || golden,
    };
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(5, id + 1));
    this.data.best = Math.max(this.data.best, total, score);
    this.persist();
  }
  highScore(score: number) {
    this.data.best = Math.max(this.data.best, score);
    this.persist();
  }
  reset() {
    const settings = { ...this.data.settings };
    const revision = this.data.revision;
    this.data = defaults();
    this.data.revision = revision;
    this.data.settings = settings;
    this.persist();
  }
}
export const save = new SaveManager();
