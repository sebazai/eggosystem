import { defineConfig, devices } from "@playwright/test";

const isIntegration = process.env.TEST_TYPE === "integration";
const isCI = process.env.CI;
console.log(
  `[Playwright] Using webServer: ${isIntegration ? "pnpm dev" : isCI ? "standalone build" : "pnpm dev"}`
);

export default defineConfig({
  testDir: "./src/__tests__",
  fullyParallel: true,
  forbidOnly: !!isCI,
  // Add retries to handle potential initial compilation
  retries: isCI ? 1 : 0,
  workers: undefined,
  // Configure multiple reporters
  reporter: [
    ["html", { outputFolder: "playwright-report" }], // HTML report
    ["junit", { outputFile: "test-results/junit-report.xml" }], // JUnit XML for GitLab
    ["list"] // Console output
  ],

  // Set a reasonable timeout
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: {
      mode: "only-on-failure",
      fullPage: true
    },
    headless: true
  },
  projects: [
    {
      name: "integration",
      testDir: "./src/__tests__/integration",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" }
    },
    {
      name: "e2e",
      testDir: "./src/__tests__/e2e",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" }
    }
  ],
  // Run the frontend server as part of the test
  webServer: {
    command: isIntegration
      ? "pnpm run dev"
      : isCI
        ? "pnpm start:standalone"
        : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 20000 // Give the server enough time to start
  }
});
