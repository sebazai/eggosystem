import { type Page } from "@playwright/test";

/**
 * Wait for page to be fully ready with reliable strategy
 * Replaces networkidle which can be unreliable in CI environments
 */
export async function waitForPageReady(page: Page, timeout = 10000) {
  // Wait for DOM to be ready
  await page.waitForLoadState("domcontentloaded");

  // Wait for page to be fully rendered
  await page.waitForFunction(
    () => {
      return document.readyState === "complete";
    },
    { timeout }
  );

  // Wait for any loading states to disappear
  await page.waitForFunction(
    () => {
      const loadingElements = document.querySelectorAll(
        '[data-loading="true"]'
      );
      return loadingElements.length === 0;
    },
    { timeout }
  );
}

/**
 * Wait for authentication context to be ready
 * Looks for auth-related elements or state
 */
export async function waitForAuthReady(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      // Look for auth-related elements or state
      const authElements = document.querySelectorAll('[data-auth="ready"]');
      const userElements = document.querySelectorAll("[data-user]");
      return authElements.length > 0 || userElements.length > 0;
    },
    { timeout }
  );
}

/**
 * Wait for specific content to be visible
 * More reliable than waiting for network idle
 */
export async function waitForContentVisible(
  page: Page,
  selector: string,
  timeout = 10000
) {
  await page.waitForSelector(selector, { state: "visible", timeout });
}

/**
 * Wait for page navigation to complete
 * Combines multiple wait strategies for reliability
 */
export async function waitForNavigationComplete(page: Page, timeout = 10000) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForSelector("body", { state: "visible", timeout });

  // Wait for any initial loading to complete
  await page.waitForFunction(
    () => {
      const loadingElements = document.querySelectorAll(
        '[data-loading="true"]'
      );
      return loadingElements.length === 0;
    },
    { timeout }
  );
}

/**
 * Wait for API calls to complete by checking for loading states
 * Alternative to networkidle that's more reliable
 */
export async function waitForApiCallsComplete(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      // Check for common loading indicators
      const loadingSelectors = [
        '[data-loading="true"]',
        '[aria-busy="true"]',
        ".loading",
        ".spinner",
        '[class*="loading"]'
      ];

      for (const selector of loadingSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return false; // Still loading
        }
      }

      return true; // No loading indicators found
    },
    { timeout }
  );
}
