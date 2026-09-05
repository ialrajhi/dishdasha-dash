const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopGame', Object.freeze({ quit: () => ipcRenderer.invoke('game:quit'), fullscreen: () => ipcRenderer.invoke('game:fullscreen') }));
