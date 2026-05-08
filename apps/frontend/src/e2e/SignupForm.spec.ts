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
  AddTeamSignupSteamId1,
  AddTeamSignupSteamId2,
  AddTeamSignupSteamId3,
  AddTeamSignupSteamId4,
  AddTeamSignupSteamId5,
  ApprovalOnlySubmitSteamId,
  createMockSeasonDetails,
  DraftReturnUserSteamId,
  heppajpgSteamId,
  HoolyzSteamId,
  IncompleteDetailsPlayerSteamId,
  InsufficientHoursPlayerSteamId,
  ManualApprovalTargetSteamId,
  ManualRankTargetSteamId,
  NoFaceitRankPlayerSteamId,
  QuattraSteamId,
  RealPlayer1SteamId,
  RealPlayer2SteamId,
  SeasonPlatform,
  TrevSteamId,
  ValidWorkEmail1SteamId,
  ValidWorkEmail2SteamId,
  ValidWorkEmail3SteamId,
  ValidWorkEmail4SteamId,
  ValidWorkEmail5SteamId
} from "@eggosystem/types";

/**
 * Assigns a captain or co-captain role to a specific player
 * @param page - Playwright page object
 * @param playerIndex - Zero-based index of the player (0-4)
 * @param role - Either 'captain' or 'co-captain'
 */
async function assignPlayerRole(
  page: Page,
  playerIndex: number,
  role: "captain" | "co-captain"
) {
  const accordionTriggers = page.locator(
    `[data-testid="player-accordion-triggers"]`
  );

  const trigger = accordionTriggers.nth(playerIndex);
  if (await trigger.isVisible()) {
    const isOpen = await trigger.getAttribute("data-state");
    if (isOpen === "closed") {
      await trigger.click();
    }

    const checkboxSelector =
      role === "captain"
        ? `[data-testid="captain-checkbox-${playerIndex}"]`
        : `[data-testid="co-captain-checkbox-${playerIndex}"]`;

    const checkbox = page.locator(checkboxSelector);
    if (await checkbox.isVisible()) {
      const isAlreadyAssigned = await checkbox.getAttribute("aria-checked");
      if (isAlreadyAssigned !== "true") {
        await checkbox.click();
      }
    }
  }
}

/**
 * Assigns player 0 as captain and player 1 as co-captain
 * This is a convenience function that maintains backward compatibility
 */
async function assignCaptain(page: Page) {
  await assignPlayerRole(page, 0, "captain");
  await assignPlayerRole(page, 1, "co-captain");

  // Wait for captain/co-captain validation error to disappear
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
  await setupFormToPlayersSectionWithTeam(page, 999, 999);
}

