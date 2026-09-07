import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('art/source/hero-run8-manifest.json', 'utf8'));
const sources=new Map();
async function sourceImage(path) {
  if(sources.has(path))return sources.get(path);
  const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Extract only the uniform chroma matte; costume blues and warm skin are preserved.
  for (let i=0;i<data.length;i+=4) {
    const r=data[i],g=data[i+1],b=data[i+2];
    if (g>90 && g>r*1.45 && g>b*1.45) data[i+3]=0;
    else if (g>Math.max(r,b)+22) data[i+1]=Math.max(r,b);
  }
  const clean=await sharp(data,{raw:info}).png().toBuffer();sources.set(path,clean);return clean;
}
const width=384,height=320,columns=4,baseline=318,headX=234;
const layers=[], frames=[];
for (const [index, frame] of manifest.frames.entries()) {
  const [left,top,right,bottom]=frame.bounds;
  const clean=await sourceImage(frame.source||manifest.source);
  // One shared scale for every anatomical part and every pose. Do not normalize pose height.
  const w=Math.round((right-left)*manifest.scale), h=Math.round((bottom-top)*manifest.scale);
  const dx=Math.round(headX-(frame.headAnchorX-left)*manifest.scale);
  const dy=Math.round(baseline-(frame.groundY-top)*manifest.scale);
  if(dx<0||dy<0||dx+w>width||dy+h>height)throw Error(`Run frame ${index+1} exceeds its canvas`);
  const input=await sharp(clean).extract({left,top,width:right-left,height:bottom-top})
    .resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
  layers.push({input,left:index%columns*width+dx,top:Math.floor(index/columns)*height+dy});
  frames.push({pose:frame.pose,nearFoot:frame.nearFoot,nearArm:frame.nearArm,
    visibleBounds:[dx,dy,dx+w,dy+h],headAnchorX:headX,baseline});
}
if(frames.length!==8)throw Error('The hero needs exactly eight authored poses');
await sharp({create:{width:width*columns,height:height*2,channels:4,background:'#00000000'}})
  .composite(layers).webp({lossless:true,effort:6}).toFile('public/assets/arcade/hero-run8-sheet.webp');
await writeFile('src/utils/heroRun8.json',JSON.stringify({width,height,columns,count:8,baseline,scale:manifest.scale,frames},null,2)+'\n');
console.log('Prepared eight authored hero poses at one shared scale and foot baseline.');
