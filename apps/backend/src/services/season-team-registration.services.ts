import { type PoolConnection } from "mysql2/promise";
import { getAccountIdBySteamId } from "../models/account.models";
import {
  removeRoleForAccount,
  removeScopedPermissionForAccount,
  setRoleForAccount,
  setScopedPermissionForAccount
} from "../models/account-roles.models";
import {
  SeasonDetails,
  SignupFormValues,
  type InsertSeasonTeamRegistration,
  type PlayerSchemaType,
  type SeasonPlatform,
  type SeasonTeamRegistration
} from "@eggosystem/types";
import { getDBPermissionsForAccountId } from "./auth.services";
import { insertSeasonTeamRegistration } from "../models/season-team-registration.models";
import {
  addPlayersForTeamInSeason,
  validatePlayersForSignup
} from "./signup.services";
import { insertOrganization } from "../models/organization.models";
import { insertTeam } from "../models/team.models";
import { isTeamPartOfOrganization } from "./team.services";

export const updateCaptainPermissionsForSeasonTeam = async (
  season_id: number,
  team_id: number,
  new_captain_steam_id: string,
  old_captain_steam_id: SeasonTeamRegistration["captain_steam_id"],
  new_co_captain_steam_id: string,
  old_co_captain_steam_id: SeasonTeamRegistration["co_captain_steam_id"],
  connection?: PoolConnection
) => {
  const newCaptain =
    new_captain_steam_id !== old_captain_steam_id
      ? new_captain_steam_id
      : undefined;
  const newCoCaptain =
    new_co_captain_steam_id !== old_co_captain_steam_id
      ? new_co_captain_steam_id
      : undefined;

  await setCaptainPermissionsForSeason(
    season_id,
    team_id,
    newCaptain,
    newCoCaptain,
    connection
  );
  if (newCaptain && old_captain_steam_id) {
    const oldAccount = await getAccountIdBySteamId(old_captain_steam_id);
    await removeCaptainPermissionForAccountId(
      oldAccount.account_id,
      season_id,
      team_id,
      connection
    );
  }
  if (newCoCaptain && old_co_captain_steam_id) {
    const oldAccount = await getAccountIdBySteamId(old_co_captain_steam_id);
    await removeCaptainPermissionForAccountId(
      oldAccount.account_id,
      season_id,
      team_id,
      connection
    );
  }
};

export const setCaptainPermissionsForSeason = async (
  season_id: number,
  team_id: number,
  captain_steam_id?: SeasonTeamRegistration["captain_steam_id"],
  co_captain_steam_id?: SeasonTeamRegistration["co_captain_steam_id"],
  connection?: PoolConnection
) => {
  const roleName = `captain`;
  const permissionName = `edit-registration`;
  if (captain_steam_id) {
    const captainAccount = await getAccountIdBySteamId(
      captain_steam_id,
      connection
    );
    await setRoleForAccount(roleName, captainAccount.account_id, connection);
    await setScopedPermissionForAccount(
      permissionName,
      captainAccount.account_id,
      season_id,
      team_id,
      connection
    );
  }
  if (co_captain_steam_id) {
    const coCaptainAccount = await getAccountIdBySteamId(
      co_captain_steam_id,
      connection
    );

    await setRoleForAccount(roleName, coCaptainAccount.account_id, connection);
    await setScopedPermissionForAccount(
      permissionName,
      coCaptainAccount.account_id,
      season_id,
      team_id,
      connection
    );
  }
};

export const removeCaptainPermissionForAccountId = async (
  accountId: number,
  season_id: number,
  team_id: number,
  connection?: PoolConnection
) => {
  const roleName = "captain";
  const permissionName = "edit-registration";

  await removeScopedPermissionForAccount(
    permissionName,
    accountId,
    season_id,
    team_id,
    connection
  );

  const captainAccountPermissions = await getDBPermissionsForAccountId(
    accountId,
    connection
  );

  const accountHasOtherCaptainSeasonTeamScope = captainAccountPermissions.some(
    (accountPermission) =>
      accountPermission.role_name === "captain" &&
      accountPermission.season_id &&
      accountPermission.team_id
  );

  if (!accountHasOtherCaptainSeasonTeamScope) {
    await removeRoleForAccount(roleName, accountId, connection);
  }
};

