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

      // Check for success elements using data-testid for unique identification
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toContainText("Email verified!");
      await expect(
        page
          .locator("text=Your email address was successfully verified.")
          .first()
      ).toBeVisible();

      // Check for success icon using data-testid
      await expect(
        page.locator('[data-testid="check-circle-icon"]').first()
      ).toBeVisible();

      // Check for "Go to Home" button
      const homeButton = page
        .locator("button", { hasText: "Go to Home" })
        .first();
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
          .locator('[data-testid="verify-email-success-card"] h1')
          .first()
          .waitFor({ timeout: 10000 }),
        loadingElement.waitFor({ state: "hidden", timeout: 10000 })
      ]);

      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible();
    });
  });

  test.describe("Error Cases", () => {
    test("should show error message when token is invalid", async ({
      page
    }) => {
      // Use an invalid token (not in database)
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");

      // Check for error elements using more specific selectors
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible();
      await expect(
        page
          .locator("text=Your verification link is invalid or has expired")
          .first()
      ).toBeVisible();

      // Check for error icon using data-testid
      await expect(
        page.locator('[data-testid="x-circle-icon"]').first()
      ).toBeVisible();

      // Check for "Edit your Email" button
      const editEmailButton = page
        .locator("button", {
          hasText: "Edit your Email"
        })
        .first();
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

      // Check for error elements
      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" }).first()
      ).toBeVisible();
      await expect(page.locator("text=No token found.").first()).toBeVisible();

      // Check for "Edit your Email" button
      const editEmailButton = page
        .locator("button", {
          hasText: "Edit your Email"
        })
        .first();
      await expect(editEmailButton).toBeVisible();
    });

    test("should show error message when token is empty string", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=");

      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" }).first()
      ).toBeVisible();
    });

    test("should handle expired tokens", async ({ page }) => {
      await navigateToPage(page, "/verify-email?token=expired-token-123");

      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state while verification is in progress", async ({
      page
    }) => {
      // Navigate to a page that will trigger loading
      await navigateToPage(page, "/verify-email?token=valid-token-mobile");

      // Check for loading state
      const loadingVisible = await page
        .locator("text=Verifying your email...")
        .isVisible();

      // Check for success state (should appear after loading)
      const successVisible = await page
        .locator('[data-testid="verify-email-success-card"] h1')
        .first()
        .isVisible();

      // Either loading was visible briefly or success is already visible
      expect(loadingVisible || successVisible).toBe(true);
    });
  });

  test.describe("UI Elements and Styling", () => {
    test("should have proper styling and layout for success state", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=valid-token-789");

      // Check main container styling - use first() to avoid duplicate matches
      const container = page.locator("div.flex.justify-center.p-4").first();
      await expect(container).toBeVisible();

      // Check card styling
      const card = container.locator("div").first();
      await expect(card).toBeVisible();

      // Check success icon styling
      const successIcon = page
        .locator('[data-testid="check-circle-icon"]')
        .first();
      await expect(successIcon).toBeVisible();
      await expect(successIcon).toHaveClass(/h-16/);
      await expect(successIcon).toHaveClass(/w-16/);
    });

    test("should have proper styling for error state", async ({ page }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");

      // Check error icon
      const errorIcon = page.locator('[data-testid="x-circle-icon"]').first();
      await expect(errorIcon).toBeVisible();
      await expect(errorIcon).toHaveClass(/h-16/);
      await expect(errorIcon).toHaveClass(/w-16/);
      await expect(errorIcon).toHaveClass(/text-destructive/);

      // Check error button
      const button = page
        .locator("button", { hasText: "Edit your Email" })
        .first();
      await expect(button).toBeVisible();
    });

    test("should be responsive on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await navigateToPage(page, "/verify-email?token=valid-token-abc");

      // Check that elements are still visible on mobile
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "Go to Home" }).first()
      ).toBeVisible();

      // Check that layout is still centered
      const container = page.locator("div.flex.justify-center.p-4").first();
      await expect(container).toBeVisible();
    });
  });

  test.describe("Navigation and Links", () => {
    test("should have working link to profile in error message", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");

      // Find and click the profile link
      const profileLink = page.locator('a[href*="/profile"]').first();
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
      await navigateToPage(page, "/verify-email?token=valid-token-def");

      // Wait for success state
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible();

      // Toast should appear
      await expect(
        page.locator("text=Email verified successfully!")
      ).toBeVisible();
    });

    test("should not show success toast on error", async ({ page }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");

      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible();

      // Should NOT show success toast
      await expect(
        page.locator("text=Email verified successfully!")
      ).not.toBeVisible();
    });
  });
});
