import { type PostTeamManualPlayerApprovalSchemaType } from "@eggosystem/types";
import { getConnection } from "../../db/mysqlConnection";
import { handlePreApprovedRegistration } from "../../services/dashboard/registration.services";
import { getActiveSignupSeasonForAppId } from "../season.models";
import { BadRequestError } from "../../utils/errors";

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
