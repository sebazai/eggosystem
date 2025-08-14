/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueueConsumerManager } from "./queue-consumer-manager";
import { ParsedQueueConsumer } from "./parsed-queue-consumer";

// Mock the ParsedQueueConsumer
jest.mock("./parsed-queue-consumer");

const mockParsedQueueConsumer = ParsedQueueConsumer as jest.MockedClass<
  typeof ParsedQueueConsumer
>;

describe("QueueConsumerManager", () => {
  let manager: QueueConsumerManager;

  beforeEach(() => {
    manager = new QueueConsumerManager();
    jest.clearAllMocks();
  });

  describe("startAllConsumers", () => {
    it("should start all queue consumers successfully", async () => {
      // Mock the ParsedQueueConsumer instance
      const mockConsumer = {
        connect: jest.fn().mockResolvedValue(undefined),
        startConsumer: jest.fn().mockResolvedValue(undefined),
        stopConsumer: jest.fn().mockResolvedValue(undefined)
      };
      mockParsedQueueConsumer.mockImplementation(() => mockConsumer as any);

      await manager.startAllConsumers();

      expect(mockParsedQueueConsumer).toHaveBeenCalled();
      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.startConsumer).toHaveBeenCalled();
    });

    it("should handle errors when starting consumers", async () => {
      const mockConsumer = {
        connect: jest.fn().mockRejectedValue(new Error("Connection failed")),
        startConsumer: jest.fn(),
        stopConsumer: jest.fn()
      };
      mockParsedQueueConsumer.mockImplementation(() => mockConsumer as any);

      await expect(manager.startAllConsumers()).rejects.toThrow(
        "Connection failed"
      );
    });
  });

  describe("stopAllConsumers", () => {
    it("should stop all queue consumers gracefully", async () => {
      const mockConsumer = {
        connect: jest.fn().mockResolvedValue(undefined),
        startConsumer: jest.fn().mockResolvedValue(undefined),
        stopConsumer: jest.fn().mockResolvedValue(undefined)
      };
      mockParsedQueueConsumer.mockImplementation(() => mockConsumer as any);

      // Start consumers first
      await manager.startAllConsumers();

      // Then stop them
      await manager.stopAllConsumers();

      expect(mockConsumer.stopConsumer).toHaveBeenCalled();
    });

    it("should handle errors when stopping consumers", async () => {
      const mockConsumer = {
        connect: jest.fn().mockResolvedValue(undefined),
        startConsumer: jest.fn().mockResolvedValue(undefined),
        stopConsumer: jest.fn().mockRejectedValue(new Error("Stop failed"))
      };
      mockParsedQueueConsumer.mockImplementation(() => mockConsumer as any);

      // Start consumers first
      await manager.startAllConsumers();

      // Stop should not throw even if individual consumers fail
      await expect(manager.stopAllConsumers()).resolves.toBeUndefined();
    });
  });

  describe("getConsumerStatus", () => {
    it("should return correct consumer status", () => {
      const status = manager.getConsumerStatus();

      expect(status).toEqual({
        consumerCount: 0,
        isShuttingDown: false
      });
    });
  });
});
