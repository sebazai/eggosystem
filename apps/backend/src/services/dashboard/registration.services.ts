import {
  type NewTeamAndOrgManualApprovalType,
  type ExistingTeamManualApprovalType,
  type NewTeamManualApprovalType,
  type PostTeamManualPlayerApprovalSchemaType
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { insertOrganization } from "../../models/organization.models";
import { insertTeam } from "../../models/team.models";
import { handleSeasonTeamRegistration } from "../season-team-registration.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { BadRequestError } from "../../utils/errors";

const addExistingTeamPreApprovalRegistration = async (
  seasonId: number,
  data: ExistingTeamManualApprovalType,
  connection?: PoolConnection
) => {
  await handleSeasonTeamRegistration(
    seasonId,
    null,
    730,
    data.teamId,
    {
      captain_steam_id: data.captainSteamId,
      terms_and_conditions_approved: false,
      external_platform_id: null,
      co_captain_steam_id: null
    },
    data.acceptedPlayerSteamIds,
    true,
    connection
  );

  const approvedByOrganizerSteamIdQueries = data.acceptedPlayerSteamIds.map(
    (steamId) =>
      runQuery(
        "UPDATE SeasonTeamPlayers SET employment_approved_by_organizer = 1 WHERE steam_id = ? AND season_id = ? AND team_id = ?",
        [steamId, seasonId, data.teamId],
        connection
      )
  );

  await Promise.all(approvedByOrganizerSteamIdQueries);
  return { teamId: data.teamId };
};

const addNewTeamPreApprovalRegistration = async (
  seasonId: number,
  data: NewTeamManualApprovalType,
  connection?: PoolConnection
) => {
  const newTeam = await insertTeam(
    {
      name: data.newTeamName,

      organization_id: data.organizationId
    },
    connection
  );
  return addExistingTeamPreApprovalRegistration(
    seasonId,
    {
      ...data,
      teamId: newTeam.insertId,
      type: "existing"
    },
    connection
  );
};

const addNewTeamAndOrgPreApprovalRegistration = async (
  seasonId: number,
  data: NewTeamAndOrgManualApprovalType,
  connection?: PoolConnection
) => {
  const newOrg = await insertOrganization(
    {
      name: data.newOrganizationName,
      organization_code: data.newOrganizationCode,
      website: data.newOrganizationWebsite
    },
    connection
  );
  const newTeam = await insertTeam(
    {
      name: data.newTeamName,
      org_approved: true,
      organization_id: newOrg.insertId
    },
    connection
  );
  return addExistingTeamPreApprovalRegistration(
    seasonId,
    {
      ...data,
      teamId: newTeam.insertId,
      type: "existing"
    },
    connection
  );
};

export const handlePreApprovedRegistration = async (
  seasonId: number,
  formData: PostTeamManualPlayerApprovalSchemaType,
  connection?: PoolConnection
) => {
  if (formData.type === "existing") {
    return addExistingTeamPreApprovalRegistration(
      seasonId,
      formData,
      connection
    );
  } else if (formData.type === "new-team") {
    return addNewTeamPreApprovalRegistration(seasonId, formData, connection);
  } else if (formData.type === "new-team-and-org") {
    return addNewTeamAndOrgPreApprovalRegistration(
      seasonId,
      formData,
      connection
    );
  }
  throw new BadRequestError("Form type unknown");
};
