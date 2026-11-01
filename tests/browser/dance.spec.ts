import { test, expect } from '@playwright/test';
async function enter(page: any) {
  await page.goto('/?testing=1');
  await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.locator('[data-action="dance"]').click();
  await expect(page.locator('.dance-guest:not(:disabled)')).toHaveCount(12);
}
test('dance floor supports placement, movement, music, undo, pause and persistence', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await enter(page);
  await expect(page.locator('.dance-empty')).toBeVisible();
  await expect(page.locator('[data-guest="chef"]')).toHaveCount(0);
  await expect(page.locator('#dance-move option')).toHaveCount(11);
  const stage = (await page.locator('#dance-canvas').boundingBox())!;
  const hero = (await page.locator('[data-guest="hero"]').boundingBox())!;
  await page.mouse.move(hero.x + hero.width / 2, hero.y + hero.height / 2); await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * .25, stage.y + stage.height * .65, { steps: 12 }); await page.mouse.up();
  await expect(page.locator('.dance-count')).toHaveText('1 / 24');
  for (const kind of ['woman','boy','girl','cat','dallah','grandpa','abaya','robot','alien','drummer','fox']) await page.locator(`[data-guest="${kind}"]`).click();
  await expect(page.locator('.dance-count')).toHaveText('12 / 24');
  await page.locator('#dance-move').selectOption('twist');
  await page.locator('#dance-copy').click(); await expect(page.locator('.dance-count')).toHaveText('13 / 24');
  await page.locator('#dance-remove').click(); await expect(page.locator('.dance-count')).toHaveText('12 / 24');
  await page.locator('#dance-undo').click(); await expect(page.locator('.dance-count')).toHaveText('13 / 24');
  for (let i = 0; i < 6; i++) await page.locator('#dance-track').selectOption(String(i));
  // Drag the first dancer from its body, retaining the foot placement offset.
  await page.mouse.move(stage.x + stage.width * .25, stage.y + stage.height * .65 - 30); await page.mouse.down();
  await page.mouse.move(stage.x + stage.width * .18, stage.y + stage.height * .5 - 30, { steps: 10 }); await page.mouse.up();
  const saved = await page.evaluate(() => (window as any).__DASH__.save.data.party);
  expect(saved.dancers[0].x).toBeCloseTo(.18, 1);
  expect(saved.track).toBe(5);
  await page.locator('#dance-play').click();
  const elapsed = await page.evaluate(() => (window as any).__DASH__.ui.dance.elapsed);
  await page.waitForTimeout(180);
  expect(await page.evaluate(() => (window as any).__DASH__.ui.dance.elapsed)).toBe(elapsed);
  await page.locator('.dance-room').screenshot({ path: 'test-results/go-dance-desktop.png' });
  await page.reload(); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start')); await page.locator('[data-action="dance"]').click();
  await expect(page.locator('.dance-count')).toHaveText('13 / 24'); await expect(page.locator('#dance-track')).toHaveValue('5');
  await page.locator('#dance-clear').click(); await expect(page.locator('.dance-empty')).toBeVisible();
  await page.locator('#dance-undo').click(); await expect(page.locator('.dance-count')).toHaveText('13 / 24');
  await page.locator('.dance-header [data-action="back"]').click(); await expect(page.locator('.menu-screen .logo')).toBeVisible();
  expect(errors).toEqual([]);
});
test('dance touch placement and small screen controls remain usable', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await enter(page);
  await page.locator('[data-guest="cat"]').tap(); await expect(page.locator('.dance-count')).toHaveText('1 / 24');
  await page.locator('#dance-calm').tap(); await expect(page.locator('#dance-calm')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('.dance-room').screenshot({ path: 'test-results/go-dance-phone.png' });
  for (const viewport of [{width:844,height:390},{width:390,height:844},{width:1280,height:800}]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const canvas = document.querySelector('#dance-canvas')!.getBoundingClientRect();
      const root = document.querySelector('.dance-room')!.getBoundingClientRect();
      return { height:canvas.height, overflow:document.documentElement.scrollWidth>innerWidth+1, bottom:root.bottom, controls:[...document.querySelectorAll('.dance-room button')].filter(e=>!e.hasAttribute('hidden')).every(e=>e.getBoundingClientRect().height>=35) };
    });
    expect(layout.height).toBeGreaterThan(85); expect(layout.overflow).toBe(false); expect(layout.controls).toBe(true);
  }
  await context.close();
});
