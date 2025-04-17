import { generateQueryWithFilters as _generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type ParsedParams,
  type PlayerDetailsBySteamId
} from "@eggosystem/types";

export const getPlayerDetailsBySteamId = async (steam_id: string) => {
  const results = await runQuery<PlayerDetailsBySteamId[]>(
    `SELECT
      p.steam_id, 
      p.nickname,
      a.id as account_id,
      a.discord,
      CASE 
          WHEN a.work_email IS NULL THEN FALSE
          WHEN a.work_email LIKE '%@%' THEN TRUE
          ELSE FALSE
      END AS is_valid_work_email,
      CASE 
          WHEN a.full_name LIKE '% %' THEN TRUE 
          ELSE FALSE 
      END AS is_valid_full_name,
      CASE 
          WHEN upa.accepted_privacy_policy = TRUE AND upa.privacy_policy_version = ? THEN TRUE 
          ELSE FALSE 
      END AS has_accepted_latest_privacy_policy
    FROM SteamPlayers p 
    JOIN Accounts a ON a.id = p.account_id
    LEFT JOIN UserPolicyAcceptances upa ON upa.account_id = a.id
    WHERE p.steam_id = ?`,
    [process.env.PRIVACY_POLICY_VERSION!, steam_id]
  );

  return results.length > 0 ? results[0] : undefined;
};

export const getPlayersByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  steam_ids
}: ParsedParams) => {
  // Create query and params arrays
  const queryFilters: string[] = [];
  const queryParams: (number | string)[] = [];

  // Handle steam_ids filtering directly
  if (steam_ids && steam_ids.length) {
    const placeholders = steam_ids.map(() => "?").join(",");
    queryFilters.push(`p.steam_id IN (${placeholders})`);
    queryParams.push(...steam_ids);
  }

  // Handle direct filters
  if (team_ids && team_ids.length) {
    const placeholders = team_ids.map(() => "?").join(",");
    queryFilters.push(`stp.team_id IN (${placeholders})`);
    queryParams.push(...team_ids);
  }

  if (season_ids && season_ids.length) {
    const placeholders = season_ids.map(() => "?").join(",");
    queryFilters.push(`m.season_id IN (${placeholders})`);
    queryParams.push(...season_ids);
  }

  if (league_ids && league_ids.length) {
    const placeholders = league_ids.map(() => "?").join(",");
    queryFilters.push(`l.id IN (${placeholders})`);
    queryParams.push(...league_ids);
  }

  if (stages && stages.length) {
    const placeholders = stages.map(() => "?").join(",");
    queryFilters.push(`m.stage IN (${placeholders})`);
    queryParams.push(...stages);
  }

  if (map_ids && map_ids.length) {
    const placeholders = map_ids.map(() => "?").join(",");
    queryFilters.push(`mg.map_id IN (${placeholders})`);
    queryParams.push(...map_ids);
  }

  const whereClause = queryFilters.length
    ? `WHERE ${queryFilters.join(" AND ")}`
    : "";

  // Use INNER JOIN for team-related tables when filtering by team_id,
  // otherwise use LEFT JOIN to include all players
  const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";

  const query = `
    SELECT 
      p.steam_id,
      p.nickname, 
      t.name as team_name, 
      COUNT(DISTINCT ps.game_id) as matches_played,
      SUM(ps.kills) as kills,
      SUM(ps.assists) as assists,
      SUM(ps.deaths) as deaths,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.awp_kills) as awp_kills,
      SUM(ps.utility_damage) as utility_damage,
      SUM(ps.headshots) as headshots,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      AVG(ps.adr) as adr,
      AVG(ps.kana_rating) as kana_rating,
      AVG(ps.hs_percent) as hs_percent,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd
    FROM PlayerStats ps
    INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Leagues l ON m.league_id = l.id
    ${teamJoinType} JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    ${teamJoinType} JOIN Teams t ON t.id = stp.team_id
    ${whereClause}
    GROUP BY p.steam_id, p.nickname, t.name
    ORDER BY kana_rating DESC
  `;

  console.warn("Executing query:", query);
  console.warn("With parameters:", queryParams);

  return runQuery(query, queryParams);
};

export const getPlayerDetailsWithStatsByFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  // Create query and params arrays for stats filtering
  const queryFilters: string[] = [];
  const queryParams: (number | string)[] = [];

  // Always filter by the provided steam_id
  queryFilters.push(`p.steam_id = ?`);
  queryParams.push(steam_id);

  // Handle direct filters
  if (team_ids && team_ids.length) {
    const placeholders = team_ids.map(() => "?").join(",");
    queryFilters.push(`stp.team_id IN (${placeholders})`);
    queryParams.push(...team_ids);
  }

  if (season_ids && season_ids.length) {
    const placeholders = season_ids.map(() => "?").join(",");
    queryFilters.push(`m.season_id IN (${placeholders})`);
    queryParams.push(...season_ids);
  }

  if (league_ids && league_ids.length) {
    const placeholders = league_ids.map(() => "?").join(",");
    queryFilters.push(`l.id IN (${placeholders})`);
    queryParams.push(...league_ids);
  }

  if (stages && stages.length) {
    const placeholders = stages.map(() => "?").join(",");
    queryFilters.push(`m.stage IN (${placeholders})`);
    queryParams.push(...stages);
  }

  if (map_ids && map_ids.length) {
    const placeholders = map_ids.map(() => "?").join(",");
    queryFilters.push(`mg.map_id IN (${placeholders})`);
    queryParams.push(...map_ids);
  }

  const whereClause = queryFilters.length
    ? `WHERE ${queryFilters.join(" AND ")}`
    : "";

  // Use INNER JOIN for team-related tables when filtering by team_id,
  // otherwise use LEFT JOIN to include all player data
  const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";

  // Get player's aggregate statistics
  const statsQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      t.name as team_name,
      CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) as team_logo,
      COUNT(DISTINCT mg.id) as matches_played,
      SUM(ps.kills) as kills,
      SUM(ps.assists) as assists,
      SUM(ps.deaths) as deaths,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.awp_kills) as awp_kills,
      SUM(ps.utility_damage) as utility_damage,
      SUM(ps.headshots) as headshots,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      AVG(ps.adr) as adr,
      AVG(ps.kana_rating) as kana_rating,
      AVG(ps.hs_percent) as hs_percent,
      SUM(ps.clutches_won) as clutches_won,
      SUM(ps.clutches) - SUM(ps.clutches_won) as clutches_lost,
      AVG(ps.kast) as kast,
      SUM(ps.enemies_flashed) as enemies_flashed,
      SUM(ps.mates_flashed) as mates_flashed,
      SUM(ps.self_flashes) as self_flashes,
      SUM(ps.total_damage) as total_damage,
      SUM(ps.flashes_thrown) as flashes_thrown,
      SUM(ps.total_ef_duration) as total_ef_duration,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd,
      COUNT(DISTINCT CASE WHEN ps.team = 1 AND tgs1.score > tgs2.score THEN mg.id 
                     WHEN ps.team = 2 AND tgs1.score < tgs2.score THEN mg.id END) as wins,
      COUNT(DISTINCT CASE WHEN ps.team = 1 AND tgs1.score < tgs2.score THEN mg.id 
                     WHEN ps.team = 2 AND tgs1.score > tgs2.score THEN mg.id END) as losses,
      COUNT(DISTINCT CASE WHEN tgs1.score = tgs2.score THEN mg.id END) as draws,
      SUM(CASE WHEN ps.kills = 2 THEN 1 ELSE 0 END) as multikill_2k,
      SUM(CASE WHEN ps.kills = 3 THEN 1 ELSE 0 END) as multikill_3k,
      SUM(CASE WHEN ps.kills = 4 THEN 1 ELSE 0 END) as multikill_4k,
      SUM(CASE WHEN ps.kills = 5 THEN 1 ELSE 0 END) as multikill_5k,
      COUNT(DISTINCT ps.id) as rounds_played
    FROM SteamPlayers p
    INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Leagues l ON l.id = m.league_id
    INNER JOIN TeamGameScores tgs1 ON tgs1.game_id = mg.id
    INNER JOIN TeamGameScores tgs2 ON tgs2.game_id = mg.id AND tgs1.team_id < tgs2.team_id
    ${teamJoinType} JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    ${teamJoinType} JOIN Teams t ON t.id = stp.team_id
    ${whereClause}
    GROUP BY p.steam_id, p.nickname, t.name, t.team_logo
  `;

  // Get player's match history with stats per match
  // Build a simpler query to avoid parameter handling issues with CTEs
  let matchHistoryWhereClause = `WHERE p.steam_id = ?`;
  const matchHistoryParams: (string | number)[] = [steam_id];

  if (season_ids && season_ids.length) {
    const placeholders = season_ids.map(() => "?").join(",");
    matchHistoryWhereClause += ` AND m.season_id IN (${placeholders})`;
    matchHistoryParams.push(...season_ids);
  }

  if (league_ids && league_ids.length) {
    const placeholders = league_ids.map(() => "?").join(",");
    matchHistoryWhereClause += ` AND l.id IN (${placeholders})`;
    matchHistoryParams.push(...league_ids);
  }

  if (team_ids && team_ids.length) {
    const placeholders = team_ids.map(() => "?").join(",");
    matchHistoryWhereClause += ` AND stp.team_id IN (${placeholders})`;
    matchHistoryParams.push(...team_ids);
  }

  if (stages && stages.length) {
    const placeholders = stages.map(() => "?").join(",");
    matchHistoryWhereClause += ` AND m.stage IN (${placeholders})`;
    matchHistoryParams.push(...stages);
  }

  if (map_ids && map_ids.length) {
    const placeholders = map_ids.map(() => "?").join(",");
    matchHistoryWhereClause += ` AND mg.map_id IN (${placeholders})`;
    matchHistoryParams.push(...map_ids);
  }

  // Define types for the query results
  type PlayerStatsResult = {
    steam_id: string;
    nickname: string;
    team_name: string;
    team_logo: string;
    matches_played: number;
    kills: number;
    assists: number;
    deaths: number;
    flash_assists: number;
    awp_kills: number;
    utility_damage: number;
    headshots: number;
    first_kills: number;
    first_deaths: number;
    adr: number;
    kana_rating: number;
    hs_percent: number;
    clutches_won: number;
    clutches_lost: number;
    kast: number;
    enemies_flashed: number;
    mates_flashed: number;
    self_flashes: number;
    total_damage: number;
    flashes_thrown: number;
    total_ef_duration: number;
    kd: number;
    wins: number;
    losses: number;
    draws: number;
    multikill_2k: number;
    multikill_3k: number;
    multikill_4k: number;
    multikill_5k: number;
    rounds_played: number;
  };

  type MatchHistoryResult = {
    match_id: string;
    game_id: string;
    map_id: number;
    map_name: string;
    season_id: number;
    season_name: string;
    league_id: number;
    league_name: string;
    stage: number;
    match_date: string;
    team_id: number;
    team_name: string;
    team_logo: string;
    score: number;
    opponent_id: number;
    opponent_name: string;
    opponent_logo: string;
    opponent_score: number;
    kills: number;
    deaths: number;
    assists: number;
    flash_assists: number;
    awp_kills: number;
    utility_damage: number;
    headshots: number;
    first_kills: number;
    first_deaths: number;
    kast: number;
    adr: number;
    hs_percent: number;
    kana_rating: number;
    kd: number;
  };

  const matchHistoryQuery = `
    WITH MatchData AS (
      SELECT 
        m.id as match_id,
        m.best_of,
        m.match_date,
        m.season_id,
        s.name as season_name,
        l.id as league_id,
        l.name as league_name,
        m.stage,
        mg.id as game_id,
        mg.map_id,
        maps.name as map_name,
        ps.team as player_team,
        ps.kills,
        ps.deaths,
        ps.assists,
        ps.flash_assists,
        ps.awp_kills,
        ps.utility_damage,
        ps.headshots,
        ps.first_kills,
        ps.first_deaths,
        ps.kast,
        ps.adr,
        ps.hs_percent,
        ps.kana_rating,
        t1.id as team1_id,
        t1.name as team1_name,
        t1.team_logo as team1_logo,
        t2.id as team2_id,
        t2.name as team2_name,
        t2.team_logo as team2_logo,
        tgs1.score as team1_score,
        tgs2.score as team2_score,
        -- Determine player team based on SeasonTeamPlayers
        CASE 
          WHEN stp.team_id = t1.id THEN t1.id
          WHEN stp.team_id = t2.id THEN t2.id
          -- Fallback to ps.team when team_id doesn't match
          WHEN ps.team = 1 THEN t1.id
          ELSE t2.id
        END as player_team_id
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN Maps maps ON maps.id = mg.map_id
      INNER JOIN Seasons s ON s.id = m.season_id
      INNER JOIN Leagues l ON l.id = m.league_id
      INNER JOIN TeamGameScores tgs1 ON tgs1.game_id = mg.id
      INNER JOIN Teams t1 ON t1.id = tgs1.team_id
      INNER JOIN TeamGameScores tgs2 ON tgs2.game_id = mg.id AND tgs1.team_id < tgs2.team_id
      INNER JOIN Teams t2 ON t2.id = tgs2.team_id
      ${team_ids && team_ids.length ? "INNER" : "LEFT"} JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
      ${matchHistoryWhereClause}
    )
    
    SELECT 
      match_id,
      season_id,
      season_name,
      league_id,
      league_name,
      stage,
      match_date,
      MAX(map_name) as map_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_id ELSE team2_id END) as team_id,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_name ELSE team2_name END) as team_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_logo ELSE team2_logo END) as team_logo,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_id ELSE team1_id END) as opponent_id,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_name ELSE team1_name END) as opponent_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_logo ELSE team1_logo END) as opponent_logo,
      CASE 
        WHEN best_of = 1 THEN 
          MAX(CASE WHEN player_team_id = team1_id THEN team1_score ELSE team2_score END)
        ELSE 
          SUM(CASE 
            WHEN (player_team_id = team1_id AND team1_score > team2_score) OR 
                (player_team_id = team2_id AND team2_score > team1_score) 
            THEN 1 ELSE 0 END)
      END as score,
      CASE 
        WHEN best_of = 1 THEN 
          MAX(CASE WHEN player_team_id = team1_id THEN team2_score ELSE team1_score END)
        ELSE 
          SUM(CASE 
            WHEN (player_team_id = team1_id AND team1_score < team2_score) OR 
                (player_team_id = team2_id AND team2_score < team1_score) 
            THEN 1 ELSE 0 END)
      END as opponent_score,
      SUM(kills) as kills,
      SUM(deaths) as deaths,
      SUM(assists) as assists,
      SUM(flash_assists) as flash_assists,
      SUM(awp_kills) as awp_kills,
      SUM(utility_damage) as utility_damage,
      SUM(headshots) as headshots,
      SUM(first_kills) as first_kills,
      SUM(first_deaths) as first_deaths,
      AVG(kast) as kast,
      AVG(adr) as adr,
      AVG(hs_percent) as hs_percent,
      AVG(kana_rating) as kana_rating,
      ROUND(SUM(kills) / NULLIF(SUM(deaths), 0), 2) as kd
    FROM MatchData
    GROUP BY match_id, season_id, season_name, league_id, league_name, stage, match_date, best_of
    ORDER BY match_date DESC
    LIMIT 10
  `;

  console.warn("Executing player details query:", statsQuery);
  console.warn("With parameters:", queryParams);
  console.warn("Executing match history query:", matchHistoryQuery);
  console.warn("With parameters:", matchHistoryParams);

  const [playerStats, matchHistory] = await Promise.all([
    runQuery<PlayerStatsResult[]>(statsQuery, queryParams),
    runQuery<MatchHistoryResult[]>(matchHistoryQuery, matchHistoryParams)
  ]);

  return {
    playerStats: playerStats.length > 0 ? playerStats[0] : null,
    matchHistory
  };
};
