import type { Response } from "express";
import {
  EligiblePlayerForValidationSteamId,
  type RequestWithParams,
  createMockSteamPlayer,
  createMockAccount,
  createMockSeasonPlayerRank
} from "@eggosystem/types";
import {
  addPlayerToTeamController,
  addSubstitutePlayerController,
  preparePlayerForSignupController
} from "./player.controllers";
import * as seasonModels from "../../models/dashboard/season.models";
import * as playerModels from "../../models/player.models";
import * as seasonModelsBase from "../../models/season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import * as matchUtils from "../../utils/matchUtils";
import * as steamIdValidator from "../../utils/steam-id-validator";
import * as playerRankServices from "../../services/player-ranks.services";
import * as dbConnection from "../../db/mysqlConnection";

// Mock dependencies
jest.mock("../../models/dashboard/season.models");
jest.mock("../../models/player.models");
jest.mock("../../models/season-player-ranks.models");
jest.mock("../../models/season.models");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/matchUtils");
jest.mock("../../utils/steam-id-validator");
jest.mock("../../services/player-ranks.services");
jest.mock("../../services/faceit.services");
jest.mock("../../db/mysqlConnection");

const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;
const mockPlayerModels = playerModels as jest.Mocked<typeof playerModels>;
const mockSeasonModelsBase = seasonModelsBase as jest.Mocked<
  typeof seasonModelsBase
>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockMatchUtils = matchUtils as jest.Mocked<typeof matchUtils>;
const mockSteamIdValidator = steamIdValidator as jest.Mocked<
  typeof steamIdValidator
>;
const mockPlayerRankServices = playerRankServices as jest.Mocked<
  typeof playerRankServices
>;
const mockGetConnection = dbConnection.getConnection as jest.MockedFunction<
  typeof dbConnection.getConnection
>;

/**
 * Sets up the mock for checkPlayerAdditionEligibility
 * This is used by both addPlayerToTeamController and addSubstitutePlayerController tests
 */
const setupEligibilityMock = (options: {
  canAddPlayer: boolean;
  newPlayerKanaElo?: number;
  currentTop3Avg?: number;
  currentTop4Avg?: number;
  newAvgWithPlayer?: number;
  leagueName?: string;
}) => {
  const {
    canAddPlayer,
    newPlayerKanaElo = 200,
    currentTop3Avg = 205,
    currentTop4Avg = 200,
    newAvgWithPlayer = 204,
    leagueName = "Test League"
  } = options;

  // Use mockResolvedValue instead of mockResolvedValueOnce to ensure it's always available
  // The mock will be cleared in beforeEach, so we set it up fresh for each test
  mockSeasonModels.checkPlayerAdditionEligibility.mockResolvedValue({
    selectedTeam: {
      team_id: 1650,
      team_name: "Test Team",
      current_top4_avg: currentTop3Avg,
      current_top5_avg: currentTop4Avg,
      new_player_kana_elo: newPlayerKanaElo,
      new_avg_with_player: newAvgWithPlayer,
      csrankker_calculus: "{}",
      csrankker_original_kanaelo: undefined
    },
    topTeamsInLeague: [
      { team_id: 1, team_name: "Top Team", avg5: 210, rank: 1 }
    ],
    canAddPlayer,
    league_name: leagueName
  });
};

