import {
  generateQueryWithFilters as _generateQueryWithFilters,
  generateQueryWithFilters
} from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type SteamPlayer,
  type ParsedParams,
  type PlayerDetailsBySteamId,
  type PlayerStatsResult,
  type MatchHistoryResult,
  type PlayerGameDetailsByFilters,
  type PlayerTeamDetailsByFilters,
  type PlayerStatsTable,
  type PlayerStatsForLatestSeason,
  type PlayerMapStats,
  type CasterPlayerStats
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";

export const getPlayerBySteamId = async (steam_id: string) => {
  return runQuery<
    Array<
      Pick<SteamPlayer, "nickname" | "steam_id" | "faceit_nickname"> | undefined
    >
  >(
    "SELECT nickname, steam_id, faceit_nickname FROM SteamPlayers WHERE steam_id = ?",
    [steam_id]
  );
};

export const getPlayerDetailsBySteamId = async (steam_id: string) => {
  const results = await runQuery<PlayerDetailsBySteamId[]>(
    `SELECT
      p.steam_id, 
      p.nickname,
      a.id as account_id,
      a.discord,
      a.work_email_verified,
      CASE 
          WHEN a.work_email IS NULL THEN FALSE
          WHEN a.work_email LIKE '%@%' AND a.is_work_email_personal_email != 1 THEN TRUE
          ELSE FALSE
      END AS is_valid_work_email,
      CASE 
          WHEN a.full_name LIKE '% %' THEN TRUE 
          ELSE FALSE 
      END AS is_valid_full_name
    FROM SteamPlayers p 
    JOIN Accounts a ON a.id = p.account_id
    WHERE p.steam_id = ?`,
    [steam_id]
  );

  return results.length > 0 ? results[0] : undefined;
};

