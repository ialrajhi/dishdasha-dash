import Phaser from "phaser";
import { LEVELS, type LevelConfig, type ObstacleKind } from "../levels/levels";
type C = CanvasRenderingContext2D;
export const ASSET_OVERRIDES: Record<string, string> = {};
const r = (c: C, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
function poly(c: C, points: number[][], color: string) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}
function ellipse(
  c: C,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  for (let iy = -ry; iy <= ry; iy++) {
    const w = Math.sqrt(1 - (iy * iy) / (ry * ry)) * rx;
    r(c, x - w, y + iy, w * 2, 1, color);
  }
}
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function canvas(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (c: C) => void,
) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const c = tex.context;
  c.imageSmoothingEnabled = false;
  draw(c);
  tex.refresh();
}
function palm(c: C, x: number, y: number, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  poly(
    c,
    [
      [0, 0],
      [6, 0],
      [11, -65],
      [5, -67],
    ],
    "#735b3b",
  );
  for (let i = 0; i < 7; i++) r(c, 3 + i * 0.6, -i * 9, 6, 2, "#b29356");
  for (let dir = -1; dir <= 1; dir += 2) {
    poly(
      c,
      [
        [8, -64],
        [dir * 25, -84],
        [dir * 49, -74],
        [dir * 31, -73],
        [8, -60],
      ],
      "#38775d",
    );
    poly(
      c,
      [
        [8, -64],
        [dir * 24, -66],
        [dir * 43, -49],
        [dir * 27, -53],
        [8, -60],
      ],
      "#285d49",
    );
    poly(
      c,
      [
        [8, -65],
        [dir * 8, -91],
        [dir * 22, -92],
        [dir * 15, -85],
        [8, -60],
      ],
      "#509367",
    );
  }
  r(c, 4, -62, 8, 7, "#a68948");
  c.restore();
}
function windows(
  c: C,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lit: string,
) {
  for (let yy = y + 12; yy < y + h - 10; yy += 17)
    for (let xx = x + 8; xx < x + w - 6; xx += 12) {
      r(c, xx, yy, 5, 8, color);
      r(c, xx, yy, 2, 2, lit);
    }
}
function tower(
  c: C,
  x: number,
  y: number,
  s: number,
  color: string,
  light: string,
) {
  poly(
    c,
    [
      [x - 4 * s, y],
      [x - 1 * s, y - 151 * s],
      [x + 1 * s, y - 151 * s],
      [x + 5 * s, y],
    ],
    color,
  );
  ellipse(c, x, y - 103 * s, 14 * s, 18 * s, color);
  ellipse(c, x - 2 * s, y - 107 * s, 10 * s, 12 * s, light);
  r(c, x - 13 * s, y - 108 * s, 26 * s, 3 * s, color);
  ellipse(c, x, y - 51 * s, 10 * s, 12 * s, color);
  ellipse(c, x - 2 * s, y - 54 * s, 7 * s, 8 * s, light);
  r(c, x - 9 * s, y - 52 * s, 18 * s, 3 * s, color);
  r(c, x, y - 173 * s, 1 * s, 24 * s, color);
}
function clouds(c: C, seed: number) {
  const random = rng(seed);
  for (let i = 0; i < 11; i++) {
    const x = random() * 1280,
      y = 30 + random() * 92;
    r(c, x, y, 35 + random() * 30, 5, "#e4e4bf55");
    r(c, x + 12, y - 4, 24, 4, "#e4e4bf55");
  }
}
function skyline(c: C, level: LevelConfig) {
  const random = rng(101);
  const color = level.id > 3 ? "#484664" : "#659d95",
    light = level.id > 3 ? "#646085" : "#8ab5a6";
  for (let x = 0; x < 1280; x += 35) {
    const h = 15 + random() * 61;
    r(c, x, 254 - h, 27, h, color);
    windows(c, x, 254 - h, 27, h, light, color);
  }
  tower(c, 454, 255, 1.05, color, light);
  tower(c, 487, 255, 0.73, color, light);
  r(c, 423, 110, 3, 145, color);
  poly(
    c,
    [
      [564, 255],
      [564, 129],
      [583, 93],
      [591, 239],
      [591, 255],
    ],
    color,
  );
  r(c, 570, 142, 4, 84, light);
  tower(c, 1000, 255, 0.75, color, light);
}
function house(
  c: C,
  x: number,
  base: number,
  w: number,
  h: number,
  seed: number,
) {
  const p = ["#c4ac7b", "#d5bd8e", "#bda171", "#deca9e"];
  const col = p[seed % 4];
  r(c, x, base - h, w, h, col);
  r(c, x - 3, base - h, w + 6, 6, "#e9d6a8");
  r(c, x + 4, base - h + 8, w - 8, 2, "#a88d62");
  r(c, x + w - 8, base - h + 6, 8, h - 6, "#a48d62");
  for (let i = 0; i < 3; i++) {
    const xx = x + 12 + i * 25;
    if (xx > x + w - 15) break;
    r(c, xx, base - h + 24, 13, 21, "#567d77");
    r(c, xx + 2, base - h + 26, 9, 16, "#80aba0");
    r(c, xx + 6, base - h + 26, 2, 16, "#d1bb8d");
    r(c, xx - 2, base - h + 46, 17, 3, "#ead2a2");
  }
  r(c, x + 18, base - 35, 21, 35, "#705b43");
  r(c, x + 21, base - 32, 15, 31, "#947452");
  r(c, x + 32, base - 18, 2, 3, "#f4da96");
  r(c, x + w - 26, base - h - 16, 18, 16, "#ece1b8");
  r(c, x + w - 28, base - h - 18, 22, 3, "#998b6f");
  poly(
    c,
    [
      [x + 15, base - h - 10],
      [x + 33, base - h - 10],
      [x + 29, base - h - 4],
      [x + 21, base - h - 4],
    ],
    "#727d71",
  );
  r(c, x + 23, base - h - 4, 2, 5, "#727d71");
  for (let i = 0; i < 10; i++) {
    r(
      c,
      x + ((i * 23 + seed * 7) % w),
      base - ((i * 17) % h),
      5,
      2,
      "#ad946332",
    );
  }
}
function sign(c: C, x: number, y: number, text: string, w = 70) {
  r(c, x - 2, y - 2, w + 4, 21, "#254e48");
  r(c, x, y, w, 17, "#467c64");
  c.fillStyle = "#fff0bd";
  c.font = "bold 10px Arial";
  c.textAlign = "center";
  c.fillText(text, x + w / 2, y + 12);
}
function car(c: C, x: number, y: number, color = "#82afad") {
  r(c, x, y - 13, 52, 13, color);
  r(c, x + 10, y - 26, 29, 15, color);
  r(c, x + 14, y - 23, 9, 10, "#406d78");
  r(c, x + 26, y - 23, 10, 10, "#406d78");
  r(c, x - 2, y - 6, 6, 4, "#f6d496");
  r(c, x + 48, y - 7, 5, 4, "#b8684f");
  ellipse(c, x + 10, y, 5, 5, "#384544");
  ellipse(c, x + 42, y, 5, 5, "#384544");
  r(c, x + 8, y - 2, 4, 4, "#c9bca0");
  r(c, x + 40, y - 2, 4, 4, "#c9bca0");
}
function stall(c: C, x: number, base: number, w: number, seed: number) {
  house(c, x, base, w, 94, seed);
  r(c, x + 7, base - 53, w - 14, 53, "#64543c");
  r(c, x + 1, base - 57, w - 2, 12, "#aa5343");
  for (let i = 0; i < w - 2; i += 16)
    r(c, x + 1 + i, base - 57, 8, 12, "#edca89");
  r(c, x + 8, base - 23, w - 16, 23, "#886038");
  for (let i = 0; i < 12; i++) {
    ellipse(
      c,
      x + 14 + ((i * 13) % (w - 20)),
      base - 28 - (i % 3) * 3,
      4,
      4,
      ["#c2633e", "#d2a13e", "#788c47"][i % 3],
    );
  }
  sign(c, x + 9, base - 82, ["بهارات", "تمور", "السوق"][seed % 3], w - 18);
}
function tent(c: C, x: number, y: number, w: number, color: string) {
  poly(
    c,
    [
      [x, y],
      [x + w * 0.48, y - 70],
      [x + w, y],
    ],
    color,
  );
  poly(
    c,
    [
      [x + w * 0.48, y - 70],
      [x + w * 0.72, y],
      [x + w, y],
    ],
    "#8d5d56",
  );
  poly(
    c,
    [
      [x + w * 0.48, y - 56],
      [x + w * 0.33, y],
      [x + w * 0.62, y],
    ],
    "#3e3d4b",
  );
  r(c, x - 3, y, w + 6, 4, "#704f4b");
  r(c, x + w * 0.48, y - 78, 2, 14, "#cbbb9a");
}
function npc(c: C, x: number, y: number, color = "#f0e7d1", seed = 0) {
  r(c, x + 3, y - 22, 9, 10, "#c99668");
  r(c, x + 1, y - 27, 13, 6, "#fff0d6");
  r(c, x, y - 24, 15, 2, "#313c3d");
  poly(
    c,
    [
      [x + 3, y - 13],
      [x + 11, y - 13],
      [x + 15, y + 8],
      [x - 1, y + 8],
    ],
    color,
  );
  r(c, x, y + 8, 5, 3, "#484238");
  r(c, x + 10, y + 8, 5, 3, "#484238");
  r(c, x + 10, y - 19, 2, 2, "#333f3e");
  if (seed % 2) r(c, x + 14, y - 12, 4, 3, "#c99668");
}
function midground(c: C, level: LevelConfig) {
  const { theme } = level;
  if (theme === "neighborhood") {
    for (let i = 0; i < 10; i++) {
      const x = i * 135 + 10;
      house(c, x, 285, 82 + (i % 3) * 14, 69 + (i % 3) * 16, i);
      if (i % 3 === 0) palm(c, x + 107, 286, 0.8);
      if (i % 4 === 1) {
        sign(c, x + 6, 229, "بقالة", 64);
        r(c, x + 6, 249, 64, 6, "#76594a");
        for (let j = 0; j < 8; j++) r(c, x + 6 + j * 8, 249, 4, 6, "#eee0bc");
      }
    }
    r(c, 620, 263, 42, 3, "#a17a55");
    r(c, 623, 263, 3, 22, "#735d4d");
    r(c, 656, 263, 3, 22, "#735d4d");
    npc(c, 657, 271);
  }
  if (theme === "coop") {
    for (let i = 0; i < 4; i++) {
      const x = i * 340;
      house(c, x + 5, 286, 180, 102, 2);
      sign(c, x + 20, 202, "الجمعية التعاونية", 149);
      for (let j = 0; j < 4; j++) {
        r(c, x + 18 + j * 39, 236, 32, 49, "#3a7077");
        r(c, x + 21 + j * 39, 239, 27, 38, "#6fa6ac");
      }
      car(c, x + 210, 280, i % 2 ? "#cf9470" : "#ced5bd");
      palm(c, x + 302, 284, 0.7);
      npc(c, x + 194, 275);
      r(c, x + 230, 288, 80, 2, "#e0d1a4");
    }
  }
  if (theme === "souq") {
    for (let i = 0; i < 12; i++) {
      stall(c, i * 110, 286, 96, i);
      if (i % 2 === 0) {
        r(c, i * 110 + 99, 206, 2, 50, "#775245");
        r(c, i * 110 + 94, 236, 11, 14, "#f4bd66");
        r(c, i * 110 + 96, 239, 7, 8, "#ffe3a0");
      }
    }
    for (let i = 0; i < 18; i++) {
      const x = i * 73;
      r(c, x, 168 + Math.sin(i * 0.5) * 10, 61, 2, "#a16c4d");
      r(c, x + 30, 170 + Math.sin(i * 0.5) * 10, 2, 12, "#76594b");
      r(c, x + 26, 181 + Math.sin(i * 0.5) * 10, 10, 13, "#f5c776");
    }
  }
  if (theme === "desert") {
    poly(
      c,
      [
        [0, 285],
        [90, 244],
        [220, 273],
        [430, 223],
        [610, 274],
        [810, 241],
        [1080, 275],
        [1280, 230],
        [1280, 310],
        [0, 310],
      ],
      "#c38e76",
    );
    poly(
      c,
      [
        [0, 290],
        [250, 253],
        [350, 279],
        [640, 254],
        [870, 278],
        [1110, 248],
        [1280, 280],
        [1280, 310],
        [0, 310],
      ],
      "#d3a47f",
    );
    for (let i = 0; i < 4; i++) {
      tent(c, 60 + i * 340, 287, 130, i % 2 ? "#b59777" : "#bd8069");
      car(c, 220 + i * 340, 282, "#c2b7a2");
      r(c, 290 + i * 340, 282, 20, 4, "#6d5050");
      poly(
        c,
        [
          [290 + i * 340, 282],
          [300 + i * 340, 254],
          [308 + i * 340, 282],
        ],
        "#e7914c",
      );
      poly(
        c,
        [
          [296 + i * 340, 282],
          [302 + i * 340, 264],
          [306 + i * 340, 282],
        ],
        "#ffda83",
      );
    }
  }
  if (theme === "wedding") {
    for (let i = 0; i < 4; i++) {
      const x = i * 330;
      r(c, x, 170, 280, 116, "#55516a");
      r(c, x + 3, 162, 274, 8, "#d8bb8b");
      for (let j = 0; j < 5; j++) {
        const xx = x + 16 + j * 53;
        r(c, xx, 190, 9, 96, "#d7b993");
        r(c, xx + 2, 192, 3, 90, "#f4d9ab");
        poly(
          c,
          [
            [xx + 9, 221],
            [xx + 21, 190],
            [xx + 38, 190],
            [xx + 44, 221],
          ],
          "#c08d8e",
        );
        r(c, xx + 9, 221, 36, 65, "#c08d8e");
        r(c, xx + 18, 210, 18, 76, "#6b5067");
      }
      sign(c, x + 91, 177, "ألف مبروك", 99);
      for (let j = 0; j < 5; j++) npc(c, x + 26 + j * 54, 276, "#eee5d6", j);
      r(c, x + 285, 263, 35, 4, "#e0bd91");
      r(c, x + 292, 267, 3, 17, "#c49d72");
    }
    for (let i = 0; i < 32; i++) {
      const y = 126 + Math.sin(i / 5) * 20;
      r(c, i * 40, y, 41, 1, "#867b76");
      r(c, i * 40 + 18, y, 3, 5, "#ffde98");
    }
  }
}
function character(c: C, frame: number, state: string) {
  const bob = state === "run" ? frame % 2 : 0;
  const dead = state === "dead";
  if (dead) {
    c.translate(5, 39);
    c.rotate(-Math.PI / 2);
    c.translate(-16, -38);
  }
  const skin = state === "hurt" ? "#f2a28a" : "#d49a64";
  const left =
      state === "run" ? [-3, 0, 4, 0][frame % 4] : state === "jump" ? -3 : 0,
    right = state === "run" ? -left : state === "fall" ? 2 : 0;
  r(c, 9 + left, 40 - bob, 5, 5, skin);
  r(c, 20 + right, 40 - bob, 5, 5, skin);
  r(c, 7 + left, 44 - bob, 8, 3, "#504439");
  r(c, 19 + right, 44 - bob, 8, 3, "#504439");
  poly(
    c,
    [
      [10, 22 - bob],
      [23, 22 - bob],
      [27, 41 - bob],
      [7, 41 - bob],
    ],
    "#c7d5cb",
  );
  poly(
    c,
    [
      [10, 22 - bob],
      [20, 22 - bob],
      [23, 40 - bob],
      [8, 40 - bob],
    ],
    "#fffae7",
  );
  r(c, 17, 25 - bob, 2, 13, "#dce4d4");
  r(c, 19, 25 - bob, 1, 5, "#a9bfb7");
  r(c, 11, 9 - bob, 13, 15, skin);
  r(c, 22, 15 - bob, 5, 5, skin);
  r(c, 21, 13 - bob, 2, 3, "#263e3d");
  r(c, 20, 20 - bob, 5, 2, "#754a36");
  r(c, 12, 20 - bob, 9, 3, "#83573e");
  r(c, 15, 21 - bob, 6, 2, skin);
  r(c, 7, 6 - bob, 16, 5, "#fff9e7");
  r(c, 10, 4 - bob, 12, 3, "#fff9e7");
  r(c, 6, 10 - bob, 19, 3, "#283a3a");
  r(c, 6, 13 - bob, 6, 17, "#eff1df");
  r(c, 5 - (frame % 2) * 2, 24 - bob, 6, 7, "#d7e4d4");
  if (state === "run" || state === "jump")
    poly(
      c,
      [
        [7, 18],
        [1, 23 - (frame % 2) * 3],
        [0, 28],
        [9, 27],
      ],
      "#f7f2da",
    );
  const arm =
    state === "victory"
      ? -11
      : state === "jump"
        ? -7
        : state === "run"
          ? left
          : -1;
  r(c, 22, 26 + arm, 5, 9, "#eff1df");
  r(c, 24, 33 + arm, 5, 4, skin);
  r(c, 8, 26 - arm / 2, 4, 8, "#d8e2d7");
  r(c, 7, 33 - arm / 2, 4, 4, skin);
  if (state === "hurt") {
    r(c, 19, 12, 5, 2, "#754a36");
  }
  if (state === "respawn") {
    r(c, 14, 0, 2, 3, "#ffe494");
    r(c, 0, 14, 3, 2, "#ffe494");
  }
}
function dallah(c: C, golden: boolean, enemy = false) {
  const dark = golden ? "#a06c27" : "#6c5b43",
    base = golden ? "#f5c653" : "#cba76d",
    hi = golden ? "#fff1a1" : "#f0d59e";
  poly(
    c,
    [
      [11, 13],
      [24, 13],
      [28, 31],
      [25, 35],
      [8, 35],
      [6, 29],
    ],
    dark,
  );
  poly(
    c,
    [
      [12, 14],
      [23, 14],
      [26, 29],
      [23, 32],
      [10, 32],
      [9, 28],
    ],
    base,
  );
  r(c, 12, 18, 4, 11, hi);
  r(c, 10, 11, 16, 3, hi);
  poly(
    c,
    [
      [10, 11],
      [18, 4],
      [26, 11],
    ],
    base,
  );
  r(c, 17, 2, 3, 4, hi);
  poly(
    c,
    [
      [9, 20],
      [1, 14],
      [3, 10],
      [7, 14],
      [13, 17],
    ],
    base,
  );
  poly(
    c,
    [
      [26, 16],
      [32, 15],
      [35, 18],
      [35, 29],
      [29, 31],
      [28, 28],
      [32, 26],
      [32, 20],
      [26, 20],
    ],
    dark,
  );
  r(c, 10, 34, 5, 4, dark);
  r(c, 23, 34, 5, 4, dark);
  if (enemy) {
    r(c, 16, 21, 3, 3, "#384244");
    r(c, 23, 21, 3, 3, "#384244");
    r(c, 14, 18, 5, 2, "#6d4637");
    r(c, 23, 17, 5, 2, "#6d4637");
    r(c, 20, 27, 4, 2, "#6d4637");
  }
}
function obstacle(c: C, kind: ObstacleKind) {
  const dark = "#475555",
    wood = "#b9804a",
    light = "#e1b679";
  switch (kind) {
    case "box":
    case "crate":
    case "gift":
      r(c, 7, 13, 29, 27, kind === "gift" ? "#d67b83" : wood);
      r(c, 9, 15, 25, 3, light);
      r(c, 7, 38, 29, 3, "#865f3d");
      r(c, 20, 13, 5, 27, kind === "gift" ? "#f8cf82" : "#d3ab73");
      if (kind === "crate") {
        r(c, 9, 25, 25, 3, "#865f3d");
        r(c, 10, 17, 3, 23, "#865f3d");
      }
      if (kind === "gift") {
        r(c, 5, 12, 33, 5, "#e7a0a2");
        r(c, 14, 6, 8, 7, "#f8cf82");
        r(c, 24, 6, 8, 7, "#f8cf82");
      }
      break;
    case "cone":
      poly(
        c,
        [
          [13, 35],
          [22, 9],
          [30, 35],
        ],
        "#e88b4d",
      );
      r(c, 17, 22, 10, 5, "#fff0cd");
      r(c, 9, 35, 26, 5, dark);
      break;
    case "dallah":
      c.translate(4, 2);
      dallah(c, false, true);
      break;
    case "ball":
    case "melon":
    case "tire":
      ellipse(
        c,
        22,
        28,
        12,
        12,
        kind === "ball" ? "#efe5bd" : kind === "melon" ? "#61935e" : dark,
      );
      if (kind === "ball") {
        r(c, 17, 24, 8, 8, dark);
        r(c, 24, 17, 5, 5, dark);
        r(c, 12, 30, 5, 6, dark);
      } else if (kind === "melon") {
        r(c, 15, 19, 3, 18, "#335e4b");
        r(c, 24, 17, 3, 22, "#335e4b");
        r(c, 22, 14, 3, 4, "#87683e");
      } else {
        ellipse(c, 22, 28, 6, 6, "#a8a598");
        ellipse(c, 22, 28, 3, 3, dark);
      }
      break;
    case "cat":
      r(c, 10, 25, 20, 10, "#c99262");
      r(c, 25, 17, 13, 14, "#ddb180");
      poly(
        c,
        [
          [25, 18],
          [26, 12],
          [31, 19],
        ],
        "#c99262",
      );
      poly(
        c,
        [
          [32, 18],
          [38, 12],
          [38, 22],
        ],
        "#c99262",
      );
      r(c, 33, 21, 2, 2, dark);
      r(c, 12, 35, 4, 5, "#9d704e");
      r(c, 26, 34, 4, 6, "#9d704e");
      r(c, 6, 18, 4, 12, "#c99262");
      r(c, 7, 27, 5, 4, "#c99262");
      break;
    case "cart":
      r(c, 5, 12, 29, 3, dark);
      r(c, 7, 16, 28, 13, "#829d97");
      for (let i = 0; i < 5; i++) r(c, 9 + i * 5, 16, 2, 11, "#d6d4b0");
      r(c, 8, 30, 26, 3, dark);
      r(c, 34, 7, 3, 28, dark);
      r(c, 34, 6, 8, 3, "#eab363");
      ellipse(c, 12, 38, 4, 4, dark);
      ellipse(c, 32, 38, 4, 4, dark);
      break;
    case "kid":
    case "waiter":
      c.save();
      c.translate(9, 27);
      npc(c, 0, 0, kind === "kid" ? "#df9863" : "#fff2d7");
      if (kind === "waiter") {
        r(c, 15, -10, 18, 2, light);
        r(c, 22, -15, 5, 5, "#d8cfad");
      }
      c.restore();
      break;
    case "bag":
      r(c, 9, 18, 27, 22, "#ead4a0");
      r(c, 14, 11, 3, 9, "#c4a475");
      r(c, 28, 11, 3, 9, "#c4a475");
      r(c, 14, 10, 17, 3, "#c4a475");
      r(c, 16, 25, 13, 8, "#6b9767");
      break;
    case "carpet":
      r(c, 5, 25, 33, 15, "#b46661");
      r(c, 8, 28, 27, 3, "#e5b276");
      r(c, 8, 34, 27, 3, "#e5b276");
      r(c, 3, 28, 4, 8, "#e5b276");
      ellipse(c, 37, 32, 4, 8, "#ecd095");
      ellipse(c, 37, 32, 2, 4, "#98684f");
      break;
    case "pigeon":
      ellipse(c, 22, 29, 11, 9, "#91a4a5");
      ellipse(c, 31, 23, 6, 7, "#698d93");
      r(c, 33, 21, 2, 2, dark);
      r(c, 36, 25, 5, 2, "#e0ae66");
      r(c, 17, 37, 2, 4, "#c99b67");
      r(c, 27, 37, 2, 4, "#c99b67");
      poly(
        c,
        [
          [14, 27],
          [6, 20],
          [8, 33],
          [19, 34],
        ],
        "#667e89",
      );
      break;
    case "chair":
      r(c, 10, 12, 4, 27, light);
      r(c, 30, 12, 4, 27, light);
      r(c, 12, 12, 20, 14, "#a77368");
      r(c, 9, 28, 28, 5, "#cb9580");
      r(c, 7, 36, 4, 5, dark);
      r(c, 33, 36, 4, 5, dark);
      break;
    case "cooler":
      r(c, 6, 19, 32, 22, "#678f9c");
      r(c, 4, 16, 36, 6, "#e4d7b7");
      r(c, 8, 23, 3, 14, "#8db4b4");
      r(c, 34, 24, 4, 9, "#e4d7b7");
      break;
    case "goat":
      r(c, 9, 22, 22, 13, "#e2d0ad");
      r(c, 28, 16, 12, 17, "#e2d0ad");
      r(c, 31, 12, 3, 8, dark);
      r(c, 36, 14, 3, 5, dark);
      r(c, 34, 23, 2, 2, dark);
      for (let i = 0; i < 3; i++) r(c, 12 + i * 8, 34, 3, 7, dark);
      r(c, 6, 18, 4, 9, "#e2d0ad");
      break;
    case "tray":
      r(c, 4, 31, 36, 4, "#c9b793");
      r(c, 11, 17, 9, 14, "#ecdfbc");
      r(c, 25, 21, 7, 10, "#e4c88f");
      r(c, 14, 20, 3, 7, "#9e6a3e");
      break;
    case "flowers":
      r(c, 13, 27, 20, 14, "#dfc58f");
      for (let i = 0; i < 5; i++) {
        r(c, 16 + i * 3, 14, 2, 19, "#618b61");
        ellipse(
          c,
          12 + ((i * 7) % 25),
          13 + (i % 2) * 7,
          6,
          6,
          i % 2 ? "#f1c5c0" : "#e79c9c",
        );
      }
      break;
    case "rope":
      r(c, 5, 28, 3, 13, wood);
      r(c, 35, 28, 3, 13, wood);
      poly(
        c,
        [
          [7, 29],
          [23, 35],
          [37, 29],
          [37, 32],
          [23, 38],
          [7, 32],
        ],
        "#e8c995",
      );
      break;
    case "dune":
      poly(
        c,
        [
          [2, 41],
          [11, 29],
          [26, 22],
          [42, 41],
        ],
        "#d4aa74",
      );
      poly(
        c,
        [
          [11, 29],
          [26, 22],
          [34, 30],
        ],
        "#edc792",
      );
      break;
  }
}
export function generateArt(scene: Phaser.Scene) {
  for (const state of [
    "idle",
    "run",
    "jump",
    "fall",
    "hurt",
    "dead",
    "victory",
    "respawn",
  ])
    for (let f = 0; f < 4; f++)
      canvas(scene, `player-${state}-${f}`, 36, 48, (c) =>
        character(c, f, state),
      );
  const kinds = new Set(LEVELS.flatMap((l) => l.obstacles));
  for (const k of kinds) canvas(scene, k, 44, 44, (c) => obstacle(c, k));
  canvas(scene, "tea", 18, 24, (c) => {
    r(c, 6, 1, 2, 3, "#fff0c9aa");
    r(c, 10, 5, 2, 3, "#fff0c9aa");
    r(c, 3, 9, 12, 13, "#f9e4b0");
    r(c, 5, 11, 8, 9, "#b77039");
    r(c, 5, 11, 8, 2, "#dba04d");
    r(c, 6, 13, 2, 6, "#edc681");
    r(c, 1, 22, 16, 2, "#ede2b4");
  });
  canvas(scene, "golden", 40, 40, (c) => {
    c.translate(2, 0);
    dallah(c, true);
  });
  canvas(scene, "pixel", 3, 3, (c) => r(c, 0, 0, 3, 3, "#ffffff"));
  for (const l of LEVELS) {
    canvas(scene, `sky-${l.id}`, 640, 360, (c) => {
      for (let y = 0; y < 360; y += 3) {
        const t = y / 360;
        const a = Phaser.Display.Color.HexStringToColor(l.sky[t < 0.5 ? 0 : 1]),
          b = Phaser.Display.Color.HexStringToColor(l.sky[t < 0.5 ? 1 : 2]);
        const v = Phaser.Display.Color.Interpolate.ColorWithColor(
          a,
          b,
          100,
          (t % 0.5) * 200,
        );
        r(c, 0, y, 640, 3, Phaser.Display.Color.RGBToString(v.r, v.g, v.b));
      }
      ellipse(
        c,
        510,
        123,
        l.id > 3 ? 18 : 35,
        l.id > 3 ? 18 : 35,
        l.id > 3 ? "#f0d6bd" : "#f8dc9c",
      );
      if (l.id > 3) {
        const random = rng(80);
        for (let i = 0; i < 55; i++)
          r(c, random() * 640, random() * 155, 1, 1, "#f7dbb9");
      }
      clouds(c, l.id);
    });
    canvas(scene, `far-${l.id}`, 1280, 360, (c) => skyline(c, l));
    canvas(scene, `mid-${l.id}`, 1280, 360, (c) => midground(c, l));
    canvas(scene, `ground-${l.id}`, 640, 60, (c) => {
      r(c, 0, 0, 640, 60, l.ground);
      r(c, 0, 0, 640, 4, l.id === 5 ? "#efca92" : "#ecdaa8");
      r(c, 0, 4, 640, 5, l.id === 5 ? "#793f50" : "#a18963");
      r(c, 0, 14, 640, 1, "#8d795a55");
      const random = rng(l.id);
      for (let i = 0; i < 200; i++)
        r(
          c,
          random() * 640,
          12 + random() * 48,
          2 + random() * 8,
          2,
          "#715e4930",
        );
      for (let x = 0; x < 640; x += 32) {
        r(c, x, 0, 1, 4, "#a58c67");
        r(c, x + 8, 32, 14, 1, "#f1d9a033");
      }
      if (l.id === 5) {
        r(c, 0, 13, 640, 3, "#e2b978");
        r(c, 0, 48, 640, 3, "#e2b978");
      }
    });
    canvas(scene, `finish-${l.id}`, 120, 120, (c) => {
      r(c, 5, 0, 9, 120, "#e9d0a0");
      r(c, 106, 0, 9, 120, "#e9d0a0");
      r(c, 0, 0, 120, 10, "#3f7466");
      sign(c, 15, 15, l.end, 90);
      r(c, 10, 112, 100, 8, "#bd665b");
      for (let x = 18; x < 105; x += 12)
        r(
          c,
          x,
          50 + Math.sin(x) * 5,
          5,
          8,
          ["#f5cf7c", "#d68c7c", "#8dc1a2"][x % 3],
        );
    });
  }
}
