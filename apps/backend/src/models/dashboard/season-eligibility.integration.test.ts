import { checkPlayerAdditionEligibility } from "./season.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";

describe("Season Eligibility Integration Tests", () => {
  let connection: PoolConnection;

  beforeAll(async () => {
    connection = await getConnection();
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Seed test data
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    // Clean up in reverse order of dependencies
    await runQuery(
      "DELETE FROM SeasonPlayerRanks WHERE season_id = 999",
      [],
      connection
    );

    await runQuery(
      "DELETE FROM SeasonTeamPlayers WHERE season_id = 999",
      [],
      connection
    );

    await runQuery(
      "DELETE FROM SeasonLeagueTeams WHERE season_id = 999",
      [],
      connection
    );

    await runQuery(
      "DELETE FROM SeasonLeagues WHERE season_id = 999",
      [],
      connection
    );

    await runQuery(
      "DELETE FROM Teams WHERE id IN (9991, 9992, 9993, 9995, 9996, 9997)",
      [],
      connection
    );

    await runQuery("DELETE FROM Leagues WHERE id = 999", [], connection);

    await runQuery("DELETE FROM Seasons WHERE id = 999", [], connection);

    await runQuery(
      "DELETE FROM SteamPlayers WHERE steam_id IN ('76561198028510846', '76561198028510847', '76561198028510848', '76561198028510849', '76561198028510850', '76561198028510851', '76561198028510852', '76561198028510853', '76561198028510854', '76561198028510855', '76561198028510856', '76561198028510857', '76561198028510858', '76561198028510859', '76561198028510860', '76561198028510861', '76561198028510862', '76561198028510863', '76561198028510864', '76561198028510865', '76561198028510866', '76561198028510867', '76561198028510868', '76561198028510869', '76561198028510870', '76561198028510871', '76561198028510872')",
      [],
      connection
    );

    await runQuery("DELETE FROM Matches WHERE id = 999", [], connection);
  };

  const seedTestData = async () => {
    // Insert test season
    await runQuery(
      `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date)
       VALUES (999, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31')`,
      [],
      connection
    );

    // Insert test league
    await runQuery(
      `INSERT INTO Leagues (id, name, sort_priority)
       VALUES (999, 'Test League', 1)`,
      [],
      connection
    );

    // Insert test teams
    await runQuery(
      `INSERT INTO Teams (id, organization_id, name, team_logo)
       VALUES 
         (9991, 1, 'Team Alpha', 'alpha.png'),
         (9992, 1, 'Team Beta', 'beta.png'),
         (9993, 1, 'Team Gamma', 'gamma.png')`,
      [],
      connection
    );

    // Insert SeasonLeagues record
    await runQuery(
      `INSERT INTO SeasonLeagues (season_id, league_id, tier)
       VALUES (999, 999, 1)`,
      [],
      connection
    );

    // Insert SeasonLeagueTeams (this is what the query actually uses)
    await runQuery(
      `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
       VALUES 
         (999, 9991, 999),
         (999, 9992, 999),
         (999, 9993, 999)`,
      [],
      connection
    );

    // Insert test match (needed for foreign key constraint when setting match_id = 999)
    await runQuery(
      `INSERT INTO Matches (id, league_id, season_id, stage, best_of, start_timestamp, end_timestamp)
       VALUES (999, 999, 999, 1, 3, '2024-01-01 19:00:00', '2024-01-01 22:00:00')`,
      [],
      connection
    );

    // Insert test Steam players
    await runQuery(
      `INSERT INTO SteamPlayers (steam_id, account_id, nickname)
       VALUES 
         ('76561198028510846', 1, 'Player1'),
         ('76561198028510847', 1, 'Player2'),
         ('76561198028510848', 1, 'Player3'),
         ('76561198028510849', 1, 'Player4'),
         ('76561198028510850', 1, 'Player5'),
         ('76561198028510851', 1, 'Player6'),
         ('76561198028510852', 1, 'Player7'),
         ('76561198028510853', 1, 'Player8'),
         ('76561198028510854', 1, 'Player9'),
         ('76561198028510855', 1, 'Player10'),
         ('76561198028510856', 1, 'Player11'),
         ('76561198028510857', 1, 'Player12'),
         ('76561198028510858', 1, 'Player13'),
         ('76561198028510859', 1, 'Player14'),
         ('76561198028510860', 1, 'Player15'),
         ('76561198028510861', 1, 'Player16'),
         ('76561198028510862', 1, 'Player17'),
         ('76561198028510863', 1, 'Player18'),
         ('76561198028510864', 1, 'Player19'),
         ('76561198028510865', 1, 'Player20'),
         ('76561198028510866', 1, 'Player21')`,
      [],
      connection
    );

    // Insert SeasonPlayerRanks with different kana_elo values
    await runQuery(
      `INSERT INTO SeasonPlayerRanks (season_id, steam_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours)
       VALUES 
         (999, '76561198028510846', 1800, 15, 8, 2000, 1000),
         (999, '76561198028510847', 1700, 14, 7, 1900, 950),
         (999, '76561198028510848', 1600, 13, 6, 1800, 900),
         (999, '76561198028510849', 1500, 12, 5, 1700, 850),
         (999, '76561198028510850', 1400, 11, 4, 1600, 800),
         (999, '76561198028510851', 1300, 10, 3, 1500, 750),
         (999, '76561198028510852', 1200, 9, 2, 1400, 700),
         (999, '76561198028510853', 1100, 8, 1, 1300, 650),
         (999, '76561198028510854', 1000, 7, 1, 1200, 600),
         (999, '76561198028510855', 900, 6, 1, 1100, 550),
         (999, '76561198028510856', 800, 5, 1, 1000, 500),
         (999, '76561198028510857', 700, 4, 1, 900, 450),
         (999, '76561198028510858', 600, 3, 1, 800, 400),
         (999, '76561198028510859', 500, 2, 1, 700, 350),
         (999, '76561198028510860', 400, 1, 1, 600, 300),
         (999, '76561198028510861', 300, 1, 1, 500, 250),
         (999, '76561198028510865', 500, 1, 1, 500, 250)`,
      [],
      connection
    );

    // Insert SeasonTeamPlayers with primary and substitute roles
    await runQuery(
      `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id)
       VALUES 
           -- Team Alpha: 5 primary players + 2 substitutes
           (999, 9991, '76561198028510846', 'primary', 1, 0, NULL),
           (999, 9991, '76561198028510847', 'primary', 0, 1, NULL),
           (999, 9991, '76561198028510848', 'primary', 0, 0, NULL),
           (999, 9991, '76561198028510849', 'primary', 0, 0, NULL),
           (999, 9991, '76561198028510850', 'primary', 0, 0, NULL),
           (999, 9991, '76561198028510851', 'substitute', 0, 0, 999),
           (999, 9991, '76561198028510852', 'substitute', 0, 0, NULL),
           
           -- Team Beta: 4 primary players + 2 substitutes
           (999, 9992, '76561198028510853', 'primary', 1, 0, NULL),
           (999, 9992, '76561198028510854', 'primary', 0, 1, NULL),
           (999, 9992, '76561198028510855', 'primary', 0, 0, NULL),
           (999, 9992, '76561198028510856', 'primary', 0, 0, NULL),
           (999, 9992, '76561198028510857', 'substitute', 0, 0, 999),
           (999, 9992, '76561198028510858', 'substitute', 0, 0, NULL),
           
           -- Team Gamma: 3 primary players + 3 substitutes
           (999, 9993, '76561198028510859', 'primary', 1, 0, NULL),
           (999, 9993, '76561198028510860', 'primary', 0, 1, NULL),
           (999, 9993, '76561198028510861', 'primary', 0, 0, NULL),
           (999, 9993, '76561198028510862', 'substitute', 0, 0, 999),
           (999, 9993, '76561198028510863', 'substitute', 0, 0, NULL),
           (999, 9993, '76561198028510864', 'substitute', 0, 0, 999)`,
      [],
      connection
    );
  };

  describe("Primary Player Role Filtering", () => {
    it("should only consider primary players when calculating team averages", async () => {
      // Test Team Alpha (5 primary players, no substitutes)
      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      // Should only consider the 5 primary players (1800, 1700, 1600, 1500, 1400)
      // Top 4 average: (1800 + 1700 + 1600 + 1500) / 4 = 1650
      // Top 5 average: (1800 + 1700 + 1600 + 1500 + 1400) / 5 = 1600
      expect(result.selectedTeam.current_top4_avg).toBe(1650);
      expect(result.selectedTeam.current_top5_avg).toBe(1600);
      expect(result.selectedTeam.team_id).toBe(9991);
      expect(result.selectedTeam.team_name).toBe("Team Alpha");
    });

    it("should ignore substitute players when calculating team averages", async () => {
      // Test Team Beta (4 primary + 2 substitutes)
      const result = await checkPlayerAdditionEligibility(
        999,
        9992,
        "76561198028510846",
        { connection }
      );

      // Should only consider the 4 primary players (1100, 1000, 900, 800)
      // Top 4 average: (1100 + 1000 + 900 + 800) / 4 = 950
      expect(result.selectedTeam.current_top4_avg).toBe(950);
      expect(result.selectedTeam.team_id).toBe(9992);
      expect(result.selectedTeam.team_name).toBe("Team Beta");

      // Verify substitutes were not included in calculations
      // The substitute players have kana_elo 700 and 600, which should not affect the averages
    });

    it("should ignore substitute players regardless of match_id value", async () => {
      // Test Team Gamma (3 primary + 3 substitutes with mixed match_id scenarios)
      const result = await checkPlayerAdditionEligibility(
        999,
        9993,
        "76561198028510846",
        { connection }
      );

      // Should only consider the 3 primary players (500, 400, 300)
      // Top 3 average: (500 + 400 + 300) / 3 = 400
      // Top 4 average: (500 + 400 + 300) / 4 = 400 (only 3 players)
      expect(result.selectedTeam.current_top4_avg).toBe(400);
      expect(result.selectedTeam.current_top4_avg).toBe(400);
      expect(result.selectedTeam.team_id).toBe(9993);
      expect(result.selectedTeam.team_name).toBe("Team Gamma");

      // Verify substitutes were not included in calculations
      // The substitute players have kana_elo 200, 100, and 0, which should not affect the averages
    });
  });

  describe("League Comparison Logic", () => {
    it("should compare against other teams using only their primary players", async () => {
      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      // Should find top teams in the same league (999), excluding current team (9991)
      expect(result.topTeamsInLeague).toHaveLength(2);

      // Verify the comparison only considered primary players from other teams
      // Team Beta: 4 primary players (1100, 1000, 900, 800) -> avg5 = 950
      // Team Gamma: 3 primary players (500, 400, 300) -> avg5 = 400
      // Team Alpha (9991) is excluded from comparison (correct behavior)

      const topTeam = result.topTeamsInLeague[0];
      expect(topTeam.team_id).toBe(9992); // Team Beta should be top (excluding Team Alpha)
      expect(topTeam.avg5).toBe(950);

      const secondTeam = result.topTeamsInLeague[1];
      expect(secondTeam.team_id).toBe(9993); // Team Gamma should be second
      expect(secondTeam.avg5).toBe(400);
    });

    it("should exclude current team from league comparison", async () => {
      const result = await checkPlayerAdditionEligibility(
        999,
        9992,
        "76561198028510846",
        { connection }
      );

      // Should not include Team Beta (current team) in the comparison
      const currentTeamInResults = result.topTeamsInLeague.find(
        (team) => team.team_id === 9992
      );
      expect(currentTeamInResults).toBeUndefined();

      // Should only show other teams in the league
      expect(result.topTeamsInLeague).toHaveLength(2);
      expect(result.topTeamsInLeague[0].team_id).toBe(9991); // Team Alpha
      expect(result.topTeamsInLeague[1].team_id).toBe(9993); // Team Gamma
    });
  });

  describe("Eligibility Calculation", () => {
    it("should calculate eligibility based on primary players only", async () => {
      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      // Team Alpha has 5 primary players with kana_elo: 1800, 1700, 1600, 1500, 1400
      // Current top4_avg: (1800 + 1700 + 1600 + 1500) / 4 = 1650
      // Current top5_avg: (1800 + 1700 + 1600 + 1500 + 1400) / 5 = 1600
      // New player kana_elo: 1800 (from CSRankker mock)
      // New avg with player: (1650 * 4 + 1800) / 5 = (6600 + 1800) / 5 = 8400 / 5 = 1680
      // Top team avg5: 950 (Team Beta)
      // 1680 <= 950 is false, so canAddPlayer should be false

      expect(result.selectedTeam.current_top4_avg).toBe(1650);
      expect(result.selectedTeam.current_top5_avg).toBe(1600);
      expect(result.selectedTeam.new_player_kana_elo).toBe(1800);
      expect(result.selectedTeam.new_avg_with_player).toBe(1680);

      // Should not be able to add player because 1725 > 950 (top team avg5)
      // This ensures the eligibility check only considers primary players
      expect(result.canAddPlayer).toBe(false);
    });

    it("should allow adding player when it doesn't make team too strong", async () => {
      // Test with a player that wouldn't make Team Gamma too strong
      // Team Gamma current top4_avg: (500 + 400 + 300) / 3 = 400 (only 3 players, so use all 3)
      // Adding a player with kana_elo 1800 would make new avg: (400*3 + 1800) / 4 = 680

      // The MSW server will handle the CSRankker API call, so we don't need to mock fetch here.
      // The eligibility function will call the actual CSRankker API.

      const result = await checkPlayerAdditionEligibility(
        999,
        9993,
        "76561198028510846",
        { connection }
      );

      // New average with player: (400*3 + 1800) / 4 = 680
      expect(result.selectedTeam.new_avg_with_player).toBe(680);

      // Should be able to add player because 680 <= 950 (top team avg5 from Team Beta)
      expect(result.canAddPlayer).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle team with only 3 primary players", async () => {
      // Create a team with only 3 primary players
      await runQuery(
        `INSERT INTO Teams (id, organization_id, name, team_logo)
         VALUES (9995, 1, 'Team Delta Test', 'delta.png')`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
         VALUES (999, 9995, 999)`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id)
         VALUES 
           (999, 9995, '76561198028510857', 'primary', 1, 0, NULL),
           (999, 9995, '76561198028510858', 'primary', 0, 1, NULL),
           (999, 9995, '76561198028510865', 'primary', 0, 0, NULL)`,
        [],
        connection
      );

      const result = await checkPlayerAdditionEligibility(
        999,
        9995,
        "76561198028510846",
        { connection }
      );

      // Should work with only 3 primary players
      expect(result.selectedTeam.current_top4_avg).toBe(600); // (700 + 600 + 500) / 3
      expect(result.selectedTeam.current_top4_avg).toBe(600); // Only 3 players available
      expect(result.selectedTeam.team_id).toBe(9995);
      expect(result.selectedTeam.team_name).toBe("Team Delta Test");
    });

    it("should handle team with no substitute players", async () => {
      // Team Alpha has no substitutes, should work normally
      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      expect(result.selectedTeam.current_top4_avg).toBe(1650);
      expect(result.selectedTeam.current_top5_avg).toBe(1600);
      expect(result.selectedTeam.team_id).toBe(9991);
    });
  });

  describe("Player Exclusion for Substitution", () => {
    it("should exclude specified player from eligibility calculations", async () => {
      // Team Alpha has players:
      // - 76561198028510846: 1800 (captain)
      // - 76561198028510847: 1700 (co-captain)
      // - 76561198028510848: 1600
      // - 76561198028510849: 1500
      // - 76561198028510850: 1400
      // Normally: top3_avg = (1800 + 1700 + 1600) / 3 = 1700
      // With 1700 player excluded: top3_avg = (1800 + 1600 + 1500) / 3 = 1633.33

      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510860", // New player with 400 ELO (from test data)
        {
          connection,
          excludeSteamId: "76561198028510847" // Exclude the 1700 ELO player
        }
      );

      // With 1700 player excluded: (1800 + 1600 + 1500 + 1400) / 4 = 1575
      expect(result.selectedTeam.current_top4_avg).toBe(1575);

      // New avg with player: (1575 * 4 + new_player_kana_elo) / 5
      // CSRankker mock returns stabilized kana_elo based on components
      expect(result.selectedTeam.new_player_kana_elo).toBe(1600);
      expect(result.selectedTeam.new_avg_with_player).toBe(1580);
    });

    it("should recalculate team balance when excluding top player", async () => {
      // Team Alpha: 1800, 1700, 1600, 1500, 1400
      // Exclude top player (1800): new top4 = (1700 + 1600 + 1500 + 1400) / 4 = 1550
      // Add substitute (1800): new avg = (1550 * 4 + 1800) / 5 = 1600

      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846", // 1800 ELO substitute (same as captain being excluded)
        {
          connection,
          excludeSteamId: "76561198028510846" // Exclude top player (1800 ELO captain)
        }
      );

      expect(result.selectedTeam.current_top4_avg).toBe(1550);
      expect(result.selectedTeam.new_avg_with_player).toBe(1600);
    });

    it("should work without exclusion when excludeSteamId is not provided", async () => {
      // Without exclusion, should work same as before
      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      // Normal calculation: top4 = (1800 + 1700 + 1600 + 1500) / 4 = 1650
      expect(result.selectedTeam.current_top4_avg).toBe(1650);
      expect(result.selectedTeam.new_avg_with_player).toBe(1680);
    });
  });

  describe("Discarded Players Exclusion", () => {
    it("should exclude discarded players from selected team eligibility calculation", async () => {
      // Create a team with a discarded player
      // Use new players that aren't already assigned to other teams
      await runQuery(
        `INSERT INTO Teams (id, organization_id, name, team_logo)
         VALUES (9996, 1, 'Team Epsilon Test', 'epsilon.png')`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
         VALUES (999, 9996, 999)`,
        [],
        connection
      );

      // Create new Steam players for this test
      await runQuery(
        `INSERT INTO SteamPlayers (steam_id, account_id, nickname)
         VALUES 
           ('76561198028510867', 1, 'EpsilonPlayer1'),
           ('76561198028510868', 1, 'EpsilonPlayer2'),
           ('76561198028510869', 1, 'EpsilonPlayer3'),
           ('76561198028510870', 1, 'EpsilonPlayer4')`,
        [],
        connection
      );

      // Add player ranks for these new players
      await runQuery(
        `INSERT INTO SeasonPlayerRanks (season_id, steam_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours)
         VALUES 
           (999, '76561198028510867', 1800, 15, 8, 2000, 1000),
           (999, '76561198028510868', 1700, 14, 7, 1900, 950),
           (999, '76561198028510869', 1600, 13, 6, 1800, 900),
           (999, '76561198028510870', 2000, 18, 10, 2500, 2000)`,
        [],
        connection
      );

      // Insert players: one will be discarded, others are active
      await runQuery(
        `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id, discarded_at)
         VALUES 
           (999, 9996, '76561198028510867', 'primary', 1, 0, NULL, NULL),
           (999, 9996, '76561198028510868', 'primary', 0, 1, NULL, NULL),
           (999, 9996, '76561198028510869', 'primary', 0, 0, NULL, NULL),
           (999, 9996, '76561198028510870', 'primary', 0, 0, NULL, NOW())`,
        [],
        connection
      );

      const result = await checkPlayerAdditionEligibility(
        999,
        9996,
        "76561198028510846",
        { connection }
      );

      // Should only consider non-discarded players: 1800, 1700, 1600
      // Top 3 average: (1800 + 1700 + 1600) / 3 = 1700
      // The discarded player with 2000 kana_elo should NOT be included
      expect(result.selectedTeam.current_top4_avg).toBe(1700);
      expect(result.selectedTeam.current_top4_avg).toBe(1700); // Only 3 active players
      expect(result.selectedTeam.team_id).toBe(9996);
      expect(result.selectedTeam.team_name).toBe("Team Epsilon Test");
    });

    it("should exclude discarded players from top teams eligibility calculation", async () => {
      // Discard a high-elo player from Team Beta to test top teams query
      await runQuery(
        `UPDATE SeasonTeamPlayers 
         SET discarded_at = NOW(), discarded_by = 1
         WHERE season_id = 999 AND team_id = 9992 AND steam_id = '76561198028510853'`,
        [],
        connection
      );

      // Team Beta now has: 1000, 900, 800 (1100 player discarded)
      // Top 3 average: (1000 + 900 + 800) / 3 = 900
      // Top 4 average: (1000 + 900 + 800) / 4 = 675 (only 3 players)

      const result = await checkPlayerAdditionEligibility(
        999,
        9991,
        "76561198028510846",
        { connection }
      );

      // Verify Team Beta's average is recalculated without the discarded player
      const teamBeta = result.topTeamsInLeague.find(
        (team) => team.team_id === 9992
      );
      expect(teamBeta).toBeDefined();
      // Team Beta should have avg5 = 900 (not 950 which would include the discarded 1100 player)
      expect(teamBeta?.avg5).toBe(900);
    });

    it("should handle team with all players discarded", async () => {
      // Create a team where all players are discarded
      await runQuery(
        `INSERT INTO Teams (id, organization_id, name, team_logo)
         VALUES (9997, 1, 'Team Zeta Test', 'zeta.png')`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
         VALUES (999, 9997, 999)`,
        [],
        connection
      );

      // Create new Steam players for this test
      await runQuery(
        `INSERT INTO SteamPlayers (steam_id, account_id, nickname)
         VALUES 
           ('76561198028510871', 1, 'ZetaPlayer1'),
           ('76561198028510872', 1, 'ZetaPlayer2')`,
        [],
        connection
      );

      // Add player ranks
      await runQuery(
        `INSERT INTO SeasonPlayerRanks (season_id, steam_id, kana_elo, cs2_rank, faceit_level, faceit_elo, cs_hours)
         VALUES 
           (999, '76561198028510871', 1500, 12, 5, 1700, 850),
           (999, '76561198028510872', 1400, 11, 4, 1600, 800)`,
        [],
        connection
      );

      await runQuery(
        `INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain, match_id, discarded_at)
         VALUES 
           (999, 9997, '76561198028510871', 'primary', 1, 0, NULL, NOW()),
           (999, 9997, '76561198028510872', 'primary', 0, 1, NULL, NOW())`,
        [],
        connection
      );

      // Should throw error because team has no active players
      await expect(
        checkPlayerAdditionEligibility(999, 9997, "76561198028510846", {
          connection
        })
      ).rejects.toThrow(
        "Could not analyze team 9997 - team may not have enough players in season 999"
      );
    });
  });
});
