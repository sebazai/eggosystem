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
    const organizationTab = page.locator("#organization-tab");
    await expect(organizationTab).toBeVisible();
    expect(await organizationTab.getAttribute("aria-selected")).toBe("true");
  });

  test("should navigate to team tab after filling organization info", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Fill organization information
    await page.selectOption("#organization", "-1");
    await page.fill("#org-name", "Test Organization");
    await page.fill("#org-code", "TORG");
    await page.fill("#website", "https://test-org.com");

    // Click next button
    await page.click("#org-next-btn");

    // Wait for team tab to be enabled
    await page.waitForSelector("#team-tab:not([disabled])");

    // Verify team tab is now visible and selected
    const teamTab = page.locator("#team-tab");
    await expect(teamTab).toBeVisible();
    await expect(teamTab).not.toBeDisabled();
    expect(await teamTab.getAttribute("aria-selected")).toBe("true");

    // Verify team form is visible
    await expect(page.locator("#team-section")).toBeVisible();
  });

  test("should navigate to players tab after filling team info", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // First complete the organization tab
    await page.selectOption("#organization", "-1");
    await page.fill("#org-name", "Test Organization");
    await page.fill("#org-code", "TORG");
    await page.fill("#website", "https://test-org.com");
    await page.click("#org-next-btn");

    // Wait for team tab to be visible
    await page.waitForSelector("#team-section:visible");

    // Now fill team information
    await page.selectOption("#team", "-1");
    await page.fill("#team-name", "Test Team");
    await page.fill("#team-external-id", "TEST123");

    // Click next button to go to players tab
    await page.click("#team-next-btn");

    // Wait for players tab to be enabled
    await page.waitForSelector("#players-tab:not([disabled])");

    // Verify players tab is now visible and selected
    const playersTab = page.locator("#players-tab");
    await expect(playersTab).toBeVisible();
    await expect(playersTab).not.toBeDisabled();
    expect(await playersTab.getAttribute("aria-selected")).toBe("true");

    // Verify players form is visible
    await expect(page.locator("#players-section")).toBeVisible();
    await expect(page.locator('h3:text("Player Information")')).toBeVisible();
  });
});
