const { app, BrowserWindow, protocol, session, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');

app.setName('Dishdasha Dash');
protocol.registerSchemesAsPrivileged([{ scheme: 'dishdasha', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
let mainWindow;
const toggleFullscreen = () => {
  if (process.platform === 'darwin') mainWindow.setSimpleFullScreen(!mainWindow.isSimpleFullScreen());
  else mainWindow.setFullScreen(!mainWindow.isFullScreen());
};
const origin = 'dishdasha://game';
const isLocal = value => { try { const u = new URL(value); return u.protocol === 'dishdasha:' && u.host === 'game'; } catch { return false; } };
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-src 'none'";
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.whenReady().then(() => {
    const root = path.resolve(__dirname, '../dist');
    protocol.handle('dishdasha', async request => {
      if (!isLocal(request.url) || request.method !== 'GET') return new Response('Forbidden', { status: 403 });
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Bad request', { status: 400 }); }
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('Not found', { status: 404 });
      const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' }[path.extname(file)] || 'application/octet-stream';
      return new Response(await fsp.readFile(file), { headers: { 'Content-Type': mime } });
    });
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !isLocal(details.url) && !details.url.startsWith('devtools:') }));
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [csp] } }));
    ipcMain.handle('game:quit', event => { if (event.sender === mainWindow?.webContents && isLocal(event.senderFrame.url)) app.quit(); });
    ipcMain.handle('game:fullscreen', event => { if (event.sender === mainWindow?.webContents && isLocal(event.senderFrame.url)) toggleFullscreen(); });
    const createWindow = () => {
      mainWindow = new BrowserWindow({ width: 1280, height: 760, minWidth: 800, minHeight: 450, title: 'Dishdasha Dash', backgroundColor: '#101e32', autoHideMenuBar: true, show: false,
        icon: path.join(root, 'app-icon.png'), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, devTools: !app.isPackaged } });
      mainWindow.removeMenu();
      mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      mainWindow.webContents.on('will-navigate', (event, url) => { if (!isLocal(url)) event.preventDefault(); });
      mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
      mainWindow.webContents.on('before-input-event', (event, input) => { if (input.type === 'keyDown' && input.key === 'F11') { event.preventDefault(); toggleFullscreen(); } });
      mainWindow.once('ready-to-show', () => mainWindow.show());
      mainWindow.loadURL(origin + '/');
    };
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => app.quit());
}
