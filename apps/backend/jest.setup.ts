// Mock ioredis before any imports that might use it
// This is needed because redisClient creates a Redis instance at module level
jest.mock("ioredis", () => {
  // In-memory storage for the mock (shared across all instances)
  const mockRedisStorage = new Map<string, string>();

  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedisStorage.get(key) || null);
    }),
    set: jest
      .fn()
      .mockImplementation((key: string, value: string, ..._args: unknown[]) => {
        // Handle set with EX option (expiration) - we ignore expiration in the mock
        mockRedisStorage.set(key, value);
        return Promise.resolve("OK");
      }),
    del: jest.fn().mockImplementation((key: string) => {
      const existed = mockRedisStorage.has(key);
      mockRedisStorage.delete(key);
      return Promise.resolve(existed ? 1 : 0);
    }),
    keys: jest.fn().mockResolvedValue([]),
    mget: jest.fn().mockResolvedValue([]),
    flushall: jest.fn().mockImplementation(() => {
      mockRedisStorage.clear();
      return Promise.resolve("OK");
    }),
    quit: jest.fn().mockResolvedValue("OK"),
    on: jest.fn()
  }));
});

// Mock BullMQ before any imports that might use it
// This prevents real Redis connections from being created during tests
jest.mock("bullmq", () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      addBulk: jest.fn(),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      close: jest.fn().mockResolvedValue(undefined)
    })),
    Worker: jest.fn()
  };
});

import { endDbConnection } from "./src/db/mysqlConnection";
import { closeRedis } from "./src/utils/redisClient";
import { closeEmailQueue } from "./src/services/email-queue.services";
import { mswServer } from "@eggosystem/shared-msw";
import { cleanupLogger } from "./src/utils/app-logger";
import { http, HttpResponse } from "@eggosystem/shared-msw";

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
  await closeEmailQueue();
  await cleanupLogger();
  mswServer.close();
});
