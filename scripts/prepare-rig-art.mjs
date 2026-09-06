import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const manifest=JSON.parse(await readFile('art/source/dance-rig-manifest.json','utf8'));
await mkdir('public/assets/dance',{recursive:true});
const metadata={};
for(const sheet of manifest.sheets) {
 const {data,info}=await sharp(sheet.path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Remove only background-connected green so the cat's green eyes survive.
 const mask=new Uint8Array(info.width*info.height),queue=new Uint32Array(mask.length);let head=0,tail=0;
 const green=(p)=>data[p*4+1]>105&&data[p*4+1]>data[p*4]*1.35&&data[p*4+1]>data[p*4+2]*1.25;
 const visit=p=>{if(!mask[p]&&green(p)){mask[p]=1;queue[tail++]=p;}};
 for(let x=0;x<info.width;x++){visit(x);visit((info.height-1)*info.width+x);}
 for(let y=0;y<info.height;y++){visit(y*info.width);visit(y*info.width+info.width-1);}
 // Enclosed negative space in the dallah handle is background too. Explicit
 // asset seeds preserve intentional green details, especially the cat's eyes.
 for(const [x,y] of sheet.backgroundSeeds ?? []) visit(y*info.width+x);
 while(head<tail){const p=queue[head++],x=p%info.width,y=Math.floor(p/info.width);if(x)visit(p-1);if(x+1<info.width)visit(p+1);if(y)visit(p-info.width);if(y+1<info.height)visit(p+info.width);}
 for(let p=0;p<mask.length;p++) {
  if(mask[p])data[p*4+3]=0;
  else if((mask[p-1]||mask[p+1]||mask[p-info.width]||mask[p+info.width])&&data[p*4+1]>Math.max(data[p*4],data[p*4+2])+25)data[p*4+1]=Math.max(data[p*4],data[p*4+2]);
 }
 const clean=await sharp(data,{raw:info}).png().toBuffer();
 for(let row=0;row<4;row++) {
  const layers=[],ratios=[],bounds=[];
  for(let col=0;col<5;col++) {
   const [left,top,r,b]=sheet.bounds[row][col],right=r-1,bottom=b-1;
   const width=right-left+1,height=bottom-top+1;ratios.push(width/height);bounds.push([left,top,right+1,bottom+1]);
   const input=await sharp(clean).extract({left,top,width,height}).resize(256,256,{fit:'fill'}).png().toBuffer();
   layers.push({input,left:col*256,top:0});
  }
  await sharp({create:{width:1280,height:256,channels:4,background:'#00000000'}}).composite(layers).webp({lossless:true,effort:6}).toFile(`public/assets/dance/rig-${sheet.characters[row]}.webp`);
  metadata[sheet.characters[row]]={ratios,bounds};
 }
}
await writeFile('src/dance/rigParts.json',JSON.stringify(metadata,null,2)+'\n');
console.log('Prepared 12 five-part rigs; aspect ratios retained in metadata.');
