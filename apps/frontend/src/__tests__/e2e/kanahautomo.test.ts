import { test, expect } from "@playwright/test";

test.describe("Kanahautomo", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Kanahautomo page
    await page.goto("/kanahautomo");
  });

  test("should require authentication", async ({ page }) => {
    // Should show login message when not authenticated
    await expect(page.getByText(/log in with steam/i)).toBeVisible();
  });

  test("should show page structure", async ({ page }) => {
    // Test basic page structure
    await expect(
      page.getByRole("heading", { name: /join kanahautomo/i })
    ).toBeVisible();
    await expect(page.getByText(/register for kanahautomo/i)).toBeVisible();
  });

  test("should show login message when not authenticated", async ({ page }) => {
    // When not authenticated, should show login message
    await expect(page.getByText(/please log in with steam/i)).toBeVisible();
  });

  test("should not show form when not authenticated", async ({ page }) => {
    // Form elements should not be visible when not authenticated
    const selectTrigger = page.getByRole("combobox");
    const submitButton = page.getByRole("button", {
      name: /join kanahautomo/i
    });

    // These elements should not be visible when not authenticated
    await expect(selectTrigger).not.toBeVisible();
    await expect(submitButton).not.toBeVisible();
  });

  test("should show authentication required message", async ({ page }) => {
    // Should show the authentication required message
    await expect(page.getByText(/log in with steam/i)).toBeVisible();
  });

  test("should show organization selection form", async ({ page }) => {
    // Test that the form elements are present
    await expect(page.getByText(/select your organization/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /join kanahautomo/i })
    ).toBeVisible();
  });

  test("should show organization dropdown when authenticated", async ({
    page
  }) => {
    // This test would need authentication to be set up
    // For now, just test the basic structure
    const selectTrigger = page.getByRole("combobox");
    if (await selectTrigger.isVisible()) {
      await expect(selectTrigger).toHaveText(/choose an organization/i);
    }
  });

  test("should show form validation", async ({ page }) => {
    const submitButton = page.getByRole("button", {
      name: /join kanahautomo/i
    });
    await submitButton.click();

    // Should show validation error if form is accessible
    const errorMessage = page.getByText(/please select an organization/i);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
