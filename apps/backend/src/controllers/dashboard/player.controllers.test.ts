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
import * as seasonPlayerRanksModels from "../../models/season-player-ranks.models";
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
const mockSeasonPlayerRanksModels = seasonPlayerRanksModels as jest.Mocked<
  typeof seasonPlayerRanksModels
>;
const mockGetConnection = dbConnection.getConnection as jest.MockedFunction<
  typeof dbConnection.getConnection
>;

/**
 * Creates a mock database connection for transaction testing
 */
const createMockConnection = () => ({
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
  execute: jest.fn()
});

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

/**
 * Sets up common query mocks for addPlayerToTeamController tests
 */
const setupAddPlayerQueryMocks = (options?: {
  primaryPlayers?: Array<{ steam_id: string }>;
  tier?: number;
  playerProfile?: ReturnType<typeof createMockPlayerProfile>;
}) => {
  const {
    primaryPlayers = [
      { steam_id: "76561198000000001" },
      { steam_id: "76561198000000002" }
    ],
    tier = 2,
    playerProfile = createMockPlayerProfile()
  } = options || {};

  (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
    if (!query || query.trim() === "") {
      return Promise.resolve([]);
    }

    if (
      query.includes("SELECT steam_id FROM SeasonTeamPlayers") &&
      query.includes("discarded_at IS NULL") &&
      !query.includes("role = 'primary'")
    ) {
      return Promise.resolve([]);
    }
    if (
      query.includes("SELECT id FROM SeasonTeamPlayers") &&
      query.includes("discarded_at IS NOT NULL")
    ) {
      return Promise.resolve([]);
    }
    if (
      query.includes("SELECT steam_id FROM SeasonTeamPlayers") &&
      query.includes("role = 'primary'")
    ) {
      return Promise.resolve(primaryPlayers);
    }
    if (
      query.includes("SELECT sl.tier") &&
      query.includes("SeasonLeagueTeams")
    ) {
      return Promise.resolve([{ tier }]);
    }
    if (
      query.includes("SteamPlayers") &&
      query.includes("Accounts") &&
      (query.includes("steam_id = ?") || query.includes("p.steam_id = ?"))
    ) {
      return Promise.resolve(playerProfile);
    }
    if (query.includes("INSERT INTO SeasonTeamPlayers")) {
      return Promise.resolve({ insertId: 1 });
    }
    return Promise.resolve([]);
  });
};

/**
 * Sets up common query mocks for addSubstitutePlayerController tests
 */
const setupSubstitutePlayerQueryMocks = (options?: {
  seasonPlayerRank?: ReturnType<typeof createMockSeasonPlayerRank>;
  tier?: number;
  matchCount?: number;
}) => {
  const {
    seasonPlayerRank = createMockSeasonPlayerRank({
      id: 1,
      cs2_rank: 15000,
      faceit_level: 5,
      faceit_elo: 1500,
      cs_hours: 1000,
      kana_elo: 150
    }),
    tier = 2,
    matchCount = 1
  } = options || {};

  (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
    if (!query || query.trim() === "") {
      return Promise.resolve([]);
    }

    if (query.includes("SELECT COUNT(*)") && query.includes("MatchTeams")) {
      return Promise.resolve([{ count: matchCount }]);
    }
    if (
      query.includes("SELECT") &&
      query.includes("SeasonPlayerRanks") &&
      query.includes("season_id") &&
      query.includes("steam_id")
    ) {
      return Promise.resolve([seasonPlayerRank]);
    }
    if (
      query.includes("SELECT sl.tier") &&
      query.includes("SeasonLeagueTeams")
    ) {
      return Promise.resolve([{ tier }]);
    }
    if (query.includes("INSERT INTO SeasonTeamPlayers")) {
      return Promise.resolve({ insertId: 1 });
    }
    return Promise.resolve([]);
  });
};

