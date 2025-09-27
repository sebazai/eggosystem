import {
  getFilteredTopTeams,
  getOneTeamByFilters,
  getTeamMapStats,
  getTeamMatchesByFilters,
  getTeamsByFilters
} from "./team.models";

describe("getFilteredTopTeams", () => {
  it("season 14, league masters", async () => {
    const result = await getFilteredTopTeams({
      season_ids: [14],
      league_ids: [1],
      stages: null,
      map_ids: null,
      team_ids: null
    });
    expect(result).toEqual([
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 1,
        teams:
          '[{"team_id": 2053, "team_name": "CSKeisari", "team_logo": "S14_2053.png", "matches_played": 10, "kana": 0.921, "rank": 1},{"team_id": 113, "team_name": "Futurice", "team_logo": "S15_2162.png", "matches_played": 10, "kana": 0.890, "rank": 2},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 10, "kana": 0.874, "rank": 3},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 10, "kana": 0.820, "rank": 4},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 10, "kana": 0.811, "rank": 5}]'
      },
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 2,
        teams:
          '[{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 6, "kana": 0.916, "rank": 1},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 11, "kana": 0.870, "rank": 2},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 8, "kana": 0.848, "rank": 3},{"team_id": 1550, "team_name": "Accenture Elite", "team_logo": "S14_2064.png", "matches_played": 6, "kana": 0.845, "rank": 4},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 7, "kana": 0.843, "rank": 5}]'
      }
    ]);
  });
  it("season 14, league masters, challengers", async () => {
    const result = await getFilteredTopTeams({
      season_ids: [14],
      league_ids: [1, 2],
      stages: null,
      map_ids: null,
      team_ids: null
    });
    expect(result).toEqual([
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 1,
        teams:
          '[{"team_id": 2053, "team_name": "CSKeisari", "team_logo": "S14_2053.png", "matches_played": 10, "kana": 0.921, "rank": 1},{"team_id": 113, "team_name": "Futurice", "team_logo": "S15_2162.png", "matches_played": 10, "kana": 0.890, "rank": 2},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 10, "kana": 0.874, "rank": 3},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 10, "kana": 0.820, "rank": 4},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 10, "kana": 0.811, "rank": 5}]'
      },
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 2,
        teams:
          '[{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 6, "kana": 0.916, "rank": 1},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 11, "kana": 0.870, "rank": 2},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 8, "kana": 0.848, "rank": 3},{"team_id": 1550, "team_name": "Accenture Elite", "team_logo": "S14_2064.png", "matches_played": 6, "kana": 0.845, "rank": 4},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 7, "kana": 0.843, "rank": 5}]'
      },
      {
        league_id: 2,
        league_name: "Challengers",
        league_sort_priority: 2,
        stage: 1,
        teams:
          '[{"team_id": 28, "team_name": "Fastems", "team_logo": "S14_2086.png", "matches_played": 10, "kana": 0.964, "rank": 1},{"team_id": 321, "team_name": "Telia Finland", "team_logo": "S15_2257.png", "matches_played": 8, "kana": 0.932, "rank": 2},{"team_id": 1863, "team_name": "ALM Partners Tasetaikurit", "team_logo": "S15_2197.png", "matches_played": 10, "kana": 0.926, "rank": 3},{"team_id": 2004, "team_name": "Onnisen Hosujat", "team_logo": "S14_2004.png", "matches_played": 8, "kana": 0.919, "rank": 4},{"team_id": 1442, "team_name": "Netum", "team_logo": "S14_2080.png", "matches_played": 10, "kana": 0.899, "rank": 5}]'
      },
      {
        league_id: 2,
        league_name: "Challengers",
        league_sort_priority: 2,
        stage: 2,
        teams:
          '[{"team_id": 2119, "team_name": "OP Rohkea", "team_logo": "S14_2119.png", "matches_played": 9, "kana": 0.978, "rank": 1},{"team_id": 1938, "team_name": "Frendy Fire", "team_logo": "S15_2259.png", "matches_played": 17, "kana": 0.938, "rank": 2},{"team_id": 1890, "team_name": "Avant Tecno", "team_logo": "S14_2105.png", "matches_played": 9, "kana": 0.898, "rank": 3},{"team_id": 1442, "team_name": "Netum", "team_logo": "S14_2080.png", "matches_played": 12, "kana": 0.869, "rank": 4},{"team_id": 2005, "team_name": "Are Cloud Next Generation", "team_logo": "S14_2005.png", "matches_played": 11, "kana": 0.865, "rank": 5}]'
      }
    ]);
  });
  it("season 14, league masters, teams should not affect", async () => {
    const result = await getFilteredTopTeams({
      season_ids: [14],
      league_ids: [1],
      stages: null,
      map_ids: null,
      team_ids: [2053]
    });
    expect(result).toEqual([
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 1,
        teams:
          '[{"team_id": 2053, "team_name": "CSKeisari", "team_logo": "S14_2053.png", "matches_played": 10, "kana": 0.921, "rank": 1},{"team_id": 113, "team_name": "Futurice", "team_logo": "S15_2162.png", "matches_played": 10, "kana": 0.890, "rank": 2},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 10, "kana": 0.874, "rank": 3},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 10, "kana": 0.820, "rank": 4},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 10, "kana": 0.811, "rank": 5}]'
      },
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 2,
        teams:
          '[{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 6, "kana": 0.916, "rank": 1},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 11, "kana": 0.870, "rank": 2},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 8, "kana": 0.848, "rank": 3},{"team_id": 1550, "team_name": "Accenture Elite", "team_logo": "S14_2064.png", "matches_played": 6, "kana": 0.845, "rank": 4},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 7, "kana": 0.843, "rank": 5}]'
      }
    ]);
  });
  it("season 14, league masters, stage 2", async () => {
    const result = await getFilteredTopTeams({
      season_ids: [14],
      league_ids: [1],
      stages: [2],
      map_ids: null,
      team_ids: null
    });
    expect(result).toEqual([
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 2,
        teams:
          '[{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 6, "kana": 0.916, "rank": 1},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 11, "kana": 0.870, "rank": 2},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 8, "kana": 0.848, "rank": 3},{"team_id": 1550, "team_name": "Accenture Elite", "team_logo": "S14_2064.png", "matches_played": 6, "kana": 0.845, "rank": 4},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 7, "kana": 0.843, "rank": 5}]'
      }
    ]);
  });
  it("league masters, for de_nuke", async () => {
    const result = await getFilteredTopTeams({
      season_ids: null,
      league_ids: [1],
      stages: null,
      map_ids: [5],
      team_ids: null
    });
    expect(result).toEqual([
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 1,
        teams:
          '[{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 2, "kana": 1.080, "rank": 1},{"team_id": 1550, "team_name": "Accenture Elite", "team_logo": "S14_2064.png", "matches_played": 1, "kana": 1.056, "rank": 2},{"team_id": 280, "team_name": "OEM eSports", "team_logo": "S14_2074.png", "matches_played": 3, "kana": 0.996, "rank": 3},{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 3, "kana": 0.983, "rank": 4},{"team_id": 756, "team_name": "Elisa Hosujat", "team_logo": "S15_2205.png", "matches_played": 1, "kana": 0.960, "rank": 5}]'
      },
      {
        league_id: 1,
        league_name: "Masters",
        league_sort_priority: 1,
        stage: 2,
        teams:
          '[{"team_id": 28, "team_name": "Fastems", "team_logo": "S14_2086.png", "matches_played": 1, "kana": 1.084, "rank": 1},{"team_id": 930, "team_name": "Neste e-sports", "team_logo": "S11_1620.png", "matches_played": 3, "kana": 1.013, "rank": 2},{"team_id": 66, "team_name": "Valtori", "team_logo": "S15_2184.png", "matches_played": 2, "kana": 0.969, "rank": 3},{"team_id": 1028, "team_name": "Digia Vengers", "team_logo": "S15_2196.png", "matches_played": 3, "kana": 0.945, "rank": 4},{"team_id": 875, "team_name": "Mehiläinen Bee Rush", "team_logo": "S14_2073.png", "matches_played": 2, "kana": 0.937, "rank": 5}]'
      }
    ]);
  });
});

