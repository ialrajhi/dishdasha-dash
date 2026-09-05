import { test, expect } from "@playwright/test";

test("cold loading protects the game, then every stage renders illustrated assets", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/arcade/**", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/?testing=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".asset-loading")).toBeVisible();
  await expect(page.locator("#ui-layer")).toHaveAttribute("inert", "");
  await page.evaluate(() => {
    (window as any).__DASH__.action("start");
    (window as any).__DASH__.action("levels");
  });
  expect(
    await page.evaluate(() =>
      (window as any).__DASH__.game.scene.isActive("Game"),
    ),
  ).toBe(false);
  release();
  await expect(page.locator(".asset-loading")).toHaveCount(0);
  await expect(page.locator("#phaser-game canvas")).toHaveAttribute(
    "width",
    "1280",
  );
  await expect(page.locator("#phaser-game canvas")).toHaveAttribute(
    "height",
    "720",
  );
  for (let level = 1; level <= 5; level++) {
    await page.evaluate(
      (level) => (window as any).__DASH__.start(level),
      level,
    );
    await page.waitForFunction(
      (level) =>
        (window as any).__DASH__.scene().level.id === level &&
        (window as any).__DASH__.scene().player.x > 240,
      level,
    );
    await page.waitForTimeout(380);
    const state = await page.evaluate(() => {
      const s = (window as any).__DASH__.scene();
      return {
        body: [s.player.bodyRef.width, s.player.bodyRef.height],
        hiddenRoot: !s.player.visible,
        hero: s.player.visual.texture.key,
        sync: Math.abs(s.player.visual.x - s.player.x),
        hazards: s.hazards.every((h: any) =>
          h.texture.key.startsWith("arcade-"),
        ),
        zoom: s.cameras.main.zoom,
        floor: s.textures.exists(`street-${s.level.id}`),
      };
    });
    expect(state.body).toEqual([19, 39]);
    expect(state.hiddenRoot).toBe(true);
    expect(state.hero).toMatch(/^hero-run/);
    expect(state.sync).toBeLessThan(0.1);
    expect(state.hazards).toBe(true);
    expect(state.zoom).toBe(2);
    expect(state.floor).toBe(true);
    await page
      .locator(".game-cabinet")
      .screenshot({ path: `test-results/arcade-stage-${level}.png` });
  }
  expect(errors).toEqual([]);
});

test("asset download failure offers recovery instead of a broken game", async ({
  page,
}) => {
  await page.route("**/hero-sheet.png", (route) => route.abort());
  await page.goto("/?testing=1");
  await expect(page.locator('[data-action="reload"]')).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).__DASH__.game.scene.isActive("Game"),
    ),
  ).toBe(false);
  await page.unroute("**/hero-sheet.png");
  await page.locator('[data-action="reload"]').click();
  await expect(page.locator(".asset-loading")).toHaveCount(0);
  await expect(page.locator(".game-title")).toBeVisible();
});
