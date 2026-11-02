import { test, expect } from "@playwright/test";

test("jump height, coyote time, buffering, and one double jump", async ({
  page,
}) => {
  await page.goto("/?testing=1");
  await page.waitForFunction(
    () => !!(window as any).__DASH__?.game.scene.isActive("Menu"),
  );
  await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(150);
  const results = await page.evaluate(() => {
    const { game, scene } = (window as any).__DASH__;
    const s = scene();
    game.loop.stop();
    let time = performance.now();
    const step = () => game.step((time += 1000 / 60), 1000 / 60);
    function reset(y = 300) {
      s.player.bodyRef.reset(300, y);
      s.player.setVelocity(0, 0);
      s.clearInput();
      s.player.lastGrounded = -1000;
      step();
    }
    function jump(hold: number) {
      reset();
      s.pressJump();
      let peak = 300;
      for (let i = 0; i < 65; i++) {
        if (i === hold) s.releaseJump();
        step();
        peak = Math.min(peak, s.player.y);
      }
      return peak;
    }
    const short = jump(2);
    const high = jump(35);
    reset(291);
    s.player.lastGrounded = s.gameTime - 70;
    s.pressJump();
    step();
    const coyote = s.player.bodyRef.velocity.y;
    reset(284);
    s.player.setVelocityY(130);
    s.player.lastGrounded = -1000;
    s.pressJump();
    for (let i = 0; i < 9; i++) step();
    const buffered = s.player.bodyRef.velocity.y;
    const before = s.player.bodyRef.velocity.y;
    s.releaseJump();
    s.pressJump();
    step();
    const second = s.player.bodyRef.velocity.y;
    s.clearInput();
    for (let i = 0; i < 4; i++) step();
    s.pressJump();
    step();
    const third = s.player.bodyRef.velocity.y;
    return { short, high, coyote, buffered, before, second, third };
  });
  expect(results.high).toBeLessThan(results.short - 30);
  expect(results.coyote).toBeLessThan(-300);
  expect(results.buffered).toBeLessThan(-250);
  // A second press in the air is a double jump; a third press is ignored.
  expect(results.second).toBeLessThan(-300);
  expect(results.third).toBeGreaterThan(results.second);
  // A tap still clears a 35 px crate.
  expect(300 - results.short).toBeGreaterThan(45);
});

test("golden pickup persists, reset confirms, and every menu is reachable", async ({
  page,
}) => {
  await page.goto("/?testing=1");
  await page.waitForFunction(
    () => !!(window as any).__DASH__?.game.scene.isActive("Menu"),
  );
  await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.locator('[data-action="how"]').click();
  await expect(page.locator(".how-grid")).toBeVisible();
  await page.locator(".back-button").click();
  await page.locator('[data-action="high"]').click();
  await expect(page.locator(".record-list > div")).toHaveCount(10);
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const s = (window as any).__DASH__.scene();
    const golden = s.collectibles.find((c: any) => c.spec.kind === "golden");
    s.player.bodyRef.reset(golden.x, golden.y + 20);
  });
  await page.waitForFunction(
    () => (window as any).__DASH__.save.data.levels[1]?.golden,
  );
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="restart"]').click();
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(() => (window as any).__DASH__.snapshot().hearts),
  ).toBe(3);
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="menu"]', {}).last().click();
  await page.locator('[data-action="options"]').click();
  await page.locator('[data-action="sfx"]').click();
  await page.locator('[data-action="reset"]').click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.locator('[data-action="reset-no"]').click();
  expect(
    await page.evaluate(
      () => (window as any).__DASH__.save.data.levels[1].golden,
    ),
  ).toBe(true);
  await page.locator('[data-action="reset"]').click();
  await page.locator('[data-action="reset-yes"]').click();
  expect(
    await page.evaluate(() =>
      Object.keys((window as any).__DASH__.save.data.levels),
    ),
  ).toHaveLength(0);
  expect(
    await page.evaluate(() => (window as any).__DASH__.save.data.settings.sfx),
  ).toBe(false);
  await page.reload();
  await page.waitForFunction(
    () => !!(window as any).__DASH__?.game.scene.isActive("Menu"),
  );
  await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  expect(
    await page.evaluate(() => (window as any).__DASH__.save.data.unlocked),
  ).toBe(1);
});