describe("getTeamsByFilters", () => {
  it("should group when team 66 present in multiple seasons", async () => {
    const result = await getTeamsByFilters({
      season_ids: null,
      league_ids: null,
      stages: null,
      team_ids: [66],
      map_ids: null
    });
    expect(result).toEqual([
      {
        id: 66,
        name: "Valtori",
        team_logo: "S15_2184.png",
        wins: 13,
        losses: 8,
        matches_played: 21,
        win_percentage: 61.9,
        latest_season_name: "Season 2",
        latest_league_name: "Masters"
      }
    ]);
  });
  it("with team id in season 14", async () => {
    const result = await getTeamsByFilters({
      season_ids: [14],
      league_ids: null,
      stages: null,
      team_ids: [66],
      map_ids: null
    });
    expect(result).toEqual([
      {
        id: 66,
        name: "Valtori",
        team_logo: "S15_2184.png",
        wins: 9,
        losses: 4,
        matches_played: 13,
        win_percentage: 69.2,
        latest_season_name: "Season 2",
        latest_league_name: "Masters"
      }
    ]);
  });
  it("should not group matches when map ids are present", async () => {
    const result = await getTeamsByFilters({
      season_ids: [14],
      league_ids: null,
      stages: [2],
      team_ids: [66],
      map_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    });
    expect(result).toEqual([
      {
        id: 66,
        name: "Valtori",
        team_logo: "S15_2184.png",
        wins: 6,
        losses: 0,
        matches_played: 6,
        win_percentage: 100,
        latest_season_name: "Season 2",
        latest_league_name: "Masters"
      }
    ]);
  });
  it("should group matches when map ids are not present", async () => {
    const result = await getTeamsByFilters({
      season_ids: [14],
      league_ids: [1],
      stages: [2],
      team_ids: [66],
      map_ids: null
    });
    expect(result).toEqual([
      {
        id: 66,
        name: "Valtori",
        team_logo: "S15_2184.png",
        wins: 3,
        losses: 0,
        matches_played: 3,
        win_percentage: 100,
        latest_season_name: "Season 2",
        latest_league_name: "Masters"
      }
    ]);
  });
});

