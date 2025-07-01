import {
  Client,
  GatewayIntentBits,
  ChannelType,
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

// Initialize Discord client
export const initializeDiscordClient = async (): Promise<Client> => {
  // If in e2e test environment, return a mock client
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info("E2E test environment detected, using mock Discord client");
    const mockClient = {
      login: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      guilds: {
        fetch: jest.fn().mockResolvedValue({
          id: "mock-guild-id",
          name: "Mock Guild",
          roles: {
            cache: new Map(),
            create: jest.fn().mockResolvedValue({
              id: "mock-role-id",
              name: "Mock Role"
            })
          },
          channels: {
            cache: new Map(),
            create: jest.fn().mockResolvedValue({
              id: "mock-channel-id",
              name: "Mock Channel"
            })
          }
        })
      }
    };
    return mockClient as unknown as Client;
  }

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
    return await initializeDiscordClient();
  }
  return discordClient;
};

// Get Discord guild
export const getDiscordGuild = async (): Promise<Guild> => {
  const client = await getDiscordClient();

  // If in e2e test environment, return mock guild
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    return {
      id: "mock-guild-id",
      name: "Mock Guild",
      roles: {
        cache: new Map(),
        create: jest.fn().mockResolvedValue({
          id: "mock-role-id",
          name: "Mock Role"
        })
      },
      channels: {
        cache: new Map(),
        create: jest.fn().mockResolvedValue({
          id: "mock-channel-id",
          name: "Mock Channel"
        })
      }
    } as unknown as Guild;
  }

  return await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
};

// Create or get organization role
export const createOrGetOrganizationRole = async (
  organizationName: string
): Promise<string> => {
  // If in e2e test environment, return mock role ID
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info(`Mock: Creating organization role for ${organizationName}`);
    return "mock-role-id";
  }

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
    color: generateRandomColor(),
    reason: `Role created for organization: ${organizationName}`,
    permissions: []
  });

  logger.info(`Created new organization role: ${newRole.name} (${newRole.id})`);
  return newRole.id;
};

// Find or create organization category
const findOrCreateOrganizationCategory = async (
  guild: Guild,
  organizationName: string
) => {
  const cleanOrgName = organizationName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim()
    .substring(0, 30);

  // Check if category already exists
  let category = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === cleanOrgName.toLowerCase()
  );

  if (!category) {
    category = await guild.channels.create({
      name: cleanOrgName,
      type: ChannelType.GuildCategory,
      reason: `Category created for organization: ${organizationName}`
    });
    logger.info(`Created new organization category: ${category.name}`);
  }

  return category;
};

