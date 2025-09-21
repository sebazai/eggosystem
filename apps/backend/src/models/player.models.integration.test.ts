import { getAllPlayerStatsWithPartialFilters } from "./player.models";

describe("Player Statistics Integration Tests", () => {
  it("should return correct stats for enzoj in season 14", async () => {
    const steamId = "76561197967885016";
    const filters = {
      season_ids: [14],
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    };

    const result = await getAllPlayerStatsWithPartialFilters(steamId, filters);

    expect(result).toBeDefined();
    if (result) {
      expect(result.steam_id).toBe(steamId);
      expect(result.nickname).toBe("enzoj");
      expect(result.maps_played).toBe(17);
      expect(result.adr).toBeCloseTo(80.047, 2);
      expect(result.kana_rating).toBeCloseTo(0.8235, 3);
      expect(result.kd).toBe(0.92);
    }
  });

  it("should return no data for player in non-existent season", async () => {
    const steamId = "76561198225377128";
    const filters = {
      season_ids: [999], // Non-existent season
      league_ids: null,
      team_ids: null,
      stages: null,
      map_ids: null
    };

    const result = await getAllPlayerStatsWithPartialFilters(steamId, filters);
    expect(result).toBeUndefined();
  });
});
