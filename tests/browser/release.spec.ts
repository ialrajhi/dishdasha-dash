import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('/?testing=1');
  await page.waitForFunction(() => (window as any).__DASH__?.game.scene.isActive('Menu'));
}

test('fixed physics agrees at 15, 30, 60, 120, and 144 fps', async ({page}) => {
  await ready(page);
  const result = await page.evaluate(() => {
    const d = (window as any).__DASH__;
    d.game.loop.stop();
    let time = performance.now();
    const rows = [];
    for (const fps of [15,30,60,120,144]) {
      d.start(1);
      for (let i=0;i<3;i++) d.game.step(time+=1000/60,1000/60);
      const s = d.scene();
      s.pressJump();
      let peak=300;
      for (let i=0;i<fps*3;i++) {
        d.game.step(time+=1000/fps,1000/fps);
        peak=Math.min(peak,s.player.y);
      }
      rows.push({fps,x:s.player.x,y:s.player.y,clock:s.gameTime,peak});
    }
    return rows;
  });
  console.log('Frame-rate simulation', JSON.stringify(result));
  for (const row of result) {
    expect(row.x).toBeCloseTo(result[0].x,4);
    expect(row.y).toBeCloseTo(300,4);
    expect(row.clock).toBeCloseTo(result[0].clock,4);
    expect(row.peak).toBeLessThan(216);
  }
});

test('mixed inputs release once, pause preserves velocity, finish lands, reset discards paused run', async ({page}) => {
  await ready(page);
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const d=(window as any).__DASH__, s=d.scene();
    d.game.loop.stop(); let time=performance.now();
    const step=()=>d.game.step(time+=1000/60,1000/60);
    s.pressJump('first');s.pressJump('second');step();step();
    const v0=s.player.bodyRef.velocity.y;
    s.releaseJump('first');const v1=s.player.bodyRef.velocity.y;
    s.releaseJump('second');const v2=s.player.bodyRef.velocity.y;
    s.releaseJump('second');const v3=s.player.bodyRef.velocity.y;
    d.action('pause');const paused=s.player.bodyRef.velocity.y;
    d.action('resume');const resumed=s.player.bodyRef.velocity.y;
    s.player.bodyRef.reset(s.course.length,240);s.player.setVelocityY(-150);s.finish();
    for(let i=0;i<60;i++)step();
    return {v0,v1,v2,v3,paused,resumed,landed:s.player.y,pose:s.player.state};
  });
  expect(r.v0).toBe(r.v1);expect(r.v2).toBeGreaterThan(r.v1);expect(r.v2).toBe(r.v3);
  expect(r.paused).toBe(r.v3);expect(r.resumed).toBe(r.v3);
  expect(r.landed).toBeCloseTo(300,2);expect(r.pose).toBe('victory');
  await page.evaluate(() => { const d=(window as any).__DASH__; d.game.loop.start(d.game.step.bind(d.game));d.start(1); });
  await page.waitForTimeout(100);
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="options"]').click();
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="reset-yes"]').click();
  await page.locator('.back-button').click();
  await expect(page.locator('.view-menu')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__DASH__.game.scene.isActive('Game'))).toBe(false);
});

test('English menus preserve Arabic game text and offline licenses remain accessible', async ({page}) => {
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('lang','en');
  await expect(page.locator('.english-title')).toHaveText('DISHDASHA DASH');
  await page.locator('[data-action="options"]').click();
  await page.locator('[data-action="about"]').click();
  await expect(page.locator('.privacy-copy')).toContainText('does not collect or share');
  await page.locator('[data-action="licenses"]').click();
  await expect(page.locator('#license-copy')).toContainText('Phaser', {ignoreCase:true});
  await page.evaluate(() => window.dispatchEvent(new Event('save-recovered')));
  await expect(page.locator('#license-copy')).toContainText('Mapbox');
  await page.locator('.back-button').click();await page.locator('.back-button').click();await page.locator('.back-button').click();
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('#level-label')).toContainText('الفريج');
  await expect(page.locator('.hud-score small')).toHaveText('النقاط');
  await page.locator('[data-action="pause"]').click();
  await page.waitForTimeout(350);
  await expect(page.locator('#game-notice')).not.toHaveClass(/visible/);
});

test('standard controller navigates, jumps, pauses, and stays paused while backgrounded', async ({page}) => {
  await ready(page);
  await page.evaluate(() => {
    const buttons=Array.from({length:17},()=>({pressed:false,value:0,touched:false}));
    (window as any).__pad={id:'QA standard controller',index:0,mapping:'standard',connected:true,buttons,axes:[0,0,0,0],timestamp:0};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).__pad]});
  });
  const button=async (index:number,pressed:boolean)=>{await page.evaluate(({index,pressed})=>{(window as any).__pad.buttons[index].pressed=pressed;},{index,pressed});await page.waitForTimeout(60);};
  await button(0,true);await button(0,false);
  await expect(page.locator('.view-playing')).toBeVisible();
  await button(0,true);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.y)).toBeLessThan(300);
  await button(0,false);await button(9,true);await button(9,false);
  await expect(page.locator('.view-pause')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await button(0,true);await button(0,false);
  await expect(page.locator('.view-pause')).toBeVisible();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await button(0,true);await button(0,false);
  await expect(page.locator('.view-playing')).toBeVisible();
  await button(1,true);
  await page.waitForFunction(()=>(window as any).__DASH__.scene().player.ducking);
  await expect(page.locator('.view-playing')).toBeVisible();
  await page.evaluate(()=>(window as any).__DASH__.scene().clearInput());
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>(window as any).__DASH__.scene().player.duckHeld)).toBe(true);
  await button(1,false);
  await page.evaluate(()=>window.dispatchEvent(new Event('gamepaddisconnected')));
  await expect(page.locator('.view-pause')).toBeVisible();
});

test('phone and tablet menus have usable targets and scrollable options', async ({browser}) => {
  for (const viewport of [{width:844,height:390},{width:390,height:844},{width:1280,height:800},{width:800,height:1280}]) {
    const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
    const page=await context.newPage();await ready(page);
    const b=await page.locator('[data-action="start"]').boundingBox();
    expect(b!.height).toBeGreaterThanOrEqual(44);
    const high=await page.locator('.high-score-link').boundingBox();
    const cabinet=await page.locator('.game-cabinet').boundingBox();
    expect(high!.y+high!.height).toBeLessThanOrEqual(cabinet!.y+cabinet!.height);
    await page.screenshot({path:`test-results/menu-${viewport.width}x${viewport.height}.png`});
    await page.locator('[data-action="options"]').tap();
    await page.locator('[data-action="about"]').scrollIntoViewIfNeeded();
    await page.locator('[data-action="about"]').tap();
    await page.locator('[data-action="licenses"]').scrollIntoViewIfNeeded();
    await page.locator('[data-action="licenses"]').tap();
    await expect(page.locator('#license-copy')).toContainText('THIRD-PARTY NOTICES');
    await context.close();
  }
});
