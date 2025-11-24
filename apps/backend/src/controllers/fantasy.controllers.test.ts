import type { Response } from "express";
import { type RequestWithParams } from "@eggosystem/types";
import {
  getFantasyPlayersByLeagueController,
  createFantasyTeamController,
  getMyFantasyTeamController,
  substitutePlayerController,
  updatePlayerRolesController,
  getFantasyLeaderboardController,
  getFantasyOverallLeaderboardController,
  getFantasyPriceHistoryController,
  seedInitialPlayerValuesController,
  getTopPerformingPlayersController,
  getPlayerPointHistoryController
} from "./fantasy.controllers";
import * as fantasyModels from "../models/fantasy.models";
import { runQuery } from "../db/mysqlRunQuery";
import { calculateInitialPlayerValues } from "../services/fantasy-value.service";
import { getCurrentWeekNumberForSeason } from "../utils/week-calculation";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "../utils/errors";

// Mock dependencies
jest.mock("../models/fantasy.models");
jest.mock("../db/mysqlRunQuery");
jest.mock("../services/fantasy-value.service");
jest.mock("../utils/week-calculation");

const mockFantasyModels = fantasyModels as jest.Mocked<typeof fantasyModels>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockCalculateInitialPlayerValues =
  calculateInitialPlayerValues as jest.MockedFunction<
    typeof calculateInitialPlayerValues
  >;
const mockGetCurrentWeekNumberForSeason =
  getCurrentWeekNumberForSeason as jest.MockedFunction<
    typeof getCurrentWeekNumberForSeason
  >;

