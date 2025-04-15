import { generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type ParsedParams,
  type PlayerDetailsBySteamId
} from "@eggosystem/types";

const leaderboardExpressions: { [key: string]: string } = {
  // SUM stats
  kills: "sum(ps.kills)",
  assists: "sum(ps.assists)",
  deaths: "sum(ps.deaths)",
  flash_assists: "sum(ps.flash_assists)",
  utility_damage: "sum(ps.utility_damage)",
  total_damage: "sum(ps.total_damage)",
  awp_kills: "sum(ps.awp_kills)",
  headshots: "sum(ps.headshots)",
  enemies_flashed: "sum(ps.enemies_flashed)",
  mates_flashed: "sum(ps.mates_flashed)",
  self_flashes: "sum(ps.self_flashes)",
  clutches_won: "sum(ps.clutches_won)",
  one_v_one_won: "sum(ps.one_v_one_won)",
  first_deaths: "sum(ps.first_deaths)",
  first_kills: "sum(ps.first_kills)",
  flashes_thrown: "sum(ps.flashes_thrown)",
  total_ef_duration: "sum(ps.total_ef_duration)",

  // AVG stats
  kast: "avg(ps.kast)",
  kana_rating: "avg(ps.kana_rating)",
  hs_percent: "avg(ps.hs_percent)",
  adr: "avg(ps.adr)",

  // Derived stats
  kd: "sum(ps.kills) / GREATEST(sum(ps.deaths), 1)" // Safer division
};

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

// ????????? Fix this, does not return Player array
export const getPlayersByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ParsedParams): Promise<any[]> => {
  // Base query
  const _baseQuery = `
      SELECT p.nickname, t.name as team_name, l.name as league_name, count(m.id) as matches_played,
      ${[
        "kills",
        "assists",
        "deaths",
        "flash_assists",
        "awp_kills",
        "total_damage",
        "headshots"
      ]
        .map((col) => `sum(ps.${col}) as ${col}`)
        .join(", ")},
      ${[
        "enemies_flashed",
        "mates_flashed",
        "first_kills",
        "first_deaths",
        "kills_5",
        "utility_damage"
      ]
        .map((col) => `sum(ps.${col}) as ${col}`)
        .join(", ")},
      ${["adr", "kana_rating", "hs_percent"].map((col) => `avg(ps.${col}) as ${col}`).join(", ")}
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN Matches m ON m.id = ps.match_id
      INNER JOIN Leagues l ON m.league_id = l.id
      INNER JOIN Teams t ON p.team_id = t.id
    `;
  const { query, queryParams } = generateQueryWithFilters([
    { column: "p.team_id", value: team_ids },
    { column: "l.season_id", value: season_ids },
    { column: "l.id", value: league_ids },
    { column: "m.stage", value: stages },
    { column: "mmp.map_id", value: map_ids }
  ]);
  const fullQuery = query + " GROUP BY p.steam_id";
  return runQuery(fullQuery, queryParams);
};

// Fix this...
export const getPlayerLeaderboard = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  leaderboards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ParsedParams): Promise<any[]> => {
  if (!leaderboards) {
    throw new Error("Leaderboards type is required");
  }

  const leaderboardExpression = leaderboardExpressions[leaderboards];
  if (!leaderboardExpression) {
    throw new Error(`Invalid leaderboards type: ${leaderboards}`);
  }

  // Generate the main query filters
  const queryFilters = [];
  const queryParams = [];

  if (team_ids && team_ids.length > 0) {
    const placeholders = team_ids.map(() => "?").join(",");
    queryFilters.push(`stp.team_id IN (${placeholders})`);
    queryParams.push(...team_ids);
  }

  if (season_ids && season_ids.length > 0) {
    const placeholders = season_ids.map(() => "?").join(",");
    queryFilters.push(`m.season_id IN (${placeholders})`);
    queryParams.push(...season_ids);
  }

  if (league_ids && league_ids.length > 0) {
    const placeholders = league_ids.map(() => "?").join(",");
    queryFilters.push(`m.league_id IN (${placeholders})`);
    queryParams.push(...league_ids);
  }

  if (stages && stages.length > 0) {
    const placeholders = stages.map(() => "?").join(",");
    queryFilters.push(`m.stage IN (${placeholders})`);
    queryParams.push(...stages);
  }

  if (map_ids && map_ids.length > 0) {
    const placeholders = map_ids.map(() => "?").join(",");
    queryFilters.push(`mg.map_id IN (${placeholders})`);
    queryParams.push(...map_ids);
  }

  const whereClause =
    queryFilters.length > 0 ? `WHERE ${queryFilters.join(" AND ")}` : "";

  const query = `
    SELECT 
      sp.nickname,
      t.name as team_name,
      CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) as team_logo,
      COUNT(DISTINCT mg.id) as matches_played,
      ${leaderboardExpression} as ${leaderboards}
    FROM PlayerStats ps
    INNER JOIN SteamPlayers sp ON sp.steam_id = ps.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.season_id = m.season_id
    INNER JOIN Teams t ON t.id = stp.team_id
    ${whereClause}
    GROUP BY ps.steam_id, sp.nickname, t.name, t.team_logo
    HAVING matches_played > 0
    ORDER BY ${leaderboards} DESC
    LIMIT 5
  `;

  return runQuery(query, queryParams);
};
