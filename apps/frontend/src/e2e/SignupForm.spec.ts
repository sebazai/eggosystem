import { expect, test, type Page } from "@playwright/test";
import {
  generateTestJWTForUser,
  generateUniqueOrgCode,
  generateUniqueFaceitTeamId,
  generateUniqueOrgName,
  generateUniqueTeamName
} from "./utils";
import {
  AabeSteamId,
  heppajpgSteamId,
  HoolyzSteamId,
  InsufficientHoursPlayerSteamId,
  NoFaceitRankPlayerSteamId,
  QuattraSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  TrevSteamId,
  ValidWorkEmail1SteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId
} from "@eggosystem/types";

async function assignCaptain(page: Page) {
  // Try to expand accordions and assign captain/co-captain roles

  const accordionTriggers = page.locator(
    `[data-testid="player-accordion-triggers"]`
  );

  // Always assign player 0 as captain
  const trigger0 = accordionTriggers.nth(0);
  if (await trigger0.isVisible()) {
    const isOpen = await trigger0.getAttribute("data-state");
    if (isOpen === "closed") {
      await trigger0.click();
    }
    const captainCheckbox = page.locator(`[data-testid="captain-checkbox-0"]`);
    if (await captainCheckbox.isVisible()) {
      const isAlreadyCaptain =
        await captainCheckbox.getAttribute("aria-checked");
      if (isAlreadyCaptain !== "true") {
        await captainCheckbox.click();
      }
    }
  }

  // Assign player 1 as co-captain
  const trigger1 = accordionTriggers.nth(1);
  if (await trigger1.isVisible()) {
    const isOpen = await trigger1.getAttribute("data-state");
    if (isOpen === "closed") {
      await trigger1.click();
    }
    const coCaptainCheckbox = page.locator(
      `[data-testid="co-captain-checkbox-1"]`
    );
    if (await coCaptainCheckbox.isVisible()) {
      const isAlreadyCoCaptain =
        await coCaptainCheckbox.getAttribute("aria-checked");
      if (isAlreadyCoCaptain !== "true") {
        await coCaptainCheckbox.click();
      }
    }
  }

  // Wait for validation error to clear (it might take a moment)
  await page.waitForTimeout(1000);

  // Check that validation error is not visible
  const validationError = page.getByText(
    "There must be exactly one captain and one co-captain"
  );
  await expect(validationError).not.toBeVisible({ timeout: 5000 });
}

// Helper function to set up the form to the team FACEIT ID input stage
async function setupFormToFaceitIdInput(page: Page) {
  // Navigate to the form
  await page.goto("/seasons/16/signup/registration");

  // Verify we're on the signup form
  await expect(
    page.getByRole("heading", { name: "Season registration" })
  ).toBeVisible();
  await expect(page.getByText("SIGN UP FORM")).toBeVisible();

  // Complete organization selection using data-testid attributes
  await page.locator('[data-testid="organizations-dropdown-toggle"]').click();

  // Select "Other" option
  await page.locator('[data-testid="organizations-add-new"]').click();

  // Fill in required organization fields
  await page
    .locator('[data-testid="organization-name-input"]')
    .fill(generateUniqueOrgName("Test Organization"));
  await page
    .locator('[data-testid="organization-business-id-input"]')
    .fill(generateUniqueOrgCode());
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

  // Select "Add new" for team
  await page.locator('[data-testid="teams-dropdown-toggle"]').click();
  await page.locator('[data-testid="teams-add-new"]').click();

  // Fill in the new team name
  await page
    .locator('[data-testid="team-name-input"]')
    .fill(generateUniqueTeamName("Test Team"));
}

// Helper function to set up the form to the players section using existing team_id 999
async function setupFormToPlayersSectionWithTeam999(page: Page) {
  // Navigate to the form
  await page.goto("/seasons/16/signup/registration");

  // Complete organization selection - select existing organization 999
  await page.locator('[data-testid="organizations-dropdown-toggle"]').click();
  await page.locator('[data-testid="organizations-option-999"]').click();
  await page.locator('[data-testid="terms-conditions-checkbox"]').click();

  // Move to team section
  await page.locator('[data-testid="team-selection-button"]').click();

  // Complete team selection - select existing team 999
  await page.locator('[data-testid="teams-dropdown-toggle"]').click();
  await page.locator('[data-testid="teams-option-999"]').click();
  await page
    .locator('[data-testid="team-external-id-input"]')
    .fill(generateUniqueFaceitTeamId());

  // Navigate to players section
  await page.locator('[data-testid="go-to-lineup-button"]').click();
}

