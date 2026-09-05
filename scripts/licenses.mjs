import { readFile, readdir, writeFile } from 'node:fs/promises';
const names = ['phaser', 'eventemitter3', '@capacitor/core', '@capacitor/android', '@capacitor/app', '@capacitor/preferences', '@fontsource-variable/changa', '@fontsource-variable/space-grotesk'];
let result = 'DISHDASHA DASH — THIRD-PARTY NOTICES\n\nElectron desktop distributions include additional Chromium/Electron licenses in their application folder.\n\n';
for (const name of names) {
  const root = `node_modules/${name}`;
  const pkg = JSON.parse(await readFile(`${root}/package.json`, 'utf8'));
  result += `\n${'='.repeat(72)}\n${name} ${pkg.version} — ${pkg.license}\n${'='.repeat(72)}\n`;
  for (const file of (await readdir(root)).filter(f => /^(license|ofl|copyright)/i.test(f))) {
    result += await readFile(`${root}/${file}`, 'utf8') + '\n';
  }
}
for (const [file, marker] of [['Earcut', 'ISC License'], ['Simplify', 'Copyright (c) 2017, Vladimir Agafonkin']]) {
  const source = await readFile(`node_modules/phaser/src/geom/polygon/${file}.js`, 'utf8');
  const notice = source.match(/\/\*[\s\S]*?\*\//g)?.find(block => block.includes(marker));
  if (!notice) throw new Error(`Missing bundled ${file} notice`);
  result += `\n${'='.repeat(72)}\nPhaser embedded ${file}\n${'='.repeat(72)}\n${notice}\n`;
}
result += '\n' + await readFile('docs/licenses/android-runtime.txt', 'utf8');
result += '\n' + await readFile('docs/licenses/phaser-embedded.txt', 'utf8');
await writeFile('public/third-party-licenses.txt', result);
