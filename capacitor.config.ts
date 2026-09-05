import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.falrajhi.dishdashadash',
  appName: 'Dishdasha Dash',
  webDir: 'dist',
  backgroundColor: '#101e32',
  plugins: { SystemBars: { hidden: true, insetsHandling: 'css' } },
  android: { backgroundColor: '#101e32', allowMixedContent: false, webContentsDebuggingEnabled: false },
};
export default config;