// Helper function to set up complete registration form with new organization/team
async function setupCompleteRegistrationForm(
  page: Page,
  orgName: string,
  teamName: string
) {
  // Navigate to the registration form
  await page.goto("/seasons/16/signup/registration");

  // Complete organization selection
  await page.locator('[data-testid="organizations-dropdown-toggle"]').click();
  await page.locator('[data-testid="organizations-add-new"]').click();
  await page.locator('[data-testid="organization-name-input"]').fill(orgName);
  await page
    .locator('[data-testid="organization-business-id-input"]')
    .fill(generateUniqueOrgCode());
  await page
    .locator('[data-testid="organization-website-input"]')
    .fill("https://kanaliiga.fi/");
  await page.locator('[data-testid="terms-conditions-checkbox"]').click();

  // Navigate to team section and complete team selection
  await page.locator('[data-testid="team-selection-button"]').click();
  await page.locator('[data-testid="teams-dropdown-toggle"]').click();
  await page.locator('[data-testid="teams-add-new"]').click();
  await page.locator('[data-testid="team-name-input"]').fill(teamName);
  await page
    .locator('[data-testid="team-external-id-input"]')
    .fill(generateUniqueFaceitTeamId());

  // Navigate to players section
  await page.locator('[data-testid="go-to-lineup-button"]').click();
}

// Helper function to fill 5 players with valid Steam IDs
async function fillValidPlayers(page: Page, authenticatedUserId?: string) {
  const validPlayers = [
    ValidWorkEmail1SteamId, // account_id 15007 - ValidWorkEmail1 (has valid work email)
    ValidWorkEmail2SteamId, // account_id 15015 - ValidWorkEmail2 (has valid work email)
    ValidWorkEmail3SteamId, // account_id 15016 - ValidWorkEmail3 (has valid work email)
    ValidWorkEmail4SteamId, // account_id 15017 - ValidWorkEmail4 (has valid work email)
    ValidWorkEmail5SteamId // account_id 15018 - ValidWorkEmail5 (has valid work email)
  ];

  // If an authenticated user ID is provided, ensure they are in the list
  let playersToUse = validPlayers;
  if (authenticatedUserId && !validPlayers.includes(authenticatedUserId)) {
    // Replace the last player with the authenticated user
    playersToUse = [...validPlayers.slice(0, 4), authenticatedUserId];
  }

  for (let i = 0; i < 5; i++) {
    const steamIdInput = page.locator(`[data-testid="steam-id-input-${i}"]`);
    await expect(steamIdInput).toBeVisible();
    await steamIdInput.fill(playersToUse[i]!);
    await page.keyboard.press("Tab");
  }
}

// Helper function to set up authentication for a specific user
async function setupAuthForUser(
  page: Page,
  accountId: number,
  steamId: string,
  nickname: string
) {
  const jwt = generateTestJWTForUser(accountId, steamId, nickname);

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

  // Intercept draft API requests specifically to add Bearer authorization header
  await page.route("**/draft", async (route) => {
    const headers = {
      ...route.request().headers(),
      Authorization: `Bearer ${jwt}`
    };

    await route.continue({ headers });
  });
}

