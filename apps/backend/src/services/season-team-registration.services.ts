import { type PoolConnection } from "mysql2/promise";
import { getAccountIdBySteamId } from "../models/account.models";
import {
  removeRoleForAccount,
  removeScopedPermissionForAccount,
  setRoleForAccount,
  setScopedPermissionForAccount
} from "../models/account-roles.models";
import {
  type InsertSeasonTeamRegistration,
  type PlayerSchemaType,
  type SeasonPlatform,
  type SeasonTeamRegistration
} from "@eggosystem/types";
import { getDBPermissionsForAccountId } from "./auth.services";
import { insertSeasonTeamRegistration } from "../models/season-team-registration.models";
import { addPlayersForTeamInSeason } from "./signup.services";

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
