import {
  type SeasonPlatform,
  type SeasonPlayerRankFormValues,
  type PostTeamManualPlayerApprovalSchemaType,
  type ActiveSeasonSignupForAppId,
  type SeasonRegisteredTeamsWithPlayers,
  type SeasonTeamRegistration,
  type PlayerFullName
} from "@eggosystem/types";
import JSONBig from "json-bigint";
import { getConnection } from "../../db/mysqlConnection";
import { handlePreApprovedRegistration } from "../../services/dashboard/registration.services";
import { getActiveSignupOrActiveSeasonForAppId } from "../season.models";
import { BadRequestError } from "../../utils/errors";
import { insertFaceITPlayerRankForSeason } from "../season-player-ranks.models";
import { faceitEloToLevel } from "../../utils/faceit-utils";
import { runQuery } from "../../db/mysqlRunQuery";

export const addManuallyApprovedPartialSignupForSeason = async (
  formData: PostTeamManualPlayerApprovalSchemaType,
  approvedByAccountId: number
) => {
  const connection = await getConnection();

  // TODO: Make this dynamic
  const activeSeason = await getActiveSignupOrActiveSeasonForAppId(1, 730);

  if (!activeSeason) {
    throw new BadRequestError("No active registration ongoing for CS");
  }

  try {
    await connection.beginTransaction();
    const data = await handlePreApprovedRegistration(
      activeSeason.season_id,
      formData,
      approvedByAccountId,
      connection
    );
    await connection.commit();
    return { seasonId: activeSeason.season_id, ...data };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const addSeasonRankForPlayer = async (
  formData: SeasonPlayerRankFormValues,
  season: ActiveSeasonSignupForAppId
) => {
  const cs2Rank = formData.cs2_rank;
  const csHours = formData.cs_hours;

  await insertFaceITPlayerRankForSeason(
    formData.steam_id,
    season.season_id,
    cs2Rank ?? null,
    csHours ?? null,
    {
      faceit_elo: formData.external_elo ?? undefined,
      faceit_level: formData.external_elo
        ? faceitEloToLevel(formData.external_elo)
        : undefined,
      faceit_kd: formData.external_kd
        ? formData.external_kd
        : formData.external_elo
          ? 0.95
          : undefined
    },
    {
      isManuallyAddedExternalRank: !!formData.external_elo,
      isManuallyAddedRank: !!cs2Rank
    }
  );
};

interface RegisteredTeamQueryResult extends SeasonTeamRegistration {
  team_name: string;
  team_id: number;
  players: string;
  season_platform: SeasonPlatform;
  season_id: number;
  captain_nickname: string;
  co_captain_nickname: string;
}

export const getRegisteredTeams = async (seasonId: number) => {
  const query = `
    SELECT 
      str.*,
      t.name as team_name,
      t.id as team_id,
      s.platform as season_platform,
      s.id as season_id,
      MAX(CASE WHEN stp.is_captain = 1 THEN sp.nickname END) as captain_nickname,
      MAX(CASE WHEN stp.is_co_captain = 1 THEN sp.nickname END) as co_captain_nickname,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'steam_id', sp.steam_id,
          'nickname', sp.nickname,
          'work_email', a.work_email,
          'is_work_email_personal_email', a.is_work_email_personal_email
        )
      ) as players
    FROM SeasonTeamRegistrations str 
      JOIN Teams t ON str.team_id = t.id 
      JOIN SeasonTeamRegistrationPlayers stp ON str.team_id = stp.team_id AND stp.season_id = str.season_id
      JOIN Seasons s ON str.season_id = s.id
      JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
      JOIN Accounts a ON sp.account_id = a.id
    WHERE str.season_id = ?
    GROUP BY str.team_id, t.name, str.season_id
  `;
  const rows = await runQuery<RegisteredTeamQueryResult[]>(query, [seasonId]);
  // Parse players JSON array into array of objects
  return rows.map(
    (row) =>
      ({
        ...row,
        players: row.players
          ? JSONBig({ storeAsString: true }).parse(row.players)
          : []
      }) satisfies SeasonRegisteredTeamsWithPlayers
  );
};

export const getPlayerFullName = async (
  steamId: string
): Promise<PlayerFullName | undefined> => {
  const query = `
    SELECT 
      sp.steam_id,
      a.full_name
    FROM SteamPlayers sp
    JOIN Accounts a ON a.id = sp.account_id
    WHERE sp.steam_id = ?
  `;

  const results = await runQuery<PlayerFullName[]>(query, [steamId]);
  return results.length > 0 ? results[0] : undefined;
};

export const bulkApproveTeamRegistrations = async (
  seasonId: number,
  teamIds: number[],
  approvedByAccountId: number
) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Update the approved status for all specified teams
    const updateQuery = `
      UPDATE SeasonTeamRegistrations 
      SET approved = true, approved_by = ?
      WHERE season_id = ? AND team_id IN (${teamIds.map(() => "?").join(",")})
    `;

    const result = await runQuery<{ affectedRows: number }>(
      updateQuery,
      [approvedByAccountId, seasonId, ...teamIds],
      connection
    );

    const updateOrgApproved = `
      UPDATE Teams
      SET org_approved = true
      WHERE id IN (${teamIds.map(() => "?").join(",")})
    `;
    await runQuery(updateOrgApproved, [...teamIds], connection);

    // Get the updated teams using the existing function
    const updatedTeams = await getRegisteredTeams(seasonId);

    await connection.commit();

    return {
      success: true,
      updatedCount: result.affectedRows,
      teams: updatedTeams
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const manualValidityCheck = async (
  seasonId: number,
  teamIds: number[],
  checkedByAccountId: number
) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const updateQuery = `
      UPDATE SeasonTeamRegistrations 
      SET manual_validity_check_override = true, manual_validity_check_by = ?
      WHERE season_id = ? AND team_id IN (${teamIds.map(() => "?").join(",")})
    `;

    const result = await runQuery<{ affectedRows: number }>(
      updateQuery,
      [checkedByAccountId, seasonId, ...teamIds],
      connection
    );

    await connection.commit();

    return {
      success: true,
      updatedCount: result.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
