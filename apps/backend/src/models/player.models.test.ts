import {
  getMultiplePlayerStatsByFilters,
  getPlayerGameDetailsWithFilters,
  getPlayerMatchHistoryByFilters,
  getAllPlayerStatsWithPartialQueryFilters,
  getPlayerTeamDetailsWithFilters,
  getPlayerStatsForLatestSeason,
  getPlayerMapStatsWithFilters
} from "./player.models";

describe("getMultiplePlayerStatsByFilters", () => {
  it("same data with all seasons (11,14) and without for team 1650", async () => {
    const result = await getMultiplePlayerStatsByFilters({
      season_ids: [11, 14],
      team_ids: [1650],
      league_ids: null,
      stages: null,
      map_ids: null,
      player_name: undefined
    });
    const result2 = await getMultiplePlayerStatsByFilters({
      season_ids: null,
      team_ids: [1650],
      league_ids: null,
      stages: null,
      map_ids: null,
      player_name: undefined
    });
    expect(result).toEqual(result2);
  });
  it("correct data with filters season 14 and team 1650", async () => {
    const result = await getMultiplePlayerStatsByFilters({
      season_ids: [14],
      team_ids: [1650],
      league_ids: null,
      stages: null,
      map_ids: null,
      player_name: undefined
    });

    expect(result).toEqual([
      {
        steam_id: "76561198049745649",
        nickname: "sububobi",
        maps_played: 13,
        kills: 243,
        assists: 63,
        deaths: 164,
        flash_assists: 1,
        awp_kills: 8,
        utility_damage: 1535,
        headshots: 125,
        first_kills: 22,
        first_deaths: 13,
        adr: 97.82308,
        kana_rating: 1.03,
        hs_percent: 51.3846,
        kd: 1.48
      },
      {
        steam_id: "76561197963921578",
        nickname: "van9",
        maps_played: 17,
        kills: 245,
        assists: 90,
        deaths: 234,
        flash_assists: 9,
        awp_kills: 3,
        utility_damage: 1720,
        headshots: 116,
        first_kills: 35,
        first_deaths: 34,
        adr: 89.72941,
        kana_rating: 0.897059,
        hs_percent: 46.8824,
        kd: 1.05
      },
      {
        steam_id: "76561198001857963",
        nickname: "meppi",
        maps_played: 17,
        kills: 253,
        assists: 66,
        deaths: 236,
        flash_assists: 4,
        awp_kills: 48,
        utility_damage: 1246,
        headshots: 100,
        first_kills: 48,
        first_deaths: 44,
        adr: 81.53529,
        kana_rating: 0.847647,
        hs_percent: 39.2941,
        kd: 1.07
      },
      {
        steam_id: "76561197967885016",
        nickname: "enzoj",
        maps_played: 17,
        kills: 232,
        assists: 100,
        deaths: 251,
        flash_assists: 13,
        awp_kills: 1,
        utility_damage: 1299,
        headshots: 135,
        first_kills: 45,
        first_deaths: 55,
        adr: 80.04706,
        kana_rating: 0.823529,
        hs_percent: 60.7647,
        kd: 0.92
      },
      {
        steam_id: "76561198030886203",
        nickname: "defektro",
        maps_played: 17,
        kills: 136,
        assists: 72,
        deaths: 227,
        flash_assists: 2,
        awp_kills: 0,
        utility_damage: 659,
        headshots: 52,
        first_kills: 14,
        first_deaths: 19,
        adr: 45.53529,
        kana_rating: 0.608235,
        hs_percent: 39.8235,
        kd: 0.6
      },
      {
        steam_id: "76561198043033465",
        nickname: "toro",
        maps_played: 4,
        kills: 15,
        assists: 16,
        deaths: 62,
        flash_assists: 0,
        awp_kills: 0,
        utility_damage: 41,
        headshots: 5,
        first_kills: 0,
        first_deaths: 4,
        adr: 33.1,
        kana_rating: 0.41,
        hs_percent: 33.25,
        kd: 0.24
      }
    ]);
  });
  it("correct data with filters season 11 and teams 282 and 890", async () => {
    const result = await getMultiplePlayerStatsByFilters({
      season_ids: [11],
      team_ids: [282, 890],
      league_ids: null,
      stages: null,
      map_ids: null,
      player_name: undefined
    });

    expect(result).toEqual([
      {
        steam_id: "76561197979215448",
        nickname: "Säästö-Sauli",
        maps_played: 11,
        kills: 295,
        assists: 48,
        deaths: 212,
        flash_assists: 6,
        awp_kills: 1,
        utility_damage: 1407,
        headshots: 106,
        first_kills: 48,
        first_deaths: 23,
        adr: 103.2,
        kana_rating: 1.133636,
        hs_percent: 36.1818,
        kd: 1.39
      },
      {
        steam_id: "76561198032101165",
        nickname: "Noppasäkki",
        maps_played: 15,
        kills: 348,
        assists: 56,
        deaths: 242,
        flash_assists: 31,
        awp_kills: 82,
        utility_damage: 2323,
        headshots: 115,
        first_kills: 47,
        first_deaths: 25,
        adr: 89.02667,
        kana_rating: 1.102667,
        hs_percent: 32,
        kd: 1.44
      },
      {
        steam_id: "76561198052713232",
        nickname: "Olavi",
        maps_played: 13,
        kills: 315,
        assists: 45,
        deaths: 271,
        flash_assists: 32,
        awp_kills: 168,
        utility_damage: 1032,
        headshots: 81,
        first_kills: 75,
        first_deaths: 40,
        adr: 95.97692,
        kana_rating: 0.993846,
        hs_percent: 25.5385,
        kd: 1.16
      },
      {
        steam_id: "76561198186718465",
        nickname: "KioskNiko",
        maps_played: 15,
        kills: 283,
        assists: 76,
        deaths: 299,
        flash_assists: 12,
        awp_kills: 37,
        utility_damage: 1448,
        headshots: 103,
        first_kills: 58,
        first_deaths: 40,
        adr: 80.18667,
        kana_rating: 0.953333,
        hs_percent: 35.7333,
        kd: 0.95
      },
      {
        steam_id: "76561198871831679",
        nickname: "Mc Jarruraita",
        maps_played: 15,
        kills: 293,
        assists: 72,
        deaths: 266,
        flash_assists: 22,
        awp_kills: 0,
        utility_damage: 1659,
        headshots: 117,
        first_kills: 29,
        first_deaths: 33,
        adr: 78.48,
        kana_rating: 0.948667,
        hs_percent: 39.4,
        kd: 1.1
      },
      {
        steam_id: "76561197977142767",
        nickname: "Ruato",
        maps_played: 15,
        kills: 240,
        assists: 72,
        deaths: 301,
        flash_assists: 16,
        awp_kills: 2,
        utility_damage: 2311,
        headshots: 78,
        first_kills: 44,
        first_deaths: 60,
        adr: 71.72,
        kana_rating: 0.857333,
        hs_percent: 32.6667,
        kd: 0.8
      },
      {
        steam_id: "76561198046785345",
        nickname: "Niiles",
        maps_played: 13,
        kills: 250,
        assists: 50,
        deaths: 254,
        flash_assists: 6,
        awp_kills: 9,
        utility_damage: 1021,
        headshots: 76,
        first_kills: 31,
        first_deaths: 36,
        adr: 80.33846,
        kana_rating: 0.826923,
        hs_percent: 29.3846,
        kd: 0.98
      },
      {
        steam_id: "76561198012114691",
        nickname: "Tsikken",
        maps_played: 15,
        kills: 243,
        assists: 63,
        deaths: 286,
        flash_assists: 20,
        awp_kills: 2,
        utility_damage: 2302,
        headshots: 108,
        first_kills: 32,
        first_deaths: 33,
        adr: 70.12,
        kana_rating: 0.796667,
        hs_percent: 44.4,
        kd: 0.85
      },
      {
        steam_id: "76561198996818419",
        nickname: "Manetski",
        maps_played: 12,
        kills: 195,
        assists: 44,
        deaths: 252,
        flash_assists: 8,
        awp_kills: 17,
        utility_damage: 751,
        headshots: 61,
        first_kills: 32,
        first_deaths: 31,
        adr: 67.825,
        kana_rating: 0.7575,
        hs_percent: 32.0833,
        kd: 0.77
      },
      {
        steam_id: "76561197979028801",
        nickname: "fps_",
        maps_played: 13,
        kills: 197,
        assists: 42,
        deaths: 260,
        flash_assists: 4,
        awp_kills: 7,
        utility_damage: 729,
        headshots: 61,
        first_kills: 14,
        first_deaths: 12,
        adr: 59.9,
        kana_rating: 0.722308,
        hs_percent: 31.5385,
        kd: 0.76
      },
      {
        steam_id: "76561197960930455",
        nickname: "siili",
        maps_played: 13,
        kills: 131,
        assists: 49,
        deaths: 274,
        flash_assists: 5,
        awp_kills: 3,
        utility_damage: 1343,
        headshots: 35,
        first_kills: 13,
        first_deaths: 51,
        adr: 49.36923,
        kana_rating: 0.523077,
        hs_percent: 25.0769,
        kd: 0.48
      }
    ]);
  });
  it("correct data with filters season 11, team 282, stage 1, map 5", async () => {
    const result = await getMultiplePlayerStatsByFilters({
      season_ids: [11],
      team_ids: [282],
      league_ids: null,
      stages: [1],
      map_ids: [5],
      player_name: undefined
    });

    expect(result).toEqual([
      {
        steam_id: "76561198032101165",
        nickname: "Noppasäkki",
        maps_played: 4,
        kills: 90,
        assists: 10,
        deaths: 71,
        flash_assists: 10,
        awp_kills: 34,
        utility_damage: 394,
        headshots: 23,
        first_kills: 13,
        first_deaths: 6,
        adr: 80.55,
        kana_rating: 1.045,
        hs_percent: 25.75,
        kd: 1.27
      },
      {
        steam_id: "76561198186718465",
        nickname: "KioskNiko",
        maps_played: 4,
        kills: 91,
        assists: 20,
        deaths: 86,
        flash_assists: 2,
        awp_kills: 9,
        utility_damage: 363,
        headshots: 36,
        first_kills: 15,
        first_deaths: 10,
        adr: 89.025,
        kana_rating: 1.02,
        hs_percent: 39.5,
        kd: 1.06
      },
      {
        steam_id: "76561197977142767",
        nickname: "Ruato",
        maps_played: 4,
        kills: 68,
        assists: 30,
        deaths: 91,
        flash_assists: 5,
        awp_kills: 0,
        utility_damage: 478,
        headshots: 24,
        first_kills: 14,
        first_deaths: 21,
        adr: 72.625,
        kana_rating: 0.875,
        hs_percent: 35,
        kd: 0.75
      },
      {
        steam_id: "76561198871831679",
        nickname: "Mc Jarruraita",
        maps_played: 4,
        kills: 79,
        assists: 19,
        deaths: 78,
        flash_assists: 4,
        awp_kills: 0,
        utility_damage: 571,
        headshots: 36,
        first_kills: 2,
        first_deaths: 13,
        adr: 70.325,
        kana_rating: 0.855,
        hs_percent: 45.75,
        kd: 1.01
      },
      {
        steam_id: "76561198012114691",
        nickname: "Tsikken",
        maps_played: 4,
        kills: 70,
        assists: 18,
        deaths: 81,
        flash_assists: 7,
        awp_kills: 1,
        utility_damage: 363,
        headshots: 26,
        first_kills: 10,
        first_deaths: 11,
        adr: 72.05,
        kana_rating: 0.7825,
        hs_percent: 36.5,
        kd: 0.86
      }
    ]);
  });
  describe("with playerName search nzoj (enzoj)", () => {
    it("correct data with filters season 11, stage 2, maps 2 & 8, team 53", async () => {
      const result = await getMultiplePlayerStatsByFilters({
        season_ids: [11],
        team_ids: [53],
        league_ids: null,
        stages: [2],
        map_ids: [2, 8],
        player_name: "nzoj"
      });
      expect(result).toEqual([
        {
          steam_id: "76561197967885016",
          nickname: "enzoj",
          maps_played: 4,
          kills: 98,
          assists: 30,
          deaths: 85,
          flash_assists: 12,
          awp_kills: 2,
          utility_damage: 2349,
          headshots: 41,
          first_kills: 20,
          first_deaths: 13,
          adr: 91.175,
          kana_rating: 1.2175,
          hs_percent: 44.5,
          kd: 1.15
        }
      ]);
    });
    it("correct data with filters season 11, stage 2, maps 2 & 8", async () => {
      const result = await getMultiplePlayerStatsByFilters({
        season_ids: [11],
        team_ids: null,
        league_ids: null,
        stages: [2],
        map_ids: [2, 8],
        player_name: "nzoj"
      });
      expect(result).toEqual([
        {
          steam_id: "76561197967885016",
          nickname: "enzoj",
          maps_played: 4,
          kills: 98,
          assists: 30,
          deaths: 85,
          flash_assists: 12,
          awp_kills: 2,
          utility_damage: 2349,
          headshots: 41,
          first_kills: 20,
          first_deaths: 13,
          adr: 91.175,
          kana_rating: 1.2175,
          hs_percent: 44.5,
          kd: 1.15
        }
      ]);
    });
  });

  it("should return empty array for team 415, season 14, map 7 (no data) because the team has not played this map in this season", async () => {
    const result = await getMultiplePlayerStatsByFilters({
      season_ids: [14],
      team_ids: [415],
      league_ids: null,
      stages: null,
      map_ids: [7],
      player_name: undefined
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("getPlayerTeamDetailsWithFilters", () => {
  it("should return 7dos and PS for enzoj", async () => {
    const result = await getPlayerTeamDetailsWithFilters("76561197967885016", {
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null
    });
    expect(result).toEqual([
      {
        steam_id: "76561197967885016",
        nickname: "enzoj",
        team_name: "7dos",
        team_id: 1650,
        team_logo: "cf9838e7641c3333"
      },
      {
        steam_id: "76561197967885016",
        nickname: "enzoj",
        team_name: "Polar Squad",
        team_id: 53,
        team_logo: "c7c33c3c61c3963c"
      }
    ]);
  });
  it("should return 7dos for enzoj in season 14", async () => {
    const result = await getPlayerTeamDetailsWithFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null
    });
    expect(result).toEqual([
      {
        steam_id: "76561197967885016",
        nickname: "enzoj",
        team_name: "7dos",
        team_id: 1650,
        team_logo: "cf9838e7641c3333"
      }
    ]);
  });
  it("should return 7dos for enzoj with team 1650", async () => {
    const result = await getPlayerTeamDetailsWithFilters("76561197967885016", {
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: [1650]
    });
    expect(result).toEqual([
      {
        steam_id: "76561197967885016",
        nickname: "enzoj",
        team_name: "7dos",
        team_id: 1650,
        team_logo: "cf9838e7641c3333"
      }
    ]);
  });
});

describe("getAllPlayerStatsWithPartialQueryFilters", () => {
  it("should return aggregated stats when player has played as primary and substitute in one season", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561198129692076",
      {
        season_ids: [14],
        league_ids: null,
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    expect(result).toEqual({
      steam_id: "76561198129692076",
      nickname: "Mixu",
      maps_played: 24,
      kills: 485,
      kills_ct: 237,
      kills_t: 248,
      assists: 162,
      deaths: 396,
      flash_assists: 4,
      awp_kills: 0,
      utility_damage: 4182,
      headshots: 223,
      first_kills: 73,
      first_deaths: 70,
      adr: 97.2625,
      kana_rating: 1.00125,
      hs_percent: 47.2917,
      clutches_won: 7,
      clutches_lost: 40,
      kast: 72.8333,
      enemies_flashed: 215,
      mates_flashed: 116,
      self_flashes: 50,
      total_damage: 54009,
      flashes_thrown: 195,
      total_ef_duration: 566.6,
      kd: 1.22,
      multikill_2k: 85,
      multikill_3k: 36,
      multikill_4k: 7,
      multikill_5k: 3,
      rounds_played: 551,
      avg_enemy_flash_duration: 2.9,
      avg_teammate_flash_duration: 1,
      counter_strafing_percentage: 85.6,
      crosshair_placement: 7.95833,
      first_deaths_ct: 36,
      first_deaths_t: 34,
      first_kills_ct: 38,
      first_kills_t: 35,
      time_to_damage: 403.2083,
      trade_attempts: 112,
      trade_opportunities: 124,
      trades: 79
    });
  });
  it("should return team specific stats when player has played in two teams during one season", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561198129692076",
      {
        season_ids: [14],
        league_ids: null,
        map_ids: null,
        stages: null,
        team_ids: [2008]
      }
    );
    expect(result).toEqual({
      steam_id: "76561198129692076",
      nickname: "Mixu",
      maps_played: 19,
      kills: 432,
      kills_ct: 215,
      kills_t: 217,
      assists: 138,
      deaths: 314,
      flash_assists: 4,
      awp_kills: 0,
      utility_damage: 3799,
      headshots: 195,
      first_kills: 64,
      first_deaths: 57,
      adr: 107.31053,
      kana_rating: 1.081053,
      hs_percent: 45.2105,
      clutches_won: 7,
      clutches_lost: 33,
      kast: 74,
      enemies_flashed: 187,
      mates_flashed: 108,
      self_flashes: 46,
      total_damage: 47754,
      flashes_thrown: 167,
      total_ef_duration: 494.8,
      kd: 1.38,
      multikill_2k: 77,
      multikill_3k: 33,
      multikill_4k: 7,
      multikill_5k: 3,
      rounds_played: 446,
      avg_enemy_flash_duration: 3,
      avg_teammate_flash_duration: 1.1,
      counter_strafing_percentage: 84.3,
      crosshair_placement: 8.36842,
      first_deaths_ct: 27,
      first_deaths_t: 30,
      first_kills_ct: 34,
      first_kills_t: 30,
      time_to_damage: 391,
      trade_attempts: 94,
      trade_opportunities: 105,
      trades: 69
    });
  });
  it("player with two different teams in two different season using double season filter aggregates scores", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: [11, 14],
        league_ids: null,
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    expect(result).toEqual({
      steam_id: "76561197967885016",
      nickname: "enzoj",
      maps_played: 41,
      kills: 670,
      kills_ct: 355,
      kills_t: 315,
      assists: 217,
      deaths: 704,
      flash_assists: 67,
      awp_kills: 18,
      utility_damage: 6834,
      headshots: 328,
      first_kills: 116,
      first_deaths: 131,
      adr: 78.54878,
      kana_rating: 0.882927,
      hs_percent: 52.4146,
      clutches_won: 5,
      clutches_lost: 19,
      kast: 72.7073,
      enemies_flashed: 817,
      mates_flashed: 473,
      self_flashes: 272,
      total_damage: 76616,
      flashes_thrown: 883,
      total_ef_duration: 2330.5,
      kd: 0.95,
      multikill_2k: 118,
      multikill_3k: 37,
      multikill_4k: 6,
      multikill_5k: 0,
      rounds_played: 978,
      avg_enemy_flash_duration: 2.6,
      avg_teammate_flash_duration: 1.2,
      counter_strafing_percentage: 83.4,
      crosshair_placement: 5.81463,
      first_deaths_ct: 68,
      first_deaths_t: 63,
      first_kills_ct: 60,
      first_kills_t: 56,
      time_to_damage: 347.2683,
      trade_attempts: 52,
      trade_opportunities: 57,
      trades: 96
    });
  });
  it("should match when season 11,14 and league 7 vs only league 7", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: [11, 14],
        league_ids: [7],
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    const result2 = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: null,
        league_ids: [7],
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    expect(result).toEqual(result2);
  });
  it("bogus filters returns null and zero values", async () => {
    const result2 = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: [14],
        league_ids: [7],
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    expect(result2).toEqual(undefined);
  });
  it("player with double season but league specific filter", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: [11, 14],
        league_ids: [7],
        map_ids: null,
        stages: null,
        team_ids: null
      }
    );
    expect(result).toEqual({
      steam_id: "76561197967885016",
      nickname: "enzoj",
      maps_played: 24,
      kills: 438,
      kills_ct: 240,
      kills_t: 198,
      assists: 117,
      deaths: 453,
      flash_assists: 54,
      awp_kills: 17,
      utility_damage: 5535,
      headshots: 193,
      first_kills: 71,
      first_deaths: 76,
      adr: 77.4875,
      kana_rating: 0.925,
      hs_percent: 46.5,
      clutches_won: 3,
      clutches_lost: -3,
      kast: 73.25,
      enemies_flashed: 516,
      mates_flashed: 239,
      self_flashes: 184,
      total_damage: 49840,
      flashes_thrown: 612,
      total_ef_duration: 1597.8,
      kd: 0.97,
      multikill_2k: 81,
      multikill_3k: 23,
      multikill_4k: 5,
      multikill_5k: 0,
      rounds_played: 645,
      avg_enemy_flash_duration: 2.6,
      avg_teammate_flash_duration: 1,
      counter_strafing_percentage: 87.4,
      crosshair_placement: 4.975,
      first_deaths_ct: 37,
      first_deaths_t: 39,
      first_kills_ct: 41,
      first_kills_t: 30,
      time_to_damage: 279.75,
      trade_attempts: 0,
      trade_opportunities: 0,
      trades: 69
    });
  });
  it("with wrong team filter", async () => {
    const result = await getAllPlayerStatsWithPartialQueryFilters(
      "76561197967885016",
      {
        season_ids: [11, 14],
        league_ids: null,
        map_ids: null,
        stages: null,
        team_ids: [2109]
      }
    );
    expect(result).toEqual(undefined);
  });
});

