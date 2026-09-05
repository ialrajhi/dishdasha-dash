import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Run after native packaging. Keep test downloads out of public/ so APKs never bundle themselves.
const apk = 'android/app/build/outputs/apk/debug/app-debug.apk';
const webIndex = await readFile('dist/index.html', 'utf8');
const packagedIndex = execFileSync('unzip', ['-p', apk, 'assets/public/index.html'], { encoding: 'utf8' });
if (packagedIndex !== webIndex) throw Error('Rebuild Android: its web assets do not match the current dist.');
const bytes = await readFile(apk);
const hash = createHash('sha256').update(bytes).digest('hex');
await mkdir('dist/test-builds', { recursive: true });
await cp(apk, 'dist/test-builds/Dishdasha-Dash-1.1.0-test.apk');
await writeFile('dist/test-builds/index.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dishdasha Dash — Android test build</title><style>body{margin:0;background:#101e32;color:#fff1d0;font:18px/1.6 system-ui;padding:32px}main{max-width:640px;margin:6vh auto}h1{line-height:1.15}a{color:inherit}.download{display:block;background:#ffc940;color:#172238;text-decoration:none;padding:18px 24px;border-radius:8px;font-weight:700;margin:28px 0}small{color:#b9c8da}code{overflow-wrap:anywhere;font-size:12px}</style><main><a href="/">← Play in the browser</a><h1><span lang="ar">دشداشة</span><br>Dishdasha Dash</h1><p>Android test build · Version 1.1.0</p><a class="download" href="Dishdasha-Dash-1.1.0-test.apk" download>Download Android APK · ${(bytes.length / 1e6).toFixed(1)} MB</a><p>For Android 7 or later. Open the downloaded APK on your phone or tablet and follow Android’s installation prompt. Rotate to landscape to play.</p><p>This is a debug-signed test package. Google Play release signing and store submission are still pending.</p><small>SHA-256<br><code>${hash}</code></small></main></html>`);
console.log(`Prepared private Android test download (${bytes.length} bytes).`);
