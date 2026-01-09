import {
  generateQueryWithFilters as _generateQueryWithFilters,
  generateQueryWithFilters
} from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { validateSteamId } from "../utils/steam-id-validator";
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
  type AllPlayerStats
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";

export const getPlayerBySteamId = async (steam_id: string) => {
  return runQuery<
    Array<
      | Pick<
          SteamPlayer,
          "nickname" | "steam_id" | "faceit_nickname" | "avatar"
        >
      | undefined
    >
  >(
    "SELECT nickname, steam_id, faceit_nickname, avatar FROM SteamPlayers WHERE steam_id = ?",
    [steam_id]
  );
};

/**
 * Search for a player by nickname, provider_username, or faceit_nickname.
 * Returns the steam_id if found, null otherwise.
 * @param searchTerm The nickname, provider_username, or faceit_nickname to search for
 * @returns The steam_id as a string if found, null otherwise
 */
export const getPlayerSteamIdByNickname = async (
  searchTerm: string
): Promise<string | null> => {
  const results = await runQuery<Array<{ steam_id: string }>>(
    `SELECT DISTINCT sp.steam_id
     FROM SteamPlayers sp
     LEFT JOIN Accounts a ON a.id = sp.account_id
     LEFT JOIN LinkedAccounts la ON la.account_id = a.id AND la.provider = 'steam'
     WHERE sp.nickname = ? 
        OR sp.faceit_nickname = ?
        OR la.provider_username = ?
     LIMIT 1`,
    [searchTerm, searchTerm, searchTerm]
  );

  if (results.length > 0 && results[0]) {
    return String(results[0].steam_id);
  }

  return null;
};

export const getPlayerDetailsBySteamId = async (
  steam_id: string,
  connection?: PoolConnection
) => {
  const results = await runQuery<PlayerDetailsBySteamId[]>(
    `SELECT
      p.steam_id, 
      p.nickname,
      a.id as account_id,
      CASE WHEN la_discord.provider_id IS NOT NULL AND la_discord.provider_id NOT LIKE 'fake_%' THEN TRUE ELSE FALSE END as discord_linked,
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
    LEFT JOIN LinkedAccounts la_discord ON 
      la_discord.account_id = a.id AND 
      la_discord.provider = 'discord' AND
      la_discord.provider_id IS NOT NULL AND
      la_discord.provider_id NOT LIKE 'fake_%'
    WHERE p.steam_id = ?`,
    [steam_id],
    connection
  );

  return results.length > 0 ? results[0] : undefined;
};

/**
 * Prepare a player for signup by creating/updating account and SteamPlayers profile
 * with fake data. Sets work_email_verified to true but does NOT set UserPolicyAcceptance.
 * @param steamId Steam ID of the player (must be valid SteamID64 format)
 * @returns Account ID, Steam ID, and whether changes were made
 * @throws {BadRequestError} If the Steam ID format is invalid
 */
