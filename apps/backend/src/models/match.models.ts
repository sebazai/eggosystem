/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateQueryWithFilters } from '../middlewares/queryFilter';
import { runQuery } from '../db/mysqlRunQuery';
import { Match } from '../db/interfaces';

export const getMatches = (): Promise<Match[]> => {
  return runQuery('SELECT * FROM Matches');
};

export const getMatchPlayerStats = async (id: number): Promise<Match | undefined> => {
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

export const getMatchTeamStats = async (id: number): Promise<Match | undefined> => {
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
  const result = await runQuery<Match[]>(`SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`, [
    id,
  ]);
  return result.length > 0 ? result[0] : undefined;
};

export const getTopPlayers = async (id: number): Promise<Record<string, any>> => {
  const stats = [
    { key: 'most_kills', column: 'kills' },
    { key: 'most_adr', column: 'adr' },
    { key: 'most_assists', column: 'assists' },
    { key: 'most_awp_kills', column: 'awp_kills' },
    { key: 'most_utility_damage', column: 'utility_damage' },
    { key: 'most_first_kills', column: 'first_kills' },
    { key: 'most_mates_flashed', column: 'mates_flashed' },
  ];
  const fetchStat = async ({ key, column }: { key: string; column: string }) => {
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

export const getMatchesByFilters = async (
  team_id?: number,
  season_id?: number,
  map?: string,
  league_id?: number,
  stage?: number
): Promise<Match[]> => {
  // Base query
  let baseQuery = `
      SELECT t1.name as team1_name, t2.name as team2_name, team1_score, team2_score, date, l.name as league_name, CONCAT(UPPER(SUBSTRING(map, 4, 1)), SUBSTRING(map, 5)) as map
      FROM Matches m
       INNER JOIN Leagues l ON m.league_id = l.id
       INNER JOIN Teams t1 ON m.team1_id = t1.id
       INNER JOIN Teams t2 ON m.team2_id = t2.id
      WHERE 1 = 1
      `;

  let { query, queryParams } = generateQueryWithFilters(baseQuery, { team_id, season_id, map, league_id, stage }, true);

  return runQuery(query, queryParams);
};
