import {
  SeasonPlatform,
  type SeasonPlayerRankFormValues,
  type PostTeamManualPlayerApprovalSchemaType
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

export const addManuallyApprovedPartialSignupForSeason = async (
  formData: PostTeamManualPlayerApprovalSchemaType
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
  season: { season_id: number; platform: SeasonPlatform }
) => {
  const cs2Rank = formData.cs2_rank || -1;
  const csHours = formData.cs_hours || -1;
  if (season.platform === SeasonPlatform.FACEIT && formData.external_elo) {
    await insertFaceITPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank,
      csHours,
      {
        faceit_elo: formData.external_elo || -1,
        faceit_level: faceitEloToLevel(formData.external_elo || -1),
        faceit_kd: 1,
        faceit_date: new Date().getTime()
      },
      { isManuallyAdded: true }
    );
  } else {
    await insertCSPlayerRankForSeason(
      formData.steam_id,
      season.season_id,
      cs2Rank,
      csHours,
      { isManuallyAdded: true }
    );
  }
};
