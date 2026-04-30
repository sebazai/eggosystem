import { type Response } from "express";
import {
  getMatchesController,
  getMatchesBySeasonIdController,
  getMatchController,
  getMatchBreadcrumbController,
  getMatchGameController,
  getMatchInfoController,
  getFilteredMatchesController,
  getMatchTopPlayersController,
  getMatchPlayerStatsController,
  getMatchTeamStatsController,
  getMatchGamesController,
  getMatchMapVetoesController
} from "./matches.controllers";
import {
  getMatches,
  getMatch,
  getMatchWithBreadcrumbInfo,
  getMatchGame,
  getMatchInfo,
  getMatchesByFilters,
  getMatchTopPlayers,
  getMatchPlayerStats,
  getTeamStats,
  getMatchGames,
  getMatchMapVetoes,
  getMatchesWithTeamDataBySeasonId
} from "../models/match.models";
import { getActiveSeasonForAppId } from "../models/season.models";
import {
  type RequestWithParams,
  type Match,
  type Stage,
  type MatchInfoQuery,
  type MatchOrGameTopPlayerAwards,
  type MatchPlayerStats,
  type TeamStatsResponse,
  type MatchMapVetoes,
  type MatchesWithTeamDataQuery,
  type MatchGame,
  type ParsedParams,
  type SeasonPlatform,
  type MatchMapsPlayed
} from "@eggosystem/types";
import { createMockMatch } from "@eggosystem/types";

// Mock the models
jest.mock("../models/match.models");
jest.mock("../models/season.models");

const mockGetMatches = getMatches as jest.MockedFunction<typeof getMatches>;
const mockGetMatch = getMatch as jest.MockedFunction<typeof getMatch>;
const mockGetMatchWithBreadcrumbInfo =
  getMatchWithBreadcrumbInfo as jest.MockedFunction<
    typeof getMatchWithBreadcrumbInfo
  >;
const mockGetMatchGame = getMatchGame as jest.MockedFunction<
  typeof getMatchGame
>;
const mockGetMatchInfo = getMatchInfo as jest.MockedFunction<
  typeof getMatchInfo
>;
const mockGetMatchesByFilters = getMatchesByFilters as jest.MockedFunction<
  typeof getMatchesByFilters
>;
const mockGetMatchTopPlayers = getMatchTopPlayers as jest.MockedFunction<
  typeof getMatchTopPlayers
>;
const mockGetMatchPlayerStats = getMatchPlayerStats as jest.MockedFunction<
  typeof getMatchPlayerStats
>;
const mockGetMatchTeamStats = getTeamStats as jest.MockedFunction<
  typeof getTeamStats
>;
const mockGetMatchGames = getMatchGames as jest.MockedFunction<
  typeof getMatchGames
>;
const mockGetMatchMapVetoes = getMatchMapVetoes as jest.MockedFunction<
  typeof getMatchMapVetoes
>;
const mockGetMatchesWithTeamDataBySeasonId =
  getMatchesWithTeamDataBySeasonId as jest.MockedFunction<
    typeof getMatchesWithTeamDataBySeasonId
  >;
const mockGetActiveSeasonForAppId =
  getActiveSeasonForAppId as jest.MockedFunction<
    typeof getActiveSeasonForAppId
  >;

// Test data objects
const mockMatch = createMockMatch({
  id: 123,
  start_timestamp: "2024-01-01T12:00:00.000Z",
  end_timestamp: "2024-01-01T14:00:00.000Z",
  external_match_room_id: "123",
  status: "FINISHED"
});

const mockMatchWithBreadcrumb = {
  ...createMockMatch({
    id: 123,
    start_timestamp: "2024-01-01T12:00:00.000Z",
    end_timestamp: "2024-01-01T14:00:00.000Z",
    external_match_room_id: "123",
    status: "FINISHED"
  }),
  name: "Test Stage"
} satisfies Match & Stage;

const mockMatches = [mockMatch] satisfies Match[];

