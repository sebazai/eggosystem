import request from "supertest";
import type { Request, Response, NextFunction } from "express";
import { app } from "../app";
import { runQuery } from "../db/mysqlRunQuery";
import { generateTestJWT } from "../utils/auth-test-utils";
import IORedis from "ioredis";

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

// Mock validate numeric params middleware
jest.mock("../middlewares/validate-numeric-params", () => ({
  validateNumericParams: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => {
      // Just pass through for tests
      next();
    }
  )
}));

// Mock CORS middleware
jest.mock("../middlewares/cors.middleware", () => ({
  corsMiddleware: jest.fn((req: Request, res: Response, next: NextFunction) => {
    // Just pass through for tests
    next();
  })
}));

describe("Enhanced Finalize Team Placements", () => {
  const testSeasonId = 9999;
  const testTeamId1 = 9991;
  const testTeamId2 = 9992;
  const testSteamId1 = "76561198000000991";
  const testSteamId2 = "76561198000000992";
  const testSteamId3 = "76561198000000993";
  const testSteamId4 = "76561198000000994";

  beforeAll(async () => {
    // Clean up test data
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
      "DELETE FROM LinkedAccounts WHERE provider = 'steam' AND provider_id IN (?, ?, ?, ?)",
      [testSteamId1, testSteamId2, testSteamId3, testSteamId4]
    );
    await runQuery("DELETE FROM Accounts WHERE id IN (9001, 9002, 9003, 9004)");
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?)", [
      testSteamId1,
      testSteamId2,
      testSteamId3,
      testSteamId4
    ]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [testSeasonId]);

    // Create test season
    await runQuery(
      "INSERT INTO Seasons (id, game_id, name, full_name, start_date, platform) VALUES (?, 1, 'Test Season', 'Test Season Full', '2024-01-01', 'kanaliiga')",
      [testSeasonId]
    );

    // Create test teams
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team 1')",
      [testTeamId1]
    );
    await runQuery(
      "INSERT INTO Teams (id, organization_id, name) VALUES (?, 1, 'Test Team 2')",
      [testTeamId2]
    );

    // Create test players
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player1')",
      [testSteamId1]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player2')",
      [testSteamId2]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player3')",
      [testSteamId3]
    );
    await runQuery(
      "INSERT INTO SteamPlayers (steam_id, nickname) VALUES (?, 'Player4')",
      [testSteamId4]
    );

    // Create team registrations (approved)
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, 1)",
      [testSeasonId, testTeamId1]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrations (season_id, team_id, approved, terms_and_conditions_approved) VALUES (?, ?, 1, 1)",
      [testSeasonId, testTeamId2]
    );

    // Create team registration players (no captain assignments to avoid trigger complications)
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
      [testSeasonId, testTeamId2, testSteamId3]
    );
    await runQuery(
      "INSERT INTO SeasonTeamRegistrationPlayers (season_id, team_id, steam_id, is_captain, is_co_captain) VALUES (?, ?, ?, 0, 0)",
      [testSeasonId, testTeamId2, testSteamId4]
    );

    // Create SeasonPlayerRanks for the teams (needed for sortter functionality)
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo) VALUES (?, ?, 1500)",
      [testSteamId1, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo) VALUES (?, ?, 1400)",
      [testSteamId2, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo) VALUES (?, ?, 1600)",
      [testSteamId3, testSeasonId]
    );
    await runQuery(
      "INSERT INTO SeasonPlayerRanks (steam_id, season_id, kana_elo) VALUES (?, ?, 1300)",
      [testSteamId4, testSeasonId]
    );
  });

  beforeEach(async () => {
    // Clear Redis mock storage between tests
    const ioRedisWithMock = IORedis as typeof IORedis & {
      clearMockStorage?: () => void;
    };
    if (ioRedisWithMock.clearMockStorage) {
      ioRedisWithMock.clearMockStorage();
    }
  });

  afterAll(async () => {
    // Clean up test data
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
    await runQuery("DELETE FROM SeasonPlayerRanks WHERE season_id = ?", [
      testSeasonId
    ]);
    await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
      testTeamId1,
      testTeamId2
    ]);
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id IN (?, ?, ?, ?)", [
      testSteamId1,
      testSteamId2,
      testSteamId3,
      testSteamId4
    ]);
    await runQuery("DELETE FROM Seasons WHERE id = ?", [testSeasonId]);
  });

  it("should require admin authentication", async () => {
    const response = await request(app)
      .post(`/api/v1/sortter/season/${testSeasonId}/finalize`)
      .expect(401);

    expect(response.body.message || response.text).toContain("Unauthorized");
  });

  it("should finalize placements and copy players successfully", async () => {
    const adminJWT = generateTestJWT();

    // First, create preliminary placements
    const placements = [
      {
        team_id: testTeamId1,
        team_name: "Test Team 1",
        division: 1,
        comments: "Top team",
        original_avg: 1450,
        original_position: 1
      },
      {
        team_id: testTeamId2,
        team_name: "Test Team 2",
        division: 2,
        comments: "Second tier team",
        original_avg: 1450,
        original_position: 2
      }
    ];

    await request(app)
      .post(`/api/v1/sortter/season/${testSeasonId}/placements`)
      .set("Authorization", `Bearer ${adminJWT}`)
      .send({ placements })
      .expect(200);

    // Now finalize the placements
    const response = await request(app)
      .post(`/api/v1/sortter/season/${testSeasonId}/finalize`)
      .set("Authorization", `Bearer ${adminJWT}`)
      .expect(200);

    expect(response.body.message).toBe(
      "Team placements and players finalized successfully"
    );
    expect(response.body.season_id).toBe(testSeasonId);
    expect(response.body.teams_updated).toBe(2);
    expect(response.body.players_copied).toBe(4); // 4 players total across both teams

    // Verify SeasonLeagues were created
    const seasonLeagues = await runQuery<
      Array<{ season_id: number; league_id: number; tier: number }>
    >("SELECT * FROM SeasonLeagues WHERE season_id = ?", [testSeasonId]);
    expect(seasonLeagues.length).toBeGreaterThan(0);

    // Verify SeasonLeagueTeams were created
    const seasonLeagueTeams = await runQuery<
      Array<{ season_id: number; team_id: number; league_id: number }>
    >("SELECT * FROM SeasonLeagueTeams WHERE season_id = ?", [testSeasonId]);
    expect(seasonLeagueTeams.length).toBe(2);

    // Verify SeasonTeamPlayers were created with correct data
    type SeasonTeamPlayer = {
      season_id: number;
      team_id: number;
      steam_id: string;
      role: string;
      is_captain: number;
      is_co_captain: number;
    };

    const seasonTeamPlayers = await runQuery<SeasonTeamPlayer[]>(
      "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? ORDER BY team_id, steam_id",
      [testSeasonId]
    );

    expect(seasonTeamPlayers.length).toBe(4);

    // Check Team 1 players
    const team1Players = seasonTeamPlayers.filter(
      (p: SeasonTeamPlayer) => p.team_id === testTeamId1
    );
    expect(team1Players.length).toBe(2);

    const player1 = team1Players.find(
      (p: SeasonTeamPlayer) => p.steam_id === testSteamId1
    );
    expect(player1).toBeTruthy();
    expect(player1!.role).toBe("primary");
    expect(player1!.is_captain).toBeFalsy();
    expect(player1!.is_co_captain).toBeFalsy();

    const player2 = team1Players.find(
      (p: SeasonTeamPlayer) => p.steam_id === testSteamId2
    );
    expect(player2).toBeTruthy();
    expect(player2!.role).toBe("primary");
    expect(player2!.is_captain).toBeFalsy();
    expect(player2!.is_co_captain).toBeFalsy();

    // Check Team 2 players
    const team2Players = seasonTeamPlayers.filter(
      (p: SeasonTeamPlayer) => p.team_id === testTeamId2
    );
    expect(team2Players.length).toBe(2);

    const player3 = team2Players.find(
      (p: SeasonTeamPlayer) => p.steam_id === testSteamId3
    );
    expect(player3).toBeTruthy();
    expect(player3!.role).toBe("primary");
    expect(player3!.is_captain).toBeFalsy();
    expect(player3!.is_co_captain).toBeFalsy();

    const player4 = team2Players.find(
      (p: SeasonTeamPlayer) => p.steam_id === testSteamId4
    );
    expect(player4).toBeTruthy();
    expect(player4!.role).toBe("primary");
    expect(player4!.is_captain).toBeFalsy();
    expect(player4!.is_co_captain).toBeFalsy();
  });

  it("should prevent duplicate finalization", async () => {
    const adminJWT = generateTestJWT();

    // Try to finalize again
    const response = await request(app)
      .post(`/api/v1/sortter/season/${testSeasonId}/finalize`)
      .set("Authorization", `Bearer ${adminJWT}`)
      .expect(403);

    expect(response.body.error?.message || response.body.message).toBe(
      "Placements have already been finalized"
    );
  });
});
