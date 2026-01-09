import { type PoolConnection } from "mysql2/promise";
import {
  type SeasonDetails,
  type SignupFormValues,
  type InsertSeasonTeamRegistration,
  SeasonPlatform,
  type UpdateSeasonTeamRegistration,
  type PlayerDetailsBySteamId,
  type InsertSeasonTeamRegistrationPlayer,
  type UpdateSeasonTeamRegistrationPlayer,
  isFaceITCSRank
} from "@eggosystem/types";
import {
  insertSeasonTeamRegistration,
  updatePlayersForSeasonTeamRegistration,
  updateSeasonTeamRegistration
} from "../models/season-team-registration.models";

import {
  insertOrganization,
  updateOrganizationLogo,
  getOrganizationById
} from "../models/organization.models";
import {
  getTeamWithIdWithoutOrg,
  insertTeam,
  getTeamById
} from "../models/team.models";
import { isTeamPartOfOrganization } from "./team.services";
import { getPlayerDetailsBySteamId } from "../models/player.models";
import { insertPlayerRankForSeason } from "../models/season-player-ranks.models";
import { isPlayerApprovedForSeasonManually } from "../models/season-team-players.models";
import { getSeasonDetailsById } from "../models/season.models";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { getFaceITTeamDetails, fetchFaceitPlayerData } from "./faceit.services";
import {
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId,
  getPlayerRankForPlatform
} from "./player-ranks.services";
import { runQuery } from "../db/mysqlRunQuery";
import { insertSeasonTeamRegistrationPlayer } from "../models/season-team-registration-player.models";
import { updateSteamPlayerFaceitData } from "../models/player.models";
import { logger } from "../utils/app-logger";
import { sendSeasonCaptainWelcomeEmail } from "./email.services";
import { uploadSignupImage } from "./signup-image-upload.services";

/**
 * Create an organization during signup with pending status
 * This allows admins to pre-approve players before signup completion
 */
export const createOrganizationForSignup = async (
  organizationData: {
    name: string;
    organization_code: string;
    website: string;
    image_data?: string;
    image_filename?: string;
  },
  connection?: PoolConnection
) => {
  const newOrg = await insertOrganization(
    {
      name: organizationData.name,
      organization_code: organizationData.organization_code,
      website: organizationData.website,
      status: "pending"
    },
    connection
  );

  // Upload organization logo if provided
  if (organizationData.image_data) {
    try {
      const imageResult = await uploadSignupImage(
        organizationData.image_data,
        organizationData.image_filename,
        "organization",
        newOrg.insertId
      );
      await updateOrganizationLogo(
        newOrg.insertId,
        imageResult.phash,
        connection
      );
      logger.info(
        `Uploaded organization logo during early signup: orgId=${newOrg.insertId}, phash=${imageResult.phash}`
      );
    } catch (imageError) {
      // Log error but don't fail organization creation for image upload issues
      logger.warn(
        `Failed to upload organization logo during early signup: ${imageError}`
      );
    }
  }

  return newOrg;
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

/**
 * Update FaceIT nickname and ID for players when platform is FaceIT
 */
const updatePlayersFaceitData = async (
  platform: SeasonPlatform | null,
  playerSteamIds: string[],
  connection?: PoolConnection
): Promise<void> => {
  if (platform !== SeasonPlatform.FACEIT) {
    return;
  }

  for (const steamId of playerSteamIds) {
    try {
      const faceitData = await fetchFaceitPlayerData(steamId, "cs2");
      if (faceitData && faceitData.nickname && faceitData.player_id) {
        await updateSteamPlayerFaceitData(
          steamId,
          faceitData.nickname,
          faceitData.player_id,
          connection
        );
        logger.info(
          `Updated FaceIT data for player ${steamId}: ${faceitData.nickname} (${faceitData.player_id})`
        );
      }
    } catch (error) {
      // Log error but don't fail if FaceIT data fetch fails
      logger.warn(`Failed to fetch FaceIT data for player ${steamId}:`, error);
    }
  }
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
      "faceit_elo" in externalRank &&
      externalRank.faceit_elo === -1 &&
      platform !== SeasonPlatform.Kanaliiga
    ) {
      throw new BadRequestError(
        `Player ${player.steam_id} has no ${platform} rank.`
      );
    }

    await insertPlayerRankForSeason(
      player.steam_id,
      seasonId,
      rank.average_rank,
      hours,
      isFaceITCSRank(externalRank)
        ? externalRank
        : {
            faceit_elo: undefined,
            faceit_level: undefined,
            faceit_kd: undefined,
            faceit_date: undefined
          },
      { connection }
    );

    // Fetch and save FaceIT nickname and ID when platform is FaceIT
    if (platform === SeasonPlatform.FACEIT) {
      try {
        const faceitData = await fetchFaceitPlayerData(player.steam_id, "cs2");
        if (faceitData && faceitData.nickname && faceitData.player_id) {
          await updateSteamPlayerFaceitData(
            player.steam_id,
            faceitData.nickname,
            faceitData.player_id,
            connection
          );
          logger.info(
            `Updated FaceIT data for player ${player.steam_id}: ${faceitData.nickname} (${faceitData.player_id})`
          );
        }
      } catch (error) {
        // Log error but don't fail the signup if FaceIT data fetch fails
        logger.warn(
          `Failed to fetch FaceIT data for player ${player.steam_id}:`,
          error
        );
      }
    }
  }
};

