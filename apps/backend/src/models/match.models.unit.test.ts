import { runQuery } from "../db/mysqlRunQuery";
import { getMatchesBySeasonAndLeagueWithStreamUrls } from "./match.models";

// Mock the database connection for unit tests
jest.mock("../db/mysqlRunQuery");
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("getMatchesBySeasonAndLeagueWithStreamUrls - Unit Tests", () => {
  beforeEach(() => {
    mockRunQuery.mockClear();
  });

  it("should return matches with stream URLs", async () => {
    // Arrange
    const seasonId = 11;
    const leagueId = 1;

    const mockMatches = [
      {
        id: 1,
        league_id: 1,
        season_id: 11,
        stage: 1,
        match_date: "2025-08-01",
        start_time: "20:00:00",
        end_time: "22:00:00",
        best_of: 3,
        external_match_room_id: "room123",
        status: "SCHEDULED",
        round: 1,
        group: 1,
        league_name: "Masters",
        league_tier: 1,
        team_names: "Team Alpha vs Team Beta",
        platform: "kanaliiga",
        stream_urls:
          '["https://twitch.tv/stream1", "https://twitch.tv/stream2"]'
      }
    ];

    mockRunQuery.mockResolvedValue(mockMatches);

    // Act
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(
      seasonId,
      leagueId
    );

    // Assert
    expect(result).toEqual([
      {
        match_id: "1",
        title: "Team Alpha vs Team Beta",
        match_start: "2025-08-01T20:00:00Z",
        match_end: "2025-08-01T22:00:00Z",
        league_name: "Masters",
        league_tier: 1,
        streamUrl: ["https://twitch.tv/stream1", "https://twitch.tv/stream2"],
        match_team1: "Team Alpha",
        match_team2: "Team Beta",
        external_match_room_id: "room123",
        season_platform: "kanaliiga"
      }
    ]);
  });

  it("should handle null stream URLs", async () => {
    // Arrange
    const seasonId = 11;
    const leagueId = 1;

    const mockMatches = [
      {
        id: 2,
        league_id: 1,
        season_id: 11,
        stage: 1,
        match_date: "2025-08-02",
        start_time: "21:00:00",
        end_time: "23:00:00",
        best_of: 5,
        external_match_room_id: "room456",
        status: "SCHEDULED",
        round: 1,
        group: 1,
        league_name: "Masters",
        league_tier: 1,
        team_names: "Team Gamma vs Team Delta",
        platform: "kanaliiga",
        stream_urls: null
      }
    ];

    mockRunQuery.mockResolvedValue(mockMatches);

    // Act
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(
      seasonId,
      leagueId
    );

    // Assert
    expect(result).toEqual([
      {
        match_id: "2",
        title: "Team Gamma vs Team Delta",
        match_start: "2025-08-02T21:00:00Z",
        match_end: "2025-08-02T23:00:00Z",
        league_name: "Masters",
        league_tier: 1,
        streamUrl: [],
        match_team1: "Team Gamma",
        match_team2: "Team Delta",
        external_match_room_id: "room456",
        season_platform: "kanaliiga"
      }
    ]);
  });

  it("should return empty array when no matches found", async () => {
    // Arrange
    const seasonId = 999;
    const leagueId = 999;

    mockRunQuery.mockResolvedValue([]);

    // Act
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(
      seasonId,
      leagueId
    );

    // Assert
    expect(result).toEqual([]);
  });

  it("should calculate end time when end_time is null", async () => {
    // Arrange
    const seasonId = 1;
    const leagueId = 1;

    const mockMatches = [
      {
        id: 16,
        league_id: 1,
        season_id: 1,
        stage: 1,
        match_date: "2025-08-04",
        start_time: "20:00:00",
        end_time: null, // Test case for null end_time
        best_of: 3,
        external_match_room_id: "room789",
        status: "SCHEDULED",
        round: 1,
        group: 1,
        league_name: "Masters",
        league_tier: 1,
        team_names: "Team Echo vs Team Foxtrot",
        platform: "kanaliiga",
        stream_urls: null
      }
    ];

    mockRunQuery.mockResolvedValue(mockMatches);

    // Act
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(
      seasonId,
      leagueId
    );

    // Assert
    expect(result).toEqual([
      {
        match_id: "16",
        title: "Team Echo vs Team Foxtrot",
        match_start: "2025-08-04T20:00:00Z",
        match_end: "2025-08-04T23:00:00Z", // Expected calculated end time (20:00 + 3 hours)
        league_name: "Masters",
        league_tier: 1,
        streamUrl: [],
        match_team1: "Team Echo",
        match_team2: "Team Foxtrot",
        external_match_room_id: "room789",
        season_platform: "kanaliiga"
      }
    ]);
  });
});
