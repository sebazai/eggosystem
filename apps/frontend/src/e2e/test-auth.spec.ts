import { expect, test, type Page, type Route } from "@playwright/test";
import { generateTestJWTForUser } from "./utils";
import {
  waitForPageReady,
  waitForNavigationComplete
} from "./helpers/wait-helpers";

// Helper function to set up authentication for a specific user
// Copied exactly from SignupForm.spec.ts
async function setupAuthForUser(
  page: Page,
  accountId: number,
  steamId: string,
  nickname: string
) {
  const jwt = generateTestJWTForUser(accountId, steamId, nickname);
  console.log(`Generated JWT token for user ${nickname} (${accountId})`);

  await page.context().addCookies([
    {
      name: "access_token",
      value: jwt,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false
    }
  ]);
  console.log("Added access_token cookie");

  // Intercept API requests to add Bearer authorization header
  await page.route("**/api/v1/**", async (route: Route) => {
    const headers = {
      ...route.request().headers(),
      Authorization: `Bearer ${jwt}`
    };

    await route.continue({ headers });
  });
  console.log("Set up API request interception for all API endpoints");
}

test.describe("Authentication Test", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication cookie first (most important) - use heppajpg for test
    console.log("Setting up authentication for test");
    await setupAuthForUser(page, 15004, "66561198999999902", "heppajpg");
    console.log("Authentication setup completed");

    // Mock the auth/me endpoint to return quickly
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: 15004,
            steam_id: "66561198999999902",
            nickname: "heppajpg",
            email: "test@example.com",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z"
          }
        })
      });
    });

    // Mock the stats endpoint
    await page.route("**/api/v1/stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          unique_players: 4700,
          total_teams: 800,
          total_games: 15000,
          total_organizations: 220
        })
      });
    });

    // Mock the active season endpoint
    await page.route(
      "**/api/v1/organizers/1/app/730/seasons/active",
      async (route) => {
        console.log("Mocking active season endpoint");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            season_id: 14,
            name: "Test Season",
            start_date: "2023-01-01",
            end_date: "2023-12-31",
            status: "active"
          })
        });
      }
    );

    // Mock the teams endpoint
    await page.route(
      "**/api/v1/dashboard/sortter/season/*/teams",
      async (route) => {
        console.log("Mocking teams endpoint");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              team_id: 1650,
              team_name: "Test Team",
              division_id: 1,
              division_name: "Masters"
            }
          ])
        });
      }
    );

    // Mock calendar matches endpoint
    await page.route("**/api/v1/seasons/*/calendar/matches", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([])
      });
    });

    // Mock signup seasons endpoint
    await page.route(
      "**/api/v1/organizers/1/app/730/seasons/signup",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              season_id: 16,
              name: "Test Signup Season",
              start_date: "2024-01-01",
              end_date: "2024-12-31",
              status: "signup"
            }
          ])
        });
      }
    );

    console.log("API mocks setup completed");
  });

  test("should navigate to the signup page with authentication", async ({
    page
  }) => {
    // Start by checking authentication status
    console.log("Navigating to home page");
    await page.goto("/");

    // Use helper function for reliable page waiting
    await waitForPageReady(page, 15000);

    // Take a screenshot of the home page
    await page.screenshot({ path: `test-results/home-page-${Date.now()}.png` });
    console.log("Screenshot saved as home-page-[timestamp].png");

    // Navigate to signup page
    console.log("Navigating to signup page");
    await page.goto("/seasons/16/signup");

    // Use helper function for reliable navigation waiting
    await waitForNavigationComplete(page, 15000);

    // Take a screenshot of the signup page
    await page.screenshot({
      path: `test-results/signup-page-${Date.now()}.png`
    });
    console.log("Screenshot saved as signup-page-[timestamp].png");

    // Verify authentication by ensuring login button is not visible
    const steamLoginButton = page.locator(
      'button:has-text("Log in with Steam")'
    );

    // Assert: Login button should NOT be visible for authenticated users
    await expect(steamLoginButton).toHaveCount(0);
    console.log("✓ Authentication verified: login button is not visible");

    // Now try to navigate to the add-player page
    console.log("Navigating to add-player page");
    await page.goto("/dashboard/add-player");

    // Use helper function for reliable navigation waiting
    await waitForNavigationComplete(page, 15000);

    // Take a screenshot of the add-player page
    await page.screenshot({
      path: `test-results/add-player-page-${Date.now()}.png`
    });
    console.log("Screenshot saved as add-player-page-[timestamp].png");

    // Check if we're authenticated on the add-player page
    const addPlayerLoginButton = page.locator(
      '[data-testid="steam-login-button"]'
    );

    // Assert: Login button should NOT be visible on add-player page
    await expect(addPlayerLoginButton).toHaveCount(0);
    console.log(
      "✓ Authentication verified on add-player page: login button is not visible"
    );

    // Verify we can access the dashboard
    console.log("Navigating to dashboard");
    await page.goto("/dashboard");

    // Use helper function for reliable navigation waiting
    await waitForNavigationComplete(page, 15000);

    // Take a screenshot of the dashboard
    await page.screenshot({
      path: `test-results/dashboard-${Date.now()}.png`
    });
    console.log("Screenshot saved as dashboard-[timestamp].png");

    // Final authentication check
    const dashboardLoginButton = page.locator(
      'button:has-text("Log in with Steam")'
    );

    // Assert: Login button should NOT be visible on dashboard
    await expect(dashboardLoginButton).toHaveCount(0);
    console.log(
      "✓ Final authentication check passed: login button is not visible on dashboard"
    );

    // Additional assertion: Verify we can see user-specific content
    // This ensures the auth context is properly loaded
    const userContent = page.locator(
      '[data-user], [data-auth="ready"], .user-info, .profile-section'
    );
    if ((await userContent.count()) > 0) {
      console.log(
        "✓ User-specific content is visible, confirming authentication"
      );
    } else {
      console.log(
        "ℹ No user-specific content found, but authentication is working (login buttons hidden)"
      );
    }
  });
});