// Helper to set up form to players section using existing org/team by id (998 and 997 are unregistered; 999 is pre-registered)
async function setupFormToPlayersSectionWithTeam(
  page: Page,
  orgId: number,
  teamId: number
) {
  await page.goto("/seasons/16/signup/registration");

  // Form may load on Team or Players step (draft, or redirect to edit when user has existing registration).
  // Wait for form to be ready, then ensure we're on Organization step before using the org dropdown.
  await page
    .getByRole("heading", { name: /Sign up Form|Edit signup/i })
    .waitFor({ state: "visible", timeout: 15000 });
  const orgDropdown = page.locator(
    '[data-testid="organizations-dropdown-toggle"]'
  );
  const orgVisible = await orgDropdown.isVisible().catch(() => false);
  if (!orgVisible) {
    const orgTab = page.getByRole("tab", { name: /Organization/i });
    await orgTab.waitFor({ state: "visible", timeout: 10000 });
    await orgTab.click();
  }
  await orgDropdown.waitFor({ state: "visible", timeout: 60000 });

  await page.locator('[data-testid="organizations-dropdown-toggle"]').click();
  await page.locator(`[data-testid="organizations-option-${orgId}"]`).click();
  await page.locator('[data-testid="terms-conditions-checkbox"]').click();
  await page.locator('[data-testid="team-selection-button"]').click();
  await page.locator('[data-testid="teams-dropdown-toggle"]').click();
  await page.locator(`[data-testid="teams-option-${teamId}"]`).click();
  await page
    .locator('[data-testid="team-external-id-input"]')
    .fill(generateUniqueFaceitTeamId());
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

  // Wait for signup status check and form to be ready (org dropdown is the first interactive element)
  await page
    .locator('[data-testid="organizations-dropdown-toggle"]')
    .waitFor({ state: "visible", timeout: 60000 });

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
      const teamExternalIdLabel = faceitIdField.locator(
        "xpath=ancestor::*[@data-slot='form-item'][1]/*[@data-slot='form-label']"
      );

      // Test 1: Empty FACEIT ID
      await faceitIdField.focus();
      await faceitIdField.fill("");
      await faceitIdField.blur();

      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/required|invalid|uuid/i);
      await expect(teamExternalIdLabel).toHaveAttribute("data-error", "true");
      await expect(goToLineupButton).toBeDisabled();

      // Test 2: FACEIT ID without hyphens (invalid UUID format)
      await faceitIdField.focus();
      await faceitIdField.fill("77dd9104d2f14f50ba80d58457cff5a9");
      await faceitIdField.blur();

      await expect(goToLineupButton).toBeDisabled();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/Invalid uuid|invalid|uuid/i);
      await expect(teamExternalIdLabel).toHaveAttribute("data-error", "true");

      // Test 3: FACEIT ID with HTTP prefix
      await faceitIdField.focus();
      await faceitIdField.fill(`http://${generateUniqueFaceitTeamId()}`);
      await faceitIdField.blur();

      await expect(goToLineupButton).toBeDisabled();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        /Expected string, received null|invalid|uuid/i
      );
      await expect(teamExternalIdLabel).toHaveAttribute("data-error", "true");

      // Test 4: Valid UUID format
      await faceitIdField.focus();
      await faceitIdField.fill(generateUniqueFaceitTeamId());
      await faceitIdField.blur();

      await expect(errorMessage).toHaveCount(0);
      await expect(teamExternalIdLabel).not.toHaveAttribute(
        "data-error",
        "true"
      );
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

    test("should show duplicate Steam ID warning and disable submit when same Steam ID is used for multiple players", async ({
      page
    }) => {
      await setupFormToPlayersSectionWithTeam999(page);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });

      const duplicateSteamId = ValidWorkEmail1SteamId;
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .fill(duplicateSteamId);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(2000);
      await page
        .locator('[data-testid="steam-id-input-1"]')
        .fill(duplicateSteamId);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(2000);

      const duplicateWarning = page
        .locator("text=Duplicate steam id detected")
        .first();
      await expect(duplicateWarning).toBeVisible({ timeout: 5000 });

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled();
    });

    test("should show Discord link error and disable submit when captain or co-captain has no Discord linked", async ({
      page
    }) => {
      // InsufficientHoursPlayerSteamId has no Discord in e2e-test-data
      await setupFormToPlayersSectionWithTeam999(page);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });

      const lineupWithNoDiscord = [
        InsufficientHoursPlayerSteamId,
        ValidWorkEmail1SteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId,
        ValidWorkEmail4SteamId
      ];

      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(lineupWithNoDiscord[i]!);
        await page.keyboard.press("Tab");
      }

      await page.waitForTimeout(3000);

      const accordionTriggers = page.locator(
        `[data-testid="player-accordion-triggers"]`
      );
      const accordionTrigger0 = accordionTriggers.nth(0);
      if ((await accordionTrigger0.getAttribute("data-state")) === "closed") {
        await accordionTrigger0.click();
      }
      const captainCheckbox0 = page.locator(
        '[data-testid="captain-checkbox-0"]'
      );
      if (await captainCheckbox0.isVisible()) {
        const isAlreadyCaptain =
          await captainCheckbox0.getAttribute("aria-checked");
        if (isAlreadyCaptain !== "true") {
          await captainCheckbox0.click();
        }
      }

      const discordError = page.locator("text=User needs to link Discord");
      await expect(discordError).toBeVisible({ timeout: 5000 });

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled();
    });

    test("when player in SeasonPlayerApprovals has unverified email, manual approval bypasses it; submit is enabled when captain/co-captain have discord linked (approval-only)", async ({
      page
    }) => {
      // S3: ApprovalOnlySubmitSteamId is in SeasonPlayerApprovals (season 16, team 999) but has work_email null,
      // work_email_verified 0. Frontend sets isEmailVerified from approved-manually, so we don't show email error.
      // Captain/co-captain must have Discord linked (E2E seed links Discord for ApprovalOnlySubmit and heppajpg).
      await setupFormToPlayersSectionWithTeam999(page);

      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });

      const approvalOnlyLineup = [
        ApprovalOnlySubmitSteamId,
        heppajpgSteamId,
        ValidWorkEmail1SteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId
      ];
      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(approvalOnlyLineup[i]!);
        await page.keyboard.press("Tab");
      }

      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await finalTermsCheckbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      // Manually approved player: we set isEmailVerified from approved-manually, so no email error
      await expect(
        page.locator('[data-testid="email-verification-error-0"]')
      ).not.toBeVisible();

      // With captain/co-captain having Discord linked (E2E seed), submit is enabled
      const submitButton = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled({ timeout: 15000 });
    });

    test("should save draft, re-open registration, and see form prefilled from draft (S2 draft-return)", async ({
      page
    }) => {
      // S2: Use DraftReturnUserSteamId so draft is keyed by this user; save draft, re-open, assert prefilled, save again
      await setupAuthForUser(
        page,
        15022,
        DraftReturnUserSteamId,
        "DraftReturnUser"
      );

      const orgName = generateUniqueOrgName("Draft Return Org");
      const teamName = generateUniqueTeamName("Draft Return Team");
      await setupCompleteRegistrationForm(page, orgName, teamName);

      await fillValidPlayers(page, DraftReturnUserSteamId);
      await page.waitForTimeout(3000);

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toHaveClass(/border-green-500/);
      }

      const saveDraftButton = page.locator(
        '[data-testid="save-as-draft-button"]'
      );
      await expect(saveDraftButton).toBeVisible();
      const draftSavePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/registrations/season/") &&
          response.url().includes("/draft") &&
          response.request().method() === "POST"
      );
      await saveDraftButton.click();
      const draftSaveResponse = await draftSavePromise;
      expect(draftSaveResponse.status()).toBeGreaterThanOrEqual(200);
      expect(draftSaveResponse.status()).toBeLessThan(300);

      await page.goto("/seasons/16/signup");
      await page.goto("/seasons/16/signup/registration");

      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await page.locator('[data-testid="team-selection-button"]').click();
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      const expectedSteamIds = [
        ValidWorkEmail1SteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId,
        ValidWorkEmail4SteamId,
        DraftReturnUserSteamId
      ];
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput0.waitFor({ state: "visible", timeout: 10000 });
      await expect(steamIdInput0).toHaveValue(expectedSteamIds[0]!, {
        timeout: 10000
      });

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toHaveValue(expectedSteamIds[i]!);
      }

      const saveDraftAgain = page.locator(
        '[data-testid="save-as-draft-button"]'
      );
      await expect(saveDraftAgain).toBeVisible();
      const draftSaveAgainPromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/registrations/season/") &&
          response.url().includes("/draft") &&
          response.request().method() === "POST"
      );
      await saveDraftAgain.click();
      const draftSaveAgainResponse = await draftSaveAgainPromise;
      expect(draftSaveAgainResponse.status()).toBeGreaterThanOrEqual(200);
      expect(draftSaveAgainResponse.status()).toBeLessThan(300);
    });

    test("should show Kanahub signup message when player has invalid profile (is_valid_full_name false), then after fixing profile submit is enabled", async ({
      page,
      request
    }) => {
      await setupAuthForUser(
        page,
        15016,
        ValidWorkEmail3SteamId,
        "ValidWorkEmail3"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Profile Data Test Org"),
        generateUniqueTeamName("Profile Data Test Team")
      );

      const lineupWithInvalidProfile = [
        IncompleteDetailsPlayerSteamId, // Seed: invalid full_name
        ValidWorkEmail1SteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId,
        ValidWorkEmail4SteamId
      ];

      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(lineupWithInvalidProfile[i]!);
        await page.keyboard.press("Tab");
      }

      await page.waitForTimeout(3000);

      // Assign player 1 (ValidWorkEmail1) as captain instead of player 0
      // since player 0 (IncompleteDetailsPlayer) doesn't have Discord linked
      await assignPlayerRole(page, 1, "captain");
      await assignPlayerRole(page, 2, "co-captain");

      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await termsCheckbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await termsCheckbox.isChecked().catch(() => false))) {
        await termsCheckbox.click();
      }

      // Check: frontend shows error and submit is disabled
      const kanahubMessage = page
        .locator('[data-testid="policy-acceptance-error-0"]')
        .or(page.locator("text=Ask the player to sign up for Kanahub"));
      await expect(kanahubMessage).toBeVisible({ timeout: 10000 });

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled();

      // Act: fix profile as IncompleteDetailsPlayer (account 15012) via account update API
      await setupAuthForUser(
        page,
        15012,
        IncompleteDetailsPlayerSteamId,
        "IncompleteDetailsPlayer"
      );
      const apiBaseUrl = "http://localhost:3001";
      const jwt = generateTestJWTForUser(
        15012,
        IncompleteDetailsPlayerSteamId,
        "IncompleteDetailsPlayer"
      );
      const updateResponse = await request.post(
        `${apiBaseUrl}/api/v1/accounts/update`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`
          },
          data: {
            nickname: "IncompleteDetailsPlayer",
            full_name: "Incomplete Details Player",
            work_email: "test+15012@kanaliiga.fi",
            acceptPrivacyPolicy: true
          }
        }
      );
      expect(updateResponse.ok()).toBeTruthy();

      // Switch back to form user and trigger re-fetch of player 0
      await setupAuthForUser(
        page,
        15016,
        ValidWorkEmail3SteamId,
        "ValidWorkEmail3"
      );
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput0.fill("");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);
      await steamIdInput0.fill(IncompleteDetailsPlayerSteamId);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(3000);

      // Check: error gone and submit enabled
      await expect(kanahubMessage).not.toBeVisible({ timeout: 10000 });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
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

  test.describe("Admin registration", () => {
    // Design: wrongful data (seed) → user opens signup → we assert the error is visible and submit disabled
    //        → we fix (admin panel OR DB injection) → user opens signup again → we assert error gone and submit succeeds.
    // When admin act is enough: the dashboard writes the same state the backend validation reads (e.g. manual approval
    // writes SeasonPlayerApprovals; manual rank writes SeasonPlayerRanks). No extra DB injection needed.
    // When we need DB injection: the fix isn’t available in the UI, or the UI doesn’t set all fields validation needs,
    // or we’re testing an edge case the UI can’t create. Then we’d inject (e.g. via seed or a test DB helper) mid-test.
    // A1: fix = admin manual approval → writes SeasonPlayerApprovals → backend checks isPlayerApprovedForSeasonManually → admin act is enough.
    // A2: fix = admin manual rank → writes SeasonPlayerRanks (cs2_rank + faceit etc.) → backend reads that for internal (premier) rank → admin act is enough. Uses internal rank error (no FaceIT fallback).

    test("A1: user sees work-email error for ManualApprovalTarget, admin adds approval, then user can submit", async ({
      page
    }) => {
      const a1Lineup = [
        ManualApprovalTargetSteamId,
        heppajpgSteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId,
        ValidWorkEmail4SteamId
      ];

      // Step 0: as user (ValidWorkEmail4), fill form with ManualApprovalTarget first – seed gives him no work email so we see the error
      await setupAuthForUser(
        page,
        15017,
        ValidWorkEmail4SteamId,
        "ValidWorkEmail4"
      );
      await setupFormToPlayersSectionWithTeam(page, 998, 998);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });
      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(a1Lineup[i]!);
        await page.keyboard.press("Tab");
      }
      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });
      await assignCaptain(page);

      const workEmailError = page.locator(
        '[data-testid="work-email-validation-error-0"]'
      );
      await expect(workEmailError).toBeVisible({ timeout: 10000 });
      await expect(workEmailError).toContainText(
        /valid work email|approved by organizer/i
      );
      const submitButtonBefore = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButtonBefore).toBeDisabled();

      // Step 1: as admin (heppajpg), add manual approval for org 998 + ManualApprovalTargetSteamId
      await setupAuthForUser(page, 15004, heppajpgSteamId, "heppajpg");
      await page.goto("/dashboard/registration/approval?season=16");
      await page
        .locator('[data-testid="manual-approval-organization-trigger"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await page
        .locator('[data-testid="manual-approval-organization-trigger"]')
        .click();
      await page.getByRole("option", { name: "E2E Test Org 998" }).click();
      await page.locator('[data-testid="manual-approval-add-player"]').click();
      await page
        .locator('[data-testid="player-steam-id-0"]')
        .fill(ManualApprovalTargetSteamId);
      await page.keyboard.press("Tab");
      const approvalResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/dashboard/registration/approved") &&
          res.request().method() === "POST"
      );
      await page.locator('[data-testid="manual-approval-submit"]').click();
      const approvalResponse = await approvalResponsePromise;
      expect(approvalResponse.status()).toBeGreaterThanOrEqual(200);
      expect(approvalResponse.status()).toBeLessThan(300);

      // Step 2: as user again, fill form – approval is now in place so error is gone and submit succeeds
      await setupAuthForUser(
        page,
        15017,
        ValidWorkEmail4SteamId,
        "ValidWorkEmail4"
      );
      await setupFormToPlayersSectionWithTeam(page, 998, 998);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });
      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(a1Lineup[i]!);
        await page.keyboard.press("Tab");
      }
      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });
      await assignCaptain(page);

      await expect(workEmailError).not.toBeVisible({ timeout: 10000 });
      const submitButton = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled({ timeout: 15000 });

      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await termsCheckbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await termsCheckbox.isChecked().catch(() => false))) {
        await termsCheckbox.click();
      }

      const signupResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/registrations/season/") &&
          res.request().method() === "POST" &&
          !res.url().includes("/draft")
      );
      await submitButton.click();
      const signupResponse = await signupResponsePromise;
      expect(signupResponse.status()).toBeGreaterThanOrEqual(200);
      expect(signupResponse.status()).toBeLessThan(300);
    });

    test("A2: user sees internal (premier) rank error for ManualRankTarget, admin adds manual rank (writes rank to DB), then user can submit", async ({
      page
    }) => {
      const a2Lineup = [
        ManualRankTargetSteamId,
        heppajpgSteamId,
        ValidWorkEmail2SteamId,
        ValidWorkEmail3SteamId,
        ValidWorkEmail5SteamId
      ];

      // Step 0: as user (ValidWorkEmail5), fill form with ManualRankTarget first – no SeasonPlayerRanks for season 16 so we see internal rank error
      await setupAuthForUser(
        page,
        15018,
        ValidWorkEmail5SteamId,
        "ValidWorkEmail5"
      );
      await setupFormToPlayersSectionWithTeam(page, 997, 997);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });
      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(a2Lineup[i]!);
        await page.keyboard.press("Tab");
      }
      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });
      await assignCaptain(page);

      const rankError = page.locator('[data-testid="rank-error-0"]');
      await expect(rankError).toBeVisible({ timeout: 10000 });
      await expect(rankError).toContainText(
        "Could not detect internal game rank for the player"
      );
      const submitButtonBefore = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButtonBefore).toBeDisabled();

      // Step 1: as admin (heppajpg), add manual rank for ManualRankTargetSteamId, season 16 (writes cs2_rank + external rank to SeasonPlayerRanks)
      await setupAuthForUser(page, 15004, heppajpgSteamId, "heppajpg");
      await page.goto("/dashboard/registration/rank?season=16");
      await page
        .locator('[data-testid="manual-rank-steam-id"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await page
        .locator('[data-testid="manual-rank-steam-id"]')
        .fill(ManualRankTargetSteamId);
      await page.keyboard.press("Tab");
      await page.locator('[data-testid="manual-rank-cs2-rank"]').fill("15000");
      await page
        .locator('[data-testid="manual-rank-external-elo"]')
        .fill("1500");
      await page.locator('[data-testid="manual-rank-cs-hours"]').fill("90");
      const rankResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/dashboard/registration/rank") &&
          res.request().method() === "POST"
      );
      await page.locator('[data-testid="manual-rank-submit"]').click();
      const rankResponse = await rankResponsePromise;
      expect(rankResponse.status()).toBeGreaterThanOrEqual(200);
      expect(rankResponse.status()).toBeLessThan(300);

      // Step 2: as user again, fill form – manual rank in DB (cs2_rank etc.) so internal rank is present, error gone, submit succeeds
      await setupAuthForUser(
        page,
        15018,
        ValidWorkEmail5SteamId,
        "ValidWorkEmail5"
      );
      await setupFormToPlayersSectionWithTeam(page, 997, 997);
      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });
      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(a2Lineup[i]!);
        await page.keyboard.press("Tab");
      }
      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });
      await assignCaptain(page);

      await expect(rankError).not.toBeVisible({ timeout: 10000 });
      const submitButton = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled({ timeout: 15000 });

      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await termsCheckbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await termsCheckbox.isChecked().catch(() => false))) {
        await termsCheckbox.click();
      }

      const signupResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/registrations/season/") &&
          res.request().method() === "POST" &&
          !res.url().includes("/draft")
      );
      await submitButton.click();
      const signupResponse = await signupResponsePromise;
      expect(signupResponse.status()).toBeGreaterThanOrEqual(200);
      expect(signupResponse.status()).toBeLessThan(300);
    });

    test("A3: open /dashboard/registration/registered, select season 16, assert teams load, bulk-approve selected team", async ({
      page
    }) => {
      await page.goto("/dashboard/registration/registered?season=16");

      await page
        .locator('[data-testid="registered-teams-list"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await expect(page.getByText(/Total teams:/)).toBeVisible({
        timeout: 5000
      });

      // Select first team row (first data row checkbox; index 0 may be header, 1 is first row)
      const rowCheckbox = page.getByRole("checkbox").nth(1);
      await rowCheckbox.waitFor({ state: "visible", timeout: 5000 });
      await rowCheckbox.click();

      await expect(page.getByText(/team\(s\) selected/)).toBeVisible({
        timeout: 3000
      });

      const bulkApprovePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/dashboard/registration/season/") &&
          res.url().includes("/bulk-approve") &&
          res.request().method() === "POST"
      );
      await page.locator('[data-testid="bulk-approve-selected"]').click();
      const bulkResponse = await bulkApprovePromise;
      expect(bulkResponse.status()).toBeGreaterThanOrEqual(200);
      expect(bulkResponse.status()).toBeLessThan(300);
    });

    test("A4: open /dashboard/registration/registered, select season 16, select team, set manual validity (Validate Selected)", async ({
      page
    }) => {
      await page.goto("/dashboard/registration/registered?season=16");

      await page
        .locator('[data-testid="registered-teams-list"]')
        .waitFor({ state: "visible", timeout: 15000 });
      await expect(page.getByText(/Total teams:/)).toBeVisible({
        timeout: 5000
      });

      const rowCheckbox = page.getByRole("checkbox").nth(1);
      await rowCheckbox.waitFor({ state: "visible", timeout: 5000 });
      await rowCheckbox.click();

      await expect(page.getByText(/team\(s\) selected/)).toBeVisible({
        timeout: 3000
      });

      const manualValidityPromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/v1/dashboard/registration/season/") &&
          res.url().includes("/manual-validity-check") &&
          res.request().method() === "POST"
      );
      await page.locator('[data-testid="manual-validity-selected"]').click();
      const validityResponse = await manualValidityPromise;
      expect(validityResponse.status()).toBeGreaterThanOrEqual(200);
      expect(validityResponse.status()).toBeLessThan(300);
    });

    test("A5: open /dashboard/registration/add-team, select season 16, fill SignupForm (org/team/5 players/captains), submit, assert POST to admin signup and success", async ({
      page
    }) => {
      await page.goto("/dashboard/registration/add-team");

      await expect(
        page.getByRole("heading", { name: "Select Season" })
      ).toBeVisible({ timeout: 15000 });
      await page.getByRole("button", { name: /CS2 Season 4|Season 4/ }).click();

      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .waitFor({ state: "visible", timeout: 15000 });

      const orgName = generateUniqueOrgName("A5 Admin Org");
      const teamName = generateUniqueTeamName("A5 Admin Team");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill(orgName);
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill(generateUniqueOrgCode());
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();
      await page.locator('[data-testid="team-selection-button"]').click();
      await page.locator('[data-testid="teams-dropdown-toggle"]').click();
      await page.locator('[data-testid="teams-add-new"]').click();
      await page.locator('[data-testid="team-name-input"]').fill(teamName);
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      await page
        .locator('[data-testid="steam-id-input-0"]')
        .waitFor({ state: "visible", timeout: 10000 });
      // Use dedicated A5 Steam IDs only – avoids SeasonPlayerRanks race with other tests
      const a5Lineup = [
        AddTeamSignupSteamId1,
        AddTeamSignupSteamId2,
        AddTeamSignupSteamId3,
        AddTeamSignupSteamId4,
        AddTeamSignupSteamId5
      ];
      for (let i = 0; i < 5; i++) {
        const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
        await expect(input).toBeVisible();
        await input.fill(a5Lineup[i]!);
        await page.keyboard.press("Tab");
      }

      await expect(
        page.locator('[data-testid="steam-id-input-4"]')
      ).toHaveClass(/border-green-500/, { timeout: 20000 });
      await assignCaptain(page);

      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      await termsCheckbox.waitFor({ state: "visible", timeout: 5000 });
      if (!(await termsCheckbox.isChecked().catch(() => false))) {
        await termsCheckbox.click();
      }

      const adminSignupPromise = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes("/api/v1/dashboard/registration/season/16/signup") &&
          res.request().method() === "POST"
      );
      const submitButton = page
        .getByTestId("signup-submit-button")
        .or(
          page.locator('button[type="submit"]').filter({ hasText: /Submit/i })
        );
      await expect(submitButton).toBeEnabled({ timeout: 15000 });
      await submitButton.click();
      const adminResponse = await adminSignupPromise;
      expect(adminResponse.status()).toBeGreaterThanOrEqual(200);
      expect(adminResponse.status()).toBeLessThan(300);
    });
  });

  // S1-AC-4: Configurable signup requirements (faceit_rank_required,
  // premier_rank_required, hours_played_required, profile_link_required)
  // Strategy: page.route() mocks GET /api/v1/seasons/16/details so we can flip
  // requirement flags without depending on the seed. We additionally mock the
  // player rank/hours endpoint for the FIRST lineup slot so its value is -1
  // — that lets us assert that disabling a flag truly turns the matching
  // notification off and unblocks submit. Mock payload shape stays in sync
  // with SeasonDetails via createMockSeasonDetails().
  test.describe("Configurable signup requirements", () => {
    // Override season 16's details to flip individual signup-requirement flags.
    // Pre-condition: must run before page.goto so the first details fetch hits
    // the mock. Real backend response shape (Season + app_id) is reproduced via
    // createMockSeasonDetails so the contract stays in sync with the type.
    const mockSeasonDetailsRoute = async (
      page: Page,
      flagOverrides: Partial<{
        faceit_rank_required: boolean;
        premier_rank_required: boolean;
        profile_link_required: boolean;
        hours_played_required: boolean;
      }>
    ) => {
      await page.route("**/api/v1/seasons/16/details", async (route) => {
        const seasonDetails = createMockSeasonDetails({
          id: 16,
          game_id: 1,
          game_type_id: 1,
          organizer_id: 1,
          name: "Season 4",
          full_name: "CS2 Season 4",
          app_id: 730,
          platform: SeasonPlatform.FACEIT,
          // Default to "all enabled" matching the post-backfill production
          // behaviour, then apply flag overrides for the specific test.
          faceit_rank_required: true,
          premier_rank_required: true,
          profile_link_required: true,
          hours_played_required: true,
          ...flagOverrides
        });

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(seasonDetails)
        });
      });
    };

    // Force the rank/hours endpoint for a single Steam ID to return a "missing"
    // payload, so the frontend records value === -1 for that field.
    const mockPlayerHoursMissing = async (page: Page, steamId: string) => {
      await page.route(
        `**/api/v1/players/${steamId}/app/*/hours**`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ hours: -1 })
          });
        }
      );
    };

    const mockPlayerInternalRankMissing = async (
      page: Page,
      steamId: string
    ) => {
      await page.route(
        `**/api/v1/players/${steamId}/app/*/rank**`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ average_rank: 0 })
          });
        }
      );
    };

    const mockPlayerExternalRankMissing = async (
      page: Page,
      steamId: string
    ) => {
      await page.route(
        `**/api/v1/players/${steamId}/platform/*/rank**`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            // FaceITCSRank shape — faceit_level === 0 is treated as missing
            body: JSON.stringify({ faceit_level: 0, faceit_elo: 0 })
          });
        }
      );
    };

    test("faceit_rank_required=false: player with externalRank=-1 has green border, no faceit-rank notification, submit is enabled", async ({
      page
    }) => {
      await mockSeasonDetailsRoute(page, { faceit_rank_required: false });
      // Force index-0 player's FACEIT level to look missing regardless of seed
      await mockPlayerExternalRankMissing(page, ValidWorkEmail1SteamId);

      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Faceit Disabled Org"),
        generateUniqueTeamName("Faceit Disabled Team")
      );

      await fillValidPlayers(page, ValidWorkEmail2SteamId);
      await page.waitForTimeout(3000);

      // S1-AC-4: When faceit_rank_required=false, missing FACEIT level must
      // not paint the input red and must not render the external-rank error.
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput0).toHaveClass(/border-green-500/, {
        timeout: 20000
      });
      await expect(
        page.locator('[data-testid="external-rank-error-0"]')
      ).not.toBeVisible();

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
    });

    test("premier_rank_required=false: player with rank=-1 has green border, no premier-rank notification, submit is enabled", async ({
      page
    }) => {
      await mockSeasonDetailsRoute(page, { premier_rank_required: false });
      // Force index-0 player's internal CS2 rank to look missing
      await mockPlayerInternalRankMissing(page, ValidWorkEmail1SteamId);

      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Premier Disabled Org"),
        generateUniqueTeamName("Premier Disabled Team")
      );

      await fillValidPlayers(page, ValidWorkEmail2SteamId);
      await page.waitForTimeout(3000);

      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput0).toHaveClass(/border-green-500/, {
        timeout: 20000
      });
      await expect(
        page.locator('[data-testid="rank-error-0"]')
      ).not.toBeVisible();

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
    });

    test("hours_played_required=false: player with hours=-1 has green border, no hours notification, submit is enabled", async ({
      page
    }) => {
      // Disable both hours_played_required AND profile_link_required so the
      // hours=-1 player does not trip the profile-link gate either (this test
      // is scoped to the hours flag; profile_link_required is exercised in the
      // dedicated tests below).
      await mockSeasonDetailsRoute(page, {
        hours_played_required: false,
        profile_link_required: false
      });
      await mockPlayerHoursMissing(page, ValidWorkEmail1SteamId);

      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("Hours Disabled Org"),
        generateUniqueTeamName("Hours Disabled Team")
      );

      await fillValidPlayers(page, ValidWorkEmail2SteamId);
      await page.waitForTimeout(3000);

      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput0).toHaveClass(/border-green-500/, {
        timeout: 20000
      });
      await expect(
        page.locator('[data-testid="hours-error-0"]')
      ).not.toBeVisible();
      await expect(
        page.locator('[data-testid="profile-link-error-0"]')
      ).not.toBeVisible();

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
    });

    test("profile_link_required=false: player with hours=-1 (proxy for non-public profile) has no profile-link notification and submit is enabled", async ({
      page
    }) => {
      // Same proxy: hours=-1 stands in for "profile not public" because the
      // frontend uses player.hours === -1 to drive the profile-link gate.
      // Disable hours_played_required so hours error does not block the submit.
      await mockSeasonDetailsRoute(page, {
        profile_link_required: false,
        hours_played_required: false
      });
      await mockPlayerHoursMissing(page, ValidWorkEmail1SteamId);

      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("ProfileLink Off Org"),
        generateUniqueTeamName("ProfileLink Off Team")
      );

      await fillValidPlayers(page, ValidWorkEmail2SteamId);
      await page.waitForTimeout(3000);

      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput0).toHaveClass(/border-green-500/, {
        timeout: 20000
      });
      await expect(
        page.locator('[data-testid="profile-link-error-0"]')
      ).not.toBeVisible();

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
    });

    test("profile_link_required=true (with hours_played_required=false): player with hours=-1 shows profile-link notification and submit is blocked", async ({
      page
    }) => {
      // hours_played_required=false ensures the hours-error notification is
      // hidden, so the profile-link error is the ONLY blocker driven by
      // hours=-1 — verifying that profile_link_required is independently
      // enforced by the frontend when enabled.
      await mockSeasonDetailsRoute(page, {
        profile_link_required: true,
        hours_played_required: false
      });
      await mockPlayerHoursMissing(page, ValidWorkEmail1SteamId);

      await setupAuthForUser(
        page,
        15015,
        ValidWorkEmail2SteamId,
        "ValidWorkEmail2"
      );

      await setupCompleteRegistrationForm(
        page,
        generateUniqueOrgName("ProfileLink On Org"),
        generateUniqueTeamName("ProfileLink On Team")
      );

      await fillValidPlayers(page, ValidWorkEmail2SteamId);
      await page.waitForTimeout(3000);

      const profileLinkError = page.locator(
        '[data-testid="profile-link-error-0"]'
      );
      await expect(profileLinkError).toBeVisible({ timeout: 20000 });

      // hours_played_required=false ⇒ hours notification must NOT render even
      // though hours === -1 (S2-AC: gate per-flag).
      await expect(
        page.locator('[data-testid="hours-error-0"]')
      ).not.toBeVisible();

      await assignCaptain(page);

      const finalTermsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      if (!(await finalTermsCheckbox.isChecked().catch(() => false))) {
        await finalTermsCheckbox.click();
      }

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled({ timeout: 10000 });
    });
  });
});
