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

test('hero cadence follows actual travel through acceleration, stops, ducking and respawn', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.asset-loading')).toHaveCount(0);
  await page.evaluate(() => (window as any).__DASH__.start(1));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const result = await page.evaluate(() => {
    const d = (window as any).__DASH__, s = d.scene(), p = s.player; d.game.loop.sleep();
    p.state = 'run'; p.resetVisual(); p.bodyRef.blocked.down = true;
    const origin = p.x, samples: any[] = [];
    for (const speed of [0, 40, 80, 160, 240, 80, 0]) {
      p.capturePrevious(); p.x += speed * .1; p.syncMovement(.1);
      for (const alpha of [0, .25, .5, .75, 1]) {
        p.present(alpha); p.animate(1000);
        const travel = p.visual.x - origin;
        samples.push({speed, frame: Number(p.visual.texture.key.split('-').pop()), travel, rate: p.gait.playbackRate});
      }
    }
    const phase = p.gait.sample(); p.state = 'duck'; p.setDucking(true); p.animate(1000);
    const duck = p.gait.sample(); p.state = 'run'; p.setDucking(false); p.animate(1000);
    const run = p.gait.sample();
    p.bodyRef.reset(210, 300); p.resetVisual(); p.animate(1000);
    return {samples, phase, duck, run, reset: [p.gait.sample(), p.visual.x, p.visual.texture.key]};
  });
  for (const sample of result.samples) {
    expect(sample.frame).toBe(Math.floor(sample.travel / 80 * 12 + 1e-7) % 12);
    expect(sample.rate).toBeCloseTo(sample.speed / 160);
  }
  expect(result.duck).toBe(result.phase); expect(result.run).toBe(result.phase);
  expect(result.reset).toEqual([0, 210, 'hero-run-stride-0']);
});

test('boy frame boundaries follow his interpolated position, including when hazards stop', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.asset-loading')).toHaveCount(0);
  await page.evaluate(() => (window as any).__DASH__.start(2));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const samples = await page.evaluate(() => {
    const d = (window as any).__DASH__, s = d.scene(); d.game.loop.sleep();
    const kid = s.hazards.find((h:any) => h.spec.kind === 'kid');
    kid.motionStart = 0; const origin = kid.x, samples: any[] = [];
    for (let step = 1; step <= 100; step++) {
      kid.capturePrevious(); kid.tick(step * 1000 / 60, kid.x, 2, 1 / 60);
      for (const alpha of [0, .5, 1]) {
        kid.present(alpha);
        const renderedX = kid.x + (kid.width / 2 - kid.displayOriginX) * kid.scaleX;
        samples.push({travel: origin - renderedX, frame: Number(kid.texture.key.split('-').pop()), y: kid.y});
      }
    }
    // Completion stops ticking hazards, but rendering continues.
    kid.capturePrevious();
    for (const alpha of [0, .5, 1]) {
      kid.present(alpha);
      samples.push({travel: origin - kid.x, frame: Number(kid.texture.key.split('-').pop()), y:kid.y});
    }
    return samples;
  });
  for (const sample of samples) {
    expect(sample.frame).toBe(Math.floor(sample.travel / 28 * 12 + 1e-7) % 12);
    expect(sample.y).toBe(300);
  }
});

test('jump and landing gait stay identical at 15, 60 and 120 Hz with no running at the apex', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.asset-loading')).toHaveCount(0);
  await page.evaluate(() => (window as any).__DASH__.start(1));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const reports = await page.evaluate(() => {
    const d = (window as any).__DASH__, s = d.scene(), p = s.player; d.game.loop.sleep();
    const reports: any[] = [];
    for (const hz of [15, 60, 120]) {
      s.stepAccumulator = 0; s.gameTime = 0;
      p.bodyRef.reset(210, 300); p.setVelocity(145, 0); p.setGravityY(0);
      p.state = 'run'; p.lastGrounded = 0; p.wasGrounded = true; p.held = true;
      p.bufferedAt = 0; p.resetVisual();
      let apexSamples = 0, wrongPoses = 0, airPhaseChanges = 0;
      const originalTick = s.tick.bind(s);
      s.tick = (dt:number) => {
        const before = p.gait.sample();
        originalTick(dt);
        if (p.y < 290) {
          if (!['jump', 'fall'].includes(p.state)) wrongPoses++;
          if (Math.abs(p.bodyRef.velocity.y) < 20) apexSamples++;
        }
        // At the end of each airborne step, syncMovement must have frozen the phase.
        if (p.y < 290 && p.gait.sample(0) !== before) airPhaseChanges++;
      };
      for (let i = 0; i < hz * 2; i++) s.update(i * 1000 / hz, 1000 / hz);
      s.tick = originalTick;
      reports.push({hz, apexSamples, wrongPoses, airPhaseChanges, x:p.x, y:p.y, phase:p.gait.sample(), frame:p.visual.texture.key});
    }
    return reports;
  });
  for (const report of reports) {
    expect(report.apexSamples).toBeGreaterThan(0);
    expect(report.wrongPoses).toBe(0); expect(report.airPhaseChanges).toBe(0);
    expect(report.x).toBeCloseTo(reports[0].x, 7);
    expect(report.y).toBeCloseTo(reports[0].y, 7);
    expect(report.phase).toBeCloseTo(reports[0].phase, 7);
    expect(report.frame).toBe(reports[0].frame);
  }
});
