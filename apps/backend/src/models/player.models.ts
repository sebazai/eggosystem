import { generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type ParsedParams,
  type PlayerDetailsBySteamId
} from "@eggosystem/types";

const leaderboardExpressions: { [key: string]: string } = {
  Kills: "sum(ps.kills)",
  Assists: "sum(ps.assists)",
  Deaths: "sum(ps.deaths)",
  KAST: "avg(ps.kast)",
  KD: "sum(ps.kills) - sum(ps.deaths)",
  flashAssists: "sum(ps.flash_assists)"
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
          WHEN a.full_name REGEXP '.+\\s.+' THEN TRUE 
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
  leaderboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ParsedParams): Promise<any[]> => {
  if (!leaderboard) {
    throw new Error("Leaderboard type is required");
  }

  const leaderboardExpression = leaderboardExpressions[leaderboard];
  if (!leaderboardExpression) {
    throw new Error(`Invalid leaderboard type: ${leaderboard}`);
  }

  const { query: subQueryWithFilters, queryParams: subQueryParams } =
    generateQueryWithFilters([
      { column: "p.team_id", value: team_ids },
      { column: "l.season_id", value: season_ids },
      { column: "l.id", value: league_ids }
    ]);

  const subQuery = `
    SELECT steam_id, p.nickname, team_id
    FROM SteamPlayers p
    JOIN Teams t ON t.id = p.team_id
    JOIN leagues l ON l.id = t.league_id
    WHERE 1=1
    ${subQueryWithFilters}
  `;

  const { query: baseQueryFilters, queryParams: additionalParams } =
    generateQueryWithFilters([
      { column: "p.team_id", value: team_ids },
      { column: "l.season_id", value: season_ids },
      { column: "l.id", value: league_ids },
      { column: "m.stage", value: stages },
      { column: "mmp.map_id", value: map_ids }
    ]);

  const baseQuery = `
    SELECT p.nickname, t.name as team_name, ${leaderboardExpression} as ${leaderboard}
    FROM PlayerStats ps
    LEFT JOIN (${subQuery}) p ON p.steam_id = ps.steam_id
    LEFT JOIN Matches m ON m.id = ps.match_id
    LEFT JOIN Leagues l ON m.league_id = l.id
    LEFT JOIN Teams t ON p.team_id = t.id
    WHERE 1=1
    ${baseQueryFilters}
  `;

  const query = baseQuery.concat(
    ` GROUP BY ps.steam_id ORDER BY ${leaderboard} DESC LIMIT 5`
  );
  const queryParams = [...subQueryParams, ...additionalParams]; // Combine subquery params with main query params

  return runQuery(query, queryParams);
};
