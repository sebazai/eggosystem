import request from "supertest";
import { app } from "../app";
import { getPlayerSkillDiagram } from "../models/player-skills.models";

// Mock the player-skills.models module
jest.mock("../models/player-skills.models");

describe("Player Skill Diagram API", () => {
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
      // Aim metrics
      hs_percent: 50.9087,
      kd: 1.4128,
      adr: 96.03726,
      ttd: 379.7833,
      counter_strafing: 0.87,
      crosshair_placement: 6.19772,
      accuracy: 0.224,

      // Positioning metrics
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

      // Impact metrics
      kast: 75.7338,
      clutches_won_percentage: 0.0496,
      multikills: 394.2,
      kana_rating: 0.999772,
      one_v_one_win_ratio: 0.4545,
      first_kills_per_round: 0.0742,
      first_kill_success_ratio: 0.6009,
      trades_per_round: 0.1442,

      // Utility metrics
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

      // Consistency metrics
      ct_t_balance: 0.9432,
      map_consistency: 0.7394143309402021,
      clutch_vs_entry_balance: 0.933,
      trade_death_ratio: 0.1183,

      // Side-specific performance metrics
      adr_t: 96.03726,
      adr_ct: 96.03726,
      kd_t: 1.3321,
      kd_ct: 1.5294,

      // Map variance metrics
      kills_variance: 4.082765019372879,
      deaths_variance: 4.691516017593448,
      adr_variance: 21.08886456106385,

      // Side-specific consistency metrics
      first_kill_death_ratio_t: 1.9262,
      first_kill_death_ratio_ct: 1.0303
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/filters/players/:steam_id/skill-diagram", () => {
    it("should return player skill diagram data with 200 status code", async () => {
      // Mock the getPlayerSkillDiagram function to return mock data
      (getPlayerSkillDiagram as jest.Mock).mockResolvedValue(
        mockPlayerSkillDiagram
      );

      // Make the API request
      const response = await request(app).get(
        `/api/v1/filters/players/${mockSteamId}/skill-diagram`
      );

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPlayerSkillDiagram);
      expect(getPlayerSkillDiagram).toHaveBeenCalledWith(
        mockSteamId,
        expect.any(Object)
      );

      // Verify the structure of the response
      expect(response.body).toHaveProperty("steam_id", mockSteamId);
      expect(response.body).toHaveProperty("nickname", "sububobi");
      expect(response.body).toHaveProperty("overall_rating", 64);
      expect(response.body).toHaveProperty("aim", 88);
      expect(response.body).toHaveProperty("positioning", 66);
      expect(response.body).toHaveProperty("impact", 51);
      expect(response.body).toHaveProperty("utility", 35);
      expect(response.body).toHaveProperty("consistency", 73);

      // Verify detailed metrics - aim category
      expect(response.body.detailed_metrics).toHaveProperty(
        "hs_percent",
        50.9087
      );
      expect(response.body.detailed_metrics).toHaveProperty("kd", 1.4128);
      expect(response.body.detailed_metrics).toHaveProperty("adr", 96.03726);
      expect(response.body.detailed_metrics).toHaveProperty("ttd", 379.7833);
      expect(response.body.detailed_metrics).toHaveProperty(
        "counter_strafing",
        0.87
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "crosshair_placement",
        6.19772
      );
      expect(response.body.detailed_metrics).toHaveProperty("accuracy", 0.224);

      // Verify detailed metrics - positioning category
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_kill_death_ratio",
        1.5053
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_death_trade_percentage",
        1.3175
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_opportunities_converted",
        0.527027027027027
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_death_trade_attempts_ratio",
        0.8461538461538461
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_death_traded_ratio",
        0.23076923076923078
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "good_deaths_percentage",
        0.45121951219512196
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "tradeable_first_deaths_percentage",
        0.8461538461538461
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "traded_deaths_success_percentage",
        0.1183
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "traded_death_attempts_percentage",
        0.45121951219512196
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_kill_opportunities_per_round",
        5.6923076923076925
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_kill_success_percentage",
        0.527027027027027
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_kill_attempts_percentage",
        0.8648648648648649
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_death_opportunities_per_round",
        2.466666666666667
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "t_opening_duel_success_percentage",
        0.6956521739130435
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "ct_opening_duel_success_percentage",
        0.5
      );

      // Verify detailed metrics - impact category
      expect(response.body.detailed_metrics).toHaveProperty("kast", 75.7338);
      expect(response.body.detailed_metrics).toHaveProperty(
        "clutches_won_percentage",
        0.0496
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "multikills",
        394.2
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "kana_rating",
        0.999772
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "one_v_one_win_ratio",
        0.4545
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_kills_per_round",
        0.0742
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_kill_success_ratio",
        0.6009
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trades_per_round",
        0.1442
      );

      // Verify detailed metrics - utility category
      expect(response.body.detailed_metrics).toHaveProperty(
        "flash_assists",
        0.0033
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "enemies_flashed",
        0.2857
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "enemies_flashed_duration",
        2.45531
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "utility_damage",
        5.869
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "he_damage_per_round",
        4.3329
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "molotov_damage_per_round",
        1.5276
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "teammates_flashed_inverse",
        0.1536
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "flash_assists_per_flash",
        0.013
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "enemies_flashed_per_flash",
        1.1119
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "teammates_flashed_per_flash",
        0.8464
      );

      // Verify detailed metrics - consistency category
      expect(response.body.detailed_metrics).toHaveProperty(
        "ct_t_balance",
        0.9432
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "map_consistency",
        0.7394143309402021
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "clutch_vs_entry_balance",
        0.933
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "trade_death_ratio",
        0.1183
      );

      // Verify detailed metrics - side-specific performance
      expect(response.body.detailed_metrics).toHaveProperty("adr_t", 96.03726);
      expect(response.body.detailed_metrics).toHaveProperty("adr_ct", 96.03726);
      expect(response.body.detailed_metrics).toHaveProperty("kd_t", 1.3321);
      expect(response.body.detailed_metrics).toHaveProperty("kd_ct", 1.5294);

      // Verify detailed metrics - map variance
      expect(response.body.detailed_metrics).toHaveProperty(
        "kills_variance",
        4.082765019372879
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "deaths_variance",
        4.691516017593448
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "adr_variance",
        21.08886456106385
      );

      // Verify detailed metrics - side-specific consistency
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_kill_death_ratio_t",
        1.9262
      );
      expect(response.body.detailed_metrics).toHaveProperty(
        "first_kill_death_ratio_ct",
        1.0303
      );
    });

    it("should return 404 when player skill data is not found", async () => {
      // Mock the getPlayerSkillDiagram function to return null
      (getPlayerSkillDiagram as jest.Mock).mockResolvedValue(null);

      // Make the API request
      const response = await request(app).get(
        `/api/v1/filters/players/${mockSteamId}/skill-diagram`
      );

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Player skill data not found",
        instance: `/api/v1/filters/players/${mockSteamId}/skill-diagram`
      });
      expect(getPlayerSkillDiagram).toHaveBeenCalledWith(
        mockSteamId,
        expect.any(Object)
      );
    });
  });
});
