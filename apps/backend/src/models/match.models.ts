import { generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import type {
  Match,
  MatchesByFilters,
  ParsedParams,
  MatchInfo,
  MatchPlayerStats,
  MatchRoundInfo,
  MatchMapsPlayed,
  MatchTeamStats,
  MatchTopPlayersQueryResult,
  PlayerStats,
  MatchTopPlayerAwards
} from "@eggosystem/types";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatchPlayerStats = async (match_id: number) => {
  const query = `SELECT
        p.name as player_name,
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
      INNER JOIN Players p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames g ON g.id = ps.game_id
      INNER JOIN Matches m on m.id = g.match_id
      INNER JOIN Seasons s on s.id = m.season_id
      INNER JOIN SeasonTeamPlayers stp on stp.season_id = s.id and stp.steam_id = p.steam_id
      INNER JOIN Teams t on t.id = stp.team_id
      WHERE g.match_id = ?
      GROUP BY p.name, stp.team_id
      ORDER BY stp.team_id, kills desc,deaths asc;`;

  return runQuery<MatchPlayerStats[]>(query, [match_id]);
};

export const getMatchGamePlayerStats = async (
  match_id: number,
  game_id: number
) => {
  const query = `SELECT
        p.name as player_name,
        stp.team_id as team_id,
        ps.kills as kills,
        ps.headshots as headshots,
        ps.assists as assists,
        ps.flash_assists as flash_assists,
        ps.deaths as deaths,
        ps.kast as kast_percentage,
        ps.adr as adr,
        ps.enemies_flashed as enemies_flashed,
        ps.hs_percent as hs_percent,
        ps.kana_rating as kana_rating
      FROM PlayerStats ps
      INNER JOIN Players p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames g ON g.id = ps.game_id
      INNER JOIN Matches m on m.id = g.match_id
      INNER JOIN Seasons s on s.id = m.season_id
      INNER JOIN SeasonTeamPlayers stp on stp.season_id = s.id and stp.steam_id = p.steam_id
      INNER JOIN Teams t on t.id = stp.team_id
      WHERE ps.game_id = ?
      GROUP BY p.name, stp.team_id
      ORDER BY stp.team_id, kills desc,deaths asc;`;

  return runQuery<MatchPlayerStats[]>(query, [game_id]);
};

export const getMatchGameTeamStats = async (
  match_id: number,
  game_id: number
) => {
  const query = `
      SELECT 
          tms.team_id,
          t.name,
          tms.score,
          tms.halftime_score as team_ht_score,
          tms.starting_side,
          COALESCE(SUM(ps.first_kills), 0) as first_kills,
          COALESCE(SUM(ps.clutches_won), 0) as clutches_won,
          COALESCE(SUM(ps.plants), 0) as plants,
          COALESCE(SUM(ps.trades), 0) as trades
      FROM MatchGames mmp
      JOIN TeamGameScores tms ON tms.game_id = mmp.id
      JOIN Teams t ON t.id = tms.team_id
      LEFT JOIN PlayerStats ps ON ps.game_id = mmp.id 
          AND ((ps.team = 1 AND tms.team_id = (
              SELECT team_id FROM TeamGameScores 
              WHERE game_id = mmp.id 
              ORDER BY team_id ASC LIMIT 1
          )) OR (ps.team = 2 AND tms.team_id = (
              SELECT team_id FROM TeamGameScores 
              WHERE game_id = mmp.id 
              ORDER BY team_id DESC LIMIT 1
          )))
      WHERE mmp.id = ?
      GROUP BY tms.team_id, t.name, tms.score, tms.halftime_score, tms.starting_side
      ORDER BY tms.team_id`;

  return runQuery<MatchTeamStats[]>(query, [game_id]);
};

export const getMatchTeamStats = async (match_id: number) => {
  // For all maps in a match, handle both BO1 and BO3
  const query = `
    SELECT 
        tms.team_id,
        t.name,
        COALESCE(SUM(ps.first_kills), 0) as first_kills,
        COALESCE(SUM(ps.clutches_won), 0) as clutches_won,
        COALESCE(SUM(ps.plants), 0) as plants,
        COALESCE(SUM(ps.trades), 0) as trades
    FROM Matches m
    JOIN MatchGames mmp ON m.id = mmp.match_id
    JOIN TeamGameScores tms ON tms.game_id = mmp.id
    JOIN Teams t ON t.id = tms.team_id
    LEFT JOIN PlayerStats ps ON ps.game_id = mmp.id 
        AND ((ps.team = 1 AND tms.team_id = (
            SELECT team_id FROM TeamGameScores 
            WHERE game_id = mmp.id 
            ORDER BY team_id ASC LIMIT 1
        )) OR (ps.team = 2 AND tms.team_id = (
            SELECT team_id FROM TeamGameScores 
            WHERE game_id = mmp.id 
            ORDER BY team_id DESC LIMIT 1
        )))
    WHERE mmp.match_id = ?
    GROUP BY tms.team_id, t.name
    ORDER BY tms.team_id`;

  return runQuery<MatchTeamStats[]>(query, [match_id]);
};

export const getRoundInfo = async (id: number): Promise<Match | undefined> => {
  const result = await runQuery<Match[]>(
    `SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`,
    [id]
  );
  return result.length > 0 ? result[0] : undefined;
};

const stats = [
  { key: "most_kills", column: "kills" },
  { key: "most_adr", column: "adr" },
  { key: "most_assists", column: "assists" },
  { key: "most_awp_kills", column: "awp_kills" },
  { key: "most_utility_damage", column: "utility_damage" },
  { key: "most_first_kills", column: "first_kills" },
  { key: "most_mates_flashed", column: "mates_flashed" },
  { key: "most_flash_assists", column: "flash_assists" }
] satisfies { key: keyof MatchTopPlayerAwards; column: keyof PlayerStats }[];

export const getMatchTopPlayers = async (match_id: number) => {
  const [match_season_id] = await runQuery<{ season_id: number }[]>(
    `SELECT season_id FROM Matches WHERE id = ?`,
    [match_id]
  );
  if (!match_season_id) {
    throw new Error("Could not find season for match id");
  }

  const fetchStat = async <T extends keyof PlayerStats>({
    key,
    column
  }: {
    key: keyof MatchTopPlayerAwards;
    column: T;
  }) => {
    const sqlFunction = column === "adr" ? "AVG" : "SUM";
    const query = `
          SELECT p.name, ${sqlFunction}(ps.${column}) as value, stp.team_id
          FROM PlayerStats ps 
          JOIN Players p ON p.steam_id = ps.steam_id 
          JOIN MatchGames mmp ON ps.game_id = mmp.id
          JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = ?
          WHERE mmp.match_id = ? 
          GROUP BY p.name
          ORDER BY value DESC 
          LIMIT 1;
        `;
    const [queryResults] = await runQuery<MatchTopPlayersQueryResult<T>[]>(
      query,
      [match_season_id.season_id, match_id]
    );

    return { [key]: queryResults };
  };

  const queries = stats.map(fetchStat);
  const queryResults = await Promise.all(queries);

  return Object.assign({}, ...queryResults) as MatchTopPlayerAwards;
};

export const getGameTopPlayers = async (match_id: number, game_id: number) => {
  const [match_season_id] = await runQuery<{ season_id: number }[]>(
    `SELECT season_id FROM Matches WHERE id = ?`,
    [match_id]
  );
  if (!match_season_id) {
    throw new Error("Could not find season for match id");
  }
  const fetchStat = async <T extends keyof PlayerStats>({
    key,
    column
  }: {
    key: keyof MatchTopPlayerAwards;
    column: T;
  }) => {
    const query = `
        SELECT p.name, ps.${column} as value, stp.team_id
        FROM PlayerStats ps 
        JOIN Players p ON p.steam_id = ps.steam_id 
        JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = ?
        WHERE ps.game_id = ? 
        ORDER BY ps.${column} DESC 
        LIMIT 1;
      `;
    const [queryResults] = await runQuery<MatchTopPlayersQueryResult<T>[]>(
      query,
      [match_season_id.season_id, game_id]
    );

    return { [key]: queryResults };
  };

  const queries = stats.map(fetchStat);
  const queryResults = await Promise.all(queries);

  return Object.assign({}, ...queryResults) as MatchTopPlayerAwards;
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

  const baseQuery = `
      SELECT 
          m.id AS game_id,
          m.match_date,
          l.name AS league_name,
          m.stage,
          t1.name AS team1_name,
          t1.team_logo AS team1_logo,
          t2.name AS team2_name,
          t2.team_logo AS team2_logo,
          CASE 
              WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)
              ELSE tms1.score
          END AS team1_score,
          CASE 
              WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)
              ELSE tms2.score
          END AS team2_score
      FROM 
          Matches m
      JOIN 
          MatchGames mmp ON m.id = mmp.match_id
      JOIN 
          Leagues l ON m.league_id = l.id
      JOIN 
          TeamGameScores tms1 ON mmp.id = tms1.game_id
      JOIN 
          Teams t1 ON tms1.team_id = t1.id
      JOIN 
          TeamGameScores tms2 ON mmp.id = tms2.game_id AND tms1.team_id < tms2.team_id
      JOIN 
          Teams t2 ON tms2.team_id = t2.id
      WHERE ${query}
      GROUP BY 
          m.id, m.match_date, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo
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
              END AS team_final_score
          FROM MatchData
          GROUP BY match_id, team_id, team_name, team_logo, best_of
      )
      SELECT 
          a.match_id,
          m.match_date,
          m.start_time,
          m.end_time,
          m.league_id,
          m.season_id,
          m.best_of,
          m.stage,
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
      GROUP BY a.match_id, m.match_date, m.league_id, m.season_id, m.stage;
  `;

  const [match] = await runQuery<MatchInfo[]>(query, [matchId]);

  return match;
};

export const getMatchRoundInfo = async (match_id: number, game_id: number) => {
  // If game_id is provided, get rounds for specific map

  // ensure game_id is part of match_id
  const checkGameQuery = `
    SELECT COUNT(*) as count
    FROM MatchGames
    WHERE match_id = ? AND id = ?
  `;
  const [checkGameResult] = await runQuery<{ count: number }[]>(
    checkGameQuery,
    [match_id, game_id]
  );
  if (checkGameResult.count === 0) {
    throw new Error("Game ID does not belong to the specified match ID");
  }

  const query = `
      SELECT 
        round_number,
        round_end_reason_info,
        ct_team_id,
        t_team_id,
        plant_site,
        first_kill
      FROM MapRoundStats mrs
      WHERE mrs.game_id = ?
      ORDER BY round_number ASC
    `;
  return runQuery<MatchRoundInfo[]>(query, [game_id]);
};
