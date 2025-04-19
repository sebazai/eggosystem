import {
  type TeamMapStatsResult,
  type TeamMatch,
  type TeamPlayerStats,
  type TeamStats,
  type Team
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { buildInsertQueryParts } from "../db/utils";
import { generateQueryWithFilters } from "../utils/queryFilter";

export const getTeams = async () => {
  return runQuery<Omit<Team, "email">[]>(
    "SELECT id, organization_id, name, team_logo FROM Teams"
  );
};

export const getTeamsByFilters = async (
  season_ids: number[] | null,
  league_ids: number[] | null,
  team_ids: number[] | null
) => {
  // Use a simpler query that counts wins and losses at the match level
  let query = `
    WITH match_results AS (
      SELECT 
        m.id as match_id,
        m.league_id,
        m.season_id,
        team1.team_id as team1_id,
        team2.team_id as team2_id,
        COALESCE(SUM(CASE WHEN team1_score.score > team2_score.score THEN 1 ELSE 0 END), 0) as team1_map_wins,
        COALESCE(SUM(CASE WHEN team2_score.score > team1_score.score THEN 1 ELSE 0 END), 0) as team2_map_wins,
        m.best_of
      FROM Matches m
      JOIN MatchTeams team1 ON m.id = team1.match_id
      JOIN MatchTeams team2 ON m.id = team2.match_id AND team1.team_id < team2.team_id
      LEFT JOIN MatchGames mg ON m.id = mg.match_id
      LEFT JOIN TeamGameScores team1_score ON mg.id = team1_score.game_id AND team1_score.team_id = team1.team_id
      LEFT JOIN TeamGameScores team2_score ON mg.id = team2_score.game_id AND team2_score.team_id = team2.team_id
      GROUP BY m.id, team1.team_id, team2.team_id
    ),
    match_wins AS (
      SELECT 
        match_id, 
        league_id,
        season_id,
        team1_id as team_id, 
        CASE
          WHEN (best_of = 1 AND team1_map_wins > team2_map_wins) OR
               (best_of > 1 AND team1_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as win,
        CASE
          WHEN (best_of = 1 AND team1_map_wins < team2_map_wins) OR
               (best_of > 1 AND team2_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as loss,
        CASE
          WHEN (best_of = 1 AND team1_map_wins = team2_map_wins) OR
               (best_of > 1 AND team1_map_wins < CEILING(best_of/2) AND team2_map_wins < CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as tie
      FROM match_results
      
      UNION ALL
      
      SELECT 
        match_id, 
        league_id,
        season_id,
        team2_id as team_id, 
        CASE
          WHEN (best_of = 1 AND team2_map_wins > team1_map_wins) OR
               (best_of > 1 AND team2_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as win,
        CASE
          WHEN (best_of = 1 AND team2_map_wins < team1_map_wins) OR
               (best_of > 1 AND team1_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as loss,
        CASE
          WHEN (best_of = 1 AND team1_map_wins = team2_map_wins) OR
               (best_of > 1 AND team1_map_wins < CEILING(best_of/2) AND team2_map_wins < CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as tie
      FROM match_results
    )
    
    SELECT 
      t.id,
      t.organization_id,
      t.name,
      t.team_logo,
      SUM(win + loss + tie) as matches_played,
      SUM(win) as wins,
      SUM(loss) as losses,
      SUM(tie) as ties,
      CASE 
        WHEN SUM(win + loss + tie) > 0 
        THEN LEAST(ROUND(SUM(win) / SUM(win + loss + tie) * 100, 1), 100)
        ELSE 0 
      END as win_percentage,
      l.name as league_name,
      l.id as league_id,
      s.id as season_id,
      s.name as season_name
    FROM Teams t
    JOIN match_wins mw ON t.id = mw.team_id
    JOIN Leagues l ON mw.league_id = l.id
    JOIN Seasons s ON mw.season_id = s.id
    WHERE 1=1
  `;

  const params: number[] = [];

  if (season_ids && season_ids.length > 0) {
    query += ` AND s.id IN (${season_ids.map(() => "?").join(",")})`;
    params.push(...season_ids);
  }

  if (league_ids && league_ids.length > 0) {
    query += ` AND l.id IN (${league_ids.map(() => "?").join(",")})`;
    params.push(...league_ids);
  }

  if (team_ids && team_ids.length > 0) {
    query += ` AND t.id IN (${team_ids.map(() => "?").join(",")})`;
    params.push(...team_ids);
  }

  query += `
    GROUP BY t.id, l.id, s.id
    HAVING matches_played > 0
    ORDER BY win_percentage DESC, wins DESC, name ASC
  `;

  return runQuery<TeamStats[]>(query, params);
};

// Get team details by team ID
export const getTeamById = async (
  teamId: number,
  season_ids: number[] | null
) => {
  let query = `
    WITH match_results AS (
      SELECT 
        m.id as match_id,
        m.league_id,
        m.season_id,
        team1.team_id as team1_id,
        team2.team_id as team2_id,
        COALESCE(SUM(CASE WHEN team1_score.score > team2_score.score THEN 1 ELSE 0 END), 0) as team1_map_wins,
        COALESCE(SUM(CASE WHEN team2_score.score > team1_score.score THEN 1 ELSE 0 END), 0) as team2_map_wins,
        m.best_of
      FROM Matches m
      JOIN MatchTeams team1 ON m.id = team1.match_id
      JOIN MatchTeams team2 ON m.id = team2.match_id AND team1.team_id < team2.team_id
      LEFT JOIN MatchGames mg ON m.id = mg.match_id
      LEFT JOIN TeamGameScores team1_score ON mg.id = team1_score.game_id AND team1_score.team_id = team1.team_id
      LEFT JOIN TeamGameScores team2_score ON mg.id = team2_score.game_id AND team2_score.team_id = team2.team_id
      GROUP BY m.id, team1.team_id, team2.team_id
    ),
    match_wins AS (
      SELECT 
        match_id, 
        league_id,
        season_id,
        team1_id as team_id, 
        CASE
          WHEN (best_of = 1 AND team1_map_wins > team2_map_wins) OR
               (best_of > 1 AND team1_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as win,
        CASE
          WHEN (best_of = 1 AND team1_map_wins < team2_map_wins) OR
               (best_of > 1 AND team2_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as loss,
        CASE
          WHEN (best_of = 1 AND team1_map_wins = team2_map_wins) OR
               (best_of > 1 AND team1_map_wins < CEILING(best_of/2) AND team2_map_wins < CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as tie
      FROM match_results
      
      UNION ALL
      
      SELECT 
        match_id, 
        league_id,
        season_id,
        team2_id as team_id, 
        CASE
          WHEN (best_of = 1 AND team2_map_wins > team1_map_wins) OR
               (best_of > 1 AND team2_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as win,
        CASE
          WHEN (best_of = 1 AND team2_map_wins < team1_map_wins) OR
               (best_of > 1 AND team1_map_wins >= CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as loss,
        CASE
          WHEN (best_of = 1 AND team1_map_wins = team2_map_wins) OR
               (best_of > 1 AND team1_map_wins < CEILING(best_of/2) AND team2_map_wins < CEILING(best_of/2)) 
          THEN 1 
          ELSE 0 
        END as tie
      FROM match_results
    )
    
    SELECT 
      t.id,
      t.organization_id,
      t.name,
      t.team_logo,
      SUM(win + loss + tie) as matches_played,
      SUM(win) as wins,
      SUM(loss) as losses,
      SUM(tie) as ties,
      CASE 
        WHEN SUM(win + loss + tie) > 0 
        THEN LEAST(ROUND(SUM(win) / SUM(win + loss + tie) * 100, 1), 100)
        ELSE 0 
      END as win_percentage,
      l.name as league_name,
      l.id as league_id,
      s.id as season_id,
      s.name as season_name
    FROM Teams t
    JOIN match_wins mw ON t.id = mw.team_id
    JOIN Leagues l ON mw.league_id = l.id
    JOIN Seasons s ON mw.season_id = s.id
    WHERE t.id = ?
  `;

  const params: number[] = [teamId];

  if (season_ids && season_ids.length > 0) {
    query += ` AND s.id IN (${season_ids.map(() => "?").join(",")})`;
    params.push(...season_ids);
  }

  query += `
    GROUP BY t.id, l.id, s.id
    HAVING matches_played > 0
    ORDER BY win_percentage DESC, wins DESC, name ASC
  `;

  const results = await runQuery<TeamStats[]>(query, params);
  return results.length > 0 ? results[0] : null;
};

// Get player statistics for a team
export const getTeamPlayers = async (
  teamId: number,
  season_ids: number[] | null,
  map_ids: number[] | null
) => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "t.id", value: [teamId] },
    { column: "m.season_id", value: season_ids },
    {
      column: "mg.map_id",
      value: map_ids
    }
  ]);

  const baseQuery = `
    SELECT 
      sp.steam_id,
      sp.nickname,
      t.name as team_name,
      t.team_logo,
      COUNT(DISTINCT mg.id) as matches_played,
      SUM(ps.kills) as kills,
      SUM(ps.deaths) as deaths,
      SUM(ps.assists) as assists,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.awp_kills) as awp_kills,
      SUM(ps.headshots) as headshots,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      SUM(ps.utility_damage) as utility_damage,
      SUM(ps.total_damage) as total_damage,
      SUM(ps.enemies_flashed) as enemies_flashed,
      SUM(ps.mates_flashed) as mates_flashed,
      ROUND(SUM(ps.total_damage) / COUNT(DISTINCT mg.id), 1) as adr,
      ROUND(AVG(ps.kana_rating), 2) as kana_rating,
      ROUND(SUM(ps.headshots) / NULLIF(SUM(ps.kills), 0) * 100, 1) as hs_percent,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd
    FROM SteamPlayers sp
    JOIN PlayerStats ps ON sp.steam_id = ps.steam_id
    JOIN MatchGames mg ON ps.game_id = mg.id
    JOIN Matches m ON mg.match_id = m.id
    JOIN MatchTeams mt ON m.id = mt.match_id AND ps.team = mt.team_id
    JOIN Teams t ON mt.team_id = t.id
    WHERE ${query}
    GROUP BY sp.steam_id
    ORDER BY kana_rating DESC
  `;

  return runQuery<TeamPlayerStats[]>(baseQuery, queryParams);
};

