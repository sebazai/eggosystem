import { expect, test, type Page } from "@playwright/test";
import {
  generateTestJWTForUser,
  generateUniqueOrgCode,
  generateUniqueFaceitTeamId
} from "./utils";

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

  await expect(
    page.getByText("There must be exactly one captain and one co-captain")
  ).not.toBeVisible();
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
    .fill("Test Organization");
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
  await page.locator('[data-testid="team-name-input"]').fill("Test Team");
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
    "66561198999999901", // account_id 15003 - Aabe (has E2E data)
    "66561198999999902", // account_id 15004 - heppajpg (has E2E data)
    "66561198999999903", // account_id 15005 - Quattra (has E2E data)
    "66561198999999905", // account_id 15008 - Hoolyz (has E2E data)
    "66561198999999906" // account_id 15009 - RealPlayer1 (has E2E data)
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
    await setupAuthForUser(page, 15004, "66561198999999902", "heppajpg");

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

  // Organization selection tests
  test.describe("Organization Selection", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();
    });

    test("should allow selecting an organization", async ({ page }) => {
      // Find and verify the organization dropdown exists using data-testid
      const orgSelector = page.locator(
        '[data-testid="fancy-select-organizations"]'
      );
      await expect(orgSelector).toBeVisible();

      // Open the dropdown using the toggle
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      // Find and select the "Other" option using data-testid
      const otherOption = page.locator('[data-testid="organizations-add-new"]');
      await expect(otherOption).toBeVisible();
      await otherOption.click();

      // Fill in required organization fields using data-testid attributes
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
      await page
        .locator('[data-testid="organization-business-id-input"]')
        .fill(generateUniqueOrgCode());
      await page
        .locator('[data-testid="organization-website-input"]')
        .fill("https://kanaliiga.fi/");

      // Check the terms and conditions checkbox
      await page.locator('[data-testid="terms-conditions-checkbox"]').click();

      // Verify the Team Selection button is enabled
      const teamSelectionButton = page.locator(
        '[data-testid="team-selection-button"]'
      );
      await expect(teamSelectionButton).toBeEnabled();
    });
  });

  // Team selection tests
  test.describe("Team Selection", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate to the form
      await page.goto("/seasons/16/signup/registration");

      // Verify we're on the signup form
      await expect(
        page.getByRole("heading", { name: "Season registration" })
      ).toBeVisible();
      await expect(page.getByText("SIGN UP FORM")).toBeVisible();

      // Complete organization selection using data-testid attributes
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      // Select "Other" option
      await page.locator('[data-testid="organizations-add-new"]').click();

      // Fill in required organization fields
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Test Organization");
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
    });

    test("should allow selecting a team", async ({ page }) => {
      // Verify we're on the team tab
      await expect(page.getByText("Team", { exact: true })).toBeVisible();

      // Select team from dropdown using data-testid
      const teamSelector = page.locator(
        '[data-testid="teams-dropdown-toggle"]'
      );
      await expect(teamSelector).toBeVisible();
      await teamSelector.click();

      // Wait for dropdown and select "Add new"

      await page.locator('[data-testid="teams-add-new"]').click();

      // Fill in team name
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");

      // Verify the Faceit ID field appears
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      await expect(faceitIdField).toBeVisible();
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
    test("should validate Steam ID comprehensively including hours detection and organizer approval", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test 1: Hours detection failure
      const steamIdInput0 = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput0.fill("66561198999999910"); // account_id 15002 - InsufficientHoursPlayer (triggers hours: null)
      await page.keyboard.press("Tab");
      await steamIdInput0.blur();

      // Verify red border appears (indicates validation failure due to insufficient hours)
      await expect(steamIdInput0).toHaveClass(/border-red-500/);

      // Test 2: Organizer approval success
      const steamIdInput1 = page.locator('[data-testid="steam-id-input-1"]');
      await steamIdInput1.focus();
      await steamIdInput1.fill("66561198999999903"); // account_id 15005 - Quattra (approved by organizer)
      await page.keyboard.press("Tab");

      // Verify green border appears (indicates successful validation including organizer approval)
      await expect(steamIdInput1).toHaveClass(/border-green-500/);

      // Test 3: Organizer approval failure
      const steamIdInput2 = page.locator('[data-testid="steam-id-input-2"]');
      await steamIdInput2.focus();
      await steamIdInput2.fill("66561198999999904"); // account_id 15006 - Trev (NOT approved by organizer)
      await page.keyboard.press("Tab");
    });
  });

  test("should show green border for player with personal email approved by organizer", async ({
    page
  }) => {
    // Navigate through the registration process (following existing working pattern)
    await page.goto("/seasons/16/signup/registration");

    // Complete organization selection
    await page.locator('[data-testid="organizations-dropdown-toggle"]').click();
    await page.locator('[data-testid="organizations-option-999"]').click();
    await page.locator('[data-testid="terms-conditions-checkbox"]').click();

    // Move to team section
    await page.locator('[data-testid="team-selection-button"]').click();

    // Complete team selection
    await page.locator('[data-testid="teams-dropdown-toggle"]').click();
    await page.locator('[data-testid="teams-option-999"]').click();
    await page
      .locator('[data-testid="team-external-id-input"]')
      .fill(generateUniqueFaceitTeamId());

    // Navigate to players section
    await page.locator('[data-testid="go-to-lineup-button"]').click();

    // Fill in Steam ID for player 1 - this user has employment_approved_by_organizer = true in the E2E seed
    const steamIdInput = page.locator('[data-testid="steam-id-input-1"]');
    await expect(steamIdInput).toBeVisible();

    await steamIdInput.focus();
    await steamIdInput.fill("66561198999999903"); // account_id 15005 - Quattra (approved by organizer)
    await page.keyboard.press("Tab");
    // Wait for all validation APIs to complete

    // Verify green border appears (indicates successful validation including organizer approval)
    await expect(steamIdInput).toHaveClass(/border-green-500/);
  });

  test("should show red border for player with personal email not approved by organizer", async ({
    page
  }) => {
    // Navigate through the registration process (following existing working pattern)
    await page.goto("/seasons/16/signup/registration");

    // Complete organization selection
    await page.locator('[data-testid="organizations-dropdown-toggle"]').click();

    await page.locator('[data-testid="organizations-add-new"]').click();
    await page
      .locator('[data-testid="organization-name-input"]')
      .fill("Test Organization");
    await page
      .locator('[data-testid="organization-business-id-input"]')
      .fill(generateUniqueOrgCode());
    await page
      .locator('[data-testid="organization-website-input"]')
      .fill("https://kanaliiga.fi/");
    await page.locator('[data-testid="terms-conditions-checkbox"]').click();

    // Move to team section
    await page.locator('[data-testid="team-selection-button"]').click();

    // Complete team selection
    await page.locator('[data-testid="teams-dropdown-toggle"]').click();
    await page.locator('[data-testid="teams-add-new"]').click();
    await page.locator('[data-testid="team-name-input"]').fill("Test Team");
    await page
      .locator('[data-testid="team-external-id-input"]')
      .fill(generateUniqueFaceitTeamId());

    // Navigate to players section
    await page.locator('[data-testid="go-to-lineup-button"]').click();

    const steamIdInput = page.locator('[data-testid="steam-id-input-1"]');
    await expect(steamIdInput).toBeVisible();

    await steamIdInput.focus();
    await steamIdInput.fill("66561198999999904"); // account_id 15006 - Trev (NOT approved by organizer)
    await page.keyboard.press("Tab");

    // Verify red border appears (indicates validation failure due to lack of organizer approval)
    await expect(steamIdInput).toHaveClass(/border-red-500/);
  });

  // Complete Registration Flow tests
  test.describe("Complete Registration Flow", () => {
    test("should complete full registration flow and successfully submit", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(page, 15005, "66561198999999903", "Quattra");

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        "Complete Flow Test Org",
        "Complete Flow Test Team"
      );

      // Fill in 5 players with valid Steam IDs (include authenticated user)
      await fillValidPlayers(page, "66561198999999903");

      // Check all visible nickname spans for the correct nicknames
      const nicknameSpans = page.locator("span.text-kanaliiga-orange");
      const nicknameCount = await nicknameSpans.count();
      expect(nicknameCount).toBeGreaterThan(0);

      // Verify nicknames from E2E seed data (Quattra should be in the list)
      await expect(nicknameSpans.nth(0)).toBeVisible();
      await expect(nicknameSpans.nth(0)).toContainText(/aabe/i);

      // Find Quattra in the list (he should be there somewhere since he's the authenticated user)
      let foundQuattra = false;
      for (let i = 0; i < nicknameCount; i++) {
        const nickname = await nicknameSpans.nth(i).textContent();
        if (nickname && /quattra/i.test(nickname)) {
          foundQuattra = true;
          break;
        }
      }
      expect(foundQuattra).toBe(true);

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

      // Check for successful submission
      if (responseStatus === 200 || responseStatus === 201) {
        // Verify post-submission state
        await expect(submitButton).toBeDisabled(); // Button should be disabled after submission

        // Look for any success messages or navigation changes
        const successMessage = page
          .locator("text=/success|submitted|registered|thank you/i")
          .first();
        if (await successMessage.isVisible({ timeout: 5000 })) {
          await expect(successMessage).toBeVisible();
        }
      }
    });

    test("should validate captain and co-captain assignment comprehensively", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(page, 15008, "66561198999999905", "Hoolyz");

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        "Captain Test Org",
        "Captain Test Team"
      );

      // Fill in 5 players with valid Steam IDs (include authenticated user)
      await fillValidPlayers(page, "66561198999999905");

      // Test 1: Check that all captain and co-captain checkboxes exist
      for (let i = 0; i < 5; i++) {
        const captainCheckbox = page.locator(
          `[data-testid="captain-checkbox-${i}"]`
        );
        const coCaptainCheckbox = page.locator(
          `[data-testid="co-captain-checkbox-${i}"]`
        );
        expect(captainCheckbox).toBeDefined();
        expect(coCaptainCheckbox).toBeDefined();
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
      expect(termsCheckbox).toBeVisible();
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
      await steamIdInput.fill("66561198999999913"); // NoFaceitRankPlayer - has CS2 rank but no FaceIT rank
      await page.keyboard.press("Tab");
      await steamIdInput.blur();

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

    test("should not allow form submission with external rank error if other validations pass", async ({
      page
    }) => {
      // Use a different authenticated user for this test to avoid conflicts
      await setupAuthForUser(page, 15009, "66561198999999906", "RealPlayer1");

      // Set up complete registration form
      await setupCompleteRegistrationForm(
        page,
        "External Rank Test Org",
        "External Rank Test Team"
      );

      // Fill in 5 players - one without FaceIT rank, others with valid data
      const validPlayers = [
        "66561198999999913", // NoFaceitRankPlayer (no FaceIT rank)
        "66561198999999901", // Aabe (has E2E data)
        "66561198999999905", // Hoolyz (has E2E data)
        "66561198999999906", // RealPlayer1 (has E2E data) - authenticated user
        "66561198999999907" // RealPlayer2 (has E2E data)
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

      await expect(externalRankError).toContainText(
        "Could not detect external FACEIT rank for the player"
      );

      // Check if submit button becomes enabled despite external rank error
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      await expect(submitButton).toBeDisabled({ timeout: 10000 });
    });

    test("should not show duplicate external rank error when there are multiple players with same id missing faceit rank", async ({
      page
    }) => {
      // Set up form to players section using existing team_id 999
      await setupFormToPlayersSectionWithTeam999(page);

      // Test multiple players without FaceIT rank
      const playersWithoutFaceitRank = [
        "66561198999999913", // NoFaceitRankPlayer
        "66561198999999913" // Same player added twice to test multiple errors
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

      await expect(externalRankError0).toBeVisible();
      await expect(externalRankError1).not.toBeVisible();

      await expect(externalRankError0).toContainText(
        "Could not detect external FACEIT rank for the player"
      );
    });
  });
});
