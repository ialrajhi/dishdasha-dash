import { beforeEach, it, expect, vi } from 'vitest';
const memory = new Map<string,string>();
const nativeMemory = { value: '', reads: 0, failRead: false, writes: [] as string[] };
const snapshot = (revision:number, unlocked:number) => JSON.stringify({version:2,revision,unlocked,best:5000,levels:{},settings:{language:'en'}});
beforeEach(() => {
  vi.resetModules();memory.clear();nativeMemory.value='';nativeMemory.reads=0;nativeMemory.failRead=false;nativeMemory.writes=[];
  vi.stubGlobal('localStorage',{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)});
  vi.stubGlobal('document',{body:{classList:{add:vi.fn()}}});
  vi.stubGlobal('window',{dispatchEvent:vi.fn()});
  vi.stubGlobal('location',{protocol:'https:'});
  vi.doMock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true}}));
  vi.doMock('@capacitor/app',()=>({App:{addListener:vi.fn()}}));
  vi.doMock('@capacitor/preferences',()=>({Preferences:{
    get:async()=>{nativeMemory.reads++;if(nativeMemory.failRead&&nativeMemory.reads===1)throw Error('read interrupted');return {value:nativeMemory.value};},
    set:async({value}:{value:string})=>{nativeMemory.value=value;nativeMemory.writes.push(value);},
  }}));
});
it('keeps a newer local reset after an interrupted native reset write',async()=>{
  const {SAVE_KEY}=await import('../src/config/Constants');
  memory.set(SAVE_KEY,snapshot(12,1));nativeMemory.value=snapshot(10,5);
  const {initializePlatform}=await import('../src/platform/Platform');
  const {save}=await import('../src/systems/SaveManager');
  await initializePlatform();
  expect(save.data.unlocked).toBe(1);expect(JSON.parse(nativeMemory.value).unlocked).toBe(1);
  expect(save.data.revision).toBe(13);
});
it('restores native progress when browser storage is older',async()=>{
  const {SAVE_KEY}=await import('../src/config/Constants');
  memory.set(SAVE_KEY,snapshot(10,1));nativeMemory.value=snapshot(12,5);
  const {initializePlatform}=await import('../src/platform/Platform');
  const {save}=await import('../src/systems/SaveManager');
  await initializePlatform();
  expect(save.data.unlocked).toBe(5);expect(JSON.parse(memory.get(SAVE_KEY)!).unlocked).toBe(5);
});
it('retry recovers the native store and rejects already queued stale snapshots',async()=>{
  const {SAVE_KEY}=await import('../src/config/Constants');
  memory.set(SAVE_KEY,snapshot(1,1));nativeMemory.value=snapshot(100,5);nativeMemory.failRead=true;
  const {initializePlatform}=await import('../src/platform/Platform');
  const {save}=await import('../src/systems/SaveManager');
  await initializePlatform();expect(save.storageAvailable).toBe(false);
  save.settings({volume:20});save.settings({volume:30});
  await save.flush();
  expect(nativeMemory.reads).toBe(2);
  expect(JSON.parse(nativeMemory.value).revision).toBe(100);
  expect(save.data.unlocked).toBe(5);expect(save.storageAvailable).toBe(true);
  expect(JSON.parse(memory.get(SAVE_KEY)!).unlocked).toBe(5);
  expect(nativeMemory.writes).toEqual([]);
});
it('keeps recovered native progress over an equal-revision queued local snapshot',async()=>{
  const {SAVE_KEY}=await import('../src/config/Constants');
  memory.set(SAVE_KEY,snapshot(98,1));nativeMemory.value=snapshot(100,5);nativeMemory.failRead=true;
  const {initializePlatform}=await import('../src/platform/Platform');
  const {save}=await import('../src/systems/SaveManager');
  await initializePlatform();
  save.settings({volume:20});save.settings({volume:30});
  await save.flush();
  expect(save.data.unlocked).toBe(5);
  expect(JSON.parse(nativeMemory.value).unlocked).toBe(5);
  expect(JSON.parse(nativeMemory.value).revision).toBe(100);
  expect(nativeMemory.writes).toEqual([]);
});
