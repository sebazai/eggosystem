/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateQueryWithFilters } from "../middlewares/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import type { Match, MatchesByFilters, ParsedParams } from "@eggosystem/types";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatchPlayerStats = async (
  game_id: number
): Promise<Match | undefined> => {
  const query = `SELECT 
        p.name,
        team, 
        kills,
        headshots, 
        assists, 
        flash_assists, 
        deaths, 
        concat(kast,' %') kast, 
        adr, 
        enemies_flashed, 
        hs_percent,
        kana_rating 
      FROM PlayerStats ps 
      INNER JOIN Players p ON p.steam_id = ps.steam_id 
      WHERE game_id=? 
      ORDER BY team,kills DESC;`;

  return runQuery(query, [game_id]);
};

export const getMatchTeamStats = async (
  game_id: number
): Promise<Match | undefined> => {
  const query = `
    SELECT 
        tms.team_id,
        t.name,
        tms.score,
        tms.halftime_score as team_ht_score,
        SUM(ps.first_kills) as first_kills,
        SUM(ps.clutches_won) as clutches_won,
        SUM(ps.plants) as plants,
        SUM(ps.trades) as trades
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
    GROUP BY tms.team_id, t.name, tms.score, tms.halftime_score
    ORDER BY tms.team_id`;
  return runQuery(query, [game_id]);
};

export const getRoundInfo = async (id: number): Promise<Match | undefined> => {
  const result = await runQuery<Match[]>(
    `SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`,
    [id]
  );
  return result.length > 0 ? result[0] : undefined;
};

export const getTopPlayers = async (
  game_id: number
): Promise<Record<string, any>> => {
  const stats = [
    { key: "most_kills", column: "kills" },
    { key: "most_adr", column: "adr" },
    { key: "most_assists", column: "assists" },
    { key: "most_awp_kills", column: "awp_kills" },
    { key: "most_utility_damage", column: "utility_damage" },
    { key: "most_first_kills", column: "first_kills" },
    { key: "most_mates_flashed", column: "mates_flashed" }
  ];
  const fetchStat = async ({
    key,
    column
  }: {
    key: string;
    column: string;
  }) => {
    const query = `
      SELECT p.name, ps.${column} as value
      FROM PlayerStats ps 
      JOIN Players p ON p.steam_id = ps.steam_id 
      WHERE ps.game_id = ? 
      ORDER BY ps.${column} DESC 
      LIMIT 1;
    `;

    const queryResults = await runQuery<any>(query, [game_id]);
    return { key, value: queryResults[0] || null };
  };

  const queries = stats.map(fetchStat);
  const queryResults = await Promise.all(queries);

  const results = queryResults.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, any>
  );

  return results;
};

export const getMatchesByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: ParsedParams): Promise<MatchesByFilters[]> => {
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
              WHEN m.best_of = 3 THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)
              ELSE tms1.score
          END AS team1_score,
          CASE 
              WHEN m.best_of = 3 THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)
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
      WHERE 
          m.best_of IN (1, 3) AND ${query}
      GROUP BY 
          m.id, m.match_date, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo
      ORDER BY 
          m.match_date DESC ${query === "1=1" ? "LIMIT 500" : "LIMIT 100"}`;
  return runQuery(baseQuery, queryParams);
};

export const getMatchGames = async (match_id: number): Promise<any[]> => {
  const query = `
    SELECT 
      mmp.id,
      maps.name as map_name,
      mmp.demofile
    FROM MatchGames mmp
    JOIN Maps maps ON maps.id = mmp.map_id
    WHERE mmp.match_id = ?
    ORDER BY mmp.map_order ASC`;

  return runQuery(query, [match_id]);
};
