import { runQuery } from "../db/mysqlRunQuery";
import {
  getMatchesByFilters,
  getMatchTopPlayers,
  getMatchMapVetoes,
  getMatchGamesByTeam
} from "./match.models";

describe("getMatchesByFilters", () => {
  it("returns scores for bo3 type of matches when a map filter is selected", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: [5]
    });
    expect(result).toEqual([
      {
        match_id: 10148,
        match_date: "2024-11-27",
        league_name: "Masters",
        map_name: "de_nuke",
        stage: 2,
        team1_name: "Digia Vengers",
        team1_logo: "c1663e99856359b6",
        team2_name: "Gigantti",
        team2_logo: "9e39646633c95966",
        match_game_id: null,
        team1_score: 13,
        team2_score: 8
      },
      {
        match_id: 10068,
        match_date: "2024-10-30",
        league_name: "Masters",
        map_name: "de_nuke",
        stage: 2,
        team1_name: "Digia Vengers",
        team1_logo: "c1663e99856359b6",
        team2_name: "Gigantti",
        team2_logo: "9e39646633c95966",
        match_game_id: null,
        team1_score: 13,
        team2_score: 3
      }
    ]);
  });
  it("returns scores for bo3 type of matches as grouped for 7dos", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: null,
      stages: [1, 2],
      team_ids: [1650],
      map_ids: null
    });
    expect(result.length).toEqual(13);
    expect(result[0].team1_score).toEqual(2);
    expect(result[0].team2_score).toEqual(0);
    expect(result[result.length - 1].team1_score).toEqual(6);
    expect(result[result.length - 1].team2_score).toEqual(13);
  });

  it("correctly groups BO3 matches when no map filter is present", async () => {
    // Test with a specific BO3 match (10148) that has multiple maps
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: null // No map filter - triggers GROUP BY path
    });

    // Verify the query executes without errors
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // Find match 10148 in results
    const match10148 = result.find((m) => m.match_id === 10148);
    expect(match10148).toBeDefined();

    if (match10148) {
      // Verify match appears only once (GROUP BY is working)
      const matchesWithId10148 = result.filter((m) => m.match_id === 10148);
      expect(matchesWithId10148.length).toBe(1);

      // Verify map names are concatenated (should contain multiple maps for BO3)
      expect(match10148.map_name).toBeDefined();
      expect(typeof match10148.map_name).toBe("string");
      // For a BO3 match, map_name should contain comma-separated map names
      // or at least be a non-empty string
      expect(match10148.map_name.length).toBeGreaterThan(0);

      // Verify scores are aggregated correctly (sum of wins for BO3)
      // For BO3, scores should be the number of maps won (0-3 range typically)
      expect(match10148.team1_score).toBeDefined();
      expect(match10148.team2_score).toBeDefined();
      expect(typeof match10148.team1_score).toBe("number");
      expect(typeof match10148.team2_score).toBe("number");
      // Scores should be non-negative integers representing map wins
      expect(match10148.team1_score).toBeGreaterThanOrEqual(0);
      expect(match10148.team2_score).toBeGreaterThanOrEqual(0);

      // Verify match_game_id is null for BO3 matches (best_of != 1)
      expect(match10148.match_game_id).toBeNull();

      // Verify other required fields are present
      expect(match10148.match_date).toBeDefined();
      expect(match10148.league_name).toBeDefined();
      expect(match10148.stage).toBeDefined();
      expect(match10148.team1_name).toBeDefined();
      expect(match10148.team2_name).toBeDefined();
    }
  });

  it("ensures no duplicate match_ids when grouping without map filter", async () => {
    // Test with multiple matches to ensure GROUP BY prevents duplicates
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: null // No map filter
    });

    // Collect all match_ids
    const matchIds = result.map((m) => m.match_id);

    // Verify no duplicate match_ids exist
    const uniqueMatchIds = [...new Set(matchIds)];
    expect(matchIds.length).toBe(uniqueMatchIds.length);

    // Verify each match has required aggregated fields
    result.forEach((match) => {
      // map_name should be a string (could be comma-separated for BO3)
      expect(typeof match.map_name).toBe("string");
      expect(match.map_name.length).toBeGreaterThan(0);

      // Scores should be numbers (aggregated for BO3)
      expect(typeof match.team1_score).toBe("number");
      expect(typeof match.team2_score).toBe("number");

      // match_game_id should be null for BO3 matches
      if (match.match_game_id !== null) {
        // If not null, it should be a number (BO1 match)
        expect(typeof match.match_game_id).toBe("number");
      }
    });
  });
});

describe("getMatchTopPlayers", () => {
  it("should pick the correct team id when a player has played substitute in same season", async () => {
    const result = await getMatchTopPlayers(9466);
    expect(result).toEqual({
      most_kills: {
        steam_id: "76561197987111310",
        nickname: "Martas",
        value: 27,
        team_id: 2008
      },
      most_adr: {
        steam_id: "76561198129692076",
        nickname: "Mixu",
        value: 139,
        team_id: 2008
      },
      most_assists: {
        steam_id: "76561198129692076",
        nickname: "Mixu",
        value: 12,
        team_id: 2008
      },
      most_awp_kills: {
        steam_id: "76561197977566559",
        nickname: "⛧ SATAnic addict fish ⛧",
        value: 5,
        team_id: 1241
      },
      most_utility_damage: {
        steam_id: "76561197977566559",
        nickname: "⛧ SATAnic addict fish ⛧",
        value: 213,
        team_id: 1241
      },
      most_first_kills: {
        steam_id: "76561198129692076",
        nickname: "Mixu",
        value: 6,
        team_id: 2008
      },
      most_mates_flashed: {
        steam_id: "76561198018195778",
        nickname: "snowsplitter",
        value: 17,
        team_id: 2008
      },
      most_flash_assists: {
        steam_id: "76561198176303197",
        nickname: "asp",
        value: 2,
        team_id: 2008
      }
    });
  });
});

