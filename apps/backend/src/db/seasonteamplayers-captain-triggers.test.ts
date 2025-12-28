import {
  type AccountPermissionScopes,
  type AccountRole
} from "@eggosystem/types";
import { runQuery } from "./mysqlRunQuery";

describe("SeasonTeamPlayers Captain Role Triggers (Finalized Roster)", () => {
  beforeEach(async () => {
    // Clean up - order matters due to foreign key constraints
    await runQuery(
      "DELETE FROM AccountPermissionScopes WHERE season_id IN (999, 998)",
      []
    );
    await runQuery(
      "DELETE FROM AccountRoles WHERE account_id IN (999, 998, 997)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonTeamPlayers WHERE season_id IN (999, 998)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonPlayerRanks WHERE season_id IN (999, 998)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonLeagueTeams WHERE season_id IN (999, 998)",
      []
    );
    await runQuery(
      "DELETE FROM SeasonLeagues WHERE season_id IN (999, 998)",
      []
    );
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

    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (999, 1, 'Test Season', 'Test Season Full Name', NOW(), NOW(), 'kanaliiga')",
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
      "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (76561198000000999, 'TestPlayer1', 999)",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (999, 'steam', '76561198000000999')",
      []
    );
  });

  it("adds ONLY captain role (NO permissions) when captain is added to finalized roster", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );

    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );

    // Should have captain role but NO permissions (registration is closed)
    expect(roles.length).toBe(1);
    expect(perms.length).toBe(0);
  });

  it("adds captain role for co-captain in finalized roster", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 0, 1)",
      []
    );

    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );

    // Co-captains also get captain role
    expect(roles.length).toBe(1);
    expect(perms.length).toBe(0);
  });

  it("grants captain role when captain status is added via UPDATE", async () => {
    // Insert player without captain status
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 0, 0)",
      []
    );

    // Verify no role initially
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(0);

    // Update to make them captain
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 1 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify role was granted
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);
  });

  it("removes captain role when last captain assignment is removed", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );

    // Verify role exists
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);

    // Remove captain status
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 0 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify role was removed
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(0);
  });

  it("preserves captain role when player is captain for multiple teams", async () => {
    // Setup second season and team
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (998, 1, 'Test Season 2', 'Test Season 2 Full Name', NOW(), NOW(), 'kanaliiga')",
      []
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (998, 'Test Team 2')",
      []
    );

    // Make player captain for both teams in different seasons
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (998, 998, 76561198000000999, 'primary', 1, 0)",
      []
    );

    // Verify role exists
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);

    // Remove captain status from first team
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 0 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify role is PRESERVED (still captain of team 998 in season 998)
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);

    // Remove captain status from second team
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 0 WHERE season_id = 998 AND team_id = 998 AND steam_id = 76561198000000999",
      []
    );

    // NOW role should be removed
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(0);
  });

  it("removes captain role when player is deleted from finalized roster", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );

    // Verify role exists
    let roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);

    // Delete player
    await runQuery(
      "DELETE FROM SeasonTeamPlayers WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify role was removed
    roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(0);
  });

  it("preserves captain role when player is deleted from one team but remains captain elsewhere", async () => {
    // Setup second season and team
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (998, 1, 'Test Season 2', 'Test Season 2 Full Name', NOW(), NOW(), 'kanaliiga')",
      []
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (998, 'Test Team 2')",
      []
    );

    // Make player captain for both teams in different seasons
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (998, 998, 76561198000000999, 'primary', 1, 0)",
      []
    );

    // Delete from first team
    await runQuery(
      "DELETE FROM SeasonTeamPlayers WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );

    // Verify role is PRESERVED (still captain of team 998 in season 998)
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    expect(roles.length).toBe(1);
  });

  it("handles transfer of captain role between players", async () => {
    // Setup second player
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      []
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (76561198000000998, 'TestPlayer2', 998)",
      []
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      []
    );

    // Add both players to team
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 'primary', 0, 0)",
      []
    );

    // Verify first player has captain role
    let roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    let roles2 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 998",
      []
    );
    expect(roles1.length).toBe(1);
    expect(roles2.length).toBe(0);

    // Transfer captain role
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 0 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      []
    );
    await runQuery(
      "UPDATE SeasonTeamPlayers SET is_captain = 1 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000998",
      []
    );

    // Verify roles were transferred
    roles1 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );
    roles2 = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 998",
      []
    );
    expect(roles1.length).toBe(0);
    expect(roles2.length).toBe(1);
  });

  it("does not grant permissions to captains in finalized roster", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 0)",
      []
    );

    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      []
    );

    // Registration is closed - no permissions should be granted
    expect(perms.length).toBe(0);
  });

  it("works correctly when player is both captain and co-captain", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 'primary', 1, 1)",
      []
    );

    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      []
    );

    // Should have exactly one captain role (not duplicated)
    expect(roles.length).toBe(1);
  });
});
