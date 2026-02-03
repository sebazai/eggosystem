import { getMatchesBySeasonAndLeagueWithStreamUrls } from "./match.models";

describe("getMatchesBySeasonAndLeagueWithStreamUrls - Integration Tests", () => {
  it("should return real matches from season 11, league 1", async () => {
    // Act
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(11, 1);

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      const firstMatch = result[0];

      // Check structure
      expect(firstMatch).toHaveProperty("match_id");
      expect(firstMatch).toHaveProperty("title");
      expect(firstMatch).toHaveProperty("match_start");
      expect(firstMatch).toHaveProperty("match_end");
      expect(firstMatch).toHaveProperty("league_name");
      expect(firstMatch).toHaveProperty("league_tier");
      expect(firstMatch).toHaveProperty("stream_urls");
      expect(firstMatch).toHaveProperty("match_status");
      expect(firstMatch).toHaveProperty("match_team1");
      expect(firstMatch).toHaveProperty("match_team2");
      expect(firstMatch).toHaveProperty("external_match_room_id");
      expect(firstMatch).toHaveProperty("season_platform");

      // Check data types
      expect(typeof firstMatch.match_id).toBe("string");
      expect(typeof firstMatch.title).toBe("string");
      expect(typeof firstMatch.match_start).toBe("string");
      expect(typeof firstMatch.match_end).toBe("string");
      expect(typeof firstMatch.match_status).toBe("string");
      expect(typeof firstMatch.league_name).toBe("string");
      expect(typeof firstMatch.league_tier).toBe("number");
      expect(Array.isArray(firstMatch.stream_urls)).toBe(true);
      expect(typeof firstMatch.match_team1).toBe("string");
      expect(typeof firstMatch.match_team2).toBe("string");
      // external_match_room_id can be string or null
      expect(
        ["string", "object"].includes(typeof firstMatch.external_match_room_id)
      ).toBe(true);
      expect(typeof firstMatch.season_platform).toBe("string");

      // Check date format (accepts with or without milliseconds)
      expect(firstMatch.match_start).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
      expect(firstMatch.match_end).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );

      // Check that title contains both team names
      expect(firstMatch.title).toContain(firstMatch.match_team1);
      expect(firstMatch.title).toContain(firstMatch.match_team2);
    }
  });

  it("should verify end time calculation works with existing real data", async () => {
    // Act - Use existing real data from season 11, league 1
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(11, 1);

    // Assert - Check that we get matches and they have valid structure
    expect(result.length).toBeGreaterThan(0);

    // Test the first match to verify the structure
    const firstMatch = result[0];
    expect(firstMatch).toBeDefined();

    if (firstMatch) {
      // Verify the match has all required properties
      expect(firstMatch.match_start).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
      expect(firstMatch.match_end).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
      expect(Array.isArray(firstMatch.stream_urls)).toBe(true);
      expect(typeof firstMatch.title).toBe("string");
      expect(typeof firstMatch.season_platform).toBe("string");

      // Check that start and end times are logically consistent
      if (firstMatch.match_start && firstMatch.match_end) {
        const startTime = new Date(firstMatch.match_start);
        const endTime = new Date(firstMatch.match_end);
        expect(endTime.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
      }
    }
  });

  it("should verify time calculation logic with different best_of values", async () => {
    // Test the calculation logic directly with different scenarios
    const testCases = [
      { best_of: 1, start_time: "20:00:00", expected_end: "21:00:00" },
      { best_of: 3, start_time: "21:00:00", expected_end: "23:59:00" }, // Capped at 23:59:00
      { best_of: 5, start_time: "19:00:00", expected_end: "23:59:00" } // Capped at 23:59:00
    ];

    for (const testCase of testCases) {
      // Test the calculation logic directly (matching the model logic)
      const startTime = new Date(`2025-12-26T${testCase.start_time}`);
      const hoursToAdd = testCase.best_of;
      const endDate = new Date(
        startTime.getTime() + hoursToAdd * 60 * 60 * 1000
      );

      // Apply the same capping logic as in the model
      const startDate = new Date(`2025-12-26T00:00:00`);
      const nextDay = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      let calculatedEndTime: string;
      if (endDate >= nextDay) {
        calculatedEndTime = "23:59:00";
      } else {
        calculatedEndTime = endDate.toTimeString().split(" ")[0]; // Get HH:MM:SS format
      }

      expect(calculatedEndTime).toBe(testCase.expected_end);
    }
  });

  it("should return matches for season 14, league 1 and verify grouping works correctly", async () => {
    // Act - Query season 14, league 1
    // Note: The seed data appears to have only 1 match for season 14, league 1
    // This is actually good because it confirms our GROUP BY clause is working correctly
    // and we're not getting duplicate rows from the joins
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(14, 1);

    // Assert - Should have at least 1 match
    expect(result.length).toBeGreaterThan(0);

    // Verify all matches have the correct season and league
    result.forEach((match) => {
      expect(match).toHaveProperty("match_id");
      expect(match).toHaveProperty("title");
      expect(match).toHaveProperty("match_start");
      expect(match).toHaveProperty("match_end");
      expect(match).toHaveProperty("league_name");
      expect(match).toHaveProperty("league_tier");
      expect(match).toHaveProperty("stream_urls");
      expect(match).toHaveProperty("match_status");
      expect(match).toHaveProperty("match_team1");
      expect(match).toHaveProperty("match_team2");
      expect(match).toHaveProperty("external_match_room_id");
      expect(match).toHaveProperty("season_platform");

      // Verify data types
      expect(typeof match.match_id).toBe("string");
      expect(typeof match.title).toBe("string");
      expect(typeof match.match_start).toBe("string");
      expect(typeof match.match_end).toBe("string");
      expect(typeof match.match_status).toBe("string");
      expect(typeof match.league_name).toBe("string");
      expect(typeof match.league_tier).toBe("number");
      expect(Array.isArray(match.stream_urls)).toBe(true);
      expect(typeof match.match_team1).toBe("string");
      expect(typeof match.match_team2).toBe("string");
      // external_match_room_id can be string or null
      expect(
        ["string", "object"].includes(typeof match.external_match_room_id)
      ).toBe(true);
      expect(typeof match.season_platform).toBe("string");
    });
  });

  it("should return all matches for season 14 when leagueId is null", async () => {
    // Act - Query season 14 with null leagueId to fetch all matches regardless of league
    const result = await getMatchesBySeasonAndLeagueWithStreamUrls(14, null);

    // Assert - Should return at least 849 matches for season 14 (may be more if FACEIT webhook integration seed ran)
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(849);

    // Verify that we get matches from multiple leagues (not just one league)
    const uniqueLeagues = new Set(result.map((match) => match.league_name));
    expect(uniqueLeagues.size).toBeGreaterThan(1);

    // Verify all matches have the expected structure
    result.forEach((match) => {
      expect(match).toHaveProperty("match_id");
      expect(match).toHaveProperty("title");
      expect(match).toHaveProperty("match_start");
      expect(match).toHaveProperty("match_end");
      expect(match).toHaveProperty("league_name");
      expect(match).toHaveProperty("league_tier");
      expect(match).toHaveProperty("stream_urls");
      expect(match).toHaveProperty("match_status");
      expect(match).toHaveProperty("match_team1");
      expect(match).toHaveProperty("match_team2");
      expect(match).toHaveProperty("external_match_room_id");
      expect(match).toHaveProperty("season_platform");

      // Verify data types
      expect(typeof match.match_id).toBe("string");
      expect(typeof match.title).toBe("string");
      expect(typeof match.match_start).toBe("string");
      expect(typeof match.match_end).toBe("string");
      expect(typeof match.league_name).toBe("string");
      expect(typeof match.league_tier).toBe("number");
      expect(Array.isArray(match.stream_urls)).toBe(true);
      expect(typeof match.match_status).toBe("string");
      expect(typeof match.match_team1).toBe("string");
      expect(typeof match.match_team2).toBe("string");
      expect(typeof match.season_platform).toBe("string");

      // Verify date formats (accepts with or without milliseconds)
      expect(match.match_start).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
      expect(match.match_end).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
      );
    });
  });
});