export const preparePlayerForSignup = async (
  steamId: string
): Promise<{ account_id: number; steam_id: string; changes_made: boolean }> => {
  // Validate Steam ID format (defense in depth)
  validateSteamId(steamId, "Invalid Steam ID format");

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    // Check if SteamPlayers exists
    const [existingPlayer] = await runQuery<SteamPlayer[]>(
      "SELECT * FROM SteamPlayers WHERE steam_id = ?",
      [steamId],
      connection
    );

    if (!existingPlayer) {
      // Create new account, SteamPlayers, and LinkedAccounts
      const fakeNickname = `Player_${steamId.slice(-8)}`;
      const fakeFullName = `Fake Name ${steamId.slice(-4)}`;
      const fakeWorkEmail = `fake_${steamId.slice(-8)}@example.com`;

      const accountResult = await runQuery<{ insertId: number }>(
        "INSERT INTO Accounts (full_name, work_email, work_email_verified, is_work_email_personal_email) VALUES (?, ?, ?, ?)",
        [fakeFullName, fakeWorkEmail, true, false],
        connection
      );

      if (!accountResult.insertId) {
        throw new Error("Failed to create account: insertId is missing");
      }

      try {
        await runQuery(
          "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (?, ?, ?)",
          [steamId, fakeNickname, accountResult.insertId],
          connection
        );

        await runQuery(
          "INSERT INTO LinkedAccounts (account_id, provider_id, provider) VALUES (?, ?, ?)",
          [accountResult.insertId, steamId, "steam"],
          connection
        );
      } catch (insertError: unknown) {
        // Handle race condition: if another request created the player simultaneously
        if (
          insertError &&
          typeof insertError === "object" &&
          "code" in insertError &&
          (insertError as { code?: string }).code === "ER_DUP_ENTRY"
        ) {
          await connection.rollback();
          connection.release();
          // Retry: check if player now exists and handle as update
          // This is safe because: 1) We rolled back, so no partial state
          // 2) The other request will have committed, so player exists
          // 3) Retry will go to the "else" branch and update the player
          return await preparePlayerForSignup(steamId);
        }
        throw insertError;
      }

      await connection.commit();
      return {
        account_id: accountResult.insertId,
        steam_id: steamId,
        changes_made: true
      };
    } else {
      // Update existing player - ensure account has required fields
      const [accountRaw] = await runQuery<
        Array<{
          id: number;
          full_name: string | null;
          work_email: string | null;
          work_email_verified: number | boolean | null; // tinyint(1) returns as number
          is_work_email_personal_email: number | null;
        }>
      >(
        "SELECT id, full_name, work_email, work_email_verified, is_work_email_personal_email FROM Accounts WHERE id = ?",
        [existingPlayer.account_id],
        connection
      );

      if (!accountRaw) {
        throw new Error(`Account not found for steam_id ${steamId}`);
      }

      // Convert work_email_verified to boolean (tinyint(1) returns as number 0 or 1)
      // Also normalize is_work_email_personal_email to number (may return as string from some queries)
      const account = {
        ...accountRaw,
        work_email_verified: Boolean(accountRaw.work_email_verified),
        is_work_email_personal_email:
          accountRaw.is_work_email_personal_email !== null
            ? Number(accountRaw.is_work_email_personal_email)
            : null
      };

      // Generate fake data if missing or invalid
      const fakeNickname =
        existingPlayer.nickname || `Player_${steamId.slice(-8)}`;
      const fullName =
        account.full_name && account.full_name.includes(" ")
          ? account.full_name
          : `Fake Name ${steamId.slice(-4)}`;

      const isWorkEmailValid =
        account.work_email !== null &&
        account.work_email.includes("@") &&
        account.is_work_email_personal_email !== 1 &&
        account.work_email_verified;

      const workEmail =
        isWorkEmailValid && account.work_email !== null
          ? account.work_email
          : `fake_${steamId.slice(-8)}@example.com`;

      // Check if any changes are needed
      const nicknameChanged = existingPlayer.nickname !== fakeNickname;
      const fullNameChanged = account.full_name !== fullName;
      // Normalize email comparison: trim whitespace and handle null/empty string cases
      // fakeWorkEmail is never null because if account.work_email is null, we use the fake email
      const normalizedWorkEmail = account.work_email?.trim() || null;
      const normalizedFakeWorkEmail = (workEmail ?? "").trim();
      const workEmailChanged = normalizedWorkEmail !== normalizedFakeWorkEmail;
      const workEmailVerifiedChanged = account.work_email_verified !== true;
      // is_work_email_personal_email: null or 0 means "not personal", 1 means "personal"
      // We want to set it to false (0), so if it's null or 0, no change needed
      const isPersonalEmailChanged =
        account.is_work_email_personal_email !== null &&
        account.is_work_email_personal_email !== 0;

      const changesMade =
        nicknameChanged ||
        fullNameChanged ||
        workEmailChanged ||
        workEmailVerifiedChanged ||
        isPersonalEmailChanged;

      // Update SteamPlayers nickname if needed
      if (nicknameChanged) {
        await runQuery(
          "UPDATE SteamPlayers SET nickname = ? WHERE steam_id = ?",
          [fakeNickname, steamId],
          connection
        );
      }

      // Update Account to ensure all required fields are set
      // Only update if changes are needed
      if (changesMade) {
        await runQuery(
          `UPDATE Accounts 
            SET full_name = ?, 
                work_email = ?, 
                work_email_verified = ?, 
                is_work_email_personal_email = ?,
                work_email_token = ?,
                work_email_token_expires_at = ?
            WHERE id = ?`,
          [fullName, workEmail, true, false, null, null, account.id],
          connection
        );
      }

      await connection.commit();
      return {
        account_id: account.id,
        steam_id: steamId,
        changes_made: changesMade
      };
    }
  } catch (error: unknown) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update SteamPlayers table with FaceIT data (nickname and player_id)
 */
