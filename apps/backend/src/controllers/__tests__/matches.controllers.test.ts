import { type Response } from "express";
import { getMatchGamesByTeamController } from "../matches.controllers";
import { getMatchGamesByTeam } from "../../models/match.models";
import type { RequestWithParams, MatchGamesByTeam } from "@eggosystem/types";

// Mock the model
jest.mock("../../models/match.models");
const mockGetMatchGamesByTeam = getMatchGamesByTeam as jest.MockedFunction<
  typeof getMatchGamesByTeam
>;

describe("getMatchGamesByTeamController", () => {
  let mockRequest: Partial<RequestWithParams<{ team_id: string }>>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: { team_id: "85" },
      query: { season_id: "14" }
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return individual games for a team", async () => {
    const mockGames: MatchGamesByTeam[] = [
      {
        match_id: 9993,
        team1_id: 85,
        team2_id: 1194,
        team1_name: "Cimcorp Esports",
        team2_name: "ALM Partners Luottotappio",
        match_date: "2024-10-22",
        league_id: 5,
        season_id: 14,
        game_id: 12345,
        map_name: "de_ancient",
        map_id: 5,
        map_order: 1,
        team1_score: 16,
        team2_score: 13
      },
      {
        match_id: 9993,
        team1_id: 85,
        team2_id: 1194,
        team1_name: "Cimcorp Esports",
        team2_name: "ALM Partners Luottotappio",
        match_date: "2024-10-22",
        league_id: 5,
        season_id: 14,
        game_id: 12346,
        map_name: "de_anubis",
        map_id: 8,
        map_order: 2,
        team1_score: 13,
        team2_score: 16
      },
      {
        match_id: 9993,
        team1_id: 85,
        team2_id: 1194,
        team1_name: "Cimcorp Esports",
        team2_name: "ALM Partners Luottotappio",
        match_date: "2024-10-22",
        league_id: 5,
        season_id: 14,
        game_id: 12347,
        map_name: "de_nuke",
        map_id: 9,
        map_order: 3,
        team1_score: 16,
        team2_score: 14
      }
    ];

    mockGetMatchGamesByTeam.mockResolvedValue(mockGames);

    await getMatchGamesByTeamController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetMatchGamesByTeam).toHaveBeenCalledWith(85, 14);
    expect(mockJson).toHaveBeenCalledWith(mockGames);
  });
});
