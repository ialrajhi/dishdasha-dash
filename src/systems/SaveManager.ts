import { SAVE_KEY } from "../config/Constants";
export type Language = "ar" | "en";
export interface Settings {
  music: boolean;
  sfx: boolean;
  volume: number;
  language: Language;
}
export interface LevelRecord {
  score: number;
  tea: number;
  golden: boolean;
}
export interface SaveData {
  version: 1;
  unlocked: number;
  best: number;
  levels: Record<number, LevelRecord>;
  settings: Settings;
}
const defaults = (): SaveData => ({
  version: 1,
  unlocked: 1,
  best: 0,
  levels: {},
  settings: { music: true, sfx: true, volume: 55, language: "ar" },
});
const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
export class SaveManager {
  data: SaveData = defaults();
  storageAvailable = true;
  constructor() {
    this.load();
  }
  load() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!raw || raw.version !== 1) return;
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
        language: s.language === "en" ? "en" : "ar",
      };
    } catch {
      this.data = defaults();
    }
  }
  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.storageAvailable = true;
    } catch {
      this.storageAvailable = false;
    }
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
    this.data = defaults();
    this.data.settings = settings;
    this.persist();
  }
}
export const save = new SaveManager();
