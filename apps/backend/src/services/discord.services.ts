import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  Events,
  TextChannel,
  NewsChannel,
  type Guild,
  type Role,
  type GuildMember,
  PermissionsBitField
} from "discord.js";
import { logger } from "../utils/app-logger";
import { runQuery } from "../db/mysqlRunQuery";

// Discord client instance
let discordClient: Client | null = null;
let eventHandlersSetup = false; // Flag to prevent duplicate event handler setup

// Game type to channel name mapping
const GAME_CHANNEL_MAPPING = {
  cs: "cs2",
  csWingman: "cs2-wingman",
  pubgDuo: "pubg-duo",
  pubgSquad: "pubg-squad",
  rocketLeague: "rocket-league",
  dota: "dota2"
} as const;

// Initialize Discord client
export const initializeDiscordClient = async (): Promise<Client> => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN environment variable is required");
  }

  if (!process.env.DISCORD_GUILD_ID) {
    throw new Error("DISCORD_GUILD_ID environment variable is required");
  }

  if (discordClient) {
    return discordClient;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages
    ]
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
  discordClient = client;

  logger.info("Discord client initialized");
  return client;
};

// Get Discord client instance
export const getDiscordClient = async (): Promise<Client> => {
  if (!discordClient) {
    return initializeDiscordClient();
  }
  return discordClient;
};

// Get Discord guild instance
export const getDiscordGuild = async (): Promise<Guild> => {
  const client = await getDiscordClient();
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
  return guild;
};

// Create or get organization role
export const createOrGetOrganizationRole = async (
  organizationName: string
): Promise<string> => {
  const client = await getDiscordClient();
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);

  // Check if role already exists
  const existingRole = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === organizationName.toLowerCase()
  );

  if (existingRole) {
    logger.info(`Organization role already exists: ${existingRole.name}`);
    return existingRole.id;
  }

  // Create new role
  const newRole = await guild.roles.create({
    name: organizationName,
    color: 0x00ff00, // Green color
    reason: `Role created for organization: ${organizationName}`,
    permissions: []
  });

  logger.info(`Created new organization role: ${newRole.name} (${newRole.id})`);
  return newRole.id;
};

