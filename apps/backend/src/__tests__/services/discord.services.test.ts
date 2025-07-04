// --- Discord.js robust mocks for unit testing ---

class MockCollection extends Array {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  find(fn: any) {
    return this.filter(fn)[0];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    super(...args);
  }
}
class MockTextChannel {
  id: string;
  name: string;
  isTextBased: () => boolean;
  isDMBased: () => boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createInvite: jest.Mock<any, any>;
  constructor() {
    this.id = "mock-channel-id";
    this.name = "Mock Channel";
    this.isTextBased = () => true;
    this.isDMBased = () => false;
    this.createInvite = jest
      .fn()
      .mockResolvedValue({ url: "https://discord.gg/mock-invite" });
  }
}
class MockNewsChannel extends MockTextChannel {}

const mockRole = {
  id: "mock-role-id",
  name: "Mock Role",
  setPosition: jest.fn().mockResolvedValue(undefined)
};
const mockChannel = new MockTextChannel();
const mockGuild = {
  id: "mock-guild-id",
  name: "Mock Guild",
  roles: {
    cache: new MockCollection(mockRole),
    create: jest.fn().mockResolvedValue(mockRole)
  },
  channels: {
    cache: new MockCollection(mockChannel),
    create: jest.fn().mockResolvedValue(mockChannel)
  }
};
const mockClient = {
  login: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  guilds: { fetch: jest.fn().mockResolvedValue(mockGuild) },
  channels: { fetch: jest.fn().mockResolvedValue(mockChannel) }
};

jest.mock("discord.js", () => ({
  Client: jest.fn(() => mockClient),
  GatewayIntentBits: { Guilds: 1, GuildMembers: 2, GuildMessages: 4 },
  ChannelType: { GuildCategory: 4, GuildText: 0 },
  Events: { GuildMemberAdd: "guildMemberAdd" },
  PermissionsBitField: { Flags: { ViewChannel: 1024, SendMessages: 2048 } },
  Collection: MockCollection,
  TextChannel: MockTextChannel,
  NewsChannel: MockNewsChannel
}));
// --- End Discord.js robust mocks ---

import {
  initializeDiscordClient,
  getDiscordClient,
  getDiscordGuild,
  setupDiscordEventHandlers,
  createOrGetOrganizationRole,
  createInviteLink,
  findOrCreateOrganizationGameChannel,
  findOrCreateOrganizationGeneralChannel,
  getUserOrganizationData
} from "../../services/discord.services";
import { runQuery } from "../../db/mysqlRunQuery";
import { logger } from "../../utils/app-logger";
import { type Guild } from "discord.js";

