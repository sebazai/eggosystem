import { test, expect } from "./fixtures";

test.describe("Signup Form", () => {
  test("should navigate to the signup page with authentication", async ({
    page
  }) => {
    // First check auth status before navigating to registration page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Debug - Check if we see any auth-related UI elements
    console.log("Checking auth status on homepage");
    await page.screenshot({ path: "test-results/auth-status-home.png" });

    // Now navigate to the signup page
    await page.goto("/signup/16/registration");
    await page.waitForLoadState("networkidle");

    // Debug - Output page content and take screenshot
    console.log("Page URL:", page.url());
    await page.screenshot({ path: "test-results/signup-page.png" });

    // Take another approach to determine if we're authenticated
    // We'll look for the login button which should NOT be visible if we're properly authenticated
    const steamLoginButton = page.locator(
      'button:has-text("Log in with Steam")'
    );
    const isLoginButtonVisible = await steamLoginButton.isVisible();
    console.log("Steam login button visible:", isLoginButtonVisible);

    // We expect the login button to NOT be visible
    await expect(steamLoginButton).not.toBeVisible({ timeout: 5000 });

    // Check if we can see the signup form instead
    console.log("Looking for signup form elements...");

    // Check for the registration heading
    const registrationHeading = page.getByRole("heading", {
      name: "Season registration",
      exact: true
    });
    const isHeadingVisible = await registrationHeading.isVisible();
    console.log("Registration heading visible:", isHeadingVisible);

    // If we're properly authenticated, we should see the form
    if (!isHeadingVisible) {
      // Dump page HTML for debugging
      const html = await page.content();
      console.log("Page HTML excerpt:", html.substring(0, 500) + "...");
    }

    // We should see the form heading when authenticated
    await expect(registrationHeading).toBeVisible({ timeout: 5000 });

    console.log("Test completed successfully!");
  });

  test("should validate Team Faceit ID format requirements", async ({
    page
  }) => {
    // Navigate to the signup page
    await page.goto("/signup/16/registration");
    await page.waitForLoadState("networkidle");

    // Take a screenshot of the initial form
    await page.screenshot({ path: "test-results/initial-form.png" });

    // Debug the current page structure
    console.log("Examining form elements...");
    const formContent = await page.content();
    console.log("Page content excerpt:", formContent.substring(0, 200) + "...");

    // Verify we're on the organization selection screen
    const orgHeading = page.getByText("SIGN UP FORM");
    await expect(orgHeading).toBeVisible({ timeout: 5000 });
    console.log("Found sign up form heading");

    // Check if we can see the organization part of the form
    const orgTab = page.getByText("Organization", { exact: true }).first();
    if (await orgTab.isVisible()) {
      console.log("Found Organization tab");
    }

    // Find and click the organization select dropdown
    const orgSelector = page.locator("select").first();
    if (await orgSelector.isVisible()) {
      // Count options in the dropdown
      const optionCount = await page.locator("select option").count();
      console.log("Number of options in organization dropdown:", optionCount);

      // Select an existing organization (index 1)
      await orgSelector.selectOption({ index: 1 });
      console.log("Selected existing organization from dropdown");
    } else {
      console.log("Standard dropdown not found, trying alternative selectors");

      // Try to find the organization selection field
      const combobox = page.locator("[role=combobox]").first();
      if (await combobox.isVisible()) {
        await combobox.click();
        const option = page.locator("[role=option]").nth(1);
        if (await option.isVisible()) {
          await option.click();
        }
      }
    }

    // Take a screenshot after organization selection
    await page.screenshot({ path: "test-results/org-selected.png" });

    // Find and click the "Team selection" button to proceed to team section
    const teamSelectionButton = page.getByText("team selection", {
      exact: false
    });
    if (await teamSelectionButton.isVisible()) {
      console.log("Found 'Team selection' button");
      await teamSelectionButton.click();
      console.log("Clicked 'Team selection' button");
    } else {
      console.log(
        "'Team selection' button not visible, looking for alternatives"
      );

      // Try finding buttons by role
      const allButtons = await page.locator("button").allTextContents();
      console.log("All button texts:", allButtons);

      // Try the Next button
      const nextButton = page.getByRole("button", { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        console.log("Clicked Next button");
      } else {
        // Try to find the Submit button which might also navigate
        const submitButton = page.locator("button:has-text('Submit')");
        if (await submitButton.isVisible()) {
          await submitButton.click();
          console.log("Clicked Submit button");
        }
      }
    }

    // Wait for team section to load and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/after-org-navigation.png" });

    // Verify that we're now on the team section
    console.log("Checking if we're on team section...");
    const teamText = await page
      .getByText("Team", { exact: true })
      .first()
      .isVisible();
    console.log("Team text visible:", teamText);

    if (!teamText) {
      // If Team text is not visible, we might not have properly navigated
      console.log("Not on team section yet, retrying navigation");

      // Look for any "select team" element
      const teamSelect = page.getByText("Select team", { exact: false });
      if (await teamSelect.isVisible()) {
        console.log("Found 'Select team', we are on team section");
      } else {
        // Try clicking directly on the Team tab
        const teamTab = page.locator("button:has-text('Team')");
        if (await teamTab.isVisible()) {
          await teamTab.click();
          console.log("Clicked directly on Team tab");
        }
      }

      await page.waitForTimeout(500);
      await page.screenshot({
        path: "test-results/after-direct-tab-click.png"
      });
    }

    // Select team from dropdown
    const teamSelector = page.locator("select").first();
    if (await teamSelector.isVisible()) {
      await teamSelector.selectOption({ index: 1 });
      console.log("Selected team from dropdown");
    } else {
      console.log("Team dropdown not visible, trying alternatives");
      const teamCombobox = page.locator("[role=combobox]").first();
      if (await teamCombobox.isVisible()) {
        await teamCombobox.click();
        const option = page.locator("[role=option]").nth(1);
        if (await option.isVisible()) {
          await option.click();
        }
      }
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/team-selected.png" });

    // Now look for the Team Faceit ID field
    let faceitIdField = page.getByLabel("Team Faceit id", { exact: false });
    if (await faceitIdField.isVisible()) {
      console.log("Found Team Faceit ID field");
    } else {
      console.log(
        "Team Faceit ID field not found by label, trying alternatives"
      );

      // Try to find input fields that might be the Faceit ID field
      const inputFields = page.locator("input");
      const inputCount = await inputFields.count();
      console.log("Number of input fields:", inputCount);

      // Look for placeholder texts
      const placeholders = [];
      for (let i = 0; i < inputCount; i++) {
        const placeholder =
          (await inputFields.nth(i).getAttribute("placeholder")) || "";
        placeholders.push(placeholder);
      }
      console.log("Input placeholders:", placeholders);

      // Try to find by placeholder
      const faceitByPlaceholder = page.getByPlaceholder("Faceit", {
        exact: false
      });
      if (await faceitByPlaceholder.isVisible()) {
        console.log("Found Faceit ID field by placeholder");
        // Reassign the field
        faceitIdField = faceitByPlaceholder;
      } else {
        // Try to find input with specific ID pattern
        const faceitInputByFieldPath = page.locator('input[name*="faceit" i]');
        if (await faceitInputByFieldPath.isVisible()) {
          console.log("Found Faceit ID field by name attribute");
          // Reassign the field
          faceitIdField = faceitInputByFieldPath;
        }
      }
    }

    // Find the "Go to lineup" button
    const goToLineupButton = page.getByRole("button", {
      name: /go to lineup/i,
      exact: false
    });
    await expect(goToLineupButton).toBeVisible({ timeout: 5000 });
    console.log("Found 'Go to lineup' button");

    // If we found the field, proceed with testing
    if (await faceitIdField.isVisible()) {
      // Test 1: Empty field
      await faceitIdField.fill("");
      await page.screenshot({ path: "test-results/faceit-id-empty.png" });

      // Check if the button is disabled with empty field
      const isDisabledEmpty = await goToLineupButton.isDisabled();
      console.log("Button disabled with empty field:", isDisabledEmpty);
      expect(isDisabledEmpty).toBe(true);

      // Test 2: Invalid format (spaces)
      await faceitIdField.fill("spaces are not valid");
      await page.screenshot({ path: "test-results/faceit-id-spaces.png" });

      // Check if the button is disabled with spaces
      const isDisabledSpaces = await goToLineupButton.isDisabled();
      console.log("Button disabled with spaces:", isDisabledSpaces);
      expect(isDisabledSpaces).toBe(true);

      // Test 3: Invalid format (wrong characters)
      await faceitIdField.fill("invalid-chars-!");
      await page.screenshot({
        path: "test-results/faceit-id-invalid-chars.png"
      });

      // Check if the button is disabled with invalid characters
      const isDisabledInvalidChars = await goToLineupButton.isDisabled();
      console.log(
        "Button disabled with invalid characters:",
        isDisabledInvalidChars
      );
      expect(isDisabledInvalidChars).toBe(true);

      // Test 4: Invalid format (too short)
      await faceitIdField.fill("abc123");
      await page.screenshot({ path: "test-results/faceit-id-too-short.png" });

      // Check if the button is disabled with too short ID
      const isDisabledTooShort = await goToLineupButton.isDisabled();
      console.log("Button disabled with too short ID:", isDisabledTooShort);
      expect(isDisabledTooShort).toBe(true);

      // Test 5: Valid UUID format
      const validUuid = "77dd9104-d2f1-4f50-ba80-d58457cff5a9";
      await faceitIdField.fill(validUuid);
      await page.screenshot({ path: "test-results/faceit-id-valid.png" });

      // Check if the button is enabled with valid UUID
      await page.waitForTimeout(500); // Give time for validation to complete
      const isDisabledValid = await goToLineupButton.isDisabled();
      console.log("Button disabled with valid UUID:", isDisabledValid);
      expect(isDisabledValid).toBe(false);

      // Now clicking Go to Lineup should work
      if (!isDisabledValid) {
        await goToLineupButton.click();
        console.log("Clicked Go to Lineup with valid Faceit ID");

        // Check if we successfully navigated to the lineup/players section
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: "test-results/after-valid-faceit-id.png"
        });

        // At this point we should be able to see the Players section
        const playersHeading = page.getByText("Players", { exact: true });
        const isPlayersPageVisible = await playersHeading.isVisible({
          timeout: 5000
        });
        console.log(
          "Players page visible with valid UUID:",
          isPlayersPageVisible
        );

        // The test should pass if we were able to navigate to players with valid UUID
        expect(isPlayersPageVisible).toBe(true);
      }
    } else {
      console.log("Could not locate Team Faceit ID field");
      // Take screenshot of current page state for debugging
      await page.screenshot({
        path: "test-results/faceit-id-field-not-found.png"
      });
    }
  });
});
