import type { ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

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

// Function to get a single leaderboard
export const getLeaderboard = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  leaderboards
}: ParsedParams): Promise<unknown[]> => {
  if (!leaderboards) {
    throw new Error("Leaderboards type is required");
  }

  const leaderboardExpression = leaderboardExpressions[leaderboards];
  if (!leaderboardExpression) {
    throw new Error(`Invalid leaderboards type: ${leaderboards}`);
  }

  const { query, queryParams } = generateQueryWithFilters([
    { column: "stp.team_id", value: team_ids },
    { column: "m.season_id", value: season_ids },
    { column: "l.id", value: league_ids },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids }
  ]);

  // Use INNER JOIN for team-related tables when filtering by team_id,
  // otherwise use LEFT JOIN to include all players
  const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";

  const baseQuery = `
    SELECT 
      sp.steam_id,
      sp.nickname,
      t.name as team_name,
      CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) as team_logo,
      COUNT(DISTINCT mg.id) as matches_played,
      ${leaderboardExpression} as ${leaderboards}
    FROM PlayerStats ps
    INNER JOIN SteamPlayers sp ON sp.steam_id = ps.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Leagues l ON m.league_id = l.id
    ${teamJoinType} JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.season_id = m.season_id
    ${teamJoinType} JOIN Teams t ON t.id = stp.team_id
    WHERE ${query}
    GROUP BY sp.steam_id, sp.nickname, t.name, t.team_logo
    HAVING matches_played > 1
    ORDER BY ${leaderboards} DESC
    LIMIT 5
  `;

  return runQuery(baseQuery, queryParams);
};

// Get available leaderboard types
export const getLeaderboardTypes = (): string[] => {
  return Object.keys(leaderboardExpressions);
};
