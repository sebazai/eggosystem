import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

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

  test("should allow filling in the first player's Steam ID", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Navigate through all tabs to reach the players tab
    // Organization tab
    await page.selectOption("#organization", "-1");
    await page.fill("#org-name", "Test Organization");
    await page.fill("#org-code", "TORG");
    await page.fill("#website", "https://test-org.com");
    await page.click("#org-next-btn");

    // Team tab
    await page.waitForSelector("#team-section:visible");
    await page.selectOption("#team", "-1");
    await page.fill("#team-name", "Test Team");
    await page.fill("#team-external-id", "TEST123");
    await page.click("#team-next-btn");

    // Wait for players tab to be visible
    await page.waitForSelector("#players-section:visible");

    // Fill in the Steam ID for the first player
    await page.fill("#player-0-steam", "76561197967885016");

    // Verify the Steam ID was entered correctly
    const steamIdInput = page.locator("#player-0-steam");
    expect(await steamIdInput.inputValue()).toBe("76561197967885016");

    // Fill in other player details
    await page.fill("#player-0-name", "Player One");
    await page.fill("#player-0-email", "player@example.com");

    // Check the captain checkbox
    await page.check("#player-0-captain");
    expect(await page.locator("#player-0-captain").isChecked()).toBeTruthy();
  });

  test("should show validation error when entering invalid Steam ID", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Navigate through all tabs to reach the players tab
    // Organization tab
    await page.selectOption("#organization", "-1");
    await page.fill("#org-name", "Test Organization");
    await page.fill("#org-code", "TORG");
    await page.fill("#website", "https://test-org.com");
    await page.click("#org-next-btn");

    // Team tab
    await page.waitForSelector("#team-section:visible");
    await page.selectOption("#team", "-1");
    await page.fill("#team-name", "Test Team");
    await page.fill("#team-external-id", "TEST123");
    await page.click("#team-next-btn");

    // Wait for players tab to be visible
    await page.waitForSelector("#players-section:visible");

    // Enter an invalid Steam ID
    await page.fill("#player-0-steam", "12345invalid");

    // Verify the error message is displayed
    const errorMessage = page.locator("#steam-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid Steam ID format");

    // Try to submit the form (should not allow submission)
    await page.click("#submit-btn");

    // Verify we're still on the players tab (error prevented submission)
    await expect(page.locator("#players-section")).toBeVisible();
    await expect(errorMessage).toBeVisible();
  });

  test("should show validation error when Steam ID has leading space", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to the players tab
    await navigateToPlayersTab(page);

    // Enter a Steam ID with a leading space
    await page.fill("#player-0-steam", " 76561197967885016");

    // Verify the error message is displayed
    const errorMessage = page.locator("#steam-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid Steam ID format");
  });

  test("should show validation error when Steam ID has trailing space", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to the players tab
    await navigateToPlayersTab(page);

    // Enter a Steam ID with a trailing space
    await page.fill("#player-0-steam", "76561197967885016 ");

    // Verify the error message is displayed
    const errorMessage = page.locator("#steam-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid Steam ID format");
  });

  test("should show validation error when Steam ID has middle space", async ({
    page
  }) => {
    await page.goto("/signup/test-season/registration");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to the players tab
    await navigateToPlayersTab(page);

    // Enter a Steam ID with a space in the middle
    await page.fill("#player-0-steam", "765611 97967885016");

    // Verify the error message is displayed
    const errorMessage = page.locator("#steam-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Invalid Steam ID format");
  });
});

// Helper function to navigate to players tab
async function navigateToPlayersTab(page: Page) {
  // Organization tab
  await page.selectOption("#organization", "-1");
  await page.fill("#org-name", "Test Organization");
  await page.fill("#org-code", "TORG");
  await page.fill("#website", "https://test-org.com");
  await page.click("#org-next-btn");

  // Wait for team tab to be visible
  await page.waitForSelector("#team-section:visible");

  // Team tab
  await page.selectOption("#team", "-1");
  await page.fill("#team-name", "Test Team");
  await page.fill("#team-external-id", "TEST123");
  await page.click("#team-next-btn");

  // Wait for players tab to be visible
  await page.waitForSelector("#players-section:visible");
}