export const getAllPlayerStatsByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  player_name
}: ParsedParams) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "mt.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids }
  ]);

  const whereClause = player_name
    ? `WHERE ${query} AND (p.nickname LIKE ? OR p.faceit_nickname LIKE ?)`
    : `WHERE ${query}`;

  if (player_name) {
    queryParams.push(`%${player_name}%`);
    queryParams.push(`%${player_name}%`);
  }

  const teamIdsJoin =
    (team_ids && team_ids.length > 0) ||
    (season_ids && season_ids.length === 1);

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      ${season_ids && season_ids.length === 1 ? "t.name AS team_name," : ""}
      COUNT(DISTINCT ps.game_id) as maps_played,
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
    ${
      teamIdsJoin
        ? `
        INNER JOIN MatchTeams mt ON mt.match_id = m.id 
        INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id AND stp.team_id = mt.team_id
        INNER JOIN Teams t ON t.id = stp.team_id
        `
        : ""
    }
    ${whereClause}
    GROUP BY p.steam_id, p.nickname
    ORDER BY kana_rating DESC
  `;

  return runQuery<Array<PlayerStatsTable>>(baseQuery, queryParams);
};

export const getMultiplePlayerStatsByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  player_name
}: ParsedParams) => {
  // Build filters for SeasonTeamPlayers only
  const stpFilters = [];
  if (team_ids && team_ids.length > 0) {
    stpFilters.push({ column: "stp.team_id", value: team_ids });
  }
  if (season_ids && season_ids.length > 0) {
    stpFilters.push({ column: "stp.season_id", value: season_ids });
  }

  // Build filters for match-related conditions (applied in LEFT JOIN ON clauses)
  const matchFilters = [];
  if (league_ids && league_ids.length > 0) {
    matchFilters.push({ column: "m.league_id", value: league_ids });
  }
  if (stages && stages.length > 0) {
    matchFilters.push({ column: "m.stage", value: stages });
  }

  // Build filters for map conditions (applied after MatchGames is joined)
  const mapFilters = [];
  if (map_ids && map_ids.length > 0) {
    mapFilters.push({ column: "mg.map_id", value: map_ids });
  }

  const { query: stpQuery, queryParams: stpParams } =
    generateQueryWithFilters(stpFilters);
  const { query: matchQuery, queryParams: matchParams } =
    generateQueryWithFilters(matchFilters);
  const { query: mapQuery, queryParams: mapParams } =
    generateQueryWithFilters(mapFilters);

  // Determine join types - use LEFT JOIN to include all players, then filter in WHERE
  const hasMapFilter = map_ids && map_ids.length > 0;
  const joinType = "LEFT JOIN";

  let whereClause = `WHERE ${stpQuery}`;
  const queryParams = [...stpParams];

  // Add playerName parameter (used in WHERE clause)
  if (player_name) {
    whereClause += ` AND (p.nickname LIKE ? OR p.faceit_nickname LIKE ?)`;
    queryParams.push(`%${player_name}%`);
    queryParams.push(`%${player_name}%`);
  }

  // Add match conditions to WHERE clause for LEFT JOIN
  if (matchQuery !== "1=1") {
    whereClause += ` AND ${matchQuery}`;
    queryParams.push(...matchParams);
  }

  // Add map conditions to WHERE clause for LEFT JOIN
  if (mapQuery !== "1=1") {
    whereClause += ` AND ${mapQuery}`;
    queryParams.push(...mapParams);
  }

  // Build empty conditions for JOIN clauses since we're using WHERE
  const matchConditions = "";
  const mapConditions = "";

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname, 
      ${hasMapFilter ? "COUNT(DISTINCT ps.game_id)" : "COALESCE(COUNT(DISTINCT ps.game_id), 0)"} as maps_played,
      ${hasMapFilter ? "SUM(ps.kills)" : "COALESCE(SUM(ps.kills), 0)"} as kills,
      ${hasMapFilter ? "SUM(ps.assists)" : "COALESCE(SUM(ps.assists), 0)"} as assists,
      ${hasMapFilter ? "SUM(ps.deaths)" : "COALESCE(SUM(ps.deaths), 0)"} as deaths,
      ${hasMapFilter ? "SUM(ps.flash_assists)" : "COALESCE(SUM(ps.flash_assists), 0)"} as flash_assists,
      ${hasMapFilter ? "SUM(ps.awp_kills)" : "COALESCE(SUM(ps.awp_kills), 0)"} as awp_kills,
      ${hasMapFilter ? "SUM(ps.utility_damage)" : "COALESCE(SUM(ps.utility_damage), 0)"} as utility_damage,
      ${hasMapFilter ? "SUM(ps.headshots)" : "COALESCE(SUM(ps.headshots), 0)"} as headshots,
      ${hasMapFilter ? "SUM(ps.first_kills)" : "COALESCE(SUM(ps.first_kills), 0)"} as first_kills,
      ${hasMapFilter ? "SUM(ps.first_deaths)" : "COALESCE(SUM(ps.first_deaths), 0)"} as first_deaths,
      AVG(ps.adr) as adr,
      AVG(ps.kana_rating) as kana_rating,
      AVG(ps.hs_percent) as hs_percent,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd
    FROM SeasonTeamPlayers stp
    INNER JOIN SteamPlayers p ON p.steam_id = stp.steam_id
    ${joinType} MatchTeams mt ON mt.team_id = stp.team_id
    ${joinType} Matches m ON m.id = mt.match_id AND m.season_id = stp.season_id${matchConditions}
    ${joinType} MatchGames mg ON mg.match_id = m.id${mapConditions}
    ${joinType} PlayerStats ps ON ps.game_id = mg.id AND ps.steam_id = stp.steam_id
    ${whereClause}
    GROUP BY p.steam_id, p.nickname
    ORDER BY kana_rating DESC
  `;

  return runQuery<Array<PlayerStatsTable>>(baseQuery, queryParams);
};

export const getPlayerMatchHistoryByFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "sp.steam_id", value: [steam_id] }
  ]);

  const mapFiltersPresent = map_ids && map_ids.length > 0;

  const matchHistoryQuery = `
      SELECT
        m.id AS match_id,
        CASE WHEN m.best_of = 1 THEN mg.id ELSE NULL END AS game_id,

        -- Map logic: single name or concatenated
        CASE
          WHEN m.best_of = 1 THEN MAX(mp.name)
          ELSE GROUP_CONCAT(DISTINCT mp.name ORDER BY mg.id SEPARATOR ', ')
        END AS map_name,

        m.best_of,
        m.season_id,
        s.full_name AS season_name,
        m.league_id,
        l.name AS league_name,
        m.stage,
        m.match_date,

        stp.team_id AS team_id,
        t.name AS team_name,
        t.team_logo AS team_logo,

        opp_tgs.team_id AS opponent_id,
        opp_t.name AS opponent_name,
        opp_t.team_logo AS opponent_logo,

        -- Score or Win Count
        CASE
          WHEN m.best_of = 1 THEN MAX(tgs.score)
          ELSE  ${!mapFiltersPresent ? "COUNT(CASE WHEN tgs.score > opp_tgs.score THEN 1 END)" : "MAX(tgs.score)"}
        END AS score,

        CASE
          WHEN m.best_of = 1 THEN MAX(opp_tgs.score)
          ELSE ${!mapFiltersPresent ? "COUNT(CASE WHEN opp_tgs.score > tgs.score THEN 1 END)" : "MAX(opp_tgs.score)"}
        END AS opponent_score,

        -- PlayerStats aggregates
        SUM(ps.kills) AS kills,
        SUM(ps.deaths) AS deaths,
        SUM(ps.assists) AS assists,
        SUM(ps.flash_assists) AS flash_assists,
        SUM(ps.awp_kills) AS awp_kills,
        SUM(ps.utility_damage) AS utility_damage,
        SUM(ps.headshots) AS headshots,
        SUM(ps.first_kills) AS first_kills,
        SUM(ps.first_deaths) AS first_deaths,
        ROUND(AVG(ps.kast), 2) AS kast,
        ROUND(AVG(ps.adr), 2) AS adr,
        ROUND(AVG(ps.hs_percent), 2) AS hs_percent,
        ROUND(AVG(ps.kana_rating), 2) AS kana_rating,
        ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) AS kd

      FROM SteamPlayers sp
      JOIN SeasonTeamPlayers stp ON stp.steam_id = sp.steam_id
      JOIN MatchTeams mt ON mt.team_id = stp.team_id AND mt.season_id = stp.season_id
      JOIN Matches m ON m.id = mt.match_id
      JOIN MatchGames mg ON mg.match_id = m.id
      JOIN Maps mp ON mp.id = mg.map_id
      JOIN TeamGameScores tgs ON tgs.team_id = stp.team_id AND tgs.game_id = mg.id
      JOIN Teams t ON t.id = tgs.team_id
      JOIN TeamGameScores opp_tgs ON opp_tgs.game_id = mg.id AND opp_tgs.team_id != tgs.team_id
      JOIN Teams opp_t ON opp_t.id = opp_tgs.team_id
      LEFT JOIN PlayerStats ps ON ps.steam_id = sp.steam_id AND ps.game_id = mg.id
      JOIN Seasons s ON s.id = m.season_id
      JOIN Leagues l ON l.id = m.league_id

      WHERE ${query}

      GROUP BY
        ${!mapFiltersPresent ? "m.id," : ""}
        CASE WHEN m.best_of = 1 THEN mg.id ELSE NULL END,
        ${!mapFiltersPresent ? "m.best_of," : ""}
        m.season_id,
        s.name,
        m.league_id,
        l.name,
        m.stage,
        m.match_date,
        stp.team_id,
        t.name,
        t.team_logo,
        opp_tgs.team_id,
        opp_t.name,
        opp_t.team_logo;
  `;

  const matchHistory = await runQuery<MatchHistoryResult[]>(
    matchHistoryQuery,
    queryParams
  );
  return matchHistory.filter((mh) => mh.kills && mh.deaths);
};

