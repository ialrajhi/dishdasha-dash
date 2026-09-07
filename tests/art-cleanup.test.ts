import { expect, test } from 'vitest';
import sharp from 'sharp';
import parts from '../src/dance/rigParts.json';

test('crouching preserves the face size of the running character', async () => {
  async function face(file: string, region: number[]) {
    const {data, info} = await sharp(`public/assets/arcade/${file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const xs:number[] = [], ys:number[] = [];
    // Anatomical landmark windows isolate face skin, excluding hands and sandals.
    for (let y=region[1];y<region[3];y++) for(let x=region[0];x<region[2];x++) {
      const [r,g,b,a] = data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4);
      if(a>200 && r>150 && g>60 && r>g*1.2 && g>b*1.4) {xs.push(x);ys.push(y);}
    }
    expect(xs.length).toBeGreaterThan(500);
    return [Math.max(...xs)-Math.min(...xs)+1,Math.max(...ys)-Math.min(...ys)+1];
  }
  const run=await face('hero-run8-sheet.webp',[205,80,277,150]);
  const duck=await face('hero-duck-sheet.webp',[220,140,310,240]);
  for(let i=0;i<2;i++) {expect(duck[i]/run[i]).toBeGreaterThan(.85);expect(duck[i]/run[i]).toBeLessThan(1.15);}
});

test('dallah handle is transparent while intentional green cat eyes remain', async () => {
  const dallah=await sharp('public/assets/dance/rig-dallah.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const [l,t,r,b]=parts.dallah.bounds[0];
  const x=Math.floor((270-l)/(r-l)*256), y=Math.floor((391-t)/(b-t)*256);
  expect(dallah.data[(y*dallah.info.width+x)*4+3]).toBe(0);
  const cat=await sharp('public/assets/dance/rig-cat.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let greenEyes=0;
  for(let y=0;y<128;y++)for(let x=0;x<256;x++) {
    const [r,g,b,a]=cat.data.subarray((y*cat.info.width+x)*4,(y*cat.info.width+x)*4+4);
    if(a>200 && g>r*1.2 && g>b*1.3)greenEyes++;
  }
  expect(greenEyes).toBeGreaterThan(50);
});
