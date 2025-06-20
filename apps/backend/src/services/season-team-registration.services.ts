import { type PoolConnection } from "mysql2/promise";
import { getAccountIdBySteamId } from "../models/account.models";
import {
  removeRoleForAccount,
  removeScopedPermissionForAccount,
  setRoleForAccount,
  setScopedPermissionForAccount
} from "../models/account-roles.models";
import {
  type SeasonDetails,
  type SignupFormValues,
  type InsertSeasonTeamRegistration,
  SeasonPlatform,
  type SeasonTeamRegistration,
  isFaceITCSRank,
  type UpdateSeasonTeamRegistration
} from "@eggosystem/types";
import { getDBPermissionsForAccountId } from "./auth.services";
import {
  getSeasonTeamRegistrationBySeasonAndTeamId,
  insertSeasonTeamRegistration,
  updatePlayersForSeasonTeamRegistration,
  updateSeasonTeamRegistration
} from "../models/season-team-registration.models";

import { insertOrganization } from "../models/organization.models";
import { getTeamWithIdWithoutOrg, insertTeam } from "../models/team.models";
import { isTeamPartOfOrganization } from "./team.services";
import { areSteamProfilesPublic } from "./steam.services";
import { getPlayerDetailsBySteamId } from "../models/player.models";
import {
  insertCSPlayerRankForSeason,
  insertFaceITPlayerRankForSeason
} from "../models/season-player-ranks.models";
import {
  insertSeasonTeamPlayer,
  isPlayerApprovedForSeasonManually
} from "../models/season-team-players.models";
import { getSeasonDetailsById } from "../models/season.models";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { getFaceITTeamDetails } from "./faceit.services";
import {
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId,
  getPlayerRankForPlatform
} from "./player-ranks.services";
import { runQuery } from "../db/mysqlRunQuery";

export const ensurePlayerSteamProfilesPublic = async (
  playerSteamIds: string[]
) => {
  const areProfilePublic = await areSteamProfilesPublic(playerSteamIds);
  if (!areProfilePublic.is_all_public) {
    const notPublicIds =
      areProfilePublic.not_public?.join(", ") || "some Steam IDs";
    throw new Error(`Steam IDs ${notPublicIds} are not public.`);
  }
};

export const checkExternalId = async (
  platform: SeasonPlatform,
  teamExternalId?: string
) => {
  const externalIdValid = await isValidExternalId(platform, teamExternalId);

  if (!externalIdValid) {
    throw new BadRequestError(
      `Could not find external team data for ${platform.toLocaleUpperCase()} id ${teamExternalId}`
    );
  }
};

export const getValidSeason = async (seasonId: number) => {
  const season = await getSeasonDetailsById(seasonId);
  if (!season) {
    throw new NotFoundError("Season not found");
  }
  if (!season.signup_start_date) {
    throw new BadRequestError("Season does not have a signup start date");
  }
  const now = new Date();
  const signupStart = new Date(season.signup_start_date);
  if (now < signupStart) {
    throw new BadRequestError("Signup has not started yet");
  }
  if (season.signup_end_date) {
    const signupEnd = new Date(season.signup_end_date);
    if (now > signupEnd) {
      throw new BadRequestError("Signup has ended");
    }
  }
  return season;
};

export const addPlayersForTeamInSeason = async (
  seasonId: number,
  appId: number,
  platform: SeasonPlatform | null,
  teamId: number,
  playerSteamIds: string[],
  connection?: PoolConnection
) => {
  for (const steamId of playerSteamIds) {
    await insertSeasonTeamPlayer(
      seasonId,
      teamId,
      {
        steam_id: steamId
      },
      connection
    );
    const [rank, { hours }, externalRank] = await Promise.all([
      getPlayerAppIdRank(steamId, appId, seasonId),
      getPlayerHoursForSteamAppId(steamId, appId, seasonId),
      getPlayerRankForPlatform(steamId, platform, seasonId)
    ]);

    if (hours === -1) {
      throw new BadRequestError(`Player ${steamId} hours not found.`);
    }

    if (rank.average_rank === -1) {
      throw new BadRequestError(`Player ${steamId} has no app id rank`);
    }

    if (
      externalRank &&
      externalRank.faceit_elo === -1 &&
      platform !== SeasonPlatform.Kanaliiga
    ) {
      throw new BadRequestError(`Player ${steamId} has no ${platform} rank.`);
    }

    if (isFaceITCSRank(externalRank)) {
      await insertFaceITPlayerRankForSeason(
        steamId,
        seasonId,
        rank.average_rank,
        hours,
        externalRank,
        { connection }
      );
    } else {
      await insertCSPlayerRankForSeason(
        steamId,
        seasonId,
        rank.average_rank,
        hours,
        { connection }
      );
    }
  }
};

