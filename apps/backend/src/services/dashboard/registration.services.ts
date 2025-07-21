import {
  type NewTeamAndOrgManualApprovalType,
  type ExistingTeamManualApprovalType,
  type NewTeamManualApprovalType,
  type PostTeamManualPlayerApprovalSchemaType,
  type NewOrgManualApprovalType,
  type ExistingOrgManualApprovalType,
  type SeasonRegisteredTeamsWithPlayers,
  type RegisteredTeamPlayer
} from "@eggosystem/types";
import { type PoolConnection } from "mysql2/promise";
import { insertOrganization } from "../../models/organization.models";
import { insertTeam } from "../../models/team.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { BadRequestError } from "../../utils/errors";
import { getSeasonPlayerApproval } from "../../models/season-player-approval.models";

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
  return addExistingOrgPreApprovalRegistration(
    seasonId,
    {
      ...data,
      organizationId: newOrg.insertId,
      type: "existing-org"
    },
    approvedByAccountId,
    connection
  );
};

const addExistingOrgPreApprovalRegistration = async (
  seasonId: number,
  data: ExistingOrgManualApprovalType,
  approvedByAccountId: number,
  connection?: PoolConnection
) => {
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
          data.organizationId,
          steamId,
          approvedByAccountId,
          data.ticketId ?? null,
          data.details ?? null
        ],
        connection
      )
  );
  await Promise.all(approvedByOrganizerSteamIdQueries);
  return { organizationId: data.organizationId };
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
      type: "existing-team"
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
      type: "existing-team"
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
  if (formData.type === "existing-org") {
    return addExistingOrgPreApprovalRegistration(
      seasonId,
      formData,
      approvedByAccountId,
      connection
    );
  } else if (formData.type === "existing-team") {
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

interface TeamValidationResult {
  team_id: number;
  is_valid: boolean;
  invalid_players: RegisteredTeamPlayer[];
}

export const getTeamsSignupApprovalState = async (
  teams: SeasonRegisteredTeamsWithPlayers[]
): Promise<TeamValidationResult[]> => {
  const teamValidationPromises = teams.map(async (team) => {
    const players = team.players;

    const teamValidationResult: TeamValidationResult = {
      team_id: team.team_id,
      is_valid: true,
      invalid_players: []
    };

    // If no players, return valid team
    if (players.length === 0) {
      return teamValidationResult;
    }

    // Find the most common work email ending (only for non-personal emails)
    const workEmailEndings = players
      .filter((player) => !player.is_work_email_personal_email)
      .map((player) => player.work_email.split("@")[1]);

    // If all players have personal emails, they all need approval
    if (workEmailEndings.length === 0) {
      const playersNeedingApproval = players;

      if (playersNeedingApproval.length > 0) {
        // Check all approvals in parallel
        const approvalChecks = playersNeedingApproval.map(async (player) => {
          const seasonPlayerApproval = await getSeasonPlayerApproval(
            team.season_id,
            team.team_id,
            player.steam_id
          );
          const isApproved = Boolean(
            seasonPlayerApproval && seasonPlayerApproval.length > 0
          );
          return { player, isApproved };
        });

        const approvalResults = await Promise.all(approvalChecks);

        // Process results - team is invalid if ANY player is not approved
        for (const { player, isApproved } of approvalResults) {
          if (!isApproved) {
            teamValidationResult.is_valid = false;
            teamValidationResult.invalid_players.push(player);
          }
        }
      }

      return teamValidationResult;
    }

    // Find the most common work email ending
    const mostCommonEmailEnding = workEmailEndings.reduce((a, b) => {
      const countA = workEmailEndings.filter((v) => v === a).length;
      const countB = workEmailEndings.filter((v) => v === b).length;
      if (countA > countB) return a;
      if (countB > countA) return b;
      // If counts are equal, prefer the first one for consistency
      return a;
    });

    // Find players that need approval checks
    const playersNeedingApproval = players.filter((player) => {
      // Players with personal emails always need approval
      if (player.is_work_email_personal_email) {
        return true;
      }
      // Players with different work email endings need approval
      return player.work_email.split("@")[1] !== mostCommonEmailEnding;
    });

    if (playersNeedingApproval.length > 0) {
      // Check all approvals in parallel
      const approvalChecks = playersNeedingApproval.map(async (player) => {
        const seasonPlayerApproval = await getSeasonPlayerApproval(
          team.season_id,
          team.team_id,
          player.steam_id
        );
        const isApproved = Boolean(
          seasonPlayerApproval && seasonPlayerApproval.length > 0
        );
        return { player, isApproved };
      });

      const approvalResults = await Promise.all(approvalChecks);

      // Process results - team is invalid if ANY player is not approved
      for (const { player, isApproved } of approvalResults) {
        if (!isApproved) {
          teamValidationResult.is_valid = false;
          teamValidationResult.invalid_players.push(player);
        }
      }
    }

    return teamValidationResult;
  });

  return Promise.all(teamValidationPromises);
};
