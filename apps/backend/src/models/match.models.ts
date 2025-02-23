/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateQueryWithFilters } from "../middlewares/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import { Match, MatchesByFilters, ParsedParams } from "@eggosystem/types";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatchPlayerStats = async (
  id: number,
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
  id: number,
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
    [id],
  );
  return result.length > 0 ? result[0] : undefined;
};

export const getTopPlayers = async (
  id: number,
): Promise<Record<string, any>> => {
  const stats = [
    { key: "most_kills", column: "kills" },
    { key: "most_adr", column: "adr" },
    { key: "most_assists", column: "assists" },
    { key: "most_awp_kills", column: "awp_kills" },
    { key: "most_utility_damage", column: "utility_damage" },
    { key: "most_first_kills", column: "first_kills" },
    { key: "most_mates_flashed", column: "mates_flashed" },
  ];
  const fetchStat = async ({
    key,
    column,
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
    {} as Record<string, any>,
  );

  return results;
};

export const getMatchesByFilters = async ({
  season_id,
  league_id,
  team_id,
  stage,
  map_id,
}: ParsedParams): Promise<MatchesByFilters[]> => {
  // Base query
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_id },
    { column: "m.league_id", value: league_id },
    { column: "m.stage", value: stage },
    { column: "mmp.map_id", value: map_id },
  ]);
  const baseQuery = `
SELECT 
    m.match_date,
    sl.name AS league_name,
    sl.id AS league_id,
    m.stage,
    m.season_id,
    maps.name AS map_name,
    t.team_name AS team_name,
    t.team_logo AS team_logo,
    opp.team_name AS opponent_name,
    opp.team_logo AS opponent_logo,
    tms.score AS team_score,
    opp_tms.score AS opponent_score
FROM MatchMapsPlayed mmp
JOIN Matches m ON mmp.match_id = m.id
JOIN SeasonLeagues sl ON m.league_id = sl.id
JOIN Maps maps ON mmp.map_id = maps.id
JOIN TeamMapScores tms ON mmp.id = tms.match_maps_played_id  -- Current team score
JOIN Teams t ON tms.team_id = t.id
JOIN TeamMapScores opp_tms 
    ON mmp.id = opp_tms.match_maps_played_id 
    AND opp_tms.team_id <> tms.team_id -- Get the opponent team
JOIN Teams opp ON opp_tms.team_id = opp.id
WHERE t.team_id = 1650 -- Filter for the specific team
ORDER BY m.match_date DESC;


      `;

  return runQuery(baseQuery, [team_id, ...queryParams]);
};
