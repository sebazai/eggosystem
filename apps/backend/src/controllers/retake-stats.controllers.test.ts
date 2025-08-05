import { getTeamRetakeStats } from "../models/retake-stats.models";
import { getTeamRetakeStatsController } from "./retake-stats.controllers";
import { type Response } from "express";
import { type RequestWithParams, type ParsedParams } from "@eggosystem/types";

// Mock the model
jest.mock("../models/retake-stats.models", () => ({
  getTeamRetakeStats: jest.fn()
}));

describe("getTeamRetakeStatsController", () => {
  let mockReq: Partial<RequestWithParams<{ teamId: string }>> & {
    parsedParams: ParsedParams;
  };
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnValue({ json: jsonSpy }),
      json: jsonSpy
    };

    mockReq = {
      params: {
        teamId: "123"
      },
      parsedParams: {
        season_ids: [1],
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        playerName: null
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return retake stats data with status 200", async () => {
    // Mock data
    const mockRetakeStats = [
      {
        season_id: 1,
        season_name: "Season 1",
        map_id: 1,
        map_name: "de_dust2",
        team_id: 123,
        team_name: "Test Team",
        afterplant_total: 10,
        afterplant_won: 6,
        afterplant_win_percentage: 60,
        retake_total: 8,
        retake_won: 3,
        retake_win_percentage: 38
      }
    ];

    (getTeamRetakeStats as jest.Mock).mockResolvedValue(mockRetakeStats);

    // Call controller
    await getTeamRetakeStatsController(
      mockReq as RequestWithParams<{ teamId: string }>,
      mockRes as Response
    );

    // Verify model was called with correct parameters
    expect(getTeamRetakeStats).toHaveBeenCalledWith(123, mockReq.parsedParams);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(jsonSpy).toHaveBeenCalledWith({
      success: true,
      data: mockRetakeStats
    });
  });

  it("should convert teamId to number", async () => {
    (getTeamRetakeStats as jest.Mock).mockResolvedValue([]);

    // Call controller
    await getTeamRetakeStatsController(
      mockReq as RequestWithParams<{ teamId: string }>,
      mockRes as Response
    );

    // Verify teamId was converted to number
    expect(getTeamRetakeStats).toHaveBeenCalledWith(123, expect.anything());
  });
});