const mockMatchesWithTeamData: MatchesWithTeamDataQuery[] = [
  {
    match_id: 123,
    start_timestamp: "2024-01-01T12:00:00.000Z",
    end_timestamp: "2024-01-01T14:00:00.000Z",
    best_of: 1,
    external_match_room_id: "123",
    league_id: 1,
    league_name: "Test League",
    season_id: 1,
    season_name: "Test Season",
    season_platform: "kanaliiga" as SeasonPlatform,
    stage: 1,
    teams: JSON.stringify({
      team1: {
        id: 1,
        name: "Team A",
        logo: "logo1.png",
        score: 16,
        rank: null,
        side: null
      },
      team2: {
        id: 2,
        name: "Team B",
        logo: "logo2.png",
        score: 13,
        rank: null,
        side: null
      }
    })
  }
];

// Type definitions for test requests
type TestRequestWithParams<P = Record<string, string>> =
  RequestWithParams<P> & {
    parsedParams?: ParsedParams;
  };

describe("Matches Controllers", () => {
  let mockRequest: TestRequestWithParams;
  let mockResponse: Response;
  let mockJson: jest.MockedFunction<Response["json"]>;
  let mockStatus: jest.MockedFunction<Response["status"]>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {},
      parsedParams: {
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null
      }
    } as TestRequestWithParams;

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus
    } as unknown as Response;

    jest.clearAllMocks();
  });

  describe("getMatchesController", () => {
    it("should return all matches", async () => {
      mockGetMatches.mockResolvedValue(mockMatches);

      await getMatchesController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetMatches).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({ matches: mockMatches });
    });

    it("should handle empty matches list", async () => {
      mockGetMatches.mockResolvedValue([]);

      await getMatchesController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetMatches).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({ matches: [] });
    });
  });

  describe("getMatchesBySeasonIdController", () => {
    it("should return matches for valid season ID", async () => {
      mockRequest.params = { season_id: "123" };
      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        123,
        null
      );
      expect(mockJson).toHaveBeenCalledWith({
        matches: mockMatchesWithTeamData.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });

    it("should handle invalid season ID", async () => {
      mockRequest.params = { season_id: "invalid" };

      const mockNext = jest.fn();
      await expect(
        getMatchesBySeasonIdController(
          mockRequest as TestRequestWithParams<{ season_id: string }>,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow("Invalid season ID");
    });

    it("should handle negative season ID", async () => {
      mockRequest.params = { season_id: "-123" };
      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await expect(
        getMatchesBySeasonIdController(
          mockRequest as TestRequestWithParams<{ season_id: string }>,
          mockResponse as Response,
          mockNext
        )
      ).rejects.toThrow("Invalid season ID");
    });

    it("should handle zero season ID", async () => {
      mockRequest.params = { season_id: "0" };
      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        0,
        null
      );
      expect(mockJson).toHaveBeenCalledWith({
        matches: mockMatchesWithTeamData.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });

    it("should return matches for valid season ID with league_id filter", async () => {
      mockRequest.params = { season_id: "123" };
      mockRequest.query = { league_id: "456" };
      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        123,
        456
      );
      expect(mockJson).toHaveBeenCalledWith({
        matches: mockMatchesWithTeamData.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });

    it("should return matches for valid season ID with invalid league_id", async () => {
      mockRequest.params = { season_id: "123" };
      mockRequest.query = { league_id: "invalid" };
      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      // Invalid league_id becomes NaN when passed through Number()
      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        123,
        null
      );
      expect(mockJson).toHaveBeenCalledWith({
        matches: mockMatchesWithTeamData.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });

    it("should filter out matches with excluded statuses", async () => {
      mockRequest.params = { season_id: "123" };
      // Create test data that includes matches with different statuses
      const mixedStatusMatches: MatchesWithTeamDataQuery[] = [
        {
          ...mockMatchesWithTeamData[0],
          match_id: 1
        },
        {
          ...mockMatchesWithTeamData[0],
          match_id: 2
        }
      ];

      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mixedStatusMatches
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      // Verify the model is called with correct parameters
      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        123,
        null
      );

      // Verify response contains the filtered matches
      expect(mockJson).toHaveBeenCalledWith({
        matches: mixedStatusMatches.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });

    it("should handle active season with league_id filter", async () => {
      mockRequest.params = { season_id: "active" };
      mockRequest.query = { league_id: "789" };

      // Mock the active season lookup
      mockGetActiveSeasonForAppId.mockResolvedValue({ season_id: 999 });

      mockGetMatchesWithTeamDataBySeasonId.mockResolvedValue(
        mockMatchesWithTeamData
      );

      const mockNext = jest.fn();
      await getMatchesBySeasonIdController(
        mockRequest as TestRequestWithParams<{ season_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchesWithTeamDataBySeasonId).toHaveBeenCalledWith(
        999,
        789
      );
      expect(mockJson).toHaveBeenCalledWith({
        matches: mockMatchesWithTeamData.map((match) => ({
          ...match,
          teams: JSON.parse(match.teams)
        }))
      });
    });
  });

  describe("getMatchController", () => {
    it("should return match for valid ID", async () => {
      mockRequest.params = { match_id: "123" };
      mockGetMatch.mockResolvedValue([mockMatch]);

      const mockNext = jest.fn();
      await getMatchController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatch).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockMatch);
    });

    it("should return 404 for non-existent match", async () => {
      mockRequest.params = { match_id: "123" };
      mockGetMatch.mockResolvedValue([]);

      const mockNext = jest.fn();
      await getMatchController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Match not found",
          status: 404
        })
      );
    });

    it("should handle invalid match ID", async () => {
      mockRequest.params = { match_id: "invalid" };

      const mockNext = jest.fn();
      await getMatchController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatch).toHaveBeenCalledWith(NaN);
    });

    it("should handle negative match ID", async () => {
      mockRequest.params = { match_id: "-123" };

      const mockNext = jest.fn();
      await getMatchController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatch).toHaveBeenCalledWith(-123);
    });

    it("should handle zero match ID", async () => {
      mockRequest.params = { match_id: "0" };

      const mockNext = jest.fn();
      await getMatchController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatch).toHaveBeenCalledWith(0);
    });
  });

  describe("getMatchBreadcrumbController", () => {
    it("should return match with breadcrumb for valid ID", async () => {
      mockRequest.params = { match_id: "123" };
      mockGetMatchWithBreadcrumbInfo.mockResolvedValue([
        mockMatchWithBreadcrumb
      ]);

      const mockNext = jest.fn();
      await getMatchBreadcrumbController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchWithBreadcrumbInfo).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockMatchWithBreadcrumb);
    });

    it("should return 404 for non-existent match breadcrumb", async () => {
      mockRequest.params = { match_id: "123" };
      mockGetMatchWithBreadcrumbInfo.mockResolvedValue([]);

      const mockNext = jest.fn();
      await getMatchBreadcrumbController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Match data not found",
          status: 404
        })
      );
    });

    it("should handle invalid match breadcrumb ID", async () => {
      mockRequest.params = { match_id: "invalid" };

      const mockNext = jest.fn();
      await getMatchBreadcrumbController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchWithBreadcrumbInfo).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getMatchGameController", () => {
    it("should return match game for valid IDs", async () => {
      mockRequest.params = { match_id: "123", match_game_id: "456" };
      const mockGame: MatchGame = {
        id: 456,
        match_id: 123,
        map_id: 1,
        demofile: "demo.dem",
        regulation_rounds: 30,
        team_game_scores_staff_lock: false
      };
      mockGetMatchGame.mockResolvedValue([mockGame]);

      await getMatchGameController(
        mockRequest as TestRequestWithParams<{
          match_id: string;
          match_game_id: string;
        }>,
        mockResponse as Response
      );

      expect(mockGetMatchGame).toHaveBeenCalledWith(123, 456);
      expect(mockJson).toHaveBeenCalledWith(mockGame);
    });

    it("should return 404 for non-existent match game", async () => {
      mockRequest.params = { match_id: "123", match_game_id: "456" };
      mockGetMatchGame.mockResolvedValue([]);

      await expect(
        getMatchGameController(
          mockRequest as TestRequestWithParams<{
            match_id: string;
            match_game_id: string;
          }>,
          mockResponse as Response
        )
      ).rejects.toThrow("Match game not found");
    });

    it("should handle invalid match game IDs", async () => {
      mockRequest.params = { match_id: "invalid", match_game_id: "invalid" };
      mockGetMatchGame.mockResolvedValue([]);

      await expect(
        getMatchGameController(
          mockRequest as TestRequestWithParams<{
            match_id: string;
            match_game_id: string;
          }>,
          mockResponse as Response
        )
      ).rejects.toThrow("Match game not found");
    });
  });

  describe("getMatchInfoController", () => {
    it("should return match info for valid ID", async () => {
      mockRequest.params = { match_id: "123" };
      const mockMatchInfo: MatchInfoQuery = {
        match_id: 123,
        start_timestamp: "2024-01-01T12:00:00.000Z",
        end_timestamp: "2024-01-01T14:00:00.000Z",
        best_of: 1,
        external_match_room_id: "123",
        league_id: 1,
        league_name: "Test League",
        season_id: 1,
        season_name: "Test Season",
        season_platform: "kanaliiga" as SeasonPlatform,
        stage: 1,
        teams: JSON.stringify({
          team1: { id: 1, name: "Team A", logo: "logo1.png", score: 16 },
          team2: { id: 2, name: "Team B", logo: "logo2.png", score: 13 }
        }),
        match_game_ids: JSON.stringify([1, 2, 3]),
        status: "SCHEDULED"
      };
      mockGetMatchInfo.mockResolvedValue(mockMatchInfo);

      await getMatchInfoController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchInfo).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        ...mockMatchInfo,
        match_game_ids: [1, 2, 3],
        teams: {
          team1: { id: 1, name: "Team A", logo: "logo1.png", score: 16 },
          team2: { id: 2, name: "Team B", logo: "logo2.png", score: 13 }
        }
      });
    });

    it("should return 404 for non-existent match info", async () => {
      mockRequest.params = { match_id: "123" };
      mockGetMatchInfo.mockResolvedValue(null);

      await expect(
        getMatchInfoController(
          mockRequest as TestRequestWithParams<{ match_id: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow("Match not found");
    });

    it("should handle invalid match info ID", async () => {
      mockRequest.params = { match_id: "invalid" };
      mockGetMatchInfo.mockResolvedValue(null);

      await expect(
        getMatchInfoController(
          mockRequest as TestRequestWithParams<{ match_id: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow("Match not found");
    });
  });

  describe("getFilteredMatchesController", () => {
    it("should return filtered matches with parameters", async () => {
      mockRequest.parsedParams = {
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        player_name: "test"
      };

      await getFilteredMatchesController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetMatchesByFilters).toHaveBeenCalledWith({
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        player_name: "test"
      });
    });

    it("should return filtered matches without parameters", async () => {
      mockRequest.parsedParams = {
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null
      };

      await getFilteredMatchesController(
        mockRequest as TestRequestWithParams,
        mockResponse as Response
      );

      expect(mockGetMatchesByFilters).toHaveBeenCalledWith({
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null
      });
    });
  });

  describe("getMatchTopPlayersController", () => {
    it("should return top players for valid match ID", async () => {
      mockRequest.params = { match_id: "123" };
      const mockTopPlayers: MatchOrGameTopPlayerAwards = {
        most_kills: {
          steam_id: "123456789",
          nickname: "Player1",
          value: 25,
          team_id: 1
        },
        most_adr: {
          steam_id: "987654321",
          nickname: "Player2",
          value: 95.5,
          team_id: 2
        },
        most_assists: null,
        most_awp_kills: null,
        most_utility_damage: null,
        most_first_kills: null,
        most_flash_assists: null,
        most_mates_flashed: null
      };
      mockGetMatchTopPlayers.mockResolvedValue(mockTopPlayers);

      await getMatchTopPlayersController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchTopPlayers).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockTopPlayers);
    });

    it("should handle invalid match top players ID", async () => {
      mockRequest.params = { match_id: "invalid" };

      await getMatchTopPlayersController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchTopPlayers).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getMatchPlayerStatsController", () => {
    it("should return player stats for valid match ID", async () => {
      mockRequest.params = { match_id: "123" };
      mockRequest.query = {};
      const mockNext = jest.fn();
      const mockPlayerStats: MatchPlayerStats[] = [
        {
          steam_id: "123456789",
          nickname: "Player1",
          team_id: 1,
          kills: 25,
          headshots: 15,
          assists: 8,
          flash_assists: 3,
          deaths: 12,
          kast_percentage: 75,
          adr: 95.5,
          enemies_flashed: 5,
          hs_percent: 60,
          kana_rating: 1.25,
          first_kills: 3,
          first_deaths: 2
        }
      ];
      mockGetMatchPlayerStats.mockResolvedValue(mockPlayerStats);

      await getMatchPlayerStatsController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchPlayerStats).toHaveBeenCalledWith(123, undefined);
      expect(mockJson).toHaveBeenCalledWith(mockPlayerStats);
    });

    it("should handle invalid match player stats ID", async () => {
      mockRequest.params = { match_id: "invalid" };
      mockRequest.query = {};
      const mockNext = jest.fn();

      await getMatchPlayerStatsController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchPlayerStats).toHaveBeenCalledWith(NaN, undefined);
    });
  });

  describe("getMatchTeamStatsController", () => {
    it("should return team stats for valid match ID", async () => {
      mockRequest.params = { match_id: "123" };
      const mockTeamStats: TeamStatsResponse[] = [
        {
          team_id: 1,
          name: "Team A",
          first_kills: 8,
          clutches_won: 2,
          plants: 5,
          trades: 12
        }
      ];
      mockGetMatchTeamStats.mockResolvedValue(mockTeamStats);

      await getMatchTeamStatsController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchTeamStats).toHaveBeenCalledWith({ match_id: 123 });
      expect(mockJson).toHaveBeenCalledWith(mockTeamStats);
    });

    it("should handle invalid match team stats ID", async () => {
      mockRequest.params = { match_id: "invalid" };

      await expect(
        getMatchTeamStatsController(
          mockRequest as TestRequestWithParams<{ match_id: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow("Invalid match ID");

      expect(mockGetMatchTeamStats).not.toHaveBeenCalledWith({ match_id: NaN });
    });
  });

  describe("getMatchGamesController", () => {
    it("should return games for valid match ID", async () => {
      const mockNext = jest.fn();
      mockRequest.params = { match_id: "123" };
      const mockGames: MatchMapsPlayed[] = [
        {
          id: 1,
          map_name: "de_dust2",
          match_id: 123,
          map_order: null,
          demofile: "demo.dem",
          team1_score: 16,
          team2_score: 13,
          team1_side: null,
          team2_side: null
        }
      ];
      mockGetMatchGames.mockResolvedValue(mockGames);

      await getMatchGamesController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchGames).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockGames);
    });

    it("should handle invalid match games ID", async () => {
      const mockNext = jest.fn();
      mockRequest.params = { match_id: "invalid" };

      await getMatchGamesController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response,
        mockNext
      );

      expect(mockGetMatchGames).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getMatchMapVetoesController", () => {
    it("should return map vetoes for valid match ID", async () => {
      mockRequest.params = { match_id: "123" };
      const mockVetoes: MatchMapVetoes[] = [
        {
          id: 1,
          match_id: 123,
          team_id: 1,
          map_id: 1,
          map_name: "de_dust2",
          action: "drop",
          veto_order: 1
        }
      ];
      mockGetMatchMapVetoes.mockResolvedValue(mockVetoes);

      await getMatchMapVetoesController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchMapVetoes).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockVetoes);
    });

    it("should handle invalid match map vetoes ID", async () => {
      mockRequest.params = { match_id: "invalid" };

      await getMatchMapVetoesController(
        mockRequest as TestRequestWithParams<{ match_id: string }>,
        mockResponse as Response
      );

      expect(mockGetMatchMapVetoes).toHaveBeenCalledWith(NaN);
    });
  });
});
