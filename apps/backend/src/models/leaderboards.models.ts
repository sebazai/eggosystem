import type { ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

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

// Get available leaderboard types
export const getLeaderboardTypes = (): string[] => {
  return Object.keys(leaderboardExpressions);
};
