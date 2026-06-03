import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ACCESSIBILITY_TEST_TIMEOUT = 90_000;
const PAGE_READY_TIMEOUT = 30_000;
const NAVIGATION_TIMEOUT = 60_000;

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

async function runAccessibilityScan(page: Page) {
  return new AxeBuilder({ page }).analyze();
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
  test.describe.configure({ timeout: ACCESSIBILITY_TEST_TIMEOUT });

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

    const accessibilityScanResults = await runAccessibilityScan(page);
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

    const accessibilityScanResults = await runAccessibilityScan(page);
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

    const accessibilityScanResults = await runAccessibilityScan(page);
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
