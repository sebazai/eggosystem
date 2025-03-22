import { test, expect } from "./fixtures";

test.describe("Signup Form", () => {
  test("should navigate to the signup page with authentication", async ({
    page
  }) => {
    // Start by checking authentication status
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Navigate to signup page
    await page.goto("/signup/16/registration");
    await page.waitForLoadState("networkidle");

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

  // Setup for Team Faceit ID tests
  test.describe("Team Faceit ID Validation", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the form
      await page.goto("/signup/16/registration");
      await page.waitForLoadState("networkidle");

      // Verify we're on the signup form
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection
      const orgSelector = page.locator("select").first();
      await orgSelector.selectOption({ index: 1 });

      // Navigate to team section
      const teamSelectionButton = page.getByText("team selection", {
        exact: false
      });
      await teamSelectionButton.click();

      // Select team
      await page.waitForTimeout(500);
      const teamSelector = page.locator("select").first();
      await teamSelector.selectOption({ index: 1 });
    });

    test("should identify and access the Team Faceit ID field", async ({
      page
    }) => {
      // Find the Team Faceit ID field using multiple strategies
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify field is found
      await expect(faceitIdField).toBeVisible();

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      // Verify Go to lineup button is present
      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });
      await expect(goToLineupButton).toBeVisible();
    });

    test("should reject empty Faceit ID", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID with spaces", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104 d2f1 4f50 ba80 d58457cff5a9");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID without hyphens", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104d2f14f50ba80d58457cff5a9");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID with HTTP prefix", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("http://77dd9104-d2f1-4f50-ba80-d58457cff5a9");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID with colons", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104:d2f1:4f50:ba80:d58457cff5a9");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID that is too short", async ({ page }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104-d2f1");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should reject Faceit ID with special characters", async ({
      page
    }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9!@#");
      expect(await goToLineupButton.isDisabled()).toBeTruthy();
    });

    test("should accept valid UUID format and allow navigation", async ({
      page
    }) => {
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));

      // Verify help text is present with correct format guidance
      await expect(page.locator('[data-testid="faceitIdHelp"]')).toHaveText(
        "Insert the Faceit team ID in format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      );

      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });

      await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");
      expect(await goToLineupButton.isDisabled()).toBeFalsy();

      // Navigate to players section
      await goToLineupButton.click();

      // Verify we reached players section
      const playersHeading = page.getByText("Players", { exact: true });
      await expect(playersHeading).toBeVisible();
    });
  });

  // Setup for Steam ID tests
  test.describe("Steam ID Validation", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the form
      await page.goto("/signup/16/registration");
      await page.waitForLoadState("networkidle");

      // Verify we're on the signup form
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection
      const orgSelector = page.locator("select").first();
      await orgSelector.selectOption({ index: 1 });

      // Navigate to team section
      const teamSelectionButton = page.getByText("team selection", {
        exact: false
      });
      await teamSelectionButton.click();

      // Select team
      await page.waitForTimeout(500);
      const teamSelector = page.locator("select").first();
      await teamSelector.selectOption({ index: 1 });

      // Fill valid Faceit ID and navigate to players section
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));
      await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");

      // Click Go to lineup button
      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });
      await goToLineupButton.click();

      // Verify we're on the Players section
      await expect(page.getByText("Players", { exact: true })).toBeVisible();
    });

    test("should identify the Steam ID field", async ({ page }) => {
      // Find the Steam ID field using multiple strategies
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify field is found
      await expect(steamIdField).toBeVisible();

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      // Verify continue button is present
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      await expect(continueButton).toBeVisible();
    });

    test("should reject Steam ID with space in front", async ({ page }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill(" 76561198160889809");

      // Check for error helper text
      const helperText = page
        .locator(".steam-helper, [class*='helper'], [class*='error']")
        .or(page.locator("text='Only numbers are allowed'"))
        .or(page.locator("text=/spaces are not allowed/i"));

      await expect(helperText).toBeVisible();
      expect(await continueButton.isDisabled()).toBeTruthy();

      // After entering invalid input, helper should show an error message
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        /spaces are not allowed|Only numbers are allowed/i
      );
    });

    test("should reject Steam ID with space at the end", async ({ page }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill("76561198160889809 ");

      // Check for error helper text
      const helperText = page
        .locator(".steam-helper, [class*='helper'], [class*='error']")
        .or(page.locator("text='Only numbers are allowed'"))
        .or(page.locator("text=/spaces are not allowed/i"));

      await expect(helperText).toBeVisible();
      expect(await continueButton.isDisabled()).toBeTruthy();

      // After entering invalid input, helper should show an error message
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        /spaces are not allowed|Only numbers are allowed/i
      );
    });

    test("should reject Steam ID with spaces in the middle", async ({
      page
    }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill("765611 98160889809");

      // Check for error helper text
      const helperText = page
        .locator(".steam-helper, [class*='helper'], [class*='error']")
        .or(page.locator("text='Only numbers are allowed'"))
        .or(page.locator("text=/spaces are not allowed/i"));

      await expect(helperText).toBeVisible();
      expect(await continueButton.isDisabled()).toBeTruthy();

      // After entering invalid input, helper should show an error message
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        /spaces are not allowed|Only numbers are allowed/i
      );
    });

    test("should reject Steam ID with text characters only", async ({
      page
    }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill("xxdkqskd");

      // Check for error helper text
      const helperText = page
        .locator(".steam-helper, [class*='helper'], [class*='error']")
        .or(page.locator("text='Only numbers are allowed'"))
        .or(page.locator("text=/spaces are not allowed/i"));

      await expect(helperText).toBeVisible();
      expect(await continueButton.isDisabled()).toBeTruthy();

      // After entering invalid input, helper should show an error message
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "Only numbers are allowed"
      );
    });

    test("should reject Steam ID with mixed text and numbers", async ({
      page
    }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill("123test");

      // Check for error helper text
      const helperText = page
        .locator(".steam-helper, [class*='helper'], [class*='error']")
        .or(page.locator("text='Only numbers are allowed'"))
        .or(page.locator("text=/spaces are not allowed/i"));

      await expect(helperText).toBeVisible();
      expect(await continueButton.isDisabled()).toBeTruthy();

      // After entering invalid input, helper should show an error message
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "Only numbers are allowed"
      );
    });

    test("should accept valid numeric Steam ID and allow navigation", async ({
      page
    }) => {
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify helper text is present with correct format guidance
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(page.locator('[data-testid="steamHelper"]')).toHaveText(
        "Enter your 17-digit Steam ID (numbers only)"
      );

      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });

      await steamIdField.fill("76561198160889809");

      // Helper text should be visible but not contain error messages
      await expect(page.locator('[data-testid="steamHelper"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="steamHelper"]')
      ).not.toContainText(/spaces are not allowed|Only numbers are allowed/i);

      expect(await continueButton.isDisabled()).toBeFalsy();

      // Verify navigation to next step
      await continueButton.click();

      // We could add an assertion here about reaching the next step
      // But we'd need to know what that step is
    });
  });

  // Setup for Steam ID API mock tests
  test.describe("Steam ID API Response Validation", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the form
      await page.goto("/signup/16/registration");
      await page.waitForLoadState("networkidle");

      // Verify we're on the signup form
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection
      const orgSelector = page.locator("select").first();
      await orgSelector.selectOption({ index: 1 });

      // Navigate to team section
      const teamSelectionButton = page.getByText("team selection", {
        exact: false
      });
      await teamSelectionButton.click();

      // Select team
      await page.waitForTimeout(500);
      const teamSelector = page.locator("select").first();
      await teamSelector.selectOption({ index: 1 });

      // Fill valid Faceit ID and navigate to players section
      const faceitIdField = page
        .getByLabel("Team Faceit id", { exact: false })
        .or(page.getByPlaceholder("Faceit", { exact: false }))
        .or(page.locator('input[name*="faceit" i]'));
      await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");

      // Click Go to lineup button
      const goToLineupButton = page.getByRole("button", {
        name: /go to lineup/i,
        exact: false
      });
      await goToLineupButton.click();

      // Verify we're on the Players section
      await expect(page.getByText("Players", { exact: true })).toBeVisible();
    });

    test("should show error for non-public Steam profile", async ({ page }) => {
      // Find the Steam ID field using multiple strategies
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Verify field is found
      await expect(steamIdField).toBeVisible();

      // Set up mock API response for non-public profile
      await page.route("**/api/players/76561198160889800", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Steam profile must be public!",
            statusCode: 400
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("76561198160889800");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify error message appears in the helper text
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "⚠️ Steam profile must be public!"
      );

      // Verify the continue button is disabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeTruthy();
    });

    test("should show error for invalid Steam ID", async ({ page }) => {
      // Find the Steam ID field
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Set up mock API response for invalid Steam ID
      await page.route("**/api/players/12345678901234567", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message: "SteamID64 is invalid!",
            statusCode: 400
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("12345678901234567");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify error message appears in the helper text
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "⚠️ SteamID64 is invalid!"
      );

      // Verify the continue button is disabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeTruthy();
    });

    test("should show error for CS hours not readable", async ({ page }) => {
      // Find the Steam ID field
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Set up mock API response for CS hours not readable
      await page.route("**/api/players/76561198160889801", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message:
              "Could not read CS hours, ask player to set steam profile as public",
            statusCode: 400
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("76561198160889801");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify error message appears in the helper text
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "⚠️ Could not read CS hours, ask player to set steam profile as public"
      );

      // Verify the continue button is disabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeTruthy();
    });

    test("should show error for high hours low rank", async ({ page }) => {
      // Find the Steam ID field
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Set up mock API response for high hours low rank
      await page.route("**/api/players/76561198160889802", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message:
              "Contact support about this player rank (high hours low rank)",
            statusCode: 400
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("76561198160889802");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify error message appears in the helper text
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "⚠️ Contact support about this player rank (high hours low rank)"
      );

      // Verify the continue button is disabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeTruthy();
    });

    test("should show success for valid Steam profile", async ({ page }) => {
      // Find the Steam ID field
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Set up mock API response for valid Steam profile
      await page.route("**/api/players/76561198160889809", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            steamId: "76561198160889809",
            nickname: "TestPlayer",
            avatarUrl: "https://example.com/avatar.jpg",
            profileUrl: "https://steamcommunity.com/profiles/76561198160889809",
            hours: 2500,
            rank: "Global Elite"
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("76561198160889809");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify no error message appears in the helper text
      await expect(
        page.locator('[data-testid="steamHelper"]')
      ).not.toContainText("⚠️");

      // Verify the continue button is enabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeFalsy();
    });

    test("should show error for rank decay without CS2 rank", async ({
      page
    }) => {
      // Find the Steam ID field
      const steamIdField = page
        .getByLabel("STEAM ID", { exact: false })
        .or(page.locator('input[name*="steam" i]'))
        .or(page.locator("input").first());

      // Set up mock API response for player without CS2 rank (rank decay)
      await page.route("**/api/players/76561198160889803", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            message:
              "Contact support, rank decay when player does not have cs2rank",
            statusCode: 400
          })
        });
      });

      // Fill the Steam ID field with the ID that will trigger the mocked response
      await steamIdField.fill("76561198160889803");

      // Wait for API response to be processed
      await page.waitForTimeout(500);

      // Verify error message appears in the helper text
      await expect(page.locator('[data-testid="steamHelper"]')).toContainText(
        "⚠️ Contact support, rank decay when player does not have cs2rank"
      );

      // Verify the continue button is disabled
      const continueButton = page.getByRole("button", {
        name: /continue|submit|next/i,
        exact: false
      });
      expect(await continueButton.isDisabled()).toBeTruthy();
    });
  });

  // Keep original Steam ID test intact but commented out
  /* Original test
  test("should validate Steam ID format requirements", async ({ page }) => {
    // ... existing code ...
  });
  */
});
