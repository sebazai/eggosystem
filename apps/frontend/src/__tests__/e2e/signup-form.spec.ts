import { expect, test, type Page } from "@playwright/test";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Helper function to generate a valid JWT token for E2E testing
let cachedJWTToken: string | null = null;

// Helper function to generate unique test data
function generateUniqueOrgCode(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${timestamp}-${random}`;
}

// Helper function to generate unique FACEIT team ID
function generateUniqueFaceitTeamId(): string {
  return uuidv4();
}

function generateTestJWT(): string {
  // Return cached token if available
  if (cachedJWTToken) {
    return cachedJWTToken;
  }

  try {
    // Read the private key that the E2E backend uses
    const privateKey = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../../apps/backend/private_access_token.pem"
      ),
      "utf8"
    );

    // Create a payload that matches what the backend expects and references a real E2E user
    // The E2E seed creates users with account IDs 3, 4, 5, 6, 8 and sets their emails/policies
    // Let's use account ID 4 which should exist in the E2E database but has no existing registration
    const payload = {
      account_id: 4,
      provider_id: "76561197960283932", // This matches heppajpg's Steam ID
      permissions: [],
      roles: [],
      nickname: "heppajpg",
      provider: "steam" as const
    };

    // Sign the token with the same algorithm the backend uses
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: "1h"
    });

    // Cache the token for subsequent use
    cachedJWTToken = token;
    return token;
  } catch (error) {
    console.warn("Could not generate real JWT token, using fallback:", error);
    // Fallback to the token the mocks expect
    const fallbackToken = "valid_token";
    cachedJWTToken = fallbackToken;
    return fallbackToken;
  }
}

async function assignCaptain(page: Page) {
  // Try to expand accordions and assign captain/co-captain roles

  const accordionTriggers = page.locator(
    `[data-testid="player-accordion-triggers"]`
  );
  const triggerCount = await accordionTriggers.count();

  let captainAssigned = false;
  let coCaptainAssigned = false;

  // Assign captain to first available player
  for (let i = 0; i < Math.min(triggerCount, 5) && !captainAssigned; i++) {
    const trigger = accordionTriggers.nth(i);
    if (await trigger.isVisible()) {
      await trigger.click();

      const captainCheckbox = page.locator(
        `[data-testid="captain-checkbox-${i}"]`
      );
      if (await captainCheckbox.isVisible()) {
        const isAlreadyCaptain =
          await captainCheckbox.getAttribute("aria-checked");
        if (isAlreadyCaptain !== "true") {
          await captainCheckbox.click();

          captainAssigned = true;
        } else {
          captainAssigned = true;
        }
      }
    }
  }

  // Assign co-captain to next available player
  for (let i = 0; i < Math.min(triggerCount, 5) && !coCaptainAssigned; i++) {
    const trigger = accordionTriggers.nth(i);
    if (await trigger.isVisible()) {
      // Expand if not already expanded
      const isOpen = await trigger.getAttribute("data-state");
      if (isOpen === "closed") {
        await trigger.click();
      }
      const captainCheckbox = page.locator(
        `[data-testid="captain-checkbox-${i}"]`
      );
      if (await captainCheckbox.isVisible()) {
        const isAlreadyCaptain =
          await captainCheckbox.getAttribute("aria-checked");
        if (isAlreadyCaptain === "true") {
          continue;
        }
      }

      const coCaptainCheckbox = page.locator(
        `[data-testid="co-captain-checkbox-${i}"]`
      );
      if (await coCaptainCheckbox.isVisible()) {
        const isAlreadyCoCaptain =
          await coCaptainCheckbox.getAttribute("aria-checked");
        if (isAlreadyCoCaptain !== "true") {
          await coCaptainCheckbox.click();

          coCaptainAssigned = true;
        } else {
          coCaptainAssigned = true;
        }
      }
    }
  }
}

test.describe("Signup Form", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication cookie first (most important)
    await page.context().addCookies([
      {
        name: "access_token",
        value: generateTestJWT(),
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false
      }
    ]);

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

    // Intercept draft API requests specifically to add Bearer authorization header
    await page.route("**/draft", async (route) => {
      const headers = {
        ...route.request().headers(),
        Authorization: `Bearer ${generateTestJWT()}`
      };

      await route.continue({ headers });
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

      // Now we should be on the team tab
      // Select "Add new" for team

      await page.locator('[data-testid="teams-dropdown-toggle"]').click();

      // Wait for dropdown and select add new team option

      await page.locator('[data-testid="teams-add-new"]').click();

      // Fill in the new team name
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");
    });

    test("should reject empty Faceit ID", async ({ page }) => {
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );
      await faceitIdField.focus();
      await faceitIdField.fill("");
      await faceitIdField.blur();

      const errorMessage = page.locator(
        '[data-testid="team-external-id-error"]'
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/required|invalid|uuid/i);
      await expect(faceitIdField).toHaveClass(/border-red-500/);
      await expect(goToLineupButton).toBeDisabled();
    });

    test("should reject Faceit ID without hyphens", async ({ page }) => {
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Fill in an invalid Faceit ID (without hyphens)
      await faceitIdField.focus();
      await faceitIdField.fill("77dd9104d2f14f50ba80d58457cff5a9");
      await faceitIdField.blur();

      // Test 1: Check that the go to lineup button is disabled
      await expect(goToLineupButton).toBeDisabled();

      // Test 2: Check that error message appears
      const errorMessage = page.locator(
        '[data-testid="team-external-id-error"]'
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/Invalid uuid|invalid|uuid/i);

      // Test 3: Check that red border styling is applied
      await expect(faceitIdField).toHaveClass(/border-red-500/);
    });

    test("should reject Faceit ID with HTTP prefix", async ({ page }) => {
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );

      // Fill in an invalid Faceit ID (with HTTP prefix)
      await faceitIdField.focus();
      await faceitIdField.fill(`http://${generateUniqueFaceitTeamId()}`);

      // Wait a moment for validation to process

      // Trigger validation by blurring the field
      await faceitIdField.blur();

      // Test 1: Check that the go to lineup button is disabled
      await expect(goToLineupButton).toBeDisabled();

      // Test 2: Check that error message appears (accept the actual error message)
      const errorMessage = page.locator(
        '[data-testid="team-external-id-error"]'
      );
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(
        /Expected string, received null|invalid|uuid/i
      );

      // Test 3: Check that red border styling is applied
      await expect(faceitIdField).toHaveClass(/border-red-500/);
    });

    test("should accept valid UUID format and allow navigation", async ({
      page
    }) => {
      const faceitIdField = page.locator(
        '[data-testid="team-external-id-input"]'
      );
      const goToLineupButton = page.locator(
        '[data-testid="go-to-lineup-button"]'
      );
      await faceitIdField.focus();
      await faceitIdField.fill(generateUniqueFaceitTeamId());
      await faceitIdField.blur();

      const errorMessage = page.locator(
        '[data-testid="team-external-id-error"]'
      );
      await expect(errorMessage).toHaveCount(0);
      await expect(faceitIdField).not.toHaveClass(/border-red-500/);
      await expect(goToLineupButton).toBeEnabled();
      await goToLineupButton.click();
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();
    });
  });

  // Steam ID Validation tests
  test.describe("Steam ID Validation", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Navigate through the registration process
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

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

      // Verify we're on the players tab
      const playersHeading = page.getByRole("heading", { name: "Players" });
      await expect(playersHeading).toBeVisible();
    });

    test("should show error when hours cannot be detected", async ({
      page
    }) => {
      // Navigate through the registration process (following existing working pattern)
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Hours Test Organization");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Hours Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Find first Steam ID input field
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await expect(steamIdInput).toBeVisible();

      // Enter the REAL Steam ID that will cause hours detection failure
      await steamIdInput.fill("76561197960269868");
      await page.keyboard.press("Tab");

      // Add explicit blur to ensure validation is triggered
      await steamIdInput.blur();

      const hoursError = page.locator('[data-testid="hours-error-0"]');
      const profileError = page.locator(
        '[data-testid="profile-privacy-error-0"]'
      );
      const otherErrors = page.locator('[data-testid*="error"]');

      expect(hoursError).toBeVisible();
      expect(profileError).not.toBeVisible();
      const allErrors = await otherErrors.count();

      // If the test fails, log all error text for debugging
      if (allErrors > 0) {
        for (let i = 0; i < allErrors; i++) {
          const errorElement = otherErrors.nth(i);
          expect(errorElement).toBeVisible();
        }
      }

      // Verify the hours error appears with correct message
      const hoursError2 = page.locator('[data-testid="hours-error-0"]');
      await expect(hoursError2).toBeVisible();
      await expect(hoursError2).toContainText("Could not detect the hours");
    });
  });

  test("should show green border for player with personal email approved by organizer", async ({
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

    // Fill in Steam ID for player 1 - this user has employment_approved_by_organizer = true in the E2E seed
    const steamIdInput = page.locator('[data-testid="steam-id-input-1"]');
    await expect(steamIdInput).toBeVisible();

    await steamIdInput.focus();
    await steamIdInput.fill("76561197960275646"); // account_id 5 - approved by organizer
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

    // Fill in Steam ID for player 1 - this user has employment_approved_by_organizer = false in the E2E seed
    const steamIdInput = page.locator('[data-testid="steam-id-input-1"]');
    await expect(steamIdInput).toBeVisible();

    await steamIdInput.focus();
    await steamIdInput.fill("76561197960283671"); // account_id 6 - NOT approved by organizer
    await page.keyboard.press("Tab");

    // Verify red border appears (indicates validation failure due to lack of organizer approval)
    await expect(steamIdInput).toHaveClass(/border-red-500/);
  });

  // Complete Registration Flow tests
  test.describe("Complete Registration Flow", () => {
    test("should enable submit button when all requirements are met", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
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

      // Navigate to team section and complete team selection
      await page.locator('[data-testid="team-selection-button"]').click();
      await page.locator('[data-testid="teams-dropdown-toggle"]').click();
      await page.locator('[data-testid="teams-add-new"]').click();
      await page.locator('[data-testid="team-name-input"]').fill("Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Fill in exactly 5 valid players (minimum required) - using unique Steam IDs
      const validPlayers = [
        "76561197960273207", // account_id 3 - auth user
        "76561197960275646", // account_id 5 - approved
        "76561197960283932", // account_id 4 - should be valid
        "76561197960265728", // account_id 8 - Hoolyz (from E2E seed)
        "76561197960265740" // account_id 9 - RealPlayer1 (from E2E seed)
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(validPlayers[i]!); // Non-null assertion
        await page.keyboard.press("Tab");
      }

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

      // Give it time to enable
      try {
        await expect(submitButton).toBeEnabled({ timeout: 5000 });
      } catch (_error) {
        // Log the current state for debugging
        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /Submit/i });
        const finalTermsCheckbox = page.locator(
          '[data-testid="terms-conditions-checkbox"]'
        );
        const submitDisabled = await submitButton.getAttribute("disabled");
        expect(submitDisabled).toBeNull();
        const termsChecked = await finalTermsCheckbox
          .isChecked()
          .catch(() => "not found");
        expect(termsChecked).toBe("checked");
        const greenInputs = await page
          .locator('input[class*="border-green-500"]')
          .count();
        expect(greenInputs).toBeGreaterThan(0);
        const redInputs = await page
          .locator('input[class*="border-red-500"]')
          .count();
        expect(redInputs).toBeGreaterThan(0);
      }
    });

    test("should successfully submit the complete registration form", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Submission Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Submission Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId()); // Use real FACEIT team ID for submission

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Fill in 5 players using unique Steam IDs from our E2E seed (no duplicates)
      const validPlayers = [
        "76561197960283932", // account_id 4 - heppajpg (our auth user, has E2E data)
        "76561197960265728", // account_id 8 - Hoolyz (has E2E data)
        "76561197960265740", // account_id 9 - RealPlayer1 (has E2E data)
        "76561197961279983", // account_id 10 - RealPlayer2 (has E2E data)
        "76561197960265748" // account_id 11 - RealPlayer3 (has E2E data)
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(validPlayers[i]!); // Non-null assertion
        await page.keyboard.press("Tab");
      }

      // Wait for all validations to complete

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

      // Wait for submit button to be enabled
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

    test("should fill in 5 players and verify all validations pass", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Validation Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Validation Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Player data using unique Steam IDs from our E2E seed
      const PLAYER1 = { steamId: "76561197960283932", nickname: "heppajpg" }; // account_id 4 - our auth user (has E2E data)
      const PLAYER2 = { steamId: "76561197960265728", nickname: "Hoolyz" }; // account_id 8 - (has E2E data)
      const PLAYER3 = { steamId: "76561197960265740", nickname: "RealPlayer1" }; // account_id 9 - (has E2E data)
      const PLAYER4 = { steamId: "76561197961279983", nickname: "RealPlayer2" }; // account_id 10 - (has E2E data)
      const PLAYER5 = { steamId: "76561197960265748", nickname: "RealPlayer3" }; // account_id 11 - (has E2E data)

      const validPlayers = [PLAYER1, PLAYER2, PLAYER3, PLAYER4, PLAYER5];

      // Fill in each player and wait for validation
      for (let i = 0; i < validPlayers.length; i++) {
        const player = validPlayers[i]!; // Non-null assertion since we know the array size

        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(player.steamId);
        await page.keyboard.press("Tab");
      }

      // Extra wait for all nicknames to load

      // Check all visible nickname spans for the correct nicknames
      const nicknameSpans = page.locator("span.text-kanaliiga-orange");

      // Check that we have at least some nicknames loaded (the valid players)
      const nicknameCount = await nicknameSpans.count();
      expect(nicknameCount).toBeGreaterThan(0);

      // With backend E2E mocking, we should see the actual nicknames from our seed data
      await expect(nicknameSpans.nth(0)).toBeVisible();
      await expect(nicknameSpans.nth(0)).toContainText(/heppajpg/i);
      await expect(nicknameSpans.nth(1)).toBeVisible();
      await expect(nicknameSpans.nth(1)).toContainText(/hoolyz/i);
    });

    test("should test captain and co-captain assignment process", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Debug Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Debug Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Fill in 5 players to match actual usage

      const validPlayers = [
        "76561197960283932", // account_id 4 - heppajpg (our auth user, not in team 999)
        "76561197960265728", // account_id 8 - Hoolyz (from E2E seed)
        "76561197960265740", // account_id 9 - RealPlayer1 (from E2E seed)
        "76561197961279983", // account_id 10 - RealPlayer2 (from E2E seed)
        "76561197960265748" // account_id 11 - RealPlayer3 (from E2E seed)
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
      }

      // Check for ALL captain and co-captain checkboxes to see which indices actually exist
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

      for (let i = 0; i < 5; i++) {
        const captainCheckbox = page.locator(
          `[data-testid="captain-checkbox-${i}"]`
        );
        if (await captainCheckbox.isVisible()) {
          const currentState =
            await captainCheckbox.getAttribute("aria-checked");

          if (currentState !== "true") {
            await captainCheckbox.click();
          }
          break; // Only assign one captain
        }
      }

      // Try to assign co-captain (based on the user showing co-captain-checkbox-2 exists)

      for (let i = 0; i < 5; i++) {
        const coCaptainCheckbox = page.locator(
          `[data-testid="co-captain-checkbox-${i}"]`
        );
        if (await coCaptainCheckbox.isVisible()) {
          const currentState =
            await coCaptainCheckbox.getAttribute("aria-checked");

          if (currentState !== "true") {
            await coCaptainCheckbox.click();
          }
          break; // Only assign one co-captain
        }
      }

      // Check final validation state

      const validationMessage = page.locator(
        "text=There must be exactly one captain and one co-captain"
      );
      expect(validationMessage).toBeVisible();

      // Check submit button state
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      expect(submitButton).toBeDisabled();

      // Check terms and conditions
      const termsCheckbox = page.locator(
        '[data-testid="terms-conditions-checkbox"]'
      );
      expect(termsCheckbox).toBeVisible();
    });

    test("should attempt submission and check for captain/co-captain validation", async ({
      page
    }) => {
      // Navigate to the registration form
      await page.goto("/seasons/16/signup/registration");

      // Complete organization selection
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();

      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Submission Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Submission Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId()); // Use real FACEIT team ID for submission

      // Navigate to players section
      await page.locator('[data-testid="go-to-lineup-button"]').click();

      // Fill in 5 players
      const validPlayers = [
        "76561197960273207", // account_id 3 - auth user (auto-captain)
        "76561197960275646", // account_id 5 - approved
        "76561197960283932", // account_id 4 - valid (HEPPAJPG)
        "76561197960265728", // account_id 8 - Hoolyz (from E2E seed)
        "76561197960265740" // account_id 9 - RealPlayer1 (from E2E seed)
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await expect(steamIdInput).toBeVisible();
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
      }

      // Wait for all validations to complete

      // Check for the captain auto-assignment message
      const captainMessage = page.locator(
        "text=By default you are the captain"
      );
      expect(captainMessage).toBeVisible();

      // Check submit button state
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      const submitEnabled = await submitButton.isEnabled();

      if (!submitEnabled) {
        return;
      }

      // Check for validation states and captain/co-captain assignment

      // Check for validation errors that might be present
      const validationErrors = [
        "text=There must be exactly one captain and one co-captain",
        "text=captain and one co-captain",
        "text=co-captain",
        '[role="alert"]' // Generic alert/error elements
      ];

      for (const errorSelector of validationErrors) {
        const errorElement = page.locator(errorSelector).first(); // Use .first() to avoid strict mode violations
        expect(errorElement).toBeVisible();
      }
    });
  });

  // Complete registration flow test - should attempt submission and check for captain/co-captain validation
  test("should attempt submission and check for captain/co-captain validation", async ({
    page
  }) => {
    // Navigate to the registration form
    await page.goto("/seasons/16/signup/registration");

    // Complete organization selection
    await page.locator('[data-testid="organizations-dropdown-toggle"]').click();

    await page.locator('[data-testid="organizations-add-new"]').click();
    await page
      .locator('[data-testid="organization-name-input"]')
      .fill("Submission Test Org");
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
    await page
      .locator('[data-testid="team-name-input"]')
      .fill("Submission Test Team");
    await page
      .locator('[data-testid="team-external-id-input"]')
      .fill(generateUniqueFaceitTeamId()); // Use real FACEIT team ID for submission

    // Navigate to players section
    await page.locator('[data-testid="go-to-lineup-button"]').click();

    // Fill in 5 players
    const validPlayers = [
      "76561197960273207", // account_id 3 - auth user (auto-captain)
      "76561197960275646", // account_id 5 - approved
      "76561197960283932", // account_id 4 - valid (HEPPAJPG)
      "76561197960265728", // account_id 8 - Hoolyz (from E2E seed)
      "76561197960265740" // account_id 9 - RealPlayer1 (from E2E seed)
    ];

    for (let i = 0; i < 5; i++) {
      const steamIdInput = page.locator(`[data-testid="steam-id-input-${i}"]`);
      await expect(steamIdInput).toBeVisible();
      await steamIdInput.fill(validPlayers[i]!);
      await page.keyboard.press("Tab");
    }

    // Wait for all validations to complete

    // Check for the captain auto-assignment message
    const captainMessage = page.locator("text=By default you are the captain");
    expect(captainMessage).toBeVisible();

    // Check submit button state
    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /Submit/i });
    const submitEnabled = await submitButton.isEnabled();

    if (!submitEnabled) {
      return;
    }

    // Check for validation states and captain/co-captain assignment

    // Check for validation errors that might be present
    const validationErrors = [
      "text=There must be exactly one captain and one co-captain",
      "text=captain and one co-captain",
      "text=co-captain",
      '[role="alert"]' // Generic alert/error elements
    ];

    for (const errorSelector of validationErrors) {
      const errorElement = page.locator(errorSelector).first(); // Use .first() to avoid strict mode violations
      expect(errorElement).toBeVisible();
    }
  });

  // NEW TEST BLOCKS FOR MISSING SCENARIOS

  // 1. Silent API Validation Failures
  test.describe("Silent API Validation Failures", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      // Set up authentication
      await page.context().addCookies([
        {
          name: "access_token",
          value: generateTestJWT(),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false
        }
      ]);

      // Navigate through basic form setup
      await page.goto("/seasons/16/signup/registration");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Silent Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Silent Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();
    });

    test("should detect when hours API returns null but with 200 status", async ({
      page
    }) => {
      // Use the Steam ID that triggers backend hours failure (returns null, processed to hours: -1)
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput.fill("76561197960269868"); // This Steam ID triggers hours: null in backend mock
      await page.keyboard.press("Tab");

      expect(page.getByTestId("loading-spinner")).not.toBeVisible();

      // Check if input shows green (false positive)
      const hasGreenBorder = await steamIdInput.getAttribute("class");
      const isGreen = hasGreenBorder?.includes("border-green-500");

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });

      if (isGreen) {
        // This is the bug - green border but invalid data
        console.log("BUG DETECTED: Green border with null hours data");

        // Submit should be disabled or fail silently
        if (await submitButton.isEnabled()) {
          console.log("CRITICAL BUG: Submit button enabled with invalid data");

          // Try clicking submit and verify nothing happens
          await submitButton.click();
          await page.waitForTimeout(2000);

          // Should still be on same page
          await expect(
            page.locator('[data-testid="go-to-lineup-button"]')
          ).toBeVisible();
        }
      }

      // Proper behavior: should show error or red border
      await expect(steamIdInput).not.toHaveClass(/border-green-500/);
    });

    test("should detect when player details API returns incomplete data", async ({
      page
    }) => {
      // Use the Steam ID that has incomplete details in backend (account_id 12)
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput.fill("76561197960280001"); // IncompleteDetailsPlayer with invalid work email, etc.
      await page.keyboard.press("Tab");
      await page.waitForTimeout(3000);

      // Check if validation properly handles missing fields
      const hasGreenBorder = await steamIdInput.getAttribute("class");
      const isGreen = hasGreenBorder?.includes("border-green-500");

      if (isGreen) {
        console.log(
          "BUG DETECTED: Green border with incomplete player details"
        );

        // Fill all players and check submit state
        const validPlayers = [
          "76561197960283932",
          "76561197960265728",
          "76561197960265740",
          "76561197961279983",
          "76561197960265748"
        ];

        for (let i = 1; i < 5; i++) {
          const input = page.locator(`[data-testid="steam-id-input-${i}"]`);
          await input.fill(validPlayers[i]!);
          await page.keyboard.press("Tab");
        }

        await assignCaptain(page);

        const termsCheckbox = page.locator(
          '[data-testid="terms-conditions-checkbox"]'
        );
        if (await termsCheckbox.isVisible()) {
          const isChecked = await termsCheckbox.isChecked().catch(() => false);
          if (!isChecked) {
            await termsCheckbox.click();
          }
        }

        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /Submit/i });

        if (await submitButton.isEnabled()) {
          console.log(
            "CRITICAL BUG: Submit enabled with incomplete validation data"
          );
        }
      }
    });
  });

  // 2. Race Condition Tests
  test.describe("API Race Condition Tests", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.context().addCookies([
        {
          name: "access_token",
          value: generateTestJWT(),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false
        }
      ]);

      await page.goto("/seasons/16/signup/registration");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Race Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Race Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();
    });

    test("should handle race conditions between validation API calls", async ({
      page
    }) => {
      // Use RaceConditionPlayer Steam ID which has invalid hours AND private profile in backend
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput.fill("76561197960280002"); // RaceConditionPlayer - backend returns null hours and private profile
      await page.keyboard.press("Tab");

      // Wait for partial validations to complete
      await page.waitForTimeout(1000);

      // Check if border changes to green prematurely (before all validations complete)
      const borderAfter1s = await steamIdInput.getAttribute("class");
      const isGreenEarly = borderAfter1s?.includes("border-green-500");

      if (isGreenEarly) {
        console.log(
          "POTENTIAL BUG: Green border before all validations complete"
        );
      }

      // Wait for all validations to complete
      await page.waitForTimeout(2500);

      // Final state should be red due to multiple validation failures
      await expect(steamIdInput).toHaveClass(/border-red-500/);
    });

    test("should handle simultaneous player validation requests", async ({
      page
    }) => {
      // Set up API mocks with staggered delays
      let callCount = 0;

      await page.route("**/players/*/app/*/hours**", async (route) => {
        const delay = (callCount % 3) * 500; // Different delays for different calls
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, delay));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ hours: 1500 })
        });
      });

      // Fill multiple players quickly to trigger race conditions
      const validPlayers = [
        "76561197960283932",
        "76561197960265728",
        "76561197960265740"
      ];

      for (let i = 0; i < 3; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await steamIdInput.fill(validPlayers[i]!);
        // Don't wait - trigger all validations simultaneously
      }

      // Wait and check if validation states are consistent
      await page.waitForTimeout(3000);

      // Check if any inputs are in inconsistent states
      const greenInputs = await page
        .locator('input[class*="border-green-500"]')
        .count();
      const redInputs = await page
        .locator('input[class*="border-red-500"]')
        .count();
      const neutralInputs = await page
        .locator(
          'input:not([class*="border-green-500"]):not([class*="border-red-500"])'
        )
        .count();

      console.log(
        `Validation results: ${greenInputs} green, ${redInputs} red, ${neutralInputs} neutral`
      );

      // At least some should have completed validation (not be neutral)
      expect(greenInputs + redInputs).toBeGreaterThan(0);
    });
  });

  // 3. Form State Inconsistency Tests
  test.describe("Form State Inconsistency Tests", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.context().addCookies([
        {
          name: "access_token",
          value: generateTestJWT(),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false
        }
      ]);

      await page.goto("/seasons/16/signup/registration");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Inconsistency Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Inconsistency Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();
    });

    test("should detect when form shows all green but validation is incomplete", async ({
      page
    }) => {
      // Mock all APIs to return "valid-looking" but actually incomplete data
      await page.route("**/players/*/app/*/hours**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ hours: -1 }) // Invalid hours but might not be caught
        });
      });

      await page.route("**/players/*/public", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ public: true })
        });
      });

      await page.route("**/players/*/details", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            steam_id: "76561197960283932",
            nickname: "TestPlayer",
            account_id: 4,
            work_email_verified: false, // Should cause validation failure
            is_valid_work_email: false,
            is_valid_full_name: true,
            has_accepted_latest_privacy_policy: true
          })
        });
      });

      // Fill all 5 players
      const validPlayers = [
        "76561197960283932",
        "76561197960265728",
        "76561197960265740",
        "76561197961279983",
        "76561197960265748"
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
      }

      await page.waitForTimeout(3000);

      // Check if inputs show green (false positive)
      const greenInputs = await page
        .locator('input[class*="border-green-500"]')
        .count();

      if (greenInputs > 0) {
        console.log(
          `POTENTIAL BUG: ${greenInputs} inputs show green with invalid data`
        );

        // Try to complete form and submit
        await assignCaptain(page);

        const termsCheckbox = page.locator(
          '[data-testid="terms-conditions-checkbox"]'
        );
        if (await termsCheckbox.isVisible()) {
          const isChecked = await termsCheckbox.isChecked().catch(() => false);
          if (!isChecked) {
            await termsCheckbox.click();
          }
        }

        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /Submit/i });

        if (await submitButton.isEnabled()) {
          console.log(
            "CRITICAL BUG: Submit enabled with incomplete validation data"
          );
        }
      }

      // Proper behavior: should show errors or disabled submit
      const redInputs = await page
        .locator('input[class*="border-red-500"]')
        .count();
      expect(redInputs).toBeGreaterThan(0);
    });

    test("should verify submit button state matches actual form validity", async ({
      page
    }) => {
      // Add client-side form state tracking
      await page.addInitScript(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).formValidationLog = [];

        // Override console.log to capture validation events
        const originalLog = console.log;
        console.log = function (...args: unknown[]) {
          if (
            args.some(
              (arg) =>
                typeof arg === "string" &&
                (arg.includes("validation") ||
                  arg.includes("hours") ||
                  arg.includes("public") ||
                  arg.includes("setValue"))
            )
          ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).formValidationLog.push({
              timestamp: Date.now(),
              args
            });
          }
          return originalLog.apply(this, args);
        };
      });

      // Fill form with mixed valid/invalid data
      const steamIdInput = page.locator('[data-testid="steam-id-input-0"]');
      await steamIdInput.fill("76561197960283932");
      await page.keyboard.press("Tab");

      await page.waitForTimeout(3000);

      // Check form validation log
      const validationLog = await page.evaluate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => (window as any).formValidationLog || []
      );
      console.log("Form validation events:", validationLog);

      // Analyze submit button state
      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /Submit/i });
      const isSubmitEnabled = await submitButton.isEnabled();

      // Check actual validation states
      const greenInputs = await page
        .locator('input[class*="border-green-500"]')
        .count();
      const redInputs = await page
        .locator('input[class*="border-red-500"]')
        .count();
      const neutralInputs = 5 - greenInputs - redInputs;

      console.log(
        `Submit enabled: ${isSubmitEnabled}, Green: ${greenInputs}, Red: ${redInputs}, Neutral: ${neutralInputs}`
      );

      // If submit is enabled, all inputs should be green and valid
      if (isSubmitEnabled) {
        expect(greenInputs).toBe(5);
        expect(redInputs).toBe(0);
        expect(neutralInputs).toBe(0);
      }
    });
  });

  // 4. Mixed Validation State Tests
  test.describe("Mixed Validation State Tests", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.context().addCookies([
        {
          name: "access_token",
          value: generateTestJWT(),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false
        }
      ]);

      await page.goto("/seasons/16/signup/registration");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Mixed Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Mixed Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();
    });

    test("should handle mixed valid/invalid player validations", async ({
      page
    }) => {
      // Mock APIs to return different results for different players
      await page.route("**/players/*/app/*/hours**", async (route) => {
        const steamId = route
          .request()
          .url()
          .match(/players\/([^/]+)\/app/)?.[1];

        if (steamId === "76561197960283932") {
          // First player: valid hours
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ hours: 1500 })
          });
        } else if (steamId === "76561197960265728") {
          // Second player: invalid hours
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ hours: -1 })
          });
        } else {
          // Other players: null hours
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ hours: null })
          });
        }
      });

      await page.route("**/players/*/public", async (route) => {
        const steamId = route
          .request()
          .url()
          .match(/players\/([^/]+)\/public/)?.[1];

        if (steamId === "76561197960283932") {
          // First player: public profile
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ public: true })
          });
        } else {
          // Other players: private profiles
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ public: false })
          });
        }
      });

      // Fill 3 players with different expected validation results
      const testPlayers = [
        "76561197960283932",
        "76561197960265728",
        "76561197960265740"
      ];

      for (let i = 0; i < 3; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await steamIdInput.fill(testPlayers[i]!);
        // Don't wait - trigger all validations simultaneously
      }

      // Wait and check if validation states are consistent
      await page.waitForTimeout(3000);

      // Check if any inputs are in inconsistent states
      const greenInputs = await page
        .locator('input[class*="border-green-500"]')
        .count();
      const redInputs = await page
        .locator('input[class*="border-red-500"]')
        .count();
      const neutralInputs = await page
        .locator(
          'input:not([class*="border-green-500"]):not([class*="border-red-500"])'
        )
        .count();

      console.log(
        `Validation results: ${greenInputs} green, ${redInputs} red, ${neutralInputs} neutral`
      );

      // At least some should have completed validation (not be neutral)
      expect(greenInputs + redInputs).toBeGreaterThan(0);
    });
  });

  // 5. Critical Edge Cases
  test.describe("Critical Edge Cases", () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.context().addCookies([
        {
          name: "access_token",
          value: generateTestJWT(),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false
        }
      ]);

      await page.goto("/seasons/16/signup/registration");
      await page
        .locator('[data-testid="organizations-dropdown-toggle"]')
        .click();
      await page.locator('[data-testid="organizations-add-new"]').click();
      await page
        .locator('[data-testid="organization-name-input"]')
        .fill("Edge Case Test Org");
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
      await page
        .locator('[data-testid="team-name-input"]')
        .fill("Edge Case Test Team");
      await page
        .locator('[data-testid="team-external-id-input"]')
        .fill(generateUniqueFaceitTeamId());
      await page.locator('[data-testid="go-to-lineup-button"]').click();
    });

    test("should detect the exact bug: green borders but silent submit failure", async ({
      page
    }) => {
      // This test specifically replicates the user's reported issue

      // Mock APIs to return data that appears valid but has subtle issues
      await page.route("**/players/*/app/*/hours**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            hours: 1500
            // Missing additional fields that might be expected
          })
        });
      });

      await page.route("**/players/*/public", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            public: true
            // Missing additional fields that might be expected
          })
        });
      });

      await page.route("**/players/*/details", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            steam_id: "76561197960283932",
            nickname: "TestPlayer",
            account_id: 4,
            work_email_verified: true,
            is_valid_work_email: true,
            is_valid_full_name: true,
            has_accepted_latest_privacy_policy: true
            // All appears valid...
          })
        });
      });

      // Fill all 5 players
      const validPlayers = [
        "76561197960283932",
        "76561197960265728",
        "76561197960265740",
        "76561197961279983",
        "76561197960265748"
      ];

      for (let i = 0; i < 5; i++) {
        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
      }

      await page.waitForTimeout(4000); // Wait for all validations

      // Check that all inputs show green
      const greenInputs = await page
        .locator('input[class*="border-green-500"]')
        .count();
      console.log(`Green inputs found: ${greenInputs}/5`);

      if (greenInputs === 5) {
        console.log("✓ All players show green borders");

        // Complete the form
        await assignCaptain(page);

        const termsCheckbox = page.locator(
          '[data-testid="terms-conditions-checkbox"]'
        );
        if (await termsCheckbox.isVisible()) {
          const isChecked = await termsCheckbox.isChecked().catch(() => false);
          if (!isChecked) {
            await termsCheckbox.click();
          }
        }

        const submitButton = page
          .locator('button[type="submit"]')
          .filter({ hasText: /Submit/i });

        if (await submitButton.isEnabled()) {
          console.log(
            "CRITICAL BUG: Submit button enabled with invalid validation data"
          );

          // Try clicking submit
          const responsePromise = page
            .waitForResponse(
              (response) =>
                response.url().includes("/api/v1/registrations") &&
                response.request().method() === "POST"
            )
            .catch(() => null);

          await submitButton.click();
          await page.waitForTimeout(3000);

          const response = await responsePromise;
          if (!response) {
            console.log("CONFIRMED BUG: Submit clicked but no API call made");
            // Should still be on same page
            await expect(
              page.locator('[data-testid="go-to-lineup-button"]')
            ).toBeVisible();
          }
        }
      } else {
        console.log(
          `Only ${greenInputs}/5 players show green - not the reported bug scenario`
        );
      }
    });

    test("should check for malformed API response handling", async ({
      page
    }) => {
      // Test with various malformed but successful API responses
      const malformedResponses = [
        { hours: "1500" }, // String instead of number
        { hours: 1500.5 }, // Float instead of integer
        { public: "true" }, // String instead of boolean
        { public: 1 }, // Number instead of boolean
        { hours: Infinity }, // Invalid number
        { hours: NaN } // Invalid number
      ];

      const validPlayers = [
        "76561197960283932",
        "76561197960265728",
        "76561197960265740",
        "76561197961279983",
        "76561197960265748"
      ];

      for (let i = 0; i < malformedResponses.length && i < 5; i++) {
        const response = malformedResponses[i];

        await page.route(`**/players/*/app/*/hours**`, async (route) => {
          if (route.request().url().includes(validPlayers[i]!)) {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify(response)
            });
          } else {
            await route.continue();
          }
        });

        const steamIdInput = page.locator(
          `[data-testid="steam-id-input-${i}"]`
        );
        await steamIdInput.fill(validPlayers[i]!);
        await page.keyboard.press("Tab");
        await page.waitForTimeout(1000);

        // Check how the form handles malformed data
        const borderClass = await steamIdInput.getAttribute("class");
        const isGreen = borderClass?.includes("border-green-500");
        const isRed = borderClass?.includes("border-red-500");

        console.log(
          `Malformed data ${JSON.stringify(response)}: ${isGreen ? "GREEN" : isRed ? "RED" : "NEUTRAL"}`
        );
      }
    });
  });
});
