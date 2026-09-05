import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const data = JSON.parse(await readFile('art/source/dance-bounds.json', 'utf8'));
const names = [['hero','woman','boy','girl'],['cat','dallah','grandpa','chef'],['robot','alien','drummer','fox']];
await mkdir('public/assets/dance', { recursive: true });
for (const [sheetIndex, sheet] of Object.values(data).entries()) {
  const { data: pixels, info } = await sharp(sheet.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i=0;i<pixels.length;i+=4) {
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    if (g>130 && g>1.5*r && g>1.5*b) pixels[i+3]=0;
    else if (g>Math.max(r,b)+35) pixels[i+1]=Math.max(r,b);
  }
  const clean = await sharp(pixels,{raw:info}).png().toBuffer();
  for (const [row, bounds] of sheet.crop_bounds_xyxy.entries()) {
    const scale = Math.min(178 / Math.max(...bounds.map(b=>b[3]-b[1])),178 / Math.max(...bounds.map(b=>b[2]-b[0])));
    const layers=[];
    for (const [frame,b] of bounds.entries()) {
      const width=b[2]-b[0],height=b[3]-b[1],w=Math.round(width*scale),h=Math.round(height*scale);
      const input=await sharp(clean).extract({left:b[0],top:b[1],width,height}).resize(w,h).png().toBuffer();
      layers.push({input,left:frame*192+Math.round((192-w)/2),top:190-h});
    }
    await sharp({create:{width:576,height:192,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true,effort:6}).toFile(`public/assets/dance/${names[sheetIndex][row]}.webp`);
  }
}
console.log('Prepared 12 original three-pose dance characters.');
