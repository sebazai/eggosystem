import { generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type Match,
  type MatchesByFilters,
  type ParsedParams,
  type MatchInfo,
  type MatchMapsPlayed,
  type MatchOrGameTopPlayerAwards,
  type MatchGame,
  type MatchPlayerStats,
  type MatchTeamStats
} from "@eggosystem/types";
import {
  fetchPlayerStatsForMatchOrGame,
  matchTopStats
} from "../shared/fetch-stat";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatch = (matchId: number) => {
  return runQuery<Array<Match | undefined>>(
    "SELECT * FROM Matches WHERE id = ?",
    [matchId]
  );
};

export const getMatchGame = (matchId: number, gameId: number) => {
  return runQuery<Array<MatchGame | undefined>>(
    "SELECT * FROM MatchGames WHERE match_id = ? AND id = ?",
    [matchId, gameId]
  );
};

export const getMatchPlayerStats = async (match_id: number) => {
  const query = `SELECT
        p.steam_id,
        p.nickname,
        stp.team_id as team_id,
        SUM(ps.kills) as kills,
        SUM(ps.headshots) as headshots,
        SUM(ps.assists) as assists,
        SUM(ps.flash_assists) as flash_assists,
        SUM(ps.deaths) as deaths,
        Round(AVG(ps.kast),0) as kast_percentage,
        Round(AVG(ps.adr),1) as adr,
        SUM(ps.enemies_flashed) as enemies_flashed,
        Round(AVG(ps.hs_percent),0) as hs_percent,
        Round(AVG(ps.kana_rating),2) as kana_rating
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      WHERE mg.match_id = ?
      GROUP BY p.steam_id, p.nickname, stp.team_id
      ORDER BY stp.team_id, kills DESC, deaths ASC;`;

  return runQuery<MatchPlayerStats[]>(query, [match_id]);
};

export const getMatchTeamStats = async (match_id: number) => {
  // For all maps in a match, handle both BO1 and BO3
  const query = `
      SELECT 
        stp.team_id,
        t.name,
        SUM(ps.first_kills) as first_kills,
        SUM(ps.clutches_won) as clutches_won,
        SUM(ps.plants) as plants,
        SUM(ps.trades) as trades
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      INNER JOIN Teams t ON t.id = stp.team_id
      WHERE m.id = ?
      GROUP BY stp.team_id`;

  return runQuery<MatchTeamStats[]>(query, [match_id]);
};

export const getRoundInfo = async (id: number): Promise<Match | undefined> => {
  const result = await runQuery<Match[]>(
    `SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`,
    [id]
  );
  return result.length > 0 ? result[0] : undefined;
};

export const getMatchTopPlayers = async (match_id: number) => {
  const queries = matchTopStats.map((stat) =>
    fetchPlayerStatsForMatchOrGame(match_id, "m.id = ?", stat, stat.sqlFunction)
  );
  const queryResults = await Promise.all(queries);

  return Object.assign({}, ...queryResults) as MatchOrGameTopPlayerAwards;
};

export const getMatchesByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: ParsedParams) => {
  // Base query
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: [{ column: "t1.id" }, { column: "t2.id" }], value: team_ids },
    { column: "m.stage", value: stages },
    { column: "mmp.map_id", value: map_ids }
  ]);

  const mapFilterPresent = map_ids && map_ids.length > 0;

  const baseQuery = `
      SELECT 
          m.id AS match_id,
          m.match_date,
          l.name AS league_name,
          m.stage,
          ${!mapFilterPresent ? "GROUP_CONCAT(DISTINCT map.name SEPARATOR ',') AS map_name," : "map.name AS map_name,"}
          t1.name AS team1_name,
          t1.team_logo AS team1_logo,
          t2.name AS team2_name,
          t2.team_logo AS team2_logo,
          CASE
            WHEN m.best_of = 1 THEN mmp.id
            ELSE NULL
          END AS game_id,
          CASE 
              ${!mapFilterPresent ? "WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)" : "WHEN 1=1 THEN tms1.score"}
              ELSE tms1.score
          END AS team1_score,
          CASE 
              ${!mapFilterPresent ? "WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)" : "WHEN 1=1 THEN tms2.score"}
              ELSE tms2.score
          END AS team2_score
      FROM Matches m
      JOIN MatchGames mmp ON m.id = mmp.match_id
      JOIN Maps map ON map.id = mmp.map_id
      JOIN Leagues l ON m.league_id = l.id
      JOIN TeamGameScores tms1 ON mmp.id = tms1.game_id
      JOIN Teams t1 ON tms1.team_id = t1.id
      JOIN TeamGameScores tms2 ON mmp.id = tms2.game_id AND tms1.team_id < tms2.team_id
      JOIN Teams t2 ON tms2.team_id = t2.id
      WHERE ${query}
      GROUP BY 
          ${!mapFilterPresent ? "m.id, m.match_date, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo" : "mmp.id, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo"}
      ORDER BY 
          m.match_date DESC ${query === "1=1" ? "LIMIT 500" : "LIMIT 100"}`;
  return runQuery<MatchesByFilters[]>(baseQuery, queryParams);
};

