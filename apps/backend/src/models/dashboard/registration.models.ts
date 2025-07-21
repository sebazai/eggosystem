import {
  SeasonPlatform,
  type SeasonPlayerRankFormValues,
  type PostTeamManualPlayerApprovalSchemaType,
  type ActiveSeasonSignupForAppId,
  type SeasonRegisteredTeamsWithPlayers,
  type SeasonTeamRegistration,
  type PlayerFullName,
  type RegisteredTeamPlayer
} from "@eggosystem/types";
import { getConnection } from "../../db/mysqlConnection";
import { handlePreApprovedRegistration } from "../../services/dashboard/registration.services";
import { getActiveSignupSeasonForAppId } from "../season.models";
import { BadRequestError } from "../../utils/errors";
import {
  insertCSPlayerRankForSeason,
  insertFaceITPlayerRankForSeason
} from "../season-player-ranks.models";
import { faceitEloToLevel } from "../../utils/faceit-utils";
import { runQuery } from "../../db/mysqlRunQuery";

export const addManuallyApprovedPartialSignupForSeason = async (
  formData: PostTeamManualPlayerApprovalSchemaType,
  approvedByAccountId: number
) => {
  const connection = await getConnection();

  const activeSeason = await getActiveSignupSeasonForAppId(730);

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
  if (season.platform === SeasonPlatform.FACEIT && formData.external_elo) {
    await insertFaceITPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank ?? null,
      csHours ?? null,
      {
        faceit_elo: formData.external_elo,
        faceit_level: faceitEloToLevel(formData.external_elo),
        faceit_kd: 0.95,
        faceit_date: new Date().getTime()
      },
      { isManuallyAdded: true }
    );
  } else {
    await insertCSPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank ?? null,
      csHours ?? null,
      { isManuallyAdded: !!cs2Rank }
    );
  }
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
      GROUP_CONCAT(CONCAT(sp.steam_id, ':', sp.nickname, ':', a.work_email, ':', a.is_work_email_personal_email) SEPARATOR ',') as players
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
  // Parse players string into array of objects
  return rows.map(
    (row) =>
      ({
        ...row,
        players: row.players
          ? row.players.split(",").map((p: string) => {
              const [
                steam_id,
                nickname,
                work_email,
                is_work_email_personal_email
              ] = p.split(":");
              return {
                steam_id,
                nickname,
                work_email,
                is_work_email_personal_email:
                  is_work_email_personal_email === "1"
              } satisfies RegisteredTeamPlayer;
            })
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
