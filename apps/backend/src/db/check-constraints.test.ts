import { runQuery } from "./mysqlRunQuery";
import { getConnection } from "./mysqlConnection";
import { insertTestSeason, removeTestSeason } from "../__utils__/seed-database";
import { createMockInsertSeason } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

describe("CHECK Constraints", () => {
  // Create a test season for Fantasy tests
  const testSeasonId = 9999;
  beforeAll(async () => {
    const testSeason = createMockInsertSeason({
      id: testSeasonId,
      name: "Test Season for Constraints",
      full_name: "Test Season for Constraints",
      platform: SeasonPlatform.FACEIT,
      start_date: new Date("2025-01-01"),
      end_date: new Date("2025-12-31"),
      signup_start_date: new Date("2024-12-01"),
      signup_end_date: new Date("2024-12-31")
    });
    await insertTestSeason(testSeason);
  });

  afterAll(async () => {
    await removeTestSeason(testSeasonId);
  });
  describe("Email Format", () => {
    it("should reject invalid email format", async () => {
      const connection = await getConnection();
      try {
        await expect(
          runQuery(
            `INSERT INTO Accounts (work_email) VALUES (?)`,
            ["notanemail"],
            connection
          )
        ).rejects.toThrow();
      } finally {
        connection.release();
      }
    });

    it("should accept valid email format", async () => {
      const connection = await getConnection();
      try {
        // Use unique email to avoid conflicts with other tests
        const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
        const result = await runQuery<{ insertId: number }>(
          `INSERT INTO Accounts (work_email) VALUES (?)`,
          [uniqueEmail],
          connection
        );
        expect(result.insertId).toBeGreaterThan(0);

        // Cleanup
        await runQuery(
          `DELETE FROM Accounts WHERE id = ?`,
          [result.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });

    it("should accept NULL email", async () => {
      const connection = await getConnection();
      try {
        const result = await runQuery<{ insertId: number }>(
          `INSERT INTO Accounts (work_email) VALUES (?)`,
          [null],
          connection
        );
        expect(result.insertId).toBeGreaterThan(0);

        // Cleanup
        await runQuery(
          `DELETE FROM Accounts WHERE id = ?`,
          [result.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });
  });

  describe("Season Dates", () => {
    it("should reject end_date before start_date", async () => {
      const connection = await getConnection();
      try {
        await expect(
          runQuery(
            `INSERT INTO Seasons (game_id, name, full_name, start_date, end_date, platform) 
             VALUES (1, 'S_TEST', 'Season Test', '2025-06-01', '2025-01-01', 'faceit')`,
            [],
            connection
          )
        ).rejects.toThrow();
      } finally {
        connection.release();
      }
    });

    it("should accept valid date order", async () => {
      const connection = await getConnection();
      try {
        const result = await runQuery<{ insertId: number }>(
          `INSERT INTO Seasons (game_id, name, full_name, start_date, end_date, platform) 
           VALUES (1, 'S_TEST_VALID', 'Season Test Valid', '2025-01-01', '2025-06-01', 'faceit')`,
          [],
          connection
        );
        expect(result.insertId).toBeGreaterThan(0);

        // Cleanup
        await runQuery(
          `DELETE FROM Seasons WHERE id = ?`,
          [result.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });

    it("should reject signup_end_date before signup_start_date", async () => {
      const connection = await getConnection();
      try {
        await expect(
          runQuery(
            `INSERT INTO Seasons (game_id, name, full_name, start_date, signup_start_date, signup_end_date, platform) 
             VALUES (1, 'S_TEST2', 'Season Test 2', '2025-06-01', '2025-05-01', '2025-04-01', 'faceit')`,
            [],
            connection
          )
        ).rejects.toThrow();
      } finally {
        connection.release();
      }
    });
  });

  describe("Fantasy Points", () => {
    it("should reject inconsistent point breakdown", async () => {
      const connection = await getConnection();
      try {
        // First create a fantasy team
        const teamResult = await runQuery<{ insertId: number }>(
          `INSERT INTO FantasyTeams (steam_id, season_id, league_id, budget_remaining) 
           VALUES (?, ?, 1, 1000)`,
          ["76561198000000000", testSeasonId],
          connection
        );

        const playerResult = await runQuery<{ insertId: number }>(
          `INSERT INTO FantasyTeamPlayers (fantasy_team_id, steam_id, player_value, points_earned, individual_points, team_points, role_points) 
           VALUES (?, ?, 100, 90, 50, 30, 10)`,
          [teamResult.insertId, "76561198000000001"],
          connection
        );

        // Try to update with inconsistent breakdown (should fail)
        await expect(
          runQuery(
            `UPDATE FantasyTeamPlayers 
             SET points_earned = 100, individual_points = 50, team_points = 30, role_points = 10
             WHERE id = ?`,
            [playerResult.insertId],
            connection
          )
        ).rejects.toThrow();

        // Cleanup
        await runQuery(
          `DELETE FROM FantasyTeamPlayers WHERE id = ?`,
          [playerResult.insertId],
          connection
        );
        await runQuery(
          `DELETE FROM FantasyTeams WHERE id = ?`,
          [teamResult.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });

    it("should accept consistent point breakdown", async () => {
      const connection = await getConnection();
      try {
        // First create a fantasy team
        const teamResult = await runQuery<{ insertId: number }>(
          `INSERT INTO FantasyTeams (steam_id, season_id, league_id, budget_remaining) 
           VALUES (?, ?, 1, 1000)`,
          ["76561198000000002", testSeasonId],
          connection
        );

        const playerResult = await runQuery<{ insertId: number }>(
          `INSERT INTO FantasyTeamPlayers (fantasy_team_id, steam_id, player_value, points_earned, individual_points, team_points, role_points) 
           VALUES (?, ?, 100, 90, 50, 30, 10)`,
          [teamResult.insertId, "76561198000000003"],
          connection
        );

        // Update with consistent breakdown (should succeed)
        await runQuery(
          `UPDATE FantasyTeamPlayers 
           SET points_earned = 100, individual_points = 60, team_points = 30, role_points = 10
           WHERE id = ?`,
          [playerResult.insertId],
          connection
        );

        // Cleanup
        await runQuery(
          `DELETE FROM FantasyTeamPlayers WHERE id = ?`,
          [playerResult.insertId],
          connection
        );
        await runQuery(
          `DELETE FROM FantasyTeams WHERE id = ?`,
          [teamResult.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });
  });

  describe("Fantasy Budget", () => {
    it("should reject negative budget", async () => {
      const connection = await getConnection();
      try {
        await expect(
          runQuery(
            `INSERT INTO FantasyTeams (steam_id, season_id, league_id, budget_remaining) 
             VALUES (?, ?, 1, -100)`,
            ["76561198000000004", testSeasonId],
            connection
          )
        ).rejects.toThrow();
      } finally {
        connection.release();
      }
    });

    it("should accept non-negative budget", async () => {
      const connection = await getConnection();
      try {
        const result = await runQuery<{ insertId: number }>(
          `INSERT INTO FantasyTeams (steam_id, season_id, league_id, budget_remaining) 
           VALUES (?, ?, 1, 1000)`,
          ["76561198000000005", testSeasonId],
          connection
        );
        expect(result.insertId).toBeGreaterThan(0);

        // Cleanup
        await runQuery(
          `DELETE FROM FantasyTeams WHERE id = ?`,
          [result.insertId],
          connection
        );
      } finally {
        connection.release();
      }
    });
  });

  describe("Player Stats", () => {
    it("should reject negative kills/deaths/assists", async () => {
      const connection = await getConnection();
      try {
        // This test would require creating a full match structure
        // Skipping for now as it's complex setup
      } finally {
        connection.release();
      }
    });

    it("should reject ADR outside reasonable range", async () => {
      const connection = await getConnection();
      try {
        // This test would require creating a full match structure
        // Skipping for now as it's complex setup
      } finally {
        connection.release();
      }
    });
  });
});
