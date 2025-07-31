import { saveParsedDemoDataForGame } from "../game.models";
import {
  MOCK_PARSED_DEMO_DATA,
  MOCK_GAME_ID
} from "../../__mocks__/demo-parsed-json/mock-parsed-demo";
import { runQuery } from "../../db/mysqlRunQuery";

// TypeScript interfaces for database query results
interface TeamGameScore {
  id: number;
  game_id: number;
  team_id: number;
  starting_side: string;
  score: number;
  halftime_score: number;
  overtime_score: number;
}

interface PlayerStat {
  id: number;
  game_id: number;
  steam_id: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  headshots: number;
  hs_percent: number;
  kast: number;
  kana_rating: number;
  rws: number;
}

interface PlayerTrade {
  id: number;
  game_id: number;
  killer_steam_id: string;
  victim_steam_id: string;
  round_number: number;
  killer_team: number;
  victim_team: number;
}

interface MapRoundStat {
  id: number;
  game_id: number;
  round_number: number;
  t_team_id: number;
  ct_team_id: number;
  round_end_reason_info: number;
  winner: string;
}

interface CountResult {
  count: number;
}

describe("saveParsedDemoDataForGame Integration Tests", () => {
  beforeAll(async () => {
    // Seed test data
    await cleanupTestData();
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up data after each test to prevent duplicate entry errors
    await runQuery(
      `
      DELETE FROM MapRoundStats WHERE game_id = ?
      `,
      [123123]
    );
    await runQuery(
      `
      DELETE FROM PlayerTrades WHERE game_id = ?
      `,
      [123123]
    );
    await runQuery(
      `
      DELETE FROM PlayerStats WHERE game_id = ?
      `,
      [123123]
    );
    await runQuery(
      `
      DELETE FROM TeamGameScores WHERE game_id = ?
      `,
      [123123]
    );
  });

  const cleanupTestData = async () => {
    await runQuery(
      `
      DELETE FROM MatchGames WHERE id = ?
      `,
      [123123]
    );
    await runQuery(
      `
      DELETE FROM MatchTeams WHERE team_id IN (20000, 20001)
      `,
      []
    );
    await runQuery(
      `
      DELETE FROM Matches WHERE id = ?
      `,
      [5]
    );
    await runQuery(
      `
      DELETE FROM SeasonLeagueTeams WHERE season_id = ?
      `,
      [9999]
    );
    await runQuery(
      `
      DELETE FROM SeasonLeagues WHERE season_id = ?
      `,
      [9999]
    );
    await runQuery(
      `
      DELETE FROM Seasons WHERE id = ?
      `,
      [9999]
    );
    await runQuery(
      `
      DELETE FROM Leagues WHERE id = ?
      `,
      [9999]
    );
    await runQuery(
      `
      DELETE FROM Teams WHERE id IN (20000, 20001)
      `,
      []
    );
    await runQuery(
      `
      DELETE FROM SeasonTeamPlayers WHERE team_id IN (20000, 20001)
      `,
      []
    );
  };

  const seedTestData = async () => {
    // Insert test season
    await runQuery(
      `
      INSERT INTO Seasons (id, game_id, name, full_name, start_date, end_date)
      VALUES (9999, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31')
    `,
      []
    );

    // Insert test teams
    await runQuery(
      `
      INSERT INTO Teams (id, organization_id, name, team_logo)
      VALUES 
        (20000, ?, 'Team A', 'team_a.png'),
        (20001, ?, 'Team B', 'team_b.png')
    `,
      [null, null]
    );

    // Insert test league
    await runQuery(
      `
      INSERT INTO Leagues (id, name, sort_priority)
      VALUES (9999, 'Test League', 1)
    `,
      []
    );

    // Insert SeasonLeagues record (required for Matches table)
    await runQuery(
      `
      INSERT INTO SeasonLeagues (tier, season_id, league_id)
      VALUES (1, 9999, 9999)
    `,
      []
    );

    // Insert SeasonLeagueTeams records (required for MatchTeams table)
    await runQuery(
      `
      INSERT INTO SeasonLeagueTeams (season_id, team_id, league_id)
      VALUES 
        (9999, 20000, 9999),
        (9999, 20001, 9999)
    `,
      []
    );

    // Insert test match
    await runQuery(
      `
      INSERT INTO Matches (id, league_id, season_id, stage, best_of, match_date, start_time, end_time, status)
      VALUES (5, 9999, 9999, 1, 3, '2024-01-01', '18:00:00', '20:00:00', 'FINISHED')
    `,
      []
    );

    // Link teams to match
    await runQuery(
      `
      INSERT INTO MatchTeams (match_id, team_id, season_id, league_id)
      VALUES 
        (5, 20000, 9999, 9999),
        (5, 20001, 9999, 9999)
    `,
      []
    );

    // Insert test game
    await runQuery(
      `
      INSERT INTO MatchGames (id, match_id, map_id, map_order, demofile, regulation_rounds)
      VALUES (123123, 5, 3, 1, 'test.dem', 24)
    `,
      []
    );

    // Insert test players
    await runQuery(
      `
      INSERT IGNORE INTO SteamPlayers (steam_id, nickname)
      VALUES 
        ('76561197979955992', 'Player 1'),
        ('76561198129692076', 'Player 2'),
        ('76561198282583074', 'Player 3'),
        ('76561198367129350', 'Player 4'),
        ('76561198437815468', 'Player 5'),
        ('76561198074105343', 'Player 6'),
        ('76561198160889809', 'Player 7'),
        ('76561198969706496', 'Player 8'),
        ('76561199070598421', 'Player 9'),
        ('76561199549505672', 'Player 10')
      `,
      []
    );

    // Insert test players
    await runQuery(
      `
      INSERT INTO SeasonTeamPlayers (season_id, team_id, steam_id, role, is_captain, is_co_captain)
      VALUES 
        (9999, 20000, '76561197979955992', 'primary', 1, 0),
        (9999, 20000, '76561198129692076', 'primary', 0, 1),
        (9999, 20000, '76561198282583074', 'primary', 0, 0),
        (9999, 20000, '76561198367129350', 'primary', 0, 0),
        (9999, 20000, '76561198437815468', 'primary', 0, 0),
        (9999, 20001, '76561198074105343', 'primary', 1, 0),
        (9999, 20001, '76561198160889809', 'primary', 0, 1),
        (9999, 20001, '76561198969706496', 'primary', 0, 0),
        (9999, 20001, '76561199070598421', 'primary', 0, 0),
        (9999, 20001, '76561199549505672', 'primary', 0, 0)
    `,
      []
    );
  };

  describe("successful integration tests", () => {
    it("should successfully save parsed demo data to database", async () => {
      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, MOCK_PARSED_DEMO_DATA);

      // Assert - Check that data was actually saved
      const teamGameScores = await runQuery<TeamGameScore[]>(
        `
        SELECT * FROM TeamGameScores WHERE game_id = ?
      `,
        [123123]
      );

      expect(teamGameScores).toHaveLength(2);
      expect(teamGameScores[0]).toMatchObject({
        game_id: 123123,
        team_id: 20000,
        starting_side: "T",
        score: 13,
        halftime_score: 6,
        overtime_score: 0
      });
      expect(teamGameScores[1]).toMatchObject({
        game_id: 123123,
        team_id: 20001,
        starting_side: "CT",
        score: 9,
        halftime_score: 6,
        overtime_score: 0
      });
    });

    it("should save player stats correctly", async () => {
      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, MOCK_PARSED_DEMO_DATA);

      // Assert - Check player stats
      const playerStats = await runQuery<PlayerStat[]>(
        `
        SELECT * FROM PlayerStats WHERE game_id = ?
      `,
        [123123]
      );

      expect(playerStats).toHaveLength(10); // All players from the mock data

      // Check first player stats
      const player1 = playerStats.find(
        (p: PlayerStat) => p.steam_id === "76561197979955992"
      );
      expect(player1).toMatchObject({
        game_id: 123123,
        steam_id: "76561197979955992",
        kills: 20,
        deaths: 14,
        assists: 5,
        adr: 92.9,
        headshots: 6,
        hs_percent: 30,
        kast: 77,
        kana_rating: 1.02,
        rws: 20.44
      });

      // Check second player stats
      const player2 = playerStats.find(
        (p: PlayerStat) => p.steam_id === "76561198074105343"
      );
      expect(player2).toMatchObject({
        game_id: 123123,
        steam_id: "76561198074105343",
        kills: 7,
        deaths: 13,
        assists: 5,
        adr: 38.1,
        headshots: 3,
        hs_percent: 43,
        kast: 73,
        kana_rating: 0.36,
        rws: 2.81
      });
    });

    it("should save player trades correctly", async () => {
      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, MOCK_PARSED_DEMO_DATA);

      // Assert - Check player trades
      const playerTrades = await runQuery<PlayerTrade[]>(
        `
        SELECT * FROM PlayerTrades WHERE game_id = ?
      `,
        [123123]
      );

      expect(playerTrades).toHaveLength(75); // All trades from the mock data
      // Just verify that trades were saved, don't check specific values since they depend on the mock data
      expect(playerTrades[0]).toMatchObject({
        game_id: 123123,
        round_number: 1
      });
    });

    it("should save map round stats correctly", async () => {
      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, MOCK_PARSED_DEMO_DATA);

      // Assert - Check map round stats
      const mapRoundStats = await runQuery<MapRoundStat[]>(
        `
        SELECT * FROM MapRoundStats WHERE game_id = ?
      `,
        [123123]
      );

      expect(mapRoundStats).toHaveLength(22); // All rounds from the mock data
      // Just verify that round stats were saved, don't check specific values since they depend on the mock data
      expect(mapRoundStats[0]).toMatchObject({
        game_id: 123123,
        round_number: 1,
        t_team_id: 20000,
        ct_team_id: 20001
      });
    });
  });

  describe("error handling integration tests", () => {
    it("should throw error when game does not exist", async () => {
      // Act & Assert
      await expect(
        saveParsedDemoDataForGame("999999", MOCK_PARSED_DEMO_DATA)
      ).rejects.toThrow("Could not find parent match for game 999999");
    });

    it("should throw error when teams are not found for players", async () => {
      // Arrange - Create data with players not in any team
      const dataWithUnknownPlayers = {
        ...MOCK_PARSED_DEMO_DATA,
        Players: {
          "99999999999999999": {
            ...MOCK_PARSED_DEMO_DATA.Players["76561197979955992"],
            SteamID: "999999999999999",
            Team: 1
          }
        }
      };

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_GAME_ID, dataWithUnknownPlayers)
      ).rejects.toThrow(/Could not find team for game 123123/);
    });
  });

  describe("data validation integration tests", () => {
    it("should handle players that don't exist in teams", async () => {
      // Arrange - Create data with players not in any team
      const dataWithUnknownPlayers = {
        ...MOCK_PARSED_DEMO_DATA,
        Players: {
          "99999999999999999": {
            ...MOCK_PARSED_DEMO_DATA.Players["76561197979955992"],
            SteamID: "99999999999999999",
            Team: 1
          },
          "99999999999999998": {
            ...MOCK_PARSED_DEMO_DATA.Players["76561198074105343"],
            SteamID: "99999999999999998",
            Team: 2
          }
        }
      };

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_GAME_ID, dataWithUnknownPlayers)
      ).rejects.toThrow(/Could not find team for game 123123/);
    });

    it("should handle missing score data", async () => {
      // Arrange - Create invalid data that will cause an error
      const dataWithoutScore = {
        ...MOCK_PARSED_DEMO_DATA,
        Score: {
          Team1HTScore: 0,
          Team2HTScore: 0,
          Team1Score: 0,
          Team2Score: 0,
          Team1OTScore: 0,
          Team2OTScore: 0,
          Map: "de_dust2"
        }
      };

      // Act & Assert - This should actually succeed since the data is valid
      await expect(
        saveParsedDemoDataForGame(MOCK_GAME_ID, dataWithoutScore)
      ).resolves.not.toThrow();
    });

    it("should handle empty round info", async () => {
      // Arrange
      const dataWithoutRounds = {
        ...MOCK_PARSED_DEMO_DATA,
        NewRoundInfo: { Rounds: [] }
      };

      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, dataWithoutRounds);

      // Assert - Should complete successfully with empty rounds
      const mapRoundStats = await runQuery<MapRoundStat[]>(
        `
        SELECT * FROM MapRoundStats WHERE game_id = ?
      `,
        [123123]
      );

      expect(mapRoundStats).toHaveLength(0);
    });
  });

  describe("transaction integrity tests", () => {
    it("should rollback all changes on error", async () => {
      // Arrange - Create invalid data that will cause an error
      const invalidData = {
        ...MOCK_PARSED_DEMO_DATA,
        Players: {
          "99999999999999999": {
            ...MOCK_PARSED_DEMO_DATA.Players["76561197979955992"],
            SteamID: "99999999999999999",
            Team: 1
          },
          "99999999999999998": {
            ...MOCK_PARSED_DEMO_DATA.Players["76561198074105343"],
            SteamID: "99999999999999998",
            Team: 2
          }
        }
      };

      // Act & Assert
      await expect(
        saveParsedDemoDataForGame(MOCK_GAME_ID, invalidData)
      ).rejects.toThrow(/Could not find team for game 123123/);

      // Verify no data was saved
      const teamGameScores = await runQuery<TeamGameScore[]>(
        `
        SELECT * FROM TeamGameScores WHERE game_id = ?
      `,
        [123123]
      );

      expect(teamGameScores).toHaveLength(0);
    });

    it("should maintain data consistency across all tables", async () => {
      // Act
      await saveParsedDemoDataForGame(MOCK_GAME_ID, MOCK_PARSED_DEMO_DATA);

      // Assert - Verify data consistency across all related tables
      const gameCount = await runQuery<CountResult[]>(
        `
        SELECT COUNT(*) as count FROM MatchGames WHERE id = ?
      `,
        [123123]
      );
      expect(gameCount[0].count).toBe(1);

      const teamScoresCount = await runQuery<TeamGameScore[]>(
        `
        SELECT * FROM TeamGameScores WHERE game_id = ?
      `,
        [123123]
      );
      expect(teamScoresCount.length).toBe(2);

      const playerStatsCount = await runQuery<CountResult[]>(
        `
        SELECT COUNT(*) as count FROM PlayerStats WHERE game_id = ?
      `,
        [123123]
      );
      expect(playerStatsCount[0].count).toBe(10); // All players from the mock data

      const tradesCount = await runQuery<CountResult[]>(
        `
        SELECT COUNT(*) as count FROM PlayerTrades WHERE game_id = ?
      `,
        [123123]
      );
      expect(tradesCount[0].count).toBe(75); // All trades from the mock data

      let sumOfRounds = 0;
      for (const teamScore of teamScoresCount) {
        sumOfRounds += teamScore.score + teamScore.overtime_score;
      }

      expect(sumOfRounds).toBe(22); // 13 + 0 + 9 + 0 = 22

      const roundStatsCount = await runQuery<CountResult[]>(
        `
        SELECT COUNT(*) as count FROM MapRoundStats WHERE game_id = ?
      `,
        [123123]
      );
      expect(roundStatsCount[0].count).toBe(22);
    });
  });
});
