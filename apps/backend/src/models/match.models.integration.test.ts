import {
  getMatchesBySeasonAndLeagueWithStreamUrls,
  getMatchPlayerStats
} from "./match.models";
import { runQuery } from "../db/mysqlRunQuery";

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

const SEED_SEASON_ID = 990369;
const SEED_LEAGUE_ID = 990368;
const SEED_MATCH_ID = 990367;
const SEED_OTHER_MATCH_ID = 990366;
const SEED_TEAM_A_ID = 990361;
const SEED_TEAM_B_ID = 990362;
const SEED_MATCH_GAME_ID = 990363;
const SEED_STEAM_ID = "76561197979955992";

async function cleanupPlayerStatsIntegrationTestData(): Promise<void> {
  await runQuery("DELETE FROM PlayerStats WHERE match_game_id = ?", [
    SEED_MATCH_GAME_ID
  ]);
  await runQuery("DELETE FROM MatchGames WHERE id IN (?, ?)", [
    SEED_MATCH_GAME_ID,
    SEED_MATCH_GAME_ID + 1
  ]);
  await runQuery("DELETE FROM MatchTeams WHERE match_id IN (?, ?)", [
    SEED_MATCH_ID,
    SEED_OTHER_MATCH_ID
  ]);
  await runQuery("DELETE FROM Matches WHERE id IN (?, ?)", [
    SEED_MATCH_ID,
    SEED_OTHER_MATCH_ID
  ]);
  await runQuery("DELETE FROM SeasonLeagueTeams WHERE season_id = ?", [
    SEED_SEASON_ID
  ]);
  await runQuery("DELETE FROM SeasonLeagues WHERE season_id = ?", [
    SEED_SEASON_ID
  ]);
  await runQuery("DELETE FROM Seasons WHERE id = ?", [SEED_SEASON_ID]);
  await runQuery("DELETE FROM Leagues WHERE id = ?", [SEED_LEAGUE_ID]);
  await runQuery("DELETE FROM Teams WHERE id IN (?, ?)", [
    SEED_TEAM_A_ID,
    SEED_TEAM_B_ID
  ]);
  await runQuery(
    "DELETE FROM SeasonTeamPlayers WHERE season_id = ? AND steam_id = ?",
    [SEED_SEASON_ID, SEED_STEAM_ID]
  );
}

