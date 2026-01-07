import type { Job } from "bullmq";
import { Worker } from "bullmq";
import {
  startEmailWorker,
  stopEmailWorker,
  isEmailWorkerRunning,
  getEmailStatsForSeason
} from "./email-worker.services";
import { redisClient } from "../utils/redisClient";
import * as emailSenderServices from "./email-sender.services";

// Mock BullMQ - set up a default mock worker with close() that always resolves
const createMockWorker = (): jest.Mocked<Worker> =>
  ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined)
  }) as unknown as jest.Mocked<Worker>;

jest.mock("bullmq", () => {
  const actual = jest.requireActual("bullmq");
  return {
    ...actual,
    Worker: jest.fn().mockImplementation(() => createMockWorker())
  };
});

// Mock Redis client
jest.mock("../utils/redisClient", () => ({
  redisClient: {
    hincrby: jest.fn(),
    expire: jest.fn(),
    hgetall: jest.fn()
  }
}));

// Mock email sender
jest.mock("./email-sender.services", () => ({
  sendSeasonWelcomeEmail: jest.fn()
}));

// Mock logger to avoid console output during tests
jest.mock("../utils/app-logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe("Email Worker Services", () => {
  let mockWorker: jest.Mocked<Worker>;

  beforeEach(async () => {
    // Stop any running worker from previous tests first
    // All Worker instances will have close() that resolves, so this should work
    try {
      await stopEmailWorker();
    } catch {
      // Ignore errors if worker wasn't running
      // If stopEmailWorker() failed, the worker might still be set
      // Try one more time with a fresh mock setup
      const tempWorker = createMockWorker();
      (Worker as jest.MockedClass<typeof Worker>).mockImplementationOnce(
        () => tempWorker
      );
      try {
        await stopEmailWorker();
      } catch {
        // Ignore - give up
      }
    }

    // Clear call history but keep mock implementations
    // This ensures close() is still set up on any existing workers
    (Worker as jest.MockedClass<typeof Worker>).mockClear();
    jest.clearAllMocks();

    // Re-setup the Worker mock implementation
    (Worker as jest.MockedClass<typeof Worker>).mockImplementation(() => {
      mockWorker = createMockWorker();
      return mockWorker;
    });
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await stopEmailWorker();
    } catch {
      // Ignore errors
    }
    // Ensure worker state is cleared
    jest.clearAllMocks();
  });

  describe("startEmailWorker", () => {
    it("should start the email worker", () => {
      startEmailWorker();

      expect(Worker).toHaveBeenCalledWith(
        "welcome-emails",
        expect.any(Function),
        expect.objectContaining({
          connection: expect.objectContaining({
            host: "eggo-redis",
            port: 6379
          }),
          concurrency: 1,
          limiter: expect.objectContaining({
            max: 1,
            duration: 750
          })
        })
      );

      expect(mockWorker.on).toHaveBeenCalledWith(
        "completed",
        expect.any(Function)
      );
      expect(mockWorker.on).toHaveBeenCalledWith(
        "failed",
        expect.any(Function)
      );
      expect(mockWorker.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockWorker.on).toHaveBeenCalledWith(
        "stalled",
        expect.any(Function)
      );
    });

    it("should not start worker if already running", () => {
      startEmailWorker();
      jest.clearAllMocks();

      startEmailWorker();

      expect(Worker).not.toHaveBeenCalled();
    });
  });

  describe("stopEmailWorker", () => {
    it("should stop the email worker", async () => {
      startEmailWorker();

      await stopEmailWorker();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(isEmailWorkerRunning()).toBe(false);
    });

    it("should handle case when worker is not running", async () => {
      await expect(stopEmailWorker()).resolves.not.toThrow();
    });

    it("should throw error if closing fails", async () => {
      startEmailWorker();
      const workerInstance = (Worker as jest.MockedClass<typeof Worker>).mock
        .results[
        (Worker as jest.MockedClass<typeof Worker>).mock.results.length - 1
      ].value;
      workerInstance.close = jest
        .fn()
        .mockRejectedValue(new Error("Close error"));

      await expect(stopEmailWorker()).rejects.toThrow("Close error");

      // Clean up: The error prevents emailWorker from being set to null,
      // so reset close() to resolve and call stopEmailWorker again to clean up
      workerInstance.close = jest.fn().mockResolvedValue(undefined);
      await stopEmailWorker();
      expect(isEmailWorkerRunning()).toBe(false);
    });
  });

  describe("isEmailWorkerRunning", () => {
    it("should return false when worker is not running", async () => {
      // Ensure worker is stopped
      try {
        await stopEmailWorker();
      } catch {
        // Ignore errors
      }
      expect(isEmailWorkerRunning()).toBe(false);
    });

    it("should return true when worker is running", () => {
      startEmailWorker();
      expect(isEmailWorkerRunning()).toBe(true);
    });
  });

  describe("getEmailStatsForSeason", () => {
    it("should return email stats for a season", async () => {
      (redisClient.hgetall as jest.Mock).mockResolvedValue({
        successful: "50",
        failed: "3"
      });

      const stats = await getEmailStatsForSeason(1);

      expect(stats).toEqual({
        successful: 50,
        failed: 3
      });

      expect(redisClient.hgetall).toHaveBeenCalledWith("email-stats:season:1");
    });

    it("should return zeros when no stats exist", async () => {
      (redisClient.hgetall as jest.Mock).mockResolvedValue({});

      const stats = await getEmailStatsForSeason(1);

      expect(stats).toEqual({
        successful: 0,
        failed: 0
      });
    });

    it("should return zeros on error", async () => {
      (redisClient.hgetall as jest.Mock).mockRejectedValue(
        new Error("Redis error")
      );

      const stats = await getEmailStatsForSeason(1);

      expect(stats).toEqual({
        successful: 0,
        failed: 0
      });
    });
  });

  describe("job processing", () => {
    let jobProcessor: (job: Job) => Promise<void>;

    beforeEach(async () => {
      // Ensure worker is stopped before starting
      // The outer beforeEach should have already stopped it, but be explicit
      try {
        await stopEmailWorker();
      } catch {
        // Ignore errors
      }

      // Verify worker is stopped before starting
      expect(isEmailWorkerRunning()).toBe(false);

      // Start the worker - this should create a new Worker instance
      startEmailWorker();

      // Verify worker is now running
      expect(isEmailWorkerRunning()).toBe(true);

      // Get the job processor function passed to Worker constructor
      // After clearAllMocks in outer beforeEach, this should be the first (and only) call
      const workerCalls = (Worker as jest.MockedClass<typeof Worker>).mock
        .calls;

      if (workerCalls.length === 0) {
        throw new Error(
          "Worker constructor was not called - startEmailWorker may have returned early"
        );
      }

      const lastCall = workerCalls[workerCalls.length - 1];

      if (!lastCall || !lastCall[1]) {
        throw new Error(
          "Worker constructor was called but processor function is missing"
        );
      }

      jobProcessor = lastCall[1] as (job: Job) => Promise<void>;
    });

    it("should process a job successfully", async () => {
      const mockJob = {
        id: "test-job-1",
        data: {
          to: "test@example.com",
          accountId: 123,
          seasonDisplayName: "Season 1 - CS2",
          seasonStartDate: "January 1, 2024",
          teamName: "Test Team",
          leagueName: "Masters",
          platform: "Kanaliiga",
          rulebookUrl: "https://example.com/rules",
          discordLink: "https://discord.gg/test",
          mapNames: ["Dust2", "Mirage"],
          seasonId: 1,
          playerEmail: "test@example.com",
          playerNickname: "TestPlayer"
        }
      } as Job;

      (
        emailSenderServices.sendSeasonWelcomeEmail as jest.Mock
      ).mockResolvedValue(undefined);

      await jobProcessor(mockJob);

      expect(emailSenderServices.sendSeasonWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        123,
        "Season 1 - CS2",
        "January 1, 2024",
        "Test Team",
        "Masters",
        "Kanaliiga",
        "https://example.com/rules",
        "https://discord.gg/test",
        ["Dust2", "Mirage"]
      );

      expect(redisClient.hincrby).toHaveBeenCalledWith(
        "email-stats:season:1",
        "successful",
        1
      );
    });

    it("should handle job failure and track stats", async () => {
      const mockJob = {
        id: "test-job-2",
        data: {
          to: "test@example.com",
          accountId: 123,
          seasonDisplayName: "Season 1",
          seasonStartDate: null,
          teamName: "Test Team",
          leagueName: "Masters",
          platform: "Kanaliiga",
          rulebookUrl: null,
          discordLink: null,
          mapNames: [],
          seasonId: 1,
          playerEmail: "test@example.com",
          playerNickname: "TestPlayer"
        }
      } as Job;

      (
        emailSenderServices.sendSeasonWelcomeEmail as jest.Mock
      ).mockRejectedValue(new Error("SMTP error"));

      await expect(jobProcessor(mockJob)).rejects.toThrow(
        "Failed to send welcome email"
      );

      expect(redisClient.hincrby).toHaveBeenCalledWith(
        "email-stats:season:1",
        "failed",
        1
      );
    });
  });
});
