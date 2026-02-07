import type { ConsumeMessage } from "amqplib";
import JSONBig from "json-bigint";
import type { ParseResultMessage } from "../types/parse-queue.types";

// Mock external dependencies
jest.mock("../models/match-game.models");
jest.mock("./fantasy-points.service");

import { saveParsedDemoDataForGame } from "../models/match-game.models";
import { calculateFantasyPointsForGame } from "./fantasy-points.service";
import { ParsedQueueConsumer } from "./parsed-queue-consumer";

const mockSaveParsedDemoData = saveParsedDemoDataForGame as jest.MockedFunction<
  typeof saveParsedDemoDataForGame
>;
const mockCalculateFantasyPoints =
  calculateFantasyPointsForGame as jest.MockedFunction<
    typeof calculateFantasyPointsForGame
  >;

/**
 * Create a mock AMQP channel with jest.fn() stubs
 */
const createMockChannel = () => ({
  ack: jest.fn(),
  nack: jest.fn(),
  sendToQueue: jest.fn(),
  prefetch: jest.fn(),
  assertQueue: jest
    .fn()
    .mockResolvedValue({ queue: "test", messageCount: 0, consumerCount: 0 }),
  consume: jest.fn().mockResolvedValue({ consumerTag: "test-tag" }),
  cancel: jest.fn(),
  close: jest.fn()
});

/**
 * Create a minimal valid ParseResultMessage
 */
const createValidMessage = (
  overrides?: Partial<ParseResultMessage>
): ParseResultMessage => ({
  match_game_id: "12345",
  demo_file: "demo.dem",
  json_file: "demo.json",
  processed_at: new Date().toISOString(),
  processing_duration: 5000,
  worker_id: "worker-1",
  status: "success",
  parsed_payload: {
    Score: {
      Team1HTScore: 8,
      Team2HTScore: 7,
      Team1Score: 16,
      Team2Score: 12,
      Team1OTScore: 0,
      Team2OTScore: 0,
      Map: "de_dust2"
    },
    Players: {},
    Trades: {},
    Clutches: { Infos: [] },
    RoundInfo: [],
    NewRoundInfo: { Rounds: [] },
    RoundImpacts: []
  },
  ...overrides
});

/**
 * Create a mock AMQP ConsumeMessage from a ParseResultMessage
 */
const createAmqpMessage = (message: ParseResultMessage): ConsumeMessage =>
  ({
    content: Buffer.from(JSONBig().stringify(message)),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: "",
      routingKey: ""
    },
    properties: {}
  }) as unknown as ConsumeMessage;

