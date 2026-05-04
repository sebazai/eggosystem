// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import express from "express";
import type { Application } from "express";
import { createExpressTestApp } from "../../test-utils";
import filterRouter from "./filter.routes";
import parseQueryFilterParams from "../../middlewares/parse-query-filter-params.middleware";
import * as playerSkillsModels from "../../models/player-skills.models";
import {
  type TopTeamsByFilters,
  type TopTeamsByFiltersRaw
} from "@eggosystem/types";

const FILTERS_MOUNT = "/api/v1/filters";

function createAppWithParseQuery(): {
  app: Application;
  cleanup: () => void;
} {
  const customRouter = express.Router();
  customRouter.use(parseQueryFilterParams);
  customRouter.use(filterRouter);
  return createExpressTestApp(customRouter, FILTERS_MOUNT);
}

function createAppRouterOnly(): {
  app: Application;
  cleanup: () => void;
} {
  return createExpressTestApp(filterRouter, FILTERS_MOUNT);
}

describe("filter routes — leaderboards", () => {
  jest.setTimeout(90_000);

  let app: Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAppWithParseQuery();
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  test("GET /api/v1/filters/leaderboards/multiple - should return all leaderboards", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/leaderboards/multiple`)
      .query({ leaderboards: "kills" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(response.body).toHaveProperty("deaths");
    expect(response.body).toHaveProperty("assists");
    expect(Array.isArray(response.body.kills)).toBe(true);
  }, 90_000);

  test("GET /api/v1/filters/leaderboards/multiple - should include derived stats", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/leaderboards/multiple`)
      .query({ leaderboards: "kills_per_round" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills_per_round");
    expect(Array.isArray(response.body.kills_per_round)).toBe(true);
  }, 90_000);

  test("GET /api/v1/filters/leaderboards/multiple - should include flash time stats", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/leaderboards/multiple`)
      .query({ leaderboards: "avg_enemy_flash_time" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("avg_enemy_flash_time");
    expect(Array.isArray(response.body.avg_enemy_flash_time)).toBe(true);
  }, 90_000);

  test("GET /api/v1/filters/leaderboards - should return single leaderboard", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/leaderboards`)
      .query({ leaderboards: "kills" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(Object.keys(response.body).length).toBe(1);
    expect(Array.isArray(response.body.kills)).toBe(true);
  }, 90_000);

  test("GET /api/v1/filters/leaderboards/multiple - should work with season_ids filter", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/leaderboards/multiple`)
      .query({ season_ids: "14" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("kills");
    expect(response.body).toHaveProperty("kana_rating");
    expect(response.body).toHaveProperty("kast");
    expect(Array.isArray(response.body.kills)).toBe(true);
  }, 90_000);
});

describe("filter routes — top teams", () => {
  let app: Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAppWithParseQuery();
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  it("should return top teams for Masters league in season 11", async () => {
    const response = await request(app).get(
      `${FILTERS_MOUNT}/teams/topteams?league_ids=1&season_ids=11`
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(10);

    const divisions: TopTeamsByFilters[] = response.body.map(
      (item: TopTeamsByFiltersRaw) => ({
        ...item,
        teams: JSON.parse(item.teams)
      })
    );

    if (response.body.length > 0) {
      const div = divisions[0];
      const team = div.teams[0];
      expect(team).toHaveProperty("team_id");
      expect(team).toHaveProperty("team_name");
      expect(team).toHaveProperty("team_logo");
      expect(team).toHaveProperty("matches_played");
      expect(team).toHaveProperty("kana");
      expect(team).toHaveProperty("rank");

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
      `${FILTERS_MOUNT}/teams/topteams?league_ids=1&season_ids=11&stages=2`
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(5);
  });

  it("should return top teams for specific map in Masters league", async () => {
    const response = await request(app).get(
      `${FILTERS_MOUNT}/teams/topteams?league_ids=1&season_ids=11&map_ids=1`
    );
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeLessThanOrEqual(10);
  });

  it("should return teams sorted by kana rating in descending order", async () => {
    const response = await request(app).get(
      `${FILTERS_MOUNT}/teams/topteams?league_ids=1&season_ids=11`
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
      `${FILTERS_MOUNT}/teams/topteams?league_ids=1&season_ids=11`
    );
    expect(response.status).toBe(200);

    if (response.body.length > 0) {
      const teams: TopTeamsByFilters[] = response.body.map(
        (item: TopTeamsByFiltersRaw) => ({
          ...item,
          teams: JSON.parse(item.teams)
        })
      );
      expect(teams.length).toEqual(2);
      expect(teams[0].stage).toEqual(1);
      expect(teams[1].stage).toEqual(2);
      expect(teams[0].league_sort_priority).toEqual(1);
      expect(teams[1].league_sort_priority).toEqual(1);
      const ranks = teams
        .map((item) => item.teams.map((team) => team.rank))
        .flat();
      const expectedRanks = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
      expect(ranks).toEqual(expectedRanks);
    }
  });
});

describe("filter routes — utility metrics (integration)", () => {
  let app: Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAppRouterOnly();
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    cleanup();
  });

  it("should calculate correct utility metrics for player with good utility usage", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/players/76561198100952924/skill-diagram`)
      .expect(200);

    const { body } = response;

    expect(body.steam_id).toBe("76561198100952924");
    expect(body.nickname).toBe("vilksu");
    expect(body.utility).toBeGreaterThan(60);
    expect(body.utility).toBeLessThan(70);

    const metrics = body.detailed_metrics;

    expect(metrics.flash_assists).toBeCloseTo(0.0675, 2);
    expect(metrics.enemies_flashed).toBeCloseTo(0.64, 1);
    expect(metrics.enemies_flashed_duration).toBeCloseTo(2.91, 2);
    expect(metrics.utility_damage).toBeCloseTo(7.14, 2);
    expect(metrics.he_damage_per_round).toBeCloseTo(3.53, 2);
    expect(metrics.molotov_damage_per_round).toBeCloseTo(1.78, 2);
    expect(metrics.teammates_flashed_inverse).toBeCloseTo(0.26, 2);
    expect(metrics.flash_assists_per_flash).toBeCloseTo(0.09, 2);
    expect(metrics.enemies_flashed_per_flash).toBeCloseTo(0.88, 2);
    expect(metrics.teammates_flashed_per_flash).toBeCloseTo(0.74, 2);
  });

  it("should calculate correct utility metrics for player with low flash assists", async () => {
    const response = await request(app)
      .get(`${FILTERS_MOUNT}/players/76561198049745649/skill-diagram`)
      .expect(200);

    const { body } = response;

    expect(body.steam_id).toBe("76561198049745649");
    expect(body.nickname).toBe("sububobi");
    expect(body.utility).toBeGreaterThanOrEqual(41);
    expect(body.utility).toBeLessThanOrEqual(49);

    const metrics = body.detailed_metrics;

    expect(metrics.flash_assists).toBeCloseTo(0.0033, 1);
    expect(metrics.enemies_flashed).toBeCloseTo(0.2857, 4);
    expect(metrics.enemies_flashed_duration).toBeCloseTo(2.46, 2);
    expect(metrics.utility_damage).toBeCloseTo(5.87, 2);
    expect(metrics.he_damage_per_round).toBeCloseTo(4.33, 2);
    expect(metrics.molotov_damage_per_round).toBeCloseTo(1.53, 2);
    expect(metrics.teammates_flashed_inverse).toBeCloseTo(0.15, 2);
    expect(metrics.flash_assists_per_flash).toBeCloseTo(0.01, 2);
    expect(metrics.enemies_flashed_per_flash).toBeCloseTo(1.11, 2);
    expect(metrics.teammates_flashed_per_flash).toBeCloseTo(0.85, 2);
  });

  it("should properly calculate utility score based on weighted metrics", async () => {
    const player1 = await request(app)
      .get(`${FILTERS_MOUNT}/players/76561198100952924/skill-diagram`)
      .expect(200);

    const player2 = await request(app)
      .get(`${FILTERS_MOUNT}/players/76561198049745649/skill-diagram`)
      .expect(200);

    expect(player1.body.utility).toBeGreaterThan(player2.body.utility);

    const utilityScoreDifference = player1.body.utility - player2.body.utility;
    expect(utilityScoreDifference).toBeGreaterThan(12);
    expect(utilityScoreDifference).toBeLessThan(45);
  });
});

