import { createMockResultSetHeader } from "../__utils__/result-set-header";
import { saveParsedDemoDataForGame } from "./match-game.models";
import {
  MOCK_PARSED_DEMO_DATA,
  MOCK_MATCH_GAME_ID
} from "../__mocks__/demo-parsed-json/mock-parsed-demo";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { type ParsedPayload } from "../types/parse-queue.types";
import { type PoolConnection } from "mysql2/promise";

// Mock the database connection and query functions
jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./team-game-score.models");
jest.mock("./player-stats.models");
jest.mock("./player-trades.models");
jest.mock("./player-clutches.models");
jest.mock("./player-round-impacts.models");
jest.mock("./player-kill-logs.models");
jest.mock("./map-round-stat.models");
jest.mock("./flash-events.models");
jest.mock("./round-swing-events.models");
jest.mock("./setup-events.models");
jest.mock("./wasted-utility-events.models");
jest.mock("./utility-throw-events.models");
jest.mock("./round-utility-summary.models");
jest.mock("./player-hit-logs.models");

// Import the mocked functions
import { upsertTeamGameScore } from "./team-game-score.models";
import { savePlayerStatsForGame } from "./player-stats.models";
import { savePlayerTradesForGame } from "./player-trades.models";
import { savePlayerClutchesForGame } from "./player-clutches.models";
import { savePlayerRoundImpactsForGame } from "./player-round-impacts.models";
import { savePlayerKillLogsForGame } from "./player-kill-logs.models";
import { saveMapRoundStatsForGame } from "./map-round-stat.models";

const mockUpsertTeamGameScore = upsertTeamGameScore as jest.MockedFunction<
  typeof upsertTeamGameScore
>;
const mockSavePlayerStatsForGame =
  savePlayerStatsForGame as jest.MockedFunction<typeof savePlayerStatsForGame>;
const mockSavePlayerTradesForGame =
  savePlayerTradesForGame as jest.MockedFunction<
    typeof savePlayerTradesForGame
  >;
const mockSavePlayerClutchesForGame =
  savePlayerClutchesForGame as jest.MockedFunction<
    typeof savePlayerClutchesForGame
  >;
const mockSavePlayerRoundImpactsForGame =
  savePlayerRoundImpactsForGame as jest.MockedFunction<
    typeof savePlayerRoundImpactsForGame
  >;
const mockSavePlayerKillLogsForGame =
  savePlayerKillLogsForGame as jest.MockedFunction<
    typeof savePlayerKillLogsForGame
  >;
const mockSaveMapRoundStatsForGame =
  saveMapRoundStatsForGame as jest.MockedFunction<
    typeof saveMapRoundStatsForGame
  >;

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

