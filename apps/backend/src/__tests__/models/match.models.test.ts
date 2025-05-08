import { getMatchesByFilters } from "../../models/match.models";

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
        match_id: 10101,
        match_date: "2024-11-27",
        league_name: "Masters",
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
        match_id: 10021,
        match_date: "2024-10-30",
        league_name: "Masters",
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