describe("getPlayerGameDetailsWithFilters", () => {
  it("should return correct amount of wins and losses for enzoj on season 11 and 14 and team 1650", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [11, 14],
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: [1650]
    });
    expect(result).toEqual([{ matches_played: 13, wins: 7, losses: 6 }]);
  });
  it("should return correct amount of wins and losses for enzoj on season 11 and 14 and team 1650 and map 9", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [11, 14],
      league_ids: null,
      map_ids: [9],
      stages: null,
      team_ids: [1650]
    });
    expect(result).toEqual([{ matches_played: 6, wins: 2, losses: 4 }]);
  });
  it("should return correct amount of wins and losses for enzoj on season 14, team 1650 and playoffs (groups bo3's)", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: [2],
      team_ids: [1650]
    });
    expect(result).toEqual([{ matches_played: 3, wins: 1, losses: 2 }]);
  });
  it("should return correct amount of wins and losses for enzoj on season 14, team 1650 and regular", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: [1],
      team_ids: [1650]
    });
    expect(result).toEqual([{ matches_played: 10, wins: 6, losses: 4 }]);
  });
  it("should return same amount with all maps (and extra ones) filtered and without", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: [1, 2, 3, 4, 5, 7, 8, 9],
      stages: null,
      team_ids: [1650]
    });
    const result2 = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: [1650]
    });
    expect(result).toEqual(result2);
  });
  it("should return same amount with all seasons filtered and without", async () => {
    const result = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: [11, 14],
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null
    });
    const result2 = await getPlayerGameDetailsWithFilters("76561197967885016", {
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: null
    });
    expect(result).toEqual(result2);
  });
});