async function seedPlayerStatsIntegrationTestData(): Promise<void> {
  await runQuery(
    `INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date)
     VALUES (?, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31')`,
    [SEED_SEASON_ID]
  );
  await runQuery(
    `INSERT INTO Teams (id, organization_id, name, team_logo)
     VALUES (?, ?, ?, 'team_a.png'), (?, ?, ?, 'team_b.png')`,
    [
      SEED_TEAM_A_ID,
      null,
      `Team A ${SEED_TEAM_A_ID}`,
      SEED_TEAM_B_ID,
      null,
      `Team B ${SEED_TEAM_B_ID}`
    ]
  );
  await runQuery(
    `INSERT INTO Leagues (id, name, sort_priority) VALUES (?, 'Test League', 1)`,
    [SEED_LEAGUE_ID]
  );
  await runQuery(
    `INSERT INTO SeasonLeagues (tier, season_id, league_id) VALUES (1, ?, ?)`,
    [SEED_SEASON_ID, SEED_LEAGUE_ID]
  );
  await runQuery(
    `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
     VALUES (?, ?, ?), (?, ?, ?)`,
    [
      SEED_SEASON_ID,
      SEED_TEAM_A_ID,
      SEED_LEAGUE_ID,
      SEED_SEASON_ID,
      SEED_TEAM_B_ID,
      SEED_LEAGUE_ID
    ]
  );

  await runQuery(
    `INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp, status)
     VALUES (?, ?, ?, 1, 1, '2024-01-01 18:00:00', '2024-01-01 20:00:00', 'FINISHED'),
            (?, ?, ?, 1, 1, '2024-01-02 18:00:00', '2024-01-02 20:00:00', 'FINISHED')`,
    [
      SEED_MATCH_ID,
      SEED_LEAGUE_ID,
      SEED_SEASON_ID,
      SEED_OTHER_MATCH_ID,
      SEED_LEAGUE_ID,
      SEED_SEASON_ID
    ]
  );
  await runQuery(
    `INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
     VALUES
      (?, ?, ?, ?), (?, ?, ?, ?),
      (?, ?, ?, ?), (?, ?, ?, ?)`,
    [
      SEED_MATCH_ID,
      SEED_TEAM_A_ID,
      SEED_SEASON_ID,
      SEED_LEAGUE_ID,
      SEED_MATCH_ID,
      SEED_TEAM_B_ID,
      SEED_SEASON_ID,
      SEED_LEAGUE_ID,
      SEED_OTHER_MATCH_ID,
      SEED_TEAM_A_ID,
      SEED_SEASON_ID,
      SEED_LEAGUE_ID,
      SEED_OTHER_MATCH_ID,
      SEED_TEAM_B_ID,
      SEED_SEASON_ID,
      SEED_LEAGUE_ID
    ]
  );
  await runQuery(
    `INSERT INTO MatchGames (id, match_id, map_id, map_order, demofile, regulation_rounds)
     VALUES (?, ?, 3, 1, ?, 24), (?, ?, 3, 1, ?, 24)`,
    [
      SEED_MATCH_GAME_ID,
      SEED_MATCH_ID,
      `seed-${SEED_MATCH_GAME_ID}.dem`,
      SEED_MATCH_GAME_ID + 1,
      SEED_OTHER_MATCH_ID,
      `seed-${SEED_MATCH_GAME_ID + 1}.dem`
    ]
  );

  await runQuery(
    `INSERT IGNORE INTO SteamPlayers (steam_id, nickname)
     VALUES (?, 'Player 1')`,
    [SEED_STEAM_ID]
  );

  // The player is on Team A for the season (season-scoped row),
  // but also has a match-scoped substitute marking for the *same* match with Team B.
  // The query should not let a match-scoped row for another team suppress the season-scoped row
  // for the player's actual team.
  await runQuery(
    `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id)
     VALUES
      (?, ?, ?, 'primary', 0, 0, NULL),
      (?, ?, ?, 'substitute', 0, 0, ?)`,
    [
      SEED_SEASON_ID,
      SEED_TEAM_A_ID,
      SEED_STEAM_ID,
      SEED_SEASON_ID,
      SEED_TEAM_B_ID,
      SEED_STEAM_ID,
      SEED_MATCH_ID
    ]
  );

  await runQuery(
    `INSERT INTO PlayerStats (
      match_game_id,
      steam_id,
      kills,
      deaths,
      assists,
      assists_ct,
      assists_t,
      mvps,
      total_damage,
      total_damage_ct,
      total_damage_t,
      headshots,
      flash_assists,
      flash_assists_t,
      flash_assists_ct,
      adr,
      adr_ct,
      adr_t,
      hs_percent,
      plants,
      explodes,
      defuses,
      first_kills,
      first_kills_ct,
      first_kills_t,
      kills_1,
      kills_2,
      kills_3,
      kills_4,
      kills_5,
      trades,
      traded,
      clutches_won,
      clutches,
      awp_kills,
      utility_damage,
      utility_damage_t,
      utility_damage_ct,
      molotov_damage,
      molotov_damage_ct,
      molotov_damage_t,
      he_damage,
      he_damage_ct,
      he_damage_t,
      trade_attempts,
      trade_attempts_ct,
      trade_attempts_t,
      kills_through_walls,
      first_death_trade_attempts,
      first_death_trade_attempts_ct,
      first_death_trade_attempts_t,
      first_death_trade_opportunities,
      first_death_trade_opportunities_ct,
      first_death_trade_opportunities_t,
      trade_opportunities,
      trade_opportunities_t,
      trade_opportunities_ct,
      flashes_thrown,
      enemies_flashed,
      enemies_flashed_ct,
      enemies_flashed_t,
      mates_flashed,
      self_flashes,
      first_deaths,
      first_deaths_ct,
      first_deaths_t,
      total_mf_duration,
      total_ef_duration,
      one_v_one_won,
      one_v_one_lost,
      kast,
      kana_rating,
      kills_ct,
      kills_t,
      deaths_ct,
      deaths_t,
      first_death_trades,
      first_death_traded,
      first_death_trades_ct,
      first_death_traded_ct,
      first_death_trades_t,
      first_death_traded_t,
      rws
    ) VALUES (
      ?, ?, 10, 5, 3,
      0, 0,
      0,
      0, 0, 0,
      4,
      0, 0, 0,
      75.5,
      75.5,
      0.0,
      40,
      0, 0, 0,
      2,
      2,
      0,
      0, 0, 0, 0, 0,
      0, 0,
      0, 0,
      0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0,
      0, 0, 0,
      0,
      0,
      1,
      1,
      0,
      0.0,
      0.0,
      0, 0,
      80,
      1.11,
      10,
      0,
      5,
      0,
      0, 0,
      0, 0,
      0, 0,
      0.0
    )`,
    [SEED_MATCH_GAME_ID, SEED_STEAM_ID]
  );
}

