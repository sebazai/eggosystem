import type { Queue } from "bullmq";
import {
  enqueueSeasonWelcomeEmail,
  enqueueBulkSeasonWelcomeEmails,
  getEmailQueueStats,
  closeEmailQueue,
  type WelcomeEmailJobData,
  type PlayerEmailData
} from "./email-queue.services";

describe("Email Queue Services", () => {
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock queue with Jest mock functions
    mockQueue = {
      add: jest.fn(),
      addBulk: jest.fn(),
      getWaitingCount: jest.fn(),
      getActiveCount: jest.fn(),
      getCompletedCount: jest.fn(),
      getFailedCount: jest.fn(),
      getDelayedCount: jest.fn(),
      close: jest.fn()
    } as unknown as jest.Mocked<Queue>;
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

      (mockQueue.add as jest.Mock).mockResolvedValue({});

      // Pass mock queue as parameter
      await enqueueSeasonWelcomeEmail(jobData, mockQueue);

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

      (mockQueue.add as jest.Mock).mockRejectedValue(new Error("Queue error"));

      await expect(
        enqueueSeasonWelcomeEmail(jobData, mockQueue)
      ).rejects.toThrow("Queue error");
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

      (mockQueue.addBulk as jest.Mock).mockResolvedValue([]);

      const result = await enqueueBulkSeasonWelcomeEmails(
        1,
        players,
        "Season 1 - CS2",
        "January 1, 2024",
        "Kanaliiga",
        "https://example.com/rules",
        "https://discord.gg/test",
        ["Dust2", "Mirage"],
        mockQueue
      );

      expect(result).toEqual({ enqueued: 2 });
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

      (mockQueue.addBulk as jest.Mock).mockRejectedValue(
        new Error("Bulk error")
      );

      await expect(
        enqueueBulkSeasonWelcomeEmails(
          1,
          players,
          "Season 1",
          null,
          "Kanaliiga",
          null,
          null,
          [],
          mockQueue
        )
      ).rejects.toThrow("Bulk error");
    });
  });

  describe("getEmailQueueStats", () => {
    it("should return queue statistics", async () => {
      (mockQueue.getWaitingCount as jest.Mock).mockResolvedValue(10);
      (mockQueue.getActiveCount as jest.Mock).mockResolvedValue(2);
      (mockQueue.getCompletedCount as jest.Mock).mockResolvedValue(50);
      (mockQueue.getFailedCount as jest.Mock).mockResolvedValue(3);
      (mockQueue.getDelayedCount as jest.Mock).mockResolvedValue(5);

      const stats = await getEmailQueueStats(mockQueue);

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
      (mockQueue.getWaitingCount as jest.Mock).mockRejectedValue(
        new Error("Stats error")
      );

      await expect(getEmailQueueStats(mockQueue)).rejects.toThrow(
        "Stats error"
      );
    });
  });

  describe("closeEmailQueue", () => {
    it("should close the queue connection", async () => {
      (mockQueue.close as jest.Mock).mockResolvedValue(undefined);

      await closeEmailQueue(mockQueue);

      expect(mockQueue.close).toHaveBeenCalled();
    });

    it("should throw error if closing fails", async () => {
      (mockQueue.close as jest.Mock).mockRejectedValue(
        new Error("Close error")
      );

      await expect(closeEmailQueue(mockQueue)).rejects.toThrow("Close error");
    });
  });
});
