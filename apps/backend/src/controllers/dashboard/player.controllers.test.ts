import type { Response } from "express";
import type { RequestWithParams } from "@eggosystem/types";
import { addPlayerToTeamController } from "./player.controllers";
import * as seasonModels from "../../models/dashboard/season.models";
import * as playerModels from "../../models/player.models";
import * as rankModels from "../../models/season-player-ranks.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock dependencies
jest.mock("../../models/dashboard/season.models");
jest.mock("../../models/player.models");
jest.mock("../../models/season-player-ranks.models");
jest.mock("../../db/mysqlRunQuery");

const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;
const mockPlayerModels = playerModels as jest.Mocked<typeof playerModels>;
const mockRankModels = rankModels as jest.Mocked<typeof rankModels>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("addPlayerToTeamController", () => {
  // Create test objects
  const mockRequest = {
    params: {
      season_id: "14",
      team_id: "1650",
      steam_id: "76561198054765387"
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

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success)
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify eligibility was checked
    expect(
      mockSeasonModels.checkPlayerAdditionEligibility
    ).toHaveBeenCalledWith(14, 1650, "76561198054765387", expect.any(Object));

    // Verify player kana_elo was set
    expect(mockPlayerModels.setPlayerKanaElo).toHaveBeenCalledWith(
      "76561198054765387",
      200,
      expect.any(String),
      14,
      undefined, // offered_elo parameter
      expect.any(Object) // connection parameter
    );

    // Verify player was added to team
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      [14, 1650, "76561198054765387"],
      expect.any(Object)
    );

    // Verify success response
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: expect.any(String),
      steam_id: "76561198054765387",
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
    mockRankModels.insertFaceITPlayerRankForSeason.mockResolvedValueOnce(
      {} as unknown
    );

    // Mock setPlayerKanaElo
    mockPlayerModels.setPlayerKanaElo.mockResolvedValueOnce(true);

    // Mock team player query (success)
    mockRunQuery.mockResolvedValueOnce({ affectedRows: 1 });

    // Call the controller
    await addPlayerToTeamController(mockRequest, mockResponse, mockNext);

    // Verify player data was created
    expect(mockRankModels.insertFaceITPlayerRankForSeason).toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.any(Array),
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
    ).toHaveBeenCalledWith(14, 1650, "76561198054765387", expect.any(Object));

    // Verify player was NOT added to team (query not called)
    expect(mockRunQuery).not.toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO SeasonTeamPlayers"),
      expect.any(Array)
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
