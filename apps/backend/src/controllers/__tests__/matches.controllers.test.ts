import { type Response } from "express";
import { getMatchesByTeamController } from "../matches.controllers";
import { getMatchesByTeam } from "../../models/match.models";
import type { RequestWithParams, MatchesByTeam } from "@eggosystem/types";

// Mock the model
jest.mock("../../models/match.models");
const mockGetMatchesByTeam = getMatchesByTeam as jest.MockedFunction<
  typeof getMatchesByTeam
>;

describe("getMatchesByTeamController", () => {
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

  it("should return matches for a valid team with season filter", async () => {
    const mockMatches: MatchesByTeam[] = [
      {
        id: 1,
        team1_id: 123,
        team2_id: 456,
        team1_name: "Team A",
        team2_name: "Team B",
        team1_score: 2,
        team2_score: 1,
        match_date: "2024-01-15",
        league_id: 10,
        season_id: 15
      },
      {
        id: 2,
        team1_id: 789,
        team2_id: 123,
        team1_name: "Team C",
        team2_name: "Team A",
        team1_score: 0,
        team2_score: 2,
        match_date: "2024-01-10",
        league_id: 10,
        season_id: 15
      }
    ];

    mockGetMatchesByTeam.mockResolvedValue(mockMatches);

    await getMatchesByTeamController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetMatchesByTeam).toHaveBeenCalledWith(123, 15);
    expect(mockJson).toHaveBeenCalledWith(mockMatches);
  });

  it("should return matches for all seasons when no season_id provided", async () => {
    mockRequest.query = {};
    const mockMatches: MatchesByTeam[] = [];

    mockGetMatchesByTeam.mockResolvedValue(mockMatches);

    await getMatchesByTeamController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetMatchesByTeam).toHaveBeenCalledWith(123, undefined);
    expect(mockJson).toHaveBeenCalledWith(mockMatches);
  });

  it("should return empty array when team has no matches", async () => {
    mockGetMatchesByTeam.mockResolvedValue([]);

    await getMatchesByTeamController(
      mockRequest as RequestWithParams<{ team_id: string }>,
      mockResponse as Response
    );

    expect(mockGetMatchesByTeam).toHaveBeenCalledWith(123, 15);
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it("should handle database errors", async () => {
    const error = new Error("Database connection failed");
    mockGetMatchesByTeam.mockRejectedValue(error);

    await expect(
      getMatchesByTeamController(
        mockRequest as RequestWithParams<{ team_id: string }>,
        mockResponse as Response
      )
    ).rejects.toThrow("Database connection failed");

    expect(mockGetMatchesByTeam).toHaveBeenCalledWith(123, 15);
  });
});
