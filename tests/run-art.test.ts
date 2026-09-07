import {test,expect} from 'vitest';
import sharp from 'sharp';
import atlas from '../src/utils/heroRun8.json';

test('authored run atlas has distinct contacts, narrow passing silhouettes and grounded body bob',async()=>{
  const {data,info}=await sharp('public/assets/arcade/hero-run8-sheet.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  expect([info.width,info.height]).toEqual([1536,640]);
  expect(atlas.count).toBe(8);
  const poses=[];
  for(let frame=0;frame<8;frame++){
    const rgba:number[]=[];let left=384,right=0,top=320,bottom=0;
    for(let y=0;y<320;y++)for(let x=0;x<384;x++){
      const i=((Math.floor(frame/4)*320+y)*info.width+frame%4*384+x)*4;
      rgba.push(...data.subarray(i,i+4));
      if(data[i+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
    }
    poses.push({rgba,left,right,top,bottom});
  }
  expect(poses.every(p=>Math.abs(p.bottom-317)<=1)).toBe(true);
  expect(Math.abs(poses[0].top-poses[4].top)*.26).toBeLessThanOrEqual(.52);
  for(const [contact,compression,passing] of [[0,1,2],[4,5,6]]){
    const down=(poses[compression].top-poses[contact].top)*.26;
    const up=(poses[contact].top-poses[passing].top)*.26;
    expect(down).toBeGreaterThanOrEqual(1);expect(down).toBeLessThanOrEqual(3);
    expect(up).toBeGreaterThanOrEqual(1);expect(up).toBeLessThanOrEqual(2);
    expect((poses[contact].right-poses[contact].left)/(poses[passing].right-poses[passing].left)).toBeGreaterThan(1.4);
  }
  let changed=0,union=0;
  for(let i=0;i<poses[0].rgba.length;i+=4){
    const a=poses[0].rgba,b=poses[4].rgba;
    if(a[i+3]>180||b[i+3]>180){union++;if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>100)changed++;}
  }
  expect(changed/union).toBeGreaterThan(.35);
  console.log('Run pose raster review',JSON.stringify({crownY:poses.map(p=>p.top),soleY:poses.map(p=>p.bottom),contactDifference:changed/union}));
});
