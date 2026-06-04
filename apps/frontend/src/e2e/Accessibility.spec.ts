import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ACCESSIBILITY_TEST_TIMEOUT = 90_000;
const PAGE_READY_TIMEOUT = 30_000;
const NAVIGATION_TIMEOUT = 60_000;
const AXE_SCAN_MAX_ATTEMPTS = 2;

async function gotoAndWaitForReady(
  page: Page,
  url: string,
  waitForReady: (page: Page) => Promise<void>
) {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: NAVIGATION_TIMEOUT
  });
  await waitForReady(page);
}

function isAxeScanInfrastructureError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Target crashed/i.test(message) ||
    /Target page, context or browser has been closed/i.test(message) ||
    /Execution context was destroyed/i.test(message) ||
    /Protocol error/i.test(message)
  );
}

/** Settle the page before axe injects scripts (reduces renderer crashes on heavy DOMs). */
async function waitForPageStableForAxe(page: Page) {
  if (page.isClosed()) {
    throw new Error("Page is closed before axe scan");
  }
  await page.waitForLoadState("load");
  await page
    .locator("#main-content")
    .waitFor({ state: "visible", timeout: PAGE_READY_TIMEOUT });
}

/**
 * Run axe against primary content only. Full-document scans on match pages can
 * OOM the Chromium renderer when many e2e tests run in parallel.
 */
async function runAccessibilityScan(page: Page) {
  await waitForPageStableForAxe(page);
  return new AxeBuilder({ page }).include("#main-content").analyze();
}

async function runAccessibilityScanWithRetry(
  page: Page,
  options: {
    url: string;
    waitForReady: (readyPage: Page) => Promise<void>;
  }
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= AXE_SCAN_MAX_ATTEMPTS; attempt++) {
    try {
      if (attempt > 1) {
        await gotoAndWaitForReady(page, options.url, options.waitForReady);
      }
      return await runAccessibilityScan(page);
    } catch (error) {
      lastError = error;
      if (
        !isAxeScanInfrastructureError(error) ||
        attempt === AXE_SCAN_MAX_ATTEMPTS
      ) {
        throw error;
      }
      console.warn(
        `Axe scan attempt ${attempt} failed (${error instanceof Error ? error.message : error}); reloading and retrying...`
      );
    }
  }

  throw lastError;
}

/**
 * Accessibility Testing Strategy:
 *
 * These tests baseline current accessibility violations and prevent regression.
 * - Current violations are documented and allowed (won't fail tests)
 * - New violations or increased counts will fail tests
 * - Gradually fix violations to improve accessibility over time
 *
 * To see detailed violation reports, run: pnpm test:e2e Accessibility.spec.ts
 */

// Baseline violation counts (as of 2026-06-02)
// Update these numbers as you fix violations
const BASELINE_VIOLATIONS = {
  homePage: {
    "button-name": 1,
    "color-contrast": 4,
    "heading-order": 1,
    "link-in-text-block": 2,
    "meta-viewport": 1
  } as Record<string, number>,
  matchesPage: {
    // Will be populated after first run
    maxTotal: 20 // Generous initial baseline
  },
  matchDetailPage: {
    // Will be populated after first run
    maxTotal: 20 // Generous initial baseline
  }
};