export const getPlayerTeamDetailsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "s.id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      t.name AS team_name,
      t.id AS team_id,
      t.team_logo
    FROM SteamPlayers p
    JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id
    JOIN Seasons s ON s.id = stp.season_id
    JOIN SeasonLeagueTeams slt ON slt.season_id = s.id AND stp.team_id = slt.team_id
    JOIN Leagues l ON l.id = slt.league_id
    JOIN Teams t ON t.id = slt.team_id
    WHERE ${query}
    GROUP BY p.steam_id, p.nickname, team_name;
  `;

  const playerTeamDetails = await runQuery<PlayerTeamDetailsByFilters[]>(
    baseQuery,
    queryParams
  );

  return playerTeamDetails;
};

/**
 * There are no draws, therefore if failed to parse demo in a best_of != 1, we will make the draws
 * be x wins and x losses. Therefore wins + losses == matches_played should be ok.
 * @param steam_id
 * @param param1
 * @returns
 */
export const getPlayerGameDetailsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const baseQuery = `
    WITH PlayerMatches AS (
      SELECT 
        m.id AS match_id,
        m.best_of,
        slt.team_id AS player_team_id,
        opp_tgs.team_id AS opponent_team_id,
        mg.id AS game_id,
        CASE 
          WHEN tgs.score > opp_tgs.score THEN 1 
          ELSE 0 
        END AS game_win
      FROM SteamPlayers p
      JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id
      JOIN SeasonLeagueTeams slt ON slt.season_id = stp.season_id AND stp.team_id = slt.team_id
      JOIN MatchTeams mt ON mt.team_id = slt.team_id AND mt.season_id = slt.season_id AND mt.league_id = slt.league_id
      JOIN Matches m ON m.id = mt.match_id
      JOIN MatchGames mg ON mg.match_id = m.id
      JOIN PlayerStats ps ON ps.steam_id = p.steam_id AND ps.game_id = mg.id
      JOIN TeamGameScores tgs ON tgs.match_id = m.id AND tgs.team_id = slt.team_id AND mg.id = tgs.game_id
      JOIN TeamGameScores opp_tgs ON opp_tgs.match_id = m.id AND opp_tgs.team_id != slt.team_id AND mg.id = opp_tgs.game_id
      WHERE ${query}
    ),
    GameWinsPerMatch AS (
      SELECT
        match_id,
        player_team_id,
        opponent_team_id,
        best_of,
        SUM(game_win) AS player_game_wins,
        COUNT(*) - SUM(game_win) AS opponent_game_wins
      FROM PlayerMatches
      GROUP BY match_id, player_team_id, opponent_team_id, best_of
    )
    SELECT
      COUNT(*) AS matches_played,
      SUM(
        CASE 
          WHEN player_game_wins > opponent_game_wins THEN 1 
          WHEN best_of != 1 AND player_game_wins = opponent_game_wins THEN player_game_wins
          ELSE 0 
        END
      ) AS wins,
      SUM(
        CASE 
          WHEN player_game_wins < opponent_game_wins THEN 1
          WHEN best_of != 1 AND player_game_wins = opponent_game_wins THEN opponent_game_wins
          ELSE 0 
        END
      ) AS losses
    FROM GameWinsPerMatch;
  `;

  const playerDetails = await runQuery<
    Array<PlayerGameDetailsByFilters | undefined>
  >(baseQuery, queryParams);

  return playerDetails;
};

export const getPlayerStatsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "mt.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const teamIdsJoin = team_ids && team_ids.length > 0;

  const statsQuery = `
    WITH player_games AS (
      SELECT DISTINCT p.steam_id, p.nickname, mg.id as game_id
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      ${teamIdsJoin ? "INNER JOIN MatchTeams mt ON mt.match_id = m.id" : ""}
      WHERE ${query}
    ),
    player_stats AS (
      SELECT 
        pg.steam_id,
        pg.nickname,
        COUNT(DISTINCT pg.game_id) as maps_played,
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
        SUM(ps.kills_2) as multikill_2k,
        SUM(ps.kills_3) as multikill_3k,
        SUM(ps.kills_4) as multikill_4k,
        SUM(ps.kills_5) as multikill_5k,
        SUM(ps.kills_t) as kills_t,
        SUM(ps.kills_ct) as kills_ct,
        SUM(ps.trades) as trades,
        SUM(ps.trade_attempts) as trade_attempts,
        SUM(ps.trade_opportunities) as trade_opportunities,
        COALESCE(ROUND(SUM(ps.good_strafing_shots) / NULLIF(SUM(ps.total_strafing_shots), 0) * 100, 1), 0) as counter_strafing_percentage,
        SUM(ps.first_kills_ct) as first_kills_ct,
        SUM(ps.first_deaths_ct) as first_deaths_ct,
        SUM(ps.first_kills_t) as first_kills_t,
        SUM(ps.first_deaths_t) as first_deaths_t,
        ROUND(SUM(ps.total_ef_duration) / NULLIF(SUM(ps.flashes_thrown), 0), 1) as avg_enemy_flash_duration,
        ROUND(SUM(ps.total_mf_duration) / NULLIF(SUM(ps.flashes_thrown), 0), 1) as avg_teammate_flash_duration,
        AVG(ps.crosshair_placement) as crosshair_placement,
        AVG(ps.ttd) as time_to_damage
      FROM player_games pg
      INNER JOIN PlayerStats ps ON ps.steam_id = pg.steam_id AND ps.game_id = pg.game_id
      GROUP BY pg.steam_id, pg.nickname
    ),
    player_rounds AS (
      SELECT 
        pg.steam_id,
        COUNT(DISTINCT mrs.id) as rounds_played
      FROM player_games pg
      INNER JOIN MapRoundStats mrs ON mrs.game_id = pg.game_id
      GROUP BY pg.steam_id
    )
    SELECT 
      ps.*,
      pr.rounds_played
    FROM player_stats ps
    INNER JOIN player_rounds pr ON pr.steam_id = ps.steam_id
  `;

  const [playerStats] = await runQuery<Array<PlayerStatsResult | undefined>>(
    statsQuery,
    queryParams
  );

  return playerStats;
};

export const getPlayerStatsWithFiltersForCasters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "mt.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const teamIdsJoin = team_ids && team_ids.length > 0;

  const statsQuery = `
    WITH player_games AS (
      SELECT DISTINCT p.steam_id, p.nickname, mg.id as game_id, p.faceit_nickname
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      ${teamIdsJoin ? "INNER JOIN MatchTeams mt ON mt.match_id = m.id" : ""}
      WHERE ${query}
    ),
    player_stats AS (
      SELECT 
        pg.steam_id,
        pg.nickname,
        pg.faceit_nickname,
        COUNT(DISTINCT pg.game_id) as maps_played,
        SUM(ps.kills) as kills,
        SUM(ps.kills_t) as kills_t,
        SUM(ps.kills_ct) as kills_ct,
        SUM(ps.deaths) as deaths,
        SUM(ps.deaths_t) as deaths_t,
        SUM(ps.deaths_ct) as deaths_ct,
        SUM(ps.assists) as assists,
        SUM(ps.assists_ct) as assists_ct,
        SUM(ps.assists_t) as assists_t,
        SUM(ps.mvps) as mvps,
        SUM(ps.total_damage) as total_damage,
        SUM(ps.total_damage_t) as total_damage_t,
        SUM(ps.total_damage_ct) as total_damage_ct,
        SUM(ps.headshots) as headshots,
        SUM(ps.flash_assists) as flash_assists,
        SUM(ps.flash_assists_t) as flash_assists_t,
        SUM(ps.flash_assists_ct) as flash_assists_ct,
        AVG(ps.adr) as avg_adr,
        AVG(ps.adr_t) as avg_adr_t,
        AVG(ps.adr_ct) as avg_adr_ct,
        AVG(ps.hs_percent) as avg_hs_percent,
        SUM(ps.plants) as plants,
        SUM(ps.explodes) as explodes,
        SUM(ps.defuses) as defuses,
        SUM(ps.kills_1) as kills_1,
        SUM(ps.kills_2) as kills_2,
        SUM(ps.kills_3) as kills_3,
        SUM(ps.kills_4) as kills_4,
        SUM(ps.kills_5) as kills_5,
        SUM(ps.trades) as trades,
        SUM(ps.trades_t) as trades_t,
        SUM(ps.trades_ct) as trades_ct,
        SUM(ps.traded) as traded,
        SUM(ps.traded_t) as traded_t,
        SUM(ps.traded_ct) as traded_ct,
        SUM(ps.clutches) as clutches,
        SUM(ps.clutches_won) as clutches_won,
        SUM(ps.awp_kills) as awp_kills,
        SUM(ps.utility_damage) as utility_damage,
        SUM(ps.utility_damage_t) as utility_damage_t,
        SUM(ps.utility_damage_ct) as utility_damage_ct,
        SUM(ps.molotov_damage) as molotov_damage,
        SUM(ps.molotov_damage_t) as molotov_damage_t,
        SUM(ps.molotov_damage_ct) as molotov_damage_ct,
        SUM(ps.he_damage) as he_damage,
        SUM(ps.he_damage_t) as he_damage_t,
        SUM(ps.he_damage_ct) as he_damage_ct,
        SUM(ps.trade_attempts) as trade_attempts,
        SUM(ps.trade_attempts_t) as trade_attempts_t,
        SUM(ps.trade_attempts_ct) as trade_attempts_ct,
        SUM(ps.kills_through_walls) as kills_through_walls,
        SUM(ps.first_death_trade_attempts) as first_death_trade_attempts,
        SUM(ps.first_death_trade_attempts_t) as first_death_trade_attempts_t,
        SUM(ps.first_death_trade_attempts_ct) as first_death_trade_attempts_ct,
        SUM(ps.first_death_trade_opportunities) as first_death_trade_opportunities,
        SUM(ps.first_death_trade_opportunities_t) as first_death_trade_opportunities_t,
        SUM(ps.first_death_trade_opportunities_ct) as first_death_trade_opportunities_ct,
        SUM(ps.trade_opportunities) as trade_opportunities,
        SUM(ps.trade_opportunities_t) as trade_opportunities_t,
        SUM(ps.trade_opportunities_ct) as trade_opportunities_ct,
        SUM(ps.flashes_thrown) as flashes_thrown,
        SUM(ps.flashes_thrown_t) as flashes_thrown_t,
        SUM(ps.flashes_thrown_ct) as flashes_thrown_ct,
        SUM(ps.enemies_flashed) as enemies_flashed,
        SUM(ps.enemies_flashed_t) as enemies_flashed_t,
        SUM(ps.enemies_flashed_ct) as enemies_flashed_ct,
        SUM(ps.mates_flashed) as mates_flashed,
        SUM(ps.mates_flashed_t) as mates_flashed_t,
        SUM(ps.mates_flashed_ct) as mates_flashed_ct,
        SUM(ps.self_flashes) as self_flashes,
        SUM(ps.total_mf_duration) as total_mf_duration,
        SUM(ps.total_mf_duration_t) as total_mf_duration_t,
        SUM(ps.total_mf_duration_ct) as total_mf_duration_ct,
        SUM(ps.total_ef_duration) as total_ef_duration,
        SUM(ps.total_ef_duration_t) as total_ef_duration_t,
        SUM(ps.total_ef_duration_ct) as total_ef_duration_ct,
        SUM(ps.one_v_one_won) as one_v_one_won,
        SUM(ps.one_v_one_won_t) as one_v_one_won_t,
        SUM(ps.one_v_one_won_ct) as one_v_one_won_ct,
        SUM(ps.one_v_one_lost) as one_v_one_lost,
        SUM(ps.one_v_one_lost_t) as one_v_one_lost_t,
        SUM(ps.one_v_one_lost_ct) as one_v_one_lost_ct,
        SUM(ps.first_kills) as first_kills,
        SUM(ps.first_kills_t) as first_kills_t,
        SUM(ps.first_kills_ct) as first_kills_ct,
        SUM(ps.first_deaths) as first_deaths,
        SUM(ps.first_deaths_t) as first_deaths_t,
        SUM(ps.first_deaths_ct) as first_deaths_ct,
        SUM(ps.first_death_trades) as first_death_trades,
        SUM(ps.first_death_trades_t) as first_death_trades_t,
        SUM(ps.first_death_trades_ct) as first_death_trades_ct,
        SUM(ps.first_death_traded) as first_death_traded,
        SUM(ps.first_death_traded_t) as first_death_traded_t,
        SUM(ps.first_death_traded_ct) as first_death_traded_ct,
        AVG(ps.kast) as avg_kast,
        ROUND(AVG(ps.kana_rating), 2) as avg_kana_rating,
        AVG(ps.ttd) as avg_ttd,
        AVG(ps.ttf) as avg_ttf,
        ROUND(AVG(ps.rws), 2) as avg_rws,
        AVG(ps.crosshair_placement) as avg_crosshair_placement,
        SUM(ps.shots) as shots,
        SUM(ps.shots_hit) as shots_hit,
        SUM(ps.total_strafing_shots) as total_strafing_shots,
        SUM(ps.good_strafing_shots) as good_strafing_shots
      FROM player_games pg
      INNER JOIN PlayerStats ps ON ps.steam_id = pg.steam_id AND ps.game_id = pg.game_id
      GROUP BY pg.steam_id, pg.nickname
    ),
    player_rounds AS (
      SELECT 
        pg.steam_id,
        COUNT(DISTINCT mrs.id) as rounds_played
      FROM player_games pg
      INNER JOIN MapRoundStats mrs ON mrs.game_id = pg.game_id
      GROUP BY pg.steam_id
    )
    SELECT 
      ps.*,
      pr.rounds_played
    FROM player_stats ps
    INNER JOIN player_rounds pr ON pr.steam_id = ps.steam_id
  `;

  const [playerStats] = await runQuery<Array<CasterPlayerStats | undefined>>(
    statsQuery,
    queryParams
  );

  return playerStats;
};

export const getPlayerStatsForLatestSeason = async (steam_id: string) => {
  const query = `
    SELECT 
      p.steam_id,
      p.nickname,
      m.season_id as latest_season_id,
      ROUND(AVG(ps.kana_rating), 2) as avg_kana_rating,
      COALESCE(ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2), 0) as kpd,
      ROUND(AVG(ps.adr), 1) as adr,
      sl.tier as level
    FROM SteamPlayers p
    INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN SeasonLeagues sl ON sl.season_id = m.season_id AND sl.league_id = m.league_id
    WHERE p.steam_id = ? 
      AND m.season_id = (
        SELECT MAX(m2.season_id)
        FROM PlayerStats ps2
        INNER JOIN MatchGames mg2 ON mg2.id = ps2.game_id
        INNER JOIN Matches m2 ON m2.id = mg2.match_id
        WHERE ps2.steam_id = ?
      )
    GROUP BY p.steam_id, p.nickname, m.season_id, sl.tier
  `;

  const [result] = await runQuery<
    Array<PlayerStatsForLatestSeason | undefined>
  >(query, [steam_id, steam_id]);

  return result || null;
};

export const getPlayerOldKanaElo = async (steam_id: string) => {
  // Find the most recent season where player has both kana_rating and kana_elo data
  const query = `
    SELECT 
      ps.steam_id,
      m.season_id as last_played_season_id,
      spr.kana_elo
    FROM PlayerStats ps 
    JOIN MatchGames mg ON ps.game_id = mg.id 
    LEFT JOIN Matches m ON m.id = mg.match_id 
    LEFT JOIN SeasonPlayerRanks spr ON spr.season_id = m.season_id AND spr.steam_id = ps.steam_id 
    WHERE ps.steam_id = ? 
      AND spr.kana_elo IS NOT NULL 
      AND ps.kana_rating IS NOT NULL 
    GROUP BY m.season_id 
    ORDER BY m.season_id DESC 
    LIMIT 1
  `;

  const result = await runQuery<
    Array<{
      steam_id: string;
      last_played_season_id: number;
      kana_elo: number;
    }>
  >(query, [steam_id]);

  // If no data found with both kana_rating and kana_elo, return null
  return result.length > 0 ? result[0] : null;
};

export const getPlayerMapStatsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  // Fetch all maps once to get both IDs and names
  const allMaps = await runQuery<Array<{ id: number; name: string }>>(
    "SELECT id, name FROM Maps"
  );
  const mapsRecord = allMaps.reduce(
    (acc, map) => {
      acc[map.id] = map.name;
      return acc;
    },
    {} as Record<number, string>
  );

  // Determine which maps to process
  const mapsToProcess =
    map_ids && map_ids.length > 0 ? map_ids : allMaps.map((m) => m.id);

  // Create all the promises for parallel execution
  const mapStatPromises = mapsToProcess.map(async (mapId) => {
    // Create filter params for this specific map
    const mapFilterParams = {
      season_ids,
      league_ids,
      team_ids,
      stages,
      map_ids: [mapId]
    };

    // Get both player stats and game details in parallel
    const [playerStats, gameDetails] = await Promise.all([
      getPlayerStatsWithFilters(steam_id, mapFilterParams),
      getPlayerGameDetailsWithFilters(steam_id, mapFilterParams)
    ]);

    if (playerStats && gameDetails && gameDetails.length > 0) {
      const details = gameDetails[0];

      if (!details) return null;

      const mapStats: PlayerMapStats = {
        ...playerStats,
        map_id: mapId,
        map_name: mapsRecord[mapId] || `unknown_map_${mapId}`,
        wins: details.wins,
        losses: details.losses,
        win_percentage:
          details.matches_played > 0
            ? (details.wins / details.matches_played) * 100
            : 0,
        kills_t: playerStats?.kills_t || 0,
        kills_ct: playerStats?.kills_ct || 0,
        trades: playerStats?.trades || 0,
        trade_attempts: playerStats?.trade_attempts || 0,
        trade_opportunities: playerStats?.trade_opportunities || 0,
        counter_strafing_percentage:
          playerStats?.counter_strafing_percentage || 0,
        first_kills_ct: playerStats?.first_kills_ct || 0,
        first_deaths_ct: playerStats?.first_deaths_ct || 0,
        first_kills_t: playerStats?.first_kills_t || 0,
        first_deaths_t: playerStats?.first_deaths_t || 0,
        avg_enemy_flash_duration: playerStats?.avg_enemy_flash_duration || 0,
        avg_teammate_flash_duration:
          playerStats?.avg_teammate_flash_duration || 0,
        crosshair_placement: playerStats?.crosshair_placement || 0,
        time_to_damage: playerStats?.time_to_damage || 0
      };

      return mapStats;
    }

    return null;
  });

  // Wait for all promises to resolve and filter out null results
  const results = await Promise.all(mapStatPromises);
  return results.filter(Boolean) as PlayerMapStats[];
};

export const setPlayerKanaElo = async (
  steam_id: string,
  kana_elo: number,
  calculus: string,
  season_id: number,
  offered_elo?: number,
  connection?: PoolConnection
): Promise<boolean> => {
  // If offered_elo is provided, update both kana_elo and offered_elo
  if (offered_elo !== undefined) {
    const query = `
      UPDATE SeasonPlayerRanks 
      SET calculus = ?, kana_elo = ?, offered_elo = ? 
      WHERE season_id = ? AND steam_id = ?
    `;

    const result = await runQuery<{ affectedRows: number }>(
      query,
      [calculus, kana_elo, offered_elo, season_id, steam_id],
      connection
    );

    return result.affectedRows > 0;
  } else {
    // Backward compatibility - just update kana_elo without offered_elo
    const query = `
      UPDATE SeasonPlayerRanks 
      SET calculus = ?, kana_elo = ? 
      WHERE season_id = ? AND steam_id = ?
    `;

    const result = await runQuery<{ affectedRows: number }>(
      query,
      [calculus, kana_elo, season_id, steam_id],
      connection
    );

    return result.affectedRows > 0;
  }
};
