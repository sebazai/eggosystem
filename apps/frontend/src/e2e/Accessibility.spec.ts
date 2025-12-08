import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

// Baseline violation counts (as of 2025-12-05)
// Update these numbers as you fix violations
const BASELINE_VIOLATIONS = {
  homePage: {
    "button-name": 1,
    "color-contrast": 2,
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
  test("home page does not introduce new accessibility violations", async ({
    page
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
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
    await page.goto("/matches");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
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
    await page.goto("/matches/10154");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
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
