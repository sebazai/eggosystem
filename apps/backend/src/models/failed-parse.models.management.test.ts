import { getFailedParseMessagesCount } from "./failed-parse.models";

jest.mock("../services/rabbitmq-management.services", () => ({
  getQueueInfo: jest.fn(),
  getMessagesFromQueue: jest.fn()
}));

import { getQueueInfo } from "../services/rabbitmq-management.services";

const mockGetQueueInfo = getQueueInfo as jest.MockedFunction<
  typeof getQueueInfo
>;

describe("getFailedParseMessagesCount (management API)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses management API when queueFilter is provided", async () => {
    mockGetQueueInfo.mockResolvedValue({
      name: "parse_queue_failed",
      vhost: "/",
      messages: 123
    });

    const count = await getFailedParseMessagesCount(
      "parse_queue_failed",
      "failed"
    );

    expect(mockGetQueueInfo).toHaveBeenCalledWith("parse_queue_failed");
    expect(count).toBe(123);
  });

  it("uses management API for all queues when queueFilter is not provided", async () => {
    mockGetQueueInfo.mockImplementation(async (queueName: string) => {
      return { name: queueName, vhost: "/", messages: 10 };
    });

    const count = await getFailedParseMessagesCount(undefined, "failed");
    expect(count).toBeGreaterThan(0);
    expect(mockGetQueueInfo).toHaveBeenCalled();
  });
});