// Get match history for a team
export const getTeamMatches = async (
  teamId: number,
  season_ids: number[] | null,
  map_ids: number[] | null
) => {
  let query = `
    WITH match_games AS (
      SELECT 
        m.id as match_id,
        m.match_date,
        m.best_of,
        mg.id as game_id,
        mg.map_id,
        maps.name as map_name,
        team1.team_id as team1_id,
        team2.team_id as team2_id,
        t1.name as team1_name,
        t1.team_logo as team1_logo,
        t2.name as team2_name,
        t2.team_logo as team2_logo,
        tgs1.score as team1_score,
        tgs2.score as team2_score,
        CASE 
          WHEN team1.team_id = ? THEN 1
          ELSE 2
        END as team_position
      FROM Matches m
      JOIN MatchTeams team1 ON m.id = team1.match_id AND team1.team_id = ?
      JOIN MatchTeams team2 ON m.id = team2.match_id AND team2.team_id != team1.team_id
      JOIN Teams t1 ON team1.team_id = t1.id
      JOIN Teams t2 ON team2.team_id = t2.id
      JOIN MatchGames mg ON m.id = mg.match_id
      JOIN Maps maps ON mg.map_id = maps.id
      LEFT JOIN TeamGameScores tgs1 ON mg.id = tgs1.game_id AND tgs1.team_id = team1.team_id
      LEFT JOIN TeamGameScores tgs2 ON mg.id = tgs2.game_id AND tgs2.team_id = team2.team_id
      WHERE tgs1.score IS NOT NULL AND tgs2.score IS NOT NULL
    )

    SELECT 
      match_id,
      DATE_FORMAT(match_date, '%Y-%m-%d') as date,
      GROUP_CONCAT(DISTINCT map_name ORDER BY map_id SEPARATOR ', ') as maps,
      MAX(CASE WHEN team_position = 1 THEN team1_id ELSE team2_id END) as team_id,
      MAX(CASE WHEN team_position = 1 THEN team1_name ELSE team2_name END) as team_name, 
      MAX(CASE WHEN team_position = 1 THEN team1_logo ELSE team2_logo END) as team_logo,
      MAX(CASE WHEN team_position = 1 THEN team2_id ELSE team1_id END) as opponent_id,
      MAX(CASE WHEN team_position = 1 THEN team2_name ELSE team1_name END) as opponent_name,
      MAX(CASE WHEN team_position = 1 THEN team2_logo ELSE team1_logo END) as opponent_logo,
      CASE 
        WHEN MAX(best_of) = 1 THEN 
          MAX(CASE WHEN team_position = 1 THEN team1_score ELSE team2_score END)
        ELSE 
          SUM(CASE 
            WHEN (team_position = 1 AND team1_score > team2_score) OR 
                (team_position = 2 AND team2_score > team1_score) 
            THEN 1 ELSE 0 END)
      END as team_score,
      CASE 
        WHEN MAX(best_of) = 1 THEN 
          MAX(CASE WHEN team_position = 1 THEN team2_score ELSE team1_score END)
        ELSE 
          SUM(CASE 
            WHEN (team_position = 1 AND team1_score < team2_score) OR 
                (team_position = 2 AND team2_score < team1_score) 
            THEN 1 ELSE 0 END)
      END as opponent_score,
      CASE
        WHEN SUM(CASE WHEN (team_position = 1 AND team1_score > team2_score) OR 
                          (team_position = 2 AND team2_score > team1_score) 
                     THEN 1 ELSE 0 END) > 
             SUM(CASE WHEN (team_position = 1 AND team1_score < team2_score) OR 
                          (team_position = 2 AND team2_score < team1_score) 
                     THEN 1 ELSE 0 END) THEN 'win'
        WHEN SUM(CASE WHEN (team_position = 1 AND team1_score > team2_score) OR 
                          (team_position = 2 AND team2_score > team1_score) 
                     THEN 1 ELSE 0 END) < 
             SUM(CASE WHEN (team_position = 1 AND team1_score < team2_score) OR 
                          (team_position = 2 AND team2_score < team1_score) 
                     THEN 1 ELSE 0 END) THEN 'loss'
        ELSE 'tie'
      END as result
    FROM match_games
  `;

  const params = [teamId, teamId];

  if (season_ids && season_ids.length > 0) {
    query += ` WHERE match_id IN (SELECT id FROM Matches WHERE season_id IN (${season_ids.map(() => "?").join(",")}))`;
    params.push(...season_ids);
  }

  if (map_ids && map_ids.length > 0) {
    query +=
      season_ids && season_ids.length > 0
        ? ` AND map_id IN (${map_ids.map(() => "?").join(",")})`
        : ` WHERE map_id IN (${map_ids.map(() => "?").join(",")})`;
    params.push(...map_ids);
  }

  query += `
    GROUP BY match_id, date
    ORDER BY match_date DESC
  `;

  return runQuery<TeamMatch[]>(query, params);
};

