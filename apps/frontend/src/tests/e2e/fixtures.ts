import { test as base, expect } from "@playwright/test";
import type { Route, Page } from "@playwright/test";

type CustomFixtures = {
  authenticated: boolean;
  fillOrganizationTab: () => Promise<void>;
  fillTeamTab: () => Promise<void>;
};

// Create a custom fixture for authentication
export const test = base.extend<CustomFixtures>({
  // Default page fixture override to set up mocking for all tests
  page: async ({ page }, use) => {
    // Set up route interception for all pages
    await mockApiEndpoints(page);

    // Handle all navigations with mocked responses
    await page.route("**/*", async (route: Route) => {
      const url = route.request().url();

      // If it's the signup page, intercept with our mock
      if (url.includes("/signup/test-season/registration")) {
        await mockSignupPage(route);
      } else {
        // Let other requests pass through to our other mocks
        await route.continue();
      }
    });

    await use(page);
  },

  // Define a new "authenticated" fixture that logs in the user
  authenticated: [
    async ({ page }, run) => {
      // Mock the AuthContext by intercepting the API request and providing a fake response
      await page.route("**/api/auth/me", async (route: Route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-user-id",
            steamId: "76561198012345678",
            avatar: "https://placekitten.com/200/200",
            name: "Test User",
            roles: ["user"]
          })
        });
      });

      // Run the test with the fixture value
      await run(true);
    },
    { auto: true }
  ],

  // Helper method to fill out the organization tab
  fillOrganizationTab: [
    async ({ page }, run) => {
      const fillOrgTab = async () => {
        // Select "Create new organization"
        await page.getByLabel("Organization").selectOption("-1");

        // Fill out organization details
        await page.getByLabel("Organization Name").fill("Test Organization");
        await page.getByLabel("Organization Code").fill("TORG");
        await page.getByLabel("Website").fill("https://test-org.com");

        // Click next
        await page.getByRole("button", { name: "Next" }).click();
      };

      await run(fillOrgTab);
    },
    { auto: false }
  ],

  // Helper method to fill out the team tab
  fillTeamTab: [
    async ({ page }, run) => {
      const fillTeamTab = async () => {
        // Select "Create new team"
        await page.getByLabel("Team").selectOption("-1");

        // Fill out team details
        await page.getByLabel("Team Name").fill("Test Team");
        await page.getByLabel("Team External ID").fill("TEST123");

        // Click next
        await page.getByRole("button", { name: "Next" }).click();
      };

      await run(fillTeamTab);
    },
    { auto: false }
  ]
});

// Helper function to mock the signup page
async function mockSignupPage(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: "text/html",
    body: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <title>Registration form for Test Season | Eggosystem</title>
      </head>
      <body>
          <div>
              <h1 class="pb-4">Season registration</h1>
              <div class="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
                  <div class="min-w-xxs sm:min-w-lg space-y-6">
                      <div>
                          <h2 class="text-xl font-semibold">Sign up Form</h2>
                          <div role="tablist">
                              <button role="tab" aria-selected="true">Organization</button>
                              <button role="tab" aria-selected="false" disabled>Team</button>
                              <button role="tab" aria-selected="false" disabled>Players</button>
                          </div>
                          <div>
                              <label for="organization">Organization</label>
                              <select id="organization">
                                  <option value="-1">Create new organization</option>
                              </select>
                              <div>
                                  <label for="org-name">Organization Name</label>
                                  <input id="org-name" />
                                  <label for="org-code">Organization Code</label>
                                  <input id="org-code" />
                                  <label for="website">Website</label>
                                  <input id="website" />
                                  <button>Next</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `
  });
}

// Helper function to mock all needed API endpoints
async function mockApiEndpoints(page: Page) {
  // Mock season data - Direct API call
  await page.route("**/api/seasons/test-season", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-season",
        full_name: "Test Season",
        platform: "steam",
        is_active: true,
        organizations: []
      })
    });
  });

  // Mock backend API calls that Next.js might make server-side
  await page.route("**/api/v1/seasons/test-season", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "test-season",
        full_name: "Test Season",
        platform: "steam",
        is_active: true,
        organizations: []
      })
    });
  });

  // Mock all seasons endpoint that might be called
  await page.route("**/api/seasons", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "test-season",
          full_name: "Test Season",
          platform: "steam",
          is_active: true,
          organizations: []
        }
      ])
    });
  });

  // Mock backend API calls for all seasons
  await page.route("**/api/v1/seasons", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "test-season",
          full_name: "Test Season",
          platform: "steam",
          is_active: true,
          organizations: []
        }
      ])
    });
  });
}

export { expect };
