import {
  Client,
  GatewayIntentBits,
  type Guild,
  type Role,
  ChannelType
} from "discord.js";
import { logger } from "../utils/app-logger";
import { retryWithBackoff } from "../utils/retry-utils";
import { getOrganizerByIdOrFail } from "../models/organizer.models";

const ORGANIZER_BOT_TOKEN = process.env.DISCORD_KANABOT_BOT_TOKEN;

let organizerDiscordClient: Client | null = null;

function isOrganizerDiscordConfigured(): boolean {
  return !!ORGANIZER_BOT_TOKEN;
}

const initializeOrganizerDiscordClient = async (): Promise<Client> => {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "e2e") {
    const mockClient = {
      guilds: { fetch: async () => ({}) },
      login: async () => {}
    };
    return mockClient as unknown as Client;
  }

  if (!ORGANIZER_BOT_TOKEN) {
    throw new Error(
      "DISCORD_KANALIIGA_BOT_TOKEN or DISCORD_ORGANIZER_BOT_TOKEN environment variable is required"
    );
  }

  if (organizerDiscordClient) {
    return organizerDiscordClient;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
  });

  await retryWithBackoff(
    async () => {
      await client.login(ORGANIZER_BOT_TOKEN);
    },
    {
      maxAttempts: 5,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        logger.warn(
          `Organizer Discord client login attempt ${attempt} failed, retrying...`,
          { error: error.message }
        );
      }
    }
  );

  organizerDiscordClient = client;
  logger.info("Organizer Discord client initialized");
  return client;
};

const getOrganizerDiscordClient = async (): Promise<Client | null> => {
  if (!isOrganizerDiscordConfigured()) return null;
  if (!organizerDiscordClient) {
    return await initializeOrganizerDiscordClient();
  }
  return organizerDiscordClient;
};

const getGuildById = async (guildId: string): Promise<Guild | null> => {
  const client = await getOrganizerDiscordClient();
  if (!client) return null;
  try {
    return await client.guilds.fetch(guildId);
  } catch (error) {
    logger.error(`Failed to fetch guild ${guildId}`, error);
    return null;
  }
};

export const assignCasterRoleInDiscord = async (
  guildId: string,
  discordUserId: string,
  casterRoleId: string | null
): Promise<void> => {
  const guild = await getGuildById(guildId);
  if (!guild) {
    logger.warn(`Cannot assign caster role: guild ${guildId} not found`);
    return;
  }
  try {
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) {
      logger.warn(
        `Cannot assign caster role: user ${discordUserId} not found in guild ${guildId}`
      );
      return;
    }
    let casterRole: Role | undefined;
    if (casterRoleId) {
      casterRole = guild.roles.cache.get(casterRoleId) ?? undefined;
      if (!casterRole) {
        casterRole = (await guild.roles.fetch(casterRoleId)) ?? undefined;
      }
    }
    if (!casterRole) {
      casterRole = guild.roles.cache.find(
        (r) => r.name.toLowerCase() === "caster"
      );
    }
    if (!casterRole) {
      casterRole = await guild.roles.create({
        name: "caster",
        reason: "Auto-created for caster applications"
      });
      logger.info(`Created caster role in guild ${guildId}`);
    }
    if (member.roles.cache.has(casterRole.id)) return;
    await member.roles.add(casterRole, "Caster application approved");
    logger.info(`Assigned caster role to ${discordUserId} in guild ${guildId}`);
  } catch (error) {
    logger.error(
      `Failed to assign caster role to ${discordUserId} in guild ${guildId}`,
      error
    );
  }
};

async function sendToOrganizerApplicationsChannel(
  organizerId: number,
  content: string
): Promise<void> {
  if (!isOrganizerDiscordConfigured()) return;
  try {
    const organizer = await getOrganizerByIdOrFail(organizerId);
    const channelId = organizer.discord_caster_applications_channel_id;
    if (!channelId) return;
    const guild = await getGuildById(organizer.discord_guild_id ?? "");
    if (!guild) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) return;
    await channel.send(content);
  } catch (error) {
    logger.error(
      `Failed to send message to organizer ${organizerId} applications channel`,
      error
    );
  }
}

export const notifyNewCasterApplicationInDiscord = async (
  organizerId: number,
  discordUsername: string | null,
  dashboardUrl?: string
): Promise<void> => {
  const organizer = await getOrganizerByIdOrFail(organizerId);
  const link =
    dashboardUrl ??
    `${process.env.FRONTEND_URL ?? ""}/dashboard/caster-applications`;
  const content = `New caster application from **${discordUsername ?? "unknown"}** for **${organizer.name}**. Review: ${link}`;
  await sendToOrganizerApplicationsChannel(organizerId, content);
};

export const notifyCasterApprovedInDiscord = async (
  organizerId: number,
  discordUsername: string | null,
  approvedByDisplay: string
): Promise<void> => {
  const content = `Caster application approved: **${discordUsername ?? "unknown"}** is now a caster. Approved by **${approvedByDisplay}**.`;
  await sendToOrganizerApplicationsChannel(organizerId, content);
};

export const notifyCasterRejectedInDiscord = async (
  organizerId: number,
  discordUsername: string | null,
  rejectionReason: string,
  rejectedByDisplay: string
): Promise<void> => {
  const content = `Caster application rejected: **${discordUsername ?? "unknown"}**. Reason: ${rejectionReason}. Rejected by **${rejectedByDisplay}**.`;
  await sendToOrganizerApplicationsChannel(organizerId, content);
};