export const isValidExternalId = async (
  platform: SeasonPlatform,
  id?: string
) => {
  if (platform === SeasonPlatform.Kanaliiga) {
    return true;
  }
  if (platform === SeasonPlatform.FACEIT && id) {
    const data = await getFaceITTeamDetails(id);
    return !!data;
  }
  return false;
};

export const validatePlayersFromDBForSignup = async (
  seasonId: number,
  teamId: number,
  organizationId: number,
  playerSteamIds: string[]
) => {
  // await ensurePlayerSteamProfilesPublic(playerSteamIds);
  const data = await Promise.all(
    playerSteamIds.map((steamId) => getPlayerDetailsBySteamId(steamId))
  );
  const filteredData = data.filter((player) => !!player);
  if (filteredData.length !== playerSteamIds.length) {
    throw new BadRequestError(
      "Could not find players in database that is provided in the form"
    );
  }

  for (const playerData of filteredData) {
    if (!playerData.has_accepted_latest_privacy_policy) {
      throw new BadRequestError(
        `Player ${playerData.steam_id} has not accepted privacy policy.`
      );
    }
    if (!playerData.is_valid_work_email) {
      const manuallyApprovedPlayer = await isPlayerApprovedForSeasonManually(
        seasonId,
        playerData.steam_id,
        teamId,
        organizationId
      );
      if (!manuallyApprovedPlayer.approved_by_organizer) {
        throw new BadRequestError(
          `Player ${playerData.steam_id} does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord.`
        );
      }
    }
    if (!playerData.is_valid_full_name) {
      throw new BadRequestError(
        `Player ${playerData.steam_id} profile data missing.`
      );
    }
  }
};

export const updateCaptainPermissionsForSeasonTeam = async (
  season_id: number,
  team_id: number,
  new_captain_steam_id: SeasonTeamRegistration["captain_steam_id"],
  old_captain_steam_id: SeasonTeamRegistration["captain_steam_id"],
  new_co_captain_steam_id: SeasonTeamRegistration["co_captain_steam_id"],
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

  if (newCaptain || newCoCaptain) {
    await setCaptainPermissionsForSeason(
      season_id,
      team_id,
      newCaptain,
      newCoCaptain,
      connection
    );
  }

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

export const handleUpdateSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  organizationId: number,
  teamData: UpdateSeasonTeamRegistration,
  old_captain_steam_id: SeasonTeamRegistration["captain_steam_id"],
  old_co_captain_steam_id: SeasonTeamRegistration["co_captain_steam_id"],
  playerSteamIds: string[],
  connection?: PoolConnection
) => {
  await Promise.all([
    validatePlayersFromDBForSignup(
      seasonId,
      teamId,
      organizationId,
      playerSteamIds
    ),
    updateSeasonTeamRegistration(seasonId, teamId, teamData, connection),
    updatePlayersForSeasonTeamRegistration(
      seasonId,
      teamId,
      playerSteamIds,
      connection
    ),
    updateCaptainPermissionsForSeasonTeam(
      seasonId,
      teamId,
      teamData.captain_steam_id,
      old_captain_steam_id,
      teamData.co_captain_steam_id,
      old_co_captain_steam_id,
      connection
    )
  ]);
};

