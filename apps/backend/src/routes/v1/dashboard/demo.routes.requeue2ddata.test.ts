// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.BACKEND_SERVICE_API_KEY = "test-api-key";

import request from "supertest";
import express, { Router, type RequestHandler } from "express";
import type expressApp from "express";
import demoRouter from "./demo.routes";
import { createExpressTestApp } from "../../../test-utils";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import { setupFrontendUrl } from "../../../test-utils/environment-setup";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";

jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

jest.mock("../../../models/failed-parse.models", () => ({
  getFailedParseMessages: jest.fn(),
  getFailedParseMessagesCount: jest.fn(),
  getFailedParseMessageById: jest.fn(),
  reparseFailedMessages: jest.fn(),
  getFailedParseMessagesStats: jest.fn(),
  requeue2ddataFailedMessages: jest.fn(),
  requeueAllFailedMessages: jest.fn()
}));

jest.mock("../../../services/failed-parse-background-queue.services", () => ({
  enqueueFailedParseBackgroundJob: jest.fn(async () => ({
    jobId: "queued-job-1"
  }))
}));

import {
  requeue2ddataFailedMessages,
  requeueAllFailedMessages
} from "../../../models/failed-parse.models";
import { reparseFailedMessages } from "../../../models/failed-parse.models";
import { enqueueFailedParseBackgroundJob } from "../../../services/failed-parse-background-queue.services";

const mockRequeue2ddataFailedMessages =
  requeue2ddataFailedMessages as jest.MockedFunction<
    typeof requeue2ddataFailedMessages
  >;

const mockEnqueueFailedParseBackgroundJob =
  enqueueFailedParseBackgroundJob as jest.MockedFunction<
    typeof enqueueFailedParseBackgroundJob
  >;

const attachTestAuth: RequestHandler = (req, _res, next) => {
  req.auth = {
    account_id: 7,
    provider: "steam",
    provider_id: "76561198000000007",
    permissions: [],
    roles: [],
    nickname: "Staff",
    jti: "jti"
  };
  next();
};

const createAuthedDemoApp = (): {
  app: expressApp.Application;
  cleanup: () => void;
} => {
  const cleanup = setupFrontendUrl();
  const wrapped = Router();
  wrapped.use(attachTestAuth);
  wrapped.use(
    checkPermissions({ fallbackRoles: ["admin", "helpdesk"] }),
    demoRouter
  );
  const app = express();
  app.use(express.json());
  app.use("/api/v1/dashboard/demos", wrapped);
  app.use(expressErrorHandler);
  return { app, cleanup };
};

describe("POST /v1/dashboard/demos/failed/parse/requeue-2ddata", () => {
  let app: expressApp.Application;
  let cleanup: () => void;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAuthedDemoApp();
    app = testApp;
    cleanup = appCleanup;
    jest.clearAllMocks();
    jest.mocked(getPermissionsForAccountId).mockResolvedValue([]);
    jest.mocked(getRolesForAccountId).mockResolvedValue(["admin"]);
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
    expect(mockEnqueueFailedParseBackgroundJob).not.toHaveBeenCalled();
  });

  it("returns 403 for helpdesk role", async () => {
    jest.mocked(getRolesForAccountId).mockResolvedValue(["helpdesk"]);

    await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-2ddata")
      .send({ items: [{ match_game_id: "108925", demo_path: "demo1.zip" }] })
      .expect(403);

    expect(mockRequeue2ddataFailedMessages).not.toHaveBeenCalled();
    expect(mockEnqueueFailedParseBackgroundJob).not.toHaveBeenCalled();
  });

  it("returns 200 queued with job_id when request has >5 items", async () => {
    const { app: authedApp, cleanup: authCleanup } = createAuthedDemoApp();
    try {
      const response = await request(authedApp)
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
        queued: true,
        requested_count: 6,
        job_id: "queued-job-1"
      });
      expect(mockEnqueueFailedParseBackgroundJob).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "requeue2ddata",
          userId: 7,
          body: expect.objectContaining({
            items: expect.any(Array)
          })
        })
      );
      expect(mockRequeue2ddataFailedMessages).not.toHaveBeenCalled();
    } finally {
      authCleanup();
    }
  });
});

describe("POST /v1/dashboard/demos/failed/parse/requeue-all", () => {
  let app: expressApp.Application;
  let cleanup: () => void;

  const mockRequeueAllFailedMessages =
    requeueAllFailedMessages as jest.MockedFunction<
      typeof requeueAllFailedMessages
    >;

  beforeEach(() => {
    const { app: testApp, cleanup: appCleanup } = createAuthedDemoApp();
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

  it("returns 401 when not authenticated", async () => {
    const { app: anonApp, cleanup: anonCleanup } = createExpressTestApp(
      demoRouter,
      "/api/v1/dashboard/demos"
    );
    try {
      await request(anonApp)
        .post("/api/v1/dashboard/demos/failed/parse/requeue-all")
        .send({ queue_name: "parse_queue_failed", priority: 5 })
        .expect(401);
    } finally {
      anonCleanup();
    }
  });

  it("returns 200 queued with job_id and enqueues background job", async () => {
    const response = await request(app)
      .post("/api/v1/dashboard/demos/failed/parse/requeue-all")
      .send({ queue_name: "parse_queue_failed", priority: 5 })
      .expect(200);

    expect(mockEnqueueFailedParseBackgroundJob).toHaveBeenCalledWith({
      kind: "requeueAll",
      userId: 7,
      body: { queue_name: "parse_queue_failed", priority: 5 }
    });
    expect(mockRequeueAllFailedMessages).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      requeued_count: 0,
      failed_count: 0,
      queued: true,
      job_id: "queued-job-1"
    });
  });
});

describe("POST /v1/dashboard/demos/failed/parse/reparse", () => {
  let cleanup: () => void;

  const mockReparseFailedMessages =
    reparseFailedMessages as jest.MockedFunction<typeof reparseFailedMessages>;

  beforeEach(() => {
    const { cleanup: appCleanup } = createExpressTestApp(
      demoRouter,
      "/api/v1/dashboard/demos"
    );
    cleanup = appCleanup;
    jest.clearAllMocks();
    jest.mocked(getPermissionsForAccountId).mockResolvedValue([]);
    jest.mocked(getRolesForAccountId).mockResolvedValue(["admin"]);
  });

  afterEach(() => cleanup());

  it("returns 200 queued with job_id when request has >5 ids", async () => {
    const { app: authedApp, cleanup: authCleanup } = createAuthedDemoApp();
    try {
      const response = await request(authedApp)
        .post("/api/v1/dashboard/demos/failed/parse/reparse")
        .send({ match_game_ids: [1, 2, 3, 4, 5, 6], priority: 5 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        queued: true,
        requested_count: 6,
        job_id: "queued-job-1"
      });
      expect(mockEnqueueFailedParseBackgroundJob).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "reparse",
          userId: 7,
          body: { match_game_ids: [1, 2, 3, 4, 5, 6], priority: 5 }
        })
      );
      expect(mockReparseFailedMessages).not.toHaveBeenCalled();
    } finally {
      authCleanup();
    }
  });

  it("returns 403 for helpdesk role", async () => {
    jest.mocked(getRolesForAccountId).mockResolvedValue(["helpdesk"]);
    const { app: authedApp, cleanup: authCleanup } = createAuthedDemoApp();
    try {
      await request(authedApp)
        .post("/api/v1/dashboard/demos/failed/parse/reparse")
        .send({ match_game_ids: [1, 2, 3, 4, 5, 6], priority: 5 })
        .expect(403);
    } finally {
      authCleanup();
    }
  });
});
