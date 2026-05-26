import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3001);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: IS_CI ? 1 : 0,
  reporter: IS_CI ? [["html", { open: "never" }], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: IS_CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
    video: IS_CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      DB_NAME: process.env.DB_NAME_TEST ?? "cortala_test",
      DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
      DB_USER: process.env.DB_USER ?? "root",
      DB_PASSWORD: process.env.DB_PASSWORD ?? "root",
      NEXT_PUBLIC_BASE_URL: BASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-test-secret-do-not-use-in-prod",
      CLICK_QUEUE_DISABLED: "1",
    },
  },
});
