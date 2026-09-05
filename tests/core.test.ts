import { describe, it, expect, beforeEach, vi } from "vitest";
import { LEVELS, createCourse } from "../src/levels/levels";
import { ScoreManager } from "../src/systems/ScoreManager";
import { SAVE_KEY } from "../src/config/Constants";
import { SaveManager } from "../src/systems/SaveManager";
const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
  });
});
describe("persistent progress", () => {
  it("sanitizes invalid saved data and keeps the game usable", () => {
    memory.set(SAVE_KEY, "broken");
    expect(new SaveManager().data.unlocked).toBe(1);
    memory.set(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        unlocked: 900,
        best: -10,
        settings: { volume: 400, language: "bad" },
        levels: { 1: { score: "bad", tea: -4, golden: true } },
      }),
    );
    const s = new SaveManager();
    expect(s.data.unlocked).toBe(5);
    expect(s.data.best).toBe(0);
    expect(s.data.settings.volume).toBe(100);
    expect(s.data.settings.language).toBe("en");
    expect(s.data.levels[1]).toEqual({ score: 0, tea: 0, golden: true });
  });
  it("persists unlocks and best records without overwriting better scores", () => {
    const s = new SaveManager();
    s.complete(1, 8000, 40, true, 8000);
    s.complete(1, 2000, 10, false, 2000);
    const loaded = new SaveManager();
    expect(loaded.data.unlocked).toBe(2);
    expect(loaded.data.levels[1]).toEqual({
      score: 8000,
      tea: 40,
      golden: true,
    });
    expect(loaded.data.best).toBe(8000);
  });
  it("saves golden dallahs immediately and preserves preferences when reset", () => {
    const s = new SaveManager();
    s.settings({ language: "en", volume: 23, music: false });
    s.golden(3);
    expect(new SaveManager().data.levels[3].golden).toBe(true);
    s.reset();
    expect(new SaveManager().data.levels).toEqual({});
    expect(s.data.settings).toMatchObject({
      language: "en",
      volume: 23,
      music: false,
    });
  });
  it("survives unavailable local storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error();
      },
      setItem: () => {
        throw Error();
      },
    });
    const s = new SaveManager();
    expect(() => s.complete(1, 1000, 3, false, 1000)).not.toThrow();
    expect(s.data.unlocked).toBe(2);
    expect(s.storageAvailable).toBe(false);
  });
});
describe("scoring", () => {
  it("prevents farming tea and obstacle points after a death", () => {
    const s = new ScoreManager();
    s.collect("tea");
    s.collect("tea");
    s.collect("gold", true);
    s.avoid("box");
    s.avoid("box");
    expect(s.score).toBe(5125);
    expect(s.tea).toBe(1);
  });
  it("computes completion bonuses exactly", () => {
    const s = new ScoreManager();
    s.collect("tea");
    const r = s.finish(1, 1, 3, 3);
    expect(r.perfect).toBe(true);
    expect(r.bonus).toBe(5250);
    expect(r.score).toBe(5350);
  });
});
describe("complete and fair courses", () => {
  for (const l of LEVELS)
    it(`level ${l.id} has a 60–90 second course and safe obstacle spacing`, () => {
      const c = createCourse(l);
      expect((c.length - 210) / l.speed).toBeGreaterThan(60);
      expect(c.length / l.speed).toBeLessThanOrEqual(90);
      expect(c.tea.filter((t) => t.golden)).toHaveLength(1);
      expect(c.hazards.length).toBeGreaterThan(15);
      expect(c.checkpoint / c.length).toBeGreaterThan(0.45);
      expect(c.checkpoint / c.length).toBeLessThan(0.58);
      const ids = c.tea.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (let i = 1; i < c.hazards.length; i++)
        expect(c.hazards[i].x - c.hazards[i - 1].x).toBeGreaterThan(400);
      for (const gap of c.gaps) {
        expect(gap.width).toBeLessThan(80);
        expect(c.hazards.some((h) => Math.abs(h.x - gap.x) < 100)).toBe(false);
      }
    });
});

describe('release save guarantees', () => {
  it('migrates earlier progress to English menus without losing records', () => {
    memory.set(SAVE_KEY, JSON.stringify({ version:1, unlocked:4, best:12000, levels:{3:{score:9000,tea:50,golden:true}}, settings:{language:'ar',music:false,volume:30} }));
    const s = new SaveManager();
    expect(s.data.version).toBe(2);
    expect(s.data.settings.language).toBe('en');
    expect(s.data.unlocked).toBe(4);
    expect(s.data.levels[3].golden).toBe(true);
    s.settings({language:'ar'});
    expect(new SaveManager().data.settings.language).toBe('ar');
  });
  it('serializes asynchronous native writes including a later reset', async () => {
    const s = new SaveManager();
    const writes: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>(resolve => release = resolve);
    s.setWriter(async value => { if (!writes.length) await gate; writes.push(value); });
    s.complete(1, 8000, 40, true, 8000);
    s.reset();
    release();
    await s.flush();
    expect(writes).toHaveLength(2);
    expect(JSON.parse(writes[0]).unlocked).toBe(2);
    expect(JSON.parse(writes[1]).unlocked).toBe(1);
    expect(JSON.parse(writes[1]).revision).toBeGreaterThan(JSON.parse(writes[0]).revision);
  });
  it('reports failed native writes and successfully retries the latest state', async () => {
    const s = new SaveManager();
    let fail = true;
    let stored = '';
    s.setWriter(async value => { if (fail) throw Error('disk full'); stored = value; });
    s.complete(2, 12000, 60, true, 20000);
    await s.flush();
    expect(s.storageAvailable).toBe(false);
    fail = false;
    s.persist();
    await s.flush();
    expect(s.storageAvailable).toBe(true);
    expect(JSON.parse(stored).levels[2].golden).toBe(true);
  });
});
