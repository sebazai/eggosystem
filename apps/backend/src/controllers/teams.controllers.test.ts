import { type Response } from "express";
import {
  getTeamKeyPlayersController,
  getTeamPlayersController,
  getTeamsByLeagueController
} from "../teams.controllers";
import {
  getTeamKeyPlayers,
  getTeamPlayers,
  getTeamsByLeague
} from "../../models/team.models";
import type {
  RequestWithParams,
  TeamKeyPlayers,
  TeamPlayers,
  TeamsByLeague
} from "@eggosystem/types";

// Mock the model
jest.mock("../../models/team.models");
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
  let mockRequest: Partial<RequestWithParams<{ team_id: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { team_id: "123" },
      query: { season_id: "15" }
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
        kana_rating: 1.15
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        games_played: 9,
        kdr: 1.1,
        kdiff: 8,
        adr: 78.2,
        kana_rating: 1.05
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 15);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should return key players when no season_id provided", async () => {
    mockRequest.query = {};
    const mockKeyPlayers: TeamKeyPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        games_played: 5,
        kdr: 1.2,
        kdiff: 10,
        adr: 80.0,
        kana_rating: 1.1
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should handle season_id as undefined explicitly", async () => {
    mockRequest.query = { season_id: undefined };
    const mockKeyPlayers: TeamKeyPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        games_played: 5,
        kdr: 1.2,
        kdiff: 10,
        adr: 80.0,
        kana_rating: 1.1
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should handle season_id as empty string", async () => {
    mockRequest.query = { season_id: "" };
    const mockKeyPlayers: TeamKeyPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        games_played: 5,
        kdr: 1.2,
        kdiff: 10,
        adr: 80.0,
        kana_rating: 1.1
      }
    ];

    mockGetTeamKeyPlayers.mockResolvedValue(mockKeyPlayers);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockKeyPlayers);
  });

  it("should return empty array when team has no players", async () => {
    mockGetTeamKeyPlayers.mockResolvedValue([]);

    await getTeamKeyPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
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
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, 15);
  });

  it("should handle invalid team ID parameter", async () => {
    mockRequest.params = { team_id: "invalid" };

    await expect(
      getTeamKeyPlayersController(
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.query = { season_id: "invalid" };

    await expect(
      getTeamKeyPlayersController(
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamKeyPlayers).toHaveBeenCalledWith(123, NaN);
  });
});

describe("getTeamPlayersController", () => {
  let mockRequest: Partial<RequestWithParams<{ team_id: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { team_id: "456" },
      query: { season_id: "15" }
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
        is_co_captain: false
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        is_captain: false,
        is_co_captain: true
      },
      {
        steam_id: "76561198111111111",
        nickname: "Player3",
        is_captain: false,
        is_co_captain: false
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should return players when no season_id provided", async () => {
    mockRequest.query = {};
    const mockPlayers: TeamPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false
      },
      {
        steam_id: "76561198087654321",
        nickname: "Player2",
        is_captain: false,
        is_co_captain: false
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should handle season_id as undefined explicitly", async () => {
    mockRequest.query = { season_id: undefined };
    const mockPlayers: TeamPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should handle season_id as empty string", async () => {
    mockRequest.query = { season_id: "" };
    const mockPlayers: TeamPlayers[] = [
      {
        steam_id: "76561198012345678",
        nickname: "Player1",
        is_captain: true,
        is_co_captain: false
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });

  it("should return empty array when team has no players", async () => {
    mockGetTeamPlayers.mockResolvedValue([]);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
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
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
  });

  it("should handle invalid team_id parameter", async () => {
    mockRequest.params = { team_id: "invalid" };

    await expect(
      getTeamPlayersController(
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.query = { season_id: "invalid" };

    await expect(
      getTeamPlayersController(
        mockRequest as RequestWithParams<{ team_id: string }>,
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
        is_co_captain: false
      }
    ];

    mockGetTeamPlayers.mockResolvedValue(mockPlayers);

    await getTeamPlayersController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamPlayers).toHaveBeenCalledWith(456, 15);
    expect(mockJson).toHaveBeenCalledWith(mockPlayers);
  });
});

describe("getTeamsByLeagueController", () => {
  let mockRequest: Partial<RequestWithParams<{ league_id: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { league_id: "10" },
      query: { season_id: "15" }
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
      mockRequest as RequestWithParams<{ league_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should return teams when no season_id provided", async () => {
    mockRequest.query = {};
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 14,
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
      mockRequest as RequestWithParams<{ league_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should handle season_id as undefined explicitly", async () => {
    mockRequest.query = { season_id: undefined };
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 14,
        team_logo: "alpha.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{ league_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should handle season_id as empty string", async () => {
    mockRequest.query = { season_id: "" };
    const mockTeams: TeamsByLeague[] = [
      {
        id: 123,
        name: "Team Alpha",
        league_id: 10,
        season_id: 14,
        team_logo: "alpha.png"
      }
    ];

    mockGetTeamsByLeague.mockResolvedValue(mockTeams);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{ league_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });

  it("should return empty array when league has no teams", async () => {
    mockGetTeamsByLeague.mockResolvedValue([]);

    await getTeamsByLeagueController(
      mockRequest as RequestWithParams<{ league_id: string }>,
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
        mockRequest as RequestWithParams<{ league_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
  });

  it("should handle invalid league_id parameter", async () => {
    mockRequest.params = { league_id: "invalid" };

    await expect(
      getTeamsByLeagueController(
        mockRequest as RequestWithParams<{ league_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow();

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(NaN, 15);
  });

  it("should handle invalid season_id parameter", async () => {
    mockRequest.query = { season_id: "invalid" };

    await expect(
      getTeamsByLeagueController(
        mockRequest as RequestWithParams<{ league_id: string }>,
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
      mockRequest as RequestWithParams<{ league_id: string }>,
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
      mockRequest as RequestWithParams<{ league_id: string }>,
      mockResponse as Response
    );

    expect(mockGetTeamsByLeague).toHaveBeenCalledWith(10, 15);
    expect(mockJson).toHaveBeenCalledWith(mockTeams);
  });
});
