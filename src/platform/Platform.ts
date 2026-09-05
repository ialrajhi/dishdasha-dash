import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { save, SaveManager } from '../systems/SaveManager';
import { SAVE_KEY } from '../config/Constants';

export const native = Capacitor.isNativePlatform();
export const desktop = location.protocol === 'dishdasha:';

export async function initializePlatform() {
  if (native || desktop) document.body.classList.add('packaged-game');
  if (!native) { save.persist(); return; }
  let nativeRead = false;
  let lastNativeRevision = -1;
  const readNewest = async () => {
    const { value } = await Preferences.get({ key: SAVE_KEY });
    const nativeSave = new SaveManager();
    if (nativeSave.hydrate(value)) {
      lastNativeRevision = nativeSave.data.revision;
      if (nativeSave.data.revision >= save.data.revision) {
        save.hydrate(value);
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(save.data)); } catch { /* Native storage remains authoritative. */ }
        window.dispatchEvent(new Event('save-recovered'));
      }
    }
    nativeRead = true;
  };
  // A failed native read must not silently turn Retry into localStorage-only saving.
  save.setWriter(async value => {
    if (!nativeRead) {
      await readNewest();
      value = JSON.stringify(save.data);
    }
    const revision = JSON.parse(value).revision ?? 0;
    if (revision <= lastNativeRevision) return;
    await Preferences.set({ key: SAVE_KEY, value });
    lastNativeRevision = revision;
  });
  try {
    await readNewest();
    save.persist();
    await save.flush();
  } catch { save.storageAvailable = false; }
}

export function platformEvents(pause: () => void, foreground: () => void, back: () => void) {
  if (!native) return;
  // onPause happens before onStop; quick Home/app-switch interruptions may never stop.
  void App.addListener('pause', pause);
  void App.addListener('resume', foreground);
  void App.addListener('appStateChange', state => state.isActive ? foreground() : pause());
  void App.addListener('backButton', back);
}

export function minimizeAndroid() { if (native) void App.minimizeApp(); }
