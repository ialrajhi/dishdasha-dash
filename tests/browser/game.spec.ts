import { test, expect, type Page } from "@playwright/test";
const app = (page: Page, code: string) => page.evaluate(code);
async function ready(page: Page) {
  await page.goto("/?testing=1");
  await page.waitForFunction(
    () => !!(window as any).__DASH__?.game.scene.isActive("Menu"),
  );
  await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.waitForTimeout(450);
}
test("title screen, gameplay, pause and options", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.screenshot({ path: "test-results/menu.png" });
  await expect(page.locator(".menu-screen .logo")).toBeVisible();
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(
    () => (window as any).__DASH__.scene().player?.x > 250,
  );
  await page.waitForTimeout(1900);
  expect(await app(page, "window.__DASH__.snapshot().tea")).toBeGreaterThan(0);
  await page.keyboard.down("Space");
  await page.waitForTimeout(200);
  expect(await app(page, "window.__DASH__.scene().player.y")).toBeLessThan(280);
  await page.keyboard.up("Space");
  await page.locator('[data-action="pause"]').click();
  const x = await app(page, "window.__DASH__.scene().player.x");
  await page.waitForTimeout(450);
  expect(await app(page, "window.__DASH__.scene().player.x")).toBe(x);
  await page.locator('[data-action="options"]').click();
  await page.locator('[data-action="music"]').click();
  expect(await app(page, "window.__DASH__.save.data.settings.music")).toBe(
    false,
  );
  await page.locator('[data-action="set-language"][data-value="en"]').click();
  await expect(page.getByText("Sound effects", { exact: true })).toBeVisible();
  await page.locator("#volume").fill("25");
  expect(await app(page, "window.__DASH__.save.data.settings.volume")).toBe(25);
  await page.locator(".back-button").click();
  await page.locator('[data-action="resume"]').click();
  await page.waitForTimeout(450);
  expect(await app(page, "window.__DASH__.scene().player.x")).toBeGreaterThan(
    x as number,
  );
  await page.screenshot({ path: "test-results/gameplay.png" });
  expect(errors).toEqual([]);
});
test("real obstacle damage, death, checkpoint respawn, and game over", async ({
  page,
}) => {
  await ready(page);
  await page.locator('[data-action="start"]').click();
  await page.waitForFunction(
    () => (window as any).__DASH__.scene().player?.x > 220,
  );
  await app(page, "window.__DASH__.scene().player.bodyRef.reset(820,300)");
  await page.waitForFunction(
    () => (window as any).__DASH__.snapshot().hearts === 2,
  );
  expect(await app(page, "window.__DASH__.snapshot().lives")).toBe(3);
  await app(
    page,
    "{const s=window.__DASH__.scene();s.player.bodyRef.reset(s.course.checkpoint+5,300)}",
  );
  await page.waitForTimeout(100);
  expect(await app(page, "window.__DASH__.scene().checkpoint")).toBeGreaterThan(
    1000,
  );
  await app(
    page,
    "{const s=window.__DASH__.scene();s.damage(true);s.damage(true)}",
  );
  await page.waitForTimeout(1400);
  expect(await app(page, "window.__DASH__.snapshot().hearts")).toBe(3);
  expect(await app(page, "window.__DASH__.snapshot().lives")).toBe(2);
  const returning = await page.evaluate(() => {
    const s = (window as any).__DASH__.scene(), p = s.player;
    return { protected: p.invulnerableUntil > s.gameTime, state: p.state,
      texture: p.visual.texture.key, phase: p.gait.sample(), speed: p.bodyRef.velocity.x };
  });
  expect(returning.protected).toBe(true);
  expect(returning.state).toBe('run');
  expect(returning.texture).toMatch(/^hero-run-stride-/);
  expect(returning.phase).toBeGreaterThan(0);
  expect(returning.speed).toBeGreaterThan(0);
  expect(
    await app(
      page,
      "Math.abs(window.__DASH__.scene().player.x-window.__DASH__.scene().checkpoint)",
    ),
  ).toBeLessThan(100);
  await app(
    page,
    "{const s=window.__DASH__.scene();s.damage(true);s.damage(true);s.damage(true)}",
  );
  await page.waitForTimeout(1300);
  await app(
    page,
    "{const s=window.__DASH__.scene();s.damage(true);s.damage(true);s.damage(true)}",
  );
  await expect(page.locator(".view-over")).toBeVisible();
  await expect(page.locator(".view-over .big-title")).toContainText("One more try?");
  await page.locator('[data-action="restart"]').click();
  await page.waitForTimeout(200);
  expect(await app(page, "window.__DASH__.snapshot().lives")).toBe(3);
});
test("all five completion transitions, victory and persistent unlocks", async ({
  page,
}) => {
  await ready(page);
  await page.locator('[data-action="start"]').click();
  for (let level = 1; level <= 10; level++) {
    await page.waitForFunction(
      (id) =>
        (window as any).__DASH__.scene().level?.id === id &&
        !!(window as any).__DASH__.scene().player,
      level,
    );
    await app(
      page,
      "{const s=window.__DASH__.scene();s.player.bodyRef.reset(s.course.length-10,300)}",
    );
    await expect(
      page.locator(level === 10 ? ".view-victory" : ".view-complete"),
    ).toBeVisible();
    expect(await app(page, "window.__DASH__.save.data.unlocked")).toBe(
      Math.min(10, level + 1),
    );
    if (level < 10) await page.locator('[data-action="next"]').click();
  }
  await expect(page.locator(".card.victory")).toContainText("You made it!");
  await page.screenshot({ path: "test-results/victory.png" });
  await page.locator('[data-action="levels"]').click();
  expect(await page.locator(".level-card:not(:disabled)").count()).toBe(10);
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__DASH__?.game.scene.isActive("Menu"));
  await page.keyboard.press("Enter");
  await page.locator('[data-action="levels"]').click();
  expect(await page.locator(".level-card:not(:disabled)").count()).toBe(10);
  await page.screenshot({ path: "test-results/level-select.png" });
});
test("touch jump and mobile portrait guidance", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await ready(page);
  await page.locator('[data-action="start"]').tap();
  await page.waitForTimeout(300);
  const jumpBounds = await page.locator("#jump-button").boundingBox();
  const cabinetBounds = await page.locator(".frame").boundingBox();
  expect(jumpBounds!.x).toBeGreaterThan(
    cabinetBounds!.x + cabinetBounds!.width * 0.7,
  );
  await page.locator("#jump-button").dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
  });
  await page.waitForTimeout(180);
  expect(await app(page, "window.__DASH__.scene().player.y")).toBeLessThan(280);
  await page
    .locator("#jump-button")
    .dispatchEvent("pointerup", { pointerId: 1, pointerType: "touch" });
  await page.screenshot({ path: "test-results/mobile-landscape.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".portrait-message")).toBeVisible();
  await page.locator('[data-action="portrait"]').tap();
  await expect(page.locator(".portrait-message")).toBeHidden();
  await context.close();
});
