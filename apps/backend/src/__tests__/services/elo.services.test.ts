import {
  stabilizePlayerElo,
  validateTeamEloAdjustments,
  getTeamEloAdjustments,
  storeEloAdjustment,
  storeTeamFlag,
  getTeamFlag
} from "../../services/elo.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { redisClient } from "../../utils/redisClient";
import { logger } from "../../utils/app-logger";

// Mock dependencies
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/redisClient");
jest.mock("../../utils/app-logger");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const _mockLogger = logger as jest.Mocked<typeof logger>;

describe("ELO Services Enhanced", () => {
  const testSteamId = "76561198000000001";
  const testSteamId2 = "76561198000000002";
  const testSteamId3 = "76561198000000003";
  const testSteamId4 = "76561198000000004";
  const testTeamId = 1;
  const testSeasonId = 14;
  const testLeagueId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("stabilizePlayerElo", () => {
    it("should stabilize ELO and store adjustment in Redis", async () => {
      // Mock database responses for valid stabilization
      mockRunQuery
        .mockResolvedValueOnce([{ kana_elo: 200 }]) // Current ELO
        .mockResolvedValueOnce([
          {
            season_id: testSeasonId,
            league_id: testLeagueId,
            avg_kana_rating: 1.15
          }
        ]) // Season/league data
        .mockResolvedValueOnce([{ avg_player_rating: 1.15 }]) // Player rating
        .mockResolvedValueOnce([
          {
            rowCount: 150,
            leagueAvgRating: 1.0
          }
        ]) // League average
        .mockResolvedValueOnce([{ team_id: testTeamId }]); // Team lookup

      mockRedisClient.set.mockResolvedValue("OK");
      mockRedisClient.keys.mockResolvedValue([]); // No existing adjustments
      mockRedisClient.mget.mockResolvedValue([]);

      const result = await stabilizePlayerElo(testSteamId, 220);

      expect(result.adjusted_elo).toBeGreaterThan(220); // Should be adjusted upward
      expect(result.details).toBeDefined();
      expect(result.details?.season_id).toBe(testSeasonId);
      expect(result.details?.league_id).toBe(testLeagueId);

      // Verify Redis storage - check that it was called with the correct key and contains expected data
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        expect.stringMatching(/"steam_id":"76561198000000001"/),
        "EX",
        7 * 24 * 60 * 60 // 7 days
      );

      // Verify the stored data structure
      const storedData = JSON.parse(
        mockRedisClient.set.mock.calls[0][1] as string
      );
      expect(storedData.steam_id).toBe(testSteamId);
      expect(storedData.season_id).toBe(testSeasonId);
      expect(storedData.league_id).toBe(testLeagueId);
      expect(storedData.offered_elo).toBe(220);
      expect(storedData.adjusted_elo).toBe(result.adjusted_elo);
      expect(storedData.adjustment_reason).toBe("stabilized");
      expect(storedData.timestamp).toBeDefined();
    });

    it("should include team_id in stored adjustment data", async () => {
      // Mock responses including team lookup
      mockRunQuery
        .mockResolvedValueOnce([{ kana_elo: 200 }])
        .mockResolvedValueOnce([
          {
            season_id: testSeasonId,
            league_id: testLeagueId,
            avg_kana_rating: 1.15
          }
        ])
        .mockResolvedValueOnce([{ avg_player_rating: 1.15 }])
        .mockResolvedValueOnce([
          {
            rowCount: 150,
            leagueAvgRating: 1.0
          }
        ])
        .mockResolvedValueOnce([{ team_id: testTeamId }]); // Team lookup

      mockRedisClient.set.mockResolvedValue("OK");
      mockRedisClient.keys.mockResolvedValue([]); // No existing adjustments
      mockRedisClient.mget.mockResolvedValue([]);

      await stabilizePlayerElo(testSteamId, 220);

      // Verify team_id is included in Redis data
      const redisCallArgs = mockRedisClient.set.mock.calls[0];
      const storedData = JSON.parse(redisCallArgs[1] as string);
      expect(storedData.team_id).toBe(testTeamId);
    });

    it("should proceed with adjustment and flag team when validation fails", async () => {
      // Mock database responses
      mockRunQuery
        .mockResolvedValueOnce([{ kana_elo: 200 }])
        .mockResolvedValueOnce([
          {
            season_id: testSeasonId,
            league_id: testLeagueId,
            avg_kana_rating: 1.15
          }
        ])
        .mockResolvedValueOnce([{ avg_player_rating: 1.15 }])
        .mockResolvedValueOnce([
          {
            rowCount: 150,
            leagueAvgRating: 1.0
          }
        ])
        .mockResolvedValueOnce([{ team_id: testTeamId }]); // Team lookup

      // Mock existing high adjustments in Redis that would cause validation to fail
      const existingAdjustments = [
        {
          steam_id: testSteamId2,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 240, // +40
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId3,
          team_id: testTeamId,
          offered_elo: 210,
          adjusted_elo: 250, // +40
          adjustment_reason: "stabilized"
        }
      ];

      mockRedisClient.keys.mockResolvedValue([
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId2}`,
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId3}`
      ]);
      mockRedisClient.mget.mockResolvedValue([
        JSON.stringify(existingAdjustments[0]),
        JSON.stringify(existingAdjustments[1])
      ]);
      mockRedisClient.set.mockResolvedValue("OK");

      const result = await stabilizePlayerElo(testSteamId, 220);

      // Should still proceed with adjustment
      expect(result.adjusted_elo).toBeGreaterThan(220);
      expect(result.details).toBeDefined();

      // Should store the adjustment
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        expect.stringMatching(/"adjustment_reason":"stabilized"/),
        "EX",
        7 * 24 * 60 * 60 // ELO adjustments still use 7 days
      );

      // Should store team flag with 30-day expiration
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `team-flag:s${testSeasonId}:l${testLeagueId}:${testTeamId}`,
        expect.stringMatching(/"flagged":true/),
        "EX",
        30 * 24 * 60 * 60 // Team flags use 30 days
      );

      // Should include flag information in result
      expect(result.teamFlagged).toBe(true);
      expect(result.flagReason).toContain("Too many high adjustments for team");
    });
  });

  describe("getTeamEloAdjustments", () => {
    it("should retrieve all team adjustments from Redis for a season/league", async () => {
      const mockRedisKeys = [
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId2}`
      ];

      const mockAdjustmentData = [
        {
          steam_id: testSteamId,
          season_id: testSeasonId,
          league_id: testLeagueId,
          team_id: testTeamId,
          offered_elo: 220,
          adjusted_elo: 240,
          adjustment_reason: "stabilized",
          timestamp: new Date().toISOString()
        },
        {
          steam_id: testSteamId2,
          season_id: testSeasonId,
          league_id: testLeagueId,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 230,
          adjustment_reason: "stabilized",
          timestamp: new Date().toISOString()
        }
      ];

      mockRedisClient.keys.mockResolvedValue(mockRedisKeys);
      mockRedisClient.mget.mockResolvedValue([
        JSON.stringify(mockAdjustmentData[0]),
        JSON.stringify(mockAdjustmentData[1])
      ]);

      const result = await getTeamEloAdjustments(
        testSeasonId,
        testLeagueId,
        testTeamId
      );

      expect(result).toHaveLength(2);
      expect(result[0].steam_id).toBe(testSteamId);
      expect(result[1].steam_id).toBe(testSteamId2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:*`
      );
    });

    it("should filter adjustments by team_id", async () => {
      const differentTeamId = 2;
      const mockRedisKeys = [
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId2}`
      ];

      const mockAdjustmentData = [
        {
          steam_id: testSteamId,
          team_id: testTeamId,
          offered_elo: 220,
          adjusted_elo: 240
        },
        {
          steam_id: testSteamId2,
          team_id: differentTeamId, // Different team
          offered_elo: 200,
          adjusted_elo: 230
        }
      ];

      mockRedisClient.keys.mockResolvedValue(mockRedisKeys);
      mockRedisClient.mget.mockResolvedValue([
        JSON.stringify(mockAdjustmentData[0]),
        JSON.stringify(mockAdjustmentData[1])
      ]);

      const result = await getTeamEloAdjustments(
        testSeasonId,
        testLeagueId,
        testTeamId
      );

      expect(result).toHaveLength(1);
      expect(result[0].steam_id).toBe(testSteamId);
      expect(result[0].team_id).toBe(testTeamId);
    });
  });

  describe("validateTeamEloAdjustments", () => {
    it("should pass validation when team adjustments are within limits", async () => {
      mockRedisClient.keys.mockResolvedValue([]);
      mockRedisClient.mget.mockResolvedValue([]);

      const result = await validateTeamEloAdjustments(
        testSteamId3, // New player
        testTeamId,
        testSeasonId,
        testLeagueId,
        190, // offered
        210 // adjusted (+20)
      );

      expect(result.isValid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should flag team when >2 players have >30 ELO adjustment", async () => {
      const mockAdjustments = [
        {
          steam_id: testSteamId,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 240, // +40 adjustment
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId2,
          team_id: testTeamId,
          offered_elo: 210,
          adjusted_elo: 250, // +40 adjustment
          adjustment_reason: "stabilized"
        }
      ];

      const mockRedisKeys = [
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId2}`
      ];

      mockRedisClient.keys.mockResolvedValue(mockRedisKeys);
      mockRedisClient.mget.mockResolvedValue([
        JSON.stringify(mockAdjustments[0]),
        JSON.stringify(mockAdjustments[1])
      ]);

      const result = await validateTeamEloAdjustments(
        testSteamId3, // Third player
        testTeamId,
        testSeasonId,
        testLeagueId,
        180,
        220 // +40 adjustment (would be 3rd player with >30 adjustment)
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Too many high adjustments for team");
      expect(result.existingAdjustments).toHaveLength(2);
    });

    it("should flag team when average offered vs adjusted ELO difference >30 for top 4 players", async () => {
      const mockAdjustments = [
        {
          steam_id: testSteamId,
          team_id: testTeamId,
          offered_elo: 220,
          adjusted_elo: 250, // +30
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId2,
          team_id: testTeamId,
          offered_elo: 210,
          adjusted_elo: 245, // +35
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId3,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 235, // +35
          adjustment_reason: "stabilized"
        }
      ];

      const mockRedisKeys = mockAdjustments.map(
        (adj) =>
          `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${adj.steam_id}`
      );

      mockRedisClient.keys.mockResolvedValue(mockRedisKeys);
      mockRedisClient.mget.mockResolvedValue(
        mockAdjustments.map((adj) => JSON.stringify(adj))
      );

      const result = await validateTeamEloAdjustments(
        testSteamId4, // Fourth player
        testTeamId,
        testSeasonId,
        testLeagueId,
        190,
        225 // +35 adjustment - would make avg adjustment >30 for top 4
      );

      // Calculate expected averages
      // Top 4 offered: [220, 210, 200, 190] -> avg = 205
      // Top 4 adjusted: [250, 245, 235, 225] -> avg = 238.75
      // Difference: 33.75 > 30
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Average ELO jump too high for team");
      expect(result.avgOfferedElo).toBeCloseTo(205, 1);
      expect(result.avgAdjustedElo).toBeCloseTo(238.75, 1);
    });

    it("should flag team when average offered vs adjusted ELO difference <-30 for top 4 players", async () => {
      const mockAdjustments = [
        {
          steam_id: testSteamId,
          team_id: testTeamId,
          offered_elo: 220,
          adjusted_elo: 185, // -35 adjustment
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId2,
          team_id: testTeamId,
          offered_elo: 210,
          adjusted_elo: 175, // -35 adjustment
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId3,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 165, // -35 adjustment
          adjustment_reason: "stabilized"
        }
      ];

      const mockRedisKeys = mockAdjustments.map(
        (adj) =>
          `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${adj.steam_id}`
      );

      mockRedisClient.keys.mockResolvedValue(mockRedisKeys);
      mockRedisClient.mget.mockResolvedValue(
        mockAdjustments.map((adj) => JSON.stringify(adj))
      );

      const result = await validateTeamEloAdjustments(
        testSteamId4, // Fourth player
        testTeamId,
        testSeasonId,
        testLeagueId,
        190,
        155 // -35 adjustment - would make avg adjustment <-30 for top 4
      );

      // Calculate expected averages
      // Top 4 offered: [220, 210, 200, 190] -> avg = 205
      // Top 4 adjusted: [185, 175, 165, 155] -> avg = 170
      // Difference: -35 < -30
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Average ELO jump too high for team");
      expect(result.avgOfferedElo).toBeCloseTo(205, 1);
      expect(result.avgAdjustedElo).toBeCloseTo(170, 1);
    });

    it("should always validate top 4 players since teams have 5-9 players", async () => {
      // Test with exactly 5 adjustments (team of 5 + current player = 6 total)
      const mockAdjustments = [
        {
          steam_id: testSteamId,
          team_id: testTeamId,
          offered_elo: 220,
          adjusted_elo: 240,
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId2,
          team_id: testTeamId,
          offered_elo: 210,
          adjusted_elo: 230,
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId3,
          team_id: testTeamId,
          offered_elo: 200,
          adjusted_elo: 220,
          adjustment_reason: "stabilized"
        },
        {
          steam_id: testSteamId4,
          team_id: testTeamId,
          offered_elo: 190,
          adjusted_elo: 210,
          adjustment_reason: "stabilized"
        }
      ];

      mockRedisClient.keys.mockResolvedValue(
        mockAdjustments.map(
          (adj) =>
            `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${adj.steam_id}`
        )
      );
      mockRedisClient.mget.mockResolvedValue(
        mockAdjustments.map((adj) => JSON.stringify(adj))
      );

      const result = await validateTeamEloAdjustments(
        "76561198000000005", // Fifth player
        testTeamId,
        testSeasonId,
        testLeagueId,
        180,
        200 // +20 adjustment
      );

      // Top 4 should be checked: [240, 230, 220, 210] vs [220, 210, 200, 190]
      // Avg difference: 225 - 205 = 20 (within ±30 limit)
      expect(result.isValid).toBe(true);
    });
  });

  describe("storeEloAdjustment", () => {
    it("should store ELO adjustment data in Redis with proper expiration", async () => {
      mockRedisClient.set.mockResolvedValue("OK");

      await storeEloAdjustment({
        steam_id: testSteamId,
        season_id: testSeasonId,
        league_id: testLeagueId,
        team_id: testTeamId,
        offered_elo: 200,
        adjusted_elo: 220,
        adjustment_reason: "stabilized"
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `elo-adjustment:s${testSeasonId}:l${testLeagueId}:${testSteamId}`,
        expect.stringContaining('"steam_id":"76561198000000001"'),
        "EX",
        7 * 24 * 60 * 60 // 7 days
      );
    });

    it("should include timestamp in stored data", async () => {
      mockRedisClient.set.mockResolvedValue("OK");
      const beforeTime = new Date();

      await storeEloAdjustment({
        steam_id: testSteamId,
        season_id: testSeasonId,
        league_id: testLeagueId,
        team_id: testTeamId,
        offered_elo: 200,
        adjusted_elo: 220,
        adjustment_reason: "stabilized"
      });

      const afterTime = new Date();
      const storedData = JSON.parse(
        mockRedisClient.set.mock.calls[0][1] as string
      );
      const storedTime = new Date(storedData.timestamp);

      expect(storedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(storedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe("storeTeamFlag", () => {
    it("should store team flag data in Redis with proper expiration", async () => {
      mockRedisClient.set.mockResolvedValue("OK");

      await storeTeamFlag({
        season_id: testSeasonId,
        league_id: testLeagueId,
        team_id: testTeamId,
        flagged: true,
        reason: "Too many high adjustments",
        flagged_players: [testSteamId, testSteamId2]
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `team-flag:s${testSeasonId}:l${testLeagueId}:${testTeamId}`,
        expect.stringContaining('"flagged":true'),
        "EX",
        30 * 24 * 60 * 60 // 30 days for team flags
      );
    });

    it("should include timestamp and all flag details in stored data", async () => {
      mockRedisClient.set.mockResolvedValue("OK");
      const beforeTime = new Date();

      await storeTeamFlag({
        season_id: testSeasonId,
        league_id: testLeagueId,
        team_id: testTeamId,
        flagged: true,
        reason: "Average ELO jump too high",
        flagged_players: [testSteamId, testSteamId2, testSteamId3]
      });

      const afterTime = new Date();
      const storedData = JSON.parse(
        mockRedisClient.set.mock.calls[0][1] as string
      );
      const storedTime = new Date(storedData.timestamp);

      expect(storedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(storedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      expect(storedData.season_id).toBe(testSeasonId);
      expect(storedData.league_id).toBe(testLeagueId);
      expect(storedData.team_id).toBe(testTeamId);
      expect(storedData.flagged).toBe(true);
      expect(storedData.reason).toBe("Average ELO jump too high");
      expect(storedData.flagged_players).toEqual([
        testSteamId,
        testSteamId2,
        testSteamId3
      ]);
    });
  });

  describe("getTeamFlag", () => {
    it("should retrieve team flag from Redis", async () => {
      const mockFlagData = {
        season_id: testSeasonId,
        league_id: testLeagueId,
        team_id: testTeamId,
        flagged: true,
        reason: "Too many high adjustments",
        flagged_players: [testSteamId, testSteamId2],
        timestamp: new Date().toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockFlagData));

      const result = await getTeamFlag(testSeasonId, testLeagueId, testTeamId);

      expect(result).toEqual(mockFlagData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        `team-flag:s${testSeasonId}:l${testLeagueId}:${testTeamId}`
      );
    });

    it("should return null when no flag exists", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getTeamFlag(testSeasonId, testLeagueId, testTeamId);

      expect(result).toBeNull();
    });

    it("should handle JSON parse errors gracefully", async () => {
      mockRedisClient.get.mockResolvedValue("invalid json");

      const result = await getTeamFlag(testSeasonId, testLeagueId, testTeamId);

      expect(result).toBeNull();
    });
  });

  describe("Integration with season 14 data patterns", () => {
    it("should work with realistic season 14 ELO ranges", async () => {
      // Mock realistic season 14 data patterns
      mockRunQuery
        .mockResolvedValueOnce([{ kana_elo: 185 }]) // Typical season 14 ELO
        .mockResolvedValueOnce([
          {
            season_id: 14,
            league_id: 1,
            avg_kana_rating: 1.08 // Realistic kana rating for season 14
          }
        ])
        .mockResolvedValueOnce([{ avg_player_rating: 1.08 }])
        .mockResolvedValueOnce([
          {
            rowCount: 120,
            leagueAvgRating: 1.02 // Realistic league average
          }
        ])
        .mockResolvedValueOnce([{ team_id: 15 }]); // Realistic team ID

      mockRedisClient.set.mockResolvedValue("OK");

      const result = await stabilizePlayerElo(testSteamId, 195);

      expect(result.adjusted_elo).toBeGreaterThan(195);
      expect(result.details?.season_id).toBe(14);
      expect(result.details?.player_rating).toBe(1.08);
      expect(result.details?.league_avg_rating).toBe(1.02);
    });
  });
});
