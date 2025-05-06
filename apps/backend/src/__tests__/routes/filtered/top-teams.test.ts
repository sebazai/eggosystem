import request from "supertest";

import express from "express";
import filtered from "../../../routes/v1/filter.routes";
import {
  type TopTeamsByFilters,
  type TopTeamsByFiltersRaw
} from "@eggosystem/types";
import parseQueryFilterParams from "../../../middlewares/parse-query-filter-params.middleware";

describe("GET /api/v1/filters/teams/topteams", () => {
  const app = express();
  app.use(express.json());
  app.use("/filters", parseQueryFilterParams, filtered);

  // Test successful responses
  it("should return top teams for Masters league in season 11", async () => {
    const response = await request(app).get(
      "/filters/teams/topteams?league_ids=1&season_ids=11"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    // Should return at most 10 teams, for stage regular and playoff
    expect(response.body.length).toBeLessThanOrEqual(10);

    const divisions: TopTeamsByFilters[] = response.body.map(
      (item: TopTeamsByFiltersRaw) => ({
        ...item,
        teams: JSON.parse(item.teams)
      })
    );

    // Verify response structure
    if (response.body.length > 0) {
      const div = divisions[0];
      const team = div.teams[0];
      expect(team).toHaveProperty("team_id");
      expect(team).toHaveProperty("team_name");
      expect(team).toHaveProperty("team_logo");
      expect(team).toHaveProperty("matches_played");
      expect(team).toHaveProperty("kana");
      expect(team).toHaveProperty("rank");

      // Verify data types
      expect(typeof team.team_id).toBe("number");
      expect(typeof team.team_name).toBe("string");
      expect(typeof team.team_logo).toBe("string");
      expect(typeof div.league_name).toBe("string");
      expect(typeof team.matches_played).toBe("number");
      expect(typeof team.kana).toBe("number");
      expect(typeof team.rank).toBe("number");
    }
  });

  it("should return top teams for Masters league playoffs in season 11", async () => {
    const response = await request(app).get(
      "/filters/teams/topteams?league_ids=1&season_ids=11&stages=2"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(5);
  });

  it("should return top teams for specific map in Masters league", async () => {
    const response = await request(app).get(
      "/filters/teams/topteams?league_ids=1&season_ids=11&map_ids=1"
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(10);
  });

  // Test sorting and ranking
  it("should return teams sorted by kana rating in descending order", async () => {
    const response = await request(app).get(
      "/filters/teams/topteams?league_ids=1&season_ids=11"
    );
    expect(response.status).toBe(200);

    if (response.body.length > 1) {
      const divisions: TopTeamsByFilters[] = response.body.map(
        (item: TopTeamsByFiltersRaw) => ({
          ...item,
          teams: JSON.parse(item.teams)
        })
      );
      for (let i = 0; i < divisions.length; i++) {
        for (let j = 1; j < divisions[i].teams.length; j++) {
          expect(divisions[i].teams[j - 1].kana).toBeGreaterThanOrEqual(
            divisions[i].teams[j].kana
          );
        }
      }
    }
  });

  it("should assign ranks correctly from 1 to 5", async () => {
    const response = await request(app).get(
      "/filters/teams/topteams?league_ids=1&season_ids=11"
    );
    expect(response.status).toBe(200);

    if (response.body.length > 0) {
      const teams: TopTeamsByFilters[] = response.body.map(
        (item: TopTeamsByFiltersRaw) => ({
          ...item,
          teams: JSON.parse(item.teams)
        })
      );
      // Playoff and regular Masters
      expect(teams.length).toEqual(2);
      expect(teams[0].stage).toEqual(1);
      expect(teams[1].stage).toEqual(2);
      expect(teams[0].league_sort_priority).toEqual(1);
      expect(teams[1].league_sort_priority).toEqual(1);
      const ranks = teams
        .map((item) => item.teams.map((team) => team.rank))
        .flat();
      // Masters Regular 1-5, playoff 1-5
      const expectedRanks = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
      expect(ranks).toEqual(expectedRanks);
    }
  });
});