export const handleSeasonTeamRegistration = async (
  seasonId: number,
  seasonPlatform: SeasonPlatform,
  appId: number,
  teamId: number,
  teamData: InsertSeasonTeamRegistration,
  playersData: PlayerSchemaType[],
  connection?: PoolConnection
) => {
  return Promise.all([
    validatePlayersForSignup(
      seasonId,
      seasonPlatform,
      appId,
      teamId,
      playersData
    ),
    insertSeasonTeamRegistration(seasonId, teamId, teamData, connection),
    addPlayersForTeamInSeason(
      seasonId,
      appId,
      seasonPlatform,
      teamId,
      playersData,
      connection
    ),

    setCaptainPermissionsForSeason(
      seasonId,
      teamId,
      teamData.captain_steam_id,
      teamData.co_captain_steam_id,
      connection
    )
  ]);
};

export const handleSignupFormForSeason = async (
  season: SeasonDetails,
  formData: SignupFormValues,
  connection?: PoolConnection
) => {
  const captainSteamId = formData.players.find((p) => p.captain)?.steamId;
  const coCaptainSteamId = formData.players.find((p) => p.coCaptain)?.steamId;

  if (!captainSteamId || !coCaptainSteamId) {
    throw new Error("Could not determine captain and co-captain.");
  }

  // Handle new org and new team.
  if (formData.organizationId === -1) {
    if (formData.teamId !== -1) {
      throw new Error("Cannot create a new organization with an existing team");
    }

    if (formData.newOrganization) {
      const newOrg = await insertOrganization(
        {
          name: formData.newOrganization.name,
          organization_code: formData.newOrganization.organization_code,
          website: formData.newOrganization.website
        },
        connection
      );
      if (formData.newTeam) {
        const newTeam = await insertTeam(
          {
            name: formData.newTeam.name,
            organization_id: newOrg.insertId,
            org_approved: true
          },
          connection
        );

        await handleSeasonTeamRegistration(
          season.id,
          season.platform,
          season.app_id,
          newTeam.insertId,
          {
            captain_steam_id: captainSteamId,
            co_captain_steam_id: coCaptainSteamId,
            external_platform_id: formData.teamExternalId
          },
          formData.players,
          connection
        );

        return {
          team_id: newTeam.insertId,
          organization_id: newOrg.insertId
        };
      }
    }
  }

  // Handle existing org and new team
  if (formData.organizationId !== -1) {
    if (formData.teamId === -1) {
      if (formData.newTeam) {
        const newTeam = await insertTeam(
          {
            name: formData.newTeam.name,
            organization_id: formData.organizationId,
            org_approved: false
          },
          connection
        );

        await handleSeasonTeamRegistration(
          season.id,
          season.platform,
          season.app_id,
          newTeam.insertId,
          {
            captain_steam_id: captainSteamId,
            co_captain_steam_id: coCaptainSteamId,
            external_platform_id: formData.teamExternalId
          },
          formData.players,
          connection
        );

        return {
          team_id: newTeam.insertId,
          organization_id: formData.organizationId
        };
      }
    }
  }

  // Handle existing organization and existing team
  if (formData.organizationId !== -1 && formData.teamId !== -1) {
    // Ensure the team belongs to the organization
    const isTeamPartOfOrg = await isTeamPartOfOrganization(
      formData.teamId,
      formData.organizationId
    );

    if (!isTeamPartOfOrg) {
      throw new Error("Team does not belong to the selected organization");
    }

    await handleSeasonTeamRegistration(
      season.id,
      season.platform,
      season.app_id,
      formData.teamId,
      {
        captain_steam_id: captainSteamId,
        co_captain_steam_id: coCaptainSteamId,
        external_platform_id: formData.teamExternalId
      },
      formData.players,
      connection
    );

    return {
      team_id: formData.teamId,
      organization_id: formData.organizationId
    };
  }
};
