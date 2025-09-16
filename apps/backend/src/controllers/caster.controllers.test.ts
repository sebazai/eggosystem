import { type Response } from "express";
import { getLeaguesBySeason } from "../models/league.models";
import type {
  MatchGamesByTeam,
  ParsedParams,
  RequestWithParams,
  TeamKeyPlayers,
  TeamPlayers,
  TeamsByLeague
} from "@eggosystem/types";
import { getMatchGamesByTeam } from "../models/match.models";
import {
  getMatchGamesByTeamController,
  getLeaguesBySeasonController,
  getTeamKeyPlayersController,
  getTeamPlayersController,
  getTeamsByLeagueController
} from "./caster.controllers";
import {
  getTeamKeyPlayers,
  getTeamPlayers,
  getTeamsByLeague
} from "../models/team.models";

// Mock the model
jest.mock("../models/league.models");
const mockGetLeaguesBySeason = getLeaguesBySeason as jest.MockedFunction<
  typeof getLeaguesBySeason
>;

describe("getLeaguesBySeasonController", () => {
  let mockRequest: Partial<RequestWithParams<{ season_id: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { season_id: "15" }
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return leagues for a valid season", async () => {
    const mockLeagues = [
      {
        id: 1,
        name: "Division 1",
        season_id: 15,
        tier: 1
      },
      {
        id: 2,
        name: "Division 2",
        season_id: 15,
        tier: 2
      }
    ];

    mockGetLeaguesBySeason.mockResolvedValue(mockLeagues);

    await getLeaguesBySeasonController(
      mockRequest as RequestWithParams<{ season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
    expect(mockJson).toHaveBeenCalledWith(mockLeagues);
  });

  it("should return empty array when season has no leagues", async () => {
    mockGetLeaguesBySeason.mockResolvedValue([]);

    await getLeaguesBySeasonController(
      mockRequest as RequestWithParams<{ season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetLeaguesBySeason.mockRejectedValue(error);

    await expect(
      getLeaguesBySeasonController(
        mockRequest as RequestWithParams<{ season_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetLeaguesBySeason).toHaveBeenCalledWith(15);
  });
});

// Mock the model
jest.mock("../models/match.models");
const mockGetMatchGamesByTeam = getMatchGamesByTeam as jest.MockedFunction<
  typeof getMatchGamesByTeam
>;

// Type definitions for test requests
type TestRequestWithParams<P = Record<string, string>> =
  RequestWithParams<P> & {
    parsedParams?: ParsedParams;
  };

const mockMatchGamesByTeam = {
  match_id: 123,
  team1_id: 1,
  team2_id: 2,
  team1_name: "Team A",
  team2_name: "Team B",
  match_date: "2024-01-01",
  league_id: 1,
  season_id: 1,
  game_id: 123,
  map_name: "de_dust2",
  map_id: 1,
  map_order: 1,
  team1_score: 16,
  team2_score: 13
} satisfies MatchGamesByTeam;

describe("getMatchGamesByTeamController", () => {
  let mockRequest: Partial<TestRequestWithParams>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: {},
      query: {}
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return games by team for valid match ID", async () => {
    mockRequest.params = { team_id: "123", season_id: "1" };
    mockGetMatchGamesByTeam.mockResolvedValue([mockMatchGamesByTeam]);

    await getMatchGamesByTeamController(
      mockRequest as TestRequestWithParams<{
        team_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetMatchGamesByTeam).toHaveBeenCalledWith(123, 1);
    expect(mockJson).toHaveBeenCalledWith([mockMatchGamesByTeam]);
  });

  it("should handle invalid match games by team ID", async () => {
    mockRequest.params = { team_id: "invalid", season_id: "1" };

    await getMatchGamesByTeamController(
      mockRequest as TestRequestWithParams<{
        team_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetMatchGamesByTeam).toHaveBeenCalledWith(NaN, 1);
  });
});

// Mock the model
jest.mock("../models/team.models");
const mockGetTeamKeyPlayers = getTeamKeyPlayers as jest.MockedFunction<
  typeof getTeamKeyPlayers
>;
const mockGetTeamPlayers = getTeamPlayers as jest.MockedFunction<
  typeof getTeamPlayers
>;
const mockGetTeamsByLeague = getTeamsByLeague as jest.MockedFunction<
  typeof getTeamsByLeague
>;

describe("getTeamKeyPlayersController", () => {
  let mockRequest: Partial<
    RequestWithParams<{ team_id: string; season_id: string }>
  >;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { team_id: "123", season_id: "15" },
      query: {}
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return key players for a valid team with season filter", async () => {
    const mockKeyPlayers = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        games_played: 10,
        kdr: 1.25,
        kdiff: 15,
        adr: 85.5,
        kana_rating: 1.15,
        faceit_nickname: "Player1"
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        games_played: 9,
        kdr: 1.1,
        kdiff: 8,
        adr: 78.2,
        kana_rating: 1.05,
        faceit_nickname: "Player2"
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 15);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should return key players for different season", async () => {
    mockRequest.params = { team_id: "123", season_id: "10" };
    const mockKeyPlayers: TeamKeyPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        games_played: 5,
        kdr: 1.2,
        kdiff: 10,
        adr: 80.0,
        kana_rating: 1.1,
        faceit_nickname: "Player1"
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 10);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should return empty array when team has no players", async () => {
    mockGetTeamKeyPlayers.mockResolvedValue([]);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetTeamKeyPlayers.mockRejectedValue(error);

    await expect(
      getTeamKeyPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 15);
  });

  it("should handle invalid team ID parameter", async () => {
    mockRequest.params = { team_id: "invalid", season_id: "15" };

    await expect(
      getTeamKeyPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.params = { team_id: "123", season_id: "invalid" };

    await expect(
      getTeamKeyPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, NaN);
  });
});

describe("getTeamPlayersController", () => {
  let mockRequest: Partial<
    RequestWithParams<{ team_id: string; season_id: string }>
  >;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { team_id: "456", season_id: "15" },
      query: {}
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return all players for a valid team with season filter", async () => {
    const mockPlayers = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false,
        faceit_nickname: "Player1"
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        is_captain: false,
        is_co_captain: true,
        faceit_nickname: "Player2"
      },
      {
        steam_id: "76561198111111111",
        nickname: "Player3",
        is_captain: false,
        is_co_captain: false,
        faceit_nickname: "Player3"
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should return players for valid team and season", async () => {
    const mockPlayers: TeamPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false,
        faceit_nickname: "Player1"
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        is_captain: false,
        is_co_captain: false,
        faceit_nickname: "Player2"
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should return players for different season", async () => {
    mockRequest.params = { team_id: "456", season_id: "10" };
    const mockPlayers: TeamPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false,
        faceit_nickname: "Player1"
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 10);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should return empty array when team has no players", async () => {
    mockGetTeamPlayers.mockResolvedValue([]);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetTeamPlayers.mockRejectedValue(error);

    await expect(
      getTeamPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
  });

  it("should handle invalid team_id parameter", async () => {
    mockRequest.params = { team_id: "invalid", season_id: "15" };

    await expect(
      getTeamPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.params = { team_id: "456", season_id: "invalid" };

    await expect(
      getTeamPlayersController(
        mockRequest as RequestWithParams<{
          team_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, NaN);
  });

  it("should handle team with only captain", async () => {
    const mockPlayers = [
      {
        steam_id: "76561198012345678",
        nickname: "Captain",
        is_captain: true,
        is_co_captain: false,
        faceit_nickname: "Captain"
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string; season_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });
});

describe("getTeamsByLeagueController", () => {
  let mockRequest: Partial<
    RequestWithParams<{ league_id: string; season_id: string }>
  >;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { league_id: "10", season_id: "15" },
      query: {}
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return teams for a valid league with season filter", async () => {
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 15,
        team_logo: "alpha.png"
      },
      {
        id: 456,
        name: "Team Beta",
        league_id: 10,
        season_id: 15,
        team_logo: "beta.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should return teams for valid league and season", async () => {
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 15,
        team_logo: "alpha.png"
      },
      {
        id: 456,
        name: "Team Beta",
        league_id: 10,
        season_id: 15,
        team_logo: "beta.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should return teams for different season", async () => {
    mockRequest.params = { league_id: "10", season_id: "12" };
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 12,
        team_logo: "alpha.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 12);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should return empty array when league has no teams", async () => {
    mockGetTeamsByLeague.mockResolvedValue([]);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetTeamsByLeague.mockRejectedValue(error);

    await expect(
      getTeamsByLeagueController(
        mockRequest as RequestWithParams<{
          league_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
  });

  it("should handle invalid league_id parameter", async () => {
    mockRequest.params = { league_id: "invalid", season_id: "15" };

    await expect(
      getTeamsByLeagueController(
        mockRequest as RequestWithParams<{
          league_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.params = { league_id: "10", season_id: "invalid" };

    await expect(
      getTeamsByLeagueController(
        mockRequest as RequestWithParams<{
          league_id: string;
          season_id: string;
        }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, NaN);
  });

  it("should handle league with single team", async () => {
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Lone Team",
        league_id: 10,
        season_id: 15,
        team_logo: "lone.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should handle teams without logos", async () => {
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team No Logo",
        league_id: 10,
        season_id: 15,
        team_logo: ""
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{
        league_id: string;
        season_id: string;
      }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });
});
