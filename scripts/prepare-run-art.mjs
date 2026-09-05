import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
const source = JSON.parse(await readFile('art/source/run12-manifest.json','utf8'));
const atlas = { width:384, height:320, columns:4, count:12, heroStride:80, kidStride:28 };
for (const cycle of source.finalAssets) {
  const { data, info } = await sharp(cycle.path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i=0;i<data.length;i+=4) {
    const r=data[i],g=data[i+1],b=data[i+2];
    if (g>100 && g>r*1.35 && g>b*1.35) data[i+3]=0;
    else if (g>Math.max(r,b)+25) data[i+1]=Math.max(r,b);
  }
  const clean=await sharp(data,{raw:info}).png().toBuffer();
  const bounds=cycle.cropBoundsXYXYExclusive;
  const height=cycle.asset==='hero'?260:308;
  const layers=[];
  for (const [index,[left,top,right,bottom]] of bounds.entries()) {
    const width=right-left, rawHeight=bottom-top;
    // Each generated pose has small framing drift. Normalize crown-to-sole extent
    // uniformly (no stretching) and anchor the dark agal/cap region horizontally.
    const scale=(height+[0,2,0,-2,-3,-1,0,2,0,-2,-3,-1][index])/rawHeight;
    let sum=0,count=0;
    for(let y=top+Math.floor(rawHeight*.04);y<top+rawHeight*.2;y++) for(let x=left;x<right;x++) {
      if(cycle.asset==='hero'?x<left+width*.45:x>left+width*.65) continue;
      const i=(y*info.width+x)*4;
      if(data[i+3] && Math.max(data[i],data[i+1],data[i+2])<85){sum+=x-left;count++;}
    }
    const anchor=count?sum/count:width*.5;
    const w=Math.round(width*scale),h=Math.round(rawHeight*scale);
    const target=cycle.asset==='hero'?234:156;
    const dx=Math.max(2,Math.min(atlas.width-w-2,Math.round(target-anchor*scale)));
    const input=await sharp(clean).extract({left,top,width,height:rawHeight}).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
    layers.push({input,left:index%4*atlas.width+dx,top:Math.floor(index/4)*atlas.height+atlas.height-h-2});
  }
  await sharp({create:{width:atlas.width*4,height:atlas.height*3,channels:4,background:'#00000000'}}).composite(layers)
    .webp({lossless:true,effort:6}).toFile(`public/assets/arcade/${cycle.asset}-run-sheet.webp`);
}
await writeFile('src/utils/runCycle.json',JSON.stringify(atlas,null,2)+'\n');
console.log('Prepared twelve high-resolution poses per runner.');
