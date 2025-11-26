import type { Response } from "express";
import {
  EligiblePlayerForValidationSteamId,
  type RequestWithParams
} from "@eggosystem/types";
import {
  addPlayerToTeamController,
  addSubstitutePlayerController,
  preparePlayerForSignupController
} from "./player.controllers";
import * as seasonModels from "../../models/dashboard/season.models";
import * as playerModels from "../../models/player.models";
import * as rankModels from "../../models/season-player-ranks.models";
import { runQuery } from "../../db/mysqlRunQuery";
import * as matchUtils from "../../utils/matchUtils";
import * as steamIdValidator from "../../utils/steam-id-validator";
import * as playerRankServices from "../../services/player-ranks.services";
import * as faceitServices from "../../services/faceit.services";
import * as dbConnection from "../../db/mysqlConnection";

// Mock dependencies
jest.mock("../../models/dashboard/season.models");
jest.mock("../../models/player.models");
jest.mock("../../models/season-player-ranks.models");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/matchUtils");
jest.mock("../../utils/steam-id-validator");
jest.mock("../../services/player-ranks.services");
jest.mock("../../services/faceit.services");
jest.mock("../../db/mysqlConnection");

const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;
const mockPlayerModels = playerModels as jest.Mocked<typeof playerModels>;
const mockRankModels = rankModels as jest.Mocked<typeof rankModels>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockMatchUtils = matchUtils as jest.Mocked<typeof matchUtils>;
const mockSteamIdValidator = steamIdValidator as jest.Mocked<
  typeof steamIdValidator
>;
const mockPlayerRankServices = playerRankServices as jest.Mocked<
  typeof playerRankServices
>;
const mockFaceitServices = faceitServices as jest.Mocked<typeof faceitServices>;
const mockGetConnection = dbConnection.getConnection as jest.MockedFunction<
  typeof dbConnection.getConnection
