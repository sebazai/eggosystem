import { expect, test, type Page } from "@playwright/test";

async function navigateToPage(page: Page, url: string) {
  await page.goto(url, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
}

test.describe("Email Verification Bug Verification", () => {
  test.describe("Verify Bug is Fixed", () => {
    test("should verify email successfully using Redis token (validates interface fix)", async ({
      page
    }) => {
      // Use dedicated bug test token to avoid conflicts with original tests
      await navigateToPage(page, "/verify-email?token=bug-test-redis-token");

      // Should show success message (not "verification failed")
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toContainText("Email verified!");

      // Check for success icon
      await expect(
        page.locator('[data-testid="check-circle-icon"]').first()
      ).toBeVisible();

      // Verify success toast appears (confirms the backend returned 200, not error)
      await expect(
        page.locator("text=Email verified successfully!")
      ).toBeVisible();
    });

    test("should verify email successfully using database fallback", async ({
      page
    }) => {
      // Use dedicated token for database fallback testing
      await navigateToPage(page, "/verify-email?token=bug-test-db-token");

      // Should show success message (validates database fallback doesn't throw error)
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toContainText("Email verified!");

      // Verify success toast appears
      await expect(
        page.locator("text=Email verified successfully!")
      ).toBeVisible();
    });

    test("should fail gracefully with invalid token", async ({ page }) => {
      // Test with invalid token
      await navigateToPage(
        page,
        "/verify-email?token=definitely-invalid-token"
      );

      // Should show error message (not crash)
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible({ timeout: 10000 });

      await expect(
        page
          .locator("text=Your verification link is invalid or has expired")
          .first()
      ).toBeVisible();

      // Should NOT show success toast
      await expect(
        page.locator("text=Email verified successfully!")
      ).not.toBeVisible();
    });

    test("should handle expired token correctly", async ({ page }) => {
      // Use existing expired token from seed
      await navigateToPage(page, "/verify-email?token=expired-token-123");

      // Should show error message (not crash)
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible({ timeout: 10000 });

      // Should NOT show success toast
      await expect(
        page.locator("text=Email verified successfully!")
      ).not.toBeVisible();
    });
  });

  test.describe("User Interface Validation", () => {
    test("should have working navigation from success state", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=bug-test-navigation");

      // Wait for success state
      await expect(
        page.locator('[data-testid="verify-email-success-card"] h1').first()
      ).toBeVisible({ timeout: 10000 });

      // Test "Go to Home" button works
      const homeButton = page
        .locator("button", { hasText: "Go to Home" })
        .first();
      await expect(homeButton).toBeVisible();

      await homeButton.click();
      await page.waitForURL("**/");
      expect(page.url()).toContain("/");
    });

    test("should have working navigation from error state", async ({
      page
    }) => {
      await navigateToPage(page, "/verify-email?token=invalid-token-xyz");

      // Wait for error state
      await expect(
        page.locator("h1").filter({ hasText: "Verification failed" }).first()
      ).toBeVisible({ timeout: 10000 });

      // Test "Edit your Email" button
      const editEmailButton = page
        .locator("button", { hasText: "Edit your Email" })
        .first();
      await expect(editEmailButton).toBeVisible();

      await editEmailButton.click();
      await page.waitForURL("**/profile*");
      expect(page.url()).toContain("/profile");
    });
  });

  test.describe("Multiple Token Test (Prevents Token Consumption Issues)", () => {
    test("should handle multiple valid tokens without conflicts", async ({
      page
    }) => {
      const tokens = [
        "bug-test-multiple-1",
        "bug-test-multiple-2",
        "bug-test-multiple-3"
      ];

      for (const token of tokens) {
        await navigateToPage(page, `/verify-email?token=${token}`);

        // Each should show success
        await expect(
          page.locator('[data-testid="verify-email-success-card"] h1').first()
        ).toBeVisible({ timeout: 10000 });

        await expect(
          page.locator("text=Email verified successfully!")
        ).toBeVisible();
      }
    });
  });
});
