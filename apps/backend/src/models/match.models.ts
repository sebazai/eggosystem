/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateQueryWithFilters } from "../middlewares/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import type { Match, MatchesByFilters, ParsedParams } from "@eggosystem/types";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatchPlayerStats = async (
  id: number
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
      WHERE match_id=? 
      ORDER BY team,kills DESC;`;

  const result = await runQuery<Match[]>(query, [id]);
  return result.length > 0 ? result[0] : undefined;
};

export const getMatchTeamStats = async (
  id: number
): Promise<Match | undefined> => {
  const query = `SELECT 
        if(ps.team=1,team1_ht_score,team2_ht_score) as team_ht_score,
        if(ps.team=1, team1_score-team1_ht_score,team2_score-team2_ht_score) as team_score,
        if(ps.team=1, team1_score,team2_score) as team_score_total,
        t.name,
        sum(first_kills) as first_kills,
        sum(clutches_won) as clutches_won,
        sum(plants) as plants,
        sum(trades) as trades,
        demofile,
        map
      FROM PlayerStats ps
      INNER JOIN Match m on m.id = ps.match_id
      INNER JOIN Teams t ON t.id = if(ps.team=1,m.team1_id,m.team2_id)
      WHERE match_id=? 
      GROUP BY team;`;

  const result = await runQuery<Match[]>(query, [id]);
  return result.length > 0 ? result[0] : undefined;
};

export const getRoundInfo = async (id: number): Promise<Match | undefined> => {
  const result = await runQuery<Match[]>(
    `SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`,
    [id]
  );
  return result.length > 0 ? result[0] : undefined;
};

export const getTopPlayers = async (
  id: number
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
      SELECT name, ${column} 
      FROM PlayerStats ps 
      INNER JOIN p ON p.steam_id = ps.steam_id 
      WHERE match_id=? 
      ORDER BY ${column} DESC 
      LIMIT 1;
    `;

    const queryResults = await runQuery<any>(query, [id]);
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
          mmp.id AS match_played_id,
          m.match_date,
          l.name AS league_name,
          m.stage,
          maps.name AS map_name,

          -- Team 1 (always the "lower" team ID first)
          t1.name AS team1_name,
          t1.team_logo AS team1_logo,
          tms1.score AS team1_score,
          
          -- Team 2 (always the "higher" team ID second)
          t2.name AS team2_name,
          t2.team_logo AS team2_logo,
          tms2.score AS team2_score

      FROM MatchMapsPlayed mmp
      JOIN Matches m ON mmp.match_id = m.id
      JOIN Leagues l ON m.league_id = l.id
      JOIN Maps maps ON mmp.map_id = maps.id

      -- First team
      JOIN TeamMapScores tms1 ON mmp.id = tms1.match_maps_played_id
      JOIN Teams t1 ON tms1.team_id = t1.id

      -- Second team, ensuring we don't swap duplicates
      JOIN TeamMapScores tms2 ON mmp.id = tms2.match_maps_played_id 
          AND tms1.team_id < tms2.team_id -- Ensures each match is listed only once
      JOIN Teams t2 ON tms2.team_id = t2.id

      WHERE ${query}

      ORDER BY match_played_id DESC ${query === "1=1" ? "LIMIT 500" : "LIMIT 1000"};
      `;

  return runQuery(baseQuery, queryParams);
};