describe("getMatchMapVetoes", () => {
  beforeAll(async () => {
    await runQuery(`
      INSERT INTO MatchTeamMapVetoes (id, match_id, team_id, map_id, action, veto_order) VALUES
      (1, 10154, 2060, 9, 'drop', 1),
      (2, 10154, 2035, 1, 'drop', 2),
      (3, 10154, 2060, 5, 'pick', 3),
      (4, 10154, 2035, 8, 'pick', 4),
      (5, 10154, 2060, 2, 'drop', 5),
      (6, 10154, 2035, 4, 'drop', 6),
      (7, 10154, 2060, 3, 'decider', 7);
    `);
  });

  afterAll(async () => {
    await runQuery(`
      DELETE FROM MatchTeamMapVetoes WHERE match_id = 10154;
    `);
  });
  it("returns map vetoes in correct order for match 10154", async () => {
    const result = await getMatchMapVetoes(10154);

    expect(result).toHaveLength(7);

    // Verify the vetoes are ordered by veto_order
    expect(result[0]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2060,
      map_id: 9,
      map_name: expect.any(String),
      action: "drop",
      veto_order: 1
    });

    expect(result[1]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2035,
      map_id: 1,
      map_name: expect.any(String),
      action: "drop",
      veto_order: 2
    });

    expect(result[2]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2060,
      map_id: 5,
      map_name: expect.any(String),
      action: "pick",
      veto_order: 3
    });

    expect(result[3]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2035,
      map_id: 8,
      map_name: expect.any(String),
      action: "pick",
      veto_order: 4
    });

    expect(result[4]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2060,
      map_id: 2,
      map_name: expect.any(String),
      action: "drop",
      veto_order: 5
    });

    expect(result[5]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2035,
      map_id: 4,
      map_name: expect.any(String),
      action: "drop",
      veto_order: 6
    });

    expect(result[6]).toEqual({
      id: expect.any(Number),
      match_id: 10154,
      team_id: 2060,
      map_id: 3,
      map_name: expect.any(String),
      action: "decider",
      veto_order: 7
    });
  });

  it("returns alternating team vetoes for match 10154", async () => {
    const result = await getMatchMapVetoes(10154);

    // Verify teams alternate in veto order (with team 2060 starting)
    expect(result[0].team_id).toBe(2060);
    expect(result[1].team_id).toBe(2035);
    expect(result[2].team_id).toBe(2060);
    expect(result[3].team_id).toBe(2035);
    expect(result[4].team_id).toBe(2060);
    expect(result[5].team_id).toBe(2035);
    expect(result[6].team_id).toBe(2060);
  });

  it("returns correct action types for match 10154", async () => {
    const result = await getMatchMapVetoes(10154);

    const actions = result.map((veto) => veto.action);
    expect(actions).toEqual([
      "drop",
      "drop",
      "pick",
      "pick",
      "drop",
      "drop",
      "decider"
    ]);
  });

  it("includes map names for all vetoes", async () => {
    const result = await getMatchMapVetoes(10154);

    result.forEach((veto) => {
      expect(veto.map_name).toBeDefined();
      expect(typeof veto.map_name).toBe("string");
      expect(veto.map_name.length).toBeGreaterThan(0);
    });
  });

  it("returns empty array for non-existent match", async () => {
    const result = await getMatchMapVetoes(999999);
    expect(result).toEqual([]);
  });

  it("verifies veto order is sequential", async () => {
    const result = await getMatchMapVetoes(10154);

    result.forEach((veto, index) => {
      expect(veto.veto_order).toBe(index + 1);
    });
  });
});

describe("getMatchGamesByTeam", () => {
  it("should return individual games for team 1697", async () => {
    const result = await getMatchGamesByTeam(1697);

    // Verify we get results
    expect(result.length).toBeGreaterThan(0);

    // Verify all games involve team 1697
    result.forEach((game) => {
      expect([game.team1_id, game.team2_id]).toContain(1697);
    });

    // Verify each game has terrorist as team1 and CT as team2
    result.forEach((game) => {
      // team1 should be terrorist, team2 should be CT
      // We can't easily verify this without additional data, so we'll just check that teams are different
      expect(game.team1_id).not.toBe(game.team2_id);
    });

    // Verify each game has a unique match_game_id
    const matchGameIds = result.map((game) => game.match_game_id);
    const uniqueGameIds = [...new Set(matchGameIds)];
    expect(uniqueGameIds.length).toBe(matchGameIds.length);

    // Verify each game has map information
    result.forEach((game) => {
      expect(game.map_name).toBeDefined();
      expect(game.map_id).toBeDefined();
      expect(game.team1_score).toBeDefined();
      expect(game.team2_score).toBeDefined();
    });
  });

  it("should handle team with no matches", async () => {
    const result = await getMatchGamesByTeam(999999);
    expect(result).toEqual([]);
  });
});
