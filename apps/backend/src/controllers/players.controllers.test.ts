import { type Request, type Response } from "express";
import {
  getPlayerOldKanaEloController,
  setPlayerKanaEloController
} from "../controllers/players.controllers";
import * as playerModels from "../models/player.models";
// Mock the player models
jest.mock("../models/player.models");
const mockedPlayerModels = jest.mocked(playerModels);
const mockSetPlayerKanaElo =
  playerModels.setPlayerKanaElo as jest.MockedFunction<
    typeof playerModels.setPlayerKanaElo
  >;

describe("setPlayerKanaEloController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      params: { steam_id: "76561198123456789" },
      body: {
        kana_elo: 250,
        calculus: "test-calculus",
        season_id: 16
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  it("should successfully update kanaelo for a player", async () => {
    // Arrange
    mockSetPlayerKanaElo.mockResolvedValueOnce(true);

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockSetPlayerKanaElo).toHaveBeenCalledWith(
      "76561198123456789",
      250,
      "test-calculus",
      16
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Kana ELO updated successfully",
      steam_id: "76561198123456789",
      kana_elo: 250,
      calculus: "test-calculus",
      season_id: 16
    });
  });

  it("should return 400 when kana_elo is missing", async () => {
    // Arrange
    mockRequest.body = {
      calculus: "test-calculus",
      season_id: 16
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "kana_elo is required"
    });
  });

  it("should return 400 when calculus is missing", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      season_id: 16
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "calculus is required"
    });
  });

  it("should return 400 when season_id is missing", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      calculus: "test-calculus"
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "season_id is required"
    });
  });

  it("should return 400 when kana_elo is not a number", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: "not-a-number",
      calculus: "test-calculus",
      season_id: 16
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "kana_elo must be a number"
    });
  });

  it("should return 400 when season_id is not a number", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      calculus: "test-calculus",
      season_id: "not-a-number"
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "season_id must be a number"
    });
  });

  it("should return 400 when kana_elo is negative", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: -50,
      calculus: "test-calculus",
      season_id: 16
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "kana_elo must be between 0 and 400"
    });
  });

  it("should return 400 when kana_elo is greater than 400", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 450,
      calculus: "test-calculus",
      season_id: 16
    };

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "kana_elo must be between 0 and 400"
    });
  });

  it("should handle database errors gracefully", async () => {
    // Arrange
    mockSetPlayerKanaElo.mockRejectedValueOnce(new Error("Database error"));

    // Act & Assert
    await expect(
      setPlayerKanaEloController(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("Database error");
  });
});

describe("getPlayerOldKanaEloController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    req = {
      params: { steam_id: "76561198012345678" }
    };
    res = {
      status: mockStatus,
      json: mockJson
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return player's old kana elo for last played season", async () => {
    // Arrange
    const expectedOldKanaElo = {
      steam_id: "76561198012345678",
      last_played_season_id: 12,
      kana_elo: 1850
    };

    mockedPlayerModels.getPlayerOldKanaElo = jest
      .fn()
      .mockResolvedValue(expectedOldKanaElo);

    // Act
    await getPlayerOldKanaEloController(req as Request, res as Response);

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      "76561198012345678"
    );
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(expectedOldKanaElo);
  });

  it("should return 404 when player has no previous season data", async () => {
    // Arrange
    mockedPlayerModels.getPlayerOldKanaElo = jest.fn().mockResolvedValue(null);

    // Act
    await getPlayerOldKanaEloController(req as Request, res as Response);

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      "76561198012345678"
    );
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      message: "No previous season data found"
    });
  });

  it("should return 0 kana_elo when player exists but has no kana_elo data", async () => {
    // Arrange
    const expectedResult = {
      steam_id: "76561198012345678",
      last_played_season_id: 12,
      kana_elo: 0
    };

    mockedPlayerModels.getPlayerOldKanaElo = jest
      .fn()
      .mockResolvedValue(expectedResult);

    // Act
    await getPlayerOldKanaEloController(req as Request, res as Response);

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      "76561198012345678"
    );
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(expectedResult);
  });

  it("should return 404 when steam_id parameter is missing", async () => {
    // Arrange
    req.params = {};
    mockedPlayerModels.getPlayerOldKanaElo = jest.fn().mockResolvedValue(null);

    // Act
    await getPlayerOldKanaEloController(req as Request, res as Response);

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      undefined
    );
    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      message: "No previous season data found"
    });
  });
});
