import Phaser from "phaser";

/** Procedural effect textures: drawn once at boot at high resolution, displayed small. */
function canvas(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, height = size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = height;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  return c;
}

export function drawCoin(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  const rim = ctx.createLinearGradient(0, 0, s, s);
  rim.addColorStop(0, "#fff3b0");
  rim.addColorStop(0.45, "#f2b632");
  rim.addColorStop(1, "#a8670f");
  ctx.fillStyle = "#6e3f05";
  ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rim;
  ctx.beginPath(); ctx.arc(r, r, r - s * 0.05, 0, Math.PI * 2); ctx.fill();
  const face = ctx.createRadialGradient(r * 0.75, r * 0.65, 1, r, r, r * 0.8);
  face.addColorStop(0, "#fff7c6");
  face.addColorStop(0.5, "#ffd34d");
  face.addColorStop(1, "#e39a1c");
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.arc(r, r, r * 0.74, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(140,80,6,.55)";
  ctx.lineWidth = s * 0.035;
  ctx.beginPath(); ctx.arc(r, r, r * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#b8730e";
  ctx.font = `800 ${Math.round(s * 0.5)}px "Changa Variable", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("د", r + s * 0.02, r + s * 0.05);
  ctx.fillStyle = "#fff6c9";
  ctx.fillText("د", r - s * 0.01, r + s * 0.02);
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.beginPath(); ctx.ellipse(r * 0.62, r * 0.5, r * 0.18, r * 0.09, -0.7, 0, Math.PI * 2); ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const d = i % 2 ? r * 0.18 : r;
    ctx.lineTo(r + Math.cos(a) * d, r + Math.sin(a) * d);
  }
  ctx.fill();
}

function bubble(ctx: CanvasRenderingContext2D, s: number, color: string, glyph: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const r = s / 2;
  const g = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.1, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,.95)");
  g.addColorStop(0.55, color);
  g.addColorStop(1, "rgba(20,30,60,.9)");
  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(r, r, r - s * 0.06, 0, Math.PI * 2); ctx.fill();
  glyph(ctx, s);
  ctx.fillStyle = "rgba(255,255,255,.7)";
  ctx.beginPath(); ctx.ellipse(r * 0.6, r * 0.42, r * 0.22, r * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
}

export function drawMagnet(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  ctx.lineCap = "butt";
  ctx.lineWidth = s * 0.16;
  ctx.strokeStyle = "#e5484d";
  ctx.beginPath(); ctx.arc(r, r * 0.95, r * 0.36, Math.PI, 0, true); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r - r * 0.36, r * 0.95); ctx.lineTo(r - r * 0.36, r * 0.62);
  ctx.moveTo(r + r * 0.36, r * 0.95); ctx.lineTo(r + r * 0.36, r * 0.62);
  ctx.stroke();
  ctx.strokeStyle = "#eef2f7";
  ctx.beginPath();
  ctx.moveTo(r - r * 0.36, r * 0.62); ctx.lineTo(r - r * 0.36, r * 0.44);
  ctx.moveTo(r + r * 0.36, r * 0.62); ctx.lineTo(r + r * 0.36, r * 0.44);
  ctx.stroke();
}

export function drawShield(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2;
  ctx.fillStyle = "#eaf6ff";
  ctx.beginPath();
  ctx.moveTo(r, r * 0.42);
  ctx.quadraticCurveTo(r + r * 0.3, r * 0.52, r + r * 0.42, r * 0.5);
  ctx.quadraticCurveTo(r + r * 0.42, r * 1.25, r, r * 1.55);
  ctx.quadraticCurveTo(r - r * 0.42, r * 1.25, r - r * 0.42, r * 0.5);
  ctx.quadraticCurveTo(r - r * 0.3, r * 0.52, r, r * 0.42);
  ctx.fill();
  ctx.fillStyle = "#3d8bff";
  ctx.beginPath();
  ctx.moveTo(r, r * 0.6);
  ctx.quadraticCurveTo(r + r * 0.2, r * 0.66, r + r * 0.28, r * 0.64);
  ctx.quadraticCurveTo(r + r * 0.28, r * 1.18, r, r * 1.38);
  ctx.lineTo(r, r * 0.6);
  ctx.fill();
}

export function generateFxArt(scene: Phaser.Scene) {
  const add = (key: string, c: HTMLCanvasElement) => {
    if (!scene.textures.exists(key)) scene.textures.addCanvas(key, c);
  };
  add("fx-coin", canvas(96, drawCoin));
  add("fx-star", canvas(48, star));
  add("fx-glow", canvas(96, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,.9)");
    g.addColorStop(0.4, "rgba(255,255,255,.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }));
  add("fx-ring", canvas(128, (ctx, s) => {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = s * 0.06;
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - s * 0.05, 0, Math.PI * 2); ctx.stroke();
  }));
  add("fx-dot", canvas(16, (ctx, s) => {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
  }));
  add("fx-confetti", canvas(10, (ctx) => { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 10, 16); }, 16));
  add("fx-magnet", canvas(112, (ctx, s) => bubble(ctx, s, "rgba(255,120,120,.9)", drawMagnet)));
  add("fx-shield", canvas(112, (ctx, s) => bubble(ctx, s, "rgba(110,180,255,.9)", drawShield)));
  add("fx-bubble", canvas(192, (ctx, s) => {
    const r = s / 2;
    const g = ctx.createRadialGradient(r, r, r * 0.55, r, r, r);
    g.addColorStop(0, "rgba(120,200,255,0)");
    g.addColorStop(0.8, "rgba(120,200,255,.22)");
    g.addColorStop(0.96, "rgba(200,240,255,.85)");
    g.addColorStop(1, "rgba(200,240,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.beginPath(); ctx.ellipse(r * 0.6, r * 0.45, r * 0.2, r * 0.08, -0.7, 0, Math.PI * 2); ctx.fill();
  }));
  add("fx-rays", canvas(256, (ctx, s) => {
    const r = s / 2;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const g = ctx.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, "rgba(255,236,160,.85)");
      g.addColorStop(1, "rgba(255,236,160,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.arc(r, r, r, a - 0.09, a + 0.09);
      ctx.fill();
    }
  }));
}

/** A crisp data URL for HTML (HUD, shop, results). */
export function iconURL(kind: "coin" | "magnet" | "shield", size = 96) {
  return canvas(size, (ctx, s) => {
    if (kind === "coin") drawCoin(ctx, s);
    else bubble(ctx, s, kind === "magnet" ? "rgba(255,120,120,.9)" : "rgba(110,180,255,.9)", kind === "magnet" ? drawMagnet : drawShield);
  }).toDataURL();
}
