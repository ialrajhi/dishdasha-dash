import { describe, it, expect, beforeEach, vi } from "vitest";
import { SAVE_KEY } from "../src/config/Constants";
import { SaveManager } from "../src/systems/SaveManager";
import { ScoreManager } from "../src/systems/ScoreManager";
import { AVATARS, UPGRADES, powerSeconds, rateStars, finishCoins } from "../src/systems/Economy";
import { LEVELS, createCourse } from "../src/levels/levels";
const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
  });
});
describe("coins, outfits and upgrades", () => {
  it("buys an outfit only with enough coins and equips it", () => {
    const s = new SaveManager();
    const navy = AVATARS.find((a) => a.id === "navy")!;
    s.addCoins(navy.price - 1);
    expect(s.buyAvatar("navy", navy.price)).toBe(false);
    expect(s.data.coins).toBe(navy.price - 1);
    s.addCoins(1);
    expect(s.buyAvatar("navy", navy.price)).toBe(true);
    expect(s.data.coins).toBe(0);
    expect(s.data.avatar).toBe("navy");
    expect(s.buyAvatar("navy", navy.price)).toBe(false);
    const loaded = new SaveManager();
    expect(loaded.data.owned).toEqual(["classic", "navy"]);
    expect(loaded.data.avatar).toBe("navy");
  });
  it("never equips an outfit that is not owned, including from a tampered save", () => {
    memory.set(SAVE_KEY, JSON.stringify({ version: 2, coins: -50, avatar: "golden", owned: ["<script>", 7], upgrades: { magnet: 99 }, stars: { 1: 9 } }));
    const s = new SaveManager();
    expect(s.data.coins).toBe(0);
    expect(s.data.avatar).toBe("classic");
    expect(s.data.owned).toEqual(["classic"]);
    expect(s.data.upgrades.magnet).toBe(4);
    expect(s.data.stars[1]).toBe(3);
    expect(s.equip("golden")).toBe(false);
  });
  it("caps upgrades at four levels and lengthens power-ups", () => {
    const s = new SaveManager();
    s.addCoins(10000);
    const magnet = UPGRADES.find((u) => u.id === "magnet")!;
    for (const price of magnet.prices) expect(s.upgrade("magnet", price)).toBe(true);
    expect(s.upgrade("magnet", 1)).toBe(false);
    expect(s.data.upgrades.magnet).toBe(4);
    expect(powerSeconds("magnet", 4)).toBeGreaterThan(powerSeconds("magnet", 0));
  });
  it("keeps the best star rating and resets the wallet with progress", () => {
    const s = new SaveManager();
    s.rateLevel(2, 3);
    s.rateLevel(2, 1);
    s.addCoins(500);
    expect(new SaveManager().data.stars[2]).toBe(3);
    s.reset();
    expect(s.data.coins).toBe(0);
    expect(s.data.owned).toEqual(["classic"]);
  });
});
describe("scoring v2", () => {
  it("counts coins once and applies combo multipliers to tea", () => {
    const s = new ScoreManager();
    expect(s.collectCoin("c1")).toBe(true);
    expect(s.collectCoin("c1")).toBe(false);
    s.collect("t1", false, 3);
    expect(s.coins).toBe(1);
    expect(s.score).toBe(10 + 300);
  });
  it("rates stars for finishing, the golden dallah and 90% of the tea", () => {
    expect(rateStars(false, 0, 50)).toBe(1);
    expect(rateStars(true, 0, 50)).toBe(2);
    expect(rateStars(true, 45, 50)).toBe(3);
    expect(finishCoins(3)).toBeGreaterThan(finishCoins(1));
  });
});
describe("coin trails and power-ups", () => {
  for (const l of LEVELS)
    it(`level ${l.id} places coins clear of hazards and inside the course`, () => {
      const c = createCourse(l);
      expect(c.coins.length).toBeGreaterThan(50);
      expect(c.powerups.length).toBeGreaterThanOrEqual(2);
      const ids = [...c.coins.map((x) => x.id), ...c.powerups.map((x) => x.id)];
      expect(new Set(ids).size).toBe(ids.length);
      for (const coin of c.coins) {
        expect(coin.x).toBeLessThan(c.length);
        expect(c.hazards.some((h) => Math.abs(h.x - coin.x) < 60)).toBe(false);
      }
    });
});
