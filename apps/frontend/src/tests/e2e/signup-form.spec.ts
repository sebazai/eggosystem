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

  // test("should validate Steam ID format requirements", async ({ page }) => {
  //   // Navigate to the signup page
  //   await page.goto("/signup/16/registration");
  //   await page.waitForLoadState("networkidle");

  //   // Take a screenshot of the initial form
  //   await page.screenshot({ path: "test-results/steamid-initial-form.png" });

  //   // Follow the navigation path to reach the Players section

  //   // 1. First verify we're on the organization selection screen
  //   const orgHeading = page.getByText("SIGN UP FORM");
  //   await expect(orgHeading).toBeVisible({ timeout: 5000 });
  //   console.log("Found sign up form heading");

  //   // 2. Select organization
  //   const orgSelector = page.locator("select").first();
  //   if (await orgSelector.isVisible()) {
  //     await orgSelector.selectOption({ index: 1 });
  //     console.log("Selected existing organization from dropdown");
  //   }

  //   // 3. Navigate to Team section
  //   const teamSelectionButton = page.getByText("team selection", {
  //     exact: false
  //   });
  //   if (await teamSelectionButton.isVisible()) {
  //     await teamSelectionButton.click();
  //     console.log("Clicked 'Team selection' button");
  //   }

  //   // 4. Select team and input valid Faceit ID
  //   await page.waitForTimeout(1000);
  //   const teamSelector = page.locator("select").first();
  //   if (await teamSelector.isVisible()) {
  //     await teamSelector.selectOption({ index: 1 });
  //     console.log("Selected team from dropdown");
  //   }

  //   // 5. Enter valid Faceit ID to proceed
  //   let faceitIdField = page.getByLabel("Team Faceit id", { exact: false });
  //   if (!(await faceitIdField.isVisible())) {
  //     // Try alternative selectors if the label method doesn't work
  //     const faceitInputByFieldPath = page.locator('input[name*="faceit" i]');
  //     if (await faceitInputByFieldPath.isVisible()) {
  //       faceitIdField = faceitInputByFieldPath;
  //     }
  //   }

  //   if (await faceitIdField.isVisible()) {
  //     // Enter valid UUID format
  //     await faceitIdField.fill("77dd9104-d2f1-4f50-ba80-d58457cff5a9");
  //     console.log("Filled valid Faceit ID");

  //     // 6. Click Go to lineup button
  //     const goToLineupButton = page.getByRole("button", {
  //       name: /go to lineup/i,
  //       exact: false
  //     });
  //     if (!(await goToLineupButton.isDisabled())) {
  //       await goToLineupButton.click();
  //       console.log("Clicked Go to Lineup with valid Faceit ID");
  //     }

  //     // 7. Verify we're on the Players section
  //     await page.waitForTimeout(1000);
  //     await page.screenshot({
  //       path: "test-results/steamid-players-section.png"
  //     });

  //     const playersHeading = page.getByText("Players", { exact: true });
  //     await expect(playersHeading).toBeVisible({ timeout: 5000 });
  //     console.log("Successfully navigated to Players section");

  //     // Now test the Steam ID field
  //     // Find the Steam ID field
  //     let steamIdField = page.getByLabel("STEAM ID", { exact: false });
  //     if (!(await steamIdField.isVisible())) {
  //       // Instead of assigning potentially undefined value, create a new definite locator
  //       steamIdField = page.locator("input").first();
  //       console.log("Using first input field as Steam ID field");
  //     }

  //     await page.screenshot({ path: "test-results/steamid-field-located.png" });

  //     // Verify we found the Steam ID field
  //     if (await steamIdField.isVisible()) {
  //       console.log("Found Steam ID field");

  //       // Define test cases for invalid Steam ID formats
  //       const steamIdTestCases = [
  //         {
  //           description: "Space in front",
  //           input: " 76561198160889809",
  //           expected: true, // Should show error
  //           helperTextExpected: true,
  //           screenshotName: "steamid-space-front.png"
  //         },
  //         {
  //           description: "Space at the end",
  //           input: "76561198160889809 ",
  //           expected: true, // Should show error
  //           helperTextExpected: true,
  //           screenshotName: "steamid-space-end.png"
  //         },
  //         {
  //           description: "Space in the middle",
  //           input: "765611 98160889809",
  //           expected: true, // Should show error
  //           helperTextExpected: true,
  //           screenshotName: "steamid-space-middle.png"
  //         },
  //         {
  //           description: "Text characters only",
  //           input: "xxdkqskd",
  //           expected: true, // Should show error
  //           helperTextExpected: true,
  //           screenshotName: "steamid-text-only.png"
  //         },
  //         {
  //           description: "Mixed text and numbers",
  //           input: "123test",
  //           expected: true, // Should show error
  //           helperTextExpected: true,
  //           screenshotName: "steamid-mixed.png"
  //         },
  //         {
  //           description: "Valid format (numbers only)",
  //           input: "76561198160889809",
  //           expected: false, // Should not show error
  //           helperTextExpected: false,
  //           screenshotName: "steamid-valid.png"
  //         }
  //       ];

  //       // Get the continue button or submit button
  //       const continueButton = page.getByRole("button", {
  //         name: /continue|submit|next/i,
  //         exact: false
  //       });

  //       // Run through each test case
  //       for (const testCase of steamIdTestCases) {
  //         console.log(`Testing Steam ID: ${testCase.description}`);

  //         // Clear field and fill with test value
  //         await steamIdField.clear();
  //         await steamIdField.fill(testCase.input);
  //         await page.waitForTimeout(500); // Give time for validation

  //         // Take screenshot of current state
  //         await page.screenshot({
  //           path: `test-results/${testCase.screenshotName}`
  //         });

  //         // Look for error helper text
  //         const helperText = page
  //           .locator(".steam-helper, [class*='helper'], [class*='error']")
  //           .or(page.locator("text='Only numbers are allowed'"))
  //           .or(page.locator("text=/spaces are not allowed/i"));

  //         const hasHelperText = await helperText.isVisible();
  //         console.log(
  //           `Helper text visible (${testCase.description}):`,
  //           hasHelperText
  //         );

  //         // Check if helper text appears as expected
  //         expect(hasHelperText).toBe(testCase.helperTextExpected);

  //         // Check if button is disabled with invalid input
  //         const isButtonDisabled = await continueButton.isDisabled();
  //         console.log(
  //           `Button disabled (${testCase.description}):`,
  //           isButtonDisabled
  //         );

  //         // Button should be disabled for invalid formats
  //         expect(isButtonDisabled).toBe(testCase.expected);
  //       }

  //       // Verify we can proceed with valid Steam ID
  //       await steamIdField.clear();
  //       await steamIdField.fill("76561198160889809");
  //       await page.waitForTimeout(500);

  //       const isButtonEnabled = !(await continueButton.isDisabled());
  //       console.log("Button enabled with valid Steam ID:", isButtonEnabled);
  //       expect(isButtonEnabled).toBe(true);

  //       // Verify we can proceed to the next step
  //       if (isButtonEnabled) {
  //         await continueButton.click();
  //         console.log("Clicked continue with valid Steam ID");
  //         await page.waitForTimeout(1000);
  //         await page.screenshot({
  //           path: "test-results/steamid-after-valid-submission.png"
  //         });
  //       }
  //     } else {
  //       console.log("Could not locate Steam ID field");
  //       await page.screenshot({
  //         path: "test-results/steamid-field-not-found.png"
  //       });
  //       throw new Error("Steam ID field not found");
  //     }
  //   } else {
  //     console.log("Could not locate Faceit ID field");
  //     await page.screenshot({
  //       path: "test-results/faceit-id-field-not-found-steamid-test.png"
  //     });
  //     throw new Error("Faceit ID field not found");
  //   }
  // });
});
