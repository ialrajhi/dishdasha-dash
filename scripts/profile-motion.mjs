import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const reports=[];
try {
  for(const profile of [
    {name:'desktop',width:1440,height:1000,dpr:1,touch:false},
    {name:'phone-landscape',width:844,height:390,dpr:2.625,touch:true},
    {name:'tablet-landscape',width:1280,height:800,dpr:1.5,touch:true},
  ]) {
    const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,hasTouch:profile.touch});
    const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:5173/?testing=1');await page.waitForSelector('.asset-loading',{state:'detached'});
    await page.evaluate(()=>window.__DASH__.start(1));await page.waitForTimeout(500);
    const report=await page.evaluate(async()=>{
      const samples=[];let previous;const end=performance.now()+6500;
      await new Promise(resolve=>{function frame(now){if(previous!==undefined)samples.push(now-previous);previous=now;if(now<end)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
      const sorted=[...samples].sort((a,b)=>a-b),dash=window.__DASH__,s=dash.scene();
      return {frames:samples.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over33ms:samples.filter(t=>t>33.5).length,canvas:[dash.game.canvas.width,dash.game.canvas.height],heroTexture:[s.player.visual.width,s.player.visual.height],steadyView:dash.save.data.settings.steadyView,renderer:dash.game.renderer.type,screen:dash.ui.screen};
    });
    await mkdir('release/qa',{recursive:true});await page.locator('.game-cabinet').screenshot({path:`release/qa/motion-${profile.name}.png`});
    reports.push({profile,...report,errors});await context.close();
  }
}finally{await browser.close();}
const data={date:new Date().toISOString(),environment:'Headless Chrome on development Mac; viewport/touch emulation, not physical Android hardware',reports};
await writeFile('release/qa/motion-profile.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data,null,2));
