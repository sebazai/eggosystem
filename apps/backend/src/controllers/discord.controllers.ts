import { type Request, type Response } from "express";
import { logger } from "../utils/app-logger";
import { getOrganizationDiscordInfo } from "../services/discord.services";
import { getAccountById } from "../models/account.models";
import { getOrganizationById } from "../models/organization.models";
import { runQuery } from "../db/mysqlRunQuery";

// Discord webhook event types
interface DiscordWebhookData {
  user: {
    id: string;
    username: string;
    discriminator: string;
  };
  guild_id: string;
  roles?: string[];
}

// Webhook endpoint for Discord events
export const handleDiscordWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    // Handle different Discord webhook events
    switch (type) {
      case "GUILD_MEMBER_ADD":
        await handleMemberJoin(data as DiscordWebhookData);
        break;
      case "GUILD_MEMBER_UPDATE":
        await handleMemberUpdate(data as DiscordWebhookData);
        break;
      default:
        logger.info(`Unhandled Discord webhook event: ${type}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error("Error handling Discord webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle new member joining Discord
const handleMemberJoin = async (data: DiscordWebhookData) => {
  const { user, guild_id } = data;

  if (guild_id !== process.env.DISCORD_GUILD_ID) {
    return; // Not our guild
  }

  logger.info(
    `New Discord member joined: ${user.username}#${user.discriminator} (${user.id})`
  );

  // You can implement automatic role assignment logic here
  // For example, check if the user exists in our database and assign appropriate roles
  // This would require storing Discord user IDs in our database
};

// Handle member updates (role changes, etc.)
const handleMemberUpdate = async (data: DiscordWebhookData) => {
  const { user, guild_id } = data;

  if (guild_id !== process.env.DISCORD_GUILD_ID) {
    return; // Not our guild
  }

  logger.info(
    `Discord member updated: ${user.username}#${user.discriminator} (${user.id})`
  );
};

// Get Discord information for an organization
export const getOrganizationDiscordStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      res.status(400).json({ error: "organizationId is required" });
      return;
    }

    // Get organization name
    const organization = await getOrganizationById(Number(organizationId));
    if (!organization || organization.length === 0) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const organizationName = organization[0].name;

    // Get Discord info
    const discordInfo = await getOrganizationDiscordInfo(organizationName);

    res.json({
      organizationName,
      discordInfo
    });
  } catch (error) {
    logger.error("Error getting organization Discord status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user's Discord registration status
export const getUserDiscordStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const accountId = req.auth.account_id;
    const account = await getAccountById(accountId);

    // Check if user has Discord username in their profile
    const hasDiscordUsername = !!account.discord;

    // Get user's Kanahautomo registrations
    const registrations = await runQuery<
      Array<{
        organization_id: number;
        organization_name: string;
        created_at: string;
      }>
    >(
      `
      SELECT 
        kr.organization_id,
        o.name as organization_name,
        kr.created_at
      FROM KanahautomoRegistrations kr
      JOIN Organizations o ON kr.organization_id = o.id
      WHERE kr.steam_id = ?
      ORDER BY kr.created_at DESC
    `,
      [req.auth.provider_id]
    );

    res.json({
      hasDiscordUsername,
      discordUsername: account.discord,
      kanahautomoRegistrations: registrations
    });
  } catch (error) {
    logger.error("Error getting user Discord status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