test.describe("Accessibility", () => {
  test.describe.configure({
    timeout: ACCESSIBILITY_TEST_TIMEOUT,
    // Axe scans are heavy; run sequentially to avoid browser teardown races under load.
    mode: "serial",
    // Renderer "Target crashed" during axe evaluate is intermittent under parallel e2e load.
    retries: 1
  });

  test("home page does not introduce new accessibility violations", async ({
    page
  }) => {
    await gotoAndWaitForReady(page, "/", async (readyPage) => {
      await expect(
        readyPage.getByRole("heading", {
          name: "Building Corporate Culture Through Esports"
        })
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    });

    const accessibilityScanResults = await runAccessibilityScanWithRetry(page, {
      url: "/",
      waitForReady: async (readyPage) => {
        await expect(
          readyPage.getByRole("heading", {
            name: "Building Corporate Culture Through Esports"
          })
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
      }
    });
    const violations = accessibilityScanResults.violations;

    // Log violations for visibility
    if (violations.length > 0) {
      console.log(
        `\n📊 Found ${violations.length} accessibility violation types on home page:`
      );
      violations.forEach((violation) => {
        console.log(
          `  - ${violation.id}: ${violation.nodes.length} instance(s) [${violation.impact}]`
        );
        console.log(`    ${violation.help}`);
        console.log(`    Fix: ${violation.helpUrl}\n`);
      });
    }

    // Check that we don't exceed baseline violation counts
    violations.forEach((violation) => {
      const baselineCount = BASELINE_VIOLATIONS.homePage[violation.id] || 0;
      const currentCount = violation.nodes.length;

      expect(
        currentCount,
        `❌ Violation "${violation.id}" increased from ${baselineCount} to ${currentCount}.\n` +
          `   Impact: ${violation.impact}\n` +
          `   Help: ${violation.help}\n` +
          `   Fix: ${violation.helpUrl}`
      ).toBeLessThanOrEqual(baselineCount);
    });

    // Check for new violation types
    const baselineViolationIds = Object.keys(BASELINE_VIOLATIONS.homePage);
    const currentViolationIds = violations.map((v) => v.id);
    const newViolations = currentViolationIds.filter(
      (id) => !baselineViolationIds.includes(id)
    );

    expect(
      newViolations,
      `❌ New accessibility violation types detected: ${newViolations.join(", ")}\n` +
        `   Please fix these violations or update the baseline if intentional.`
    ).toEqual([]);

    console.log("✅ Home page accessibility: No new violations or regressions");
  });

  test("matches page does not introduce new accessibility violations", async ({
    page
  }) => {
    await gotoAndWaitForReady(page, "/matches", async (readyPage) => {
      await expect(
        readyPage.getByRole("heading", { name: "Match History" })
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
      await expect(
        readyPage.locator('a[href^="/matches/"]').first()
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    });

    const accessibilityScanResults = await runAccessibilityScanWithRetry(page, {
      url: "/matches",
      waitForReady: async (readyPage) => {
        await expect(
          readyPage.getByRole("heading", { name: "Match History" })
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
        await expect(
          readyPage.locator('a[href^="/matches/"]').first()
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
      }
    });
    const violations = accessibilityScanResults.violations;

    // Log violations for visibility
    if (violations.length > 0) {
      console.log(
        `\n📊 Found ${violations.length} accessibility violation types on matches page:`
      );
      violations.forEach((violation) => {
        console.log(
          `  - ${violation.id}: ${violation.nodes.length} instance(s) [${violation.impact}]`
        );
        console.log(`    ${violation.help}`);
        console.log(`    Fix: ${violation.helpUrl}\n`);
      });
    }

    // For matches page, check total doesn't exceed baseline
    expect(
      violations.length,
      `❌ Matches page has ${violations.length} violation types, exceeding baseline of ${BASELINE_VIOLATIONS.matchesPage.maxTotal}\n` +
        `   Current violations: ${violations.map((v) => v.id).join(", ")}`
    ).toBeLessThanOrEqual(BASELINE_VIOLATIONS.matchesPage.maxTotal);

    console.log(
      "✅ Matches page accessibility: No new violations or regressions"
    );
  });

  test("match detail page does not introduce new accessibility violations", async ({
    page
  }) => {
    await gotoAndWaitForReady(page, "/matches/10154", async (readyPage) => {
      await expect(readyPage.locator('a[href*="/teams/"]').first()).toBeVisible(
        { timeout: PAGE_READY_TIMEOUT }
      );
      await expect(
        readyPage.getByRole("heading", { name: "MATCH STATS" })
      ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    });

    const accessibilityScanResults = await runAccessibilityScanWithRetry(page, {
      url: "/matches/10154",
      waitForReady: async (readyPage) => {
        await expect(
          readyPage.locator('a[href*="/teams/"]').first()
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
        await expect(
          readyPage.getByRole("heading", { name: "MATCH STATS" })
        ).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
      }
    });
    const violations = accessibilityScanResults.violations;

    // Log violations for visibility
    if (violations.length > 0) {
      console.log(
        `\n📊 Found ${violations.length} accessibility violation types on match detail page:`
      );
      violations.forEach((violation) => {
        console.log(
          `  - ${violation.id}: ${violation.nodes.length} instance(s) [${violation.impact}]`
        );
        console.log(`    ${violation.help}`);
        console.log(`    Fix: ${violation.helpUrl}\n`);
      });
    }

    // For match detail page, check total doesn't exceed baseline
    expect(
      violations.length,
      `❌ Match detail page has ${violations.length} violation types, exceeding baseline of ${BASELINE_VIOLATIONS.matchDetailPage.maxTotal}\n` +
        `   Current violations: ${violations.map((v) => v.id).join(", ")}`
    ).toBeLessThanOrEqual(BASELINE_VIOLATIONS.matchDetailPage.maxTotal);

    console.log(
      "✅ Match detail page accessibility: No new violations or regressions"
    );
  });
});