describe("Fantasy Controllers", () => {
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

  describe("getFantasyPlayersByLeagueController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        league_id: "1"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should return players for valid league", async () => {
      const mockPlayers = [
        {
          steam_id: "12345",
          nickname: "Test Player",
          team_name: "Test Team",
          player_value: 200000,
          tier: "gold"
        }
      ];

      mockFantasyModels.getFantasyPlayersByLeague.mockResolvedValue(
        mockPlayers
      );

      await getFantasyPlayersByLeagueController(mockRequest, mockResponse);

      expect(mockFantasyModels.getFantasyPlayersByLeague).toHaveBeenCalledWith(
        1,
        1
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlayers);
    });

    it("should return empty array for league with no players", async () => {
      mockFantasyModels.getFantasyPlayersByLeague.mockResolvedValue([]);

      await getFantasyPlayersByLeagueController(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe("createFantasyTeamController", () => {
    const mockRequest = {
      params: {
        season_id: "1"
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      },
      body: {
        league_id: 1,
        team_name: "My Team",
        players: [
          { steam_id: "1", role: "rifler", player_value: 200000 },
          { steam_id: "2", role: "awper", player_value: 200000 },
          { steam_id: "3", role: "rifler", player_value: 200000 },
          { steam_id: "4", role: "rifler", player_value: 200000 },
          { steam_id: "5", role: "rifler", player_value: 200000 }
        ]
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      // Mock getSteamIdFromAuth (uses runQuery)
      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);
    });

    it("should create team with valid data", async () => {
      mockFantasyModels.createFantasyTeam.mockResolvedValue(1);

      await createFantasyTeamController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.createFantasyTeam).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        team_id: 1,
        message: "Fantasy team created successfully"
      });
    });

    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: undefined
      } as unknown as RequestWithParams<{ season_id: string }>;

      await createFantasyTeamController(
        unauthenticatedRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 400 for invalid request body", async () => {
      const invalidRequest = {
        ...mockRequest,
        body: {}
      } as unknown as RequestWithParams<{ season_id: string }>;

      await createFantasyTeamController(
        invalidRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request body",
          status: 400
        })
      );
    });

    it("should return 400 if players array missing", async () => {
      const invalidRequest = {
        ...mockRequest,
        body: {
          league_id: 1
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      await createFantasyTeamController(
        invalidRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request body",
          status: 400
        })
      );
    });

    it("should handle both steam_id and player_id in request", async () => {
      const requestWithPlayerId = {
        ...mockRequest,
        body: {
          league_id: 1,
          players: [
            { player_id: "1", role: "rifler", player_value: 200000 },
            { player_id: "2", role: "awper", player_value: 200000 },
            { player_id: "3", role: "rifler", player_value: 200000 },
            { player_id: "4", role: "rifler", player_value: 200000 },
            { player_id: "5", role: "rifler", player_value: 200000 }
          ]
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      mockFantasyModels.createFantasyTeam.mockResolvedValue(1);

      await createFantasyTeamController(
        requestWithPlayerId,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.createFantasyTeam).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getMyFantasyTeamController", () => {
    const mockRequest = {
      params: {
        season_id: "1"
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);
    });

    it("should return team for authenticated user", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);

      await getMyFantasyTeamController(mockRequest, mockResponse, mockNext);

      expect(mockFantasyModels.getFantasyTeamByUser).toHaveBeenCalledWith(
        "12345",
        1
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockTeam);
    });

    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: undefined
      } as unknown as RequestWithParams<{ season_id: string }>;

      await getMyFantasyTeamController(
        unauthenticatedRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 404 if user has no team", async () => {
      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(null);

      await getMyFantasyTeamController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Fantasy team not found",
          status: 404
        })
      );
    });
  });

  describe("substitutePlayerController", () => {
    const mockRequest = {
      params: {
        season_id: "1"
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      },
      body: {
        remove_steam_id: "1",
        add_steam_id: "2",
        new_player_value: 200000,
        week_number: 1
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);
    });

    it("should substitute player successfully", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.substitutePlayer.mockResolvedValue({
        remaining_substitutions: 1
      });

      await substitutePlayerController(mockRequest, mockResponse, mockNext);

      expect(mockFantasyModels.substitutePlayer).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Player substituted successfully",
        remaining_substitutions: 1
      });
    });

    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: undefined
      } as unknown as RequestWithParams<{ season_id: string }>;

      await substitutePlayerController(
        unauthenticatedRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 400 for invalid request body", async () => {
      const invalidRequest = {
        ...mockRequest,
        body: {}
      } as unknown as RequestWithParams<{ season_id: string }>;

      await substitutePlayerController(
        invalidRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request body",
          status: 400
        })
      );
    });

    it("should return 404 if user has no team", async () => {
      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(null);

      await substitutePlayerController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Fantasy team not found",
          status: 404
        })
      );
    });

    it("should handle both steam_id and player_id in request", async () => {
      const requestWithPlayerId = {
        ...mockRequest,
        body: {
          remove_player_id: "1",
          add_player_id: "2",
          new_player_value: 200000,
          week_number: 1
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.substitutePlayer.mockResolvedValue({
        remaining_substitutions: 1
      });

      await substitutePlayerController(
        requestWithPlayerId,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.substitutePlayer).toHaveBeenCalled();
    });
  });

  describe("updatePlayerRolesController", () => {
    const mockRequest = {
      params: {
        season_id: "1"
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      },
      body: {
        role_updates: [
          { steam_id: "1", role: "rifler" },
          { steam_id: "2", role: "awper" }
        ]
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
    });

    it("should update roles successfully", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        remaining_swaps: 1
      });

      await updatePlayerRolesController(mockRequest, mockResponse, mockNext);

      expect(mockFantasyModels.updatePlayerRoles).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Player roles updated successfully",
        remaining_swaps: 1
      });
    });

    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: undefined
      } as unknown as RequestWithParams<{ season_id: string }>;

      await updatePlayerRolesController(
        unauthenticatedRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 400 for invalid request body", async () => {
      const invalidRequest = {
        ...mockRequest,
        body: {}
      } as unknown as RequestWithParams<{ season_id: string }>;

      await updatePlayerRolesController(
        invalidRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid request body",
          status: 400
        })
      );
    });

    it("should return 404 if user has no team", async () => {
      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(null);

      await updatePlayerRolesController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Fantasy team not found",
          status: 404
        })
      );
    });

    it("should handle skip_swap_limit flag", async () => {
      const requestWithSkipLimit = {
        ...mockRequest,
        body: {
          role_updates: [
            { steam_id: "1", role: "rifler" }
          ],
          skip_swap_limit: true
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        remaining_swaps: 1
      });

      await updatePlayerRolesController(
        requestWithSkipLimit,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.updatePlayerRoles).toHaveBeenCalledWith(
        1,
        expect.any(Array),
        1,
        true
      );
    });

    it("should handle both steam_id and player_id in request", async () => {
      const requestWithPlayerId = {
        ...mockRequest,
        body: {
          role_updates: [
            { player_id: "1", role: "rifler" }
          ]
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        remaining_swaps: 1
      });

      await updatePlayerRolesController(
        requestWithPlayerId,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.updatePlayerRoles).toHaveBeenCalled();
    });
  });

  describe("getFantasyLeaderboardController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        league_id: "1"
      },
      query: {}
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should return leaderboard for valid league", async () => {
      const mockLeaderboard = [
        {
          rank: 1,
          team_id: 1,
          team_name: "Team 1",
          total_points: 100
        }
      ];

      mockFantasyModels.getFantasyLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyLeaderboardController(mockRequest, mockResponse);

      expect(mockFantasyModels.getFantasyLeaderboard).toHaveBeenCalledWith(
        1,
        1,
        undefined
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockLeaderboard);
    });

    it("should highlight current user's team if steam_id provided", async () => {
      const requestWithSteamId = {
        ...mockRequest,
        query: { steam_id: "12345" }
      } as unknown as RequestWithParams<{
        season_id: string;
        league_id: string;
      }>;

      const mockLeaderboard = [
        {
          rank: 1,
          team_id: 1,
          team_name: "Team 1",
          total_points: 100,
          is_current_user: true
        }
      ];

      mockFantasyModels.getFantasyLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyLeaderboardController(requestWithSteamId, mockResponse);

      expect(mockFantasyModels.getFantasyLeaderboard).toHaveBeenCalledWith(
        1,
        1,
        "12345"
      );
    });

    it("should highlight current user's team if team_id provided", async () => {
      const requestWithTeamId = {
        ...mockRequest,
        query: { team_id: "1" }
      } as unknown as RequestWithParams<{
        season_id: string;
        league_id: string;
      }>;

      mockRunQuery.mockResolvedValue([
        { steam_id: "12345" }
      ] as never);

      const mockLeaderboard = [
        {
          rank: 1,
          team_id: 1,
          team_name: "Team 1",
          total_points: 100
        }
      ];

      mockFantasyModels.getFantasyLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyLeaderboardController(requestWithTeamId, mockResponse);

      expect(mockRunQuery).toHaveBeenCalled();
      expect(mockFantasyModels.getFantasyLeaderboard).toHaveBeenCalledWith(
        1,
        1,
        "12345"
      );
    });

    it("should return empty array for league with no teams", async () => {
      mockFantasyModels.getFantasyLeaderboard.mockResolvedValue([]);

      await getFantasyLeaderboardController(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getFantasyOverallLeaderboardController", () => {
    const mockRequest = {
      params: {
        season_id: "1"
      },
      auth: undefined
    } as unknown as RequestWithParams<{ season_id: string }>;

    it("should return leaderboard across all leagues", async () => {
      const mockLeaderboard = [
        {
          rank: 1,
          team_id: 1,
          team_name: "Team 1",
          total_points: 100,
          league_name: "League 1"
        }
      ];

      mockFantasyModels.getFantasyOverallLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyOverallLeaderboardController(mockRequest, mockResponse);

      expect(
        mockFantasyModels.getFantasyOverallLeaderboard
      ).toHaveBeenCalledWith(1, undefined);
      expect(mockResponse.json).toHaveBeenCalledWith(mockLeaderboard);
    });

    it("should highlight current user's team if authenticated", async () => {
      const authenticatedRequest = {
        ...mockRequest,
        auth: {
          account_id: 1,
          provider: "steam",
          provider_id: "12345",
          permissions: [],
          roles: [],
          nickname: "testuser",
          jti: "test-jti"
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);

      const mockLeaderboard = [
        {
          rank: 1,
          team_id: 1,
          team_name: "Team 1",
          total_points: 100
        }
      ];

      mockFantasyModels.getFantasyOverallLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyOverallLeaderboardController(
        authenticatedRequest,
        mockResponse
      );

      expect(
        mockFantasyModels.getFantasyOverallLeaderboard
      ).toHaveBeenCalledWith(1, "12345");
    });

    it("should work without authentication", async () => {
      const mockLeaderboard = [];

      mockFantasyModels.getFantasyOverallLeaderboard.mockResolvedValue(
        mockLeaderboard
      );

      await getFantasyOverallLeaderboardController(mockRequest, mockResponse);

      expect(
        mockFantasyModels.getFantasyOverallLeaderboard
      ).toHaveBeenCalledWith(1, undefined);
    });
  });

  describe("getFantasyPriceHistoryController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        league_id: "1"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should return price history for valid league", async () => {
      const mockPriceHistory = [
        {
          steam_id: "12345",
          current_value: 200000,
          previous_value: 190000,
          value_change: 10000
        }
      ];

      mockFantasyModels.getFantasyPriceHistory.mockResolvedValue(
        mockPriceHistory
      );

      await getFantasyPriceHistoryController(mockRequest, mockResponse);

      expect(mockFantasyModels.getFantasyPriceHistory).toHaveBeenCalledWith(
        1,
        1
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockPriceHistory);
    });

    it("should return empty array for league with no players", async () => {
      mockFantasyModels.getFantasyPriceHistory.mockResolvedValue([]);

      await getFantasyPriceHistoryController(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe("seedInitialPlayerValuesController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        league_id: "1"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should seed initial values for league", async () => {
      const mockPlayerValues = [
        { steam_id: "1", value: 200000, tier: "gold" },
        { steam_id: "2", value: 190000, tier: "silver" }
      ];

      mockCalculateInitialPlayerValues.mockResolvedValue(mockPlayerValues);
      mockRunQuery.mockResolvedValue(undefined as never);

      await seedInitialPlayerValuesController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockCalculateInitialPlayerValues).toHaveBeenCalledWith(1, 1);
      expect(mockRunQuery).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Initial player values seeded successfully",
        count: 2,
        values: mockPlayerValues
      });
    });

    it("should return 400 if no players found", async () => {
      mockCalculateInitialPlayerValues.mockResolvedValue([]);

      await seedInitialPlayerValuesController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "No players found for this league",
          status: 400
        })
      );
    });
  });

  describe("getTopPerformingPlayersController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        league_id: "1"
      },
      query: {}
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should return top players for valid league", async () => {
      const mockPlayers = [
        {
          steam_id: "1",
          nickname: "Player 1",
          total_points: 100
        }
      ];

      mockFantasyModels.getTopPerformingPlayers.mockResolvedValue(mockPlayers);

      await getTopPerformingPlayersController(mockRequest, mockResponse);

      expect(mockFantasyModels.getTopPerformingPlayers).toHaveBeenCalledWith(
        1,
        1,
        50
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlayers);
    });

    it("should respect limit query parameter", async () => {
      const requestWithLimit = {
        ...mockRequest,
        query: { limit: "10" }
      } as unknown as RequestWithParams<{
        season_id: string;
        league_id: string;
      }>;

      mockFantasyModels.getTopPerformingPlayers.mockResolvedValue([]);

      await getTopPerformingPlayersController(requestWithLimit, mockResponse);

      expect(mockFantasyModels.getTopPerformingPlayers).toHaveBeenCalledWith(
        1,
        1,
        10
      );
    });

    it("should default to limit 50", async () => {
      mockFantasyModels.getTopPerformingPlayers.mockResolvedValue([]);

      await getTopPerformingPlayersController(mockRequest, mockResponse);

      expect(mockFantasyModels.getTopPerformingPlayers).toHaveBeenCalledWith(
        1,
        1,
        50
      );
    });
  });

  describe("getPlayerPointHistoryController", () => {
    const mockRequest = {
      params: {
        season_id: "1",
        player_id: "12345"
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: [],
        nickname: "testuser",
        jti: "test-jti"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      player_id: string;
    }>;

    beforeEach(() => {
      mockRunQuery.mockResolvedValue([
        { provider_id: "12345" }
      ] as never);
    });

    it("should return point history for player in user's team", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: [{ steam_id: "12345" }]
      };

      const mockHistory = [
        {
          match_game_id: 1,
          points_earned: 10,
          individual_points: 5,
          team_points: 3,
          role_points: 2
        }
      ];

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.getPlayerPointHistory.mockResolvedValue(mockHistory);

      await getPlayerPointHistoryController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockFantasyModels.getPlayerPointHistory).toHaveBeenCalledWith(
        "12345",
        1
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockHistory);
    });

    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = {
        ...mockRequest,
        auth: undefined
      } as unknown as RequestWithParams<{
        season_id: string;
        player_id: string;
      }>;

      await getPlayerPointHistoryController(
        unauthenticatedRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          status: 401
        })
      );
    });

    it("should return 404 if user has no team", async () => {
      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(null);

      await getPlayerPointHistoryController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Fantasy team not found",
          status: 404
        })
      );
    });

    it("should return 400 if player not in user's team", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: [{ steam_id: "99999" }] // Different player
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);

      await getPlayerPointHistoryController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Player not in your fantasy team",
          status: 400
        })
      );
    });

    it("should return empty array if player has no matches", async () => {
      const mockTeam = {
        id: 1,
        team_name: "My Team",
        total_points: 100,
        players: [{ steam_id: "12345" }]
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.getPlayerPointHistory.mockResolvedValue([]);

      await getPlayerPointHistoryController(
        mockRequest,
        mockResponse,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });
});

