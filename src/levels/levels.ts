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
  | "dune";
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
}
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
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
];
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
export interface Course {
  length: number;
  hazards: HazardSpec[];
  tea: TeaSpec[];
  gaps: { x: number; width: number }[];
  checkpoint: number;
}
export function createCourse(level: LevelConfig): Course {
  const length = Math.round(level.speed * level.duration);
  const hazards: HazardSpec[] = [];
  const tea: TeaSpec[] = [];
  const spacing = level.id === 1 ? 470 : level.id === 2 ? 430 : 410;
  for (let x = 850, i = 0; x < length - 550; x += spacing + (i % 3) * 42, i++) {
    const kind = level.obstacles[i % level.obstacles.length];
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
        y: j === 1 ? 213 : 242,
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
        ]
      : [];
  // Checkpoint is a safe section before a cluster, never inside a pit or hazard.
  const checkpoint = hazards.find((h) => h.x > length / 2)!.x - 200;
  return { length, hazards, tea, gaps, checkpoint };
}
