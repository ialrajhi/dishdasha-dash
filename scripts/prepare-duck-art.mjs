import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('art/source/duck-bounds.json','utf8'));
const layers=[];
for(const frame of manifest.duck.frames) {
 const b=frame.visibleBoundsAlpha128, height=126, width=Math.round(b.width*height/b.height);
 const input=await sharp('art/source/hero-duck4-sheet.png').extract(b).resize(width,height).png().toBuffer();
 layers.push({input,left:frame.index*384+Math.round((384-width)/2),top:320-height-2});
}
await sharp({create:{width:1536,height:320,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true}).toFile('public/assets/arcade/hero-duck-sheet.webp');
await sharp('art/source/hanging-awning.png').trim({threshold:60}).resize({width:640}).webp({lossless:true}).toFile('public/assets/arcade/awning.webp');
console.log('Prepared crouch frames and overhead awning.');
