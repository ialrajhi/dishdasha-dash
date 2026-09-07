import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';

// Stage after Android packaging; review media is not part of the installed game.
await mkdir('dist/animation-preview',{recursive:true});
const review=await readFile('art/review/run8-review.html','utf8');
await writeFile('dist/animation-preview/index.html',review.replace('<canvas width=',
  '<p><a href="/" style="color:#ffd277">← Play Dishdasha Dash</a> · <a href="hero-run8-in-place.mp4" style="color:#ffd277">Watch the run preview</a></p><canvas width='));
await cp('art/review/hero-run8-in-place.mp4','dist/animation-preview/hero-run8-in-place.mp4');
console.log('Staged the standalone eight-pose review without adding it to the game menus.');
