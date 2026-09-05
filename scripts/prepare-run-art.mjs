import sharp from 'sharp';

// Technical chroma extraction only; retain the generated source paintings unchanged.
const cycles = {
  hero: { height: 130, frames: [[69,123,461,485],[640,123,426,500],[1120,139,538,472],[1739,130,388,497]] },
  kid: { height: 156, frames: [[116,122,425,471],[662,122,339,492],[1143,124,460,469],[1720,127,321,495]] },
};
for (const [actor, cycle] of Object.entries(cycles)) {
  const { data, info } = await sharp(`art/source/${actor}-run-sheet.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (g > 100 && g > r * 1.5 && g > b * 1.5) data[i + 3] = 0;
    else if (g > Math.max(r, b) + 20) data[i + 1] = Math.max(r, b);
  }
  const clean = await sharp(data, { raw: info }).png().toBuffer();
  const scale = cycle.height / Math.max(...cycle.frames.map(f => f[3]));
  const layers = [];
  for (const [index, [left, top, width, height]] of cycle.frames.entries()) {
    const w = Math.round(width * scale), h = Math.round(height * scale);
    const input = await sharp(clean).extract({ left, top, width, height }).resize(w, h).png().toBuffer();
    layers.push({ input, left: index * 192 + Math.round((192 - w) / 2), top: 158 - h });
  }
  await sharp({ create: { width: 768, height: 160, channels: 4, background: '#00000000' } })
    .composite(layers).webp({ lossless: true, effort: 6 }).toFile(`public/assets/arcade/${actor}-run-sheet.webp`);
}
