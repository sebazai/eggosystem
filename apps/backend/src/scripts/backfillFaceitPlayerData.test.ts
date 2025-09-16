import { backfillFaceitData } from "./backfillFaceitPlayerData";
import { runQuery } from "../db/mysqlRunQuery";
import { fetchFaceitPlayerData } from "../services/faceit.services";
import { logger } from "../utils/app-logger";

// Mock dependencies
jest.mock("../db/mysqlRunQuery");
jest.mock("../services/faceit.services");
jest.mock("../utils/app-logger");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockFetchFaceitPlayerData = fetchFaceitPlayerData as jest.MockedFunction<
  typeof fetchFaceitPlayerData
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("backfillFaceitPlayerData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should process players and update FaceIT data", async () => {
    // Mock database query to return test players
    const mockPlayers = [
      {
        steam_id: "76561198000000001",
        nickname: "TestPlayer1",
        faceit_nickname: null,
        faceit_id: null
      },
      {
        steam_id: "76561198000000002",
        nickname: "TestPlayer2",
        faceit_nickname: null,
        faceit_id: null
      }
    ];

    mockRunQuery
      .mockResolvedValueOnce(mockPlayers) // getSeason16Players query
      .mockResolvedValueOnce(undefined) // updatePlayerFaceitData for player 1
      .mockResolvedValueOnce(undefined); // updatePlayerFaceitData for player 2

    // Mock FaceIT API responses
    mockFetchFaceitPlayerData
      .mockResolvedValueOnce({
        player_id: "faceit-player-1",
        nickname: "FaceITPlayer1",
        games: {
          cs2: {
            skill_level: 7,
            faceit_elo: 1850
          }
        },
        faceit_url: "https://www.faceit.com/en/players/faceit-player-1"
      })
      .mockResolvedValueOnce({
        player_id: "faceit-player-2",
        nickname: "FaceITPlayer2",
        games: {
          cs2: {
            skill_level: 6,
            faceit_elo: 1750
          }
        },
        faceit_url: "https://www.faceit.com/en/players/faceit-player-2"
      });

    await backfillFaceitData();

    // Verify database queries were called correctly
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT DISTINCT")
    );

    // Verify FaceIT API was called for each player
    expect(mockFetchFaceitPlayerData).toHaveBeenCalledWith(
      "76561198000000001",
      "cs2"
    );
    expect(mockFetchFaceitPlayerData).toHaveBeenCalledWith(
      "76561198000000002",
      "cs2"
    );

    // Verify database updates were called
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE SteamPlayers"),
      ["FaceITPlayer1", "faceit-player-1", "76561198000000001"]
    );
    expect(mockRunQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("UPDATE SteamPlayers"),
      ["FaceITPlayer2", "faceit-player-2", "76561198000000002"]
    );

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Starting FaceIT data backfill for Season 16 players"
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Found 2 Season 16 players without FaceIT data"
    );
  });

  it("should handle players with no FaceIT data gracefully", async () => {
    const mockPlayers = [
      {
        steam_id: "76561198000000003",
        nickname: "NoFaceITPlayer",
        faceit_nickname: null,
        faceit_id: null
      }
    ];

    mockRunQuery.mockResolvedValueOnce(mockPlayers);
    mockFetchFaceitPlayerData.mockResolvedValueOnce(null);

    await backfillFaceitData();

    expect(mockFetchFaceitPlayerData).toHaveBeenCalledWith(
      "76561198000000003",
      "cs2"
    );
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "No FaceIT data found for player 76561198000000003"
    );
  });

  it("should handle API errors gracefully", async () => {
    const mockPlayers = [
      {
        steam_id: "76561198000000004",
        nickname: "ErrorPlayer",
        faceit_nickname: null,
        faceit_id: null
      }
    ];

    mockRunQuery.mockResolvedValueOnce(mockPlayers);
    mockFetchFaceitPlayerData.mockRejectedValueOnce(new Error("API Error"));

    await backfillFaceitData();

    expect(mockFetchFaceitPlayerData).toHaveBeenCalledWith(
      "76561198000000004",
      "cs2"
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Error processing player 76561198000000004:",
      expect.any(Error)
    );
  });

  it("should handle empty player list", async () => {
    mockRunQuery.mockResolvedValueOnce([]);

    await backfillFaceitData();

    expect(mockLogger.info).toHaveBeenCalledWith(
      "No players found that need FaceIT data backfill"
    );
    expect(mockFetchFaceitPlayerData).not.toHaveBeenCalled();
  });
});
