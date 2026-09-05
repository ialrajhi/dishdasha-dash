import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';

await mkdir('public/assets/arcade', { recursive: true });
for (const name of ['neighborhood', 'coop', 'souq', 'desert', 'wedding', 'hero-sheet', 'props-sheet', 'extra-sheet']) {
  await sharp(`art/source/${name}.png`)
    .webp(name.endsWith('sheet') ? { lossless: true, effort: 6 } : { quality: 93, effort: 6 })
    .toFile(`public/assets/arcade/${name}.webp`);
}
await sharp('art/source/app-icon.png').resize(998, 998).extend({ top: 13, bottom: 13, left: 13, right: 13, background: '#101e32' }).png().toFile('public/app-icon.png');
await sharp('public/app-icon.png').resize(192).png().toFile('public/icon-192.png');
for (const name of await readdir('public/assets/arcade')) {
  if (name.endsWith('.png')) await rm(`public/assets/arcade/${name}`);
}
console.log('Prepared five backgrounds, three lossless sprite atlases, and app icons.');
