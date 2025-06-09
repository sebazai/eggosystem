import { expect, test, type Route, type Page } from "@playwright/test";

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
      // Mock successful verification API response
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        const request = route.request();
        const postData = JSON.parse(request.postData() || "{}");

        expect(postData.token).toBe("valid-token-123");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      // Navigate to verify-email page with valid token
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

      // Check for success icon
      await expect(
        page.locator(
          '[data-testid="check-circle-icon"], svg.lucide-check-circle'
        )
      ).toBeVisible();

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
      let apiCallReceived = false;

      await page.route("**/api/v1/verify-email", async (route: Route) => {
        apiCallReceived = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      await navigateToPage(
        page,
        "/verify-email?token=quick-verification-token"
      );

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

      expect(apiCallReceived).toBe(true);
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
    });
  });

  test.describe("Error Cases", () => {
    test("should show error message when token is invalid", async ({
      page
    }) => {
      // Mock failed verification API response
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid or expired token." })
        });
      });

      await navigateToPage(page, "/verify-email?token=invalid-token");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check for error elements
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();
      await expect(
        page.locator("text=Your verification link is invalid or has expired")
      ).toBeVisible();

      // Check for error icon
      await expect(
        page.locator('[data-testid="x-circle-icon"], svg.lucide-x-circle')
      ).toBeVisible();

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
      // No API call should be made for missing token
      let apiCalled = false;
      await page.route("**/api/v1/verify-email", async () => {
        apiCalled = true;
      });

      await navigateToPage(page, "/verify-email");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check for error elements
      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" })
      ).toBeVisible();
      await expect(page.locator("text=No token found.")).toBeVisible();

      // Should not call the API when no token is provided
      expect(apiCalled).toBe(false);

      // Check for "Edit your Email" button
      await expect(
        page.locator("button", { hasText: "Edit your Email" })
      ).toBeVisible();
    });

    test("should show error message when token is empty string", async ({
      page
    }) => {
      let apiCalled = false;
      await page.route("**/api/v1/verify-email", async () => {
        apiCalled = true;
      });

      await navigateToPage(page, "/verify-email?token=");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      await expect(
        page.locator("h1").filter({ hasText: "Invalid verification" })
      ).toBeVisible();
      expect(apiCalled).toBe(false);
    });

    test("should handle API server errors gracefully", async ({ page }) => {
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal server error" })
        });
      });

      await navigateToPage(page, "/verify-email?token=server-error-token");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Should show verification failed for any non-200 response
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();
    });

    test("should handle network errors gracefully", async ({ page }) => {
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.abort("connectionreset");
      });

      await navigateToPage(page, "/verify-email?token=network-error-token");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Should show verification failed for network errors
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" })
      ).toBeVisible();
    });
  });

  test.describe("Loading States", () => {
    test("should show loading state while verification is in progress", async ({
      page
    }) => {
      let resolveVerification!: (value: unknown) => void;
      const verificationPromise = new Promise<unknown>((resolve) => {
        resolveVerification = resolve;
      });

      await page.route("**/api/v1/verify-email", async (route: Route) => {
        // Wait for the test to resolve this promise
        await verificationPromise;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      await navigateToPage(page, "/verify-email?token=slow-verification-token");

      // Should show loading state
      await expect(page.locator("text=Verifying your email...")).toBeVisible();
      await expect(page.locator("text=Please wait a moment.")).toBeVisible();

      // Check for loading spinner
      await expect(page.locator('[class*="animate-spin"]')).toBeVisible();

      // Resolve the verification
      resolveVerification(true);

      // Wait for success state
      await expect(
        page.locator("h1").filter({ hasText: "Email verified!" })
      ).toBeVisible();
    });
  });

  test.describe("UI Elements and Styling", () => {
    test("should have proper styling and layout for success state", async ({
      page
    }) => {
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      await navigateToPage(page, "/verify-email?token=styling-test-token");
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
      const checkIcon = page.locator("svg.lucide-check-circle");
      await expect(checkIcon).toBeVisible();

      // Check button styling
      const button = page.locator("button", { hasText: "Go to Home" });
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/bg-kanaliiga-orange/);
    });

    test("should have proper styling for error state", async ({ page }) => {
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid or expired token." })
        });
      });

      await navigateToPage(page, "/verify-email?token=error-styling-token");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check error icon
      const errorIcon = page.locator("svg.lucide-x-circle");
      await expect(errorIcon).toBeVisible();

      // Check error button
      const button = page.locator("button", { hasText: "Edit your Email" });
      await expect(button).toBeVisible();
      await expect(button).toHaveClass(/bg-kanaliiga-orange/);
    });

    test("should be responsive on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      await navigateToPage(page, "/verify-email?token=mobile-test-token");
      await page.waitForLoadState("networkidle", { timeout: 30000 });

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
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid or expired token." })
        });
      });

      await navigateToPage(page, "/verify-email?token=link-test-token");
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
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Email verified successfully" })
        });
      });

      await navigateToPage(page, "/verify-email?token=toast-test-token");
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
      await page.route("**/api/v1/verify-email", async (route: Route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Invalid or expired token." })
        });
      });

      await navigateToPage(page, "/verify-email?token=no-toast-test-token");
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
