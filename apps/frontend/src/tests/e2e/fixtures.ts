import { test as base, expect } from "@playwright/test";

// Define our custom fixtures
type CustomFixtures = {
  authenticated: boolean;
};

// Create custom test function with extended fixtures
export const test = base.extend<CustomFixtures>({
  // Mock authentication
  authenticated: [
    async ({ page }, use) => {
      // Set up debugging for network requests to see what calls are being made
      page.on("request", (request) => {
        if (request.url().includes("/auth/")) {
          console.log("Request URL:", request.url());
        }
      });

      // The AuthContext uses this specific path
      await page.route("**/api/v1/auth/me", async (route) => {
        console.log("Intercepted /api/v1/auth/me request!");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: "test-user-id",
              steamId: "76561198012345678",
              avatar: "https://placekitten.com/200/200",
              name: "Test User",
              roles: ["user"]
            }
          })
        });
      });

      // Also intercept the session endpoint
      await page.route("**/api/v1/auth/session", async (route) => {
        console.log("Intercepted /api/v1/auth/session request!");
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

      // Add authentication cookies
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

      // Make sure to do this BEFORE navigating to any page
      console.log("Authentication mocking set up");

      // Run the test
      await use(true);
    },
    { auto: true }
  ]
});

export { expect };
