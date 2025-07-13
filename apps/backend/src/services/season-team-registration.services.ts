import { type PoolConnection } from "mysql2/promise";
import {
  type SeasonDetails,
  type SignupFormValues,
  type InsertSeasonTeamRegistration,
  SeasonPlatform,
  isFaceITCSRank,
  type UpdateSeasonTeamRegistration,
  type PlayerDetailsBySteamId,
  type InsertSeasonTeamRegistrationPlayer,
  type UpdateSeasonTeamRegistrationPlayer
} from "@eggosystem/types";
import {
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
import { isPlayerApprovedForSeasonManually } from "../models/season-team-players.models";
import { getSeasonDetailsById } from "../models/season.models";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { getFaceITTeamDetails } from "./faceit.services";
import {
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId,
  getPlayerRankForPlatform
} from "./player-ranks.services";
import { runQuery } from "../db/mysqlRunQuery";
import { insertSeasonTeamRegistrationPlayer } from "../models/season-team-registration-player.models";

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
  playerInsertData: InsertSeasonTeamRegistrationPlayer[],
  connection?: PoolConnection
) => {
  for (const player of playerInsertData) {
    await insertSeasonTeamRegistrationPlayer(
      seasonId,
      teamId,
      {
        steam_id: player.steam_id,
        is_captain: player.is_captain,
        is_co_captain: player.is_co_captain
      },
      connection
    );
    const [rank, { hours }, externalRank] = await Promise.all([
      getPlayerAppIdRank(player.steam_id, appId, seasonId),
      getPlayerHoursForSteamAppId(player.steam_id, appId, seasonId),
      getPlayerRankForPlatform(player.steam_id, platform, seasonId)
    ]);

    if (hours === -1) {
      throw new BadRequestError(`Player ${player.steam_id} hours not found.`);
    }

    if (rank.average_rank === -1) {
      throw new BadRequestError(`Player ${player.steam_id} has no app id rank`);
    }

    if (
      externalRank &&
      externalRank.faceit_elo === -1 &&
      platform !== SeasonPlatform.Kanaliiga
    ) {
      throw new BadRequestError(
        `Player ${player.steam_id} has no ${platform} rank.`
      );
    }

    if (isFaceITCSRank(externalRank)) {
      await insertFaceITPlayerRankForSeason(
        player.steam_id,
        seasonId,
        rank.average_rank,
        hours,
        externalRank,
        { connection }
      );
    } else {
      await insertCSPlayerRankForSeason(
        player.steam_id,
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
  const filteredData = data.filter(
    (player): player is PlayerDetailsBySteamId => !!player
  );
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

export const handleUpdateSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  organizationId: number,
  teamData: UpdateSeasonTeamRegistration,
  playerUpdateData: UpdateSeasonTeamRegistrationPlayer[],
  connection?: PoolConnection
) => {
  const playerSteamIds = playerUpdateData.map((player) => player.steam_id);
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
      playerUpdateData,
      connection
    )
    // Captain permissions are now handled automatically by database triggers
  ]);
};

export const handleSeasonTeamRegistration = async (
  seasonId: number,
  seasonPlatform: SeasonPlatform | null,
  appId: number,
  teamId: number,
  organizationId: number,
  teamData: InsertSeasonTeamRegistration,
  playerInsertData: InsertSeasonTeamRegistrationPlayer[],
  connection?: PoolConnection
) => {
  const playerSteamIds = playerInsertData.map((player) => player.steam_id);
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
      playerInsertData,
      connection
    )
    // Captain permissions are now handled automatically by database triggers
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

  console.log(
    "handleSignupFormForSeasonUpdate",
    captainSteamId,
    coCaptainSteamId
  );

  // Old captain/co-captain information is no longer needed since database triggers handle permission management

  await handleUpdateSeasonTeamRegistration(
    seasonId,
    teamId,
    formData.organizationId,
    {
      external_platform_id: formData.teamExternalId ?? null,
      terms_and_conditions_approved: formData.captainHasReadTermAndConditions
    },
    formData.players.map((player) => {
      return {
        steam_id: player.steamId,
        is_captain: captainSteamId === player.steamId,
        is_co_captain: coCaptainSteamId === player.steamId
      };
    }),
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

  const playerInsertData = formData.players.map((player) => {
    return {
      steam_id: player.steamId,
      is_captain: captainSteamId === player.steamId,
      is_co_captain: coCaptainSteamId === player.steamId
    };
  });

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
            external_platform_id: formData.teamExternalId,
            terms_and_conditions_approved:
              formData.captainHasReadTermAndConditions
          },
          playerInsertData,
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
            external_platform_id: formData.teamExternalId,
            terms_and_conditions_approved:
              formData.captainHasReadTermAndConditions
          },
          playerInsertData,
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
          external_platform_id: formData.teamExternalId,
          terms_and_conditions_approved:
            formData.captainHasReadTermAndConditions
        },
        playerInsertData,
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
        external_platform_id: formData.teamExternalId,
        terms_and_conditions_approved: formData.captainHasReadTermAndConditions
      },
      playerInsertData,
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
