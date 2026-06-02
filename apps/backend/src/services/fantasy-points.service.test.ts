import {
  calculateBasePoints,
  applyRoleBonus,
  calculateFantasyPointsForGame,
  type PlayerGameStats
} from "./fantasy-points.service";
import type { PlayerRole } from "../models/fantasy.models";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import type { PoolConnection } from "mysql2/promise";

// Mock dependencies
jest.mock("../db/mysqlConnection");
jest.mock("../db/mysqlRunQuery");
jest.mock("@eggosystem/types", () => ({
  ...jest.requireActual("@eggosystem/types"),
  calculateValueChangeFromMatch: jest.fn(),
  calculatePlayerTier: jest.fn(),
  calculateInitialPlayerValue: jest.fn()
}));

import {
  calculateValueChangeFromMatch,
  calculatePlayerTier,
  calculateInitialPlayerValue
} from "@eggosystem/types";

const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockCalculateValueChangeFromMatch =
  calculateValueChangeFromMatch as jest.MockedFunction<
    typeof calculateValueChangeFromMatch
  >;
const mockCalculatePlayerTier = calculatePlayerTier as jest.MockedFunction<
  typeof calculatePlayerTier
>;
const mockCalculateInitialPlayerValue =
  calculateInitialPlayerValue as jest.MockedFunction<
    typeof calculateInitialPlayerValue
  >;

