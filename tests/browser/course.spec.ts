import { test, expect } from "@playwright/test";
test("plays every full-length course with normal physics, jumping and ducking", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/?testing=1");
  await page.waitForFunction(
    () => !!(window as any).__DASH__?.game.scene.isActive("Menu"),
  );
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(200);
  const report = await page.evaluate(async () => {
    const dash = (window as any).__DASH__;
    const game = dash.game;
    game.loop.stop();
    const report: any[] = [];
    let timestamp = performance.now();
    for (let level = 1; level <= 5; level++) {
      if (level > 1) {
        dash.action("next");
        game.step((timestamp += 16.667), 16.667);
      }
      let frames = 0;
      let releaseAt = 0;
      let highest = 300;
      while (dash.ui.screen === "playing" && frames < 7200) {
        const s = dash.scene();
        const p = s.player;
        if (p && s.phase === "running") {
          const speed = s.level.speed;
          const grounded = p.bodyRef.blocked.down || p.bodyRef.touching.down;
          const targets = [
            ...s.hazards
              .filter((h: any) => !h.hit && h.x >= p.x - 15)
              .map((h: any) => ({ x: h.x, kind: h.spec.kind === "awning" ? "duck" : "obstacle" })),
            ...s.course.gaps
              .filter((g: any) => g.x + g.width >= p.x)
              .map((g: any) => ({ x: g.x + 20, kind: "gap" })),
            ...s.collectibles
              .filter((c: any) => c.active && c.spec.golden && c.x >= p.x - 15)
              .map((c: any) => ({ x: c.x, kind: "gold" })),
          ];
          const next = targets.sort((a: any, b: any) => a.x - b.x)[0];
          const overhead = s.hazards.find((h: any) => h.spec.kind === 'awning' && h.hitbox().right > p.bodyRef.left && h.x - p.x < 125);
          if (overhead) s.pressDuck('bot'); else s.releaseDuck('bot');
          if (
            !overhead && next?.kind !== 'duck' && grounded &&
            next &&
            next.x - p.x < speed * 0.37 + 12 &&
            next.x - p.x > 0
          ) {
            s.pressJump();
            releaseAt = s.gameTime + 660;
          }
          if (s.gameTime >= releaseAt && p.held) s.releaseJump();
          highest = Math.min(highest, p.y);
        }
        game.step((timestamp += 16.667), 16.667);
        frames++;
        if (frames % 240 === 0) await new Promise((r) => setTimeout(r, 0));
      }
      const s = dash.scene();
      report.push({
        level,
        screen: dash.ui.screen,
        score: s.score.score,
        tea: s.score.tea,
        hearts: s.hearts,
        lives: s.lives,
        deaths: s.score.deaths,
        overheadHits: s.hazards.filter((h:any) => h.spec.kind === "awning" && h.hit).length,
        frames,
        highest,
        distance: s.player.x,
        length: s.course.length,
      });
      if (!["complete", "victory"].includes(dash.ui.screen)) break;
    }
    game.loop.start(game.step.bind(game));
    return report;
  });
  console.log("Full course playthrough", JSON.stringify(report));
  expect(report).toHaveLength(5);
  for (const r of report) {
    expect(r.screen).toBe(r.level === 5 ? "victory" : "complete");
    expect(r.distance).toBeGreaterThanOrEqual(r.length);
    expect(r.tea).toBeGreaterThan(10);
    expect(r.highest).toBeLessThan(230);
    expect(r.deaths).toBeLessThan(3);
    expect(r.overheadHits).toBe(0);
  }
  await page.screenshot({ path: "test-results/full-playthrough-victory.png" });
});