describe("getPlayerMatchHistoryByFilters", () => {
  it("enzoj, season 14, playoffs", async () => {
    const result = await getPlayerMatchHistoryByFilters("76561197967885016", {
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: [2],
      team_ids: null
    });
    expect(result).toEqual([
      {
        match_id: 9917,
        match_game_id: null,
        map_name: "de_nuke, de_anubis, de_dust2",
        best_of: 3,
        season_id: 14,
        season_name: "CS2 Season 2",
        league_id: 4,
        league_name: "div3",
        stage: 2,
        match_date: "2024-10-14",
        team_id: 1650,
        team_name: "7dos",
        team_logo: "cf9838e7641c3333",
        opponent_id: 2071,
        opponent_name: "Vincit Faija & Sons",
        opponent_logo: "ef66f0989b0d0d43",
        score: 2,
        opponent_score: 1,
        kills: 47,
        deaths: 44,
        assists: 16,
        flash_assists: 4,
        awp_kills: 0,
        utility_damage: 197,
        headshots: 27,
        first_kills: 9,
        first_deaths: 8,
        kast: 66.33,
        adr: 88.47,
        hs_percent: 57.33,
        kana_rating: 0.78,
        kd: 1.07
      },
      {
        match_id: 10027,
        match_game_id: null,
        map_name: "de_anubis, de_ancient",
        best_of: 3,
        season_id: 14,
        season_name: "CS2 Season 2",
        league_id: 4,
        league_name: "div3",
        stage: 2,
        match_date: "2024-10-23",
        team_id: 1650,
        team_name: "7dos",
        team_logo: "cf9838e7641c3333",
        opponent_id: 2030,
        opponent_name: "Caverion Stadist",
        opponent_logo: "afcaf09297258f24",
        score: 0,
        opponent_score: 2,
        kills: 17,
        deaths: 28,
        assists: 9,
        flash_assists: 1,
        awp_kills: 0,
        utility_damage: 95,
        headshots: 10,
        first_kills: 4,
        first_deaths: 9,
        kast: 61,
        adr: 58.25,
        hs_percent: 76.5,
        kana_rating: 0.62,
        kd: 0.61
      },
      {
        match_id: 10057,
        match_game_id: null,
        map_name: "de_anubis, de_nuke",
        best_of: 3,
        season_id: 14,
        season_name: "CS2 Season 2",
        league_id: 4,
        league_name: "div3",
        stage: 2,
        match_date: "2024-10-30",
        team_id: 1650,
        team_name: "7dos",
        team_logo: "cf9838e7641c3333",
        opponent_id: 1019,
        opponent_name: "ALM Partners Riskiryhmä",
        opponent_logo: "fae79470839a489b",
        score: 0,
        opponent_score: 2,
        kills: 21,
        deaths: 33,
        assists: 11,
        flash_assists: 2,
        awp_kills: 0,
        utility_damage: 163,
        headshots: 11,
        first_kills: 5,
        first_deaths: 8,
        kast: 62.5,
        adr: 75.65,
        hs_percent: 52.5,
        kana_rating: 0.68,
        kd: 0.64
      }
    ]);
  });
  it("enzoj, 7dos, amount matches", async () => {
    const result = await getPlayerMatchHistoryByFilters("76561197967885016", {
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: [1650]
    });
    expect(result.length).toEqual(13);
  });
  it("enzoj, 7dos & ps, amount matches", async () => {
    const result = await getPlayerMatchHistoryByFilters("76561197967885016", {
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null,
      team_ids: [53, 1650]
    });
    expect(result.length).toEqual(24);
  });
});