// Create or get game channel
export const createOrGetGameChannel = async (
  gameType: keyof typeof GAME_CHANNEL_MAPPING,
  organizationName: string
): Promise<string> => {
  const client = await getDiscordClient();
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);

  const channelName = `${organizationName}-${GAME_CHANNEL_MAPPING[gameType]}`;
  const categoryName = `${organizationName}`;

  // Check if channel already exists
  const existingChannel = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      channel.name.toLowerCase() === channelName.toLowerCase()
  );

  if (existingChannel) {
    logger.info(`Game channel already exists: ${existingChannel.name}`);
    return existingChannel.id;
  }

  // Get or create organization category
  let category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!category) {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      reason: `Category created for organization: ${organizationName}`
    });
    logger.info(`Created new organization category: ${category.name}`);
  }

  // Create new game channel
  const newChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    reason: `Channel created for ${gameType} in organization: ${organizationName}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: await createOrGetOrganizationRole(organizationName),
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages
        ]
      }
    ]
  });

  logger.info(
    `Created new game channel: ${newChannel.name} (${newChannel.id})`
  );
  return newChannel.id;
};

// Create invite link for a channel
export const createInviteLink = async (channelId: string): Promise<string> => {
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(channelId);

  if (!channel || !channel.isTextBased() || channel.isDMBased()) {
    throw new Error(`Invalid channel ID: ${channelId}`);
  }

  // Check if it's a text channel or news channel that supports invites
  if (!(channel instanceof TextChannel || channel instanceof NewsChannel)) {
    throw new Error(`Channel ${channelId} does not support invite creation`);
  }

  const invite = await channel.createInvite({
    maxAge: 0, // Never expires
    maxUses: 0, // Unlimited uses
    unique: true,
    reason: "Invite link for Kanahautomo registration"
  });

  logger.info(`Created invite link for channel ${channel.name}: ${invite.url}`);
  return invite.url;
};

// Interface for user data from database
interface UserOrganizationData {
  account_id: number;
  steam_id: string;
  organization_name: string;
  game_types: Array<{
    name: string;
    abbreviation: string;
    game_type_name: string;
  }>;
}

// Get user's organization and game data from database
const getUserOrganizationData = async (
  discordUserId: string
): Promise<UserOrganizationData | null> => {
  try {
    const [userData] = await runQuery<
      {
        account_id: number;
        steam_id: string;
        organization_name: string;
        game_types: string;
      }[]
    >(
      `
      SELECT 
        a.id as account_id,
        sp.steam_id,
        o.name as organization_name,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', gt.name,
            'abbreviation', g.abbreviation,
            'game_type_name', gt.name
          )
        ) as game_types
      FROM Accounts a
      JOIN SteamPlayers sp ON a.id = sp.account_id
      JOIN KanahautomoRegistrations khr ON sp.steam_id = khr.steam_id
      JOIN Organizations o ON khr.organization_id = o.id
      JOIN KanahautomoRegistrationGameTypes krgt ON khr.id = krgt.kanahautomo_registration_id
      JOIN GameTypes gt ON krgt.game_type_id = gt.id
      JOIN Games g ON gt.game_id = g.id
      WHERE a.discord_user_id = ?
      GROUP BY a.id, sp.steam_id, o.name
    `,
      [discordUserId]
    );

    if (!userData) {
      logger.info(
        `No Kanahautomo registration found for Discord user: ${discordUserId}`
      );
      return null;
    }

    // Parse the JSON array of game types
    const gameTypes =
      typeof userData.game_types === "string"
        ? JSON.parse(userData.game_types)
        : userData.game_types;

    return {
      ...userData,
      game_types: gameTypes
    };
  } catch (error) {
    logger.error(
      `Error fetching user organization data for Discord user ${discordUserId}:`,
      error
    );
    return null;
  }
};

// Generate a random hex color
const generateRandomColor = (): number => {
  return Math.floor(Math.random() * 0xffffff);
};

// Find or create organization role
const findOrCreateOrganizationRole = async (
  guild: Guild,
  organizationName: string
): Promise<Role> => {
  // Clean organization name for role name (Discord has restrictions)
  const roleName = organizationName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim()
    .substring(0, 100); // Discord role name limit

  // Try to find existing role
  let role = guild.roles.cache.find((r) => r.name === roleName);

  if (!role) {
    // Create new role with random color
    const randomColor = generateRandomColor();

    role = await guild.roles.create({
      name: roleName,
      color: randomColor, // Random color
      reason: `Auto-created role for organization: ${organizationName}`
    });
    logger.info(
      `Created new organization role: ${roleName} with color: #${randomColor.toString(16).padStart(6, "0")}`
    );
  }

  return role;
};

// Find or create game role
const findOrCreateGameRole = async (
  guild: Guild,
  gameType: { name: string; abbreviation: string; game_type_name: string }
): Promise<Role> => {
  // Create role name using abbreviation and game type
  const roleName = `${gameType.abbreviation} ${gameType.game_type_name}`;

  // Try to find existing role
  let role = guild.roles.cache.find((r) => r.name === roleName);

  if (!role) {
    // Create new role with different color
    const colors = [0xe8b4b8, 0xb4e8b8, 0xb4b8e8, 0xe8e8b4, 0xe8b4e8, 0xb4e8e8]; // Pastel colors: Pink, Green, Blue, Yellow, Magenta, Cyan
    const colorIndex = guild.roles.cache.size % colors.length;

    role = await guild.roles.create({
      name: roleName,
      color: colors[colorIndex],
      reason: `Auto-created role for game type: ${gameType.abbreviation} ${gameType.game_type_name}`
    });
    logger.info(`Created new game role: ${roleName}`);
  }

  return role;
};

