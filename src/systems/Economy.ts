import type { UpgradeId } from "./SaveManager";

export type RGB = [number, number, number];
export interface AvatarDef {
  id: string;
  ar: string;
  en: string;
  price: number;
  /** Replacement for the white dishdasha; null keeps the original artwork. */
  body: RGB | null;
  /** Replacement for the white ghutra; null keeps it white. */
  head: RGB | null;
  trail?: number;
}
export const AVATARS: AvatarDef[] = [
  { id: "classic", ar: "بو خالد", en: "Bu Khalid", price: 0, body: null, head: null },
  { id: "navy", ar: "كحلي الليل", en: "Navy Night", price: 300, body: [58, 82, 150], head: null },
  { id: "sand", ar: "رملي", en: "Desert Sand", price: 500, body: [222, 192, 142], head: [206, 62, 58] },
  { id: "winter", ar: "شتوي", en: "Winter Charcoal", price: 800, body: [84, 86, 96], head: [206, 62, 58] },
  { id: "emerald", ar: "زمردي", en: "Emerald", price: 1200, body: [44, 150, 112], head: null },
  { id: "golden", ar: "الأسطورة الذهبية", en: "Golden Legend", price: 2500, body: [246, 196, 72], head: [255, 230, 150], trail: 0xffd75e },
];
export const avatarById = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

export interface UpgradeDef {
  id: UpgradeId;
  ar: string;
  en: string;
  arInfo: string;
  enInfo: string;
  base: number;
  step: number;
  prices: number[];
}
export const UPGRADES: UpgradeDef[] = [
  { id: "magnet", ar: "المغناطيس", en: "Coin Magnet", arInfo: "يسحب الكوينز والچاي صوبك", enInfo: "Pulls coins and tea toward you", base: 6, step: 2, prices: [150, 350, 700, 1400] },
  { id: "shield", ar: "الدرع", en: "Bubble Shield", arInfo: "يصد ضربة وحدة", enInfo: "Blocks one hit", base: 8, step: 3, prices: [150, 350, 700, 1400] },
];
/** Power-up duration in seconds at an upgrade level (0–4). */
export const powerSeconds = (id: UpgradeId, level: number) => {
  const u = UPGRADES.find((x) => x.id === id)!;
  return u.base + u.step * level;
};
export const COIN_POINTS = 10;
/** Coins awarded for finishing a level, on top of collected coins. */
export const finishCoins = (stars: number) => 20 + stars * 10;
export function rateStars(golden: boolean, tea: number, totalTea: number) {
  return 1 + (golden ? 1 : 0) + (totalTea > 0 && tea / totalTea >= 0.9 ? 1 : 0);
}