export const getMatchGames = async (match_id: number) => {
  const query = `
    SELECT 
      mmp.id,
      maps.name as map_name,
      mmp.demofile,
      tgs1.score as team1_score,
      tgs2.score as team2_score
    FROM MatchGames mmp
    JOIN Maps maps ON maps.id = mmp.map_id
    JOIN TeamGameScores tgs1 ON tgs1.game_id = mmp.id
    JOIN TeamGameScores tgs2 ON tgs2.game_id = mmp.id AND tgs1.team_id < tgs2.team_id
    WHERE mmp.match_id = ?
    ORDER BY mmp.map_order ASC`;

  return runQuery<MatchMapsPlayed[]>(query, [match_id]);
};

export const getMatchInfo = async (
  matchId: number
): Promise<MatchInfo | null> => {
  const query = `
      WITH MatchData AS (
          SELECT 
              m.id AS match_id,
              m.match_date,
              m.league_id,
              m.season_id,
              m.stage,
              m.best_of,
              m.start_time,
              m.end_time,
              t.id AS team_id,
              t.name AS team_name,
              t.team_logo,
              mg.id AS game_id,
              tgs1.score AS team_score,
              tgs2.score AS opponent_score
          FROM Matches m
          JOIN MatchTeams mt ON m.id = mt.match_id
          JOIN Teams t ON mt.team_id = t.id
          LEFT JOIN MatchGames mg ON m.id = mg.match_id
          LEFT JOIN TeamGameScores tgs1 ON mg.id = tgs1.game_id AND mt.team_id = tgs1.team_id
          LEFT JOIN TeamGameScores tgs2 ON mg.id = tgs2.game_id AND tgs1.team_id != tgs2.team_id
          WHERE m.id = ?
      ),
      AggregatedScores AS (
          SELECT
              match_id,
              team_id,
              team_name,
              team_logo,
              best_of,
              CASE 
                  WHEN best_of = 1 THEN COALESCE(MAX(team_score), 0)
                  ELSE COALESCE(SUM(team_score > opponent_score), 0)
              END AS team_final_score,
              CASE
                WHEN best_of = 1 THEN game_id
                ELSE NULL
              END AS game_id
          FROM MatchData
          GROUP BY match_id, team_id, team_name, team_logo, best_of
      )
      SELECT 
          a.match_id,
          m.match_date,
          m.start_time,
          m.end_time,
          m.league_id,
          l.name AS league_name,
          m.season_id,
          s.full_name AS season_name,
          m.best_of,
          m.stage,
          a.game_id,
          JSON_OBJECTAGG(
              a.team_id, 
              JSON_OBJECT(
                  'id', a.team_id,
                  'name', a.team_name,
                  'logo', a.team_logo,
                  'score', a.team_final_score
              )
          ) AS teams
      FROM AggregatedScores a
      JOIN Matches m ON a.match_id = m.id
      JOIN Seasons s ON s.id = m.season_id
      JOIN Leagues l ON l.id = m.league_id
      GROUP BY a.match_id, m.match_date, m.league_id, m.season_id, m.stage;
  `;

  const [match] = await runQuery<MatchInfo[]>(query, [matchId]);

  return match;
};
