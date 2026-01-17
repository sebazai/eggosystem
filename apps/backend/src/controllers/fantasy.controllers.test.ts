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
import type { PlayerRole } from "../models/fantasy.models";
import { runQuery } from "../db/mysqlRunQuery";
import { calculateInitialPlayerValues } from "../services/fantasy-value.service";
import { getCurrentWeekNumberForSeason } from "../utils/week-calculation";

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
          team_id: 1,
          team_name: "Test Team",
          team_logo: null,
          value: 200000,
          tier: "silver" as const,
          kana_rating: 0.8,
          kd: 1.2,
          kills: 100,
          deaths: 83,
          adr: 85.5,
          adr_t: 80.0,
          adr_ct: 90.0,
          headshots: 50,
          headshot_percentage: 50.0,
          flash_assists: 10,
          first_kills: 20,
          first_deaths: 15,
          kast: 0.7,
          maps_played: 10
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
          {
            steam_id: "1",
            role: "main_awp" as PlayerRole,
            player_value: 200000
          },
          { steam_id: "2", role: "leader" as PlayerRole, player_value: 200000 },
          {
            steam_id: "3",
            role: "support" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "4",
            role: "entry_fragger" as PlayerRole,
            player_value: 200000
          },
          {
            steam_id: "5",
            role: "defender" as PlayerRole,
            player_value: 200000
          }
        ]
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      // Mock getSteamIdFromAuth (uses runQuery)
      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);
    });

    it("should create team with valid data", async () => {
      mockFantasyModels.createFantasyTeam.mockResolvedValue(1);

      await createFantasyTeamController(mockRequest, mockResponse, mockNext);

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

      await createFantasyTeamController(invalidRequest, mockResponse, mockNext);

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

      await createFantasyTeamController(invalidRequest, mockResponse, mockNext);

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
            {
              player_id: "1",
              role: "main_awp" as PlayerRole,
              player_value: 200000
            },
            {
              player_id: "2",
              role: "leader" as PlayerRole,
              player_value: 200000
            },
            {
              player_id: "3",
              role: "support" as PlayerRole,
              player_value: 200000
            },
            {
              player_id: "4",
              role: "entry_fragger" as PlayerRole,
              player_value: 200000
            },
            {
              player_id: "5",
              role: "defender" as PlayerRole,
              player_value: 200000
            }
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
      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);
    });

    it("should return team for authenticated user", async () => {
      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
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
      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);
    });

    it("should substitute player successfully", async () => {
      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.substitutePlayer.mockResolvedValue({
        success: true,
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

      await substitutePlayerController(invalidRequest, mockResponse, mockNext);

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
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.substitutePlayer.mockResolvedValue({
        success: true,
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
          { steam_id: "1", role: "main_awp" as PlayerRole },
          { steam_id: "2", role: "leader" as PlayerRole }
        ]
      }
    } as unknown as RequestWithParams<{ season_id: string }>;

    beforeEach(() => {
      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);
      mockGetCurrentWeekNumberForSeason.mockResolvedValue(1);
    });

    it("should update roles successfully", async () => {
      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        success: true,
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

      await updatePlayerRolesController(invalidRequest, mockResponse, mockNext);

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
          role_updates: [{ steam_id: "1", role: "main_awp" as PlayerRole }],
          skip_swap_limit: true
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        success: true,
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
          role_updates: [{ player_id: "1", role: "main_awp" as PlayerRole }]
        }
      } as unknown as RequestWithParams<{ season_id: string }>;

      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: []
      };

      mockFantasyModels.getFantasyTeamByUser.mockResolvedValue(mockTeam);
      mockFantasyModels.updatePlayerRoles.mockResolvedValue({
        success: true,
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
      const mockLeaderboard = {
        leaderboard: [
          {
            rank: 1,
            fantasy_team_id: 1,
            team_name: "Team 1",
            owner_name: "Owner 1",
            total_points: 100,
            is_current_user: false
          }
        ],
        currentUserRank: null,
        totalTeams: 1
      };

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

      const mockLeaderboard = {
        leaderboard: [
          {
            rank: 1,
            fantasy_team_id: 1,
            team_name: "Team 1",
            owner_name: "Owner 1",
            total_points: 100,
            is_current_user: true
          }
        ],
        currentUserRank: 1,
        totalTeams: 1
      };

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

      mockRunQuery.mockResolvedValue([{ steam_id: "12345" }] as never);

      const mockLeaderboard = {
        leaderboard: [
          {
            rank: 1,
            fantasy_team_id: 1,
            team_name: "Team 1",
            owner_name: "Owner 1",
            total_points: 100,
            is_current_user: false
          }
        ],
        currentUserRank: null,
        totalTeams: 1
      };

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
      mockFantasyModels.getFantasyLeaderboard.mockResolvedValue({
        leaderboard: [],
        currentUserRank: null,
        totalTeams: 0
      });

      await getFantasyLeaderboardController(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        leaderboard: [],
        currentUserRank: null,
        totalTeams: 0
      });
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
      const mockLeaderboard = {
        leaderboard: [
          {
            rank: 1,
            fantasy_team_id: 1,
            team_name: "Team 1",
            owner_name: "Owner 1",
            total_points: 100,
            league_name: "League 1",
            is_current_user: false
          }
        ],
        currentUserRank: null
      };

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

      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);

      const mockLeaderboard = {
        leaderboard: [
          {
            rank: 1,
            fantasy_team_id: 1,
            team_name: "Team 1",
            owner_name: "Owner 1",
            total_points: 100,
            league_name: "League 1",
            is_current_user: false
          }
        ],
        currentUserRank: null
      };

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
      const mockLeaderboard = {
        leaderboard: [],
        currentUserRank: null
      };

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
          nickname: "Test Player",
          team_name: "Test Team",
          current_value: 200000,
          current_tier: "gold",
          previous_value: 190000,
          value_change: 10000,
          value_change_percent: 5.26,
          value_history: [
            {
              week_number: 1,
              value: 190000,
              tier: "silver"
            },
            {
              week_number: 2,
              value: 200000,
              tier: "gold"
            }
          ]
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
      },
      auth: {
        account_id: 1,
        provider: "steam",
        provider_id: "12345",
        permissions: [],
        roles: ["admin"],
        nickname: "testuser",
        jti: "test-jti"
      }
    } as unknown as RequestWithParams<{
      season_id: string;
      league_id: string;
    }>;

    it("should seed initial values for league", async () => {
      const mockPlayerValues = [
        {
          steam_id: "1",
          value: 200000,
          tier: "gold" as const,
          stats: {
            kana_rating: 0.9,
            kd: 1.2,
            kills: 100,
            deaths: 83,
            assists: 50,
            adr: 85.5,
            headshot_percentage: 50.0,
            kast: 0.7,
            maps_played: 10
          }
        },
        {
          steam_id: "2",
          value: 190000,
          tier: "silver" as const,
          stats: {
            kana_rating: 0.8,
            kd: 1.1,
            kills: 90,
            deaths: 82,
            assists: 45,
            adr: 80.0,
            headshot_percentage: 50.0,
            kast: 0.65,
            maps_played: 10
          }
        }
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
          team_name: "Team 1",
          team_logo: null,
          total_points: 100,
          current_value: 200000,
          tier: "gold" as const,
          kana_rating: 0.9,
          kd: 1.2,
          is_on_fantasy_team: false
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
      mockRunQuery.mockResolvedValue([{ provider_id: "12345" }] as never);
    });

    it("should return point history for player in user's team", async () => {
      const mockTeam = {
        id: 1,
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: [
          {
            id: 1,
            steam_id: "12345",
            nickname: "Test Player",
            team_name: "Test Team",
            team_logo: null,
            role: null,
            player_value: 200000,
            tier: "gold" as const,
            points_earned: 100,
            individual_points: 50,
            team_points: 30,
            role_points: 20,
            is_active: true,
            kana_rating: 0.9,
            kills: 100,
            deaths: 83,
            kd: 1.2,
            adr: 85.5,
            adr_t: 80.0,
            adr_ct: 90.0,
            headshots: 50,
            headshot_percentage: 50.0,
            flash_assists: 10,
            first_kills: 20,
            first_deaths: 15,
            kast: 0.7
          }
        ]
      };

      const mockHistory = [
        {
          match_game_id: 1,
          match_date: new Date(),
          opponent: "Opponent Team",
          map_name: "de_dust2",
          points_earned: 10,
          individual_points: 5,
          team_points: 3,
          role_points: 2,
          stats_breakdown: {
            kills: 20,
            deaths: 15,
            assists: 5,
            flash_assists: 2,
            first_kills: 3,
            first_deaths: 2,
            kills_3: 1,
            kills_4: 0,
            kills_5: 0,
            clutches_won: 1,
            awp_kills: 2,
            mvps: 1,
            kana_rating: 1.2,
            kd: 1.33,
            adr: 85.5,
            kast: 0.7,
            hs_percent: 50.0,
            team_won: true
          },
          points_breakdown: {
            kills: 20,
            deaths: -15,
            assists: 5,
            flash_assists: 2,
            opening_kills: 3,
            opening_deaths: -2,
            multi_kills: 5,
            clutches: 5,
            mvps: 2,
            team_result: 3,
            rating_base: 5,
            adr_bonus: 1,
            kd_bonus: 1,
            kast_bonus: 1,
            hs_bonus: 1,
            role_multiplier: 1.2
          }
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
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: [
          {
            id: 1,
            steam_id: "99999",
            nickname: "Other Player",
            team_name: "Other Team",
            team_logo: null,
            role: null,
            player_value: 200000,
            tier: "gold" as const,
            points_earned: 100,
            individual_points: 50,
            team_points: 30,
            role_points: 20,
            is_active: true,
            kana_rating: 0.9,
            kills: 100,
            deaths: 83,
            kd: 1.2,
            adr: 85.5,
            adr_t: 80.0,
            adr_ct: 90.0,
            headshots: 50,
            headshot_percentage: 50.0,
            flash_assists: 10,
            first_kills: 20,
            first_deaths: 15,
            kast: 0.7
          }
        ] // Different player
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
        steam_id: "12345",
        season_id: 1,
        league_id: 1,
        team_name: "My Team",
        budget_remaining: 500000,
        total_points: 100,
        created_at: new Date(),
        updated_at: new Date(),
        players: [
          {
            id: 1,
            steam_id: "12345",
            nickname: "Test Player",
            team_name: "Test Team",
            team_logo: null,
            role: null,
            player_value: 200000,
            tier: "gold" as const,
            points_earned: 100,
            individual_points: 50,
            team_points: 30,
            role_points: 20,
            is_active: true,
            kana_rating: 0.9,
            kills: 100,
            deaths: 83,
            kd: 1.2,
            adr: 85.5,
            adr_t: 80.0,
            adr_ct: 90.0,
            headshots: 50,
            headshot_percentage: 50.0,
            flash_assists: 10,
            first_kills: 20,
            first_deaths: 15,
            kast: 0.7
          }
        ]
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
