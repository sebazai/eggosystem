import { test, expect } from "./fixtures";

test.describe("Signup Form", () => {
  test("should navigate to the signup page and show proper title", async ({
    page
  }) => {
    // Navigate to the signup page for a test season
    await page.goto("/signup/test-season/registration");

    // Wait for title to be available
    await page.waitForLoadState("domcontentloaded");

    // Check page title contains the expected text
    const title = await page.title();
    expect(title).toContain("Registration form for Test Season");
  });

  test("should show heading for the signup page", async ({ page }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Check for the heading
    const heading = page.getByText("Season registration");
    await expect(heading).toBeVisible();
  });

  test("should display sign up form title", async ({ page }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Check if the form is rendered with its title
    const formTitle = page.getByText("Sign up Form");
    await expect(formTitle).toBeVisible();
  });

  test("should display organization tab initially", async ({ page }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Check if the Organization tab is visible and selected
    const organizationTab = page.getByRole("tab", { name: /Organization/ });
    await expect(organizationTab).toBeVisible();
    expect(await organizationTab.getAttribute("aria-selected")).toBe("true");
  });
});
