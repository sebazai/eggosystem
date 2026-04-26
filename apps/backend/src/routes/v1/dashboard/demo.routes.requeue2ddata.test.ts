// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import type express from "express";
import demoRouter from "./demo.routes";
import { createExpressTestApp } from "../../../test-utils";

jest.mock("../../../models/failed-parse.models", () => ({
  getFailedParseMessages: jest.fn(),
  getFailedParseMessagesCount: jest.fn(),
  getFailedParseMessageById: jest.fn(),
  reparseFailedMessages: jest.fn(),
  getFailedParseMessagesStats: jest.fn(),
  requeue2ddataFailedMessages: jest.fn(),
  requeueAllFailedMessages: jest.fn()
}));

import {
  requeue2ddataFailedMessages,
  requeueAllFailedMessages
} from "../../../models/failed-parse.models";
import { reparseFailedMessages } from "../../../models/failed-parse.models";

const mockRequeue2ddataFailedMessages =
  requeue2ddataFailedMessages as jest.MockedFunction<
    typeof requeue2ddataFailedMessages
  >;

describe("POST /v1/dashboard/demos/failed/parse/requeue-2ddata", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      demoRouter,
      "/api/v1/dashboard/demos"
    );
    app = testApp;
    cleanup = appCleanup;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns 400 for invalid body", async () => {
    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-2ddata")
      .send({ items: [{ match_game_id: "108925" }] })
      .expect(400);

    expect(response.body).toMatchObject({
      type: "about:blank",
      title: "Validation Failed",
      status: 400,
      detail: "Invalid 2ddata requeue request"
    });
  });

  it("returns 200 and forwards response on success", async () => {
    mockRequeue2ddataFailedMessages.mockResolvedValue({
      success: true,
      requeued_count: 1,
      failed_count: 0
    });

    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-2ddata")
      .send({ items: [{ match_game_id: "108925", demo_path: "demo1.zip" }] })
      .expect(200);

    expect(mockRequeue2ddataFailedMessages).toHaveBeenCalledWith({
      items: [{ match_game_id: "108925", demo_path: "demo1.zip" }]
    });

    expect(response.body).toEqual({
      success: true,
      requeued_count: 1,
      failed_count: 0
    });
  });

  it("returns 200 queued when request has >5 items", async () => {
    mockRequeue2ddataFailedMessages.mockResolvedValue({
      success: true,
      requeued_count: 6,
      failed_count: 0
    });

    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-2ddata")
      .send({
        items: Array.from({ length: 6 }).map((_, i) => ({
          match_game_id: String(1000 + i),
          demo_path: `demo${i}.zip`
        }))
      })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      queued: true
    });
    expect(mockRequeue2ddataFailedMessages).toHaveBeenCalled();
  });
});

describe("POST /v1/dashboard/demos/failed/parse/requeue-all", () => {
  let app: express.Application;
  let cleanup: () => void;

  const mockRequeueAllFailedMessages =
    requeueAllFailedMessages as jest.MockedFunction<
      typeof requeueAllFailedMessages
    >;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      demoRouter,
      "/api/v1/dashboard/demos"
    );
    app = testApp;
    cleanup = appCleanup;
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns 400 for invalid body", async () => {
    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-all")
      .send({ queue_name: "" })
      .expect(400);

    expect(response.body).toMatchObject({
      type: "about:blank",
      title: "Validation Failed",
      status: 400,
      detail: "Invalid requeue-all request"
    });
  });

  it("returns 200 and forwards response on success", async () => {
    mockRequeueAllFailedMessages.mockResolvedValue({
      success: true,
      requeued_count: 12,
      failed_count: 0
    });

    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-all")
      .send({ queue_name: "parse_queue_failed", priority: 5 })
      .expect(200);

    expect(mockRequeueAllFailedMessages).toHaveBeenCalledWith({
      queue_name: "parse_queue_failed",
      priority: 5
    });

    expect(response.body).toEqual({
      success: true,
      requeued_count: 12,
      failed_count: 0
    });
  });

  it("returns 200 queued (async)", async () => {
    mockRequeueAllFailedMessages.mockResolvedValue({
      success: true,
      requeued_count: 12,
      failed_count: 0
    });

    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-all")
      .send({ queue_name: "parse_queue_failed", priority: 5 })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      queued: true
    });
    expect(mockRequeueAllFailedMessages).toHaveBeenCalled();
  });
});

describe("POST /v1/dashboard/demos/failed/parse/reparse", () => {
  let app: express.Application;
  let cleanup: () => void;

  const mockReparseFailedMessages =
    reparseFailedMessages as jest.MockedFunction<typeof reparseFailedMessages>;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createExpressTestApp(
      demoRouter,
      "/api/v1/dashboard/demos"
    );
    app = testApp;
    cleanup = appCleanup;
    jest.clearAllMocks();
  });

  afterEach(() => cleanup());

  it("returns 200 queued when request has >5 ids", async () => {
    mockReparseFailedMessages.mockResolvedValue({
      success: true,
      requeued_count: 6,
      failed_count: 0
    });

    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/reparse")
      .send({ match_game_ids: [1, 2, 3, 4, 5, 6], priority: 5 })
      .expect(200);

    expect(response.body).toMatchObject({ success: true, queued: true });
    expect(mockReparseFailedMessages).toHaveBeenCalled();
  });
});
