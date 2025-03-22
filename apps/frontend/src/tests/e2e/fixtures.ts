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
    // Set up storage state to simulate being logged in
    await page.context().addCookies([
      {
        name: "next-auth.session-token",
        value: "fake-jwt-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false
      }
    ]);

    // Set up route interception for all pages
    await mockApiEndpoints(page);

    // Mock AuthContext data
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

    // Mock authentication session
    await page.route("**/api/auth/session", async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-user-id",
            steamId: "76561198012345678",
            name: "Test User",
            email: "test@example.com",
            image: "https://placekitten.com/200/200"
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });

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
      // Already handled in the page fixture
      await run(true);
    },
    { auto: true }
  ],

  // Helper method to fill out the organization tab
  fillOrganizationTab: [
    async ({ page }, run) => {
      const fillOrgTab = async () => {
        // Wait for the form to be fully loaded
        await page.waitForSelector('select[id="organization"]');

        // Select "Create new organization"
        await page.selectOption('select[id="organization"]', "-1");

        // Fill out organization details
        await page.fill('input[id="org-name"]', "Test Organization");
        await page.fill('input[id="org-code"]', "TORG");
        await page.fill('input[id="website"]', "https://test-org.com");

        // Click next
        await page.click('button:text("Next")');
      };

      await run(fillOrgTab);
    },
    { auto: false }
  ],

  // Helper method to fill out the team tab
  fillTeamTab: [
    async ({ page }, run) => {
      const fillTeamTab = async () => {
        // Wait for the team tab to be visible
        await page.waitForSelector('select[id="team"]');

        // Select "Create new team"
        await page.selectOption('select[id="team"]', "-1");

        // Fill out team details
        await page.fill('input[id="team-name"]', "Test Team");
        await page.fill('input[id="team-external-id"]', "TEST123");

        // Click next
        await page.click('button:text("Next")');
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
          <script>
            // Mock window.localStorage
            Object.defineProperty(window, 'localStorage', {
              value: {
                getItem: function(key) {
                  return JSON.stringify({token: 'fake-token', user: {id: 'test-user-id', name: 'Test User'}});
                },
                setItem: function() {},
                removeItem: function() {}
              }
            });
          </script>
          <style>
            .text-red-500 { color: red; }
            .hidden { display: none; }
          </style>
      </head>
      <body>
          <div>
              <h1 class="pb-4">Season registration</h1>
              <div class="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
                  <div class="min-w-xxs sm:min-w-lg space-y-6">
                      <div>
                          <h2 class="text-xl font-semibold">Sign up Form</h2>
                          <div role="tablist">
                              <button role="tab" aria-selected="true" id="organization-tab">Organization</button>
                              <button role="tab" aria-selected="false" disabled id="team-tab">Team</button>
                              <button role="tab" aria-selected="false" disabled id="players-tab">Players</button>
                          </div>
                          <div id="organization-section">
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
                                  <button id="org-next-btn">Next</button>
                              </div>
                          </div>
                          <div id="team-section" style="display:none">
                              <label for="team">Team</label>
                              <select id="team">
                                  <option value="-1">Create new team</option>
                              </select>
                              <div>
                                  <label for="team-name">Team Name</label>
                                  <input id="team-name" />
                                  <label for="team-external-id">Team External ID</label>
                                  <input id="team-external-id" />
                                  <button id="team-next-btn">Next</button>
                              </div>
                          </div>
                          <div id="players-section" style="display:none">
                              <h3>Player Information</h3>
                              <div>
                                  <div id="player-0">
                                      <label for="player-0-name">Player Name</label>
                                      <input id="player-0-name" />
                                      <label for="player-0-steam">Steam ID</label>
                                      <input id="player-0-steam" />
                                      <span id="steam-error" class="text-red-500 hidden">Invalid Steam ID format</span>
                                      <label for="player-0-email">Email</label>
                                      <input id="player-0-email" />
                                      <label for="player-0-captain">
                                          <input type="checkbox" id="player-0-captain" /> Captain
                                      </label>
                                  </div>
                                  <button id="submit-btn">Submit</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <script>
            // Mock tab navigation
            document.addEventListener('DOMContentLoaded', function() {
              // Organization to Team navigation
              document.getElementById('org-next-btn').addEventListener('click', function() {
                // Hide organization section
                document.getElementById('organization-section').style.display = 'none';
                // Show team section
                document.getElementById('team-section').style.display = 'block';
                // Update tab selection
                document.getElementById('organization-tab').setAttribute('aria-selected', 'false');
                document.getElementById('team-tab').setAttribute('aria-selected', 'true');
                document.getElementById('team-tab').removeAttribute('disabled');
              });
              
              // Team to Players navigation
              document.getElementById('team-next-btn').addEventListener('click', function() {
                // Hide team section
                document.getElementById('team-section').style.display = 'none';
                // Show players section
                document.getElementById('players-section').style.display = 'block';
                // Update tab selection
                document.getElementById('team-tab').setAttribute('aria-selected', 'false');
                document.getElementById('players-tab').setAttribute('aria-selected', 'true');
                document.getElementById('players-tab').removeAttribute('disabled');
              });
              
              // Validate Steam ID
              document.getElementById('player-0-steam').addEventListener('input', function(e) {
                const steamIdInput = e.target;
                const errorElement = document.getElementById('steam-error');
                const steamIdRegex = /^[0-9]{17}$/;
                
                if (steamIdInput.value && !steamIdRegex.test(steamIdInput.value)) {
                  errorElement.classList.remove('hidden');
                } else {
                  errorElement.classList.add('hidden');
                }
              });
              
              // Submit form validation
              document.getElementById('submit-btn').addEventListener('click', function(e) {
                const steamIdInput = document.getElementById('player-0-steam');
                const errorElement = document.getElementById('steam-error');
                const steamIdRegex = /^[0-9]{17}$/;
                
                if (steamIdInput.value && !steamIdRegex.test(steamIdInput.value)) {
                  errorElement.classList.remove('hidden');
                  e.preventDefault();
                }
              });
            });
          </script>
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

  // Mock API endpoints for teams and organizations
  await page.route("**/api/organizations", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });

  await page.route("**/api/teams", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([])
    });
  });
}

export { expect };