describe("getOneTeamByFilters", () => {
  it("should return latest season and league name with two seasons present", async () => {
    const result = await getOneTeamByFilters(66, [14, 11], null);
    expect(result).toEqual([
      {
        name: "Valtori",
        team_logo: "S15_2184.png",
        id: 66,
        latest_season_name: "Season 2",
        latest_league_name: "Masters",
        external_team_id: null
      }
    ]);
  });
  it("should return latest season and league name", async () => {
    const result = await getOneTeamByFilters(66, null, null);
    expect(result).toEqual([
      {
        name: "Valtori",
        team_logo: "S15_2184.png",
        id: 66,
        latest_season_name: "Season 2",
        latest_league_name: "Masters",
        external_team_id: null
      }
    ]);
  });
  it("should return latest season and league name when filtered", async () => {
    const result = await getOneTeamByFilters(66, [11], null);
    expect(result).toEqual([
      {
        name: "Valtori",
        team_logo: "S15_2184.png",
        id: 66,
        latest_season_name: "Season 11",
        latest_league_name: "Masters",
        external_team_id: null
      }
    ]);
  });
});

describe("getTeamMatchesByFilters", () => {
  it("should return 13 matches played for season 14, team 66", async () => {
    const result = await getTeamMatchesByFilters({
      team_ids: [66],
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: null
    });
    expect(result.length).toEqual(13);
  });
  it("should return all maps played (i.e. not group bo > 1's) for season 14, team 66 when all map ids are selected", async () => {
    const result = await getTeamMatchesByFilters({
      team_ids: [66],
      season_ids: [14],
      league_ids: null,
      map_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      stages: null
    });
    expect(result.length).toEqual(16);
  });
  it("de_ancient match history for team 66 where one match is regular and one playoff", async () => {
    const result = await getTeamMatchesByFilters({
      team_ids: [66],
      season_ids: [14],
      league_ids: null,
      map_ids: [8],
      stages: null
    });
    expect(result).toEqual([
      {
        match_game_id: 104404,
        match_id: 10014,
        date: "2024-10-23",
        maps: "de_ancient",
        league_name: "Masters",
        season_name: "CS2 Season 2",
        best_of: 3,
        team_id: 66,
        opponent_id: 113,
        team_name: "Valtori",
        team_logo: "S15_2184.png",
        opponent_name: "Futurice",
        opponent_logo: "S15_2162.png",
        team_score: 13,
        opponent_score: 8,
        result: "won"
      },
      {
        match_game_id: 104039,
        match_id: 9844,
        date: "2024-10-02",
        maps: "de_ancient",
        league_name: "Masters",
        season_name: "CS2 Season 2",
        best_of: 1,
        team_id: 66,
        opponent_id: 1028,
        team_name: "Valtori",
        team_logo: "S15_2184.png",
        opponent_name: "Digia Vengers",
        opponent_logo: "S15_2196.png",
        team_score: 11,
        opponent_score: 13,
        result: "lost"
      }
    ]);
  });
  it("no filters for team 66 returns all maps", async () => {
    const result = await getTeamMatchesByFilters({
      team_ids: [66],
      season_ids: null,
      league_ids: null,
      map_ids: null,
      stages: null
    });
    expect(result.length).toEqual(21);
  });
  it("returns match_game_id for best of ones, but not for best of > 1", async () => {
    const result = await getTeamMatchesByFilters({
      team_ids: [1993],
      season_ids: [14],
      league_ids: null,
      map_ids: null,
      stages: null
    });
    expect(result).toEqual([
      {
        match_id: 10007,
        date: "2024-10-24",
        match_game_id: null,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_mirage, de_ancient",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 2042,
        opponent_name: "VILPE SENSE",
        opponent_logo: "S14_2042.png",
        result: "lost",
        team_score: 0,
        opponent_score: 2
      },
      {
        match_id: 9978,
        date: "2024-10-15",
        match_game_id: null,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_dust2, de_mirage",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 418,
        opponent_name: "TEXA",
        opponent_logo: "S15_2172.png",
        result: "lost",
        team_score: 0,
        opponent_score: 2
      },
      {
        match_id: 9745,
        date: "2024-09-25",
        match_game_id: 103910,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_mirage",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 386,
        opponent_name: "Nondest",
        opponent_logo: "S15_2165.png",
        result: "lost",
        team_score: 2,
        opponent_score: 13
      },
      {
        match_id: 9746,
        date: "2024-09-25",
        match_game_id: 103911,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_vertigo",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 386,
        opponent_name: "Nondest",
        opponent_logo: "S15_2165.png",
        result: "lost",
        team_score: 1,
        opponent_score: 13
      },
      {
        match_id: 9548,
        date: "2024-09-16",
        match_game_id: 103692,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_mirage",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 850,
        opponent_name: "lcp",
        opponent_logo: "S14_2048.png",
        result: "lost",
        team_score: 4,
        opponent_score: 13
      },
      {
        match_id: 9549,
        date: "2024-09-16",
        match_game_id: 103693,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_inferno",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 850,
        opponent_name: "lcp",
        opponent_logo: "S14_2048.png",
        result: "lost",
        team_score: 4,
        opponent_score: 13
      },
      {
        match_id: 9530,
        date: "2024-09-12",
        match_game_id: 103674,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_ancient",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 1863,
        opponent_name: "ALM Partners Tasetaikurit",
        opponent_logo: "S15_2197.png",
        result: "lost",
        team_score: 8,
        opponent_score: 13
      },
      {
        match_id: 9531,
        date: "2024-09-12",
        match_game_id: 103675,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_nuke",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 1863,
        opponent_name: "ALM Partners Tasetaikurit",
        opponent_logo: "S15_2197.png",
        result: "lost",
        team_score: 3,
        opponent_score: 13
      },
      {
        match_id: 9325,
        date: "2024-09-04",
        match_game_id: 103458,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_anubis",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 1938,
        opponent_name: "Frendy Fire",
        opponent_logo: "S15_2259.png",
        result: "lost",
        team_score: 6,
        opponent_score: 13
      },
      {
        match_id: 9326,
        date: "2024-09-04",
        match_game_id: 103459,
        league_name: "Challengers",
        season_name: "CS2 Season 2",
        maps: "de_mirage",
        team_id: 1993,
        team_name: "SOK Tilipäivä",
        team_logo: "S14_1993.png",
        opponent_id: 1938,
        opponent_name: "Frendy Fire",
        opponent_logo: "S15_2259.png",
        result: "lost",
        team_score: 8,
        opponent_score: 13
      }
    ]);
  });
});

