import { type Request, type Response, type NextFunction } from "express";
import {
  getPlayerOldKanaEloController,
  setPlayerKanaEloController,
  resolveSteamIdController
} from "../controllers/players.controllers";
import * as playerModels from "../models/player.models";
import * as steamServices from "../services/steam.services";
import { normalizeSteamId } from "../utils/steam-id-validator";
// Mock the player models
jest.mock("../models/player.models");
jest.mock("../services/steam.services");
jest.mock("../utils/steam-id-validator");
const mockedPlayerModels = jest.mocked(playerModels);
const mockedSteamServices = jest.mocked(steamServices);
const mockedNormalizeSteamId = normalizeSteamId as jest.MockedFunction<
  typeof normalizeSteamId
>;
const mockSetPlayerKanaElo =
  playerModels.setPlayerKanaElo as jest.MockedFunction<
    typeof playerModels.setPlayerKanaElo
  >;
const mockGetPlayerSteamIdByNickname =
  playerModels.getPlayerSteamIdByNickname as jest.MockedFunction<
    typeof playerModels.getPlayerSteamIdByNickname
  >;
const mockResolveSteamIdVanityURL =
  steamServices.resolveSteamIdVanityURL as jest.MockedFunction<
    typeof steamServices.resolveSteamIdVanityURL
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

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockSetPlayerKanaElo).toHaveBeenCalledWith(
      "76561198123456789",
      250,
      "test-calculus",
      16,
      undefined, // offered_elo parameter
      undefined // connection parameter
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

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "kana_elo is required",
        status: 400
      })
    );
  });

  it("should return 400 when calculus is missing", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      season_id: 16
    };

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "calculus is required",
        status: 400
      })
    );
  });

  it("should return 400 when season_id is missing", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      calculus: "test-calculus"
    };

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "season_id is required",
        status: 400
      })
    );
  });

  it("should return 400 when kana_elo is not a number", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: "not-a-number",
      calculus: "test-calculus",
      season_id: 16
    };

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "kana_elo must be a number",
        status: 400
      })
    );
  });

  it("should return 400 when season_id is not a number", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 250,
      calculus: "test-calculus",
      season_id: "not-a-number"
    };

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "season_id must be a number",
        status: 400
      })
    );
  });

  it("should return 400 when kana_elo is negative", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: -50,
      calculus: "test-calculus",
      season_id: 16
    };

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "kana_elo must be between 0 and 400",
        status: 400
      })
    );
  });

  it("should cap kana_elo at 400 when value exceeds maximum", async () => {
    // Arrange
    mockRequest.body = {
      kana_elo: 450,
      calculus: "test-calculus",
      season_id: 16
    };

    mockSetPlayerKanaElo.mockResolvedValueOnce(true);

    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert - should cap at 400 and succeed
    expect(mockSetPlayerKanaElo).toHaveBeenCalledWith(
      "76561198123456789",
      400, // Capped at 400
      "test-calculus",
      16,
      undefined, // offered_elo parameter
      undefined // connection parameter
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Kana ELO updated successfully",
      steam_id: "76561198123456789",
      kana_elo: 400, // Capped value
      calculus: "test-calculus",
      season_id: 16
    });
  });

  it("should handle database errors gracefully", async () => {
    // Arrange
    mockSetPlayerKanaElo.mockRejectedValueOnce(new Error("Database error"));
    const mockNext = jest.fn();

    // Act
    await setPlayerKanaEloController(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to update Kana ELO",
        status: 500
      })
    );
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
    const mockNext = jest.fn();
    await getPlayerOldKanaEloController(
      req as Request,
      res as Response,
      mockNext
    );

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

    const mockNext = jest.fn();
    // Act
    await getPlayerOldKanaEloController(
      req as Request,
      res as Response,
      mockNext
    );

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      "76561198012345678"
    );
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No previous season data found",
        status: 404
      })
    );
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

    const mockNext = jest.fn();
    // Act
    await getPlayerOldKanaEloController(
      req as Request,
      res as Response,
      mockNext
    );

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
    const mockNext = jest.fn();
    await getPlayerOldKanaEloController(
      req as Request,
      res as Response,
      mockNext
    );

    // Assert
    expect(mockedPlayerModels.getPlayerOldKanaElo).toHaveBeenCalledWith(
      undefined
    );
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "No previous season data found",
        status: 404
      })
    );
  });
});

