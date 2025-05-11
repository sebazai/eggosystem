import {
  getMatchesByFilters,
  getMatchTopPlayers
} from "../../models/match.models";

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
        match_id: 10098,
        match_date: "2024-11-27",
        league_name: "Masters",
        map_name: "de_nuke",
        stage: 2,
        team1_name: "Digia Vengers",
        team1_logo: "S15_2196.png",
        team2_name: "Gigantti",
        team2_logo: "S14_2065.png",
        game_id: null,
        team1_score: 13,
        team2_score: 8
      },
      {
        match_id: 10018,
        match_date: "2024-10-30",
        league_name: "Masters",
        map_name: "de_nuke",
        stage: 2,
        team1_name: "Digia Vengers",
        team1_logo: "S15_2196.png",
        team2_name: "Gigantti",
        team2_logo: "S14_2065.png",
        game_id: null,
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
});

describe("getMatchTopPlayers", () => {
  it("should pick the correct team id when a player has played substitute in same season", async () => {
    const result = await getMatchTopPlayers(9416);
    expect(result).toEqual({
      most_kills: {
        steam_id: 76561197987111310,
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
