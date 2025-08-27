import { defineConfig, devices } from "@playwright/test";

const isCI = process.env.CI;
console.log(`[Playwright] Using webServer: standalone build`);

export default defineConfig({
  testDir: "./src/e2e",
  fullyParallel: true,
  forbidOnly: !!isCI,
  // Increase retries for CI to handle flaky tests
  retries: isCI ? 2 : 0,
  workers: undefined,
  // Configure multiple reporters
  reporter: [
    ["html", { outputFolder: "playwright-report" }], // HTML report
    ["junit", { outputFile: "test-results/junit-report.xml" }], // JUnit XML for GitLab
    ["list"] // Console output
  ],

  // Increase timeout for E2E tests to handle API calls
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: {
      mode: "only-on-failure",
      fullPage: true
    },
    headless: true,
    // Add action timeout
    actionTimeout: 10000,
    // Add navigation timeout
    navigationTimeout: 30000
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
    timeout: 30000 // Give the server enough time to start
  }
});