describe("resolveSteamIdController", () => {
  let req: Partial<Request & { params: { steam_id: string } }>;
  let res: Partial<Response>;
  let next: NextFunction;
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
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("resolution order", () => {
    it("should resolve SteamID64 format directly (local normalization)", async () => {
      // Arrange
      const steamId64 = "76561198012345678";
      req.params = { steam_id: steamId64 };
      mockedNormalizeSteamId.mockReturnValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(mockedNormalizeSteamId).toHaveBeenCalledWith(steamId64);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      expect(mockGetPlayerSteamIdByNickname).not.toHaveBeenCalled();
      expect(mockResolveSteamIdVanityURL).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should resolve SteamID format (local normalization)", async () => {
      // Arrange
      const steamId = "STEAM_0:1:44739960";
      const steamId64 = "76561198049745649";
      req.params = { steam_id: steamId };
      mockedNormalizeSteamId.mockReturnValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(mockedNormalizeSteamId).toHaveBeenCalledWith(steamId);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      expect(mockGetPlayerSteamIdByNickname).not.toHaveBeenCalled();
      expect(mockResolveSteamIdVanityURL).not.toHaveBeenCalled();
    });

    it("should search database before Steam API for nicknames", async () => {
      // Arrange
      const nickname = "heppajpg";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: nickname };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert - Database should be checked first
      expect(mockedNormalizeSteamId).toHaveBeenCalledWith(nickname);
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith(nickname);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      // Steam API should NOT be called since database found it
      expect(mockResolveSteamIdVanityURL).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should search database for provider_username", async () => {
      // Arrange
      const providerUsername = "testuser";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: providerUsername };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith(
        providerUsername
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      expect(mockResolveSteamIdVanityURL).not.toHaveBeenCalled();
    });

    it("should search database for faceit_nickname", async () => {
      // Arrange
      const faceitNickname = "TestFaceITPlayer";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: faceitNickname };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith(
        faceitNickname
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      expect(mockResolveSteamIdVanityURL).not.toHaveBeenCalled();
    });

    it("should fall back to Steam API if database search fails", async () => {
      // Arrange
      const vanityUrl = "sububobi";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: vanityUrl };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(null);
      mockResolveSteamIdVanityURL.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert - Database should be checked first, then Steam API
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith(vanityUrl);
      expect(mockResolveSteamIdVanityURL).toHaveBeenCalledWith(vanityUrl);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ steamId64 });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return error if all resolution methods fail", async () => {
      // Arrange
      const invalidInput = "nonexistent";
      req.params = { steam_id: invalidInput };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(null);
      mockResolveSteamIdVanityURL.mockRejectedValue(
        new Error("Vanity URL not found")
      );

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith(invalidInput);
      expect(mockResolveSteamIdVanityURL).toHaveBeenCalledWith(invalidInput);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Could not resolve Steam ID"),
          status: 400
        })
      );
      expect(mockStatus).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle URL-encoded input", async () => {
      // Arrange
      const encodedInput = "https%3A%2F%2Fsteamcommunity.com%2Fid%2Fsububobi";
      const decodedInput = "https://steamcommunity.com/id/sububobi";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: encodedInput };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(null);
      mockResolveSteamIdVanityURL.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert - Should decode and use decoded value
      expect(mockResolveSteamIdVanityURL).toHaveBeenCalledWith(decodedInput);
    });

    it("should handle empty input", async () => {
      // Arrange
      req.params = { steam_id: "" };

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Steam ID is required",
          status: 400
        })
      );
    });

    it("should trim whitespace when searching database", async () => {
      // Arrange
      const nickname = "  heppajpg  ";
      const steamId64 = "76561198012345678";
      req.params = { steam_id: nickname };
      mockedNormalizeSteamId.mockImplementation(() => {
        throw new Error("Not a valid Steam ID format");
      });
      mockGetPlayerSteamIdByNickname.mockResolvedValue(steamId64);

      // Act
      await resolveSteamIdController(req as any, res as Response, next);

      // Assert - Should trim before searching
      expect(mockGetPlayerSteamIdByNickname).toHaveBeenCalledWith("heppajpg");
    });
  });
});