describe("getPlayerStatsForLatestSeason", () => {
  it("should return player stats from latest season for valid steam_id", async () => {
    const result = await getPlayerStatsForLatestSeason("76561197967885016");

    expect(result).toEqual({
      steam_id: "76561197967885016",
      nickname: "enzoj",
      latest_season_id: 14,
      avg_kana_rating: 0.82,
      kpd: 0.92,
      adr: 80.0,
      level: 4
    });
  });

  it("should return null for non-existent steam_id", async () => {
    const result = await getPlayerStatsForLatestSeason("12345678901234567");

    expect(result).toBeNull();
  });

  it("should return null for steam_id with no played seasons", async () => {
    const result = await getPlayerStatsForLatestSeason("76561198000000000");

    expect(result).toBeNull();
  });
});

describe("getPlayerMapStatsWithFilters", () => {
  it("should return map stats for player with specific map filter", async () => {
    const result = await getPlayerMapStatsWithFilters("76561197967885016", {
      season_ids: [11],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: [5] // Anubis
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      const mapStat = result[0];
      expect(mapStat.map_id).toBe(5);
      expect(mapStat.steam_id).toBe("76561197967885016");
      expect(mapStat.wins).toBeGreaterThanOrEqual(0);
      expect(mapStat.losses).toBeGreaterThanOrEqual(0);
      expect(mapStat.win_percentage).toBeGreaterThanOrEqual(0);
      expect(mapStat.win_percentage).toBeLessThanOrEqual(100);
    }
  });

  it("should return map stats for all maps when no map filter is specified", async () => {
    const result = await getPlayerMapStatsWithFilters("76561197967885016", {
      season_ids: [11],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // Should return stats for multiple maps
    expect(result.length).toBeGreaterThan(0);

    // Each result should have map-specific data
    result.forEach((mapStat) => {
      expect(mapStat.map_id).toBeDefined();
      expect(mapStat.map_name).toBeDefined();
      expect(mapStat.wins).toBeGreaterThanOrEqual(0);
      expect(mapStat.losses).toBeGreaterThanOrEqual(0);
    });
  });

  it("should return empty array for player with no data", async () => {
    const result = await getPlayerMapStatsWithFilters("99999999999999999", {
      season_ids: [11],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should return correct map names for all map stats", async () => {
    const result = await getPlayerMapStatsWithFilters("76561197967885016", {
      season_ids: [11],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: [5] // Anubis
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      const mapStat = result[0];
      expect(mapStat.map_id).toBe(5);
      expect(mapStat.map_name).toBeDefined();
      expect(mapStat.map_name).not.toBe(`unknown_map_${mapStat.map_id}`);
      expect(typeof mapStat.map_name).toBe("string");
    }
  });
});
