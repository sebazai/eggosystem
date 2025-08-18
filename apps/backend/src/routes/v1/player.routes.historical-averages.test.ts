import { type Request, type Response, type NextFunction } from "express";
import * as playerHistoricalModels from "../../models/player-historical.models";
import {
  getPlayerHistoricalAverageByRankController,
  getPlayerHistoricalAverageByLevelController,
  getPlayerHistoricalAverageController
} from "../../controllers/players.controllers";

// Mock the player historical models
jest.mock("../../models/player-historical.models");

const mockPlayerModels = playerHistoricalModels as jest.Mocked<
  typeof playerHistoricalModels
>;

describe("Historical Average Controllers", () => {
  const mockAverageData = {
    avg_kana_rating: 1250.5,
    avg_kd_ratio: 1.15,
    avg_adr: 82.3,
    avg_ttd: 2.2,
    avg_crosshair_placement: 71.5,
    avg_counter_strafing_percent: 66.8,
    avg_hs_percent: 43
  };

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe("getPlayerHistoricalAverageByRankController", () => {
    beforeEach(() => {
      mockRequest = {
        params: { rank: "15000" },
        query: {}
      };
    });

    it("should return average data for players with CS2 rank range", async () => {
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockAverageData);
      expect(
        mockPlayerModels.getPlayerHistoricalAverageByRank
      ).toHaveBeenCalledWith(15000, { games: 15 });
    });

    it("should handle custom games parameter", async () => {
      mockRequest.query = { games: "30" };
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockPlayerModels.getPlayerHistoricalAverageByRank
      ).toHaveBeenCalledWith(15000, { games: 30 });
    });

    it("should handle period parameter", async () => {
      mockRequest.query = { period: "this_season" };
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockPlayerModels.getPlayerHistoricalAverageByRank
      ).toHaveBeenCalledWith(15000, { games: 15, period: "this_season" });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockRejectedValue(error);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle low rank range (0-500 maps to 0-1000)", async () => {
      mockRequest.params = { rank: "300" }; // Low rank that should use 0-1000 range
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockPlayerModels.getPlayerHistoricalAverageByRank
      ).toHaveBeenCalledWith(300, { games: 15 });
    });

    it("should handle high rank values", async () => {
      mockRequest.params = { rank: "25000" };
      (
        mockPlayerModels.getPlayerHistoricalAverageByRank as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByRankController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockPlayerModels.getPlayerHistoricalAverageByRank
      ).toHaveBeenCalledWith(25000, { games: 15 });
    });
  });

  describe("getPlayerHistoricalAverageByLevelController", () => {
    beforeEach(() => {
      mockRequest = {
        params: { level: "5" },
        query: {}
      };
    });

    it("should return average data for players with specific Faceit level", async () => {
      (
        mockPlayerModels.getPlayerHistoricalAverageByLevel as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByLevelController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockAverageData);
      expect(
        mockPlayerModels.getPlayerHistoricalAverageByLevel
      ).toHaveBeenCalledWith(5, { games: 15 });
    });

    it("should handle custom parameters", async () => {
      mockRequest.query = { games: "20", period: "last_season" };
      (
        mockPlayerModels.getPlayerHistoricalAverageByLevel as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageByLevelController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(
        mockPlayerModels.getPlayerHistoricalAverageByLevel
      ).toHaveBeenCalledWith(5, { games: 20, period: "last_season" });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (
        mockPlayerModels.getPlayerHistoricalAverageByLevel as jest.Mock
      ).mockRejectedValue(error);

      await getPlayerHistoricalAverageByLevelController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPlayerHistoricalAverageController", () => {
    beforeEach(() => {
      mockRequest = {
        query: {}
      };
    });

    it("should return average data for all players with default parameters", async () => {
      (
        mockPlayerModels.getPlayerHistoricalAverage as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockAverageData);
      expect(mockPlayerModels.getPlayerHistoricalAverage).toHaveBeenCalledWith({
        games: 15
      });
    });

    it("should handle custom parameters", async () => {
      mockRequest.query = { games: "50", period: "this_season" };
      (
        mockPlayerModels.getPlayerHistoricalAverage as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPlayerModels.getPlayerHistoricalAverage).toHaveBeenCalledWith({
        games: 50,
        period: "this_season"
      });
    });

    it("should handle invalid games parameter by using default", async () => {
      mockRequest.query = { games: "invalid" };
      (
        mockPlayerModels.getPlayerHistoricalAverage as jest.Mock
      ).mockResolvedValue(mockAverageData);

      await getPlayerHistoricalAverageController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPlayerModels.getPlayerHistoricalAverage).toHaveBeenCalledWith({
        games: 15
      });
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (
        mockPlayerModels.getPlayerHistoricalAverage as jest.Mock
      ).mockRejectedValue(error);

      await getPlayerHistoricalAverageController(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
