import { test, expect } from '@playwright/test';
test('120 Hz rendering advances between physics steps and steady view stays fixed', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.asset-loading')).toHaveCount(0);
  await page.evaluate(() => (window as any).__DASH__.start(1));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const result = await page.evaluate(() => {
    const dash = (window as any).__DASH__, s = dash.scene(); dash.game.loop.sleep();
    s.stepAccumulator = 0; const positions: number[] = [], physics: number[] = [], background: number[] = [];
    for(let i=0;i<24;i++) { s.update(i*1000/120,1000/120); positions.push(s.player.visual.x); physics.push(s.player.x); background.push(s.world.scenery.x); }
    return {positions,physics,background, width:s.player.visual.width, height:s.player.visual.height, canvas:[dash.game.canvas.width,dash.game.canvas.height]};
  });
  const deltas = result.positions.slice(2).map((x,i)=>x-result.positions[i+1]);
  expect(deltas.every(d=>d>.8 && d<1.6)).toBe(true);
  expect(result.physics.slice(1).some((x,i)=>Math.abs(x-result.physics[i])<.001)).toBe(true);
  expect(new Set(result.background).size).toBe(1);
  expect([result.width,result.height]).toEqual([384,320]);
  expect(result.canvas).toEqual([1920,1080]);
});