>;

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
    }
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
  });

  it("should add an eligible player to the team", async () => {
    // Mock player rank data in SeasonPlayerRanks
    mockRunQuery.mockResolvedValueOnce([
      {
        id: 1,
        cs2_rank: 15,
        faceit_level: 7,
        faceit_elo: 2000,
        cs_hours: 1500,
        kana_elo: 200
      }
    ]);

    // Mock tier query - return tier 2 (not tier 1, so eligibility check will be enforced)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    // Mock eligibility check
    mockSeasonModels.checkPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: 1650,
        team_name: "Test Team",
        current_top3_avg: 205,
        current_top4_avg: 200,
        new_player_kana_elo: 200,
        new_avg_with_player: 204
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg4: 210, rank: 1 }
      ],
      canAddPlayer: true,
      league_name: "Test League"
    });

    // Mock getPlayerDetailsForDashboardBySteamId query
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: EligiblePlayerForValidationSteamId,
        nickname: "Test Player",
        account_id: 123,
        discord: "test#1234",
        work_email_verified: true,
        work_email: "test@example.com",
        is_work_email_personal_email: false,
        is_valid_work_email: true,
        is_valid_full_name: true
      }
    ]);

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success) - insertSeasonTeamPlayer
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

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

    // Verify player kana_elo was set
    expect(mockPlayerModels.setPlayerKanaElo).toHaveBeenCalledWith(
      EligiblePlayerForValidationSteamId,
      200,
      expect.any(String),
      14,
      undefined, // offered_elo parameter
      expect.any(Object) // connection parameter
    );

    // Verify player was added to team
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: expect.any(String),
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      kana_elo: 200
    });

    // Verify next was not called with errors
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should create player data if missing in SeasonPlayerRanks", async () => {
    // Mock empty player data - not found in SeasonPlayerRanks
    mockRunQuery.mockResolvedValueOnce([]);

    // Mock external services for fetching player data
    mockPlayerRankServices.getCSRank.mockResolvedValueOnce({
      average_rank: 15000,
      rank_updated_at: null
    });
    mockPlayerRankServices.getPlayerHoursForSteamAppId.mockResolvedValueOnce({
      hours: 1000
    });
    mockFaceitServices.getFaceITCS2Rank.mockResolvedValueOnce({
      faceit_level: 5,
      faceit_elo: 1500,
      faceit_kd: 1.2,
      faceit_date: new Date("2024-01-01").getTime(),
      metadata: {
        faceit_decay: false
      }
    });

    // Mock tier query - return tier 2 (not tier 1, so eligibility check will be enforced)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    // Mock eligibility check
    mockSeasonModels.checkPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: 1650,
        team_name: "Test Team",
        current_top3_avg: 205,
        current_top4_avg: 200,
        new_player_kana_elo: 200,
        new_avg_with_player: 204
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg4: 210, rank: 1 }
      ],
      canAddPlayer: true,
      league_name: "Test League"
    });

    // Mock getPlayerDetailsForDashboardBySteamId query
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: EligiblePlayerForValidationSteamId,
        nickname: "Test Player",
        account_id: 123,
        discord: "test#1234",
        work_email_verified: true,
        work_email: "test@example.com",
        is_work_email_personal_email: false,
        is_valid_work_email: true,
        is_valid_full_name: true
      }
    ]);

    // Mock FACEIT player rank insertion
    mockRankModels.insertPlayerRankForSeason.mockResolvedValueOnce(
      {} as unknown
    );

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success) - insertSeasonTeamPlayer
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify player data was created
    expect(mockRankModels.insertPlayerRankForSeason).toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("should reject ineligible players", async () => {
    // Mock player rank data in SeasonPlayerRanks
    mockRunQuery.mockResolvedValueOnce([
      {
        id: 1,
        cs2_rank: 15,
        faceit_level: 7,
        faceit_elo: 2000,
        cs_hours: 1500,
        kana_elo: 300
      }
    ]);

    // Mock tier query - return tier 2 (not tier 1, so eligibility check will be enforced)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    // Mock eligibility check with ineligible result
    mockSeasonModels.checkPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: 1650,
        team_name: "Test Team",
        current_top3_avg: 205,
        current_top4_avg: 210,
        new_player_kana_elo: 300,
        new_avg_with_player: 220
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg4: 210, rank: 1 }
      ],
      canAddPlayer: false,
      league_name: "Test League"
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
    // Mock player rank data in SeasonPlayerRanks
    mockRunQuery.mockResolvedValueOnce([
      {
        id: 1,
        cs2_rank: 15,
        faceit_level: 7,
        faceit_elo: 2000,
        cs_hours: 1500,
        kana_elo: 200
      }
    ]);

    // Mock tier query - return tier 2 (not tier 1, so eligibility check will be enforced)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    // Mock eligibility check
    mockSeasonModels.checkPlayerAdditionEligibility.mockResolvedValueOnce({
      selectedTeam: {
        team_id: 1650,
        team_name: "Test Team",
        current_top3_avg: 205,
        current_top4_avg: 200,
        new_player_kana_elo: 200,
        new_avg_with_player: 204
      },
      topTeamsInLeague: [
        { team_id: 1, team_name: "Top Team", avg4: 210, rank: 1 }
      ],
      canAddPlayer: true,
      league_name: "Test League"
    });

    // Mock getPlayerDetailsForDashboardBySteamId query
    mockRunQuery.mockResolvedValueOnce([
      {
        steam_id: EligiblePlayerForValidationSteamId,
        nickname: "Test Player",
        account_id: 123,
        discord: "test#1234",
        work_email_verified: true,
        work_email: "test@example.com",
        is_work_email_personal_email: false,
        is_valid_work_email: true,
        is_valid_full_name: true
      }
    ]);

    // Mock setPlayerKanaElo failing by throwing an error
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
      body: { match_id: 123 }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to return the same numeric ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);
    // Mock ensureMatchIdAndTeamIdMatches COUNT query
    mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);
    // Mock successful insertion
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    // Verify match ID was resolved
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith("123", 14);

    // Verify no eligibility check was performed
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 123],
      undefined
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 123
    });
  });

  it("should validate match_id format when provided", async () => {
    const requestWithInvalidMatchId = {
      ...mockRequest,
      body: { match_id: "invalid" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to throw validation error
    const validationError = new Error("Invalid match ID format: invalid");
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(validationError);

    // Error will propagate to Express error handler
    await expect(
      addSubstitutePlayerController(
        requestWithInvalidMatchId,
        mockResponse,
        mockNext
      )
    ).rejects.toThrow("Invalid match ID format: invalid");

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
      body: { match_id: 123 }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to return the same numeric ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(123);

    // Mock database error
    const dbError = new Error("Database error");
    mockRunQuery.mockRejectedValueOnce(dbError);

    // Error will propagate to Express error handler
    await expect(
      addSubstitutePlayerController(requestWithMatchId, mockResponse, mockNext)
    ).rejects.toThrow("Database error");

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
      body: { match_id: "1-ff5e99c3-0765-4173-ba2a-398987b1b3ef" }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to return internal match ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(456);
    // Mock ensureMatchIdAndTeamIdMatches COUNT query
    mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);
    // Mock successful insertion
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

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
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 456],
      undefined
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 456
    });
  });

  it("should resolve Faceit URL to match ID when provided", async () => {
    const requestWithFaceitUrl = {
      ...mockRequest,
      body: {
        match_id: "https://www.faceit.com/en/cs2/room/1-abc123-def456-ghi789"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      team_id: string;
      steam_id: string;
    }>;

    // Mock resolveMatchId to return internal match ID
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce(789);
    // Mock ensureMatchIdAndTeamIdMatches COUNT query
    mockRunQuery.mockResolvedValueOnce([{ count: 1 }]);
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
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 789],
      undefined
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: 789
    });
  });

  it("should handle match ID resolution errors", async () => {
    const requestWithInvalidMatchId = {
      ...mockRequest,
      body: { match_id: "invalid-match-id" }
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

    // Error will propagate to Express error handler
    await expect(
      addSubstitutePlayerController(
        requestWithInvalidMatchId,
        mockResponse,
        mockNext
      )
    ).rejects.toThrow("Invalid match ID format: invalid-match-id");

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
