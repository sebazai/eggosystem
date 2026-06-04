import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI;
console.log(`[Playwright] Using webServer: standalone build`);

export default defineConfig({
  testDir: "./src/e2e",
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

  // CI needs more time for signup status + org list + player lookups under parallel load
  timeout: isCI ? 60000 : 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: {
      mode: "only-on-failure",
      fullPage: true
    },
    video: isCI ? "off" : "retain-on-failure",
    headless: true
  },
  projects: [
    {
      name: "e2e",
      use: { ...devices["Desktop Chrome"], browserName: "chromium" }
    }
  ],
  // Run the frontend server as part of the test
  webServer: {
    command: "pnpm start:standalone",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 20000 // Give the server enough time to start
  }
});
