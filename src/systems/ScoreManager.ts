import { POINTS } from "../config/Constants";
import { COIN_POINTS, finishCoins } from "./Economy";
export interface LevelResult {
  id: number;
  score: number;
  tea: number;
  totalTea: number;
  golden: boolean;
  deaths: number;
  coins: number;
  coinBonus: number;
  stars: number;
  hearts: number;
  lives: number;
  perfect: boolean;
  bonus: number;
}
export class ScoreManager {
  score = 0;
  tea = 0;
  golden = false;
  deaths = 0;
  coins = 0;
  bestCombo = 0;
  collected = new Set<string>();
  resolved = new Set<string>();
  collect(id: string, golden = false, multiplier = 1) {
    if (this.collected.has(id)) return false;
    this.collected.add(id);
    this.score += golden ? POINTS.golden : POINTS.tea * multiplier;
    if (golden) this.golden = true;
    else this.tea++;
    return true;
  }
  collectCoin(id: string, multiplier = 1) {
    if (this.collected.has(id)) return false;
    this.collected.add(id);
    this.coins++;
    this.score += COIN_POINTS * multiplier;
    return true;
  }
  avoid(id: string) {
    if (this.resolved.has(id)) return;
    this.resolved.add(id);
    this.score += POINTS.obstacle;
  }
  finish(
    id: number,
    totalTea: number,
    hearts: number,
    lives: number,
    stars = 1,
  ): LevelResult {
    const perfect = this.tea === totalTea;
    const bonus =
      POINTS.complete +
      hearts * POINTS.heart +
      lives * POINTS.life +
      (perfect ? POINTS.perfect : 0);
    this.score += bonus;
    return {
      id,
      score: this.score,
      tea: this.tea,
      totalTea,
      golden: this.golden,
      deaths: this.deaths,
      coins: this.coins,
      coinBonus: finishCoins(stars),
      stars,
      hearts,
      lives,
      perfect,
      bonus,
    };
  }
}
export const campaign = {
  results: new Map<number, LevelResult>(),
  deaths: 0,
  reset() {
    this.results.clear();
    this.deaths = 0;
  },
  total() {
    return [...this.results.values()].reduce((a, b) => a + b.score, 0);
  },
};
