import type { Queue } from "bullmq";
import {
  welcomeEmailQueue,
  enqueueSeasonWelcomeEmail,
  enqueueBulkSeasonWelcomeEmails,
  getEmailQueueStats,
  closeEmailQueue,
  type WelcomeEmailJobData,
  type PlayerEmailData
} from "./email-queue.services";

// Mock BullMQ
jest.mock("bullmq");

describe("Email Queue Services", () => {
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = welcomeEmailQueue as jest.Mocked<Queue>;
  });

  describe("enqueueSeasonWelcomeEmail", () => {
    it("should enqueue a single welcome email job", async () => {
      const jobData: WelcomeEmailJobData = {
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
      };

      mockQueue.add = jest.fn().mockResolvedValue({});

      await enqueueSeasonWelcomeEmail(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        "send-welcome-email",
        jobData,
        expect.objectContaining({
          jobId: expect.stringContaining("welcome-1-123-")
        })
      );
    });

    it("should throw error if enqueueing fails", async () => {
      const jobData: WelcomeEmailJobData = {
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
      };

      mockQueue.add = jest.fn().mockRejectedValue(new Error("Queue error"));

      await expect(enqueueSeasonWelcomeEmail(jobData)).rejects.toThrow(
        "Queue error"
      );
    });
  });

  describe("enqueueBulkSeasonWelcomeEmails", () => {
    it("should enqueue multiple welcome email jobs", async () => {
      const players: PlayerEmailData[] = [
        {
          email: "player1@example.com",
          account_id: 1,
          team_name: "Team A",
          league_name: "Masters",
          nickname: "Player1"
        },
        {
          email: "player2@example.com",
          account_id: 2,
          team_name: "Team B",
          league_name: "Challengers",
          nickname: "Player2"
        }
      ];

      mockQueue.addBulk = jest.fn().mockResolvedValue([]);

      const result = await enqueueBulkSeasonWelcomeEmails(
        1,
        players,
        "Season 1 - CS2",
        "January 1, 2024",
        "Kanaliiga",
        "https://example.com/rules",
        "https://discord.gg/test",
        ["Dust2", "Mirage"]
      );

      expect(result).toEqual({ enqueued: 2, failed: 0 });
      expect(mockQueue.addBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "send-welcome-email",
            data: expect.objectContaining({
              to: "player1@example.com",
              accountId: 1,
              seasonId: 1
            })
          }),
          expect.objectContaining({
            name: "send-welcome-email",
            data: expect.objectContaining({
              to: "player2@example.com",
              accountId: 2,
              seasonId: 1
            })
          })
        ])
      );
    });

    it("should throw error if bulk enqueue fails", async () => {
      const players: PlayerEmailData[] = [
        {
          email: "player1@example.com",
          account_id: 1,
          team_name: "Team A",
          league_name: "Masters",
          nickname: "Player1"
        }
      ];

      mockQueue.addBulk = jest.fn().mockRejectedValue(new Error("Bulk error"));

      await expect(
        enqueueBulkSeasonWelcomeEmails(
          1,
          players,
          "Season 1",
          null,
          "Kanaliiga",
          null,
          null,
          []
        )
      ).rejects.toThrow("Bulk error");
    });
  });

  describe("getEmailQueueStats", () => {
    it("should return queue statistics", async () => {
      mockQueue.getWaitingCount = jest.fn().mockResolvedValue(10);
      mockQueue.getActiveCount = jest.fn().mockResolvedValue(2);
      mockQueue.getCompletedCount = jest.fn().mockResolvedValue(50);
      mockQueue.getFailedCount = jest.fn().mockResolvedValue(3);
      mockQueue.getDelayedCount = jest.fn().mockResolvedValue(5);

      const stats = await getEmailQueueStats();

      expect(stats).toEqual({
        waiting: 10,
        active: 2,
        completed: 50,
        failed: 3,
        delayed: 5,
        total: 70
      });
    });

    it("should throw error if getting stats fails", async () => {
      mockQueue.getWaitingCount = jest
        .fn()
        .mockRejectedValue(new Error("Stats error"));

      await expect(getEmailQueueStats()).rejects.toThrow("Stats error");
    });
  });

  describe("closeEmailQueue", () => {
    it("should close the queue connection", async () => {
      mockQueue.close = jest.fn().mockResolvedValue(undefined);

      await closeEmailQueue();

      expect(mockQueue.close).toHaveBeenCalled();
    });

    it("should throw error if closing fails", async () => {
      mockQueue.close = jest.fn().mockRejectedValue(new Error("Close error"));

      await expect(closeEmailQueue()).rejects.toThrow("Close error");
    });
  });
});
