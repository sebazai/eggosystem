import type { Response } from "express";
import {
  EligiblePlayerForValidationSteamId,
  type RequestWithParams
} from "@eggosystem/types";
import {
  addPlayerToTeamController,
  addSubstitutePlayerController
} from "./player.controllers";
import * as seasonModels from "../../models/dashboard/season.models";
import * as playerModels from "../../models/player.models";
import * as rankModels from "../../models/season-player-ranks.models";
import { runQuery } from "../../db/mysqlRunQuery";
import * as matchUtils from "../../utils/matchUtils";

// Mock dependencies
jest.mock("../../models/dashboard/season.models");
jest.mock("../../models/player.models");
jest.mock("../../models/season-player-ranks.models");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/matchUtils");

const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;
const mockPlayerModels = playerModels as jest.Mocked<typeof playerModels>;
const mockRankModels = rankModels as jest.Mocked<typeof rankModels>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockMatchUtils = matchUtils as jest.Mocked<typeof matchUtils>;

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

    // Mock tier query - return tier 2 (not tier 1, so eligibility check will be enforced)
    mockRunQuery.mockResolvedValueOnce([{ tier: 2 }]);

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success)
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

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

    // Mock FACEIT player rank insertion
    mockRankModels.insertPlayerRankForSeason.mockResolvedValueOnce(
      {} as unknown
    );

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success)
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

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
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute"],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: null
    });

    expect(mockNext).not.toHaveBeenCalled();
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
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce([123]);
    // Mock successful insertion
    mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    // Verify match ID was resolved
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "123",
      14,
      expect.any(Object)
    );

    // Verify no eligibility check was performed
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 123],
      expect.any(Object)
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: [123]
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
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(
      new Error("Invalid match ID format: invalid")
    );

    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    // Verify match ID resolution was attempted
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "invalid",
      14,
      expect.any(Object)
    );

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid match ID format: invalid"
      })
    );

    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();
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
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce([123]);

    // Mock database error
    const dbError = new Error("Database error");
    mockRunQuery.mockRejectedValueOnce(dbError);

    await addSubstitutePlayerController(
      requestWithMatchId,
      mockResponse,
      mockNext
    );

    // Verify no eligibility check was performed
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).not.toHaveBeenCalled();

    // Verify the error was properly caught and passed to next
    expect(mockNext).toHaveBeenCalledWith(dbError);
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
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce([456]);
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
      14,
      expect.any(Object)
    );

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 456],
      expect.any(Object)
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: [456]
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
    mockMatchUtils.resolveMatchId.mockResolvedValueOnce([789]);
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
      14,
      expect.any(Object)
    );

    // Verify substitute player was added with resolved match_id
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute", 789],
      expect.any(Object)
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Substitute player successfully added to the team",
      steam_id: EligiblePlayerForValidationSteamId,
      team_id: 1650,
      season_id: 14,
      role: "substitute",
      match_id: [789]
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
    mockMatchUtils.resolveMatchId.mockRejectedValueOnce(
      new Error("Invalid match ID format: invalid-match-id")
    );

    await addSubstitutePlayerController(
      requestWithInvalidMatchId,
      mockResponse,
      mockNext
    );

    // Verify match ID resolution was attempted
    expect(mockMatchUtils.resolveMatchId).toHaveBeenCalledWith(
      "invalid-match-id",
      14,
      expect.any(Object)
    );

    // Verify error was passed to next middleware
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid match ID format: invalid-match-id"
      })
    );

    // Verify no insertion was attempted
    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, EligiblePlayerForValidationSteamId, "substitute"],
      expect.any(Object)
    );
  });
});
