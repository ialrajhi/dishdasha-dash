import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await mkdir('art/icons/Dishdasha.iconset',{recursive:true});
for (const size of [16,32,128,256,512]) {
  await sharp('public/app-icon.png').resize(size).png().toFile(`art/icons/Dishdasha.iconset/icon_${size}x${size}.png`);
  await sharp('public/app-icon.png').resize(size*2).png().toFile(`art/icons/Dishdasha.iconset/icon_${size}x${size}@2x.png`);
}
const png=await sharp('public/app-icon.png').resize(256).png().toBuffer();
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
await writeFile('art/icons/app-icon.ico',Buffer.concat([ico,png]));
if(process.platform==='darwin') execFileSync('/usr/bin/iconutil',['-c','icns','art/icons/Dishdasha.iconset','-o','art/icons/app-icon.icns']);
