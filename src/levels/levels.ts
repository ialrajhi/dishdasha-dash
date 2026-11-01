export type Theme = "neighborhood" | "coop" | "souq" | "desert" | "wedding";
export type ObstacleKind =
  | "box"
  | "cat"
  | "ball"
  | "cart"
  | "cone"
  | "dallah"
  | "bag"
  | "melon"
  | "kid"
  | "crate"
  | "pigeon"
  | "carpet"
  | "chair"
  | "cooler"
  | "tire"
  | "goat"
  | "tray"
  | "gift"
  | "waiter"
  | "flowers"
  | "rope"
  | "dune"
  | "awning";
export interface LevelConfig {
  id: number;
  ar: string;
  en: string;
  theme: Theme;
  speed: number;
  duration: number;
  sky: string[];
  ground: string;
  accent: string;
  end: string;
  finish: string;
  intro: string;
  obstacles: ObstacleKind[];
  difficulty: string;
  /** Which painted street (1–5) the stage is set on. */
  art: number;
  /** Chapter 2 revisits the streets after dark with a moonlit grade, stars and lantern light. */
  night?: boolean;
}
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    art: 1,
    ar: "الفريج",
    en: "The Neighborhood",
    theme: "neighborhood",
    speed: 145,
    duration: 68,
    sky: ["#2e9499", "#88c9bd", "#f6d69b"],
    ground: "#c9ac78",
    accent: "#79cec2",
    end: "ديوانية",
    finish: "وصلت الديوانية!",
    intro: "يلا شد حيلك!",
    obstacles: ["box", "cone", "cat", "ball", "cart", "dallah"],
    difficulty: "Easy",
  },
  {
    id: 2,
    art: 2,
    ar: "الجمعية",
    en: "The Co-op",
    theme: "coop",
    speed: 157,
    duration: 70,
    sky: ["#388fae", "#97ccce", "#f4dbab"],
    ground: "#b3a892",
    accent: "#94c5e5",
    end: "الكاشير",
    finish: "خلصنا الجمعية!",
    intro: "عربانة جايتك!",
    obstacles: ["cart", "bag", "melon", "kid", "box", "dallah"],
    difficulty: "Easy +",
  },
  {
    id: 3,
    art: 3,
    ar: "المباركية",
    en: "Al-Mubarakiya",
    theme: "souq",
    speed: 165,
    duration: 72,
    sky: ["#a96859", "#e7a466", "#ffe1a0"],
    ground: "#b78054",
    accent: "#efb45f",
    end: "سوق المباركية",
    finish: "عدينا المباركية!",
    intro: "حياكم في المباركية!",
    obstacles: ["crate", "pigeon", "carpet", "cart", "dallah", "melon"],
    difficulty: "Medium",
  },
  {
    id: 4,
    art: 4,
    ar: "البر",
    en: "The Desert",
    theme: "desert",
    speed: 174,
    duration: 72,
    sky: ["#343b68", "#ac737c", "#f3be80"],
    ground: "#d5a271",
    accent: "#c7a9d8",
    end: "المخيم",
    finish: "وصلنا المخيم!",
    intro: "الجو عجيب!",
    obstacles: [
      "chair",
      "cooler",
      "ball",
      "rope",
      "tire",
      "dune",
      "goat",
      "dallah",
    ],
    difficulty: "Medium +",
  },
  {
    id: 5,
    art: 5,
    ar: "العرس",
    en: "The Wedding",
    theme: "wedding",
    speed: 181,
    duration: 75,
    sky: ["#222e51", "#555576", "#b77e83"],
    ground: "#9e4b50",
    accent: "#eea3ba",
    end: "ألف مبروك",
    finish: "مبروك يا بطل!",
    intro: "معزومين على العرس!",
    obstacles: ["kid", "tray", "chair", "gift", "waiter", "dallah", "flowers"],
    difficulty: "Party time",
  },
  {
    id: 6,
    art: 1,
    night: true,
    ar: "الفريج بالليل",
    en: "Neighborhood Nights",
    theme: "neighborhood",
    speed: 186,
    duration: 70,
    sky: ["#0e1733", "#1d2b55", "#3b3f6e"],
    ground: "#6f6a78",
    accent: "#8fb4ff",
    end: "قهوة الفريج",
    finish: "سهرة حلوة بالفريج!",
    intro: "الفريج نايم… إلا إنت!",
    obstacles: ["cat", "box", "kid", "cone", "dallah", "ball", "cart"],
    difficulty: "Night",
  },
  {
    id: 7,
    art: 2,
    night: true,
    ar: "جمعية آخر الليل",
    en: "Late-Night Co-op",
    theme: "coop",
    speed: 190,
    duration: 70,
    sky: ["#101a36", "#22325e", "#45507e"],
    ground: "#6b6f80",
    accent: "#9fd0ff",
    end: "قبل لا تسكر",
    finish: "لحقنا الجمعية قبل لا تسكر!",
    intro: "بسرعة! الجمعية بتسكر!",
    obstacles: ["cart", "melon", "bag", "kid", "dallah", "box", "cart"],
    difficulty: "Night +",
  },
  {
    id: 8,
    art: 3,
    night: true,
    ar: "المباركية بالفنر",
    en: "Souq by Lantern Light",
    theme: "souq",
    speed: 195,
    duration: 70,
    sky: ["#1b1430", "#3a2346", "#6b3f4e"],
    ground: "#6e4c3e",
    accent: "#ffc27a",
    end: "مطعم الحاج",
    finish: "عشا بالمباركية!",
    intro: "الفنر شاعل… يلا!",
    obstacles: ["crate", "pigeon", "cart", "melon", "dallah", "carpet", "kid"],
    difficulty: "Hard",
  },
  {
    id: 9,
    art: 4,
    night: true,
    ar: "ليلة بالبر",
    en: "Desert Starlight",
    theme: "desert",
    speed: 200,
    duration: 70,
    sky: ["#070b1f", "#18204a", "#38305e"],
    ground: "#8a6e66",
    accent: "#c9b6ff",
    end: "شبة النار",
    finish: "وصلنا الشبة!",
    intro: "النجوم تدلّك الطريج",
    obstacles: ["goat", "tire", "cooler", "chair", "dallah", "rope", "ball", "goat"],
    difficulty: "Hard +",
  },
  {
    id: 10,
    art: 5,
    night: true,
    ar: "الزفة",
    en: "The Zaffa Parade",
    theme: "wedding",
    speed: 206,
    duration: 72,
    sky: ["#150f2a", "#33214a", "#6a3a5c"],
    ground: "#7a3a46",
    accent: "#ffb3d1",
    end: "الكوشة",
    finish: "ألف ألف مبروك!",
    intro: "الزفة بدت! لا تتأخر!",
    obstacles: ["waiter", "tray", "kid", "gift", "dallah", "chair", "flowers", "waiter"],
    difficulty: "Finale",
  },
];
export const FINAL_LEVEL = LEVELS.length;
export interface HazardSpec {
  id: string;
  x: number;
  kind: ObstacleKind;
  moving: boolean;
}
export interface TeaSpec {
  id: string;
  x: number;
  y: number;
  golden?: boolean;
}
export interface CoinSpec {
  id: string;
  x: number;
  y: number;
}
export interface PowerSpec {
  id: string;
  x: number;
  y: number;
  kind: "magnet" | "shield";
}
export interface Course {
  length: number;
  hazards: HazardSpec[];
  tea: TeaSpec[];
  coins: CoinSpec[];
  powerups: PowerSpec[];
  gaps: { x: number; width: number }[];
  checkpoint: number;
}
export function createCourse(level: LevelConfig): Course {
  const length = Math.round(level.speed * level.duration);
  const hazards: HazardSpec[] = [];
  const tea: TeaSpec[] = [];
  const spacing = level.id === 1 ? 470 : level.id === 2 ? 430 : 410;
  for (let x = 850, i = 0; x < length - 550; x += spacing + (i % 3) * 42, i++) {
    // Teach one overhead obstacle after two jumps, then mix the two actions.
    const overhead = i % (level.id < 3 ? 4 : 3) === 2;
    const kind: ObstacleKind = overhead ? "awning" : level.obstacles[i % level.obstacles.length];
    const moving = [
      "dallah",
      "cart",
      "kid",
      "tire",
      "melon",
      "chair",
      "waiter",
    ].includes(kind);
    hazards.push({ id: `h${i}`, x, kind, moving });
    const motionSpeed =
      kind === "dallah" ? 25 + level.id * 5 : kind === "kid" ? 38 : 19;
    const teaCenter =
      x -
      (moving
        ? Math.min(115, (530 * motionSpeed) / (level.speed + motionSpeed))
        : 0);
    for (let j = 0; j < 3; j++)
      tea.push({
        id: `t${i}-${j}`,
        x: teaCenter - 45 + j * 45,
        y: overhead ? 289 : j === 1 ? 213 : 242,
      });
  }
  // A safe opening trail teaches collection before the first obstacle.
  for (let i = 0; i < 3; i++)
    tea.unshift({ id: `intro${i}`, x: 420 + i * 55, y: 275 });
  const goldenX = hazards[Math.floor(hazards.length * 0.7)].x + 220;
  tea.push({ id: "golden", x: goldenX, y: 198, golden: true });
  const gaps =
    level.id >= 3
      ? [
          { x: hazards[5].x + 220, width: 64 },
          { x: hazards[12].x + 220, width: 70 },
          // Night stages add a third pit late in the run.
          ...(level.night ? [{ x: hazards[19].x + 220, width: 72 }] : []),
        ]
      : [];
  // Checkpoint is a safe section before a cluster, never inside a pit or hazard.
  const checkpoint = hazards.find((h) => h.x > length / 2)!.x - 200;
  // Coins fill the quiet stretch between two obstacles; power-ups replace a few trails.
  const coins: CoinSpec[] = [];
  const powerups: PowerSpec[] = [];
  for (let i = 0; i < hazards.length - 1; i++) {
    const mid = (hazards[i].x + hazards[i + 1].x) / 2 - 10;
    if (i % 7 === 4) {
      powerups.push({ id: `p${i}`, x: mid, y: 250, kind: powerups.length % 2 ? "shield" : "magnet" });
      continue;
    }
    const gap = gaps.find((g) => Math.abs(g.x + g.width / 2 - mid) < 140);
    const center = gap ? gap.x + gap.width / 2 : mid;
    const pattern = gap ? 1 : i % 3;
    for (let j = 0; j < 5; j++) {
      const t = j / 4;
      const y = pattern === 0 ? 282 : pattern === 1 ? 282 - Math.sin(t * Math.PI) * 58 : 232;
      coins.push({ id: `c${i}-${j}`, x: Math.round(center - 52 + j * 26), y: Math.round(y) });
    }
  }
  return { length, hazards, tea, coins, powerups, gaps, checkpoint };
}
