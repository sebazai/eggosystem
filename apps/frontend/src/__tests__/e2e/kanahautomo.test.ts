import { test, expect } from "@playwright/test";
import { generateTestJWT } from "./utils";

test.describe("Kanahautomo", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication cookie (following SignupForm pattern)
    await page.context().addCookies([
      {
        name: "access_token",
        value: generateTestJWT(),
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false
      }
    ]);

    // Intercept API requests to add Bearer authorization header
    await page.route("**/api/**", async (route) => {
      const headers = {
        ...route.request().headers(),
        Authorization: `Bearer ${generateTestJWT()}`
      };
      await route.continue({ headers });
    });

    // Navigate to the Kanahautomo page
    await page.goto("/kanahautomo");
  });

  test("happy path: authenticated user can register for Kanahautomo", async ({
    page
  }) => {
    // Should show the form when authenticated
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /join kanahautomo/i })
    ).toBeVisible();

    // Select an organization from the dropdown
    // First click the select trigger to open the dropdown
    await page.getByRole("combobox").click();

    // Wait for the dropdown to be visible and select the E2E Test Organization
    await page.getByRole("option", { name: "E2E Test Organization" }).click();

    // Submit the form
    await page.getByRole("button", { name: /join kanahautomo/i }).click();

    // Wait for success toast notification
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /successfully registered/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("should handle validation errors for empty form submission", async ({
    page
  }) => {
    // Try to submit without selecting an organization
    await page.getByRole("button", { name: /join kanahautomo/i }).click();

    // Should show validation error in FormMessage component
    await expect(
      page.locator(
        "text=/please select an existing organization OR create a new one/i"
      )
    ).toBeVisible({ timeout: 5000 });
  });

  test("should handle new organization creation with validation", async ({
    page
  }) => {
    // Select "Add new organization..." option
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Add new organization..." }).click();

    // Fill in invalid data
    await page.getByLabel("Organization name").fill("A");
    await page.getByLabel("Business ID").fill("B");

    // Submit the form
    await page.getByRole("button", { name: /join kanahautomo/i }).click();

    // Should show validation errors in FormMessage components
    await expect(
      page.locator("text=/organization name must be at least 2 characters/i")
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page.locator("text=/business id must be at least 2 characters/i")
    ).toBeVisible({ timeout: 5000 });
  });
});
