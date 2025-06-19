import { expect, test, type Page } from "@playwright/test";

// Simple navigation helper using Playwright's built-in retry and timeout mechanisms
async function navigateToPage(page: Page, url: string) {
  await page.goto(url, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
}

test.describe("Email Verification Page", () => {
  test.describe("Success Cases", () => {
    test("should show success message and toast when token is valid", async ({
      page
    }) => {
      // E2E tests use real backend - use one of the valid tokens from seed
      await navigateToPage(page, "/verify-email?token=valid-token-123");

      // Wait for the page to load and process the verification
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check for success elements
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
      await expect(
        page.locator("text=Your email address was successfully verified.")
      ).toBeVisible();

      // Check for success icon using actual rendered classes
      await expect(page.locator("svg.lucide-circle-check-big")).toBeVisible();

      // Check for "Go to Home" button
      const homeButton = page.locator("button", { hasText: "Go to Home" });
      await expect(homeButton).toBeVisible();

      // Verify success toast appears
      await expect(
        page.locator("text=Email verified successfully!")
      ).toBeVisible();

      // Test navigation functionality
      await homeButton.click();
      await page.waitForURL("**/");
      expect(page.url()).toContain("/");
    });

    test("should handle successful verification without showing loading state for too long", async ({
      page
    }) => {
      // Use a different valid token to avoid conflict with first test
      await navigateToPage(page, "/verify-email?token=valid-token-456");

      // Should not show loading state for more than a few seconds
      const loadingElement = page.locator("text=Verifying your email...");

      // Wait for either success message or timeout
      await Promise.race([
        page
          .locator("h1")
          .filter({ hasText: "Email verified!" })
          .waitFor({ timeout: 10000 }),
        loadingElement.waitFor({ state: "hidden", timeout: 10000 })
      ]);

      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
    });
  });

  test.describe("Error Cases", () => {
    test("should show error message when token is invalid", async ({
      page
    }) => {
      // Use an invalid token (not in database)
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check for error elements
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();
      await expect(
        page.locator("text=Your verification link is invalid or has expired")
      ).toBeVisible();

      // Check for error icon using actual rendered classes
      await expect(page.locator("svg.lucide-circle-x")).toBeVisible();

      // Check for "Edit your Email" button
      const editEmailButton = page.locator("button", {
        hasText: "Edit your Email"
      });
      await expect(editEmailButton).toBeVisible();

      // Should not show success toast
      await expect(
        page.locator("text=Email verified successfully!")
      ).not.toBeVisible();

      // Test navigation to profile
      await editEmailButton.click();
      await page.waitForURL("**/profile*");
      expect(page.url()).toContain("/profile");
    });

    test("should show error message when no token is provided", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check for error elements
      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" })
      ).toBeVisible();
      await expect(page.locator("text=No token found.")).toBeVisible();

      // Check for "Edit your Email" button
      await expect(
        page.locator("button", { hasText: "Edit your Email" })
      ).toBeVisible();
    });

    test("should show error message when token is empty string", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" })
      ).toBeVisible();
    });

    test("should handle expired tokens", async ({ page }) => {
      // Use the expired token we seeded in the database
      await navigateToPage(page, "/verify-email?token=expired-token-456");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Should show verification failed for expired token
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state while verification is in progress", async ({
      page
    }) => {
      // Navigate to the page and check if loading state appears briefly
      await navigateToPage(page, "/verify-email?token=valid-token-789");

      // The loading state might be very brief with a fast backend,
      // so we check if either loading appeared or success is visible
      const loadingVisible = await page
        .locator("text=Verifying your email...")
        .isVisible();
      const successVisible = await page
        .locator("h1")
        .filter({ hasText: "Email verified!" })
        .isVisible();

      // Either loading was visible briefly or success is already visible
      expect(loadingVisible || successVisible).toBe(true);

      // Eventually success should be visible
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
    });
  });

  test.describe("UI Elements and Styling", () => {
    test("should have proper styling and layout for success state", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=valid-token-def");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check main container styling
      const container = page.locator("div.flex.justify-center.p-4");
      await expect(container).toBeVisible();

      // Check card styling
      const card = container.locator("div").first();
      await expect(card).toBeVisible();

      // Check that content is properly centered
      const cardContent = page.locator(".flex.flex-col.items-center.gap-4");
      await expect(cardContent).toBeVisible();

      // Check icon color (should be orange)
      const checkIcon = page.locator("svg.lucide-circle-check-big");
      await expect(checkIcon).toBeVisible();

      // Check button styling
      const button = page.locator("button", { hasText: "Go to Home" });
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/bg-kanaliiga-orange/);
    });

    test("should have proper styling for error state", async ({ page }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-styling");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check error icon
      const errorIcon = page.locator("svg.lucide-circle-x");
      await expect(errorIcon).toBeVisible();

      // Check error button
      const button = page.locator("button", { hasText: "Edit your Email" });
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/bg-kanaliiga-orange/);
    });

    test("should be responsive on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Create unique token for mobile test since we have limited valid tokens
      await navigateToPage(page, "/verify-email?token=valid-token-mobile");

      // Elements should still be visible and properly formatted on mobile
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "Go to Home" })
      ).toBeVisible();

      // Check that card doesn't overflow
      const card = page.locator("div").first();
      const cardBox = await card.boundingBox();
      expect(cardBox!.width).toBeLessThanOrEqual(375);
    });
  });

  test.describe("Navigation and Links", () => {
    test("should have working link to profile in error message", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-link");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Find and click the profile link
      const profileLink = page.locator('a[href*="/profile"]');
      await expect(profileLink).toBeVisible();

      await profileLink.click();
      await page.waitForURL("**/profile*");
      expect(page.url()).toContain("/profile");
    });
  });

  test.describe("Toast Notification Behavior", () => {
    test("should show toast only on successful verification", async ({
      page
    }) => {
      // Use a token that shouldn't conflict with other tests
      await navigateToPage(page, "/verify-email?token=valid-token-abc");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Wait for the success page and toast
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();

      // Toast should appear
      await expect(
        page.locator("text=Email verified successfully!")
      ).toBeVisible();
    });

    test("should not show success toast on error", async ({ page }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-no-toast");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Should show error message
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();

      // Should NOT show success toast
      await expect(
        page.locator("text=Email verified successfully!")
      ).not.toBeVisible();
    });
  });
});
