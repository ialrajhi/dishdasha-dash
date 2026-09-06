import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('/?testing=1');
  await expect(page.locator('.asset-loading')).toHaveCount(0);
}
for (const failure of ['font', 'stalled-font', 'image']) {
  test(`startup recovers from ${failure} with Retry and no uncaught rejection`, async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const pattern = failure === 'image' ? '**/assets/arcade/neighborhood.webp' : '**/*changa-arabic*.woff2';
    await page.route(pattern, async route => {
      if (failure === 'stalled-font') await new Promise(resolve => setTimeout(resolve, 10000));
      await route.abort().catch(() => {});
    });
    await page.goto('/?testing=1', {waitUntil:'domcontentloaded'});
    await expect(page.locator('.asset-loading')).toContainText('Could not load the game', {timeout:14000});
    await expect(page.locator('#ui-layer')).toHaveAttribute('inert', '');
    expect(errors).toEqual([]);
    await page.unroute(pattern);
    await page.locator('[data-action="reload"]').click();
    await expect(page.locator('.asset-loading')).toHaveCount(0, {timeout:20000});
    await expect(page.locator('[data-action="start"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('graphics loss freezes position, time, health and inputs until restoration and explicit resume', async ({page}) => {
  await ready(page);
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(() => (window as any).__DASH__.scene().player.x > 280);
  await page.keyboard.down('ArrowDown');
  await page.evaluate(() => {
    const d = (window as any).__DASH__;
    (window as any).__lostExt = d.game.renderer.gl.getExtension('WEBGL_lose_context');
    (window as any).__lostExt.loseContext();
  });
  await expect(page.locator('.graphics-recovery')).toBeVisible();
  const state = () => page.evaluate(() => {const s=(window as any).__DASH__.scene(); return {x:s.player.x,y:s.player.y,time:s.gameTime,hearts:s.hearts,lives:s.lives,score:s.score.score,duck:s.player.duckHeld,jump:s.player.held};});
  const before = await state();
  expect(before.duck).toBe(false);
  await page.evaluate(() => {
    const d = (window as any).__DASH__;
    d.action('resume');d.action('jump-down');d.action('start');
    window.dispatchEvent(new Event('focus'));
  });
  await page.waitForTimeout(7000);
  expect(await state()).toEqual(before);
  await page.keyboard.up('ArrowDown');
  await page.evaluate(() => (window as any).__lostExt.restoreContext());
  await expect(page.locator('[data-action="graphics-continue"]')).toBeVisible();
  await page.waitForTimeout(500);
  expect(await state()).toEqual(before);
  await page.locator('[data-action="graphics-continue"]').click();
  await expect(page.locator('.view-pause')).toBeVisible();
  await page.waitForTimeout(400);
  expect(await state()).toEqual(before);
  await page.screenshot({path:'test-results/graphics-restored.png'});
  await page.locator('[data-action="resume"]').click();
  await page.waitForFunction(x => (window as any).__DASH__.scene().player.x > x, before.x);
  // A second loss while paused must not accidentally start the run.
  await page.locator('[data-action="pause"]').click();
  await page.evaluate(() => (window as any).__lostExt.loseContext());
  await expect(page.locator('.graphics-recovery')).toBeVisible();
  await page.evaluate(() => (window as any).__lostExt.restoreContext());
  await expect(page.locator('[data-action="graphics-continue"]')).toBeVisible();
  await page.locator('[data-action="graphics-continue"]').click();
  await expect(page.locator('.view-pause')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__DASH__.game.scene.isPaused('Game'))).toBe(true);
});

test('graphics recovery preserves the menu and a placed dance party', async ({page}) => {
  await ready(page);
  for (const screen of ['menu','dance']) {
    if (screen === 'dance') await page.locator('[data-action="dance"]').click();
    await page.evaluate(() => {const d=(window as any).__DASH__; (window as any).__lostExt=d.game.renderer.gl.getExtension('WEBGL_lose_context'); (window as any).__lostExt.loseContext();});
    await expect(page.locator('.graphics-recovery')).toBeVisible();
    await page.evaluate(() => (window as any).__lostExt.restoreContext());
    await expect(page.locator('[data-action="graphics-continue"]')).toBeVisible();
    await page.locator('[data-action="graphics-continue"]').click();
    await expect(page.locator(`.view-${screen}`)).toBeVisible();
    if (screen === 'dance') await expect(page.locator('#dance-play')).toContainText('Resume party');
    else expect(await page.evaluate(() => (window as any).__DASH__.game.scene.isActive('Menu'))).toBe(true);
  }
});