const isValidExternalId = async (platform: SeasonPlatform, id?: string) => {
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
  playerSteamIds: string[],
  connection?: PoolConnection
) => {
  // await ensurePlayerSteamProfilesPublic(playerSteamIds);
  const data = await Promise.all(
    playerSteamIds.map((steamId) =>
      getPlayerDetailsBySteamId(steamId, connection)
    )
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
    if (!playerData.work_email_verified) {
      throw new BadRequestError(
        `Player ${playerData.steam_id} has not verified e-mail their e-mail.`
      );
    }
    if (!playerData.is_valid_full_name) {
      throw new BadRequestError(
        `Player ${playerData.steam_id} profile data missing.`
      );
    }
    if (!playerData.is_valid_work_email) {
      const manuallyApprovedPlayer = await isPlayerApprovedForSeasonManually(
        seasonId,
        playerData.steam_id,
        teamId,
        organizationId,
        connection
      );
      if (!manuallyApprovedPlayer.approved_by_organizer) {
        throw new BadRequestError(
          `Player ${playerData.steam_id} does not have valid work e-mail and has not been approved by organizer. Contact the organizer in Discord.`
        );
      }
    }
  }
};

const handleUpdateSeasonTeamRegistration = async (
  seasonId: number,
  teamId: number,
  organizationId: number,
  teamData: UpdateSeasonTeamRegistration,
  playerUpdateData: UpdateSeasonTeamRegistrationPlayer[],
  connection?: PoolConnection
) => {
  const playerSteamIds = playerUpdateData.map((player) => player.steam_id);

  // Get season to check platform
  const season = await getSeasonDetailsById(seasonId);

  await Promise.all([
    validatePlayersFromDBForSignup(
      seasonId,
      teamId,
      organizationId,
      playerSteamIds,
      connection
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

  // Update FaceIT data for players when platform is FaceIT
  if (season) {
    await updatePlayersFaceitData(season.platform, playerSteamIds, connection);
  }
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
      playerSteamIds,
      connection
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

  // Send welcome email to captain after successful registration
  const captainPlayer = playerInsertData.find((player) => player.is_captain);
  if (captainPlayer) {
    const { captainEmail, players } = await getCaptainEmailAndPlayers(
      captainPlayer.steam_id,
      playerSteamIds,
      connection
    );
    if (captainEmail) {
      const team = await getTeamById(teamId);
      const teamName = team[0]?.name || "Your Team";
      sendSeasonCaptainWelcomeEmail(
        captainEmail,
        seasonId,
        players,
        teamName
      ).catch((error) => {
        logger.error("Failed to send captain welcome email", error);
      });
    }
  }
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

/**
 * Get captain email and player list for welcome email
 */
const getCaptainEmailAndPlayers = async (
  captainSteamId: string,
  playerSteamIds: string[],
  connection?: PoolConnection
): Promise<{
  captainEmail: string | null;
  players: Array<{ nickname: string; steam_id: string }>;
}> => {
  // Get captain email
  const captainResult = await runQuery<Array<{ work_email: string | null }>>(
    `SELECT a.work_email 
     FROM Accounts a 
     JOIN SteamPlayers sp ON a.id = sp.account_id 
     WHERE sp.steam_id = ?`,
    [captainSteamId],
    connection
  );

  const captainEmail = captainResult[0]?.work_email ?? null;

  // Get all players' nicknames and steam_ids
  const playersResult = await runQuery<
    Array<{ nickname: string; steam_id: string | number }>
  >(
    `SELECT nickname, steam_id 
     FROM SteamPlayers 
     WHERE steam_id IN (${playerSteamIds.map(() => "?").join(", ")})`,
    playerSteamIds,
    connection
  );

  return {
    captainEmail,
    players: playersResult.map((player) => ({
      nickname: player.nickname,
      steam_id: String(player.steam_id)
    }))
  };
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

  // Handle new organization creation
  // If newOrganization is present, organization was already created when user moved from Organization tab to Team tab
  if (formData.newOrganization) {
    if (formData.organizationId <= 0) {
      throw new BadRequestError(
        "Organization must be created before signup submission"
      );
    }

    // Organization was already created, use it
    const newOrg = { insertId: formData.organizationId };
    logger.info(
      `Using pre-created pending organization: orgId=${formData.organizationId}`
    );

    // Upload organization logo if provided and not already uploaded
    if (formData.newOrganization.image_data) {
      // Check if logo already exists
      const orgLogoCheck = await runQuery<Array<{ logo: string }>>(
        "SELECT logo FROM Organizations WHERE id = ?",
        [newOrg.insertId],
        connection
      );
      const hasLogo =
        orgLogoCheck.length > 0 &&
        orgLogoCheck[0].logo &&
        orgLogoCheck[0].logo !== "nologo.png";

      if (!hasLogo) {
        try {
          const imageResult = await uploadSignupImage(
            formData.newOrganization.image_data,
            formData.newOrganization.image_filename,
            "organization",
            newOrg.insertId
          );
          await updateOrganizationLogo(
            newOrg.insertId,
            imageResult.phash,
            connection
          );
          logger.info(
            `Uploaded organization logo during signup: orgId=${newOrg.insertId}, phash=${imageResult.phash}`
          );
        } catch (imageError) {
          // Log error but don't fail signup for image upload issues
          logger.warn(
            `Failed to upload organization logo during signup: ${imageError}`
          );
        }
      }
    }

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
      // Determine team logo if image was uploaded
      let teamLogo: string | undefined;
      if (formData.newTeam.image_data) {
        try {
          const imageResult = await uploadSignupImage(
            formData.newTeam.image_data,
            formData.newTeam.image_filename,
            "team",
            0 // Temporary ID, will be updated after insert
          );
          teamLogo = imageResult.phash;
        } catch (imageError) {
          logger.warn(
            `Failed to upload team logo during signup: ${imageError}`
          );
        }
      }

      const newTeam = await insertTeam(
        {
          name: formData.newTeam.name,
          organization_id: newOrg.insertId,
          org_approved: true,
          team_logo: teamLogo
        },
        connection
      );

      if (teamLogo) {
        logger.info(
          `Uploaded team logo during signup: teamId=${newTeam.insertId}, phash=${teamLogo}`
        );
      }

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

  // Handle existing org and new team
  if (formData.organizationId !== -1) {
    if (formData.teamId === -1 && formData.newTeam) {
      // Determine team logo if image was uploaded
      let teamLogo: string | undefined;
      if (formData.newTeam.image_data) {
        try {
          const imageResult = await uploadSignupImage(
            formData.newTeam.image_data,
            formData.newTeam.image_filename,
            "team",
            0 // Temporary ID, will be updated after insert
          );
          teamLogo = imageResult.phash;
        } catch (imageError) {
          logger.warn(
            `Failed to upload team logo during signup: ${imageError}`
          );
        }
      } else {
        // If no team image provided, default to organization logo
        const [org] = await getOrganizationById(formData.organizationId);
        if (org?.logo) {
          teamLogo = org.logo;
          logger.info(
            `Defaulting team logo to organization logo: orgId=${formData.organizationId}, phash=${teamLogo}`
          );
        }
      }

      const newTeam = await insertTeam(
        {
          name: formData.newTeam.name,
          organization_id: formData.organizationId,
          org_approved: false,
          team_logo: teamLogo
        },
        connection
      );

      if (teamLogo) {
        logger.info(
          `Team logo set during signup: teamId=${newTeam.insertId}, phash=${teamLogo}`
        );
      }

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
  // This includes pending organizations created early
  if (
    formData.organizationId !== -1 &&
    formData.organizationId > 0 &&
    formData.teamId !== -1 &&
    formData.teamId > 0 &&
    !formData.newOrganization // Not creating new org
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
