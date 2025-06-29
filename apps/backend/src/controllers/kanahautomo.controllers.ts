import { type Request, type Response } from "express";
import {
  registerPlayerForKanahautomo,
  insertKanahautomoGameTypes,
  getKanahautomoOrganizationStatusWithGameTypes
} from "../models/kanahautomo.models";
import {
  getOrganizationById,
  insertOrganization
} from "../models/organization.models";
import { logger } from "../utils/app-logger";
import { BadRequestError } from "../utils/errors";
import type { KanahautomoRegistrationResponse } from "@eggosystem/types";
import { kanahautomoSchema } from "@eggosystem/types";
import { getConnection } from "../db/mysqlConnection";
import { getAccountById } from "../models/account.models";
import {
  createOrGetOrganizationRole,
  createInviteLink,
  initializeDiscordClient,
  getDiscordGuild,
  findOrCreateOrganizationGameChannel,
  findOrCreateOrganizationGeneralChannel
} from "../services/discord.services";
import { sendDiscordInviteEmail } from "../services/email.services";

// Game type mapping from frontend keys to database structure
const GAME_TYPE_MAPPING = {
  cs: { name: "Comp", abbreviation: "CS2", game_type_name: "Comp" },
  csWingman: {
    name: "Wingman",
    abbreviation: "CS2",
    game_type_name: "Wingman"
  },
  pubgDuo: { name: "Duo", abbreviation: "PUBG", game_type_name: "Duo" },
  pubgSquad: { name: "Squad", abbreviation: "PUBG", game_type_name: "Squad" },
  rocketLeague: {
    name: "Standard",
    abbreviation: "RL",
    game_type_name: "Standard"
  },
  dota: {
    name: "Team clash",
    abbreviation: "Dota",
    game_type_name: "Team clash"
  }
} as const;

// Game type display names (for email)
const GAME_TYPE_NAMES = {
  cs: "CS2 Competitive",
  csWingman: "CS2 Wingman",
  pubgDuo: "PUBG Duo",
  pubgSquad: "PUBG Squad",
  rocketLeague: "Rocket League",
  dota: "Dota 2"
} as const;

export const registerForKanahautomoWithOrganization = async (
  req: Request,
  res: Response
) => {
  // JWT authentication ensures req.auth exists
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const steamId = req.auth.provider_id; // From JWT token

  const parsed = kanahautomoSchema.parse(req.body);
  const { organizationId, newOrganization, gameTypes, acceptedTerms } = parsed;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let finalOrganizationId: number;
    let organizationName: string;

    if (newOrganization) {
      // Create new organization
      const newOrgResult = await insertOrganization(
        newOrganization,
        connection
      );
      finalOrganizationId = newOrgResult.insertId;
      organizationName = newOrganization.name;
    } else if (organizationId && organizationId > 0) {
      // Verify existing organization exists
      const organization = await getOrganizationById(organizationId);
      if (!organization || organization.length === 0) {
        throw new BadRequestError("Organization not found");
      }
      finalOrganizationId = organizationId;
      organizationName = organization[0].name;
    } else {
      throw new BadRequestError("Invalid request: no organization specified");
    }

    // Register player for Kanahautomo
    const result = await registerPlayerForKanahautomo(
      steamId,
      finalOrganizationId,
      acceptedTerms,
      connection
    );

    // Insert selected game types
    await insertKanahautomoGameTypes(result.insertId, gameTypes, connection);

    // Get user's email for Discord invite
    const account = await getAccountById(req.auth.account_id);
    if (!account.work_email || !account.work_email_verified) {
      logger.warn(
        `User ${steamId} has no verified email, skipping Discord invite`
      );
    } else {
      try {
        // Initialize Discord client
        await initializeDiscordClient();

        // Create organization role if it doesn't exist
        await createOrGetOrganizationRole(organizationName);

        // Get selected game types
        const selectedGameTypes = Object.entries(gameTypes)
          .filter(([_, selected]) => selected)
          .map(([gameType, _]) => gameType as keyof typeof GAME_TYPE_NAMES);

        // Create channels for organization + game type combinations
        const guild = await getDiscordGuild();
        const channelIds: string[] = [];

        // Create general channel for the organization
        const generalChannel = await findOrCreateOrganizationGeneralChannel(
          guild,
          organizationName
        );
        channelIds.push(generalChannel.id);

        for (const gameType of selectedGameTypes) {
          const gameTypeData = GAME_TYPE_MAPPING[gameType];
          const channel = await findOrCreateOrganizationGameChannel(
            guild,
            organizationName,
            gameTypeData
          );
          channelIds.push(channel.id);
        }

        // Create invite link for the general channel (or fallback to first game channel)
        const inviteUrl = await createInviteLink(
          generalChannel.id ||
            channelIds[0] ||
            process.env.DISCORD_GENERAL_CHANNEL_ID!
        );

        // Send Discord invite email
        const gameTypeNames = selectedGameTypes.map(
          (gameType) => GAME_TYPE_NAMES[gameType]
        );
        await sendDiscordInviteEmail(
          account.work_email,
          organizationName,
          inviteUrl,
          gameTypeNames
        );

        logger.info(
          `Discord setup completed for ${steamId} in organization ${organizationName}. Created general channel + ${channelIds.length - 1} game channels and sent invite email.`
        );
      } catch (discordError) {
        logger.error(
          `Discord integration failed for user ${steamId}:`,
          discordError
        );
        // Don't fail the registration if Discord integration fails
        // The user can still register and we can handle Discord setup later
      }
    }

    const response: KanahautomoRegistrationResponse = {
      message: "Successfully registered for Kanahautomo",
      registrationId: result.insertId,
      organizationId: finalOrganizationId
    };

    logger.info(
      `Player ${steamId} registered for Kanahautomo in organization ${finalOrganizationId} with game types: ${Object.entries(
        gameTypes
      )
        .filter(([_, selected]) => selected)
        .map(([gameType, _]) => gameType)
        .join(", ")}`
    );

    await connection.commit();
    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    logger.error(`Error registering for Kanahautomo: ${error}`);

    // Handle duplicate entry error gracefully
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      res.status(400).json({
        error: "Player is already registered for this organization"
      });
      return;
    }

    throw error;
  } finally {
    connection.release();
  }
};

export const getKanahautomoOrganizationStatus = async (
  req: Request,
  res: Response
) => {
  const data = await getKanahautomoOrganizationStatusWithGameTypes();
  res.json({ organizations: data });
};
