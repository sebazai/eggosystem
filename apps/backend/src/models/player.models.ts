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

  console.log("Executing query:", query);
  console.log("With parameters:", queryParams);

  return runQuery(query, queryParams);
};