describe("filter routes — GET /players/:steam_id/skill-diagram (mocked model)", () => {
  let app: Application;
  let cleanup: () => void;

  const mockSteamId = "76561198049745649";
  const mockPlayerSkillDiagram = {
    steam_id: mockSteamId,
    nickname: "sububobi",
    overall_rating: 64,
    aim: 88,
    positioning: 66,
    impact: 51,
    utility: 35,
    consistency: 73,
    detailed_metrics: {
      hs_percent: 50.9087,
      kd: 1.4128,
      adr: 96.03726,
      ttd: 379.7833,
      counter_strafing: 0.87,
      crosshair_placement: 6.19772,
      accuracy: 0.224,
      first_kill_death_ratio: 1.5053,
      first_death_trade_percentage: 1.3175,
      trade_opportunities_converted: 0.527027027027027,
      first_death_trade_attempts_ratio: 0.8461538461538461,
      first_death_traded_ratio: 0.23076923076923078,
      good_deaths_percentage: 0.45121951219512196,
      tradeable_first_deaths_percentage: 0.8461538461538461,
      traded_deaths_success_percentage: 0.1183,
      traded_death_attempts_percentage: 0.45121951219512196,
      trade_kill_opportunities_per_round: 5.6923076923076925,
      trade_kill_success_percentage: 0.527027027027027,
      trade_kill_attempts_percentage: 0.8648648648648649,
      trade_death_opportunities_per_round: 2.466666666666667,
      t_opening_duel_success_percentage: 0.6956521739130435,
      ct_opening_duel_success_percentage: 0.5,
      kast: 75.7338,
      clutches_won_percentage: 0.0496,
      multikills: 394.2,
      kana_rating: 0.999772,
      one_v_one_win_ratio: 0.4545,
      first_kills_per_round: 0.0742,
      first_kill_success_ratio: 0.6009,
      trades_per_round: 0.1442,
      flash_assists: 0.0033,
      enemies_flashed: 0.2857,
      enemies_flashed_duration: 2.45531,
      utility_damage: 5.869,
      he_damage_per_round: 4.3329,
      molotov_damage_per_round: 1.5276,
      teammates_flashed_inverse: 0.1536,
      flash_assists_per_flash: 0.013,
      enemies_flashed_per_flash: 1.1119,
      teammates_flashed_per_flash: 0.8464,
      ct_t_balance: 0.9432,
      map_consistency: 0.7394143309402021,
      clutch_vs_entry_balance: 0.933,
      trade_death_ratio: 0.1183,
      adr_t: 96.03726,
      adr_ct: 96.03726,
      kd_t: 1.3321,
      kd_ct: 1.5294,
      kills_variance: 4.082765019372879,
      deaths_variance: 4.691516017593448,
      adr_variance: 21.08886456106385,
      first_kill_death_ratio_t: 1.9262,
      first_kill_death_ratio_ct: 1.0303
    }
  };

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAppRouterOnly();
    app = testApp;
    cleanup = appCleanup;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  describe("GET /api/v1/filters/players/:steam_id/skill-diagram", () => {
    it("should return player skill diagram data with 200 status code", async () => {
      jest
        .spyOn(playerSkillsModels, "getPlayerSkillDiagram")
        .mockResolvedValue(mockPlayerSkillDiagram);

      const response = await request(app).get(
        `${FILTERS_MOUNT}/players/${mockSteamId}/skill-diagram`
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayerSkillDiagram);
      expect(playerSkillsModels.getPlayerSkillDiagram).toHaveBeenCalledWith(
        mockSteamId,
        undefined
      );
    });

    it("should return 404 when player skill data is not found", async () => {
      jest
        .spyOn(playerSkillsModels, "getPlayerSkillDiagram")
        .mockResolvedValue(null);

      const response = await request(app).get(
        `${FILTERS_MOUNT}/players/${mockSteamId}/skill-diagram`
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Player skill data not found",
        instance: `${FILTERS_MOUNT}/players/${mockSteamId}/skill-diagram`
      });
      expect(playerSkillsModels.getPlayerSkillDiagram).toHaveBeenCalledWith(
        mockSteamId,
        undefined
      );
    });
  });
});