describe("addPlayerToTeamController", () => {
  // Create test objects
  const mockRequest = {
    params: {
      season_id: "14",
      team_id: "1650",
      steam_id: EligiblePlayerForValidationSteamId
    },
    body: {
      kana_elo: 200,
      calculus: { test: "data" }
    },
    query: {}
  } as unknown as RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>;

  const mockResponse = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis()
  } as unknown as Response;

  const mockNext = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset runQuery mock - this will clear any mockImplementation
    (mockRunQuery as jest.Mock).mockReset();
    (mockResponse.json as jest.Mock).mockClear();
    (mockResponse.status as jest.Mock).mockClear();
    mockNext.mockClear();

    // Mock database connection
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn()
    };
    mockGetConnection.mockResolvedValue(mockConnection as never);

    // Default mock for getSeasonByIdOrThrow - returns season with max_players
    mockSeasonModelsBase.getSeasonByIdOrThrow.mockResolvedValue({
      id: 14,
      max_players: 9,
      active_map_pool: [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }]
    } as never);

    // Reset eligibility mock - use mockClear instead of mockReset to preserve mock implementation
    mockSeasonModels.checkPlayerAdditionEligibility.mockClear();
  });

  /**
   * Sets up common mocks for the initial queries that are called
   * when adding a player to a team (before eligibility check)
   */
  const setupCommonInitialMocks = (options?: {
    primaryPlayers?: Array<{ steam_id: string }>;
    season?: {
      id: number;
      max_players: number;
      active_map_pool?: Array<{ map_id: number }>;
    };
    mapPool?: Array<{ map_id: number }>;
    seasonPlayerRank?: Array<{
      id: number;
      cs2_rank: number | null;
      faceit_level: number | null;
      faceit_elo: number | null;
      cs_hours: number | null;
      kana_elo: number | null;
    }>;
    tier?: number;
  }) => {
    const {
      primaryPlayers = [
        { steam_id: "76561198000000001" },
        { steam_id: "76561198000000002" }
      ],
      seasonPlayerRank,
      tier = 2
    } = options || {};

    // 1. getPrimaryPlayersForTeam query - returns array of objects with steam_id
    // This is called by ensureSeasonMaxPlayersForTeam BEFORE the transaction
    console.log(
      "setupCommonInitialMocks: Setting up getPrimaryPlayersForTeam mock"
    );
    mockRunQuery.mockResolvedValueOnce(primaryPlayers);

    // 2. getSeasonByIdOrThrow is already mocked in beforeEach with a default value
    // If we need a different value for this test, we can override it here
    // But for now, the default mock should work

    // 3. SeasonPlayerRanks query (if provided) - NOTE: This is NOT used in finalized context
    // It's only used in registration context or by ensurePlayerRankDataExists
    // But ensurePlayerRankDataExists is mocked, so this won't be consumed
    // So we DON'T set this up here to avoid consuming a mock slot

    // 4. Tier query - We set this up in the test itself to ensure correct order
    // So we DON'T set it up here to avoid duplicates
  };

  /**
   * Creates a mock player profile response (SteamPlayer + Account combined)
   */
  const createMockPlayerProfile = (overrides?: {
    steam_id?: string;
    nickname?: string;
    account_id?: number;
    work_email_verified?: boolean;
    work_email?: string;
    is_work_email_personal_email?: boolean;
    discord?: string;
  }) => {
    const {
      steam_id = EligiblePlayerForValidationSteamId,
      nickname = "Test Player",
      account_id = 123,
      work_email_verified = true,
      work_email = "test@example.com",
      is_work_email_personal_email = false,
      discord = "test#1234"
    } = overrides || {};

    return [
      {
        ...createMockSteamPlayer({
          steam_id,
          nickname,
          account_id
        }),
        ...createMockAccount({
          id: account_id,
          work_email_verified,
          work_email,
          is_work_email_personal_email
        }),
        discord,
        is_valid_work_email: true,
        is_valid_full_name: true
      }
    ];
  };

  it("should add an eligible player to the team", async () => {
    console.log("=== Test: should add an eligible player to the team ===");

    const playerProfile = createMockPlayerProfile();

    // Set up mockImplementation FIRST, before any queries are made
    // This is more reliable than mockResolvedValueOnce which isn't working
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      if (
        query.includes("SELECT steam_id FROM SeasonTeamPlayers") &&
        query.includes("role = 'primary'")
      ) {
        // getPrimaryPlayersForTeam query (called by ensureSeasonMaxPlayersForTeam BEFORE transaction)
        return Promise.resolve([
          { steam_id: "76561198000000001" },
          { steam_id: "76561198000000002" }
        ]);
      }
      if (
        query.includes("SELECT sl.tier") &&
        query.includes("SeasonLeagueTeams")
      ) {
        // Tier query
        return Promise.resolve([{ tier: 2 }]);
      }
      if (
        query.includes("SteamPlayers") &&
        query.includes("Accounts") &&
        (query.includes("steam_id = ?") || query.includes("p.steam_id = ?"))
      ) {
        // getPlayerDetailsForDashboardBySteamId query
        return Promise.resolve(playerProfile);
      }
      if (query.includes("INSERT INTO SeasonTeamPlayers")) {
        // INSERT query
        return Promise.resolve({ insertId: 1 });
      }
      // Default: return empty array
      return Promise.resolve([]);
    });

    // setupCommonInitialMocks sets up getPrimaryPlayersForTeam, but we're using mockImplementation now
    // So we don't need to call it, but we still need getSeasonByIdOrThrow mock
    mockSeasonModelsBase.getSeasonByIdOrThrow.mockResolvedValue({
      id: 14,
      max_players: 9,
      active_map_pool: [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }]
    } as never);

    // Mock getSeasonPlatformAndAppId
    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    // Mock ensurePlayerRankDataExists - it's mocked, so it won't call runQuery internally
    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    // Mock checkPlayerAdditionEligibility (it's mocked, so internal queries won't be called)
    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // DON'T override mockImplementation - it breaks the mockResolvedValueOnce chain!
    // Just let Jest's mock system handle it

    // Call the controller
    console.log("Calling controller...");
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    console.log(
      "Controller finished. runQuery was called",
      (mockRunQuery as jest.Mock).mock.calls.length,
      "times"
    );
    (mockRunQuery as jest.Mock).mock.calls.forEach((call, i) => {
      const query =
        typeof call[0] === "string"
          ? call[0].substring(0, 150)
          : String(call[0]);
      const result = (mockRunQuery as jest.Mock).mock.results[i];
      console.log(`  Call #${i + 1}:`, query.substring(0, 100));
      if (result) {
        console.log(`    Result type: ${result.type}`);
        if (result.type === "return") {
          const value = result.value;
          console.log(
            `    Value type: ${typeof value}, isArray: ${Array.isArray(value)}`
          );
          if (Array.isArray(value)) {
            console.log(`    Array length: ${value.length}`);
            if (value.length > 0) {
              console.log(
                `    First item:`,
                JSON.stringify(value[0], null, 2).substring(0, 300)
              );
            }
          } else if (value && typeof value === "object") {
            console.log(`    Object keys:`, Object.keys(value));
            console.log(
              `    Object:`,
              JSON.stringify(value, null, 2).substring(0, 200)
            );
          } else {
            console.log(`    Value:`, value);
          }
        }
      } else {
        console.log(`    No result for call #${i + 1}`);
      }
    });
    console.log("mockNext calls:", mockNext.mock.calls.length);
    if (mockNext.mock.calls.length > 0) {
      console.log("mockNext was called with:", mockNext.mock.calls[0]);
      console.log("Error message:", mockNext.mock.calls[0][0]?.message);
      console.log(
        "Error stack:",
        mockNext.mock.calls[0][0]?.stack?.substring(0, 500)
      );
    }
    console.log(
      "setPlayerKanaElo calls:",
      mockPlayerModels.setPlayerKanaElo.mock.calls.length
    );
    // getPlayerDetailsForDashboardBySteamId is not mocked - it's the real function that calls runQuery

    // Verify eligibility was checked
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).toHaveBeenCalledWith(
      14,
      1650,
      EligiblePlayerForValidationSteamId,
      expect.any(Object)
    );

    expect(mockPlayerModels.setPlayerKanaElo).toHaveBeenCalledWith(
      EligiblePlayerForValidationSteamId,
      200,
      expect.any(String),
      14,
      undefined,
      expect.any(Object)
    );

    // Verify INSERT was called - check all INSERT calls
    const insertCalls = (mockRunQuery as jest.Mock).mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "string" &&
        call[0].includes("INSERT INTO SeasonTeamPlayers")
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    // The INSERT should have season_id, team_id, and steam_id in the params
    const hasCorrectInsert = insertCalls.some((call) => {
      const params = call[1] as any[];
      return (
        params.includes(14) &&
        params.includes(1650) &&
        params.includes(EligiblePlayerForValidationSteamId)
      );
    });
    expect(hasCorrectInsert).toBe(true);

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: expect.any(String),
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      kana_elo: 200,
      context: "finalized"
    });

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should create player data if missing in SeasonPlayerRanks", async () => {
    setupCommonInitialMocks({
      seasonPlayerRank: []
    });

    // Mock getSeasonPlatformAndAppId
    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    // Mock ensurePlayerRankDataExists - it's mocked, so it won't call runQuery internally
    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    // Mock tier query (called before eligibility check)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    // Mock getPlayerDetailsForDashboardBySteamId
    mockRunQuery.mockResolvedValueOnce(createMockPlayerProfile());

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify player data was created via ensurePlayerRankDataExists
    expect(
      mockPlayerRankServices.ensurePlayerRankDataExists
    ).toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should reject ineligible players", async () => {
    setupCommonInitialMocks({
      seasonPlayerRank: [
        createMockSeasonPlayerRank({
          id: 1,
          cs2_rank: 15,
          faceit_level: 7,
          faceit_elo: 2000,
          cs_hours: 1500,
          kana_elo: 300
        })
      ]
    });

    // Mock getSeasonPlatformAndAppId
    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    // Mock ensurePlayerRankDataExists - it's mocked, so it won't call runQuery internally
    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    // Mock tier query (called before eligibility check)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    // Mock getPlayerDetailsForDashboardBySteamId
    mockRunQuery.mockResolvedValueOnce(createMockPlayerProfile());

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify player data was created via ensurePlayerRankDataExists
    expect(
      mockPlayerRankServices.ensurePlayerRankDataExists
    ).toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should reject ineligible players", async () => {
    setupCommonInitialMocks({
      seasonPlayerRank: [
        createMockSeasonPlayerRank({
          id: 1,
          cs2_rank: 15,
          faceit_level: 7,
          faceit_elo: 2000,
          cs_hours: 1500,
          kana_elo: 300
        })
      ]
    });

    // Mock getSeasonPlatformAndAppId
    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    // Mock ensurePlayerRankDataExists
    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    // Mock queries for checkPlayerAdditionEligibility -> ensureSeasonMaxPlayersForTeam -> getSeasonById -> getActiveMapPoolBySeasonId
    mockRunQuery.mockResolvedValueOnce([{ steam_id: "76561198000000001" }]); // getPrimaryPlayersForTeam
    mockRunQuery.mockResolvedValueOnce([{ id: 14, max_players: 9 }]); // getSeasonById
    mockRunQuery.mockResolvedValueOnce([
      { map_id: 1 },
      { map_id: 2 },
      { map_id: 3 }
    ]); // getActiveMapPoolBySeasonId
    mockRunQuery.mockResolvedValueOnce([{ league_id: 1 }]); // league query

    setupEligibilityMock({
      canAddPlayer: false,
      newPlayerKanaElo: 300,
      currentTop4Avg: 210,
      newAvgWithPlayer: 220
    });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify eligibility was checked
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).toHaveBeenCalledWith(
      14,
      1650,
      EligiblePlayerForValidationSteamId,
      expect.any(Object)
    );

    // Verify player was NOT added to team (query not called)
    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "primary"]
    );

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("not eligible")
      })
    );
  });

  it("should handle database errors", async () => {
    const playerProfile = createMockPlayerProfile();

    // Set up mockImplementation for runQuery
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      // Log queries for debugging
      const queryPreview = query.replace(/\s+/g, " ").substring(0, 150);
      console.log(`[Database Error Test] Query: ${queryPreview}`);

      if (
        query.includes("SELECT steam_id FROM SeasonTeamPlayers") &&
        query.includes("role = 'primary'")
      ) {
        console.log("  -> Matched getPrimaryPlayersForTeam");
        return Promise.resolve([
          { steam_id: "76561198000000001" },
          { steam_id: "76561198000000002" }
        ]);
      }
      if (
        query.includes("SELECT sl.tier") &&
        query.includes("SeasonLeagueTeams")
      ) {
        console.log("  -> Matched tier query");
        return Promise.resolve([{ tier: 2 }]);
      }
      if (query.includes("SteamPlayers") && query.includes("Accounts")) {
        console.log("  -> Matched player profile query");
        return Promise.resolve(playerProfile);
      }
      console.log("  -> WARNING: Unmocked query, returning empty array");
      return Promise.resolve([]);
    });

    mockSeasonModelsBase.getSeasonByIdOrThrow.mockResolvedValue({
      id: 14,
      max_players: 9,
      active_map_pool: [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }]
    } as never);

    // Mock getSeasonPlatformAndAppId
    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    // Mock ensurePlayerRankDataExists - it's mocked, so it won't call runQuery internally
    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    // Mock setPlayerKanaElo to throw error
    mockPlayerModels.setPlayerKanaElo.mockRejectedValueOnce(
      new Error("Failed to update player's kana_elo")
    );

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed to update player's kana_elo")
      })
    );
  });
});

