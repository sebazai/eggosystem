import { test, expect } from "@playwright/test";

// Define the test suite for the sortter page
test.describe("Sortter Page", () => {
  // Before each test, navigate to the sortter page and log in
  test.beforeEach(async ({ page }) => {
    // Mock the authentication state to be logged in as admin
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "auth",
        JSON.stringify({
          user: { role: "admin" },
          accessToken: "mock-token"
        })
      );
    });

    // Navigate to the sortter page
    await page.goto("/dashboard/sortter?season=2");
  });

  // Test that the sortter page loads successfully
  test("should load the sortter page", async ({ page }) => {
    // Check if the page title is visible
    await expect(page.getByRole("heading", { name: "Sortter" })).toBeVisible();

    // Check if the description is visible
    await expect(
      page.getByText("Team ranking management and analysis tool")
    ).toBeVisible();

    // Check if the season selector is visible
    await expect(page.getByText("Season:")).toBeVisible();
  });

  // Test that teams are displayed in the table
  test("should display teams in the table", async ({ page }) => {
    // Wait for the table to be visible
    await expect(page.getByRole("table")).toBeVisible();

    // Check if the table headers are visible
    await expect(
      page.getByRole("columnheader", { name: "Team" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Division" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Graph (0-350)" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Comments" })
    ).toBeVisible();
  });

  // Test that the division summary is displayed
  test("should display division summary", async ({ page }) => {
    // Wait for the division summary to be visible
    await expect(page.getByText("Division Summary")).toBeVisible();

    // Check if at least one division is displayed
    await expect(page.getByText("Masters:")).toBeVisible();
  });

  // Test that the save placements button works
  test("should save placements when button is clicked", async ({ page }) => {
    // Mock the API response for saving placements
    await page.route("**/api/v1/sortter/season/*/placements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Preliminary placements saved successfully"
        })
      });
    });

    // Click the save button
    await page.getByRole("button", { name: "Save Placements" }).click();

    // Check if the success toast is displayed
    await expect(page.getByText("Placements saved successfully")).toBeVisible();
  });

  // Test that the finalize placements button works
  test("should finalize placements when button is clicked", async ({
    page
  }) => {
    // Mock the API responses for saving and finalizing placements
    await page.route("**/api/v1/sortter/season/*/placements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Preliminary placements saved successfully"
        })
      });
    });

    await page.route("**/api/v1/sortter/season/*/finalize", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Placements finalized successfully" })
      });
    });

    // Click the finalize button
    await page.getByRole("button", { name: "Finalize Placements" }).click();

    // Check if the success toast is displayed
    await expect(
      page.getByText("Placements finalized and saved to database")
    ).toBeVisible();
  });

  // Test that the populate kanaelo queue button works
  test("should populate kanaelo queue when button is clicked", async ({
    page
  }) => {
    // Mock the API response for populating kanaelo queue
    await page.route(
      "**/api/v1/sortter/season/*/populate-kanaelo-queue",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message:
              "Successfully added players to the kanaelo calculation queue",
            queued_players: 10
          })
        });
      }
    );

    // Click the populate button
    await page.getByRole("button", { name: "Populate Kanaelo Queue" }).click();

    // Check if the success toast is displayed
    await expect(
      page.getByText(
        "Successfully added 10 players to the kanaelo calculation queue"
      )
    ).toBeVisible();
  });

  // Test that changing division works
  test("should change division when dropdown is changed", async ({ page }) => {
    // Open the division dropdown for the first team
    const divisionDropdown = page
      .locator("button")
      .filter({ hasText: "Masters" })
      .first();
    await divisionDropdown.click();

    // Select "Challengers" from the dropdown
    await page.getByRole("option", { name: "Challengers" }).click();

    // Mock the API response for saving placements
    await page.route("**/api/v1/sortter/season/*/placements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Preliminary placements saved successfully"
        })
      });
    });

    // Save the changes
    await page.getByRole("button", { name: "Save Placements" }).click();

    // Check if the success toast is displayed
    await expect(page.getByText("Placements saved successfully")).toBeVisible();
  });

  // Test that adding comments works
  test("should update comments when text is entered", async ({ page }) => {
    // Find the first textarea and type a comment
    const textarea = page.locator("textarea").first();
    await textarea.fill("This is a test comment");

    // Mock the API response for saving placements
    await page.route("**/api/v1/sortter/season/*/placements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Preliminary placements saved successfully"
        })
      });
    });

    // Save the changes
    await page.getByRole("button", { name: "Save Placements" }).click();

    // Check if the success toast is displayed
    await expect(page.getByText("Placements saved successfully")).toBeVisible();
  });

  // Test that the player values floating window appears on double click
  test("should show player values on team double click", async ({ page }) => {
    // Mock the API response for player values
    await page.route(
      "**/api/v1/sortter/season/*/team/*/playervalues",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              name: "Player 1",
              steamid: "123456789",
              cs2_rank: 16,
              faceit_level: 10,
              faceit_elo: 2000,
              hours: 5000,
              kanarating: 1.5,
              fkd: 1.2,
              kana_elo: 1800,
              calculus: null
            }
          ])
        });
      }
    );

    // Double click on the first team row
    const teamRow = page.locator("tr").filter({ hasText: "Team" }).nth(1);
    await teamRow.dblclick();

    // Check if the floating window appears
    await expect(page.getByText("Player Values")).toBeVisible();

    // Check if player data is displayed
    await expect(page.getByText("Player 1")).toBeVisible();
  });

  // Test that the view mode disables editing
  test("should disable editing in view mode", async ({ page }) => {
    // Mock the API response to indicate finalized placements
    await page.route("**/api/v1/sortter/season/*/placements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          placements: [],
          isFinalized: true
        })
      });
    });

    // Reload the page to get the finalized state
    await page.reload();

    // Check if the view mode message is displayed
    await expect(
      page.getByText("View Mode - Placements have been finalized")
    ).toBeVisible();

    // Check if the buttons are disabled
    await expect(
      page.getByRole("button", { name: "Save Placements" })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Finalize Placements" })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Populate Kanaelo Queue" })
    ).toBeDisabled();

    // Check if the textareas are disabled
    await expect(page.locator("textarea").first()).toBeDisabled();
  });
});
