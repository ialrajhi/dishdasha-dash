import { test, expect } from '@playwright/test';
test('120 Hz rendering advances between physics steps and steady view stays fixed', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
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
  await page.goto('/?testing=1'); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.evaluate(() => (window as any).__DASH__.start(1));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const result = await page.evaluate(() => {
    const d = (window as any).__DASH__, s = d.scene(), p = s.player; d.game.loop.sleep();
    p.state = 'run'; p.resetVisual(); p.bodyRef.blocked.down = true;
    const samples: any[] = [];
    // Pose time follows ground distance: each pose covers the planted foot's measured travel.
    const weights = [44, 47, 110, 22, 62, 40, 129, 22], total = weights.reduce((a, b) => a + b, 0), stride = total * 0.26;
    const poseAt = (phase: number) => { let edge = 0; for (let i = 0; i < 8; i++) { edge += weights[i] / total; if (phase < edge - 1e-7) return i; } return 0; };
    let phase = 0;
    for (const speed of [0, 40, 80, 160, 240, 80, 0]) {
      p.capturePrevious(); p.x += speed * .1; p.syncMovement(.1);
      if(speed === 0)phase = 0;
      for (const alpha of [0, .25, .5, .75, 1]) {
        p.present(alpha); p.animate(1000);
        samples.push({speed, texture:p.visual.texture.key, fps:p.gait.animationFPS, expectedFps: speed / stride * 8,
          expected:poseAt((phase + speed * .1 / stride * alpha) % 1)});
      }
      phase = (phase + speed * .1 / stride) % 1;
    }
    p.capturePrevious();p.x+=10;p.syncMovement(.1);p.present(1);p.animate(1000);
    phase = p.gait.sample(); p.state = 'duck'; p.setDucking(true); p.animate(1000);
    const duck = p.gait.sample(); p.state = 'run'; p.setDucking(false); p.animate(1000);
    const run = p.gait.sample();
    p.bodyRef.reset(210, 300); p.resetVisual(); p.animate(1000);
    return {samples, phase, duck, run, reset: [p.gait.sample(), p.visual.x, p.visual.texture.key]};
  });
  for (const sample of result.samples) {
    if(sample.speed===0){expect(sample.texture).toMatch(/^hero-idle/);expect(sample.fps).toBe(0);}
    else {expect(sample.texture).toBe('hero-run-stride-'+sample.expected);expect(sample.fps).toBeCloseTo(sample.expectedFps, 6);}
  }
  expect(result.duck).toBe(result.phase); expect(result.run).toBe(result.phase);
  expect(result.reset.slice(0,2)).toEqual([0, 210]);
  expect(result.reset[2]).toMatch(/^hero-idle/);
});

test('running, ducking, jumping and landing keep a constant visual scale and unchanged collision shapes', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
  await page.evaluate(() => (window as any).__DASH__.start(1));
  await page.waitForFunction(() => (window as any).__DASH__.scene()?.player?.x > 240);
  const report=await page.evaluate(()=>{
    const d=(window as any).__DASH__,s=d.scene(),p=s.player;d.game.loop.sleep();
    d.save.settings({steadyView:false,reducedMotion:false});
    s.pressJump();const frames:any[]=[];
    for(let i=0;i<90;i++){
      s.update(i*1000/60,1000/60);p.animate(s.gameTime);
      frames.push({state:p.state,texture:p.visual.texture.key,x:p.visual.scaleX,y:p.visual.scaleY,
        width:p.bodyRef.width,height:p.bodyRef.height,physicsY:p.y});
    }
    s.pressDuck('scale-test');s.update(0,1000/60);p.land();
    return {frames,duck:{height:p.bodyRef.height,width:p.bodyRef.width,x:p.visual.scaleX,y:p.visual.scaleY},
      tweens:s.tweens.getTweensOf(p.visual).length};
  });
  expect(report.frames.some(f=>f.state==='jump')).toBe(true);
  expect(report.frames.some(f=>f.state==='fall')).toBe(true);
  expect(report.frames.some(f=>f.state==='run')).toBe(true);
  for(const f of report.frames){
    expect([f.x,f.y,f.width,f.height]).toEqual([.26,.26,19,58]);
    if(f.state==='jump')expect(f.texture).toBe('hero-jumpUp');
    if(f.state==='fall')expect(f.texture).toBe('hero-fall');
  }
  expect(report.duck).toEqual({height:44,width:19,x:.26,y:.26});
  expect(report.tweens).toBe(0);
});

test('boy frame boundaries follow his interpolated position, including when hazards stop', async ({page}) => {
  await page.goto('/?testing=1'); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
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
  await page.goto('/?testing=1'); await expect(page.locator('.boot')).toHaveCount(0); await page.evaluate(() => (window as any).__DASH__.action('title-start'));
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
