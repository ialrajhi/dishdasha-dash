import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    // Campaign regression tests represent a player who already took the lesson.
    // onboarding.spec.ts explicitly uses empty storage to test a fresh install.
    storageState: { cookies: [], origins: [{ origin: "http://localhost:5173", localStorage: [
      { name: "dishdasha-dash:v1", value: JSON.stringify({ version: 2, tutorial: "completed" }) },
    ] }] },
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    },
  },
  reporter: "list",
});
