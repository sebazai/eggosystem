import mysql from "mysql2/promise";
import {
  type AccountPermissionScopes,
  type AccountRole
} from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

describe("Captain Permission Triggers", () => {
  let connection: PoolConnection;

  beforeAll(async () => {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "dev-pass",
      database: process.env.DB_NAME || "kanaliiga",
      port: parseInt(process.env.DB_PORT || "3306")
    });
    connection = await pool.getConnection();
  });

  afterAll(async () => {
    if (connection) connection.release();
  });

  beforeEach(async () => {
    // Clean up - order matters due to foreign key constraints
    await runQuery(
      "DELETE FROM AccountPermissionScopes WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM AccountRoles WHERE account_id IN (999, 998, 997)",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonTeamPlayers WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonPlayerRanks WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonPlayerApprovals WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonLeagueTeams WHERE season_id = 999",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonLeagues WHERE season_id = 999",
      [],
      connection
    );
    await runQuery("DELETE FROM Seasons WHERE id = 999", [], connection);
    await runQuery("DELETE FROM Teams WHERE id = 999", [], connection);
    await runQuery("DELETE FROM Games WHERE id = 999", [], connection);
    await runQuery(
      "DELETE FROM LinkedAccounts WHERE account_id IN (999, 998, 997)",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM Accounts WHERE id IN (999, 998, 997)",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SteamPlayers WHERE steam_id IN (76561198000000999, 76561198000000998, 76561198000000997)",
      [],
      connection
    );

    // Setup
    await runQuery(
      "INSERT INTO Games (id, name, abbreviation, app_id) VALUES (999, 'Counter-Strike 2', 'CS2', 730)",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date, platform) VALUES (999, 999, 'Test Season', 'Test Season Full Name', NOW(), NOW(), 'kanaliiga')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO Teams (id, name) VALUES (999, 'Test Team')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (999, 'test@example.com', 'Test User')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000999, 'TestPlayer1')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (999, 'steam', '76561198000000999')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (999, 999, 1, TRUE)",
      [],
      connection
    );
  });

  it("adds permissions/role when captain is added", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      [],
      connection
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      [],
      connection
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      [],
      connection
    );
    expect(perms.length).toBeGreaterThan(0);
    expect(roles.length).toBeGreaterThan(0);
  });

  it("removes permissions/role when captain status is revoked", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      [],
      connection
    );
    await runQuery(
      "UPDATE SeasonTeamRegistrationPlayers SET is_captain = 0 WHERE season_id = 999 AND team_id = 999 AND steam_id = 76561198000000999",
      [],
      connection
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      [],
      connection
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      [],
      connection
    );
    expect(perms.length).toBe(0);
    expect(roles.length).toBe(0);
  });

  it("removes permissions/role on cascade delete from SeasonTeamRegistrations", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      [],
      connection
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id = 999 AND team_id = 999",
      [],
      connection
    );
    const perms = await runQuery<Array<AccountPermissionScopes>>(
      "SELECT * FROM AccountPermissionScopes WHERE account_id = 999",
      [],
      connection
    );
    const roles = await runQuery<Array<AccountRole>>(
      "SELECT * FROM AccountRoles WHERE account_id = 999",
      [],
      connection
    );
    expect(perms.length).toBe(0);
    expect(roles.length).toBe(0);
  });

  it("prevents captain permissions for non-captains", async () => {
    const permId = await runQuery<Array<{ id: number }>>(
      "SELECT id FROM Permissions WHERE permission_name = 'edit-registration' LIMIT 1",
      [],
      connection
    );
    await expect(
      runQuery(
        "INSERT INTO AccountPermissionScopes (account_id, permission_id, season_id, team_id) VALUES (999, ?, 999, 999)",
        [permId[0].id],
        connection
      )
    ).rejects.toThrow();
  });

  it("prevents multiple captains per team/season", async () => {
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000999, 1, 0)",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO Accounts (id, work_email, full_name) VALUES (998, 'test2@example.com', 'Test User 2')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (76561198000000998, 'TestPlayer2')",
      [],
      connection
    );
    await runQuery(
      "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (998, 'steam', '76561198000000998')",
      [],
      connection
    );
    await expect(
      runQuery(
        "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (999, 999, 76561198000000998, 1, 0)",
        [],
        connection
      )
    ).rejects.toThrow();
  });
});
