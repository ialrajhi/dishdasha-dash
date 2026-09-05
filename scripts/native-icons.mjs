import sharp from 'sharp';
import { writeFile, readdir, rm, mkdir } from 'node:fs/promises';
const root = 'android/app/src/main/res';
for (const [density, size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
  for (const suffix of ['', '_round']) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect x="1" y="1" width="${size-2}" height="${size-2}" rx="${suffix ? size/2 : size*.2}" fill="white"/></svg>`);
    await sharp('public/app-icon.png').resize(size).composite([{input:mask,blend:'dest-in'}]).png().toFile(`${root}/mipmap-${density}/ic_launcher${suffix}.png`);
  }
  await sharp('public/app-icon.png').resize(size * 2.25).png().toFile(`${root}/mipmap-${density}/ic_launcher_foreground.png`);
}
await writeFile(`${root}/values/ic_launcher_background.xml`, '<resources><color name="ic_launcher_background">#101e32</color></resources>');
for (const dir of await readdir(root)) {
  if (dir.startsWith('drawable')) for (const file of await readdir(`${root}/${dir}`)) if (file === 'splash.png') await rm(`${root}/${dir}/${file}`);
}
await writeFile(`${root}/drawable/splash.xml`, '<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/ic_launcher_background"/><item android:gravity="center" android:width="160dp" android:height="160dp" android:drawable="@mipmap/ic_launcher"/></layer-list>');

await mkdir(`${root}/mipmap-anydpi-v33`, {recursive:true});
await writeFile(`${root}/drawable/ic_launcher_monochrome.xml`, `<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#FFFFFF" android:pathData="M33,43 Q30,31 44,27 L64,27 Q77,31 75,43 L82,70 L69,74 L66,62 Q56,73 44,63 L42,76 L26,71 Z M39,34 L70,34 L69,38 L39,38 Z"/><path android:fillColor="#FFFFFF" android:pathData="M37,75 Q54,63 73,75 L77,86 L31,86 Z"/></vector>`);
for (const name of ['ic_launcher','ic_launcher_round']) await writeFile(`${root}/mipmap-anydpi-v33/${name}.xml`, '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/><monochrome android:drawable="@drawable/ic_launcher_monochrome"/></adaptive-icon>');