export const handleSeasonTeamRegistration = async (
  seasonId: number,
  seasonPlatform: SeasonPlatform | null,
  appId: number,
  teamId: number,
  organizationId: number,
  teamData: InsertSeasonTeamRegistration,
  playerSteamIds: string[],
  connection?: PoolConnection
) => {
  await Promise.all([
    validatePlayersFromDBForSignup(
      seasonId,
      teamId,
      organizationId,
      playerSteamIds
    ),
    insertSeasonTeamRegistration(seasonId, teamId, teamData, connection),
    addPlayersForTeamInSeason(
      seasonId,
      appId,
      seasonPlatform,
      teamId,
      playerSteamIds,
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

export const handleSignupFormForSeasonUpdate = async (
  seasonId: number,
  teamId: number,
  formData: SignupFormValues,
  connection?: PoolConnection
) => {
  const captainSteamId = formData.players.find((p) => p.captain)?.steamId;
  const coCaptainSteamId = formData.players.find((p) => p.coCaptain)?.steamId;

  if (!captainSteamId) {
    throw new Error("Could not determine new captain.");
  }
  if (!coCaptainSteamId) {
    throw new Error("Could not determine new co-captain.");
  }

  const oldRegistration = await getSeasonTeamRegistrationBySeasonAndTeamId(
    seasonId,
    teamId
  );

  const oldCaptain = oldRegistration.captain_steam_id;
  const oldCoCaptain = oldRegistration.co_captain_steam_id;

  await handleUpdateSeasonTeamRegistration(
    seasonId,
    teamId,
    formData.organizationId,
    {
      captain_steam_id: captainSteamId,
      co_captain_steam_id: coCaptainSteamId,
      external_platform_id: formData.teamExternalId ?? null,
      terms_and_conditions_approved: formData.captainHasReadTermAndConditions
    },
    oldCaptain,
    oldCoCaptain,
    formData.players.map((player) => player.steamId),
    connection
  );
};

export const handleSignupFormForSeason = async (
  season: SeasonDetails,
  formData: SignupFormValues,
  connection?: PoolConnection
) => {
  const captainSteamId = formData.players.find((p) => p.captain)?.steamId;
  const coCaptainSteamId = formData.players.find((p) => p.coCaptain)?.steamId;

  if (!captainSteamId) {
    throw new BadRequestError("Could not determine captain.");
  }
  if (!coCaptainSteamId) {
    throw new BadRequestError("Could not determine co-captain.");
  }

  // If someone selected a team that is not tied to organization
  const [rogueTeam] = await getTeamWithIdWithoutOrg(formData.teamId);

  // Handle new org and new team.
  if (formData.organizationId === -1) {
    if (formData.teamId !== -1 && !rogueTeam) {
      throw new BadRequestError(
        "Cannot create a new organization with an existing team"
      );
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

      // If new organization, and an existing team from older seasons that does not have an org.
      if (rogueTeam) {
        await runQuery(
          "UPDATE Teams SET organization_id = ? WHERE id = ?",
          [newOrg.insertId, formData.teamId],
          connection
        );

        await handleSeasonTeamRegistration(
          season.id,
          season.platform,
          season.app_id,
          formData.teamId,
          newOrg.insertId,
          {
            captain_steam_id: captainSteamId,
            co_captain_steam_id: coCaptainSteamId,
            external_platform_id: formData.teamExternalId,
            terms_and_conditions_approved:
              formData.captainHasReadTermAndConditions
          },
          formData.players.map((player) => player.steamId),
          connection
        );

        return {
          team_id: formData.teamId,
          organization_id: newOrg.insertId
        };
      }

      // New org and new team.
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
          newOrg.insertId,
          {
            captain_steam_id: captainSteamId,
            co_captain_steam_id: coCaptainSteamId,
            external_platform_id: formData.teamExternalId,
            terms_and_conditions_approved:
              formData.captainHasReadTermAndConditions
          },
          formData.players.map((player) => player.steamId),
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
    if (formData.teamId === -1 && formData.newTeam) {
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
        formData.organizationId,
        {
          captain_steam_id: captainSteamId,
          co_captain_steam_id: coCaptainSteamId,
          external_platform_id: formData.teamExternalId,
          terms_and_conditions_approved:
            formData.captainHasReadTermAndConditions
        },
        formData.players.map((player) => player.steamId),
        connection
      );

      return {
        team_id: newTeam.insertId,
        organization_id: formData.organizationId
      };
    }
  }

  // Handle existing organization and existing team
  if (
    formData.organizationId !== -1 &&
    formData.organizationId > 0 &&
    formData.teamId !== -1 &&
    formData.teamId > 0
  ) {
    // Ensure the team belongs to the organization
    const isTeamPartOfOrg = await isTeamPartOfOrganization(
      formData.teamId,
      formData.organizationId
    );

    if (!isTeamPartOfOrg && !rogueTeam) {
      throw new BadRequestError(
        "Team does not belong to the selected organization"
      );
    }

    if (rogueTeam) {
      await runQuery(
        "UPDATE Teams SET organization_id = ? WHERE id = ?",
        [formData.organizationId, formData.teamId],
        connection
      );
    }

    await handleSeasonTeamRegistration(
      season.id,
      season.platform,
      season.app_id,
      formData.teamId,
      formData.organizationId,
      {
        captain_steam_id: captainSteamId,
        co_captain_steam_id: coCaptainSteamId,
        external_platform_id: formData.teamExternalId,
        terms_and_conditions_approved: formData.captainHasReadTermAndConditions
      },
      formData.players.map((player) => player.steamId),
      connection
    );

    return {
      team_id: formData.teamId,
      organization_id: formData.organizationId
    };
  }
  throw new BadRequestError(
    "Failed to add registration, could not determine team or organization."
  );
};
