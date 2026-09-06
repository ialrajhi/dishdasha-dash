import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const {version}=JSON.parse(await readFile('package.json','utf8'));
const folder=`release/google-play/${version}`;await mkdir(`${folder}/browser-previews`,{recursive:true});
await cp('art/icons/Dishdasha.iconset/icon_512x512.png',`${folder}/icon-512.png`);
for(const name of ['README.md','listing-en.md','listing-ar.md','submission-draft.md','signing.md','device-test-card.md']) await cp(`store/google-play/${name}`,`${folder}/${name}`);
await cp('docs/PRIVACY_POLICY_DRAFT.md',`${folder}/privacy-policy-draft.md`);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:960,height:540},deviceScaleFactor:2,hasTouch:true});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.DASH_PREVIEW_URL||'http://localhost:5173/?testing=1');
await expect(page.locator('.asset-loading')).toHaveCount(0);
await page.evaluate(()=>{document.body.classList.add('packaged-game');window.__DASH__.save.tutorial('completed');});
await page.waitForTimeout(400);
await page.screenshot({path:`${folder}/browser-previews/05-menu.png`});
for(const [name,level,duck] of [['01-neighborhood',1,false],['02-duck',1,true],['03-souq',3,false]]) {
  await page.evaluate(level=>{const d=window.__DASH__;d.game.loop.stop();d.start(level);d.game.step(performance.now(),1000/60);},level);
  await page.waitForTimeout(2500);
  await page.evaluate(({level,duck})=>{
    const d=window.__DASH__,g=d.game;g.loop.stop();let time=performance.now();
    for(let i=0;i<3;i++)g.step(time+=1000/60,1000/60);
    const s=d.scene();
    for(let frame=0;frame<950;frame++){
      const p=s.player;
      const overhead=s.hazards.find(h=>h.spec.kind==='awning'&&h.hitbox().right>p.bodyRef.left&&h.x-p.x<125);
      if(overhead)s.pressDuck('capture');else s.releaseDuck('capture');
      const next=s.hazards.filter(h=>!h.hit&&h.spec.kind!=='awning'&&h.x>p.x).sort((a,b)=>a.x-b.x)[0];
      if(next&&next.x-p.x<s.level.speed*.37+12&&p.bodyRef.blocked.down)s.pressJump('capture');
      if(p.bodyRef.velocity.y>0)s.releaseJump('capture');
      g.step(time+=1000/60,1000/60);
      if(duck ? (p.ducking&&overhead&&Math.abs(p.x-overhead.x)<7) : p.x>815&&p.y<235)break;
    }
  },{level,duck});
  await page.screenshot({path:`${folder}/browser-previews/${name}.png`});
}
await page.evaluate(()=>{const d=window.__DASH__;d.action('menu');d.game.loop.start(d.game.step.bind(d.game));});
await page.locator('[data-action="dance"]').click();
for(const kind of ['hero','woman','cat','dallah','boy','abaya','robot','girl'])await page.locator(`[data-guest="${kind}"]`).click();
await page.evaluate(()=>{const d=window.__DASH__.ui.dance;d.party.dancers.forEach((x,i)=>{x.x=.13+(i%4)*.245;x.y=i<4?.52:.88;x.dance=['disco','clap','shuffle','twist','kick','sway','crossstep','robot'][i];});d.party.calm=false;d.persist();});
await page.waitForTimeout(300);await page.screenshot({path:`${folder}/browser-previews/04-go-dance.png`});
const background='data:image/webp;base64,'+(await readFile('public/assets/arcade/neighborhood.webp')).toString('base64');
const changa='data:font/woff2;base64,'+(await readFile('dist/assets/changa-arabic-wght-normal-DJiiU_3s.woff2')).toString('base64');
const space='data:font/woff2;base64,'+(await readFile('dist/assets/space-grotesk-latin-wght-normal-BhU9QXUp.woff2')).toString('base64');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>Dishdasha Dash — feature graphic</title><style>@font-face{font-family:Changa;src:url(${changa})}@font-face{font-family:Space;src:url(${space})}*{box-sizing:border-box}html,body{margin:0;width:1024px;height:500px;overflow:hidden}main{height:100%;background:linear-gradient(90deg,#101d30f0 0%,#102236bb 32%,#10223622 65%,transparent 100%),url(${background}) center/cover;display:flex;align-items:center;padding:48px 64px;color:#fff2d5}section{width:440px}.arabic{font:800 76px/1 Changa,sans-serif;color:#ffca4b;text-shadow:0 5px #142030;margin-bottom:16px;width:max-content}h1{font:800 64px/.95 Space,sans-serif;letter-spacing:-3px;margin:0;text-shadow:0 4px #142030}h1 span{font-size:106px;letter-spacing:-5px}p{font:600 18px/1.5 Space,sans-serif;margin:24px 0 0;color:#e1e6ea}</style><main><section><div class="arabic" lang="ar" dir="rtl">دشداشة</div><h1>DISHDASHA<br><span>DASH</span></h1><p>From the neighborhood to the wedding.</p></section></main></html>`;
await writeFile(`${folder}/feature-graphic.html`,html);
await page.setViewportSize({width:1024,height:500});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:`${folder}/feature-graphic-1024x500.png`,scale:"css"});
await writeFile(`${folder}/preview-manifest.json`,JSON.stringify({version,createdAt:new Date().toISOString(),source:'Real game scenes in a browser using the packaged layout; not physical-device screenshots',icon:'Existing approved game icon exported by native icon pipeline',feature:'Marketing layout using existing game art; not a gameplay screenshot',errors},null,2)+'\n');
await browser.close();
if(errors.length)throw Error('Store preview session reported errors: '+errors.join('; '));
console.log('Prepared store copy, icon, feature graphic and five browser gameplay previews at '+resolve(folder));
