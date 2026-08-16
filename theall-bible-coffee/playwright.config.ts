import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Use the Chromium that ships with this environment when it is present, so the
 * smoke test does not need to download a browser.
 */
const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(PREINSTALLED_CHROMIUM) ? PREINSTALLED_CHROMIUM : undefined;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "off",
    // The feedback step copies to the clipboard.
    permissions: ["clipboard-read", "clipboard-write"],
    // Chromium is preinstalled in this environment; PLAYWRIGHT_BROWSERS_PATH
    // points Playwright at it, so no browser download is needed.
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
  },
});