describe("addSubstitutePlayerController", () => {
  const mockRequest = {
    params: {
      season_id: "14",
      team_id: "1650",
      steam_id: EligiblePlayerForValidationSteamId
    },
    body: {}
  } as unknown as RequestWithParams<{
    season_id: string;
    team_id: string;
    steam_id: string;
  }>;

  const mockResponse = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis()
  } as unknown as Response;

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockResponse.json as jest.Mock).mockClear();
    (mockResponse.status as jest.Mock).mockClear();
    mockNext.mockClear();
    // Reset runQuery mock to ensure clean state - remove any mockImplementation
    (mockRunQuery as jest.Mock).mockClear();
    (mockRunQuery as jest.Mock).mockReset();
    // Reset other mocks
    mockPlayerModels.setPlayerKanaElo.mockClear();
    mockSeasonModels.checkPlayerAdditionEligibility.mockClear();
    mockMatchUtils.resolveMatchId.mockClear();
  });

  it("should successfully add a substitute player without match_id", async () => {
    await addSubstitutePlayerController(mockRequest, mockResponse, mockNext);

    // Verify no eligibility check was performed
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify no database insertion was performed since no match_id provided
    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.any(Array)
    );

    // Verify error was passed to next since match_id is required
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "match_id is required"
      })
    );

    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should successfully add a substitute player with numeric match_id", async () => {
    const requestWithMatchId = {
      ...mockRequest,
      body: { match_id: 123, ticket_number: "TICKET-123" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock database connection for transaction
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn()
    };
    mockGetConnection.mockResolvedValue(mockConnection as never);

    const seasonPlayerRank = createMockSeasonPlayerRank({
      id: 1,
      cs2_rank: 15000,
      faceit_level: 5,
      faceit_elo: 1500,
      cs_hours: 1000,
      kana_elo: 150
    });

    // Set up mockImplementation for runQuery
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      // Log all queries for debugging
      const queryPreview = query.replace(/\s+/g, " ").substring(0, 100);
      console.log(`[Substitute Player Test] Query: ${queryPreview}`);

      if (query.includes("SELECT COUNT(*)") && query.includes("MatchTeams")) {
        // ensureMatchIdAndTeamIdMatches COUNT query
        console.log("  -> Matched COUNT query");
        return Promise.resolve([{ count: 1 }]);
      }
      if (
        query.includes("SELECT") &&
        query.includes("SeasonPlayerRanks") &&
        query.includes("season_id") &&
        query.includes("steam_id")
      ) {
        // SeasonPlayerRanks check - match with flexible spacing
        console.log("  -> Matched SeasonPlayerRanks query");
        return Promise.resolve([seasonPlayerRank]);
      }
      if (
        query.includes("SELECT sl.tier") &&
        query.includes("SeasonLeagueTeams")
      ) {
        // Tier query
        console.log("  -> Matched tier query");
        return Promise.resolve([{ tier: 2 }]);
      }
      if (query.includes("INSERT INTO SeasonTeamPlayers")) {
        // INSERT query
        console.log("  -> Matched INSERT query");
        return Promise.resolve({ insertId: 1 });
      }
      // Default: return empty array
      console.log("  -> WARNING: Unmocked query, returning empty array");
      return Promise.resolve([]);
    });

    // Mock resolveMatchId to return the same numeric ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);

    // Mock external service calls that might be made if player data is incomplete
    // But since we're returning complete data, these shouldn't be called
    const mockPlayerRankModels = require("../../models/season-player-ranks.models");
    if (mockPlayerRankModels.insertPlayerRankForSeason) {
      mockPlayerRankModels.insertPlayerRankForSeason.mockResolvedValueOnce(
        undefined
      );
    }

    // Mock eligibility check (it's mocked, so internal queries won't be called)
    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 150,
      newAvgWithPlayer: 198
    });

    // Mock setPlayerKanaElo - ensure it's set up correctly
    mockPlayerModels.setPlayerKanaElo.mockClear();
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    console.log("Controller finished. Checking results...");
    console.log("mockNext calls:", mockNext.mock.calls.length);
    if (mockNext.mock.calls.length > 0) {
      console.log("Error:", mockNext.mock.calls[0][0]?.message);
    }
    console.log(
      "checkPlayerAdditionEligibility calls:",
      mockSeasonModels.checkPlayerAdditionEligibility.mock.calls.length
    );
    console.log(
      "setPlayerKanaElo calls:",
      mockPlayerModels.setPlayerKanaElo.mock.calls.length
    );
    console.log(
      "runQuery calls:",
      (mockRunQuery as jest.Mock).mock.calls.length
    );

    // Verify match ID was resolved
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith("123", 14);

    // Verify eligibility check WAS performed (for non-tier1)
    expect(mockSeasonModels.checkPlayerAdditionEligibility).toHaveBeenCalled();

    // Verify substitute player was added with resolved match_id
    // The INSERT query should include role, match_id, and ticket_number
    const insertCalls = (mockRunQuery as jest.Mock).mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "string" &&
        call[0].includes("INSERT INTO SeasonTeamPlayers")
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    // Check if any INSERT call has the substitute player data
    const hasSubstituteInsert = insertCalls.some((call) => {
      const query = call[0] as string;
      const params = call[1] as any[];
      return (
        query.includes("role") &&
        query.includes("match_id") &&
        query.includes("ticket_number") &&
        params.includes("substitute") &&
        params.includes(123) &&
        params.includes("TICKET-123")
      );
    });
    expect(hasSubstituteInsert).toBe(true);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 123,
      replaces_steam_id: null,
      ticket_number: "TICKET-123"
    });
  });

  it("should validate match_id format when provided", async () => {
    const requestWithInvalidMatchId = {
      ...mockRequest,
      body: { match_id: "invalid", ticket_number: "TICKET-123" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to throw validation error
    const validationError = new Error("Invalid match ID format: invalid");
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(validationError);

    // Error will propagate to Express error handler via next()
    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(validationError);

    // Verify match ID resolution was attempted
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith("invalid", 14);

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify no insertion was attempted
    expect(mockRunQuery).not.toHaveBeenCalled();

    // Verify no success response was sent
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should handle database transaction errors", async () => {
    const requestWithMatchId = {
      ...mockRequest,
      body: { match_id: 123, ticket_number: "TICKET-123" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock database connection for transaction
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn()
    };
    mockGetConnection.mockResolvedValue(mockConnection as never);

    const dbError = new Error("Database error");

    // Set up mockImplementation for runQuery - throw error on SeasonPlayerRanks query
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      if (query.includes("SELECT COUNT(*)") && query.includes("MatchTeams")) {
        // ensureMatchIdAndTeamIdMatches COUNT query
        return Promise.resolve([{ count: 1 }]);
      }
      if (
        query.includes("SELECT") &&
        query.includes("SeasonPlayerRanks") &&
        query.includes("season_id = ?") &&
        query.includes("steam_id = ?")
      ) {
        // SeasonPlayerRanks check - throw error here
        return Promise.reject(dbError);
      }
      return Promise.resolve([]);
    });

    // Mock resolveMatchId to return the same numeric ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);

    // Error will propagate to Express error handler via next()
    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(dbError);

    // Verify no eligibility check was performed
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify no success response was sent
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should resolve Faceit room ID to match ID when provided", async () => {
    const requestWithFaceitRoomId = {
      ...mockRequest,
      body: {
        match_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
        ticket_number: "TICKET-456"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock database connection for transaction
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn()
    };
    mockGetConnection.mockResolvedValue(mockConnection as never);

    const seasonPlayerRank = createMockSeasonPlayerRank({
      id: 1,
      cs2_rank: 15000,
      faceit_level: 5,
      faceit_elo: 1500,
      cs_hours: 1000,
      kana_elo: 150
    });

    // Set up mockImplementation for runQuery
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      if (query.includes("SELECT COUNT(*)") && query.includes("MatchTeams")) {
        // ensureMatchIdAndTeamIdMatches COUNT query
        return Promise.resolve([{ count: 1 }]);
      }
      if (
        query.includes("SELECT") &&
        query.includes("SeasonPlayerRanks") &&
        query.includes("season_id = ?") &&
        query.includes("steam_id = ?")
      ) {
        // SeasonPlayerRanks check
        return Promise.resolve([seasonPlayerRank]);
      }
      if (
        query.includes("SELECT sl.tier") &&
        query.includes("SeasonLeagueTeams")
      ) {
        // Tier query - tier 1 (Masters) to skip eligibility
        return Promise.resolve([{ tier: 1 }]);
      }
      if (query.includes("INSERT INTO SeasonTeamPlayers")) {
        // INSERT query
        return Promise.resolve({ insertId: 1 });
      }
      return Promise.resolve([]);
    });

    // Mock resolveMatchId to return internal match ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(456);

    await addSubstitutePlayerController(
      requestWithFaceitRoomId,
      mockResponse,
      mockNext
    );

    // Verify match ID was resolved
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
      14
    );

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.arrayContaining([
        14,
        1650,
        EligiblePlayerForValidationSteamId,
        "substitute",
        456,
        "TICKET-456"
      ]),
      expect.any(Object)
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 456,
      replaces_steam_id: null,
      ticket_number: "TICKET-456"
    });
  });

  it("should resolve Faceit URL to match ID when provided", async () => {
    const requestWithFaceitUrl = {
      ...mockRequest,
      body: {
        match_id: "https://www.faceit.com/en/cs2/room/1-abc123-def456-ghi789",
        ticket_number: "TICKET-789"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock database connection for transaction
    const mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      execute: jest.fn()
    };
    mockGetConnection.mockResolvedValue(mockConnection as never);

    // Mock resolveMatchId to return internal match ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(789);
    // Mock ensureMatchIdAndTeamIdMatches COUNT query
    mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);
    // Mock SeasonPlayerRanks check - player already has complete data
    mockRunQuery.mockResolvedValueOnce([
      createMockSeasonPlayerRank({
        id: 1,
        cs2_rank: 15000,
        faceit_level: 5,
        faceit_elo: 1500,
        cs_hours: 1000,
        kana_elo: 150
      })
    ]);
    // Mock tier query - tier 1 (Masters) to skip eligibility
    mockRunQuery.mockResolvedValueOnce([{ tier: 1 }]);
    // Mock successful insertion
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    await addSubstitutePlayerController(
      requestWithFaceitUrl,
      mockResponse,
      mockNext
    );

    // Verify match ID was resolved
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "https://www.faceit.com/en/cs2/room/1-abc123-def456-ghi789",
      14
    );

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.arrayContaining([
        14,
        1650,
        EligiblePlayerForValidationSteamId,
        "substitute",
        789,
        "TICKET-789"
      ]),
      expect.any(Object)
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 789,
      replaces_steam_id: null,
      ticket_number: "TICKET-789"
    });
  });

  it("should handle match ID resolution errors", async () => {
    const requestWithInvalidMatchId = {
      ...mockRequest,
      body: { match_id: "invalid-match-id", ticket_number: "TICKET-123" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to throw error
    const resolutionError = new Error(
      "Invalid match ID format: invalid-match-id"
    );
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(resolutionError);

    // Error will propagate to Express error handler via next()
    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(resolutionError);

    // Verify match ID resolution was attempted
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "invalid-match-id",
      14
    );

    // Verify no insertion was attempted
    expect(mockRunQuery).not.toHaveBeenCalled();

    // Verify no success response was sent
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});

describe("preparePlayerForSignupController", () => {
  const testSteamId = "76561198012345678";
  const normalizedSteamId = "76561198012345678";

  const mockRequest = {
    params: {
      steam_id: testSteamId
    }
  } as unknown as RequestWithParams<{
    steam_id: string;
  }>;

  const mockResponse = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis()
  } as unknown as Response;

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockResponse.json as jest.Mock).mockClear();
    (mockResponse.status as jest.Mock).mockClear();
    mockNext.mockClear();
  });

  it("should successfully prepare player for signup", async () => {
    // Mock normalizeSteamId
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

    // Mock preparePlayerForSignup
    mockPlayerModels.preparePlayerForSignup.mockResolvedValueOnce({
      account_id: 123,
      steam_id: normalizedSteamId,
      changes_made: true
    });

    await preparePlayerForSignupController(mockRequest, mockResponse, mockNext);

    expect(mockSteamIdValidator.normalizeSteamId).toHaveBeenCalledWith(
      testSteamId
    );
    expect(mockPlayerModels.preparePlayerForSignup).toHaveBeenCalledWith(
      normalizedSteamId
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Player prepared for signup successfully",
      account_id: 123,
      steam_id: normalizedSteamId,
      changes_made: true
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return info message when profile was already valid", async () => {
    // Mock normalizeSteamId
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

    // Mock preparePlayerForSignup - no changes made
    mockPlayerModels.preparePlayerForSignup.mockResolvedValueOnce({
      account_id: 123,
      steam_id: normalizedSteamId,
      changes_made: false
    });

    await preparePlayerForSignupController(mockRequest, mockResponse, mockNext);

    expect(mockSteamIdValidator.normalizeSteamId).toHaveBeenCalledWith(
      testSteamId
    );
    expect(mockPlayerModels.preparePlayerForSignup).toHaveBeenCalledWith(
      normalizedSteamId
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Profile was already valid, no changes were made",
      account_id: 123,
      steam_id: normalizedSteamId,
      changes_made: false
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle invalid Steam ID format", async () => {
    const invalidSteamId = "invalid-steam-id";
    const requestWithInvalidId = {
      params: {
        steam_id: invalidSteamId
      }
    } as unknown as RequestWithParams<{
      steam_id: string;
    }>;

    const badRequestError = new Error("Invalid Steam ID format");
    // Mock normalizeSteamId to throw error
    mockSteamIdValidator.normalizeSteamId.mockImplementation(() => {
      throw badRequestError;
    });

    await preparePlayerForSignupController(
      requestWithInvalidId,
      mockResponse,
      mockNext
    );

    expect(mockSteamIdValidator.normalizeSteamId).toHaveBeenCalledWith(
      invalidSteamId
    );
    expect(mockPlayerModels.preparePlayerForSignup).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(badRequestError);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should handle database errors from preparePlayerForSignup", async () => {
    // Mock normalizeSteamId
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

    // Mock preparePlayerForSignup to throw error
    const dbError = new Error("Database error");
    mockPlayerModels.preparePlayerForSignup.mockRejectedValueOnce(dbError);

    await preparePlayerForSignupController(mockRequest, mockResponse, mockNext);

    expect(mockSteamIdValidator.normalizeSteamId).toHaveBeenCalledWith(
      testSteamId
    );
    expect(mockPlayerModels.preparePlayerForSignup).toHaveBeenCalledWith(
      normalizedSteamId
    );
    expect(mockNext).toHaveBeenCalledWith(dbError);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should normalize SteamID format before processing", async () => {
    const steamId3 = "[U:1:12345678]";
    const normalizedId = "76561198012345678";

    const requestWithSteamId3 = {
      params: {
        steam_id: steamId3
      }
    } as unknown as RequestWithParams<{
      steam_id: string;
    }>;

    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedId);
    mockPlayerModels.preparePlayerForSignup.mockResolvedValueOnce({
      account_id: 123,
      steam_id: normalizedId,
      changes_made: false
    });

    await preparePlayerForSignupController(
      requestWithSteamId3,
      mockResponse,
      mockNext
    );

    expect(mockSteamIdValidator.normalizeSteamId).toHaveBeenCalledWith(
      steamId3
    );
    expect(mockPlayerModels.preparePlayerForSignup).toHaveBeenCalledWith(
      normalizedId
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Profile was already valid, no changes were made",
      account_id: 123,
      steam_id: normalizedId,
      changes_made: false
    });
  });
});