export const insertTeam = async (
  team: Partial<Team>,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(team);
  return runQuery<{ insertId: number }>(
    `INSERT INTO Teams (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};

// Get map statistics for a team
export const getTeamMapStats = async (
  teamId: number,
  season_ids: number[] | null,
  map_ids: number[] | null
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "mg.map_id",
      value: map_ids
    }
  ]);
  const baseQuery = `
    SELECT 
      mg.map_id,
      maps.name as map_name,
      COUNT(DISTINCT mg.id) as matches_played,
      SUM(CASE WHEN tgs.score > opponent_score.score THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN tgs.score < opponent_score.score THEN 1 ELSE 0 END) as losses,
      ROUND(AVG(tgs.score), 1) as avg_score,
      ROUND(AVG(opponent_score.score), 1) as avg_opponent_score,
      ROUND(AVG(
        CASE 
          WHEN tgs.score > opponent_score.score THEN 1.25
          WHEN tgs.score = opponent_score.score THEN 1.0
          ELSE 0.75
        END
      ), 2) as avg_rating
    FROM MatchGames mg
    JOIN Maps maps ON mg.map_id = maps.id
    JOIN TeamGameScores tgs ON mg.id = tgs.game_id AND tgs.team_id = ?
    JOIN Matches m ON mg.match_id = m.id
    JOIN MatchTeams mt ON m.id = mt.match_id AND mt.team_id = ?
    JOIN MatchTeams opponent_mt ON m.id = opponent_mt.match_id AND opponent_mt.team_id != ?
    JOIN TeamGameScores opponent_score ON mg.id = opponent_score.game_id AND opponent_score.team_id = opponent_mt.team_id
    WHERE ${query}
    GROUP BY mg.map_id, maps.name
  `;

  const params = [teamId, teamId, teamId, ...queryParams];

  const results = await runQuery<TeamMapStatsResult[]>(baseQuery, params);

  // Calculate win percentage in JavaScript to avoid SQL syntax issues
  return results.map((row) => ({
    map_id: row.map_id,
    map_name: row.map_name,
    matches_played: row.matches_played,
    wins: row.wins,
    losses: row.losses,
    win_percentage:
      row.matches_played > 0
        ? Number(((row.wins / row.matches_played) * 100).toFixed(1))
        : 0,
    avg_score: row.avg_score,
    avg_opponent_score: row.avg_opponent_score,
    avg_rating: row.avg_rating
  }));
};
