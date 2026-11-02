import { test, expect } from "@playwright/test";

test("menu stays still and running uses grounded alternating strides without branding", async ({ page }) => {
  await page.goto("/?testing=1");
  await page.waitForFunction(() => (window as any).__DASH__?.game.scene.isActive("Menu") && !document.querySelector("#ui-layer")?.hasAttribute("inert"));
  await expect(page.locator(".title-screen .press-start")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator(".menu-screen")).toBeVisible();
  const menu = await page.evaluate(() => {
    const s = (window as any).__DASH__.game.scene.getScene("Menu");
    const before = [s.world.scenery.x, s.world.street.tilePositionX, s.runner.x, s.runner.y];
    // Let him finish running over from the title spot, then the menu must hold still.
    s.update(0, 1000); s.update(0, 16);
    const before2 = [s.world.scenery.x, s.world.street.tilePositionX, s.runner.x, s.runner.y];
    const poses = [0, 7000, 11000, 13900].map(time => { s.update(time, 16); return s.runner.texture.key; });
    void before;
    return { before: before2, after: [s.world.scenery.x, s.world.street.tilePositionX, s.runner.x, s.runner.y], poses };
  });
  expect(menu.after).toEqual(menu.before);
  expect(menu.poses).toEqual(["hero-idle", "hero-victoryWave", "hero-idle", "hero-idleBreathe"]);
  await page.evaluate(() => (window as any).__DASH__.start(2));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  await expect(page.locator(".hud-brand")).toHaveCount(0);
  const gait = await page.evaluate(() => {
    const s = (window as any).__DASH__.scene();
    s.scene.pause();
    const p = s.player;
    p.state = "run";
    p.resetVisual();
    p.bodyRef.blocked.down = true;
    // Walk one full stride in fine steps: every authored pose must appear, short push-offs included.
    const hero = Array.from({length:48}, (_, i) => {
      p.capturePrevious(); p.x += 476 * 0.26 / 48; p.syncMovement(1 / 60); p.present(1); p.animate(i * 100);
      return p.visual.texture.key;
    });
    const stationary = p.visual.texture.key;
    p.capturePrevious(); p.syncMovement(1 / 60); p.present(1);
    p.animate(9000);
    const kid = s.hazards.find((h: any) => h.spec.kind === "kid");
    const feet: number[] = [];
    kid.motionStart = 0;
    const boy = Array.from({length:12}, (_, i) => {
      kid.capturePrevious(); kid.tick(i * (28 / 12) / 38 * 1000 + 1, kid.x, 2, (28 / 12) / 38);
      kid.present(1); feet.push(kid.y); return kid.texture.key;
    });
    return { hero, stationary, stopped: p.visual.texture.key, boy, feet };
  });
  expect(new Set(gait.hero).size).toBe(8);
  expect(gait.stopped).toMatch(/^hero-idle/);
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
  await expect(page.locator(".boot")).toBeVisible();
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
  await expect(page.locator(".boot")).toHaveCount(0);
  await expect(page.locator("#phaser-game canvas")).toHaveAttribute(
    "width",
    "1920",
  );
  await expect(page.locator("#phaser-game canvas")).toHaveAttribute(
    "height",
    "1080",
  );
  for (let level = 1; level <= 10; level++) {
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
        floor: s.textures.exists(`street-${s.level.night ? "night-" : ""}${s.level.art}`),
      };
    });
    expect(state.body).toEqual([19, 58]);
    expect(state.hiddenRoot).toBe(true);
    expect(state.hero).toMatch(/^hero-run/);
    expect(state.sync).toBeLessThan(4); // Render interpolation trails physics by at most one step.
    expect(state.hazards).toBe(true);
    expect(state.zoom).toBe(3);
    expect(state.floor).toBe(true);
    await page
      .locator(".frame")
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
  await expect(page.locator(".boot")).toHaveCount(0);
  await expect(page.locator(".title-screen .logo")).toBeVisible();
});
