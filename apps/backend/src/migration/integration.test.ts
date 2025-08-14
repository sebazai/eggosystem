import { runQuery } from "../db/mysqlRunQuery";

describe("Migration tests", () => {
  it("Find enzoj maps played on season 11", async () => {
    const query = `SELECT COUNT(DISTINCT mmp.id) AS total_maps_played
      FROM PlayerStats ps
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Matches m ON mmp.match_id = m.id
      JOIN MatchTeams mt ON m.id = mt.match_id
      JOIN SeasonTeamPlayers stp ON mt.team_id = stp.team_id AND m.season_id = stp.season_id
      WHERE ps.steam_id = '76561197967885016'
      AND m.season_id = 11;`;
    const result = await runQuery<[{ total_maps_played: number }]>(query);
    expect(result[0].total_maps_played).toBe(24);
  });
  it("Test enzoj Kills on Season 11", async () => {
    const query = `SELECT SUM(ps.kills) AS total_kills
      FROM PlayerStats ps
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Matches m ON mmp.match_id = m.id
      WHERE ps.steam_id = '76561197967885016'
      AND m.season_id = 11;`;
    const result = await runQuery<[{ total_kills: number }]>(query);
    expect(result[0].total_kills).toBe(438);
  });
  it("Test meppi Assists on Season 14", async () => {
    const query = `SELECT SUM(ps.assists) AS total_assists
      FROM PlayerStats ps
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Matches m ON mmp.match_id = m.id
      WHERE ps.steam_id = '76561198001857963'
      AND m.season_id = 14;`;
    const result = await runQuery<[{ total_assists: number }]>(query);
    expect(result[0].total_assists).toBe(66);
  });
  it("Test enzoj flashAssists on Season 14 in de_mirage", async () => {
    const query = `SELECT SUM(ps.flash_assists) as total_flash_assists
      FROM PlayerStats ps
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Maps mp ON mmp.map_id = mp.id
      JOIN Matches m ON mmp.match_id = m.id
      WHERE ps.steam_id = '76561197967885016'
      AND m.season_id = 14
      AND mp.name = 'de_mirage';`;
    const result = await runQuery<[{ total_flash_assists: string }]>(query);
    expect(result[0].total_flash_assists).toBe(1);
  });

  it("There should be 1363 players on season 11", async () => {
    const query = `SELECT COUNT(stp.steam_id) AS total_players FROM SeasonTeamPlayers stp WHERE stp.season_id = 11;`;
    const result = await runQuery<[{ total_players: number }]>(query);
    expect(result[0].total_players).toBe(1363);
  });
  it("There should be 906 players on season 14", async () => {
    const query = `SELECT COUNT(stp.steam_id) AS total_players FROM SeasonTeamPlayers stp WHERE stp.season_id = 14;`;
    const result = await runQuery<[{ total_players: number }]>(query);
    expect(result[0].total_players).toBe(906);
  });

  it("There should be 186 teams on season 11 ", async () => {
    const query = `SELECT COUNT(slt.team_id) AS total_teams FROM SeasonLeagueTeams slt WHERE slt.season_id = 11;`;
    const result = await runQuery<[{ total_teams: number }]>(query);
    expect(result[0].total_teams).toBe(186);
  });
  it("There should be 124 teams on season 14 ", async () => {
    const query = `SELECT COUNT(slt.team_id) AS total_teams FROM SeasonLeagueTeams slt WHERE slt.season_id = 14;`;
    const result = await runQuery<[{ total_teams: number }]>(query);
    expect(result[0].total_teams).toBe(124);
  });

  it("There should be 1800 matches on season 11 ", async () => {
    const query = `SELECT COUNT(mmp.id) AS total_matches FROM MatchGames mmp JOIN Matches m ON m.id = mmp.match_id WHERE m.season_id = 11;`;
    const result = await runQuery<[{ total_matches: number }]>(query);
    expect(result[0].total_matches).toBe(1800);
  });
  it("There should be 1125 matches on season 14 ", async () => {
    const query = `SELECT COUNT(mmp.id) AS total_matches FROM MatchGames mmp JOIN Matches m ON m.id = mmp.match_id WHERE m.season_id = 14;`;
    const result = await runQuery<[{ total_matches: number }]>(query);
    expect(result[0].total_matches).toBe(1125);
  });

  it("Leaderboards, season 14 total matesflashed", async () => {
    const query = `select p.nickname, t.name as team_name, sum(ps.mates_flashed) as mates_flashed
      from PlayerStats ps 
      JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Matches m ON mmp.match_id = m.id
      JOIN SeasonTeamPlayers stp ON p.steam_id = stp.steam_id AND m.season_id = stp.season_id AND role = 'primary'
      JOIN Teams t ON stp.team_id = t.id
      WHERE m.season_id = 14
      GROUP BY p.steam_id
      ORDER by mates_flashed desc LIMIT 5;`;
    const result =
      await runQuery<
        [{ nickname: string; team_name: string; mates_flashed: string }]
      >(query);
    expect(result.length).toBeGreaterThanOrEqual(5);
    const expectedResults = [
      { nickname: "hebe", team_name: "Avant Tecno", mates_flashed: 568 },
      { nickname: "tiMMyd", team_name: "Evitec Esports", mates_flashed: 465 },
      {
        nickname: "Miqu",
        team_name: "K-Auto Marmoripojat",
        mates_flashed: 461
      },
      { nickname: "ville1", team_name: "Frendy Fire", mates_flashed: 453 },
      { nickname: "havukr", team_name: "Janla eSports", mates_flashed: 430 }
    ];

    expectedResults.forEach((expected, index) => {
      expect(result[index]).toEqual(expected);
    });
  });

  it("Leaderboards, Season 14 playoffs #3 in Kanarating", async () => {
    const query = `select p.nickname as nick, t.name as team_name, round(avg(ps.kana_rating),2) as kana_rating
      from PlayerStats ps
      JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      JOIN MatchGames mmp ON ps.game_id = mmp.id
      JOIN Matches m ON mmp.match_id = m.id
      JOIN SeasonTeamPlayers stp ON p.steam_id = stp.steam_id AND m.season_id = stp.season_id
      JOIN Teams t ON stp.team_id = t.id
      WHERE m.season_id = 14 and m.stage = 2
      GROUP BY p.steam_id, t.name
      ORDER BY kana_rating DESC
      LIMIT 1 OFFSET 2;`;
    const result =
      await runQuery<
        [{ nick: string; team_name: string; kana_rating: string }]
      >(query);
    const expectedResult = {
      nick: "BEHUNAMIÄS",
      team_name: "Hoxhunt e-urheilu",
      kana_rating: 1.35
    };
    expect(result[0]).toEqual(expectedResult);
  });
  // There should be 12 teams in Season 11 Masters league
  it("There should be 12 teams in Season 11 Masters league", async () => {
    const query = `SELECT COUNT(slt.team_id) AS total_teams FROM SeasonLeagueTeams slt JOIN Leagues l ON slt.league_id = l.id WHERE slt.season_id = 11 AND l.name = 'Masters';`;
    const result = await runQuery<[{ total_teams: number }]>(query);
    expect(result[0].total_teams).toBe(12);
  });

  // There should be 7 leagues in Season 14
  it("There should be 7 leagues in Season 14", async () => {
    const query = `SELECT COUNT(DISTINCT sl.league_id) AS total_leagues FROM SeasonLeagues sl WHERE sl.season_id = 14;`;
    const result = await runQuery<[{ total_leagues: number }]>(query);
    expect(result[0].total_leagues).toBe(7);
  });

  // There should be 127 Maps played in Season 11 for Masters
  it("There should be 127 Maps played in Season 11 for League 1", async () => {
    const query = `SELECT COUNT(DISTINCT mmp.id) AS total_maps FROM MatchGames mmp JOIN Matches m ON m.id = mmp.match_id WHERE m.season_id = 11 AND m.league_id = 1;`;
    const result = await runQuery<[{ total_maps: number }]>(query);
    expect(result[0].total_maps).toBe(127);
  });
});
