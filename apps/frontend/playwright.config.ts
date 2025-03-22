import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Add retries to handle potential initial compilation
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  // Configure multiple reporters for CI environment
  reporter: [
    ["html", { outputFolder: "playwright-report" }], // HTML report
    ["junit", { outputFile: "test-results/junit-report.xml" }], // JUnit XML for GitLab
    ["list"] // Console output
  ],

  // Set a reasonable timeout
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  // Run the frontend server as part of the test
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60000 // Give the server enough time to start
  }
});
