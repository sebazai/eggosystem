import { getLeaderboard } from "../models/leaderboards.models";
import { getSingleLeaderboardController } from "./leaderboards.controllers";
import { type Request, type Response } from "express";
import { type ParsedParams } from "@eggosystem/types";

// Mock the implementation, not just the type
jest.mock("../models/leaderboards.models", () => ({
  getLeaderboard: jest.fn()
}));

describe("Leaderboards Controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      query: { leaderboards: "kills" },
      parsedParams: {
        season_ids: null,
        league_ids: null,
        team_ids: null,
        stages: null,
        map_ids: null,
        playerName: null
      } as ParsedParams
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getSingleLeaderboardController", () => {
    it("should return leaderboard data when valid params are provided", async () => {
      // Arrange
      const mockLeaderboardData = {
        kills: [
          {
            steam_id: "123",
            nickname: "player1",
            team_name: "team1",
            team_logo: "logo1.png",
            matches_played: 5,
            kills: 100
          }
        ]
      };

      (getLeaderboard as jest.Mock).mockResolvedValueOnce(mockLeaderboardData);

      // Act
      const mockNext = jest.fn();
      await getSingleLeaderboardController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(getLeaderboard).toHaveBeenCalledWith({
        ...mockRequest.parsedParams,
        leaderboards: "kills"
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLeaderboardData);
    });

    it("should return 400 when leaderboards param is missing", async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      const mockNext = jest.fn();
      await getSingleLeaderboardController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Leaderboards type is required",
          status: 400
        })
      );
    });
  });
});
