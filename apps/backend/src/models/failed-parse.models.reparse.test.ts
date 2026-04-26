import type amqp from "amqplib";

jest.mock("amqplib", () => ({
  connect: jest.fn()
}));

jest.mock("../services/parse-queue.services", () => ({
  publishToParseQueue: jest.fn(),
  createDemoProcessingRequest: jest.requireActual(
    "../services/parse-queue.services"
  ).createDemoProcessingRequest
}));

jest.mock("./match-game.models", () => ({
  getMatchIdByGameId: jest.fn()
}));

jest.mock("./match.models", () => ({
  getMatchGame: jest.fn()
}));

import { connect } from "amqplib";
import { publishToParseQueue } from "../services/parse-queue.services";
import { reparseFailedMessages } from "./failed-parse.models";

const mockConnect = connect as jest.MockedFunction<typeof connect>;
const mockPublish = publishToParseQueue as jest.MockedFunction<
  typeof publishToParseQueue
>;

type GetResult = amqp.Message | false;

const createMessage = (payload: Record<string, unknown>): amqp.Message =>
  ({
    content: Buffer.from(JSON.stringify(payload))
  }) as unknown as amqp.Message;

describe("reparseFailedMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("can requeue a requested message even when it is behind other messages", async () => {
    const front1 = createMessage({
      match_game_id: "111",
      download_url: "http://example.com/a.dem",
      source: "faceit"
    });
    const target = createMessage({
      match_game_id: "222",
      demo_path: "http://example.com/b.dem",
      source: "faceit"
    });

    const getSequence: GetResult[] = [front1, target, false];

    const channel = {
      assertQueue: jest
        .fn()
        .mockResolvedValue({ queue: "parse_queue_failed", messageCount: 2 }),
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

    const result = await reparseFailedMessages({
      match_game_ids: [222],
      priority: 5
    });

    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledWith(target);
    // Non-requested message should be requeued (nack) after scan
    expect(channel.nack).toHaveBeenCalledWith(front1, false, true);

    expect(result).toMatchObject({
      success: true,
      requeued_count: 1,
      failed_count: 0
    });
  });
});
