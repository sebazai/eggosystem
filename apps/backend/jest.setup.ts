import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";
import { mswServer } from "@eggosystem/shared-msw";
import { cleanupLogger } from "./src/utils/app-logger";
import { http, HttpResponse } from "@eggosystem/shared-msw";

// Mock Discord.js to prevent actual connections during tests
jest.mock("discord.js", () => {
  const originalModule = jest.requireActual("discord.js");

  return {
    ...originalModule,
    Client: jest.fn().mockImplementation(() => ({
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
              name: "Mock Channel",
              createInvite: jest.fn().mockResolvedValue({
                url: "https://discord.gg/mock-invite"
              })
            })
          }
        })
      },
      channels: {
        fetch: jest.fn().mockResolvedValue({
          id: "mock-channel-id",
          name: "Mock Channel",
          isTextBased: () => true,
          isDMBased: () => false,
          createInvite: jest.fn().mockResolvedValue({
            url: "https://discord.gg/mock-invite"
          })
        })
      }
    })),
    GatewayIntentBits: {
      Guilds: 1,
      GuildMembers: 2,
      GuildMessages: 4
    },
    ChannelType: {
      GuildText: 0,
      GuildCategory: 4
    },
    PermissionFlagsBits: {
      ViewChannel: 1024,
      SendMessages: 2048
    },
    Events: {
      GuildMemberAdd: "guildMemberAdd"
    }
  };
});

// Mock Discord service functions
jest.mock("./src/services/discord.services", () => ({
  initializeDiscordClient: jest.fn().mockResolvedValue({
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
  }),
  getDiscordClient: jest.fn().mockResolvedValue({
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
  }),
  getDiscordGuild: jest.fn().mockResolvedValue({
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
  }),
  createOrGetOrganizationRole: jest.fn().mockResolvedValue("mock-role-id"),
  createOrGetGameChannel: jest.fn().mockResolvedValue("mock-channel-id"),
  findOrCreateOrganizationGameChannel: jest.fn().mockResolvedValue({
    id: "mock-channel-id",
    name: "Mock Channel"
  }),
  createInviteLink: jest
    .fn()
    .mockResolvedValue("https://discord.gg/mock-invite"),
  setupDiscordEventHandlers: jest.fn().mockResolvedValue(undefined),
  cleanupDiscordClient: jest.fn().mockResolvedValue(undefined),
  getOrganizationDiscordInfo: jest.fn().mockResolvedValue({
    roleId: "mock-role-id",
    channels: []
  })
}));

jest.mock("fs", () => {
  const actualFs = jest.requireActual("fs"); // keep everything elsex

  return {
    ...actualFs,
    readFileSync: jest.fn((filePath: string) => {
      if (filePath.includes("public_access_token.pem")) {
        return "mock-public-key";
      } else if (filePath.includes("private_access_token.pem")) {
        return "mock-private-key";
      } else if (filePath.includes("public_refresh_token.pem")) {
        return "mock-refresh-public-key";
      } else if (filePath.includes("private_refresh_token.pem")) {
        return "mock-refresh-private-key";
      }
      // fallback to actual read if needed
      return actualFs.readFileSync(filePath, "utf8");
    })
  };
});

beforeAll(() => {
  // Enable API mocking before all the tests.
  mswServer.listen({
    onUnhandledRequest: (request, print) => {
      // Ignore Discord WebSocket connections and other Discord-related requests
      if (
        request.url.includes("127.0.0.1") ||
        request.url.includes("localhost:4318") ||
        request.url.includes("gateway.discord.gg") ||
        request.url.includes("discord.com") ||
        request.url.includes("discord.gg")
      ) {
        return;
      }
      print.warning();
    }
  });

  // Add handler for OpenTelemetry logs endpoint to prevent warnings
  mswServer.use(
    http.post("http://localhost:4318/v1/logs", () => {
      return HttpResponse.json({}, { status: 200 });
    })
  );
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(async () => {
  await endDbConnection();
  await closeRedis();
  await cleanupLogger();
  mswServer.close();
});
