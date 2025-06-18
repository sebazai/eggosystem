import {
  type NewTeamAndOrgManualApprovalType,
  type ExistingTeamManualApprovalType,
  type NewTeamManualApprovalType,
  type PostTeamManualPlayerApprovalSchemaType,
  type NewOrgManualApprovalType
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { insertOrganization } from "../../models/organization.models";
import { insertTeam } from "../../models/team.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { BadRequestError } from "../../utils/errors";

const addNewOrgPreApprovalRegistration = async (
  seasonId: number,
  data: NewOrgManualApprovalType,
  approvedByAccountId: number,
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
  const query = `
    INSERT INTO SeasonPlayerApprovals (season_id, organization_id, steam_id, approved_by_id, ticket_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const approvedByOrganizerSteamIdQueries = data.acceptedPlayerSteamIds.map(
    (steamId) =>
      runQuery(
        query,
        [
          seasonId,
          newOrg.insertId,
          steamId,
          approvedByAccountId,
          data.ticketId ?? null,
          data.details ?? null
        ],
        connection
      )
  );
  await Promise.all(approvedByOrganizerSteamIdQueries);
  return { organizationId: newOrg.insertId };
};

const addExistingTeamPreApprovalRegistration = async (
  seasonId: number,
  data: ExistingTeamManualApprovalType,
  approvedByAccountId: number,
  connection?: PoolConnection
) => {
  const query = `
    INSERT INTO SeasonPlayerApprovals (season_id, team_id, steam_id, approved_by_id, ticket_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const approvedByOrganizerSteamIdQueries = data.acceptedPlayerSteamIds.map(
    (steamId) =>
      runQuery(
        query,
        [
          seasonId,
          data.teamId,
          steamId,
          approvedByAccountId,
          data.ticketId ?? null,
          data.details ?? null
        ],
        connection
      )
  );
  await Promise.all(approvedByOrganizerSteamIdQueries);
  return { teamId: data.teamId };
};

const addNewTeamPreApprovalRegistration = async (
  seasonId: number,
  data: NewTeamManualApprovalType,
  approvedByAccountId: number,
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
    approvedByAccountId,
    connection
  );
};

const addNewTeamAndOrgPreApprovalRegistration = async (
  seasonId: number,
  data: NewTeamAndOrgManualApprovalType,
  approvedByAccountId: number,
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
    approvedByAccountId,
    connection
  );
};

export const handlePreApprovedRegistration = async (
  seasonId: number,
  formData: PostTeamManualPlayerApprovalSchemaType,
  approvedByAccountId: number,
  connection?: PoolConnection
) => {
  if (formData.type === "existing") {
    return addExistingTeamPreApprovalRegistration(
      seasonId,
      formData,
      approvedByAccountId,
      connection
    );
  } else if (formData.type === "new-org") {
    return addNewOrgPreApprovalRegistration(
      seasonId,
      formData,
      approvedByAccountId,
      connection
    );
  } else if (formData.type === "new-team") {
    return addNewTeamPreApprovalRegistration(
      seasonId,
      formData,
      approvedByAccountId,
      connection
    );
  } else if (formData.type === "new-team-and-org") {
    return addNewTeamAndOrgPreApprovalRegistration(
      seasonId,
      formData,
      approvedByAccountId,
      connection
    );
  }
  throw new BadRequestError("Form type unknown");
};