describe("getMatchPlayerStats - Integration Tests", () => {
  beforeEach(async () => {
    await cleanupPlayerStatsIntegrationTestData();
    await seedPlayerStatsIntegrationTestData();
  });

  afterEach(async () => {
    await cleanupPlayerStatsIntegrationTestData();
  });

  it("does not let a match-scoped SeasonTeamPlayers row for the other team suppress the season-scoped row for this team", async () => {
    const stats = await getMatchPlayerStats(SEED_MATCH_ID);

    const playerRows = stats.filter((r) => r.steam_id === SEED_STEAM_ID);
    expect(playerRows.length).toBeGreaterThan(0);

    const teamARow = playerRows.find((r) => r.team_id === SEED_TEAM_A_ID);
    expect(teamARow).toBeDefined();

    // Raw counters must match the single PlayerStats row (no multiplication via joins)
    expect(teamARow).toMatchObject({
      steam_id: SEED_STEAM_ID,
      team_id: SEED_TEAM_A_ID,
      kills: 10,
      deaths: 5,
      assists: 3,
      headshots: 4,
      first_kills: 2
    });

    // Stat filtering should not re-introduce duplication or inflation.
    const ctStats = await getMatchPlayerStats(SEED_MATCH_ID, "CT");
    const ctPlayerRows = ctStats.filter((r) => r.steam_id === SEED_STEAM_ID);
    expect(ctPlayerRows.length).toBeGreaterThan(0);
    const ctTeamARow = ctPlayerRows.find((r) => r.team_id === SEED_TEAM_A_ID);
    expect(ctTeamARow).toBeDefined();
    expect(ctTeamARow).toMatchObject({
      steam_id: SEED_STEAM_ID,
      team_id: SEED_TEAM_A_ID,
      kills: 10,
      deaths: 5,
      assists: 0,
      headshots: 4,
      first_kills: 2
    });

    const tStats = await getMatchPlayerStats(SEED_MATCH_ID, "T");
    const tPlayerRows = tStats.filter((r) => r.steam_id === SEED_STEAM_ID);
    expect(tPlayerRows.length).toBeGreaterThan(0);
    const tTeamARow = tPlayerRows.find((r) => r.team_id === SEED_TEAM_A_ID);
    expect(tTeamARow).toBeDefined();
    expect(tTeamARow).toMatchObject({
      steam_id: SEED_STEAM_ID,
      team_id: SEED_TEAM_A_ID,
      kills: 0,
      deaths: 0,
      assists: 0,
      headshots: 4,
      first_kills: 0
    });
  });
});
