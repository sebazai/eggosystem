import { runQuery } from "../db/mysqlRunQuery";
import { BadRequestError } from "../utils/errors";
import {
  getMatchesByFilters,
  getMatchTopPlayers,
  getMatchMapVetoes,
  getMatchGamesByTeam,
  getMatchMvps,
  getMatchMvp,
  MATCH_MVP_BATCH_LIMIT
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

  describe("season 14 match 10148 home/away SQL aggregation", () => {
    const MATCH_ID = 10148;
    const SEASON_ID = 14;
    const DIGIA_TEAM_ID = 1028;
    const GIGANTTI_TEAM_ID = 1697;
    const NUKE_MAP_ID = 5;

    const digiaMirageMap = {
      name: "de_mirage",
      home_score: 13,
      away_score: 4
    };
    const digiaNukeMap = {
      name: "de_nuke",
      home_score: 13,
      away_score: 8
    };
    const giganttiMirageMap = {
      name: "de_mirage",
      home_score: 4,
      away_score: 13
    };
    const giganttiNukeMap = {
      name: "de_nuke",
      home_score: 8,
      away_score: 13
    };

    async function setMatchSides(
      homeTeamId: number,
      awayTeamId: number
    ): Promise<void> {
      await runQuery(
        `UPDATE MatchTeams
         SET match_side = CASE
           WHEN team_id = ? THEN 'home'
           WHEN team_id = ? THEN 'away'
         END
         WHERE match_id = ? AND team_id IN (?, ?)`,
        [homeTeamId, awayTeamId, MATCH_ID, homeTeamId, awayTeamId]
      );
    }

    async function resetMatchSides(): Promise<void> {
      await runQuery(
        `UPDATE MatchTeams SET match_side = NULL WHERE match_id = ?`,
        [MATCH_ID]
      );
    }

    function sortedMaps(match: { maps_json: { name: string }[] }) {
      return [...match.maps_json].sort((a, b) => a.name.localeCompare(b.name));
    }

    afterEach(async () => {
      await resetMatchSides();
    });

    it("returns Digia as home with map wins and per-map home/away scores", async () => {
      await setMatchSides(DIGIA_TEAM_ID, GIGANTTI_TEAM_ID);

      const result = await getMatchesByFilters({
        season_ids: [SEASON_ID],
        league_ids: [1],
        stages: [2],
        team_ids: [GIGANTTI_TEAM_ID],
        map_ids: null
      });

      const match = result.find((m) => m.match_id === MATCH_ID);
      expect(match).toMatchObject({
        match_id: MATCH_ID,
        match_game_id: null,
        match_group: null,
        match_round: null,
        best_of: 3,
        season_id: SEASON_ID,
        match_date: "2024-11-27",
        stage: 2,
        league_name: "Masters",
        home_team: {
          name: "Digia Vengers",
          logo: "c1663e99856359b6",
          score: 2
        },
        away_team: {
          name: "Gigantti",
          logo: "9e39646633c95966",
          score: 0
        }
      });
      expect(sortedMaps(match!)).toEqual([digiaMirageMap, digiaNukeMap]);
    });

    it("swaps home/away teams and map scores when Gigantti is home", async () => {
      await setMatchSides(GIGANTTI_TEAM_ID, DIGIA_TEAM_ID);

      const result = await getMatchesByFilters({
        season_ids: [SEASON_ID],
        league_ids: [1],
        stages: [2],
        team_ids: [GIGANTTI_TEAM_ID],
        map_ids: null
      });

      const match = result.find((m) => m.match_id === MATCH_ID);
      expect(match).toMatchObject({
        home_team: {
          name: "Gigantti",
          logo: "9e39646633c95966",
          score: 0
        },
        away_team: {
          name: "Digia Vengers",
          logo: "c1663e99856359b6",
          score: 2
        }
      });
      expect(sortedMaps(match!)).toEqual([giganttiMirageMap, giganttiNukeMap]);
    });

    it("includes every map in maps_json when filtering by a single map", async () => {
      await setMatchSides(DIGIA_TEAM_ID, GIGANTTI_TEAM_ID);

      const result = await getMatchesByFilters({
        season_ids: [SEASON_ID],
        league_ids: [1],
        stages: [2],
        team_ids: [GIGANTTI_TEAM_ID],
        map_ids: [NUKE_MAP_ID]
      });

      const match = result.find((m) => m.match_id === MATCH_ID);
      expect(match).toBeDefined();
      expect(sortedMaps(match!)).toEqual([digiaMirageMap, digiaNukeMap]);

      const otherMatch = result.find((m) => m.match_id === 10068);
      expect(otherMatch).toBeDefined();
      expect(sortedMaps(otherMatch!)).toEqual([
        { name: "de_mirage", home_score: 13, away_score: 8 },
        { name: "de_nuke", home_score: 13, away_score: 3 }
      ]);
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

describe("getMatchMvps", () => {
  beforeAll(async () => {
    await runQuery(`
      INSERT INTO SteamPlayers (steam_id, nickname, account_id, faceit_nickname, faceit_id, avatar)
      VALUES (76561198207195847, '( GhostZero)', NULL, NULL, NULL, NULL)
    `);
    await runQuery(`
      INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp, external_match_room_id, \`group\`, round, status, created_at, updated_at)
      VALUES (14, 7, 14, 1, 1, '2024-01-01 19:00:00', '2024-01-01 20:00:00', NULL, NULL, NULL, 'FINISHED', NOW(), NOW())
    `);
    await runQuery(`
      INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
      VALUES (14, 2035, 14, 7)
    `);
    await runQuery(`
      INSERT INTO MatchGames (id, match_id, map_id, map_order, demofile, regulation_rounds, created_at, updated_at)
      VALUES (999999, 14, 3, NULL, 'test_bo1_demo.dem', 24, NOW(), NOW())
    `);
    await runQuery(`
      INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id, id, created_at, updated_at, replaces_steam_id, ticket_number, discarded_at, discarded_by)
      VALUES (14, 2035, 76561198207195847, 'primary', 0, 0, NULL, 999999, NOW(), NOW(), NULL, NULL, NULL, NULL)
    `);
    await runQuery(`
      INSERT INTO PlayerStats (id, steam_id, match_game_id, kills, deaths, assists, assists_ct, assists_t, mvps,
        total_damage, total_damage_ct, total_damage_t, headshots, flash_assists, flash_assists_t, flash_assists_ct,
        adr, adr_t, adr_ct, hs_percent, plants, explodes, defuses, first_kills, kills_1, kills_2, kills_3, kills_4,
        kills_5, trades, traded, clutches_won, clutches, awp_kills, utility_damage, utility_damage_t, utility_damage_ct,
        molotov_damage, molotov_damage_ct, molotov_damage_t, he_damage, he_damage_ct, he_damage_t,
        trade_attempts, trade_attempts_ct, trade_attempts_t, kills_through_walls,
        first_death_trade_attempts, first_death_trade_attempts_ct, first_death_trade_attempts_t,
        first_death_trade_opportunities, first_death_trade_opportunities_ct, first_death_trade_opportunities_t,
        trade_opportunities, trade_opportunities_t, trade_opportunities_ct,
        flashes_thrown, enemies_flashed, mates_flashed, self_flashes, first_deaths,
        total_mf_duration, total_ef_duration, one_v_one_won, one_v_one_lost,
        one_v_one_won_ct, one_v_one_lost_ct, one_v_one_won_t, one_v_one_lost_t,
        kast, kana_rating,
        first_kills_t, first_kills_ct, first_deaths_t, first_deaths_ct,
        first_death_trades, first_death_traded, first_death_trades_ct, first_death_traded_ct,
        first_death_trades_t, first_death_traded_t,
        flashes_thrown_t, flashes_thrown_ct, enemies_flashed_t, enemies_flashed_ct,
        kills_t, kills_ct, deaths_t, deaths_ct, trades_t, trades_ct, traded_t, traded_ct,
        total_ef_duration_ct, total_ef_duration_t, total_mf_duration_t, total_mf_duration_ct,
        mates_flashed_t, mates_flashed_ct, ttd, crosshair_placement, ttf, rws,
        shots, shots_hit, total_strafing_shots, good_strafing_shots)
      VALUES (999999, 76561198207195847, 999999, 20, 10, 5, 2, 3, 2,
        1500, 700, 800, 8, 2, 1, 1,
        90.0, NULL, NULL, 40, 1, 1, 0, 3, 5, 3, 2, 0,
        0, 4, 3, 1, 2, 3, 200, 100, 100,
        50, 25, 25, 30, 15, 15,
        5, 2, 3, 2,
        1, 0, 1,
        2, 1, 1,
        4, 2, 2,
        10, 5, 3, 1, 3,
        8.5, 12.3, 1, 0,
        NULL, NULL, NULL, NULL,
        70, 1.15,
        NULL, NULL, NULL, NULL,
        1, 0, 0, 0,
        1, 0,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL, 0.00,
        NULL, NULL, NULL, NULL)
    `);
  });

  afterAll(async () => {
    await runQuery(`DELETE FROM PlayerStats WHERE id = 999999`);
    await runQuery(`DELETE FROM SeasonTeamPlayers WHERE id = 999999`);
    await runQuery(`DELETE FROM MatchGames WHERE id = 999999`);
    await runQuery(`DELETE FROM MatchTeams WHERE match_id = 14`);
    await runQuery(`DELETE FROM Matches WHERE id = 14`);
    await runQuery(
      `DELETE FROM SteamPlayers WHERE steam_id = 76561198207195847`
    );
  });

  it("returns BO3 series MVP with average kana_rating", async () => {
    const [mvp] = await getMatchMvps([10154]);

    expect(mvp).toEqual(
      expect.objectContaining({
        match_id: 10154,
        steam_id: "76561198024059644",
        nickname: "Shwifty",
        team_id: 2035,
        kana_rating: 1.02
      })
    );
  });

  it("returns BO1 series MVP with highest single-map kana_rating", async () => {
    const [mvp] = await getMatchMvps([14]);

    expect(mvp).toEqual(
      expect.objectContaining({
        match_id: 14,
        steam_id: "76561198207195847",
        nickname: "( GhostZero)",
        kana_rating: 1.15
      })
    );
  });

  it("returns multiple MVPs in one batch", async () => {
    const mvps = await getMatchMvps([10154, 14]);
    expect(mvps).toHaveLength(2);
    expect(mvps.map((m) => m.match_id).sort((a, b) => a - b)).toEqual([
      14, 10154
    ]);
  });

  it("omits unknown match_id from results", async () => {
    const mvps = await getMatchMvps([999999]);
    expect(mvps).toEqual([]);
  });

  it("returns empty array for empty input", async () => {
    const mvps = await getMatchMvps([]);
    expect(mvps).toEqual([]);
  });

  it("throws when more than the batch limit of unique match_ids are requested", async () => {
    const ids = Array.from(
      { length: MATCH_MVP_BATCH_LIMIT + 1 },
      (_, index) => index + 1
    );

    await expect(getMatchMvps(ids)).rejects.toThrow(BadRequestError);
    await expect(getMatchMvps(ids)).rejects.toThrow(
      `match_ids accepts at most ${MATCH_MVP_BATCH_LIMIT} unique IDs per request`
    );
  });

  it("dedupes duplicate match_ids before enforcing the batch limit", async () => {
    const ids = Array.from({ length: MATCH_MVP_BATCH_LIMIT }, () => 10154);

    await expect(getMatchMvps(ids)).resolves.toHaveLength(1);
  });
});

describe("getMatchMvp", () => {
  it("returns MVP for a single match", async () => {
    const mvp = await getMatchMvp(10154);
    expect(mvp?.nickname).toBe("Shwifty");
    expect(mvp?.kana_rating).toBe(1.02);
  });

  it("returns null when no MVP can be computed", async () => {
    const mvp = await getMatchMvp(999999);
    expect(mvp).toBeNull();
  });
});