describe("saveParsedDemoDataForGame", () => {
  let mockConnection: Partial<PoolConnection>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock connection
    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      execute: jest.fn(),
      ping: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      escape: jest.fn(),
      escapeId: jest.fn(),
      format: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      listenerCount: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      eventNames: jest.fn()
    };

    mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);

    // Setup default mocks for the upsert functions
    mockUpsertTeamGameScore.mockResolvedValue(
      createMockResultSetHeader({ insertId: 1 })
    );
    mockSavePlayerStatsForGame.mockResolvedValue(undefined);
    mockSavePlayerTradesForGame.mockResolvedValue(undefined);
    mockSavePlayerClutchesForGame.mockResolvedValue(undefined);
    mockSavePlayerRoundImpactsForGame.mockResolvedValue(undefined);
    mockSavePlayerKillLogsForGame.mockResolvedValue(undefined);
    mockSaveMapRoundStatsForGame.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("successful data saving", () => {
    beforeEach(() => {
      // Mock successful database operations
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // getMatchIdByGameId
        .mockResolvedValueOnce([{ team_id: 1 }]) // getTeamIdByPlayerSteamIdsAndGameId for team 1
        .mockResolvedValueOnce([{ team_id: 2 }]); // getTeamIdByPlayerSteamIdsAndGameId for team 2
    });

    it("should successfully save parsed demo data for a game", async () => {
      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      expect(mockGetConnection).toHaveBeenCalledTimes(1);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).not.toHaveBeenCalled();

      // Verify that the correct queries were executed
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT match_id, team_game_scores_staff_lock FROM MatchGames WHERE id = ?"
        ),
        expect.arrayContaining([123123]),
        expect.anything()
      );
    });

    it("should handle team identification correctly", async () => {
      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // Verify team queries were called with correct steam IDs from mock data
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT DISTINCT mt.team_id FROM MatchGames mg"
        ),
        expect.arrayContaining([123123, "76561197979955992"]),
        expect.anything()
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT DISTINCT mt.team_id FROM MatchGames mg"
        ),
        expect.arrayContaining([123123, "76561198074105343"]),
        expect.anything()
      );
    });

    it("should process all players from the parsed data", async () => {
      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // Verify that the function was called with the correct number of queries
      // match query + 2 team queries = 3 calls
      expect(mockRunQuery).toHaveBeenCalledTimes(3);
    });

    it("should handle score data correctly", async () => {
      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // The function should complete successfully with the mocked data
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe("team_game_scores_staff_lock", () => {
    beforeEach(() => {
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 1 }
        ])
        .mockResolvedValueOnce([{ team_id: 1 }])
        .mockResolvedValueOnce([{ team_id: 2 }]);
    });

    it("should not call upsertTeamGameScore when team_game_scores_staff_lock is set", async () => {
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      expect(mockUpsertTeamGameScore).not.toHaveBeenCalled();
      expect(mockSavePlayerStatsForGame).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should throw error when match is not found", async () => {
      // Arrange
      mockRunQuery.mockResolvedValueOnce([]); // No match found

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("Could not find parent match for game 123123");

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should throw error when teams are not found", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([]) // Team 1 not found
        .mockResolvedValueOnce([]); // Team 2 not found

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow(/Could not find team for game 123123/);

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should rollback transaction on database error", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");
      mockGetConnection.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("Database connection failed");

      expect(mockConnection.rollback).not.toHaveBeenCalled(); // No transaction started
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should rollback transaction when player stats save fails after delete", async () => {
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ])
        .mockResolvedValueOnce([{ team_id: 1 }])
        .mockResolvedValueOnce([{ team_id: 2 }]);

      mockSavePlayerStatsForGame.mockRejectedValueOnce(
        new Error("PlayerStats insert failed")
      );

      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("PlayerStats insert failed");

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should rollback transaction when team game score insertion fails", async () => {
      // Arrange - Mock the first few calls successfully, then fail
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Make the upsert function fail
      mockUpsertTeamGameScore.mockRejectedValueOnce(new Error("Upsert failed"));

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("Upsert failed");

      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe("data validation", () => {
    it("should handle empty players object", async () => {
      // Arrange
      const emptyPlayersData = {
        ...MOCK_PARSED_DEMO_DATA,
        Players: {}
      };

      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([]) // No team 1 players
        .mockResolvedValueOnce([]); // No team 2 players

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, emptyPlayersData)
      ).rejects.toThrow(/Could not find team for game 123123/);
    });

    it("should handle missing score data", async () => {
      // Arrange
      const dataWithoutScore = {
        ...MOCK_PARSED_DEMO_DATA,
        Score: undefined
      };

      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(
          MOCK_MATCH_GAME_ID,
          dataWithoutScore as unknown as ParsedPayload
        )
      ).rejects.toThrow();
    });

    it("should handle missing round info", async () => {
      // Arrange
      const dataWithoutRounds = {
        ...MOCK_PARSED_DEMO_DATA,
        NewRoundInfo: { Rounds: [] }
      };

      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act
      await saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, dataWithoutRounds);

      // Assert - should complete successfully with empty rounds
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe("transaction management", () => {
    it("should properly manage database transaction", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).not.toHaveBeenCalled();
    });

    it("should rollback and release connection on error", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Make the upsert function fail
      mockUpsertTeamGameScore.mockRejectedValueOnce(new Error("Upsert failed"));

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_MATCH_GAME_ID, MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("Upsert failed");

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe("data integrity", () => {
    it("should preserve all player data during insertion", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // Verify that the function completed successfully
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });

    it("should handle trades data correctly", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // Verify that the function completed successfully
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockSavePlayerTradesForGame).toHaveBeenCalled();
      expect(mockSavePlayerClutchesForGame).toHaveBeenCalled();
      expect(mockSavePlayerRoundImpactsForGame).toHaveBeenCalled();
    });

    it("should handle round stats data correctly", async () => {
      // Arrange
      mockRunQuery
        .mockResolvedValueOnce([
          { match_id: 1, team_game_scores_staff_lock: 0 }
        ]) // Match found
        .mockResolvedValueOnce([{ team_id: 1 }]) // Team 1 found
        .mockResolvedValueOnce([{ team_id: 2 }]); // Team 2 found

      // Act
      await saveParsedDemoDataForGame(
        MOCK_MATCH_GAME_ID,
        MOCK_PARSED_DEMO_DATA
      );

      // Assert
      // Verify that the function completed successfully
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });
});