// Create invite link for a channel
export const createInviteLink = async (channelId: string): Promise<string> => {
  // If in e2e test environment, return mock invite link
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info(`Mock: Creating invite link for channel ${channelId}`);
    return "https://discord.gg/mock-invite";
  }

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
    maxAge: 0, // Never expire
    maxUses: 1,
    unique: true
  });

  logger.info(`Created invite link: ${invite.url}`);
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
export const getUserOrganizationData = async (
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
      FROM LinkedAccounts la
      JOIN Accounts a ON la.account_id = a.id
      JOIN SteamPlayers sp ON a.id = sp.account_id
      JOIN KanahautomoRegistrations khr ON sp.steam_id = khr.steam_id
      JOIN Organizations o ON khr.organization_id = o.id
      JOIN KanahautomoRegistrationGameTypes krgt ON khr.id = krgt.kanahautomo_registration_id
      JOIN GameTypes gt ON krgt.game_type_id = gt.id
      JOIN Games g ON gt.game_id = g.id
      WHERE la.provider = 'discord' AND la.provider_id = ?
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
  // If in e2e test environment, return mock channel
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info(
      `Mock: Creating game channel for ${organizationName} - ${gameType.abbreviation}`
    );
    return {
      id: "mock-channel-id",
      name: "mock-game-channel"
    } as unknown as TextChannel;
  }

  // Clean names for channel name (Discord has restrictions)
  const cleanOrgName = organizationName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim()
    .substring(0, 30); // Increased from 20 to 30 characters

  const cleanGameAbbrev = gameType.abbreviation
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim()
    .substring(0, 10);

  // Changed: Only use organization name and game abbreviation (no game type)
  const channelName = `${cleanOrgName}-${cleanGameAbbrev}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Try to find existing channel
  let channel = guild.channels.cache.find(
    (ch) => ch.type === 0 && ch.name === channelName
  ) as TextChannel;

  if (!channel) {
    // Get or create the organization role
    const orgRole = await findOrCreateOrganizationRole(guild, organizationName);

    // Get or create organization category
    const category = await findOrCreateOrganizationCategory(
      guild,
      organizationName
    );

    // Create new channel with only organization role permissions (no game role)
    channel = await guild.channels.create({
      name: channelName,
      type: 0, // Text channel
      parent: category.id, // Assign to organization category
      topic: `Channel for ${organizationName} - ${gameType.abbreviation} players`,
      reason: `Auto-created channel for ${organizationName} - ${gameType.abbreviation}`,
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
        }
        // Removed: Game role permissions are no longer added to organization channels
      ]
    });
    logger.info(
      `Created new channel: ${channelName} for ${organizationName} - ${gameType.abbreviation} with organization-only permissions in category: ${category.name}`
    );
  }

  return channel;
};

// Create channels for organization + game combinations (one per game, not per game type)
const createOrganizationGameChannels = async (
  guild: Guild,
  userData: UserOrganizationData
): Promise<void> => {
  try {
    // Create general channel for the organization
    await findOrCreateOrganizationGeneralChannel(
      guild,
      userData.organization_name
    );

    // Group game types by game abbreviation to create one channel per game
    const gameChannelsToCreate = new Map<
      string,
      { name: string; abbreviation: string; game_type_name: string }
    >();

    for (const gameType of userData.game_types) {
      if (!gameChannelsToCreate.has(gameType.abbreviation)) {
        gameChannelsToCreate.set(gameType.abbreviation, gameType);
      }
    }

    // Create one channel per unique game (not per game type)
    for (const gameType of gameChannelsToCreate.values()) {
      await findOrCreateOrganizationGameChannel(
        guild,
        userData.organization_name,
        gameType
      );
    }

    const uniqueGames = Array.from(gameChannelsToCreate.values()).map(
      (gt) => gt.abbreviation
    );
    logger.info(
      `Created/verified channels for ${userData.organization_name} - General + ${uniqueGames.join(", ")}`
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
      // Get unique games for the welcome message
      const uniqueGames = Array.from(
        new Set(userData.game_types.map((gt) => gt.abbreviation))
      );

      await (welcomeChannel as TextChannel).send({
        content: `Welcome <@${member.id}>! You've been automatically assigned roles for **${userData.organization_name}** and your games: **${uniqueGames.join(", ")}**. Check out your organization's general channel and game channels in the **${userData.organization_name}** category!`
      });
    }
  } catch (error) {
    logger.error(`Error assigning roles to ${member.user.tag}:`, error);
  }
};

// Setup Discord event handlers for automatic role assignment
export const setupDiscordEventHandlers = async (): Promise<void> => {
  // If in e2e test environment, skip event handler setup
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info(
      "E2E test environment detected, skipping Discord event handlers"
    );
    return;
  }

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

// Find or create organization general channel
export const findOrCreateOrganizationGeneralChannel = async (
  guild: Guild,
  organizationName: string
): Promise<TextChannel> => {
  // If in e2e test environment, return mock channel
  if (process.env.NODE_ENV === "e2e" || process.env.TEST_TYPE === "e2e") {
    logger.info(`Mock: Creating general channel for ${organizationName}`);
    return {
      id: "mock-general-channel-id",
      name: "mock-general-channel"
    } as unknown as TextChannel;
  }

  const cleanOrgName = organizationName
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .trim()
    .substring(0, 30);

  const channelName = `${cleanOrgName}-general`
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Try to find existing general channel
  let channel = guild.channels.cache.find(
    (ch) => ch.type === 0 && ch.name === channelName
  ) as TextChannel;

  if (!channel) {
    // Get or create the organization role
    const orgRole = await findOrCreateOrganizationRole(guild, organizationName);

    // Get or create organization category
    const category = await findOrCreateOrganizationCategory(
      guild,
      organizationName
    );

    // Create new general channel
    channel = await guild.channels.create({
      name: channelName,
      type: 0, // Text channel
      parent: category.id, // Assign to organization category
      topic: `General discussion channel for ${organizationName} members`,
      reason: `Auto-created general channel for organization: ${organizationName}`,
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
        }
      ]
    });
    logger.info(
      `Created new general channel: ${channelName} for ${organizationName} in category: ${category.name}`
    );
  }

  return channel;
};
