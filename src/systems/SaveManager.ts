import { emptyParty, readParty, type Party } from "../dance/DanceData";
import { SAVE_KEY } from "../config/Constants";
import { FINAL_LEVEL } from "../levels/levels";
export type Language = "ar" | "en";
export interface Settings {
  music: boolean;
  sfx: boolean;
  volume: number;
  language: Language;
  reducedMotion: boolean;
  steadyView: boolean;
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
  party: Party;
  tutorial: "new" | "skipped" | "completed";
  /** Spendable currency earned from coins and level bonuses. */
  coins: number;
  avatar: string;
  owned: string[];
  upgrades: Record<UpgradeId, number>;
  /** Best star rating (0–3) per level, kept apart from LevelRecord for older saves. */
  stars: Record<number, number>;
}
export type UpgradeId = "magnet" | "shield";
const defaults = (): SaveData => ({
  version: 2,
  revision: 0,
  unlocked: 1,
  best: 0,
  levels: {},
  party: emptyParty(),
  tutorial: "new",
  coins: 0,
  avatar: "classic",
  owned: ["classic"],
  upgrades: { magnet: 0, shield: 0 },
  stars: {},
  settings: { steadyView: true, music: true, sfx: true, volume: 55, language: "en", reducedMotion: typeof matchMedia !== "undefined" && matchMedia('(prefers-reduced-motion: reduce)').matches },
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
        FINAL_LEVEL,
        Math.max(1, safeNumber(raw.unlocked, 1)),
      );
      this.data.best = safeNumber(raw.best);
      for (let id = 1; id <= FINAL_LEVEL; id++) {
        const r = raw.levels?.[id];
        if (r)
          this.data.levels[id] = {
            score: safeNumber(r.score),
            tea: safeNumber(r.tea),
            golden: r.golden === true,
          };
      }
      this.data.party = readParty(raw.party);
      this.data.coins = safeNumber(raw.coins);
      this.data.owned = Array.isArray(raw.owned)
        ? [...new Set(["classic", ...raw.owned.filter((id: unknown) => typeof id === "string" && /^[a-z]{1,20}$/.test(id))])]
        : ["classic"];
      this.data.avatar = typeof raw.avatar === "string" && this.data.owned.includes(raw.avatar) ? raw.avatar : "classic";
      for (const id of ["magnet", "shield"] as UpgradeId[])
        this.data.upgrades[id] = Math.min(4, safeNumber(raw.upgrades?.[id]));
      for (let id = 1; id <= FINAL_LEVEL; id++) {
        const stars = safeNumber(raw.stars?.[id]);
        if (stars) this.data.stars[id] = Math.min(3, stars);
      }
      this.data.tutorial = raw.tutorial === "completed" || raw.tutorial === "skipped" ? raw.tutorial
        : this.data.unlocked > 1 || this.data.best > 0 ? "completed" : "new";
      const s = raw.settings ?? {};
      this.data.settings = {
        steadyView: s.steadyView !== false,
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
  tutorial(status: "skipped" | "completed") {
    if (this.data.tutorial !== "completed") this.data.tutorial = status;
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
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(FINAL_LEVEL, id + 1));
    this.data.best = Math.max(this.data.best, total, score);
    this.persist();
  }
  addCoins(amount: number) {
    if (amount <= 0) return;
    this.data.coins += Math.floor(amount);
    this.persist();
  }
  /** Spends coins atomically; returns false and changes nothing when short. */
  spend(amount: number) {
    if (amount < 0 || this.data.coins < amount) return false;
    this.data.coins -= amount;
    return true;
  }
  buyAvatar(id: string, price: number) {
    if (this.data.owned.includes(id) || !this.spend(price)) return false;
    this.data.owned.push(id);
    this.data.avatar = id;
    this.persist();
    return true;
  }
  equip(id: string) {
    if (!this.data.owned.includes(id)) return false;
    this.data.avatar = id;
    this.persist();
    return true;
  }
  upgrade(id: UpgradeId, price: number) {
    if (this.data.upgrades[id] >= 4 || !this.spend(price)) return false;
    this.data.upgrades[id]++;
    this.persist();
    return true;
  }
  rateLevel(id: number, stars: number) {
    this.data.stars[id] = Math.max(this.data.stars[id] ?? 0, Math.min(3, stars));
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
