import { test, expect, type Page } from '@playwright/test';
test.use({storageState:{cookies:[],origins:[]}});
async function ready(page: Page) {
  await page.goto('/?testing=1');
  await expect(page.locator('.asset-loading')).toHaveCount(0);
}
test('fresh player learns both moves with normal physics, retries safely, and saves completion', async ({page}) => {
  await ready(page);
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('.practice-card')).toContainText('Jump over the box');
  const x = await page.evaluate(() => (window as any).__DASH__.scene().player.x);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as any).__DASH__.scene().player.x)).toBe(x);
  // A very short hop fails the lesson safely; no campaign points or hearts change.
  await page.keyboard.down('Space');await page.waitForTimeout(35);await page.keyboard.up('Space');
  await expect(page.locator('.practice-card')).toContainText('Try again');
  expect(await page.evaluate(() => {const d=(window as any).__DASH__;return {hearts:d.scene().hearts,lives:d.scene().lives,score:d.scene().score.score,levels:d.save.data.levels,best:d.save.data.best};})).toEqual({hearts:3,lives:3,score:0,levels:{},best:0});
  await page.keyboard.down('Space');await page.waitForTimeout(600);await page.keyboard.up('Space');
  await expect(page.locator('.practice-card')).toContainText('Hold Duck');
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="resume"]').click();
  await expect(page.locator('.practice-card')).toContainText('Hold Duck');
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('.practice-card')).toContainText('Ready for the neighborhood');
  await page.keyboard.up('ArrowDown');
  await page.screenshot({path:'test-results/practice-complete.png'});
  expect(await page.evaluate(() => (window as any).__DASH__.save.data.tutorial)).toBe('completed');
  expect(await page.evaluate(() => (window as any).__DASH__.save.data.levels)).toEqual({});
  await page.locator('[data-action="practice-finish"]').click();
  await expect(page.locator('.practice-card')).toHaveCount(0);
  await expect(page.locator('#level-label')).toContainText('الفريج');
  await ready(page);
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('.practice-card')).toHaveCount(0);
});

test('touch practice can be skipped, replayed from help, and remains usable on a phone', async ({browser}) => {
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,storageState:{cookies:[],origins:[]}});
  const page=await context.newPage();await ready(page);
  await page.locator('[data-action="start"]').tap();
  await expect(page.locator('.practice-card')).toContainText('Jump over the box');
  await page.screenshot({path:'test-results/practice-phone.png'});
  const b=await page.locator('[data-action="practice-skip"]').boundingBox();expect(b!.height).toBeGreaterThanOrEqual(44);
  await page.locator('[data-action="practice-skip"]').tap();
  expect(await page.evaluate(()=>(window as any).__DASH__.save.data.tutorial)).toBe('skipped');
  await page.locator('[data-action="pause"]').tap();await page.locator('button[data-action="menu"]').tap();
  await page.locator('[data-action="how"]').tap();await page.locator('[data-action="practice"]').tap();
  const jump=await page.locator('#jump-button').boundingBox();
  await page.mouse.move(jump!.x+jump!.width/2,jump!.y+jump!.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();
  await expect(page.locator('.practice-card')).toContainText('Hold Duck');
  const duck=await page.locator('#duck-button').boundingBox();
  await page.mouse.move(duck!.x+duck!.width/2,duck!.y+duck!.height/2);await page.mouse.down();
  await expect(page.locator('.practice-card')).toContainText('Ready for the neighborhood');await page.mouse.up();
  await context.close();
});

test('controller can complete practice and select Start game without a mouse', async ({page}) => {
  await ready(page);
  await page.evaluate(() => {
    const buttons=Array.from({length:17},()=>({pressed:false,value:0,touched:false}));
    (window as any).__pad={id:'Practice controller',index:0,mapping:'standard',connected:true,buttons,axes:[0,0,0,0],timestamp:0};
    Object.defineProperty(navigator,'getGamepads',{value:()=>[(window as any).__pad]});
  });
  const press=async (index:number,on:boolean)=>{await page.evaluate(({index,on})=>{(window as any).__pad.buttons[index].pressed=on;},{index,on});await page.waitForTimeout(80);};
  await press(0,true);await press(0,false);
  await expect(page.locator('.practice-card')).toContainText('Jump over the box');
  await press(0,true);await page.waitForTimeout(550);await press(0,false);
  await expect(page.locator('.practice-card')).toContainText('Hold Duck');
  await press(1,true);
  await expect(page.locator('.practice-card')).toContainText('Ready for the neighborhood');
  await press(1,false);await press(0,true);await press(0,false);
  await expect(page.locator('.practice-card')).toHaveCount(0);
  await expect(page.locator('#level-label')).toContainText('الفريج');
});
