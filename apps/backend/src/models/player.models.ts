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
  type PlayerMapStats
} from "@eggosystem/types";

export const getPlayerBySteamId = async (steam_id: string) => {
  return runQuery<Array<SteamPlayer | undefined>>(
    "SELECT nickname, steam_id FROM SteamPlayers WHERE steam_id = ?",
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

export const getMultiplePlayerStatsByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  playerName
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

  const whereClause = playerName
    ? `WHERE ${query} AND p.nickname LIKE ?`
    : `WHERE ${query}`;

  if (playerName) {
    queryParams.push(`%${playerName}%`);
  }

  const teamIdsJoin = team_ids && team_ids.length > 0;

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname, 
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
        INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id AND stp.team_id = mt.team_id`
        : ""
    }
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

  // Get player's aggregate statistics
  const statsQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      COUNT(DISTINCT mg.id) as maps_played,
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
      SUM(CASE WHEN ps.kills = 2 THEN 1 ELSE 0 END) as multikill_2k,
      SUM(CASE WHEN ps.kills = 3 THEN 1 ELSE 0 END) as multikill_3k,
      SUM(CASE WHEN ps.kills = 4 THEN 1 ELSE 0 END) as multikill_4k,
      SUM(CASE WHEN ps.kills = 5 THEN 1 ELSE 0 END) as multikill_5k,
      COUNT(DISTINCT ps.id) as rounds_played,
      SUM(ps.kills_t) as kills_t,
      SUM(ps.kills_ct) as kills_ct
    FROM SteamPlayers p
    INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    ${teamIdsJoin ? "INNER JOIN MatchTeams mt ON mt.match_id = m.id" : ""}
    WHERE ${query}
    GROUP BY p.steam_id, p.nickname
  `;

  const [playerStats] = await runQuery<Array<PlayerStatsResult | undefined>>(
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
        kills_t: playerStats.kills_t || 0,
        kills_ct: playerStats.kills_ct || 0
      };

      return mapStats;
    }

    return null;
  });

  // Wait for all promises to resolve and filter out null results
  const results = await Promise.all(mapStatPromises);
  return results.filter(Boolean) as PlayerMapStats[];
};
