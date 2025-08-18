import {
  type AccountPermissionScopes,
  type AccountRole
} from "@eggosystem/types";
import { runQuery } from "./mysqlRunQuery";

describe("Captain Permission Triggers", () => {
  beforeEach(async () => {
    // Clean up - order matters due to foreign key constraints
    await runQuery(
      "DELETE FROM AccountPermissionScopes WHERE season_id = 999",
      []
    );
    await runQuery(
      "DELETE FROM AccountRoles WHERE account_id IN (999, 998, 997)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id IN (999, 998)",
      []
    );
    await runQuery("DELETE FROM SeasonTeamPlayers WHERE season_id = 999", []);
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id IN (999, 998)",
      []
    );
    await runQuery("DELETE FROM SeasonPlayerRanks WHERE season_id = 999", []);
    await runQuery(
      "DELETE FROM SeasonPlayerApprovals WHERE season_id = 999",
      []
    );
    await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id = 999", []);
    await runQuery("DELETE FROM SeasonLeagues WHERE season_id = 999", []);
    await runQuery("DELETE FROM Seasons WHERE id IN (999, 998)", []);
    await runQuery("DELETE FROM Teams WHERE id IN (999, 998)", []);
    await runQuery("DELETE FROM Games WHERE id IN (999, 998)", []);
    await runQuery(
      "DELETE FROM LinkedAccounts WHERE account_id IN (999, 998, 997)",
      []
    );
    await runQuery("DELETE FROM Accounts WHERE id IN (999, 998, 997)", []);
    await runQuery(
      "DELETE FROM SteamPlayers WHERE steam_id IN (76561198000000999, 76561198000000998, 76561198000000997)",
      []
    );

    // Setup
    await runQuery(
      "INSERT INTO Games (id, name, abbreviation, app_id) VALUES (999, 'Counter-Strike 2', 'CS2', 730)",
      []
    );
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (999, 999, 'Test Season', 'Test Season Full Name', NOW(), NOW(), 'kanaliiga')",
      []
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (999, 'Test Team')",
      []
    );
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (999, 'test@example.com', 'Test User')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000999, 'TestPlayer1')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (999, 'steam', '76561198000000999')",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (999, 999, 1, TRUE)",
      []
    );
  });

  it("adds permissions/role when captain is added", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);
  });

  it("removes permissions/role when captain status is revoked", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 0 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBe(0);
    expect(roles.length).toBe(0);
  });

  it("removes permissions/role on cascade delete from SeasonTeamRegistrations", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = 999 AND team_id = 999",
      []
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBe(0);
    expect(roles.length).toBe(0);
  });

  it("prevents captain permissions for non-captains", async () => {
    const permId = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1",
      []
    );
    await expect(
      runQuery(
        "INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id) VALUES (999, ?, 999, 999)",
        [permId[0].id]
      )
    ).rejects.toThrow();
  });

  it("prevents multiple captains per team/season", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );
    await expect(
      runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 1, 0)",
        []
      )
    ).rejects.toThrow();
  });

  it("deletes SeasonTeamRegistrationPlayers and captain permissions when SeasonTeamRegistration is deleted", async () => {
    // Setup: Add captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );

    // Verify captain permissions exist
    let perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);

    // Delete the registration
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = 999 AND team_id = 999",
      []
    );

    // Verify captain permissions are removed
    perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBe(0);
    expect(roles.length).toBe(0);

    // Verify SeasonTeamRegistrationPlayers are also deleted
    const players = await runQuery<
      Array<{ season_id: number; team_id: number; steam_id: number }>
    >(
      "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = 999 AND team_id = 999",
      []
    );
    expect(players.length).toBe(0);
  });

  it("transfers captain permissions when captain changes within same team", async () => {
    // Setup: Add second player
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 0, 0)",
      []
    );

    // Add first captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );

    // Verify first player has captain permissions
    let perms1 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    let roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms1.length).toBeGreaterThan(0);
    expect(roles1.length).toBeGreaterThan(0);

    // Change captain to second player
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 0 WHERE steam_id = 76561198000000999 AND season_id = 999 AND team_id = 999",
      []
    );
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 1 WHERE steam_id = 76561198000000998 AND season_id = 999 AND team_id = 999",
      []
    );

    // Verify first player lost captain permissions
    perms1 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms1.length).toBe(0);
    expect(roles1.length).toBe(0);

    // Verify second player gained captain permissions
    const perms2 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 998",
      []
    );
    const roles2 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 998",
      []
    );
    expect(perms2.length).toBeGreaterThan(0);
    expect(roles2.length).toBeGreaterThan(0);
  });

  it("transfers co-captain permissions when co-captain changes within same team", async () => {
    // Setup: Add second player
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 0, 0)",
      []
    );

    // Add first co-captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 0, 1)",
      []
    );

    // Verify first player has co-captain permissions
    let perms1 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    let roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms1.length).toBeGreaterThan(0);
    expect(roles1.length).toBeGreaterThan(0);

    // Change co-captain to second player
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_co_captain = 0 WHERE steam_id = 76561198000000999 AND season_id = 999 AND team_id = 999",
      []
    );
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_co_captain = 1 WHERE steam_id = 76561198000000998 AND season_id = 999 AND team_id = 999",
      []
    );

    // Verify first player lost co-captain permissions
    perms1 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms1.length).toBe(0);
    expect(roles1.length).toBe(0);

    // Verify second player gained co-captain permissions
    const perms2 = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 998",
      []
    );
    const roles2 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 998",
      []
    );
    expect(perms2.length).toBeGreaterThan(0);
    expect(roles2.length).toBeGreaterThan(0);
  });

  it("preserves captain permissions for other seasons/teams when captain changes in one team", async () => {
    // Setup: Create second season and team
    await runQuery(
      "INSERT INTO Games (id, name, abbreviation, app_id) VALUES (998, 'Counter-Strike 2', 'CS2', 730)",
      []
    );
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (998, 998, 'Test Season 2', 'Test Season 2 Full Name', NOW(), NOW(), 'kanaliiga')",
      []
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (998, 'Test Team 2')",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (998, 998, 1, TRUE)",
      []
    );

    // Add second player for second team
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );

    // Make player captain in both teams
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (998, 998, 76561198000000999, 1, 0)",
      []
    );

    // Verify player has permissions for both teams
    let perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);

    // Change captain in first team only
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 0 WHERE steam_id = 76561198000000999 AND season_id = 999 AND team_id = 999",
      []
    );
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 1 WHERE steam_id = 76561198000000998 AND season_id = 999 AND team_id = 999",
      []
    );

    // Verify player still has permissions for second team
    perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999 AND season_id = 998 AND team_id = 998",
      []
    );
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);

    // Verify player lost permissions for first team
    const firstTeamPerms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999 AND season_id = 999 AND team_id = 999",
      []
    );
    expect(firstTeamPerms.length).toBe(0);
  });

  it("prevents non-captain/co-captain from having captain permissions", async () => {
    // Add player without captain status
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 0, 0)",
      []
    );

    // Try to manually add captain permissions
    const permId = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1",
      []
    );

    await expect(
      runQuery(
        "INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id) VALUES (999, ?, 999, 999)",
        [permId[0].id]
      )
    ).rejects.toThrow();
  });

  it("allows captain to have both captain and co-captain permissions", async () => {
    // Add player as both captain and co-captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 1)",
      []
    );

    // Verify player has permissions
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);
  });

  it("handles player removal from team correctly", async () => {
    // Add player as captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      []
    );

    // Verify permissions exist
    let perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    expect(perms.length).toBeGreaterThan(0);

    // Remove player from team
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify permissions are removed
    perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );
    expect(perms.length).toBe(0);
  });

  it("prevents multiple co-captains per team/season", async () => {
    // Add first co-captain
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 0, 1)",
      []
    );

    // Try to add second co-captain
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );

    await expect(
      runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 0, 1)",
        []
      )
    ).rejects.toThrow();
  });
});
