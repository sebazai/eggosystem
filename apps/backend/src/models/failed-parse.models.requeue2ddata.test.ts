import type amqp from "amqplib";

jest.mock("amqplib", () => ({
  connect: jest.fn()
}));

jest.mock("../services/parse-2ddata-queue.services", () => ({
  publishToParse2ddataQueue: jest.fn()
}));

import { connect } from "amqplib";
import { publishToParse2ddataQueue } from "../services/parse-2ddata-queue.services";
import { requeue2ddataFailedMessages } from "./failed-parse.models";

const mockConnect = connect as jest.MockedFunction<typeof connect>;
const mockPublish = publishToParse2ddataQueue as jest.MockedFunction<
  typeof publishToParse2ddataQueue
>;

type GetResult = amqp.Message | false;

const createMessage = (payload: Record<string, unknown>): amqp.Message =>
  ({
    content: Buffer.from(JSON.stringify(payload))
  }) as unknown as amqp.Message;

describe("requeue2ddataFailedMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("publishes to parse_2ddata with retry_count removed and acks matching messages", async () => {
    const msg1 = createMessage({
      match_game_id: "108925",
      demo_path: "demo1.zip",
      retry_count: 3,
      extra: "keep"
    });
    const msg2 = createMessage({
      match_game_id: "999",
      demo_path: "other.zip",
      retry_count: 1
    });

    const getSequence: GetResult[] = [msg1, msg2, false];

    const channel = {
      assertQueue: jest
        .fn()
        .mockResolvedValue({ queue: "parse_2ddata_failed", messageCount: 2 }),
      get: jest.fn().mockImplementation(async () => getSequence.shift()),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as amqp.Channel;

    const connection = {
      createChannel: jest.fn().mockResolvedValue(channel),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as amqp.ChannelModel;

    mockConnect.mockResolvedValue(connection);
    mockPublish.mockResolvedValue(undefined);

    const result = await requeue2ddataFailedMessages({
      items: [
        { match_game_id: "108925", demo_path: "demo1.zip" },
        { match_game_id: "nope", demo_path: "missing.zip" }
      ]
    });

    expect(channel.assertQueue).toHaveBeenCalledWith("parse_2ddata_failed", {
      durable: true
    });

    expect(mockPublish).toHaveBeenCalledWith({
      match_game_id: "108925",
      demo_path: "demo1.zip",
      extra: "keep"
    });

    expect(channel.ack).toHaveBeenCalledWith(msg1);
    expect(channel.nack).toHaveBeenCalledWith(msg2, false, true);

    expect(result).toMatchObject({
      success: true,
      requeued_count: 1,
      failed_count: 0
    });
  });

  it("nacks and reports error when publish fails for a requested message", async () => {
    const msg1 = createMessage({
      match_game_id: "108925",
      demo_path: "demo1.zip",
      retry_count: 3
    });
    const getSequence: GetResult[] = [msg1, false];

    const channel = {
      assertQueue: jest
        .fn()
        .mockResolvedValue({ queue: "parse_2ddata_failed", messageCount: 1 }),
      get: jest.fn().mockImplementation(async () => getSequence.shift()),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as amqp.Channel;

    const connection = {
      createChannel: jest.fn().mockResolvedValue(channel),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as amqp.ChannelModel;

    mockConnect.mockResolvedValue(connection);
    mockPublish.mockRejectedValue(new Error("publish failed"));

    const result = await requeue2ddataFailedMessages({
      items: [{ match_game_id: "108925", demo_path: "demo1.zip" }]
    });

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(msg1, false, true);
    expect(result.success).toBe(false);
    expect(result.requeued_count).toBe(0);
    expect(result.failed_count).toBe(1);
    expect(result.errors?.[0]).toContain("publish failed");
  });
});