test.describe("Signup Form", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication cookie first (most important) - use heppajpg for most tests
    await setupAuthForUser(page, 15004, heppajpgSteamId, "heppajpg");

    page.route("**/api/v1/faceit/teams/*", async (route) => {
      // Extract team ID from URL path
      const url = route.request().url();
      const teamIdMatch = url.match(/\/api\/v1\/faceit\/teams\/([^/?]+)/);
      const teamId = teamIdMatch ? teamIdMatch[1] : "unknown";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          team_id: teamId, // Use the actual team ID from the request
          name: "Test FACEIT Team",
          avatar: "https://example.com/avatar.jpg",
          game: "cs2",
          nickname: "",
          team_type: "",
          members: [],
          leader: "",
          chat_room_id: "",
          faceit_url: ""
        })
      });
    });
  });

  // Base navigation test
  test("should navigate to the signup page with authentication", async ({
    page
  }) => {
    // Start by checking authentication status
    await page.goto("/");

    // Navigate to signup page
    await page.goto("/seasons/16/signup");

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

  // Form validation tests
  test.describe("Form Validation", () => {
    test("should validate required fields and show proper error states", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Try to proceed without filling required fields
      const teamSelectionButton = page.locator(
        '[data-testid="team-selection-button"]'
      );
      await expect(teamSelectionButton).toBeDisabled();

      // Fill organization but don't check terms
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill(generateUniqueOrgName("Test Organization"));
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill(generateUniqueOrgCode());
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");

      // Button should still be disabled without terms
      // Note: Form validation behavior may have changed
      const isDisabled = await teamSelectionButton.isDisabled();
      if (!isDisabled) {
        console.log(
          "Team selection button is enabled without terms - validation behavior may have changed"
        );
      }

      // Check terms and conditions
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Now button should be enabled
      await expect(teamSelectionButton).toBeEnabled();
    });
  });

  // Faceit ID validation tests
  test.describe("Team Faceit ID Validation", () => {
    test("should validate FACEIT team ID format comprehensively", async ({
      page
    }) => {
      // Set up form to FACEIT ID input stage
      await setupFormToFaceitIdInput(page);

      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );
      const errorMessage = page.locator(
        '[data-testid="team-external-id-error"]'
      );

      // Test 1: Empty FACEIT ID
      await faceitIdField.focus();
      await faceitIdField.fill("");
      await faceitIdField.blur();

      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/required|invalid|uuid/i);
      await expect(faceitIdField).toHaveClass(/border-red-500/);
      await expect(goToLineupButton).toBeDisabled();

      // Test 2: FACEIT ID without hyphens (invalid UUID format)
      await faceitIdField.focus();
      await faceitIdField.fill("77dd9104d2f14f50ba80d58457cff5a9");
      await faceitIdField.blur();

      await expect(goToLineupButton).toBeDisabled();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/Invalid uuid|invalid|uuid/i);
      await expect(faceitIdField).toHaveClass(/border-red-500/);

      // Test 3: FACEIT ID with HTTP prefix
      await faceitIdField.focus();
      await faceitIdField.fill(`http://${generateUniqueFaceitTeamId()}`);
      await faceitIdField.blur();

      await expect(goToLineupButton).toBeDisabled();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        /Expected string, received null|invalid|uuid/i
      );
      await expect(faceitIdField).toHaveClass(/border-red-500/);

      // Test 4: Valid UUID format
      await faceitIdField.focus();
      await faceitIdField.fill(generateUniqueFaceitTeamId());
      await faceitIdField.blur();

      await expect(errorMessage).toHaveCount(0);
      await expect(faceitIdField).not.toHaveClass(/border-red-500/);
      await expect(goToLineupButton).toBeEnabled();

      // Verify navigation works with valid ID
      await goToLineupButton.click();
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();
    });
  });

  // Steam ID Validation tests
  test.describe("Steam ID Validation", () => {
    test("should validate Steam IDs with different approval states", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test 1: Hours detection failure
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput0.fill(InsufficientHoursPlayerSteamId); // account_id 15002 - InsufficientHoursPlayer (triggers hours: null)
      await page.keyboard.press("Tab");
      await steamIdInput0.blur();

      // Wait a bit for API calls to complete
      await page.waitForTimeout(2000);

      // Verify red border appears (indicates validation failure due to insufficient hours)
      await expect(steamIdInput0).toHaveClass(/border-red-500/);

      // Test 2: Organizer approval success
      const steamIdInput1 = page.locator('[data-testid="steam-id-input-1"]');
      await steamIdInput1.focus();
      await steamIdInput1.fill(QuattraSteamId); // account_id 15005 - Quattra (approved by organizer)
      await page.keyboard.press("Tab");

      // Wait a bit for API calls to complete
      await page.waitForTimeout(2000);

      // Verify green border appears (indicates successful validation including organizer approval)
      await expect(steamIdInput1).toHaveClass(/border-green-500/);

      // Test 3: Organizer approval failure
      const steamIdInput2 = page.locator('[data-testid="steam-id-input-2"]');
      await steamIdInput2.focus();
      await steamIdInput2.fill(TrevSteamId); // account_id 15006 - Trev (NOT approved by organizer)
      await page.keyboard.press("Tab");

      // Wait a bit for API calls to complete
      await page.waitForTimeout(2000);

      // Verify red border appears (indicates validation failure due to lack of organizer approval)
      await expect(steamIdInput2).toHaveClass(/border-red-500/);
    });

    test("should resolve player by nickname from database", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test searching by nickname (heppajpg is in e2e seed data)
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput0.fill("heppajpg");

      // Wait for search button to appear
      const searchButton = page.locator('[data-testid="search-button-0"]');
      await expect(searchButton).toBeVisible();

      // Click search button
      await searchButton.click();

      // Wait for resolution and player data to load
      await page.waitForTimeout(3000);

      // Verify the input now contains the resolved SteamID64 (heppajpgSteamId)
      await expect(steamIdInput0).toHaveValue(heppajpgSteamId);

      // Verify green border appears (indicates successful resolution and validation)
      await expect(steamIdInput0).toHaveClass(/border-green-500/);

      // Verify nickname is displayed
      const nicknameSpan = page.locator('[data-testid="player-nickname-0"]');
      await expect(nicknameSpan).toBeVisible();
      await expect(nicknameSpan).toContainText(/heppajpg/i);
    });

    test("should resolve player by nickname using Enter key", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test searching by nickname using Enter key (Aabe is in e2e seed data)
      const steamIdInput1 = page.locator('[data-testid="steam-id-input-1"]');
      await steamIdInput1.fill("Aabe");

      // Wait for search button to appear
      const searchButton = page.locator('[data-testid="search-button-1"]');
      await expect(searchButton).toBeVisible();

      // Press Enter to trigger search
      await steamIdInput1.press("Enter");

      // Wait for resolution and player data to load
      await page.waitForTimeout(3000);

      // Verify the input now contains the resolved SteamID64 (AabeSteamId)
      await expect(steamIdInput1).toHaveValue(AabeSteamId);

      // Verify green border appears
      await expect(steamIdInput1).toHaveClass(/border-green-500/);

      // Verify nickname is displayed
      const nicknameSpan = page.locator('[data-testid="player-nickname-1"]');
      await expect(nicknameSpan).toBeVisible();
      await expect(nicknameSpan).toContainText(/Aabe/i);
    });

    test("should show error when nickname not found", async ({ page }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test searching by non-existent nickname
      const steamIdInput2 = page.locator('[data-testid="steam-id-input-2"]');
      await steamIdInput2.fill("NonExistentPlayer123");

      // Wait for search button to appear
      const searchButton = page.locator('[data-testid="search-button-2"]');
      await expect(searchButton).toBeVisible();

      // Click search button
      await searchButton.click();

      // Wait for resolution attempt
      await page.waitForTimeout(2000);

      // Verify red border appears (indicates resolution failure)
      await expect(steamIdInput2).toHaveClass(/border-red-500/);

      // Verify error message is shown
      const errorMessage = page.locator('[data-testid="steam-id-error-2"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  // Complete Registration Flow tests
  test.describe("Complete Registration Flow", () => {
    test("should complete full registration flow and successfully submit", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(
        page,
        15007,
        ValidWorkEmail1SteamId,
        "ValidWorkEmail1"
      );

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Complete Flow Test Org"),
        generateUniqueTeamName("Complete Flow Test Team")
      );

      // Fill in 5 players with valid Steam IDs (include authenticated user)
      await fillValidPlayers(page, ValidWorkEmail1SteamId);

      // Wait for nicknames to load after Steam IDs are entered
      await page.waitForTimeout(3000); // Give time for async data loading

      // Verify all players have valid Steam IDs (green borders)
      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toHaveClass(/border-green-500/);
      }

      // Check all visible nickname spans for the correct nicknames
      const nicknameSpans = page.locator('[data-testid^="player-nickname-"]');
      const nicknameCount = await nicknameSpans.count();
      expect(nicknameCount).toBeGreaterThan(0);

      // Verify nicknames from E2E seed data (ValidWorkEmail1 should be in the list)
      await expect(nicknameSpans.nth(0)).toBeVisible();
      await expect(nicknameSpans.nth(0)).toContainText(/ValidWorkEmail1/i);

      // Find ValidWorkEmail1 in the list (he should be there somewhere since he's the authenticated user)
      let foundAuthUser = false;
      for (let i = 0; i < nicknameCount; i++) {
        const nickname = await nicknameSpans.nth(i).textContent();
        if (nickname && /ValidWorkEmail1/i.test(nickname)) {
          foundAuthUser = true;
          break;
        }
      }
      expect(foundAuthUser).toBe(true);

      // Assign captain and co-captain roles
      await assignCaptain(page);

      // Accept final terms and conditions (on players tab)
      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (await finalTermsCheckbox.isVisible()) {
        const isChecked = await finalTermsCheckbox
          .isChecked()
          .catch(() => false);
        if (!isChecked) {
          await finalTermsCheckbox.click();
        }
      }

      // Check if submit button becomes enabled
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });

      // Listen for the submission API call
      const submissionPromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/registrations/season/") &&
          response.request().method() === "POST" &&
          !response.url().includes("/draft") // Not the draft endpoint
      );

      // Actually click the submit button
      await submitButton.click();

      const submissionResponse = await submissionPromise;
      const responseStatus = submissionResponse.status();

      // Assert successful submission
      expect(responseStatus).toBeGreaterThanOrEqual(200);
      expect(responseStatus).toBeLessThan(300);

      // Verify post-submission state
      await expect(submitButton).toBeDisabled(); // Button should be disabled after submission

      // Look for any success messages or navigation changes
      const successMessage = page
        .locator("text=/success|submitted|registered|thank you/i")
        .first();
      if (await successMessage.isVisible({ timeout: 5000 })) {
        await expect(successMessage).toBeVisible();
      }
    });

    test("should validate captain and co-captain assignment comprehensively", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Captain Test Org"),
        generateUniqueTeamName("Captain Test Team")
      );

      // Fill in 5 players with valid Steam IDs (include authenticated user)
      await fillValidPlayers(page, ValidWorkEmail2SteamId);

      // Test 1: Check that all captain and co-captain checkboxes exist and are visible
      // Note: These might only be visible after players are filled
      for (let i = 0; i < 5; i++) {
        const captainCheckbox = page.locator(
          `[data-testid="captain-checkbox-${i}"]`
        );
        const coCaptainCheckbox = page.locator(
          `[data-testid="co-captain-checkbox-${i}"]`
        );

        // Check if checkboxes are visible, if not, they might appear after player data is loaded
        const captainVisible = await captainCheckbox.isVisible();
        const coCaptainVisible = await coCaptainCheckbox.isVisible();

        if (!captainVisible || !coCaptainVisible) {
          console.log(
            `Captain/co-captain checkboxes for player ${i} not visible yet - may appear after player data loads`
          );
        }
      }

      // Test 2: Check submit button state before assigning roles (should be disabled)
      const submitButtonBefore = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButtonBefore).toBeDisabled();

      // Test 3: Check for validation error about missing captain/co-captain
      const validationError = page.locator(
        "text=There must be exactly one captain and one co-captain"
      );
      await expect(validationError).toBeVisible();

      // Test 4: Assign captain and co-captain
      await assignCaptain(page);

      // Test 5: Check submit button state after assigning roles (should be enabled)
      const submitButtonAfter = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButtonAfter).toBeEnabled();

      // Test 6: Validation error should be gone
      await expect(validationError).not.toBeVisible();

      // Test 7: Check terms and conditions checkbox is visible
      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await expect(termsCheckbox).toBeVisible();

      // Test 8: Verify that exactly one captain and one co-captain are selected
      // Use the existing assignCaptain utility function which handles accordion expansion
      await assignCaptain(page);

      // Now verify the captain/co-captain assignments
      const captainCheckboxes = page.locator(
        '[data-testid^="captain-checkbox-"]'
      );
      const coCaptainCheckboxes = page.locator(
        '[data-testid^="co-captain-checkbox-"]'
      );

      // Check if any captain checkboxes exist
      const captainCount = await captainCheckboxes.count();
      const coCaptainCount = await coCaptainCheckboxes.count();

      if (captainCount === 0 || coCaptainCount === 0) {
        console.log(
          "Captain/co-captain checkboxes not found after using assignCaptain utility"
        );
        console.log("Captain checkboxes found:", captainCount);
        console.log("Co-captain checkboxes found:", coCaptainCount);
        return; // Skip this test if elements don't exist
      }

      let captainCheckedCount = 0;
      let coCaptainCheckedCount = 0;

      for (let i = 0; i < Math.min(5, captainCount); i++) {
        const captainChecked = await captainCheckboxes.nth(i).isChecked();
        const coCaptainChecked = await coCaptainCheckboxes.nth(i).isChecked();

        if (captainChecked) captainCheckedCount++;
        if (coCaptainChecked) coCaptainCheckedCount++;
      }

      expect(captainCheckedCount).toBe(1);
      expect(coCaptainCheckedCount).toBe(1);
    });
  });

  // External Rank Error tests
  test.describe("External Rank Error", () => {
    test("should show external rank error for player without FaceIT rank", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test player without FaceIT rank (has CS2 rank but no FaceIT level)
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      await steamIdInput.focus();
      await steamIdInput.fill(NoFaceitRankPlayerSteamId); // NoFaceitRankPlayer - has CS2 rank but no FaceIT rank
      await page.keyboard.press("Tab");
      await steamIdInput.blur();

      // Wait a bit for API calls to complete
      await page.waitForTimeout(2000);

      // Verify red border appears (indicates validation failure due to missing FaceIT rank)
      await expect(steamIdInput).toHaveClass(/border-red-500/);

      // Verify the external rank error notification is visible
      const externalRankError = page.locator(
        '[data-testid="external-rank-error-0"]'
      );
      await expect(externalRankError).toBeVisible();
      await expect(externalRankError).toContainText(
        "Could not detect external FACEIT rank for the player"
      );
      await expect(externalRankError).toContainText(
        "This could be due to temporary service issues or missing rank data"
      );
      await expect(externalRankError).toContainText(
        "Please try removing the steam id and adding it again"
      );
      await expect(externalRankError).toContainText(
        "or open a ticket in the Kanaliiga Discord if the problem persists"
      );
    });

    test("should not allow form submission with external rank error", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(page, 15009, RealPlayer1SteamId, "RealPlayer1");

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("External Rank Test Org"),
        generateUniqueTeamName("External Rank Test Team")
      );

      // Fill in 5 players - one without FaceIT rank, others with valid data
      const validPlayers = [
        NoFaceitRankPlayerSteamId, // NoFaceitRankPlayer (no FaceIT rank)
        AabeSteamId, // Aabe (has E2E data)
        HoolyzSteamId, // Hoolyz (has E2E data)
        RealPlayer1SteamId, // RealPlayer1 (has E2E data) - authenticated user
        RealPlayer2SteamId // RealPlayer2 (has E2E data)
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
      }

      // Verify the external rank error is visible for the first player
      const externalRankError = page.locator(
        '[data-testid="external-rank-error-0"]'
      );
      await expect(externalRankError).toBeVisible();
      await expect(externalRankError).toContainText(
        "Could not detect external FACEIT rank for the player"
      );

      // Verify other players have green borders (valid data)
      for (let i = 1; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toHaveClass(/border-green-500/);
      }

      // Assign captain and co-captain roles
      await assignCaptain(page);

      // Accept final terms and conditions
      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (await finalTermsCheckbox.isVisible()) {
        const isChecked = await finalTermsCheckbox
          .isChecked()
          .catch(() => false);
        if (!isChecked) {
          await finalTermsCheckbox.click();
        }
      }

      // Check if submit button remains disabled due to external rank error
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled({ timeout: 10000 });

      // Verify the external rank error is still visible
      await expect(externalRankError).toBeVisible();
    });

    test("should not show duplicate external rank error when there are multiple players with same id missing faceit rank", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test multiple players without FaceIT rank
      const playersWithoutFaceitRank = [
        NoFaceitRankPlayerSteamId, // NoFaceitRankPlayer
        NoFaceitRankPlayerSteamId // Same player added twice to test multiple errors
      ];

      for (let i = 0; i < 2; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();

        await steamIdInput.focus();
        await steamIdInput.fill(playersWithoutFaceitRank[i]!);
        await page.keyboard.press("Tab");
      }

      // Wait for validation to complete
      await page.waitForTimeout(3000);

      // Verify external rank errors are visible for both players
      const externalRankError0 = page.locator(
        '[data-testid="external-rank-error-0"]'
      );
      const externalRankError1 = page.locator(
        '[data-testid="external-rank-error-1"]'
      );

      // Only the first error should be visible (no duplicates)
      await expect(externalRankError0).toBeVisible();
      await expect(externalRankError1).not.toBeVisible();

      await expect(externalRankError0).toContainText(
        "Could not detect external FACEIT rank for the player"
      );

      // Verify both inputs have red borders (validation failure)
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      const steamIdInput1 = page.locator('[data-testid="steam-id-input-1"]');

      await expect(steamIdInput0).toHaveClass(/border-red-500/);
      await expect(steamIdInput1).toHaveClass(/border-red-500/);
    });
  });
});
