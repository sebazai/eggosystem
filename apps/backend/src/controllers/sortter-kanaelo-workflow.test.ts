import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import { app } from "../app";
import { runQuery } from "../db/mysqlRunQuery";
import { generateTestJWT } from "../utils/auth-test-utils";

// Type definitions for database query results
interface RankData {
  steam_id: string;
  kana_elo: number | null;
  cs2_rank: number | null;
  faceit_level: number | null;
}

interface UpdatedRank {
  steam_id: string;
  kana_elo: number | null;
}

interface SeasonLeague {
  id: number;
  season_id: number;
  name: string;
  division: number;
}

interface Placement {
  team_id: number;
  team_name: string;
  original_avg: number | null;
  division: number;
  comments: string;
}

// Mock JWT configuration for tests
jest.mock("../configs/jwt-keys", () => ({
  getJWTValues: jest.fn(() => ({
    JWT_PRIVATE_KEY: "mock-private-key",
    JWT_PUBLIC_KEY: "mock-public-key",
    JWT_REFRESH_PRIVATE_KEY: "mock-refresh-private-key",
    JWT_REFRESH_PUBLIC_KEY: "mock-refresh-public-key",
    JWT_EXPIRES_IN: 1200,
    JWT_REFRESH_EXPIRES_IN: 604800
  }))
}));

// Mock jsonwebtoken to return test tokens
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn((payload, secret, _options) => {
    if (secret === "mock-refresh-private-key") {
      return "mock-refresh-token";
    }
    return "mock-access-token";
  })
}));

// Mock express-jwt middleware to recognize our test token
jest.mock("express-jwt", () => ({
  expressjwt: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.split(" ")[1];

      // Recognize our mock-access-token as valid
      if (token === "mock-access-token") {
        req.auth = {
          account_id: 15004,
          provider_id: "66561198999999902",
          provider: "steam",
          permissions: ["admin:all"],
          roles: ["admin"],
          nickname: "heppajpg"
        };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  )
}));

// Mock auth middleware
jest.mock("../middlewares/auth.middleware", () => ({
  authenticateJWT: jest.fn(
    (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const token = authHeader.split(" ")[1];
      if (token === "mock-access-token") {
        req.auth = {
          account_id: 15004,
          provider_id: "66561198999999902",
          provider: "steam",
          permissions: ["admin:all"],
          roles: ["admin"],
          nickname: "heppajpg"
        };
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  ),
  checkJWTPermissions: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      // Allow admin role through
      if (req.auth && req.auth.roles && req.auth.roles.includes("admin")) {
        next();
      } else {
        res
          .status(403)
          .json({ error: { message: "Forbidden: Insufficient permissions" } });
      }
    }
  ),
  checkPermissions: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      // Allow admin role through
      if (req.auth && req.auth.roles && req.auth.roles.includes("admin")) {
        next();
      } else {
        res
          .status(403)
          .json({ error: { message: "Forbidden: Insufficient permissions" } });
      }
    }
  )
}));