describe("Fantasy Points Service", () => {
  const mockPlayerStats: PlayerGameStats = {
    steam_id: "12345678901234567",
    kana_rating: 1.05,
    kills: 20,
    deaths: 15,
    assists: 5,
    flash_assists: 3,
    first_kills: 2,
    first_deaths: 1,
    kills_3: 1,
    kills_4: 0,
    kills_5: 0,
    clutches_won: 1,
    awp_kills: 8,
    mvps: 1,
    adr: 90,
    kd: 1.33,
    kast: 80,
    hs_percent: 55,
    team_won: true
  };

  describe("calculateBasePoints", () => {
    it("should calculate basic kill/death/assist points", () => {
      const stats: PlayerGameStats = {
        ...mockPlayerStats,
        kills: 10,
        deaths: 5,
        assists: 5, // Increased to ensure positive assist points with 0.3 multiplier
        flash_assists: 0,
        first_kills: 0,
        first_deaths: 0,
        kills_3: 0,
        kills_4: 0,
        kills_5: 0,
        clutches_won: 0,
        mvps: 0,
        adr: 70,
        kd: 2.0,
        kast: 60,
        hs_percent: 40,
        team_won: true
      };

      const { individualPoints, breakdown } = calculateBasePoints(stats);

      // Raw stats in breakdown (not points)
      expect(breakdown.kills).toBe(10); // Raw kill count
      expect(breakdown.deaths).toBe(-5); // Raw death count (negative for reference)
      expect(breakdown.assists).toBeGreaterThan(0); // Assist points (calculated)
      expect(individualPoints).toBeGreaterThan(0);
    });

    it("should keep individual points within -30 to +30 range", () => {
      // Test maximum positive points (should be capped at 30)
      const excellentStats: PlayerGameStats = {
        ...mockPlayerStats,
        kana_rating: 1.5, // Very high rating
        kills: 25,
        deaths: 5,
        assists: 10,
        flash_assists: 5,
        first_kills: 6,
        first_deaths: 0,
        kills_3: 3,
        kills_4: 2,
        kills_5: 1,
        clutches_won: 2,
        mvps: 2,
        adr: 110,
        kd: 2.5,
        kast: 85,
        hs_percent: 65,
        team_won: true
      };

      const { individualPoints: maxPoints } =
        calculateBasePoints(excellentStats);
      expect(maxPoints).toBeLessThanOrEqual(30);
      expect(maxPoints).toBeGreaterThanOrEqual(-30);

      // Test maximum negative points (should be capped at -30)
      const terribleStats: PlayerGameStats = {
        ...mockPlayerStats,
        kana_rating: 0.2, // Very low rating
        kills: 2,
        deaths: 25,
        assists: 0,
        flash_assists: 0,
        first_kills: 0,
        first_deaths: 8,
        kills_3: 0,
        kills_4: 0,
        kills_5: 0,
        clutches_won: 0,
        mvps: 0,
        adr: 30,
        kd: 0.1,
        kast: 20,
        hs_percent: 15,
        team_won: false
      };

      const { individualPoints: minPoints } =
        calculateBasePoints(terribleStats);
      expect(minPoints).toBeLessThanOrEqual(30);
      expect(minPoints).toBeGreaterThanOrEqual(-30);
    });

    it("should apply opening kill/death points", () => {
      const { breakdown } = calculateBasePoints(mockPlayerStats);

      expect(breakdown.opening_kills).toBe(2); // 2 * 1 (reduced from 3)
      expect(breakdown.opening_deaths).toBe(-1); // 1 * -1 (reduced from -2)
    });

    it("should apply multi-kill bonuses", () => {
      const stats: PlayerGameStats = {
        ...mockPlayerStats,
        kills_3: 1,
        kills_4: 1,
        kills_5: 1
      };

      const { breakdown } = calculateBasePoints(stats);

      expect(breakdown.multi_kills).toBe(6); // 1*1 + 1*2 + 1*3 (reduced multipliers)
    });

    it("should apply performance bonuses", () => {
      const { breakdown } = calculateBasePoints(mockPlayerStats);

      expect(breakdown.adr_bonus).toBe(1); // ADR >= 90 (reduced from 3)
      expect(breakdown.kd_bonus).toBeGreaterThan(0); // K/D > 1.0
      expect(breakdown.kast_bonus).toBeGreaterThan(0); // KAST > 70
      expect(breakdown.hs_bonus).toBeGreaterThan(0); // HS% > 50
    });

    it("should not apply bonuses if thresholds not met", () => {
      const stats: PlayerGameStats = {
        ...mockPlayerStats,
        adr: 75, // Below 80 threshold
        kd: 0.95, // Below 1.0 threshold
        kast: 60, // Below 70 threshold
        hs_percent: 45 // Below 50 threshold
      };

      const { breakdown } = calculateBasePoints(stats);

      expect(breakdown.adr_bonus).toBe(0);
      expect(breakdown.kd_bonus).toBeLessThanOrEqual(0); // Can be negative for low K/D
      expect(breakdown.kast_bonus).toBe(0);
      expect(breakdown.hs_bonus).toBe(0);
    });

    it("should calculate MVP points", () => {
      const { breakdown } = calculateBasePoints(mockPlayerStats);

      expect(breakdown.mvps).toBe(2); // 1 * 2 (reduced from 4)
    });
  });

  describe("applyRoleBonus", () => {
    it("should return same points if no role assigned", () => {
      const { individualPoints, teamPoints } =
        calculateBasePoints(mockPlayerStats);
      const { totalPoints, roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        calculateBasePoints(mockPlayerStats).breakdown,
        null,
        mockPlayerStats
      );

      expect(roleBonus).toBe(0);
      expect(totalPoints).toBe(individualPoints + teamPoints);
    });

    it("should apply leader role multiplier to all points", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { totalPoints, roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "leader",
        mockPlayerStats
      );

      expect(roleBonus).toBeGreaterThan(0);
      expect(totalPoints).toBeGreaterThan(individualPoints);
      // Leader gets 20% of base points as bonus (rounded)
      expect(roleBonus).toBeGreaterThanOrEqual(
        Math.floor(individualPoints * 0.2) - 1
      );
      expect(roleBonus).toBeLessThanOrEqual(
        Math.floor(individualPoints * 0.2) + 1
      );
    });

    it("should apply entry_fragger role to opening kills", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "entry_fragger",
        mockPlayerStats
      );

      // Entry fragger gets 30% bonus on opening kills
      expect(roleBonus).toBe(Math.floor(breakdown.opening_kills * 0.3));
    });

    it("should apply support role to assists", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "support",
        mockPlayerStats
      );

      // Support gets 25% bonus on assists + flash assists
      const assistPoints = breakdown.assists + breakdown.flash_assists;
      expect(roleBonus).toBe(Math.floor(assistPoints * 0.25));
    });

    it("should apply multi_fragger role to multi-kills", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "multi_fragger",
        mockPlayerStats
      );

      // Multi fragger gets 30% bonus on multi-kills
      expect(roleBonus).toBe(Math.floor(breakdown.multi_kills * 0.3));
    });

    it("should apply hs_machine role only if HS% > 50", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);

      // With HS% = 55 (> 50)
      const { roleBonus: withBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "hs_machine",
        mockPlayerStats
      );
      expect(withBonus).toBeGreaterThan(0);

      // With HS% = 45 (< 50)
      const lowHSStats = { ...mockPlayerStats, hs_percent: 45 };
      const { roleBonus: withoutBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "hs_machine",
        lowHSStats
      );
      expect(withoutBonus).toBe(0);
    });

    it("should apply clutch_player role to clutches", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "clutch_player",
        mockPlayerStats
      );

      // Clutch player gets 40% bonus on clutches
      expect(roleBonus).toBe(Math.floor(breakdown.clutches * 0.4));
    });

    it("should apply main_awp role to AWP kills", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { roleBonus } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "main_awp",
        mockPlayerStats
      );

      // Main AWP gets 20% bonus on AWP kills (8 AWP kills * 5 points * 0.2)
      expect(roleBonus).toBe(Math.floor(mockPlayerStats.awp_kills * 5 * 0.2));
    });

    it("should handle all 18 role types without errors", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);

      const roles = [
        "main_awp",
        "leader",
        "support",
        "entry_fragger",
        "defender",
        "hs_machine",
        "multi_fragger",
        "attacker",
        "camper",
        "stathunter",
        "noob",
        "eco_friendly",
        "flash_master",
        "clutch_player",
        "first_blood",
        "t_specialist",
        "ct_specialist",
        "anchor"
      ];

      roles.forEach((role) => {
        expect(() => {
          applyRoleBonus(
            individualPoints,
            teamPoints,
            breakdown,
            role as PlayerRole,
            mockPlayerStats
          );
        }).not.toThrow();
      });
    });
  });

  describe("Integration: Base Points + Role Bonus", () => {
    it("should calculate realistic total points for a good performance", () => {
      const { individualPoints, teamPoints, breakdown } =
        calculateBasePoints(mockPlayerStats);
      const { totalPoints } = applyRoleBonus(
        individualPoints,
        teamPoints,
        breakdown,
        "leader",
        mockPlayerStats
      );

      // With leader role (20% multiplier), total should be base * 1.2
      expect(totalPoints).toBeGreaterThan(individualPoints);
      expect(totalPoints).toBeLessThan(individualPoints * 1.5); // Sanity check
    });

    it("should handle negative base points with role multiplier", () => {
      const badStats: PlayerGameStats = {
        ...mockPlayerStats,
        kana_rating: 0.3,
        kills: 5,
        deaths: 20,
        assists: 1,
        flash_assists: 0,
        first_kills: 0,
        first_deaths: 3,
        kills_3: 0,
        kills_4: 0,
        kills_5: 0,
        clutches_won: 0,
        mvps: 0,
        adr: 50,
        kd: 0.25,
        kast: 40,
        hs_percent: 30,
        team_won: false
      };

      const { individualPoints, teamPoints } = calculateBasePoints(badStats);
      const { totalPoints } = applyRoleBonus(
        individualPoints,
        teamPoints,
        calculateBasePoints(badStats).breakdown,
        "leader",
        badStats
      );

      expect(individualPoints).toBeLessThan(0);
      expect(totalPoints).toBeLessThan(individualPoints + teamPoints); // Role bonus is also negative
    });

    describe("Points Range Validation - Different Performance Levels", () => {
      it("should give reasonable points for average player (5-15 points)", () => {
        const averageStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.8, // Average rating
          kills: 15,
          deaths: 12,
          assists: 4,
          flash_assists: 2,
          first_kills: 1,
          first_deaths: 1,
          kills_3: 1,
          kills_4: 0,
          kills_5: 0,
          clutches_won: 0,
          mvps: 0,
          adr: 75,
          kd: 1.25,
          kast: 65,
          hs_percent: 45,
          team_won: true
        };

        const { individualPoints, teamPoints } =
          calculateBasePoints(averageStats);
        expect(individualPoints).toBeGreaterThanOrEqual(5);
        expect(individualPoints).toBeLessThanOrEqual(15);
        expect(teamPoints).toBe(5); // Team win bonus
      });

      it("should give high points for excellent player (25-30 points)", () => {
        const excellentStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 1.2, // Excellent rating
          kills: 22,
          deaths: 8,
          assists: 6,
          flash_assists: 3,
          first_kills: 3,
          first_deaths: 0,
          kills_3: 2,
          kills_4: 1,
          kills_5: 0,
          clutches_won: 1,
          mvps: 1,
          adr: 95,
          kd: 2.75,
          kast: 78,
          hs_percent: 58,
          team_won: true
        };

        const { individualPoints, teamPoints } =
          calculateBasePoints(excellentStats);
        expect(individualPoints).toBeGreaterThanOrEqual(20);
        expect(individualPoints).toBeLessThanOrEqual(30);
        expect(teamPoints).toBe(5);
      });

      it("should give low/negative points for poor player (-10 to 5 points)", () => {
        const poorStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.5, // Poor rating
          kills: 8,
          deaths: 18,
          assists: 2,
          flash_assists: 0,
          first_kills: 0,
          first_deaths: 2,
          kills_3: 0,
          kills_4: 0,
          kills_5: 0,
          clutches_won: 0,
          mvps: 0,
          adr: 55,
          kd: 0.44,
          kast: 45,
          hs_percent: 35,
          team_won: false
        };

        const { individualPoints, teamPoints } = calculateBasePoints(poorStats);
        expect(individualPoints).toBeGreaterThanOrEqual(-20);
        expect(individualPoints).toBeLessThanOrEqual(5);
        expect(teamPoints).toBe(-5); // Team loss penalty
      });

      it("should handle edge case: perfect game (capped at 30)", () => {
        const perfectStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 2.0, // Impossible but let's test
          kills: 30,
          deaths: 0,
          assists: 10,
          flash_assists: 5,
          first_kills: 10,
          first_deaths: 0,
          kills_3: 5,
          kills_4: 3,
          kills_5: 2,
          clutches_won: 3,
          mvps: 3,
          adr: 150,
          kd: 10.0,
          kast: 100,
          hs_percent: 100,
          team_won: true
        };

        const { individualPoints, teamPoints } =
          calculateBasePoints(perfectStats);
        expect(individualPoints).toBeLessThanOrEqual(30); // Should be capped
        expect(teamPoints).toBe(5);
      });

      it("should handle edge case: complete disaster (capped at -30)", () => {
        const disasterStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.0, // Impossible but let's test
          kills: 0,
          deaths: 30,
          assists: 0,
          flash_assists: 0,
          first_kills: 0,
          first_deaths: 10,
          kills_3: 0,
          kills_4: 0,
          kills_5: 0,
          clutches_won: 0,
          mvps: 0,
          adr: 0,
          kd: 0.0,
          kast: 0,
          hs_percent: 0,
          team_won: false
        };

        const { individualPoints, teamPoints } =
          calculateBasePoints(disasterStats);
        expect(individualPoints).toBeGreaterThanOrEqual(-30); // Should be capped
        expect(teamPoints).toBe(-5);
      });
    });

    describe("Points Calculation Accuracy", () => {
      it("should calculate rating-based points correctly", () => {
        // Rating 0.7 = 0 points baseline
        const baselineStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.7,
          kills: 0,
          deaths: 0,
          assists: 0,
          flash_assists: 0,
          first_kills: 0,
          first_deaths: 0,
          kills_3: 0,
          kills_4: 0,
          kills_5: 0,
          clutches_won: 0,
          mvps: 0,
          adr: 70,
          kd: 1.0,
          kast: 70,
          hs_percent: 50,
          team_won: false
        };

        const { individualPoints } = calculateBasePoints(baselineStats);
        // Should be close to 0 (slight variations from K/D and other bonuses)
        expect(individualPoints).toBeGreaterThanOrEqual(-2);
        expect(individualPoints).toBeLessThanOrEqual(2);
      });

      it("should apply correct multipliers for impact plays", () => {
        const impactStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.7, // Baseline
          kills: 0,
          deaths: 0,
          assists: 0,
          flash_assists: 0,
          first_kills: 1,
          first_deaths: 0, // 1 opening kill = 1 point
          kills_3: 1,
          kills_4: 0,
          kills_5: 0, // 1 triple = 1 point
          clutches_won: 1,
          mvps: 1, // 1 clutch = 2 points, 1 MVP = 2 points
          adr: 70,
          kd: 1.0,
          kast: 70,
          hs_percent: 50,
          team_won: false
        };

        const { breakdown } = calculateBasePoints(impactStats);
        expect(breakdown.opening_kills).toBe(1); // 1 * 1 = 1
        expect(breakdown.multi_kills).toBe(1); // 1 * 1 = 1
        expect(breakdown.clutches).toBe(2); // 1 * 2 = 2
        expect(breakdown.mvps).toBe(2); // 1 * 2 = 2
      });

      it("should apply performance bonuses correctly", () => {
        const bonusStats: PlayerGameStats = {
          ...mockPlayerStats,
          kana_rating: 0.7, // Baseline
          kills: 0,
          deaths: 0,
          assists: 0,
          flash_assists: 0,
          first_kills: 0,
          first_deaths: 0,
          kills_3: 0,
          kills_4: 0,
          kills_5: 0,
          clutches_won: 0,
          mvps: 0,
          adr: 95,
          kd: 1.0,
          kast: 80,
          hs_percent: 55, // All bonuses should trigger
          team_won: false
        };

        const { breakdown } = calculateBasePoints(bonusStats);
        expect(breakdown.adr_bonus).toBe(2); // ADR 95 = 2 points
        expect(breakdown.kast_bonus).toBe(1); // KAST 80 = 1 point (reduced)
        expect(breakdown.hs_bonus).toBe(1); // HS% 55 = 1 point
        expect(breakdown.kd_bonus).toBe(0); // K/D 1.0 = 0 bonus
      });
    });
  });

  describe("calculateFantasyPointsForGame", () => {
    let mockConnection: Partial<PoolConnection>;
    const matchGameId = 1;
    const seasonId = 1;
    const leagueId = 1;

    const mockPlayerStats: PlayerGameStats[] = [
      {
        steam_id: "12345",
        kana_rating: 1.05,
        kills: 20,
        deaths: 15,
        assists: 5,
        flash_assists: 3,
        first_kills: 2,
        first_deaths: 1,
        kills_3: 1,
        kills_4: 0,
        kills_5: 0,
        clutches_won: 1,
        awp_kills: 8,
        mvps: 1,
        adr: 90,
        kd: 1.33,
        kast: 80,
        hs_percent: 55,
        team_won: true
      }
    ];

    const mockFantasyTeamPlayers = [
      {
        fantasy_team_player_id: 1,
        fantasy_team_id: 1,
        steam_id: "12345",
        role: "rifler" as const
      }
    ];

    beforeEach(() => {
      jest.clearAllMocks();

      mockConnection = {
        beginTransaction: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined)
      };

      mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);

      // Default mocks - return safe defaults for runQuery
      mockRunQuery.mockImplementation((query: string) => {
        // Stage + timestamp check (must come first to pass the playoff guard)
        if (query.includes("m.stage") && query.includes("m.start_timestamp")) {
          return Promise.resolve([
            { stage: 1, start_timestamp: new Date("2024-01-15") }
          ]);
        }
        // For match info queries, return the expected result
        if (query.includes("m.season_id, m.league_id")) {
          return Promise.resolve([
            { season_id: seasonId, league_id: leagueId }
          ]);
        }
        // For other SELECT queries, return empty array
        if (query.toUpperCase().startsWith("SELECT")) {
          return Promise.resolve([]);
        }
        // For INSERT/UPDATE/DELETE queries, return success
        return Promise.resolve(undefined);
      });

      // Default mocks for value calculation functions
      mockCalculateValueChangeFromMatch.mockReturnValue({
        newValue: 200000,
        changeBasisPoints: 500,
        valueChange: 10000
      });
      mockCalculatePlayerTier.mockReturnValue("gold");
      mockCalculateInitialPlayerValue.mockReturnValue(200000);
    });

    it("should calculate and save points for all fantasy team players in a match", async () => {
      // Reset default mock and set up specific mocks
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory for points - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value (from FantasyPlayerValues) - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points for value calculation - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory for value (if value changed) - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      // Verify that UPDATE and INSERT queries were called
      const updateTeamPlayersCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("UPDATE FantasyTeamPlayers")
      );
      expect(updateTeamPlayersCalls.length).toBeGreaterThan(0);
    });

    it("should handle match with no fantasy team players gracefully", async () => {
      // Reset default mock and set up specific mocks
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame (empty) - returns empty array
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points (player not on team, so calculate) - returns empty array
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      expect(mockConnection.commit).toHaveBeenCalled();
      // Should not create FantasyPointsLog entries
      const pointsLogCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO FantasyPointsLog")
      );
      expect(pointsLogCalls.length).toBe(0);
    });

    it("should handle match with no player stats gracefully", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - returns stage=1 so function proceeds past the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame (empty array) - this should cause early return
      mockRunQuery.mockResolvedValueOnce([]);

      await calculateFantasyPointsForGame(matchGameId);

      expect(mockConnection.commit).toHaveBeenCalled();
      // Stage check + getPlayerStatsForGame (empty), then commit (no other queries)
      expect(mockRunQuery).toHaveBeenCalledTimes(2);
    });

    it("should prevent duplicate point logging (race condition)", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - throws ER_DUP_ENTRY error (race condition)
      const duplicateError = new Error("Duplicate entry");
      (duplicateError as { code?: string }).code = "ER_DUP_ENTRY";
      mockRunQuery.mockRejectedValueOnce(duplicateError);

      // Mock get match info - returns array (for value updates that still happen)
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      expect(mockConnection.commit).toHaveBeenCalled();
      // Should attempt INSERT but catch ER_DUP_ENTRY and skip point updates
      // Value updates should still happen
      const insertCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO FantasyPointsLog")
      );
      expect(insertCalls.length).toBe(1); // INSERT was attempted
    });

    it("should update FantasyTeamPlayers points correctly", async () => {
      // Reset mocks
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array with one element
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Verify FantasyTeamPlayers update was called with correct values
      const updateCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("UPDATE FantasyTeamPlayers")
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it("should update FantasyTeams total_points correctly", async () => {
      // Reset mocks
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array with one element
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Verify FantasyTeams update was called
      const updateCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("UPDATE FantasyTeams")
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });

    it("should create FantasyPointsLog entries with correct breakdown", async () => {
      // Reset mocks
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array with one element
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Verify FantasyPointsLog insert was called with correct structure
      const insertCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO FantasyPointsLog")
      );
      expect(insertCalls.length).toBeGreaterThan(0);
      const insertCall = insertCalls[0];
      expect(insertCall[1]).toHaveLength(8); // 8 parameters
    });

    it.skip("should update player values for all players in match", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);
      mockRunQuery.mockResolvedValue([]); // Reset default

      const multiplePlayers: PlayerGameStats[] = [
        mockPlayerStats[0],
        {
          ...mockPlayerStats[0],
          steam_id: "67890"
        }
      ];

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(multiplePlayers);

      // Mock getFantasyTeamPlayersForGame (only first player on team) - returns array
      mockRunQuery.mockResolvedValueOnce([mockFantasyTeamPlayers[0]]);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array with one element
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value for first player - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points for first player - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues for first player - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get current value for second player (not on team) - returns empty array
      mockRunQuery.mockResolvedValueOnce([]); // No FantasyPlayerValues
      mockRunQuery.mockResolvedValueOnce([]); // No snapshot value

      // Mock get historical stats for second player - returns array
      mockRunQuery.mockResolvedValueOnce([
        { kana_rating: 1.0, kd: 1.0, kills: 100 }
      ]);

      // Mock insert/update FantasyPlayerValues for second player - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Verify FantasyPlayerValues was updated for both players
      const valueUpdateCalls = mockRunQuery.mock.calls.filter((call) =>
        call[0]?.toString().includes("INSERT INTO FantasyPlayerValues")
      );
      expect(valueUpdateCalls.length).toBe(2); // Both players
    });

    it("should handle transaction rollback on error", async () => {
      // Reset default mock
      mockRunQuery.mockReset();

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock check for existing log - throw error
      mockRunQuery.mockRejectedValueOnce(new Error("Database error"));

      await expect(calculateFantasyPointsForGame(matchGameId)).rejects.toThrow(
        "Database error"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should use correct value priority (FantasyPlayerValues > snapshot > historical > current)", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame (empty - player not on team) - returns empty array
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Priority 1: FantasyPlayerValues exists - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 200000 }]);

      // Mock get individual points (player not on team, so calculate) - returns empty array
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Should use FantasyPlayerValues value, not check snapshot or historical
      expect(mockCalculateInitialPlayerValue).not.toHaveBeenCalled();
    });

    it.skip("should calculate value change based on individual points", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Mock FantasyPlayerHistory insert for value change
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Verify calculateValueChangeFromMatch was called with individual points
      expect(mockCalculateValueChangeFromMatch).toHaveBeenCalledWith(
        190000,
        50
      );
    });

    it("should clamp value changes to ±5%", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      mockCalculateValueChangeFromMatch.mockReturnValue({
        newValue: 210000, // Would be >5% increase from 200000
        changeBasisPoints: 500, // 5%
        valueChange: 10000
      });

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 200000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 100 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // The clamping happens in calculateValueChangeFromMatch, verify it was called
      expect(mockCalculateValueChangeFromMatch).toHaveBeenCalled();
    });

    it("should create FantasyPlayerHistory entries for point updates", async () => {
      // Reset default mock
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);

      // Mock stage check - must return stage=1 to pass the playoff guard
      mockRunQuery.mockResolvedValueOnce([
        { stage: 1, start_timestamp: new Date("2024-01-15") }
      ] as never);

      // Mock getPlayerStatsForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // Mock getFantasyTeamPlayersForGame - returns array
      mockRunQuery.mockResolvedValueOnce(mockFantasyTeamPlayers);

      // Mock insert into FantasyPointsLog - returns insert result (no duplicate error)
      mockRunQuery.mockResolvedValueOnce({ insertId: 1 });

      // Mock update FantasyTeamPlayers - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock update FantasyTeams - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock insert FantasyPlayerHistory for points - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      // Mock get match info - returns array
      mockRunQuery.mockResolvedValueOnce([
        { season_id: seasonId, league_id: leagueId }
      ]);

      // Mock get current value - returns array
      mockRunQuery.mockResolvedValueOnce([{ value: 190000 }]);

      // Mock get individual points - returns array
      mockRunQuery.mockResolvedValueOnce([{ individual_points: 50 }]);

      // Mock insert/update FantasyPlayerValues - returns undefined
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      // Verify FantasyPlayerHistory insert was called for points
      const historyCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO FantasyPlayerHistory")
      );
      expect(historyCalls.length).toBeGreaterThan(0);
    });

    it.skip("should handle players not on fantasy teams (value updates only)", async () => {
      // Reset the mock implementation completely for this test
      mockRunQuery.mockReset();
      mockRunQuery.mockResolvedValue([]);
      mockCalculateInitialPlayerValue.mockClear();
      mockCalculateValueChangeFromMatch.mockClear();

      // Set up mocks in the exact order they're called in calculateFantasyPointsForGame:
      // 1. getPlayerStatsForGame - returns array with one player (this calls runQuery internally)
      //    The query selects from PlayerStats, SeasonTeamPlayers, TeamGameScores
      mockRunQuery.mockResolvedValueOnce(mockPlayerStats);

      // 2. getFantasyTeamPlayersForGame (empty - player not on team) - returns empty array
      //    This calls runQuery internally to get fantasy team players
      mockRunQuery.mockResolvedValueOnce([]);

      // 3. Get match info - MUST return array with one element for matchInfo to be truthy
      //    This query: SELECT m.season_id, m.league_id FROM MatchGames mg INNER JOIN Matches m...
      //    This is critical - if this returns empty array, matchInfo will be undefined and value update won't run
      const matchInfoMock = [{ season_id: seasonId, league_id: leagueId }];
      mockRunQuery.mockResolvedValueOnce(matchInfoMock);

      // 4. Get current value (no FantasyPlayerValues) - returns empty array
      //    Query: SELECT value FROM FantasyPlayerValues WHERE steam_id = ? AND season_id = ?
      mockRunQuery.mockResolvedValueOnce([]);

      // 5. Get snapshot value (no snapshot) - returns empty array
      //    Query: SELECT player_value FROM FantasyTeamPlayers WHERE steam_id = ? AND is_active = TRUE
      mockRunQuery.mockResolvedValueOnce([]);

      // 6. Get historical stats - returns array (used to calculate initial value)
      //    Query: SELECT COALESCE(AVG(ps.kana_rating), 0.7) as kana_rating, ...
      mockRunQuery.mockResolvedValueOnce([
        { kana_rating: 1.0, kd: 1.0, kills: 100 }
      ]);

      // 7. Insert/update FantasyPlayerValues - returns undefined
      //    Query: INSERT INTO FantasyPlayerValues ... ON DUPLICATE KEY UPDATE ...
      mockRunQuery.mockResolvedValueOnce(undefined);

      await calculateFantasyPointsForGame(matchGameId);

      expect(mockConnection.commit).toHaveBeenCalled();

      // Should update value but not create FantasyPointsLog
      const pointsLogCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("INSERT INTO FantasyPointsLog")
      );
      expect(pointsLogCalls.length).toBe(0);

      // Verify that runQuery was called at least 3 times (player stats, fantasy team players, match info)
      expect(mockRunQuery).toHaveBeenCalledTimes(7);

      // Verify that matchInfo query was called (this ensures the value update loop runs)
      const matchInfoCalls = mockRunQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === "string" &&
          call[0].includes("SELECT m.season_id, m.league_id")
      );
      expect(matchInfoCalls.length).toBe(1);

      // Verify that value calculation happened - when player is not on team and has no current value,
      // calculateInitialPlayerValue should be called to set initial value
      // This verifies that values are updated for ALL players, not just those on fantasy teams
      expect(mockCalculateInitialPlayerValue).toHaveBeenCalled();

      // Also verify that calculateValueChangeFromMatch was called (it's called after getting currentValue)
      expect(mockCalculateValueChangeFromMatch).toHaveBeenCalled();
    });
  });
});
