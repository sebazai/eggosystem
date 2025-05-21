import { test, expect } from "../integration/fixtures";
import type { Page, Route } from "@playwright/test";

// Helper to enforce proper page typing across all tests
type TestArgs = { page: Page };

// A helper function to retry navigation when pages are being compiled
async function navigateWithRetry(
  page: Page,
  url: string,
  retries = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      // Increase timeout for initial navigation when page might be compiling
      await page.goto(url, { timeout: i === 0 ? 60000 : 30000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
      return; // Success
    } catch (e) {
      console.log(`Navigation attempt ${i + 1} failed, retrying...`);
      if (i === retries - 1) throw e; // Last attempt failed
    }
  }
}

test.describe("Signup Form", () => {
  test.beforeEach(async ({ page }: TestArgs) => {
    // Set up authentication with acceptedPrivacyPolicy
    await page.context().addCookies([
      {
        name: "access_token",
        value: "fake-jwt-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false
      }
    ]);

    // Mock authentication with accepted privacy policy
    await page.route("**/api/v1/auth/me", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            account_id: 1,
            provider_id: "76561198012345678",
            provider: "steam",
            nickname: "TestUser",
            acceptedPrivacyPolicy: true,
            fullName: "Test User",
            workEmail: "test@user.fi",
            discord: "tester",
            acceptedMarketing: false,
            isPersonalEmail: false
          }
        })
      });
    });

    // Mock FACEIT team validation
    await page.route("**/api/v1/faceit/teams/*", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          team_id: "77dd9104-d2f1-4f50-ba80-d58457cff5a9",
          name: "Test FACEIT Team",
          avatar: "https://example.com/avatar.jpg",
          game: "cs2"
        })
      });
    });
  });

  // Base navigation test
  test("should navigate to the signup page with authentication", async ({
    page
  }: TestArgs) => {
    // Start by checking authentication status
    await navigateWithRetry(page, "/");

    // Navigate to signup page
    await navigateWithRetry(page, "/seasons/16/signup");

    // Verify authentication by ensuring login button is not visible
    const steamLoginButton = page.locator(
      'button:has-text("Log in with Steam")'
    );
    await expect(steamLoginButton).not.toBeVisible();

    // Verify we can see the signup form content
    const registrationHeading = page.getByRole("heading", {
      name: "Season registration",
      exact: true
    });
    await expect(registrationHeading).toBeVisible();
  });

  // Organization selection tests
  test.describe("Organization Selection", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate to the registration form
      await navigateWithRetry(page, "/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();
    });

    test("should allow selecting an organization", async ({ page }) => {
      // Find and verify the organization dropdown exists using data-testid
      const orgSelector = page.locator(
        '[data-testid="fancy-select-organizations"]'
      );
      await expect(orgSelector).toBeVisible();

      // Open the dropdown using the toggle
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.waitForTimeout(500);

      // Find and select the "Other" option using data-testid
      const otherOption = page.locator('[data-testid="organizations-add-new"]');
      await expect(otherOption).toBeVisible();
      await otherOption.click();

      // Fill in required organization fields using data-testid attributes
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill("2992559-2");
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");

      // Check the terms and conditions checkbox
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Verify the Team Selection button is enabled
      const teamSelectionButton = page.locator(
        '[data-testid="team-selection-button"]'
      );
      await expect(teamSelectionButton).toBeEnabled();
    });
  });

  // Team selection tests
  test.describe("Team Selection", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate to the form
      await navigateWithRetry(page, "/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection using data-testid attributes
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.waitForTimeout(500);

      // Select "Other" option
      await page.locator('[data-testid="organizations-add-new"]').click();

      // Fill in required organization fields
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill("2992559-2");
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");

      // Check the terms and conditions checkbox
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Navigate to team section
      const teamSelectionButton = page.locator(
        '[data-testid="team-selection-button"]'
      );
      await expect(teamSelectionButton).toBeEnabled();
      await teamSelectionButton.click();
    });

    test("should allow selecting a team", async ({ page }) => {
      // Verify we're on the team tab
      await expect(page.getByText("Team", { exact: true })).toBeVisible();

      // Select team from dropdown using data-testid
      const teamSelector = page.locator(
        '[data-testid="teams-dropdown-toggle"]'
      );
      await expect(teamSelector).toBeVisible();
      await teamSelector.click();

      // Wait for dropdown and select "Add new"
      await page.waitForTimeout(500);
      await page.locator('[data-testid="teams-add-new"]').click();

      // Fill in team name
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");

      // Verify the Faceit ID field appears
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      await expect(faceitIdField).toBeVisible();
    });

    test.skip("should show custom fields when selecting 'Add new' team", async ({
      page: _page
    }) => {
      // Implementation will be added later
    });
  });

  // Faceit ID validation tests
  test.describe("Team Faceit ID Validation", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate to the form
      await navigateWithRetry(page, "/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection using data-testid attributes
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.waitForTimeout(500);

      // Select "Other" option
      await page.locator('[data-testid="organizations-add-new"]').click();

      // Fill in required organization fields
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill("2992559-2");
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");

      // Check the terms and conditions checkbox
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Navigate to team section
      const teamSelectionButton = page.locator(
        '[data-testid="team-selection-button"]'
      );
      await expect(teamSelectionButton).toBeEnabled();
      await teamSelectionButton.click();

      // Now we should be on the team tab
      // Select "Add new" for team
      await page.waitForTimeout(500);
      await page.locator('[data-testid="teams-dropdown-toggle"]').click();

      // Wait for dropdown and select add new team option
      await page.waitForTimeout(500);
      await page.locator('[data-testid="teams-add-new"]').click();

      // Fill in the new team name
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");
    });

    test("should identify and access the Team Faceit ID field", async ({
      page
    }) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Verify field is found
      await expect(faceitIdField).toBeVisible();

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toBeVisible();

      // Verify Go to lineup button is present
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );
      await expect(goToLineupButton).toBeVisible();
    });

    test("should reject empty Faceit ID", async ({ page }: TestArgs) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Verify field is found
      await expect(faceitIdField).toBeVisible();

      // Verify help text is present
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toBeVisible();

      // Find the Go to lineup button
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Try an empty Faceit ID
      await faceitIdField.fill("");

      // Button should be disabled with empty ID
      await expect(goToLineupButton).toBeDisabled();
    });

    test("should pass with Faceit ID that has spaces", async ({
      page
    }: TestArgs) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Find the Go to lineup button
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Try a Faceit ID with spaces
      await faceitIdField.fill("   77dd9104-d2f1-4f50-ba80-d58457cff5a9  ");

      // Button should be disabled with invalid format
      await expect(goToLineupButton).toBeEnabled();
    });

    test("should reject Faceit ID without hyphens", async ({
      page
    }: TestArgs) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Find the Go to lineup button
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Try a Faceit ID without hyphens
      await faceitIdField.fill("77dd9104d2f14f50ba80d58457cff5a9");

      // Button should be disabled with invalid format
      await expect(goToLineupButton).toBeDisabled();
    });

    test("should reject Faceit ID with HTTP prefix", async ({
      page
    }: TestArgs) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Find the Go to lineup button
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Try a Faceit ID with HTTP prefix
      await faceitIdField.fill("http://77dd9104-d2f1-4f50-ba80-d58457cff5a9");

      // Button should be disabled with invalid format
      await expect(goToLineupButton).toBeDisabled();
    });

    test("should accept valid UUID format and allow navigation", async ({
      page
    }) => {
      // Find the Team Faceit ID field using data-testid
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );

      // Find the Go to lineup button
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Enter a valid UUID format
      await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");

      // Wait for validation to complete
      await page.waitForTimeout(500);

      // Button should be enabled with valid format
      await expect(goToLineupButton).toBeEnabled();

      // Navigate to players section
      await goToLineupButton.click();

      // Verify we reached players section - using a more specific selector
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();
    });
  });

  // Steam ID Validation tests
  test.describe("Steam ID Validation", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate through the registration process
      await navigateWithRetry(page, "/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill("2992559-2");
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Move to team section
      await page.locator('[data-testid="team-selection-button"]').click();
      await page.waitForTimeout(500);

      // Complete team selection
      await page.locator('[data-testid="teams-dropdown-toggle"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="teams-add-new"]').click();
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");
      await page.waitForTimeout(500);

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Verify we're on the players tab
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();

      // Mock App Hours API response
      await page.route("**/api/v1/players/*/app/*/hours**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            hours: 1500
          })
        });
      });

      // Mock App Rank API response (CS2 Premier)
      await page.route("**/api/v1/players/*/app/*/rank**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            rank: 10,
            rank_type: "Premier",
            has_rank: true
          })
        });
      });

      // Mock Platform Rank API response (FACEIT)
      await page.route("**/api/v1/players/*/platform/*/rank", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            level: 7,
            elo: 1850
          })
        });
      });

      // Mock Public Profile API response
      await page.route("**/api/v1/players/*/public", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            public: true
          })
        });
      });
    });

    test("should allow adding a valid Steam ID", async ({ page }) => {
      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a valid Steam ID
      await steamIdInput.fill("76561197960273207");
      await page.keyboard.press("Tab");

      // Wait for validation
      await page.waitForTimeout(1000);

      // Check for player nickname in the correct element - it's in a span with class "text-kanaliiga-orange"
      const playerNameSpan = page.locator("span.text-kanaliiga-orange");
      await expect(playerNameSpan).toBeVisible();

      // Check the text content
      await expect(playerNameSpan).toHaveText("Aabe");

      // If the test needs to also check the input field exists (which is different from the text display)
      const playerNameInput = page.locator('[data-testid="player-name-0"]');
      await expect(playerNameInput).toBeVisible();
    });

    test.skip("should fill in all 5 required players", async ({ page }) => {
      // Player data as explicit constant values
      const PLAYER1 = { steamId: "76561197960273207", nickname: "Aabe" };
      const PLAYER2 = { steamId: "76561197960275646", nickname: "Quatra" };
      const PLAYER3 = { steamId: "76561197960283671", nickname: "Trev" };
      const PLAYER4 = { steamId: "76561197960283932", nickname: "heppajpg" };
      const PLAYER5 = { steamId: "76561197960272637", nickname: "Hoolyz" };

      try {
        // The form already has 5 Steam ID inputs available, no need to add players

        // Fill in player 1 data
        const steamId1Input = page.locator('[data-testid="steam-id-input-0"]');
        await expect(steamId1Input).toBeVisible();
        await steamId1Input.fill(PLAYER1.steamId);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Fill in player 2 data
        const steamId2Input = page.locator('[data-testid="steam-id-input-1"]');
        await expect(steamId2Input).toBeVisible();
        await steamId2Input.fill(PLAYER2.steamId);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Fill in player 3 data
        const steamId3Input = page.locator('[data-testid="steam-id-input-2"]');
        await expect(steamId3Input).toBeVisible();
        await steamId3Input.fill(PLAYER3.steamId);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Fill in player 4 data
        const steamId4Input = page.locator('[data-testid="steam-id-input-3"]');
        await expect(steamId4Input).toBeVisible();
        await steamId4Input.fill(PLAYER4.steamId);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Fill in player 5 data
        const steamId5Input = page.locator('[data-testid="steam-id-input-4"]');
        await expect(steamId5Input).toBeVisible();
        await steamId5Input.fill(PLAYER5.steamId);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Extra wait for all nicknames to load
        await page.waitForTimeout(2000);

        // Verify all player nicknames appear
        await expect(
          page.getByText(PLAYER1.nickname, { exact: true })
        ).toBeVisible();
        await expect(
          page.getByText(PLAYER2.nickname, { exact: true })
        ).toBeVisible();
        await expect(
          page.getByText(PLAYER3.nickname, { exact: true })
        ).toBeVisible();
        await expect(
          page.getByText(PLAYER4.nickname, { exact: true })
        ).toBeVisible();
        await expect(
          page.getByText(PLAYER5.nickname, { exact: true })
        ).toBeVisible();
      } catch (error) {
        console.error("Test error:", error);
        throw error;
      }
    });

    test.skip("should show error for invalid Steam ID format", async ({
      page
    }) => {
      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter an invalid Steam ID (too short)
      await steamIdInput.fill("12345");
      await page.keyboard.press("Tab");

      // Verify error message appears
      const errorMessage = page.locator('[data-testid="steam-id-error-0"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText("invalid");
    });

    test.skip("should show error for non-numeric Steam ID", async ({
      page
    }) => {
      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a non-numeric Steam ID
      await steamIdInput.fill("abcdefghijklmnop");
      await page.keyboard.press("Tab");

      // Verify error message appears
      const errorMessage = page.locator('[data-testid="steam-id-error-0"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText("invalid");
    });

    test.skip("should show error for private profile", async ({ page }) => {
      // Override the public profile mock for this specific test
      await page.route("**/api/v1/players/*/public", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            public: false
          })
        });
      });

      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a valid Steam ID but with private profile
      await steamIdInput.fill("76561197960273207");
      await page.keyboard.press("Tab");

      // Wait for validation
      await page.waitForTimeout(1000);

      // Verify the private profile error appears
      const profileError = page.locator(
        '[data-testid="profile-privacy-error-0"]'
      );
      await expect(profileError).toBeVisible();
      await expect(profileError).toContainText("profile is not public");
    });

    test.skip("should show error for insufficient game hours", async ({
      page
    }) => {
      // Override the hours mock for this specific test
      await page.route("**/api/v1/players/*/app/*/hours**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            hours: 50 // Too few hours
          })
        });
      });

      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a valid Steam ID but with insufficient hours
      await steamIdInput.fill("76561197960273207");
      await page.keyboard.press("Tab");

      // Wait for validation
      await page.waitForTimeout(1000);

      // Verify the hours error appears
      const hoursError = page.locator('[data-testid="hours-error-0"]');
      await expect(hoursError).toBeVisible();
      await expect(hoursError).toContainText("hours");
    });
  });

  // Steam ID API Response Validation tests
  test.skip("Steam ID API Response Validation", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate through the registration process
      await navigateWithRetry(page, "/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill("2992559-2");
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Move to team section
      await page.locator('[data-testid="team-selection-button"]').click();
      await page.waitForTimeout(500);

      // Complete team selection
      await page.locator('[data-testid="teams-dropdown-toggle"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="teams-add-new"]').click();
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");
      await page.waitForTimeout(500);

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Verify we're on the players tab
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();
    });

    test("should show error for private profile", async ({ page }) => {
      // Mock Steam API response for private profile
      await page.route("**/api/v1/steam/players/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            steam_id: "76561197960273207",
            nickname: "TestPlayer1",
            avatar: "https://example.com/avatar.jpg",
            profile_url:
              "https://steamcommunity.com/profiles/76561197960273207",
            is_public: false,
            game_stats: null
          })
        });
      });

      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a valid Steam ID but with private profile
      await steamIdInput.fill("76561197960273207");
      await page.keyboard.press("Tab");

      // Wait for validation
      await page.waitForTimeout(1000);

      // Verify the private profile error appears
      const profileError = page.locator(
        '[data-testid="profile-privacy-error-0"]'
      );
      await expect(profileError).toBeVisible();
      await expect(profileError).toContainText("private");
    });

    test("should show error for insufficient game hours", async ({ page }) => {
      // Mock Steam API response for insufficient hours
      await page.route("**/api/v1/steam/players/*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            steam_id: "76561197960273207",
            nickname: "TestPlayer1",
            avatar: "https://example.com/avatar.jpg",
            profile_url:
              "https://steamcommunity.com/profiles/76561197960273207",
            is_public: true,
            game_stats: {
              cs2: {
                hours: 50, // Too few hours
                rank: 10,
                rank_type: "Premier",
                has_rank: true
              }
            }
          })
        });
      });

      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter a valid Steam ID but with insufficient hours
      await steamIdInput.fill("76561197960273207");
      await page.keyboard.press("Tab");

      // Wait for validation
      await page.waitForTimeout(1000);

      // Verify the hours error appears
      const hoursError = page.locator('[data-testid="hours-error-0"]');
      await expect(hoursError).toBeVisible();
      await expect(hoursError).toContainText("hours");
    });
  });

  /* Original test
  test("should validate Steam ID format requirements", async ({ page }) => {
    // ... existing code ...
  });
  */
});