describe("Sortter Kanaelo Workflow Issue", () => {
  const testSeasonId = 8888;
  const testSeasonIdWithStaleData = 8889;
  const testTeamId1 = 8881;
  const testTeamId2 = 8882;
  const testTeamId3 = 8883; // For stale data scenario
  const testTeamId4 = 8884; // For stale data scenario
  const testSteamId1 = "76561198000008881";
  const testSteamId2 = "76561198000008882";
  const testSteamId3 = "76561198000008883";
  const testSteamId4 = "76561198000008884";
  const testSteamId5 = "76561198000008885"; // Additional players to meet team requirements
  const testSteamId6 = "76561198000008886";
  const testSteamId7 = "76561198000008887"; // Need more players for proper avg4 calculation
  const testSteamId8 = "76561198000008888";

  beforeAll(async () => {
    // Clean up test data for both scenarios
    await runQuery("DELETE FROM SeasonPlayerRanks WHERE season_id IN (?, ?)", [
      testSeasonId,
      testSeasonIdWithStaleData
    ]);
    await runQuery("DELETE FROM SeasonTeamPlayers WHERE season_id IN (?, ?)", [
      testSeasonId,
      testSeasonIdWithStaleData
    ]);
    await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id IN (?, ?)", [
      testSeasonId,
      testSeasonIdWithStaleData
    ]);
    await runQuery("DELETE FROM SeasonLeagues WHERE season_id IN (?, ?)", [
      testSeasonId,
      testSeasonIdWithStaleData
    ]);
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id IN (?, ?)",
      [testSeasonId, testSeasonIdWithStaleData]
    );
    await runQuery(
      "DELETE FROM SeasonTeamRegistrations WHERE season_id IN (?, ?)",
      [testSeasonId, testSeasonIdWithStaleData]
    );
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?, ?, ?)", [
      testTeamId1,
      testTeamId2,
      testTeamId3,
      testTeamId4
    ]);
    await runQuery(
      "DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        testSteamId1,
        testSteamId2,
        testSteamId3,
        testSteamId4,
        testSteamId5,
        testSteamId6,
        testSteamId7,
        testSteamId8
      ]
    );
    await runQuery("DELETE FROM Seasons WHERE id IN (?, ?)", [
      testSeasonId,
      testSeasonIdWithStaleData
    ]);

    // Create test seasons
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, platform) VALUES (?, 1, 'Test Kanaelo Season', 'Test Kanaelo Season Full', '2024-01-01', 'kanaliiga')",
      [testSeasonId]
    );
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, platform) VALUES (?, 1, 'Test Stale Kanaelo Season', 'Test Stale Kanaelo Season Full', '2024-01-01', 'kanaliiga')",
      [testSeasonIdWithStaleData]
    );

    // Create test teams for both scenarios
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team Without Kanaelo 1')",
      [testTeamId1]
    );
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team Without Kanaelo 2')",
      [testTeamId2]
    );
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team With Stale Kanaelo 1')",
      [testTeamId3]
    );
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team With Stale Kanaelo 2')",
      [testTeamId4]
    );

    // Create test players - need enough for proper team compositions
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team1-1')",
      [testSteamId1]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team1-2')",
      [testSteamId2]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team1-3')",
      [testSteamId3]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team1-4')",
      [testSteamId4]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team2-1')",
      [testSteamId5]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team2-2')",
      [testSteamId6]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team2-3')",
      [testSteamId7]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player Team2-4')",
      [testSteamId8]
    );

    // Create APPROVED team registrations
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, 1)",
      [testSeasonId, testTeamId1]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, 1)",
      [testSeasonId, testTeamId2]
    );

    // Create team registration players - 4 per team for proper avg4 calculation
    // Team 1 players
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId1, testSteamId1]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId1, testSteamId2]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId1, testSteamId3]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId1, testSteamId4]
    );

    // Team 2 players
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId2, testSteamId5]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId2, testSteamId6]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId2, testSteamId7]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId2, testSteamId8]
    );

    // Create SeasonPlayerRanks entries with populated rank data but NULL kana_elo values
    // This simulates the REAL scenario: ranks exist but kanaelo hasn't been calculated yet
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 15, 7, 2100, 1500, 1.2)",
      [testSteamId1, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 12, 6, 1800, 1200, 1.1)",
      [testSteamId2, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 18, 8, 2300, 1800, 1.4)",
      [testSteamId3, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 10, 5, 1600, 900, 0.9)",
      [testSteamId4, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 14, 7, 1900, 1400, 1.0)",
      [testSteamId5, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 16, 8, 2200, 1600, 1.3)",
      [testSteamId6, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 11, 6, 1700, 1100, 1.0)",
      [testSteamId7, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours, faceit_kd) VALUES (?, ?, NULL, 13, 7, 2000, 1300, 1.1)",
      [testSteamId8, testSeasonId]
    );

    // This matches the user's actual problem:
    // - SeasonPlayerRanks entries exist with cs2_rank, faceit_level etc. ✓
    // - But kana_elo values are NULL (not calculated yet) ✓
    // - getTeamValuesForSorter() will return teams but with NULL avg4/top5_sum values
    // - System should NOT auto-generate placements when ANY player has NULL kana_elo ❌
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery("DELETE FROM SeasonPlayerRanks WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery("DELETE FROM SeasonTeamPlayers WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery("DELETE FROM SeasonLeagues WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery(
      "DELETE FROM SeasonTeamRegistrationPlayers WHERE season_id = ?",
      [testSeasonId]
    );
    await runQuery("DELETE FROM SeasonTeamRegistrations WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
      testTeamId1,
      testTeamId2
    ]);
    await runQuery(
      "DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        testSteamId1,
        testSteamId2,
        testSteamId3,
        testSteamId4,
        testSteamId5,
        testSteamId6,
        testSteamId7,
        testSteamId8
      ]
    );
    await runQuery("DELETE FROM Seasons WHERE id = ?", [testSeasonId]);
  });

  it("should NOT auto-generate placements when kana_elo values are NULL (reproduces user issue)", async () => {
    const adminJWT = generateTestJWT();

    // Try to get placements - this test reproduces the actual user problem
    // SeasonPlayerRanks exist but with NULL kana_elo values
    // The system should NOT auto-generate placements in this state
    const response = await request(app)
      .get(
        `/api/v1/sortter/season/${testSeasonId}/placements?teams_per_division=12`
      )
      .set("Authorization", `Bearer ${adminJWT}`);

    // AFTER FIX: This test should now pass - the system correctly rejects auto-generation

    // The system should now return 400 Bad Request when kana_elo data is missing
    expect(response.status).toBe(400);
    expect(response.body.type).toBe("about:blank");
    expect(response.body.title).toBe("Bad Request");
    expect(response.body.detail).toMatch(
      /kana_elo.*not.*calculated|missing.*kana_elo.*data/i
    );

    // Verify that NO placements were auto-generated
    expect(response.body).not.toHaveProperty("placements");
  });

  it("should reject placements when kana_elo values are NULL (confirmed fix)", async () => {
    const adminJWT = generateTestJWT();

    // This test confirms the fix is working correctly
    const response = await request(app)
      .get(
        `/api/v1/sortter/season/${testSeasonId}/placements?teams_per_division=12`
      )
      .set("Authorization", `Bearer ${adminJWT}`)
      .expect(400);

    // After fix, system should return 400 with proper error message
    expect(response.body.title).toBe("Bad Request");
    expect(response.body.detail).toMatch(
      /kana_elo.*not.*calculated|Cannot.*generate.*placements/i
    );

    // Should not have generated any placements
    expect(response.body).not.toHaveProperty("placements");
  });

  it("should verify test setup: approved teams with NULL kana_elo values", async () => {
    // Verify our test setup is correct - teams should exist and be approved
    const approvedTeams = await runQuery(
      "SELECT * FROM SeasonTeamRegistrations WHERE season_id = ? AND approved = 1",
      [testSeasonId]
    );
    expect(approvedTeams).toHaveLength(2);

    // Players should exist in team registrations
    const players = await runQuery(
      "SELECT * FROM SeasonTeamRegistrationPlayers WHERE season_id = ?",
      [testSeasonId]
    );
    expect(players).toHaveLength(8);

    // SeasonPlayerRanks entries should exist but with NULL kana_elo values
    const ranksData = (await runQuery(
      "SELECT steam_id, kana_elo, cs2_rank, faceit_level FROM SeasonPlayerRanks WHERE season_id = ?",
      [testSeasonId]
    )) as RankData[];
    expect(ranksData).toHaveLength(8); // Entries exist

    // All kana_elo values should be NULL
    ranksData.forEach((rank: RankData) => {
      expect(rank.kana_elo).toBeNull(); // This is the key - kana_elo is NULL
      expect(rank.cs2_rank).not.toBeNull(); // But other rank data exists
    });

    // This confirms our test scenario matches the user's REAL situation:
    // - Teams are approved ✓
    // - Players are registered ✓
    // - SeasonPlayerRanks exist with rank data ✓
    // - But kana_elo values are NULL (not calculated yet) ✓
  });

  describe("Complete Sortter Workflow Integration", () => {
    it("should complete the full sortter workflow: populate kanaelo → get placements → save comments → finalize", async () => {
      const adminJWT = generateTestJWT();

      // STEP 1: Populate kana_elo values (simulate kanaelo calculation completion)
      // Team 1 players - decreasing kana_elo values
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1600 WHERE steam_id = ? AND season_id = ?",
        [testSteamId1, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1500 WHERE steam_id = ? AND season_id = ?",
        [testSteamId2, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1400 WHERE steam_id = ? AND season_id = ?",
        [testSteamId3, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1300 WHERE steam_id = ? AND season_id = ?",
        [testSteamId4, testSeasonId]
      );

      // Team 2 players - slightly different values
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1550 WHERE steam_id = ? AND season_id = ?",
        [testSteamId5, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1450 WHERE steam_id = ? AND season_id = ?",
        [testSteamId6, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1350 WHERE steam_id = ? AND season_id = ?",
        [testSteamId7, testSeasonId]
      );
      await runQuery(
        "UPDATE SeasonPlayerRanks SET kana_elo = 1250 WHERE steam_id = ? AND season_id = ?",
        [testSteamId8, testSeasonId]
      );

      // Verify kana_elo values are now populated
      const updatedRanks = (await runQuery(
        "SELECT steam_id, kana_elo FROM SeasonPlayerRanks WHERE season_id = ? ORDER BY steam_id",
        [testSeasonId]
      )) as UpdatedRank[];
      expect(updatedRanks).toHaveLength(8);
      updatedRanks.forEach((rank: UpdatedRank) => {
        expect(rank.kana_elo).not.toBeNull();
        expect(typeof rank.kana_elo).toBe("number");
      });

      // STEP 2: Get placements (should now work with valid kana_elo)
      const placementsResponse = await request(app)
        .get(
          `/api/v1/sortter/season/${testSeasonId}/placements?teams_per_division=12`
        )
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(placementsResponse.body).toHaveProperty("placements");
      expect(placementsResponse.body.placements).toHaveLength(2);
      expect(placementsResponse.body.isFinalized).toBe(false);

      // Verify placements have valid avg4 values (not null)
      placementsResponse.body.placements.forEach((placement: Placement) => {
        expect(placement.original_avg).not.toBeNull();
        expect(typeof placement.original_avg).toBe("number");
        expect(placement.team_id).toBeGreaterThan(0);
      });

      // STEP 3: Add comments and save preliminary placements
      const modifiedPlacements = placementsResponse.body.placements.map(
        (p: Placement, index: number) => ({
          ...p,
          comments: `Test comment for team ${p.team_name} - placement ${index + 1}`,
          division: index === 0 ? 1 : 2 // Put teams in different divisions
        })
      );

      const saveResponse = await request(app)
        .post(`/api/v1/sortter/season/${testSeasonId}/placements`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send({ placements: modifiedPlacements })
        .expect(200);

      expect(saveResponse.body.message).toBe(
        "Preliminary placements saved successfully"
      );

      // STEP 4: Verify saved placements have comments
      const savedPlacementsResponse = await request(app)
        .get(
          `/api/v1/sortter/season/${testSeasonId}/placements?teams_per_division=12`
        )
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(savedPlacementsResponse.body.placements).toHaveLength(2);
      savedPlacementsResponse.body.placements.forEach(
        (placement: Placement) => {
          expect(placement.comments).toContain("Test comment");
          expect(placement.division).toBeGreaterThan(0);
        }
      );

      // STEP 5: Finalize placements
      const finalizeResponse = await request(app)
        .post(`/api/v1/sortter/season/${testSeasonId}/finalize`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(finalizeResponse.body.message).toBe(
        "Team placements and players finalized successfully"
      );
      expect(finalizeResponse.body.season_id).toBe(testSeasonId);
      expect(finalizeResponse.body.teams_updated).toBe(2);
      expect(finalizeResponse.body.players_copied).toBe(8);

      // STEP 6: Verify database entries were created

      // Check SeasonLeagues
      const seasonLeagues = (await runQuery(
        "SELECT * FROM SeasonLeagues WHERE season_id = ?",
        [testSeasonId]
      )) as SeasonLeague[];
      expect(seasonLeagues.length).toBeGreaterThan(0);

      // Check SeasonLeagueTeams
      const seasonLeagueTeams = await runQuery(
        "SELECT * FROM SeasonLeagueTeams WHERE season_id = ?",
        [testSeasonId]
      );
      expect(seasonLeagueTeams).toHaveLength(2);

      // Check SeasonTeamPlayers
      const seasonTeamPlayers = await runQuery(
        "SELECT * FROM SeasonTeamPlayers WHERE season_id = ?",
        [testSeasonId]
      );
      expect(seasonTeamPlayers).toHaveLength(8);

      // STEP 7: Verify placements are now marked as finalized
      const finalizedStatusResponse = await request(app)
        .get(
          `/api/v1/sortter/season/${testSeasonId}/placements?teams_per_division=12`
        )
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(finalizedStatusResponse.body.isFinalized).toBe(true);

      // STEP 8: Verify cannot save placements after finalization
      const lockedSaveResponse = await request(app)
        .post(`/api/v1/sortter/season/${testSeasonId}/placements`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send({ placements: modifiedPlacements })
        .expect(403);

      expect(lockedSaveResponse.body.detail).toBe(
        "Placements have been finalized and cannot be modified"
      );
    });
  });
});
