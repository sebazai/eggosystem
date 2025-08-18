import { type Request, type Response, type NextFunction } from "express";
import * as playerHistoricalModels from "../../models/player-historical.models";
import { getPlayerHistoricalDataController } from "../../controllers/players.controllers";

// Mock the player historical models
jest.mock("../../../models/player-historical.models");

const mockPlayerModels = playerHistoricalModels as jest.Mocked<
  typeof playerHistoricalModels
>;

describe("getPlayerHistoricalDataController", () => {
  const steam_id = "76561198123456789";
  const mockHistoricalData = [
    {
      match_id: 123,
      game_id: 456,
      match_date: "2024-01-15",
      kana_rating: 1250.5,
      kd_ratio: 1.25,
      adr: 85.3,
      ttd: 2.1,
      crosshair_placement: 72.5,
      counter_strafing_percent: 68.2,
      hs_percent: 45
    },
    {
      match_id: 124,
      game_id: 457,
      match_date: "2024-01-10",
      kana_rating: 1230.2,
      kd_ratio: 1.15,
      adr: 82.1,
      ttd: 2.3,
      crosshair_placement: 70.8,
      counter_strafing_percent: 65.4,
      hs_percent: 42
    }
  ];

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      params: { steam_id },
      query: {} // Add empty query object
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  it("should return historical data for a valid steam_id", async () => {
    (mockPlayerModels.getPlayerHistoricalData as jest.Mock).mockResolvedValue(
      mockHistoricalData
    );

    await getPlayerHistoricalDataController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith(mockHistoricalData);
    expect(mockPlayerModels.getPlayerHistoricalData).toHaveBeenCalledWith(
      steam_id,
      {} // params object from parseHistoricalParams(req.query)
    );
  });

  it("should return empty array when player has no historical data", async () => {
    (mockPlayerModels.getPlayerHistoricalData as jest.Mock).mockResolvedValue(
      []
    );

    await getPlayerHistoricalDataController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith([]);
    expect(mockPlayerModels.getPlayerHistoricalData).toHaveBeenCalledWith(
      steam_id,
      {} // params object from parseHistoricalParams(req.query)
    );
  });

  it("should handle database errors by calling next with error", async () => {
    const error = new Error("Database connection failed");
    (mockPlayerModels.getPlayerHistoricalData as jest.Mock).mockRejectedValue(
      error
    );

    await getPlayerHistoricalDataController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should handle invalid steam_id format", async () => {
    const invalidSteamId = "invalid-steam-id";
    mockRequest.params = { steam_id: invalidSteamId };
    (mockPlayerModels.getPlayerHistoricalData as jest.Mock).mockResolvedValue(
      []
    );

    await getPlayerHistoricalDataController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockPlayerModels.getPlayerHistoricalData).toHaveBeenCalledWith(
      invalidSteamId,
      {} // params object from parseHistoricalParams(req.query)
    );
    expect(mockResponse.json).toHaveBeenCalledWith([]);
  });

  it("should handle query parameters correctly", async () => {
    mockRequest.query = { games: "10", period: "this_season" };
    (mockPlayerModels.getPlayerHistoricalData as jest.Mock).mockResolvedValue(
      mockHistoricalData
    );

    await getPlayerHistoricalDataController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.json).toHaveBeenCalledWith(mockHistoricalData);
    expect(mockPlayerModels.getPlayerHistoricalData).toHaveBeenCalledWith(
      steam_id,
      { games: 10, period: "this_season" } // parsed params
    );
  });
});