describe("ParsedQueueConsumer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveParsedDemoData.mockResolvedValue(undefined);
    mockCalculateFantasyPoints.mockResolvedValue(undefined);
  });

  describe("constructor", () => {
    it("should use default config when no config provided", () => {
      const consumer = new ParsedQueueConsumer();
      const stats = consumer.getStats();

      expect(stats.isProcessing).toBe(false);
      expect(stats.processedCount).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.isConnected).toBe(false);
    });

    it("should merge partial config with defaults", () => {
      const consumer = new ParsedQueueConsumer({
        prefetchCount: 10,
        retryAttempts: 5
      });
      // Verify via getStats that the consumer was created successfully
      expect(consumer.getStats().isConnected).toBe(false);
    });

    it("should set maxRetryAttempts from config", () => {
      const consumer = new ParsedQueueConsumer({ retryAttempts: 7 });
      // Access private field to verify
      expect(
        (consumer as unknown as { maxRetryAttempts: number }).maxRetryAttempts
      ).toBe(7);
    });
  });

  describe("getStats", () => {
    it("should return initial state", () => {
      const consumer = new ParsedQueueConsumer();

      expect(consumer.getStats()).toEqual({
        isProcessing: false,
        processedCount: 0,
        errorCount: 0,
        isConnected: false
      });
    });
  });

  describe("processMessage", () => {
    let consumer: ParsedQueueConsumer;
    let mockChannel: ReturnType<typeof createMockChannel>;

    beforeEach(() => {
      consumer = new ParsedQueueConsumer({ retryAttempts: 3 });
      mockChannel = createMockChannel();
      // Inject mock channel into private field
      (consumer as unknown as { channel: unknown }).channel = mockChannel;
    });

    it("should process a valid message and ack it", async () => {
      const message = createValidMessage();
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      expect(mockSaveParsedDemoData).toHaveBeenCalledWith(
        "12345",
        message.parsed_payload
      );
      expect(mockCalculateFantasyPoints).toHaveBeenCalledWith(12345);
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
    });

    it("should increment processedCount on success", async () => {
      const message = createValidMessage();
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      expect(consumer.getStats().processedCount).toBe(1);
    });

    it("should handle missing parsed_payload", async () => {
      const message = createValidMessage({
        parsed_payload:
          undefined as unknown as ParseResultMessage["parsed_payload"]
      });
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      expect(mockSaveParsedDemoData).not.toHaveBeenCalled();
      // Message should be sent to error queue
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
      expect(consumer.getStats().errorCount).toBe(1);
    });

    it("should handle missing match_game_id", async () => {
      const message = createValidMessage({
        match_game_id: "" as unknown as string
      });
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      expect(mockSaveParsedDemoData).not.toHaveBeenCalled();
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
    });

    it("should handle saveParsedDemoData failure", async () => {
      mockSaveParsedDemoData.mockRejectedValue(new Error("DB write failed"));
      const message = createValidMessage();
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      // Should send to error queue and ack
      expect(mockChannel.sendToQueue).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
      expect(consumer.getStats().errorCount).toBe(1);
    });

    it("should not fail when fantasy points calculation fails", async () => {
      mockCalculateFantasyPoints.mockRejectedValue(
        new Error("Fantasy calc failed")
      );
      const message = createValidMessage();
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      // Save was called, fantasy failed but message should still be acked
      expect(mockSaveParsedDemoData).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
      expect(consumer.getStats().processedCount).toBe(1);
    });

    it("should return early for null message", async () => {
      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage | null) => Promise<void>;
        }
      ).processMessage(null as unknown as ConsumeMessage);

      expect(mockSaveParsedDemoData).not.toHaveBeenCalled();
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it("should return early when channel is null", async () => {
      (consumer as unknown as { channel: unknown }).channel = null;
      const message = createValidMessage();
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      expect(mockSaveParsedDemoData).not.toHaveBeenCalled();
    });
  });

  describe("retry logic", () => {
    let consumer: ParsedQueueConsumer;
    let mockChannel: ReturnType<typeof createMockChannel>;

    beforeEach(() => {
      consumer = new ParsedQueueConsumer({ retryAttempts: 2 });
      mockChannel = createMockChannel();
      (consumer as unknown as { channel: unknown }).channel = mockChannel;
    });

    it("should send to error queue and ack when retries exhausted", async () => {
      mockSaveParsedDemoData.mockRejectedValue(new Error("Persistent failure"));
      const message = createValidMessage({ match_game_id: "retry-test" });
      const amqpMsg = createAmqpMessage(message);

      // matchGameId resolves to "unknown" before message is parsed (line 282 in source),
      // so retry tracking uses "unknown" as key
      const retryCounts = (
        consumer as unknown as { retryCounts: Map<string, number> }
      ).retryCounts;
      retryCounts.set("unknown", 2);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      // Should ack (not nack) since retries exhausted
      expect(mockChannel.ack).toHaveBeenCalledWith(amqpMsg);
      expect(mockChannel.sendToQueue).toHaveBeenCalled();

      // Verify error queue message contains retry exhaustion info
      const sentBuffer = mockChannel.sendToQueue.mock.calls[0]![1] as Buffer;
      const sentMessage = JSON.parse(sentBuffer.toString());
      expect(sentMessage.details.maxRetryAttempts).toBe(2);
    });

    it("should nack and requeue when error queue publish fails and retries not exhausted", async () => {
      mockSaveParsedDemoData.mockRejectedValue(new Error("DB error"));
      mockChannel.sendToQueue.mockImplementation(() => {
        throw new Error("Error queue unavailable");
      });

      const message = createValidMessage({ match_game_id: "nack-test" });
      const amqpMsg = createAmqpMessage(message);

      await (
        consumer as unknown as {
          processMessage: (msg: ConsumeMessage) => Promise<void>;
        }
      ).processMessage(amqpMsg);

      // Should nack with requeue=true
      expect(mockChannel.nack).toHaveBeenCalledWith(amqpMsg, false, true);
      expect(consumer.getStats().errorCount).toBe(1);

      // Retry count is tracked under "unknown" key (matchGameId resolves before parse)
      const retryCounts = (
        consumer as unknown as { retryCounts: Map<string, number> }
      ).retryCounts;
      expect(retryCounts.get("unknown")).toBe(1);
    });
  });

  describe("processParsedDemoData", () => {
    let consumer: ParsedQueueConsumer;

    beforeEach(() => {
      consumer = new ParsedQueueConsumer();
    });

    it("should save demo data and calculate fantasy points", async () => {
      const message = createValidMessage();

      await (
        consumer as unknown as {
          processParsedDemoData: (msg: ParseResultMessage) => Promise<void>;
        }
      ).processParsedDemoData(message);

      expect(mockSaveParsedDemoData).toHaveBeenCalledWith(
        "12345",
        message.parsed_payload
      );
      expect(mockCalculateFantasyPoints).toHaveBeenCalledWith(12345);
    });

    it("should throw when parsed_payload is missing", async () => {
      const message = createValidMessage({
        parsed_payload:
          undefined as unknown as ParseResultMessage["parsed_payload"]
      });

      await expect(
        (
          consumer as unknown as {
            processParsedDemoData: (msg: ParseResultMessage) => Promise<void>;
          }
        ).processParsedDemoData(message)
      ).rejects.toThrow("Missing parsed payload");
    });

    it("should not throw when fantasy points calculation fails", async () => {
      mockCalculateFantasyPoints.mockRejectedValue(new Error("Fantasy error"));
      const message = createValidMessage();

      // Should not throw - fantasy errors are non-fatal
      await expect(
        (
          consumer as unknown as {
            processParsedDemoData: (msg: ParseResultMessage) => Promise<void>;
          }
        ).processParsedDemoData(message)
      ).resolves.toBeUndefined();

      expect(mockSaveParsedDemoData).toHaveBeenCalled();
    });

    it("should throw when saveParsedDemoData fails", async () => {
      mockSaveParsedDemoData.mockRejectedValue(new Error("Save failed"));
      const message = createValidMessage();

      await expect(
        (
          consumer as unknown as {
            processParsedDemoData: (msg: ParseResultMessage) => Promise<void>;
          }
        ).processParsedDemoData(message)
      ).rejects.toThrow("Save failed");
    });
  });

  describe("publishError", () => {
    let consumer: ParsedQueueConsumer;
    let mockChannel: ReturnType<typeof createMockChannel>;

    beforeEach(() => {
      consumer = new ParsedQueueConsumer({
        errorQueueName: "test-error-queue"
      });
      mockChannel = createMockChannel();
      (consumer as unknown as { channel: unknown }).channel = mockChannel;
    });

    it("should publish error message to error queue", () => {
      const message = createValidMessage();

      (
        consumer as unknown as {
          publishError: (
            msg: ParseResultMessage | undefined,
            errors: string[],
            details?: Record<string, unknown>
          ) => void;
        }
      ).publishError(message, ["Test error"], { processingTime: 100 });

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        "test-error-queue",
        expect.any(Buffer),
        { persistent: true }
      );

      const sentBuffer = mockChannel.sendToQueue.mock.calls[0]![1] as Buffer;
      const sentMessage = JSON.parse(sentBuffer.toString());
      expect(sentMessage.match_game_id).toBe("12345");
      expect(sentMessage.errors).toEqual(["Test error"]);
      expect(sentMessage.details.processingTime).toBe(100);
      expect(sentMessage.source).toBe("parsed-queue-consumer");
    });

    it("should handle undefined original message", () => {
      (
        consumer as unknown as {
          publishError: (
            msg: ParseResultMessage | undefined,
            errors: string[],
            details?: Record<string, unknown>
          ) => void;
        }
      ).publishError(undefined, ["Unknown error"]);

      const sentBuffer = mockChannel.sendToQueue.mock.calls[0]![1] as Buffer;
      const sentMessage = JSON.parse(sentBuffer.toString());
      expect(sentMessage.match_game_id).toBe("unknown");
    });

    it("should throw when channel is null", () => {
      (consumer as unknown as { channel: unknown }).channel = null;

      expect(() =>
        (
          consumer as unknown as {
            publishError: (
              msg: ParseResultMessage | undefined,
              errors: string[]
            ) => void;
          }
        ).publishError(undefined, ["error"])
      ).toThrow("No channel available");
    });
  });

  describe("healthCheck", () => {
    let consumer: ParsedQueueConsumer;
    let mockChannel: ReturnType<typeof createMockChannel>;

    beforeEach(() => {
      consumer = new ParsedQueueConsumer();
      mockChannel = createMockChannel();
      (consumer as unknown as { channel: unknown }).channel = mockChannel;
    });

    it("should return true when channel is healthy", async () => {
      const result = await consumer.healthCheck();

      expect(result).toBe(true);
      expect(mockChannel.assertQueue).toHaveBeenCalled();
    });

    it("should return false when channel is null", async () => {
      (consumer as unknown as { channel: unknown }).channel = null;

      const result = await consumer.healthCheck();

      expect(result).toBe(false);
    });

    it("should return false when assertQueue fails", async () => {
      mockChannel.assertQueue.mockRejectedValue(new Error("Channel closed"));

      const result = await consumer.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe("disconnect", () => {
    let consumer: ParsedQueueConsumer;
    let mockChannel: ReturnType<typeof createMockChannel>;
    let mockConnection: {
      close: jest.Mock;
      on: jest.Mock;
      createChannel: jest.Mock;
    };

    beforeEach(() => {
      consumer = new ParsedQueueConsumer();
      mockChannel = createMockChannel();
      mockConnection = {
        close: jest.fn(),
        on: jest.fn(),
        createChannel: jest.fn().mockResolvedValue(mockChannel)
      };
      (consumer as unknown as { channel: unknown }).channel = mockChannel;
      (consumer as unknown as { connection: unknown }).connection =
        mockConnection;
    });

    it("should close channel and connection", async () => {
      await consumer.disconnect();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(consumer.getStats().isConnected).toBe(false);
    });

    it("should stop consumer if processing", async () => {
      (consumer as unknown as { isProcessing: boolean }).isProcessing = true;
      (consumer as unknown as { consumerTag: string }).consumerTag = "tag-1";

      await consumer.disconnect();

      expect(mockChannel.cancel).toHaveBeenCalledWith("tag-1");
    });

    it("should clear reconnect timeout", async () => {
      const timeout = setTimeout(() => {}, 10000);
      (
        consumer as unknown as { reconnectTimeout: NodeJS.Timeout }
      ).reconnectTimeout = timeout;

      await consumer.disconnect();

      expect(
        (consumer as unknown as { reconnectTimeout: NodeJS.Timeout | null })
          .reconnectTimeout
      ).toBeNull();
    });

    it("should prevent future reconnection attempts", async () => {
      await consumer.disconnect();

      expect(
        (consumer as unknown as { shouldReconnect: boolean }).shouldReconnect
      ).toBe(false);
    });
  });
});
