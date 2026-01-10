import { runQuery } from "../db/mysqlRunQuery";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "./auth.services";

describe("Auth Services - Permission System", () => {
  const TEST_ACCOUNT_ID = 99990;
  const TEST_STEAM_ID = "76561198000099990";
  const TEST_SEASON_ID = 99990;
  const TEST_TEAM_ID = 99990;
  const TEST_TEAM_ID_2 = 99991;

  beforeEach(async () => {
    // Clean up test data (including second team)
    await runQuery("DELETE FROM AccountPermissionScopes WHERE account_id = ?", [
      TEST_ACCOUNT_ID
    ]);
    await runQuery("DELETE FROM AccountRoles WHERE account_id = ?", [
      TEST_ACCOUNT_ID
    ]);
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = ?",
      [TEST_SEASON_ID]
    );
    await runQuery("DELETE FROM SeasonTeamRegistrations WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM LinkedAccounts WHERE provider_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM Accounts WHERE id = ?", [TEST_ACCOUNT_ID]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
      TEST_TEAM_ID,
      TEST_TEAM_ID_2
    ]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [TEST_SEASON_ID]);

    // Create test data
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (?, ?, ?)",
      [TEST_ACCOUNT_ID, "test-permission@example.com", "Test Permission User"]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, ?)",
      [TEST_STEAM_ID, "TestPermissionPlayer"]
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (?, 'steam', ?)",
      [TEST_ACCOUNT_ID, TEST_STEAM_ID]
    );
    await runQuery("INSERT INTO Teams (id, name) VALUES (?, ?)", [
      TEST_TEAM_ID,
      "Test Permission Team"
    ]);
    await runQuery(
      `INSERT INTO Seasons (id, name, full_name, signup_start_date, signup_end_date, start_date, end_date, game_id, organizer_id, game_type_id, platform)
       VALUES (?, 'Test Permission Season', 'Test Permission Season Full', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 31 DAY), DATE_ADD(NOW(), INTERVAL 90 DAY), 1, 1, NULL, 'faceit')`,
      [TEST_SEASON_ID]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, TRUE)",
      [TEST_SEASON_ID, TEST_TEAM_ID]
    );
  });

  afterEach(async () => {
    // Clean up test data (including second team)
    await runQuery("DELETE FROM AccountPermissionScopes WHERE account_id = ?", [
      TEST_ACCOUNT_ID
    ]);
    await runQuery("DELETE FROM AccountRoles WHERE account_id = ?", [
      TEST_ACCOUNT_ID
    ]);
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = ?",
      [TEST_SEASON_ID]
    );
    await runQuery("DELETE FROM SeasonTeamRegistrations WHERE season_id = ?", [
      TEST_SEASON_ID
    ]);
    await runQuery("DELETE FROM LinkedAccounts WHERE provider_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM Accounts WHERE id = ?", [TEST_ACCOUNT_ID]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
      TEST_TEAM_ID,
      TEST_TEAM_ID_2
    ]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [TEST_SEASON_ID]);
  });

  describe("getPermissionsForAccountId", () => {
    it("should return permissions from AccountPermissionScopes without requiring captain role", async () => {
      // Insert captain into SeasonTeamRegistrationPlayers
      // This triggers the database trigger that adds AccountPermissionScope (but NOT captain role)
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID, TEST_STEAM_ID]
      );

      // Get permissions
      const permissions = await getPermissionsForAccountId(TEST_ACCOUNT_ID);

      // Should have the permission in the format: captain:edit-registration:season-X:team-Y
      expect(permissions).toContain(
        `captain:edit-registration:season-${TEST_SEASON_ID}:team-${TEST_TEAM_ID}`
      );
    });

    it("should not have captain role when only AccountPermissionScope exists", async () => {
      // Insert captain into SeasonTeamRegistrationPlayers
      // This triggers the database trigger that adds AccountPermissionScope (but NOT captain role per new architecture)
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID, TEST_STEAM_ID]
      );

      // Get roles
      const roles = await getRolesForAccountId(TEST_ACCOUNT_ID);

      // Should NOT have captain role (per new architecture - only AccountPermissionScope is granted)
      expect(roles).not.toContain("captain");
      expect(roles).toHaveLength(0);
    });

    it("should add permission when captain is added via trigger", async () => {
      // Insert captain into SeasonTeamRegistrationPlayers
      // This should trigger the database trigger that adds AccountPermissionScope
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID, TEST_STEAM_ID]
      );

      // Get permissions
      const permissions = await getPermissionsForAccountId(TEST_ACCOUNT_ID);

      // Should have the permission
      expect(permissions).toContain(
        `captain:edit-registration:season-${TEST_SEASON_ID}:team-${TEST_TEAM_ID}`
      );
    });

    it("should NOT add captain role when captain is added via trigger", async () => {
      // Insert captain into SeasonTeamRegistrationPlayers
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID, TEST_STEAM_ID]
      );

      // Get roles
      const roles = await getRolesForAccountId(TEST_ACCOUNT_ID);

      // Should NOT have captain role (per new architecture)
      expect(roles).not.toContain("captain");
    });

    it("should return empty permissions for account without any permissions", async () => {
      const permissions = await getPermissionsForAccountId(TEST_ACCOUNT_ID);
      expect(permissions).toEqual([]);
    });

    it("should handle multiple AccountPermissionScopes for same account", async () => {
      await runQuery("INSERT INTO Teams (id, name) VALUES (?, ?)", [
        TEST_TEAM_ID_2,
        "Test Permission Team 2"
      ]);
      await runQuery(
        "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, TRUE)",
        [TEST_SEASON_ID, TEST_TEAM_ID_2]
      );

      // Add captain for team 1
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID, TEST_STEAM_ID]
      );

      // Add captain for team 2 (same steam_id/account)
      await runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 1, 0)",
        [TEST_SEASON_ID, TEST_TEAM_ID_2, TEST_STEAM_ID]
      );

      const permissions = await getPermissionsForAccountId(TEST_ACCOUNT_ID);

      // Should have permissions for both teams
      expect(permissions).toContain(
        `captain:edit-registration:season-${TEST_SEASON_ID}:team-${TEST_TEAM_ID}`
      );
      expect(permissions).toContain(
        `captain:edit-registration:season-${TEST_SEASON_ID}:team-${TEST_TEAM_ID_2}`
      );
    });
  });
});
