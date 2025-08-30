import { test, type Page, type Route } from "@playwright/test";
import { generateTestJWTForUser } from "./utils";

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

    console.log("API mocks setup completed");
  });

  test("should navigate to the signup page with authentication", async ({
    page
  }) => {
    // Start by checking authentication status
    console.log("Navigating to home page");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Take a screenshot of the home page
    await page.screenshot({ path: `test-results/home-page-${Date.now()}.png` });
    console.log("Screenshot saved as home-page-[timestamp].png");

    // Navigate to signup page
    console.log("Navigating to signup page");
    await page.goto("/seasons/16/signup");
    await page.waitForLoadState("networkidle");

    // Take a screenshot of the signup page
    await page.screenshot({
      path: `test-results/signup-page-${Date.now()}.png`
    });
    console.log("Screenshot saved as signup-page-[timestamp].png");

    // Verify authentication by ensuring login button is not visible
    const steamLoginButton = page.locator(
      'button:has-text("Log in with Steam")'
    );
    const loginButtonExists = (await steamLoginButton.count()) > 0;

    if (loginButtonExists) {
      console.log("Not authenticated - login button is visible.");

      // Log the cookies for debugging
      const cookies = await page.context().cookies();
      console.log("Current cookies:", JSON.stringify(cookies, null, 2));

      // Log the current URL
      console.log("Current URL:", page.url());

      // Log visible elements using page.locator instead of evaluate
      const visibleElements = await page
        .locator("body *")
        .evaluateAll((elements) => {
          return elements
            .filter((el) => {
              const htmlEl = el as HTMLElement;
              return (
                htmlEl.innerText &&
                htmlEl.innerText.trim() !== "" &&
                htmlEl.offsetWidth > 0 &&
                htmlEl.offsetHeight > 0
              );
            })
            .slice(0, 10)
            .map((el) => {
              const htmlEl = el as HTMLElement;
              return {
                tag: htmlEl.tagName.toLowerCase(),
                id: htmlEl.id || null,
                className: htmlEl.className || null,
                text: htmlEl.innerText
                  ? htmlEl.innerText.trim().substring(0, 50)
                  : null
              };
            });
        });

      console.log(
        "Visible elements on page:",
        JSON.stringify(visibleElements, null, 2)
      );
    } else {
      console.log("Successfully authenticated - login button is not visible");
    }

    // Now try to navigate to the add-player page
    console.log("Navigating to add-player page");
    await page.goto("/dashboard/players/add");
    await page.waitForLoadState("networkidle");

    // Take a screenshot of the add-player page
    await page.screenshot({
      path: `test-results/add-player-page-${Date.now()}.png`
    });
    console.log("Screenshot saved as add-player-page-[timestamp].png");

    // Check if we're authenticated on the add-player page
    const addPlayerLoginButton =
      (await page.locator('[data-testid="steam-login-button"]').count()) > 0;

    if (addPlayerLoginButton) {
      console.log(
        "Not authenticated on add-player page - login button is visible"
      );

      // Log the current page content
      const html = await page.content();
      console.log(`Page HTML content length: ${html.length} characters`);

      // Check for any error messages on the page using page.locator
      const errorTexts = await page
        .locator('body *:has-text("error")')
        .allInnerTexts();
      if (errorTexts.length > 0) {
        console.log("Error text found on page:", errorTexts.join("\n"));
      }
    } else {
      console.log(
        "Successfully authenticated on add-player page - login button is not visible"
      );

      // Check if the team selector is visible
      const teamSelector =
        (await page.locator('[data-testid="team-selector"]').count()) > 0;
      if (teamSelector) {
        console.log("Team selector is visible - page loaded correctly");
      } else {
        console.log(
          "Team selector is not visible - page may not have loaded correctly"
        );
      }
    }
  });
});
