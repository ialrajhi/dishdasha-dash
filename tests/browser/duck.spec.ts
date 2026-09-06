import { test, expect } from '@playwright/test';
async function start(page:any) {
  await page.goto('/?testing=1'); await expect(page.locator('.asset-loading')).toHaveCount(0);
  await page.locator('[data-action="start"]').click(); await page.waitForTimeout(200);
}
test('overhead obstacles require ducking, preserve feet, and award points only after clearance', async ({page}) => {
  await start(page);
  const report=await page.evaluate(()=>{
    const d=(window as any).__DASH__,s=d.scene(),p=s.player;
    d.game.loop.stop();let time=performance.now();const step=()=>d.game.step(time+=1000/60,1000/60);
    const awning=s.hazards.find((h:any)=>h.spec.kind==='awning');
    s.hazards=s.hazards.filter((h:any)=>h===awning);s.collectibles.forEach((c:any)=>c.setActive(false));
    p.bodyRef.reset(awning.x-100,300);p.setVelocity(0,0);p.resetVisual();step();s.pressDuck('test');step();
    const feet={y:p.y,bottom:p.bodyRef.bottom,height:p.bodyRef.height};
    let pausedUnder=false,resolvedEarly=false,minHearts=3;
    for(let i=0;i<100;i++) {
      if(!pausedUnder&&p.x>awning.x-10) { s.requestPause();d.action('resume');pausedUnder=true; }
      step();minHearts=Math.min(minHearts,s.hearts);
      if(awning.hitbox().right>=p.bodyRef.left&&s.score.resolved.has(awning.spec.id)) resolvedEarly=true;
    }
    const safe={minHearts,pausedUnder,resolvedEarly,resolved:s.score.resolved.has(awning.spec.id),ducking:p.ducking};
    // The same obstacle catches a standing player.
    awning.hit=false;p.invulnerableUntil=0;s.hearts=3;p.bodyRef.reset(awning.x-75,300);p.setVelocity(0,0);p.resetVisual();s.clearInput();
    for(let i=0;i<50;i++)step();
    return {feet,safe,standingHearts:s.hearts,standingHit:awning.hit};
  });
  expect(report.feet).toEqual({y:300,bottom:300,height:18});
  expect(report.safe).toEqual({minHearts:3,pausedUnder:true,resolvedEarly:false,resolved:true,ducking:false});
  expect(report.standingHearts).toBe(2);expect(report.standingHit).toBe(true);
});
test('keyboard and touch duck are held controls and cannot launch a buffered jump',async({page})=>{
  await start(page);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.ducking)).toBe(true);
  await page.keyboard.press('Space');await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.y)).toBe(300);
  await page.keyboard.up('ArrowDown');await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.ducking)).toBe(false);
  const button=page.locator('#duck-button');const b=(await button.boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.waitForTimeout(90);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.ducking)).toBe(true);
  await page.keyboard.down('ArrowDown');
  await page.mouse.up();await page.waitForTimeout(90);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.ducking)).toBe(true);
  await page.keyboard.up('ArrowDown');await page.waitForTimeout(90);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.ducking)).toBe(false);
});