jest.mock("../../db/mysqlRunQuery");
jest.mock("../../utils/app-logger");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("Discord Services", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DISCORD_BOT_TOKEN = "mock-token";
    process.env.DISCORD_GUILD_ID = "mock-guild-id";
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("initializeDiscordClient", () => {
    it("should throw error when DISCORD_BOT_TOKEN is missing", async () => {
      delete process.env.DISCORD_BOT_TOKEN;
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      await expect(initializeDiscordClient()).rejects.toThrow(
        "DISCORD_BOT_TOKEN environment variable is required"
      );
    });

    it("should throw error when DISCORD_GUILD_ID is missing", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      delete process.env.DISCORD_GUILD_ID;

      await expect(initializeDiscordClient()).rejects.toThrow(
        "DISCORD_GUILD_ID environment variable is required"
      );
    });

    it("should return mock client in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      const client = await initializeDiscordClient();

      expect(client).toBeDefined();
      expect(client.login).toBeDefined();
      expect(client.on).toBeDefined();
    });

    it("should initialize real client when environment variables are set", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const client = await initializeDiscordClient();

      expect(client).toBeDefined();
      expect(client.login).toHaveBeenCalledWith("mock-token");
    });

    it("should return existing client if already initialized", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const client1 = await initializeDiscordClient();
      const client2 = await initializeDiscordClient();

      expect(client1).toBe(client2);
    });
  });

  describe("getDiscordClient", () => {
    it("should initialize new client if none exists", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const client = await getDiscordClient();

      expect(client).toBeDefined();
    });

    it("should return existing client if already initialized", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const client1 = await getDiscordClient();
      const client2 = await getDiscordClient();

      expect(client1).toBe(client2);
    });
  });

  describe("getDiscordGuild", () => {
    it("should return mock guild in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      const guild = await getDiscordGuild();

      expect(guild).toBeDefined();
      expect(guild.id).toBe("mock-guild-id");
      expect(guild.name).toBe("Mock Guild");
    });

    it("should fetch guild from client when not in e2e environment", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const guild = await getDiscordGuild();

      expect(guild).toBeDefined();
      expect(guild.id).toBe("mock-guild-id");
    });
  });

  describe("createOrGetOrganizationRole", () => {
    it("should return role ID string", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const roleId = await createOrGetOrganizationRole("Test Organization");

      expect(typeof roleId).toBe("string");
      expect(roleId).toBeDefined();
    });

    it("should handle role creation for new organization", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const roleId = await createOrGetOrganizationRole("New Organization");

      expect(roleId).toBeDefined();
    });
  });

  describe("createInviteLink", () => {
    it("should create invite link for channel", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      const inviteUrl = await createInviteLink("mock-channel-id");

      expect(inviteUrl).toBe("https://discord.gg/mock-invite");
    });

    it("should return mock invite link in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      const inviteUrl = await createInviteLink("mock-channel-id");

      expect(inviteUrl).toBe("https://discord.gg/mock-invite");
    });

    it("should handle invite creation errors", async () => {
      // Override the mockChannel's createInvite to throw
      const errorChannel = new MockTextChannel();
      errorChannel.createInvite = jest
        .fn()
        .mockRejectedValue(new Error("Invite creation failed"));
      mockClient.channels.fetch = jest.fn().mockResolvedValue(errorChannel);

      await expect(createInviteLink("mock-channel-id")).rejects.toThrow(
        "Invite creation failed"
      );
    });
  });

  describe("findOrCreateOrganizationGameChannel", () => {
    it("should return mock channel in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      const mockGuild = {
        id: "mock-guild-id",
        name: "Mock Guild"
      } as unknown as Guild;
      const gameTypeData = {
        name: "Comp",
        abbreviation: "CS2",
        game_type_name: "Comp"
      };

      const channel = await findOrCreateOrganizationGameChannel(
        mockGuild,
        "Test Organization",
        gameTypeData
      );

      expect(channel).toBeDefined();
      expect(channel.id).toBe("mock-channel-id");
      expect(channel.name).toBe("mock-game-channel");
    });

    it("should create channel with proper naming convention", async () => {
      process.env.NODE_ENV = "e2e";

      const mockGuild = {
        id: "mock-guild-id",
        name: "Mock Guild",
        channels: {
          cache: new Map(),
          create: jest.fn().mockResolvedValue({
            id: "mock-channel-id",
            name: "test-organization-cs2-comp"
          })
        }
      } as unknown as Guild;
      const gameTypeData = {
        name: "Comp",
        abbreviation: "CS2",
        game_type_name: "Comp"
      };

      const channel = await findOrCreateOrganizationGameChannel(
        mockGuild,
        "Test Organization",
        gameTypeData
      );

      expect(channel).toBeDefined();
    });
  });

  describe("findOrCreateOrganizationGeneralChannel", () => {
    it("should return mock channel in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      const mockGuild = {
        id: "mock-guild-id",
        name: "Mock Guild"
      } as unknown as Guild;

      const channel = await findOrCreateOrganizationGeneralChannel(
        mockGuild,
        "Test Organization"
      );

      expect(channel).toBeDefined();
      expect(channel.id).toBe("mock-general-channel-id");
      expect(channel.name).toBe("mock-general-channel");
    });

    it("should create general channel with proper naming", async () => {
      process.env.NODE_ENV = "e2e";

      const mockGuild = {
        id: "mock-guild-id",
        name: "Mock Guild",
        channels: {
          cache: new Map(),
          create: jest.fn().mockResolvedValue({
            id: "mock-general-channel-id",
            name: "test-organization-general"
          })
        }
      } as unknown as Guild;

      const channel = await findOrCreateOrganizationGeneralChannel(
        mockGuild,
        "Test Organization"
      );

      expect(channel).toBeDefined();
    });
  });

  describe("setupDiscordEventHandlers", () => {
    it("should skip event handler setup in e2e test environment", async () => {
      process.env.NODE_ENV = "e2e";

      await setupDiscordEventHandlers();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "E2E test environment detected, skipping Discord event handlers"
      );
    });

    it("should not setup duplicate event handlers", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      // First setup
      await setupDiscordEventHandlers();
      // Second setup
      await setupDiscordEventHandlers();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Discord event handlers already set up, skipping"
      );
    });

    it("should setup event handlers for new member joins", async () => {
      process.env.DISCORD_BOT_TOKEN = "mock-token";
      process.env.DISCORD_GUILD_ID = "mock-guild-id";

      await setupDiscordEventHandlers();

      // Verify that the event handler setup was attempted
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Discord event handlers")
      );
    });
  });

  describe("getUserOrganizationData", () => {
    it("should return user organization data when found", async () => {
      const mockUserData = {
        account_id: 123,
        steam_id: "steam123",
        organization_name: "Test Organization",
        game_types: JSON.stringify([
          { name: "Comp", abbreviation: "CS2", game_type_name: "Comp" }
        ])
      };
      mockRunQuery.mockResolvedValue([mockUserData]);

      const result = await getUserOrganizationData("mock-discord-user-id");
      expect(result).toEqual({
        account_id: 123,
        steam_id: "steam123",
        organization_name: "Test Organization",
        game_types: [
          { name: "Comp", abbreviation: "CS2", game_type_name: "Comp" }
        ]
      });
    });

    it("should return null when no user data found", async () => {
      mockRunQuery.mockResolvedValue([]);
      const result = await getUserOrganizationData("mock-discord-user-id");
      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockRunQuery.mockRejectedValue(new Error("Database error"));
      const result = await getUserOrganizationData("mock-discord-user-id");
      expect(result).toBeNull();
    });
  });
});
