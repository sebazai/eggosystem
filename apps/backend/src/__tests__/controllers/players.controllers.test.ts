import { type Request, type Response } from "express";
import { getPlayerOldKanaEloController } from "../../controllers/players.controllers";
import * as playerModels from "../../models/player.models";

// Mock the player models
jest.mock("../../models/player.models");
const mockedPlayerModels = jest.mocked(playerModels);

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
