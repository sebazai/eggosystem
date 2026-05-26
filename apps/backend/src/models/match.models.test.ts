import { runQuery } from "../db/mysqlRunQuery";
import {
  getMatchesByFilters,
  getMatchTopPlayers,
  getMatchMapVetoes,
  getMatchGamesByTeam
} from "./match.models";

describe("getMatchesByFilters", () => {
  it("returns all maps with per-map scores when a map filter is selected", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: [5]
    });

    expect(result).toHaveLength(2);

    const match10148 = result.find((m) => m.match_id === 10148);
    const match10068 = result.find((m) => m.match_id === 10068);
    expect(match10148).toBeDefined();
    expect(match10068).toBeDefined();

    // Core shape unchanged
    expect(match10148).toMatchObject({
      match_date: "2024-11-27",
      league_name: "Masters",
      stage: 2,
      match_game_id: null
    });
    expect(match10148!.home_team.name).toBeTruthy();
    expect(match10148!.away_team.name).toBeTruthy();
    expect(typeof match10148!.home_team.score).toBe("number");
    expect(typeof match10148!.away_team.score).toBe("number");

    // maps_json is a parsed array — all maps for the match are present
    expect(Array.isArray(match10148!.maps_json)).toBe(true);
    expect(match10148!.maps_json.length).toBeGreaterThan(0);
    expect(match10148!.maps_json.some((m) => m.name === "de_nuke")).toBe(true);
    match10148!.maps_json.forEach((map) => {
      expect(typeof map.name).toBe("string");
      expect(typeof map.home_score).toBe("number");
      expect(typeof map.away_score).toBe("number");
    });

    // New fields are present with expected types
    expect(typeof match10148!.best_of).toBe("number");
    // match_group / match_round are nullable (some matches have null group/round in DB)
    expect(
      match10148!.match_group === null ||
        typeof match10148!.match_group === "number"
    ).toBe(true);
    expect(
      match10148!.match_round === null ||
        typeof match10148!.match_round === "number"
    ).toBe(true);
    expect(typeof match10148!.season_id).toBe("number");
    expect(match10148!.start_timestamp).toBeDefined();
  });

  it("returns scores for bo3 type of matches as grouped for 7dos", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: null,
      stages: [1, 2],
      team_ids: [1650],
      map_ids: null
    });
    expect(result.length).toBeGreaterThan(0);
    // No duplicate match_ids — always one row per match
    const ids = result.map((m) => m.match_id);
    expect(ids.length).toBe(new Set(ids).size);
    // Each row has maps_json and numeric scores
    result.forEach((m) => {
      expect(Array.isArray(m.maps_json)).toBe(true);
      expect(typeof m.home_team.score).toBe("number");
      expect(typeof m.away_team.score).toBe("number");
    });
  });

  it("correctly groups BO3 matches when no map filter is present", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: null
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    const match10148 = result.find((m) => m.match_id === 10148);
    expect(match10148).toBeDefined();

    if (match10148) {
      // Each match appears only once
      expect(result.filter((m) => m.match_id === 10148).length).toBe(1);

      // maps_json replaces map_name — is a parsed array
      expect(Array.isArray(match10148.maps_json)).toBe(true);
      expect(match10148.maps_json.length).toBeGreaterThan(0);
      match10148.maps_json.forEach((map) => {
        expect(typeof map.name).toBe("string");
        expect(typeof map.home_score).toBe("number");
        expect(typeof map.away_score).toBe("number");
      });

      // Series scores are map wins for BO3
      expect(typeof match10148.home_team.score).toBe("number");
      expect(typeof match10148.away_team.score).toBe("number");
      expect(match10148.home_team.score).toBeGreaterThanOrEqual(0);
      expect(match10148.away_team.score).toBeGreaterThanOrEqual(0);

      expect(match10148.match_game_id).toBeNull();

      // New fields
      expect(typeof match10148.best_of).toBe("number");
      expect(match10148.best_of).toBeGreaterThanOrEqual(1);
      expect(
        match10148.match_group === null ||
          typeof match10148.match_group === "number"
      ).toBe(true);
      expect(
        match10148.match_round === null ||
          typeof match10148.match_round === "number"
      ).toBe(true);
      expect(typeof match10148.season_id).toBe("number");
      expect(match10148.start_timestamp).toBeDefined();
    }
  });

  it("ensures no duplicate match_ids when grouping without map filter", async () => {
    const result = await getMatchesByFilters({
      season_ids: null,
      league_ids: [1],
      stages: [2],
      team_ids: [1697],
      map_ids: null
    });

    const matchIds = result.map((m) => m.match_id);
    const uniqueMatchIds = [...new Set(matchIds)];
    expect(matchIds.length).toBe(uniqueMatchIds.length);

    result.forEach((match) => {
      expect(Array.isArray(match.maps_json)).toBe(true);
      expect(match.maps_json.length).toBeGreaterThan(0);

      expect(typeof match.home_team.score).toBe("number");
      expect(typeof match.away_team.score).toBe("number");

      if (match.match_game_id !== null) {
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

    expect(result.length).toBeGreaterThan(0);

    result.forEach((game) => {
      expect([game.team1_id, game.team2_id]).toContain(1697);
    });

    result.forEach((game) => {
      expect(game.team1_id).not.toBe(game.team2_id);
    });

    const matchGameIds = result.map((game) => game.match_game_id);
    const uniqueGameIds = [...new Set(matchGameIds)];
    expect(uniqueGameIds.length).toBe(matchGameIds.length);

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