describe("getTeamMapStats", () => {
  it("should return only ancient when ancient present in filters for team 66", async () => {
    const result = await getTeamMapStats(66, {
      season_ids: null,
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: [9]
    });
    expect(result).toEqual([
      {
        map_id: 9,
        map_name: "de_anubis",
        maps_played: 3,
        wins: 3,
        losses: 0,
        avg_score: 14,
        avg_opponent_score: 9.3,
        win_percentage: 100
      }
    ]);
  });
  it("should return all played maps for team 66 in season 14", async () => {
    const result = await getTeamMapStats(66, {
      season_ids: [14],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    });
    expect(result).toEqual([
      {
        map_id: 1,
        map_name: "de_mirage",
        maps_played: 5,
        wins: 4,
        losses: 1,
        avg_score: 13,
        avg_opponent_score: 11,
        win_percentage: 80
      },
      {
        map_id: 2,
        map_name: "de_inferno",
        maps_played: 2,
        wins: 1,
        losses: 1,
        avg_score: 11.5,
        avg_opponent_score: 12,
        win_percentage: 50
      },
      {
        map_id: 3,
        map_name: "de_dust2",
        maps_played: 1,
        wins: 0,
        losses: 1,
        avg_score: 3,
        avg_opponent_score: 13,
        win_percentage: 0
      },
      {
        map_id: 5,
        map_name: "de_nuke",
        maps_played: 3,
        wins: 3,
        losses: 0,
        avg_score: 17,
        avg_opponent_score: 11.3,
        win_percentage: 100
      },
      {
        map_id: 8,
        map_name: "de_ancient",
        maps_played: 2,
        wins: 1,
        losses: 1,
        avg_score: 12,
        avg_opponent_score: 10.5,
        win_percentage: 50
      },
      {
        map_id: 9,
        map_name: "de_anubis",
        maps_played: 3,
        wins: 3,
        losses: 0,
        avg_score: 14,
        avg_opponent_score: 9.3,
        win_percentage: 100
      }
    ]);
  });
  it("should return all played maps for team 66", async () => {
    const result = await getTeamMapStats(66, {
      season_ids: null,
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    });
    expect(result).toEqual([
      {
        map_id: 1,
        map_name: "de_mirage",
        maps_played: 8,
        wins: 5,
        losses: 3,
        avg_score: 12.8,
        avg_opponent_score: 12.3,
        win_percentage: 62.5
      },
      {
        map_id: 2,
        map_name: "de_inferno",
        maps_played: 9,
        wins: 5,
        losses: 4,
        avg_score: 14.3,
        avg_opponent_score: 13.4,
        win_percentage: 55.6
      },
      {
        map_id: 3,
        map_name: "de_dust2",
        maps_played: 1,
        wins: 0,
        losses: 1,
        avg_score: 3,
        avg_opponent_score: 13,
        win_percentage: 0
      },
      {
        map_id: 4,
        map_name: "de_overpass",
        maps_played: 1,
        wins: 0,
        losses: 1,
        avg_score: 12,
        avg_opponent_score: 16,
        win_percentage: 0
      },
      {
        map_id: 5,
        map_name: "de_nuke",
        maps_played: 5,
        wins: 5,
        losses: 0,
        avg_score: 16.6,
        avg_opponent_score: 9.2,
        win_percentage: 100
      },
      {
        map_id: 7,
        map_name: "de_vertigo",
        maps_played: 1,
        wins: 1,
        losses: 0,
        avg_score: 16,
        avg_opponent_score: 8,
        win_percentage: 100
      },
      {
        map_id: 8,
        map_name: "de_ancient",
        maps_played: 6,
        wins: 3,
        losses: 3,
        avg_score: 12.8,
        avg_opponent_score: 13.3,
        win_percentage: 50
      },
      {
        map_id: 9,
        map_name: "de_anubis",
        maps_played: 3,
        wins: 3,
        losses: 0,
        avg_score: 14,
        avg_opponent_score: 9.3,
        win_percentage: 100
      }
    ]);
  });
});
