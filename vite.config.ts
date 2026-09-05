import { defineConfig } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The game has no video. Omit Phaser's unused third-party RVFC polyfill from
// both development and production builds; its upstream license differs from Phaser's MIT license.
const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const polyfill = readFileSync(at('./node_modules/phaser/src/polyfills/requestVideoFrame.js'), 'utf8').replace(/\r\n/g, '\n').trim();
const engine = readFileSync(at('./node_modules/phaser/dist/phaser.esm.js'), 'utf8').replace(/\r\n/g, '\n');
if (engine.split(polyfill).length !== 2) throw Error('Review Phaser video exclusion after dependency changes.');
const gameEngine = engine.replace(polyfill, '// Unused video polyfill omitted by Dishdasha Dash, 2026-09-05.');
if (gameEngine.includes('_rvfcpolyfillmap')) throw Error('Unused video polyfill remained in the engine.');
mkdirSync(at('./build/engine'), { recursive: true });
writeFileSync(at('./build/engine/phaser.esm.js'), gameEngine);
writeFileSync(at('./build/engine/index.js'), "import * as Phaser from './phaser.esm.js'; export default Phaser; export * from './phaser.esm.js';\n");

export default defineConfig({
  base: "./",
  resolve: { alias: [{ find: /^phaser$/, replacement: at('./build/engine/index.js') }] },
  plugins: [{
    name: 'bundled-game-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-src 'none'" />`);
    },
  }],
  build: {
    target: "es2022",
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
    chunkSizeWarningLimit: 1600,
  },
});
