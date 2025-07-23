import { type Request, type Response } from "express";
import { setPlayerKanaEloController } from "../players.controllers";
import { setPlayerKanaElo } from "../../models/player.models";

// Mock the model module
jest.mock("../../models/player.models");
const mockSetPlayerKanaElo = setPlayerKanaElo as jest.MockedFunction<
  typeof setPlayerKanaElo
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
