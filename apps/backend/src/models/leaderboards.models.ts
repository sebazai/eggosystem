import { type LeaderboardResponse, type ParsedParams } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { generateQueryWithFilters } from "../utils/queryFilter";

const leaderboardExpressions: { [K in keyof LeaderboardResponse]: string } = {
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

/**
 * Single leaderboard, we only wish to have leaderboard for players in their primary team.
 * @param param0
 * @returns
 */
export const getLeaderboard = async <K extends keyof LeaderboardResponse>({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  leaderboards
}: ParsedParams & { leaderboards: K }) => {
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
    { column: "m.league_id", value: league_ids },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids }
  ]);

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      t.name AS team_name,
      t.team_logo AS team_logo,
      COUNT(DISTINCT mg.id) AS matches_played,
      ${leaderboardExpression} AS ${leaderboards}
    FROM SteamPlayers p
    JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    JOIN MatchGames mg ON mg.id = ps.game_id
    JOIN Matches m ON m.id = mg.match_id
    JOIN MatchTeams mt ON mt.match_id = m.id
    JOIN Teams t ON t.id = mt.team_id
    JOIN SeasonTeamPlayers stp 
      ON stp.steam_id = p.steam_id 
    AND stp.team_id = mt.team_id
    AND stp.season_id = m.season_id
    AND stp.role = 'primary'
    WHERE ${query}
    GROUP BY p.steam_id, p.nickname, t.name, t.team_logo
    HAVING COUNT(DISTINCT mg.id) > 1
    ORDER BY ${leaderboards} DESC
    LIMIT 5;
`;

  const result = await runQuery<Array<LeaderboardResponse[K]>>(
    baseQuery,
    queryParams
  );

  return { [leaderboards]: result };
};