export const updateSteamPlayerFaceitData = async (
  steamId: string,
  faceitNickname: string,
  faceitId: string,
  connection?: PoolConnection
): Promise<void> => {
  const query = `
    UPDATE SteamPlayers 
    SET faceit_nickname = ?, faceit_id = ?
    WHERE steam_id = ?
  `;

  // Ensure steamId is a string to match database format
  const steamIdString = String(steamId);

  await runQuery(query, [faceitNickname, faceitId, steamIdString], connection);
};

export const getAllPlayerStatsByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
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
    }
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
      COUNT(DISTINCT ps.match_game_id) as maps_played,
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
    INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
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
      p.avatar,
      ${hasMapFilter ? "COUNT(DISTINCT ps.match_game_id)" : "COALESCE(COUNT(DISTINCT ps.match_game_id), 0)"} as maps_played,
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
    ${joinType} PlayerStats ps ON ps.match_game_id = mg.id AND ps.steam_id = stp.steam_id
    ${whereClause}
    GROUP BY p.steam_id, p.nickname, p.avatar
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

  const matchHistoryQuery = `
      SELECT
        m.id AS match_id,
        CASE WHEN m.best_of = 1 THEN mg.id ELSE NULL END AS match_game_id,

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
          ELSE COUNT(CASE WHEN tgs.score > opp_tgs.score THEN 1 END)
        END AS score,

        CASE
          WHEN m.best_of = 1 THEN MAX(opp_tgs.score)
          ELSE COUNT(CASE WHEN opp_tgs.score > tgs.score THEN 1 END)
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
      JOIN TeamGameScores tgs ON tgs.team_id = stp.team_id AND tgs.match_game_id = mg.id
      JOIN Teams t ON t.id = tgs.team_id
      JOIN TeamGameScores opp_tgs ON opp_tgs.match_game_id = mg.id AND opp_tgs.team_id != tgs.team_id
      JOIN Teams opp_t ON opp_t.id = opp_tgs.team_id
      LEFT JOIN PlayerStats ps ON ps.steam_id = sp.steam_id AND ps.match_game_id = mg.id
      JOIN Seasons s ON s.id = m.season_id
      JOIN Leagues l ON l.id = m.league_id

      WHERE ${query}

      GROUP BY
        m.id,
        CASE WHEN m.best_of = 1 THEN mg.id ELSE NULL END,
        m.best_of,
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
        mg.id AS match_game_id,
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
      JOIN PlayerStats ps ON ps.steam_id = p.steam_id AND ps.match_game_id = mg.id
      JOIN TeamGameScores tgs ON tgs.match_id = m.id AND tgs.team_id = slt.team_id AND mg.id = tgs.match_game_id
      JOIN TeamGameScores opp_tgs ON opp_tgs.match_id = m.id AND opp_tgs.team_id != slt.team_id AND mg.id = opp_tgs.match_game_id
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

export const getAllPlayerStatsWithPartialQueryFilters = async (
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
      SELECT DISTINCT p.steam_id, p.nickname, mg.id as match_game_id
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      ${teamIdsJoin ? "INNER JOIN MatchTeams mt ON mt.match_id = m.id" : ""}
      WHERE ${query}
    ),
    player_stats AS (
      SELECT 
        pg.steam_id,
        pg.nickname,
        COUNT(DISTINCT pg.match_game_id) as maps_played,
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
      INNER JOIN PlayerStats ps ON ps.steam_id = pg.steam_id AND ps.match_game_id = pg.match_game_id
      GROUP BY pg.steam_id, pg.nickname
    ),
    player_rounds AS (
      SELECT 
        pg.steam_id,
        COUNT(DISTINCT mrs.id) as rounds_played
      FROM player_games pg
      INNER JOIN MapRoundStats mrs ON mrs.match_game_id = pg.match_game_id
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

export const getPlayerStatsWithAllFilters = async (
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
      SELECT DISTINCT p.steam_id, p.nickname, mg.id as match_game_id, p.faceit_nickname
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      ${teamIdsJoin ? "INNER JOIN MatchTeams mt ON mt.match_id = m.id" : ""}
      WHERE ${query}
    ),
    player_stats AS (
      SELECT 
        pg.steam_id,
        pg.nickname,
        pg.faceit_nickname,
        COUNT(DISTINCT pg.match_game_id) as maps_played,
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
        SUM(ps.good_strafing_shots) as good_strafing_shots,
        ROUND(SUM(ps.total_ef_duration) / NULLIF(SUM(ps.flashes_thrown), 0), 1) as avg_enemy_flash_duration,
        ROUND(SUM(ps.total_mf_duration) / NULLIF(SUM(ps.flashes_thrown), 0), 1) as avg_teammate_flash_duration,
        COALESCE(ROUND(SUM(ps.good_strafing_shots) / NULLIF(SUM(ps.total_strafing_shots), 0) * 100, 1), 0) as counter_strafing_percentage
      FROM player_games pg
      INNER JOIN PlayerStats ps ON ps.steam_id = pg.steam_id AND ps.match_game_id = pg.match_game_id
      GROUP BY pg.steam_id, pg.nickname
    ),
    player_rounds AS (
      SELECT 
        pg.steam_id,
        COUNT(DISTINCT mrs.id) as rounds_played
      FROM player_games pg
      INNER JOIN MapRoundStats mrs ON mrs.match_game_id = pg.match_game_id
      GROUP BY pg.steam_id
    )
    SELECT 
      ps.*,
      pr.rounds_played
    FROM player_stats ps
    INNER JOIN player_rounds pr ON pr.steam_id = ps.steam_id
  `;

  const [playerStats] = await runQuery<Array<AllPlayerStats | undefined>>(
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
    INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN SeasonLeagues sl ON sl.season_id = m.season_id AND sl.league_id = m.league_id
    WHERE p.steam_id = ? 
      AND m.season_id = (
        SELECT MAX(m2.season_id)
        FROM PlayerStats ps2
        INNER JOIN MatchGames mg2 ON mg2.id = ps2.match_game_id
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
    JOIN MatchGames mg ON ps.match_game_id = mg.id 
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
  { season_ids, league_ids, team_ids, map_ids, stages }: ParsedParams
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
      getPlayerStatsWithAllFilters(steam_id, mapFilterParams),
      getPlayerGameDetailsWithFilters(steam_id, mapFilterParams)
    ]);

    if (playerStats && gameDetails && gameDetails.length > 0) {
      const details = gameDetails[0];

      if (!details) return null;

      // Query PlayerTrades to get count of first deaths that were tradeable
      // (i.e., the player was the victim and first_death = 1)
      // Also get side-specific counts by checking which side the player was on for that round
      // The side is determined by checking if the player's team matches ct_team_id or t_team_id for that round
      // IMPORTANT: PlayerTrades only contains trade opportunities, not isolated deaths
      // Isolated deaths = PlayerStats.first_deaths - tradeable deaths
      const tradeableFirstDeathsQuery = `
        SELECT 
          COUNT(DISTINCT pt.id) as total_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM MatchTeams mt2
              INNER JOIN SeasonTeamPlayers stp2 ON stp2.team_id = mt2.team_id
              WHERE mt2.match_id = mg.match_id
                AND stp2.steam_id = pt.victim_steam_id
                AND stp2.season_id = m.season_id
                AND mt2.team_id = mrs.ct_team_id
            ) THEN pt.id 
          END) as ct_count,
          COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM MatchTeams mt2
              INNER JOIN SeasonTeamPlayers stp2 ON stp2.team_id = mt2.team_id
              WHERE mt2.match_id = mg.match_id
                AND stp2.steam_id = pt.victim_steam_id
                AND stp2.season_id = m.season_id
                AND mt2.team_id = mrs.t_team_id
            ) THEN pt.id 
          END) as t_count
        FROM PlayerTrades pt
        INNER JOIN MatchGames mg ON mg.id = pt.match_game_id
        INNER JOIN Matches m ON m.id = mg.match_id
        INNER JOIN MapRoundStats mrs ON mrs.match_game_id = pt.match_game_id AND mrs.round_number = pt.round_number
        WHERE pt.victim_steam_id = ?
          AND pt.first_death = 1
          AND mg.map_id = ?
          ${season_ids && season_ids.length > 0 ? `AND m.season_id IN (${season_ids.map(() => "?").join(",")})` : ""}
          ${league_ids && league_ids.length > 0 ? `AND m.league_id IN (${league_ids.map(() => "?").join(",")})` : ""}
          ${
            team_ids && team_ids.length > 0
              ? `AND EXISTS (
            SELECT 1 FROM MatchTeams mt3
            INNER JOIN SeasonTeamPlayers stp3 ON stp3.team_id = mt3.team_id
            WHERE mt3.match_id = mg.match_id
              AND stp3.steam_id = pt.victim_steam_id
              AND stp3.season_id = m.season_id
              AND mt3.team_id IN (${team_ids.map(() => "?").join(",")})
          )`
              : ""
          }
          ${stages && stages.length > 0 ? `AND m.stage IN (${stages.map(() => "?").join(",")})` : ""}
      `;

      const tradeableParams: (string | number)[] = [steam_id, mapId];
      if (season_ids && season_ids.length > 0)
        tradeableParams.push(...season_ids);
      if (league_ids && league_ids.length > 0)
        tradeableParams.push(...league_ids);
      if (team_ids && team_ids.length > 0) tradeableParams.push(...team_ids);
      if (stages && stages.length > 0) tradeableParams.push(...stages);

      const [tradeableResult] = await runQuery<
        Array<{ total_count: number; ct_count: number; t_count: number }>
      >(tradeableFirstDeathsQuery, tradeableParams);

      // PlayerTrades is the source of truth for tradeable counts
      // PlayerStats is the source of truth for totals
      // If tradeable > totals: bump totals up to match tradeable (isolated = 0)
      // If tradeable <= totals: isolated = totals - tradeable
      const tradeableTotal = tradeableResult?.total_count || 0;
      const tradeableT = tradeableResult?.t_count || 0;
      const tradeableCT = tradeableResult?.ct_count || 0;

      const statsTotalT = playerStats?.first_deaths_t || 0;
      const statsTotalCT = playerStats?.first_deaths_ct || 0;

      // Bump totals up if tradeable is higher
      const finalTotalT = Math.max(statsTotalT, tradeableT);
      const finalTotalCT = Math.max(statsTotalCT, tradeableCT);
      // Summary total is the sum of bumped side totals (may differ from PlayerStats due to side classification)
      const finalTotal = finalTotalT + finalTotalCT;

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
        first_deaths_ct: finalTotalCT, // Use bumped total if needed
        first_kills_t: playerStats?.first_kills_t || 0,
        first_deaths_t: finalTotalT, // Use bumped total if needed
        first_deaths: finalTotal, // Use bumped total if needed (T + CT may not equal this due to side classification differences)
        avg_enemy_flash_duration: playerStats?.avg_enemy_flash_duration || 0,
        avg_teammate_flash_duration:
          playerStats?.avg_teammate_flash_duration || 0,
        crosshair_placement: playerStats?.avg_crosshair_placement || 0,
        time_to_damage: playerStats?.avg_ttd || 0,
        adr: playerStats?.avg_adr || 0,
        kana_rating: playerStats?.avg_kana_rating || 0,
        hs_percent: playerStats?.avg_hs_percent || 0,
        clutches_lost: playerStats?.clutches - playerStats?.clutches_won || 0,
        kast: playerStats?.avg_kast || 0,
        kd: playerStats?.kills / playerStats?.deaths || 0,
        multikill_2k: playerStats?.kills_2 || 0,
        multikill_3k: playerStats?.kills_3 || 0,
        multikill_4k: playerStats?.kills_4 || 0,
        multikill_5k: playerStats?.kills_5 || 0,
        // First death trade stats
        // PlayerTrades is source of truth for tradeable counts
        first_death_traded: playerStats?.first_death_traded || 0,
        first_death_traded_t: playerStats?.first_death_traded_t || 0,
        first_death_traded_ct: playerStats?.first_death_traded_ct || 0,
        first_deaths_tradeable: tradeableTotal,
        first_deaths_tradeable_t: tradeableT,
        first_deaths_tradeable_ct: tradeableCT
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

/**
 * Update player avatar phash
 */
export const updatePlayerAvatar = async (
  steamId: string,
  avatar: string
): Promise<void> => {
  await runQuery("UPDATE SteamPlayers SET avatar = ? WHERE steam_id = ?", [
    avatar,
    steamId
  ]);
};