// Find or create organization + game type channel
export const findOrCreateOrganizationGameChannel = async (
  guild: Guild,
  organizationName: string,
  gameType: { name: string; abbreviation: string; game_type_name: string }
): Promise<TextChannel> => {
  // Clean names for channel name (Discord has restrictions)
  const cleanOrgName = organizationName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim()
    .substring(0, 30); // Increased from 20 to 30 characters

  const cleanGameAbbrev = gameType.abbreviation
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim()
    .substring(0, 10);

  const cleanGameType = gameType.game_type_name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .substring(0, 15);

  const channelName = `${cleanOrgName}-${cleanGameAbbrev}-${cleanGameType}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Try to find existing channel
  let channel = guild.channels.cache.find(
    (ch) => ch.type === 0 && ch.name === channelName
  ) as TextChannel;

  if (!channel) {
    // Get or create the organization role
    const orgRole = await findOrCreateOrganizationRole(guild, organizationName);

    // Get or create the game type role
    const gameRole = await findOrCreateGameRole(guild, gameType);

    // Create new channel with proper permissions
    channel = await guild.channels.create({
      name: channelName,
      type: 0, // Text channel
      topic: `Channel for ${organizationName} - ${gameType.abbreviation} ${gameType.game_type_name} players`,
      reason: `Auto-created channel for ${organizationName} - ${gameType.abbreviation} ${gameType.game_type_name}`,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone role
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: orgRole.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        },
        {
          id: gameRole.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });
    logger.info(
      `Created new channel: ${channelName} for ${organizationName} - ${gameType.abbreviation} ${gameType.game_type_name} with proper permissions`
    );
  }

  return channel;
};

// Create channels for organization + game type combinations
const createOrganizationGameChannels = async (
  guild: Guild,
  userData: UserOrganizationData
): Promise<void> => {
  try {
    for (const gameType of userData.game_types) {
      await findOrCreateOrganizationGameChannel(
        guild,
        userData.organization_name,
        gameType
      );
    }
    logger.info(
      `Created/verified channels for ${userData.organization_name} - ${userData.game_types.map((gt) => `${gt.abbreviation} ${gt.game_type_name}`).join(", ")}`
    );
  } catch (error) {
    logger.error(
      `Error creating channels for ${userData.organization_name}:`,
      error
    );
  }
};

// Assign roles to member
const assignRolesToMember = async (
  member: GuildMember,
  userData: UserOrganizationData
): Promise<void> => {
  try {
    const rolesToAssign: Role[] = [];

    // Get organization role
    const orgRole = await findOrCreateOrganizationRole(
      member.guild,
      userData.organization_name
    );
    rolesToAssign.push(orgRole);

    // Get game type roles
    for (const gameType of userData.game_types) {
      const gameRole = await findOrCreateGameRole(member.guild, gameType);
      rolesToAssign.push(gameRole);
    }

    // Create channels for organization + game type combinations
    await createOrganizationGameChannels(member.guild, userData);

    // Assign all roles
    await member.roles.add(
      rolesToAssign,
      `Auto-assigned roles for Kanahautomo user: ${userData.steam_id}`
    );

    logger.info(
      `Assigned roles to ${member.user.tag}: ${rolesToAssign.map((r) => r.name).join(", ")}`
    );

    // Send welcome message
    const welcomeChannel =
      member.guild.systemChannel ||
      member.guild.channels.cache.find(
        (ch) => ch.type === 0 && ch.name.includes("general")
      );
    if (welcomeChannel && welcomeChannel.type === 0) {
      // TextChannel
      await (welcomeChannel as TextChannel).send({
        content: `Welcome <@${member.id}>! You've been automatically assigned roles for **${userData.organization_name}** and your game types: **${userData.game_types.map((gt) => `${gt.abbreviation} ${gt.game_type_name}`).join(", ")}**. Check out your organization's game-specific channels!`
      });
    }
  } catch (error) {
    logger.error(`Error assigning roles to ${member.user.tag}:`, error);
  }
};

// Setup Discord event handlers for automatic role assignment
export const setupDiscordEventHandlers = async (): Promise<void> => {
  logger.info(
    `setupDiscordEventHandlers called. eventHandlersSetup flag: ${eventHandlersSetup}`
  );

  // Prevent duplicate event handler setup
  if (eventHandlersSetup) {
    logger.info("Discord event handlers already set up, skipping");
    return;
  }

  const client = await getDiscordClient();

  client.on(Events.GuildMemberAdd, async (member) => {
    logger.info(`New member joined: ${member.user.tag} (${member.id})`);

    try {
      // Get user's organization and game data
      const userData = await getUserOrganizationData(member.id);

      if (userData) {
        logger.info(
          `Found Kanahautomo registration for ${member.user.tag}: ${userData.organization_name} - ${userData.game_types.map((gt) => `${gt.abbreviation} ${gt.game_type_name}`).join(", ")}`
        );

        // Assign appropriate roles
        await assignRolesToMember(member, userData);
      } else {
        logger.info(
          `No Kanahautomo registration found for ${member.user.tag} (${member.id})`
        );
      }
    } catch (error) {
      logger.error(`Error processing new member ${member.user.tag}:`, error);
    }
  });

  eventHandlersSetup = true;
  logger.info(
    `Discord event handlers set up successfully. eventHandlersSetup flag set to: ${eventHandlersSetup}`
  );
};
