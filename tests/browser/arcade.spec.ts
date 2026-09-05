import { test, expect } from "@playwright/test";

test("menu stays still and running uses grounded alternating strides without branding", async ({ page }) => {
  await page.goto("/?testing=1");
  await expect(page.locator(".asset-loading")).toHaveCount(0);
  const menu = await page.evaluate(() => {
    const s = (window as any).__DASH__.game.scene.getScene("Menu");
    const before = [s.world.scenery.x, s.world.street.tilePositionX, s.runner.x, s.runner.y];
    const poses = [0, 7000, 11000, 13900].map(time => { s.update(time); return s.runner.texture.key; });
    return { before, after: [s.world.scenery.x, s.world.street.tilePositionX, s.runner.x, s.runner.y], poses };
  });
  expect(menu.after).toEqual(menu.before);
  expect(menu.poses).toEqual(["hero-idle", "hero-victoryWave", "hero-victoryFists", "hero-idle"]);
  await page.evaluate(() => (window as any).__DASH__.start(2));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  await expect(page.locator(".hud-brand")).toHaveCount(0);
  await expect(page.locator(".shell-header .wordmark")).toBeHidden();
  const gait = await page.evaluate(() => {
    const s = (window as any).__DASH__.scene();
    s.scene.pause();
    const p = s.player;
    p.state = "run";
    p.resetVisual();
    const hero = Array.from({length:12}, (_, i) => { p.x += 80 / 12; p.animate(i * 100); return p.visual.texture.key; });
    const stationary = p.visual.texture.key;
    p.animate(9000);
    const kid = s.hazards.find((h: any) => h.spec.kind === "kid");
    const feet: number[] = [];
    kid.motionStart = 0;
    const boy = Array.from({length:12}, (_, i) => { kid.tick(i * (28 / 12) / 38 * 1000 + 1, kid.x, 2); feet.push(kid.y); return kid.texture.key; });
    return { hero, stationary, stopped: p.visual.texture.key, boy, feet };
  });
  expect(new Set(gait.hero).size).toBe(12);
  expect(gait.stopped).toBe(gait.stationary);
  expect(new Set(gait.boy).size).toBe(12);
  expect(new Set(gait.feet).size).toBe(1);
});

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
    "1920",
  );
  await expect(page.locator("#phaser-game canvas")).toHaveAttribute(
    "height",
    "1080",
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
    expect(state.sync).toBeLessThan(4); // Render interpolation trails physics by at most one step.
    expect(state.hazards).toBe(true);
    expect(state.zoom).toBe(3);
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
  await page.route("**/hero-sheet.webp", (route) => route.abort());
  await page.goto("/?testing=1");
  await expect(page.locator('[data-action="reload"]')).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).__DASH__.game.scene.isActive("Game"),
    ),
  ).toBe(false);
  await page.unroute("**/hero-sheet.webp");
  await page.locator('[data-action="reload"]').click();
  await expect(page.locator(".asset-loading")).toHaveCount(0);
  await expect(page.locator(".game-title")).toBeVisible();
});
