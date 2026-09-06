import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('art/source/duck-bounds.json','utf8'));
const layers=[];
for(const frame of manifest.duck.frames) {
 // Match the running atlas's ~92px crown-to-chin extent: the crouch source
 // measures ~132px. Scale every anatomical part together, never to a hitbox.
 const b=frame.visibleBoundsAlpha128, height=Math.round(b.height * .70), width=Math.round(b.width * .70);
 const input=await sharp('art/source/hero-duck4-sheet.png').extract(b).resize(width,height).png().toBuffer();
 layers.push({input,left:frame.index*384+Math.round((384-width)/2),top:320-height-2});
}
await sharp({create:{width:1536,height:320,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true}).toFile('public/assets/arcade/hero-duck-sheet.webp');
const awning=await sharp('art/source/hanging-awning.png').trim({threshold:60}).resize({width:640}).png().toBuffer();
const {data,info}=await sharp(awning).ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Reuse the painted rope fibers, centering each row into a tileable straight strip.
const rope=Buffer.alloc(32*96*4);
for(let y=0;y<96;y++) {
 let left=110,right=0;
 for(let x=25;x<110;x++) if(data[(y*info.width+x)*4+3]>128) {left=Math.min(left,x);right=Math.max(right,x);}
 const center=Math.round((left+right)/2);
 for(let x=0;x<32;x++) data.copy(rope,(y*32+x)*4,(y*info.width+center+x-16)*4,(y*info.width+center+x-16)*4+4);
}
await sharp(rope,{raw:{width:32,height:96,channels:4}}).webp({lossless:true}).toFile('public/assets/arcade/suspension-rope.webp');
await sharp(awning).extract({left:0,top:105,width:640,height:info.height-105}).webp({lossless:true}).toFile('public/assets/arcade/awning.webp');
console.log('Prepared crouch frames and overhead awning.');
