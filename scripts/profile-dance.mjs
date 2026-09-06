import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const reports=[];
try {
 for(const viewport of [{width:1440,height:1000},{width:844,height:390},{width:1280,height:800}]) {
  const page=await browser.newPage({viewport,hasTouch:viewport.width!==1440});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5173/?testing=1');await page.waitForSelector('.asset-loading',{state:'detached'});await page.locator('[data-action="dance"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.dance-guest:not(:disabled)').length===12);
  await page.evaluate(()=>{const r=window.__DASH__.ui.dance,k=[...r.rigs.keys()],moves=[...document.querySelectorAll('#dance-move option')].map(o=>o.value);for(let i=0;i<24;i++){r.add(k[i%12],.1+i%8*.11,.45+Math.floor(i/8)*.23);r.party.dancers[i].dance=moves[i%moves.length];}r.party.calm=false;});
  await page.waitForTimeout(300);
  const timing=await page.evaluate(async()=>{
   const samples=[];let last;const end=performance.now()+6000;
   await new Promise(resolve=>{function frame(now){if(last)samples.push(now-last);last=now;if(now<end)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   samples.sort((a,b)=>a-b);return {frames:samples.length,medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)],over33ms:samples.filter(t=>t>33.5).length,dancers:window.__DASH__.ui.dance.party.dancers.length};
  });
  reports.push({viewport,...timing,errors});await page.close();
 }
}finally{await browser.close();}
await mkdir('release/qa',{recursive:true});const result={date:new Date().toISOString(),environment:'Chrome on development Mac, viewport and touch emulation; not physical Android testing',reports};await writeFile('release/qa/dance-rig-profile.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