describe("addPlayerToTeamController", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    (mockRunQuery as jest.Mock).mockReset();
    (mockResponse.json as jest.Mock).mockClear();
    (mockResponse.status as jest.Mock).mockClear();
    mockNext.mockClear();

    mockGetConnection.mockResolvedValue(createMockConnection() as never);

    mockSeasonModelsBase.getSeasonByIdOrThrow.mockResolvedValue({
      id: 14,
      max_players: 9,
      active_map_pool: [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }]
    } as never);

    mockSeasonModels.checkPlayerAdditionEligibility.mockClear();
  });

  it("should add an eligible player to the team", async () => {
    const playerProfile = createMockPlayerProfile();

    setupAddPlayerQueryMocks({ playerProfile });

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

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

    const insertCalls = (mockRunQuery as jest.Mock).mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "string" &&
        call[0].includes("INSERT INTO SeasonTeamPlayers")
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    const hasCorrectInsert = insertCalls.some((call) => {
      const params = call[1] as unknown[];
      return (
        params.includes(14) &&
        params.includes(1650) &&
        params.includes(EligiblePlayerForValidationSteamId)
      );
    });
    expect(hasCorrectInsert).toBe(true);

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

  it("should reactivate a discarded player with UPDATE instead of INSERT", async () => {
    const playerProfile = createMockPlayerProfile();

    setupAddPlayerQueryMocks({ playerProfile });

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    const mockImpl = (mockRunQuery as jest.Mock).getMockImplementation();
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (
        query.includes("SELECT id FROM SeasonTeamPlayers") &&
        query.includes("discarded_at IS NOT NULL")
      ) {
        return Promise.resolve([{ id: 999 }]);
      }
      if (typeof mockImpl === "function") {
        return mockImpl(query);
      }
      return Promise.resolve([]);
    });

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringMatching(
        /UPDATE SeasonTeamPlayers SET[\s\S]*discarded_at = NULL/
      ),
      [null, 999],
      expect.any(Object)
    );
    const insertCalls = (mockRunQuery as jest.Mock).mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "string" &&
        call[0].includes("INSERT INTO SeasonTeamPlayers")
    );
    expect(insertCalls.length).toBe(0);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should reject when player is already an active roster member", async () => {
    const playerProfile = createMockPlayerProfile();

    setupAddPlayerQueryMocks({ playerProfile });

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    const mockImpl = (mockRunQuery as jest.Mock).getMockImplementation();
    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (
        query.includes("SELECT steam_id FROM SeasonTeamPlayers") &&
        query.includes("discarded_at IS NULL") &&
        !query.includes("role = 'primary'")
      ) {
        return Promise.resolve([
          { steam_id: EligiblePlayerForValidationSteamId }
        ]);
      }
      if (typeof mockImpl === "function") {
        return mockImpl(query);
      }
      return Promise.resolve([]);
    });

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const err = mockNext.mock.calls[0][0] as Error;
    expect(err.message).toContain("already on this team");
    expect(mockPlayerModels.setPlayerKanaElo).not.toHaveBeenCalled();
  });

  it("should persist optional ticket_number when adding a player", async () => {
    const playerProfile = createMockPlayerProfile();

    setupAddPlayerQueryMocks({ playerProfile });

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    const requestWithTicket = {
      ...mockRequest,
      body: {
        kana_elo: 200,
        calculus: { test: "data" },
        ticket_number: "HD-777"
      }
    } as typeof mockRequest;

    await addPlayerToTeamController(requestWithTicket, mockResponse, mockNext);

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "HD-777"],
      expect.any(Object)
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should create player data if missing in SeasonPlayerRanks", async () => {
    setupAddPlayerQueryMocks();

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    expect(
      mockPlayerRankServices.ensurePlayerRankDataExists
    ).toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId],
      expect.any(Object)
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should reject ineligible players", async () => {
    setupAddPlayerQueryMocks();

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    // ensureSeasonMaxPlayersForTeam -> getPrimaryPlayersForTeam runs first (consumes first runQuery)
    mockRunQuery.mockResolvedValueOnce([{ steam_id: "76561198000000001" }]);
    // getPlayerDetailsForDashboardBySteamId (profile validation) must return valid profile so flow reaches "not eligible" path
    mockRunQuery.mockResolvedValueOnce(createMockPlayerProfile());
    // Tier query (controller runs after profile check)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    setupEligibilityMock({
      canAddPlayer: false,
      newPlayerKanaElo: 300,
      currentTop4Avg: 210,
      newAvgWithPlayer: 220
    });

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).toHaveBeenCalledWith(
      14,
      1650,
      EligiblePlayerForValidationSteamId,
      expect.any(Object)
    );

    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "primary"]
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("not eligible")
      })
    );
  });

  it("should handle database errors", async () => {
    const playerProfile = createMockPlayerProfile();

    setupAddPlayerQueryMocks({ playerProfile });

    mockSeasonModelsBase.getSeasonByIdOrThrow.mockResolvedValue({
      id: 14,
      max_players: 9,
      active_map_pool: [{ map_id: 1 }, { map_id: 2 }, { map_id: 3 }]
    } as never);

    mockSeasonModelsBase.getSeasonPlatformAndAppId.mockResolvedValueOnce({
      platform: "FACEIT" as never,
      app_id: 730
    });

    mockPlayerRankServices.ensurePlayerRankDataExists.mockResolvedValueOnce(
      undefined
    );

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 200,
      newAvgWithPlayer: 204
    });

    mockPlayerModels.setPlayerKanaElo.mockRejectedValueOnce(
      new Error("Failed to update player's kana_elo")
    );

    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

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
    (mockRunQuery as jest.Mock).mockClear();
    (mockRunQuery as jest.Mock).mockReset();
    mockPlayerModels.setPlayerKanaElo.mockClear();
    mockSeasonModels.checkPlayerAdditionEligibility.mockClear();
    mockMatchUtils.resolveMatchId.mockClear();
  });

  it("should successfully add a substitute player without match_id", async () => {
    await addSubstitutePlayerController(mockRequest, mockResponse, mockNext);

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.any(Array)
    );

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

    mockGetConnection.mockResolvedValue(createMockConnection() as never);

    setupSubstitutePlayerQueryMocks();

    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);

    if (mockSeasonPlayerRanksModels.insertPlayerRankForSeason) {
      mockSeasonPlayerRanksModels.insertPlayerRankForSeason.mockResolvedValueOnce(
        undefined
      );
    }

    setupEligibilityMock({
      canAddPlayer: true,
      newPlayerKanaElo: 150,
      newAvgWithPlayer: 198
    });

    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith("123", 14);

    expect(mockSeasonModels.checkPlayerAdditionEligibility).toHaveBeenCalled();

    const insertCalls = (mockRunQuery as jest.Mock).mock.calls.filter(
      (call) =>
        call[0] &&
        typeof call[0] === "string" &&
        call[0].includes("INSERT INTO SeasonTeamPlayers")
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    const hasSubstituteInsert = insertCalls.some((call) => {
      const query = call[0] as string;
      const params = call[1] as unknown[];
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

    const validationError = new Error("Invalid match ID format: invalid");
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(validationError);

    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(validationError);

    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith("invalid", 14);

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    expect(mockRunQuery).not.toHaveBeenCalled();

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

    mockGetConnection.mockResolvedValue(createMockConnection() as never);

    const dbError = new Error("Database error");

    (mockRunQuery as jest.Mock).mockImplementation((query: string) => {
      if (!query || query.trim() === "") {
        return Promise.resolve([]);
      }

      if (query.includes("SELECT COUNT(*)") && query.includes("MatchTeams")) {
        return Promise.resolve([{ count: 1 }]);
      }
      if (
        query.includes("SELECT") &&
        query.includes("SeasonPlayerRanks") &&
        query.includes("season_id = ?") &&
        query.includes("steam_id = ?")
      ) {
        return Promise.reject(dbError);
      }
      return Promise.resolve([]);
    });

    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(dbError);

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

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

    mockGetConnection.mockResolvedValue(createMockConnection() as never);

    setupSubstitutePlayerQueryMocks({ tier: 1 });

    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(456);

    await addSubstitutePlayerController(
      requestWithFaceitRoomId,
      mockResponse,
      mockNext
    );

    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef",
      14
    );

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

    mockGetConnection.mockResolvedValue(createMockConnection() as never);

    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(789);
    mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);
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
    mockRunQuery.mockResolvedValueOnce([{ tier: 1 }]);
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    await addSubstitutePlayerController(
      requestWithFaceitUrl,
      mockResponse,
      mockNext
    );

    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "https://www.faceit.com/en/cs2/room/1-abc123-def456-ghi789",
      14
    );

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

    const resolutionError = new Error(
      "Invalid match ID format: invalid-match-id"
    );
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(resolutionError);

    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(resolutionError);

    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "invalid-match-id",
      14
    );

    expect(mockRunQuery).not.toHaveBeenCalled();

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
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

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
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

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
    mockSteamIdValidator.normalizeSteamId.mockReturnValue(normalizedSteamId);

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
