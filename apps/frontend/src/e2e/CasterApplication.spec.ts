import { expect, test } from "@playwright/test";
import { generateTestJWTForUser } from "./utils";
import { heppajpgSteamId } from "@eggosystem/types";

/**
 * E2E tests for caster application flow.
 * - Admin can access dashboard caster-applications page.
 * - Profile shows caster-related section (Caster Settings or Caster application).
 */
test.describe("Caster Application", () => {
  test("dashboard caster-applications page loads for admin", async ({
    page,
    context
  }) => {
    const token = generateTestJWTForUser(15004, heppajpgSteamId, "heppajpg");
    await context.addCookies([
      {
        name: "access_token",
        value: token,
        url: "http://localhost:3000",
        path: "/"
      }
    ]);

    await page.goto("/dashboard/caster-applications");

    await expect(
      page.getByRole("heading", { name: /caster applications/i, level: 1 })
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/review and approve or reject caster applications/i)
    ).toBeVisible();
  });

  test("profile page shows caster-related content when logged in", async ({
    page,
    context
  }) => {
    const token = generateTestJWTForUser(15004, heppajpgSteamId, "heppajpg", [
      "admin",
      "caster"
    ]);
    await context.addCookies([
      {
        name: "access_token",
        value: token,
        url: "http://localhost:3000",
        path: "/"
      }
    ]);

    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /user profile/i })
    ).toBeVisible({
      timeout: 10000
    });

    await expect(
      page
        .getByText(/caster settings|default stream url|caster application/i)
        .first()
    ).toBeVisible();
  });
});
