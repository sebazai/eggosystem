import request from "supertest";
import express, { type RequestHandler } from "express";
import { Router } from "express";
import { z } from "zod";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import demoRouter from "./demo.routes";
import { setupFrontendUrl } from "../../../test-utils/environment-setup";
import { getMatchIdByGameId } from "../../../models/match-game.models";
import { publishToParseQueue } from "../../../services/parse-queue.services";
import { runQuery } from "../../../db/mysqlRunQuery";

jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

jest.mock("../../../models/match-game.models", () => ({
  getMatchIdByGameId: jest.fn()
}));

jest.mock("../../../services/parse-queue.services", () => ({
  publishToParseQueue: jest.fn(),
  createDemoProcessingRequest: jest.requireActual(
    "../../../services/parse-queue.services"
  ).createDemoProcessingRequest
}));

jest.mock("../../../models/failed-parse.models", () => ({
  getFailedParseMessages: jest.fn(),
  getFailedParseMessagesCount: jest.fn(),
  getFailedParseMessageById: jest.fn(),
  reparseFailedMessages: jest.fn(),
  getFailedParseMessagesStats: jest.fn()
}));

jest.mock("../../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

const mockGetPermissions = jest.mocked(getPermissionsForAccountId);
const mockGetRoles = jest.mocked(getRolesForAccountId);
const mockGetMatchIdByGameId = jest.mocked(getMatchIdByGameId);
const mockPublishToParseQueue = jest.mocked(publishToParseQueue);
const mockRunQuery = jest.mocked(runQuery);

const testAuthHeader = "x-test-auth";

const manualDemoAuditLogInsertParams = z.tuple([
  z.string(),
  z.string(),
  z.number(),
  z.number(),
  z.string(),
  z.string(),
  z.number(),
  z.string(),
  z.string(),
  z.string()
]);

/**
 * Default `runQuery` behavior for a full successful manual parse enqueue
 * (idempotency row, pending + finalize audit, idempotency updates).
 */
const defaultHappyPathRunQuery = (query: string) => {
  const q = String(query);
  if (q.includes("INSERT INTO ManualDemoParseIdempotency")) {
    return Promise.resolve({ insertId: 100, affectedRows: 1 });
  }
  if (q.includes("INSERT INTO AuditLog")) {
    return Promise.resolve({ insertId: 200, affectedRows: 1 });
  }
  if (q.includes("UPDATE ManualDemoParseIdempotency")) {
    return Promise.resolve({ affectedRows: 1, insertId: 0 });
  }
  if (q.includes("manual-demo-parse-finalize")) {
    return Promise.resolve({ affectedRows: 1, insertId: 0 });
  }
  return Promise.resolve({ affectedRows: 0, insertId: 0 });
};

const attachTestAuth: RequestHandler = (req, _res, next) => {
  if (req.get(testAuthHeader) === "none") {
    return next();
  }
  req.auth = {
    account_id: 99,
    provider: "steam",
    provider_id: "76561198000000099",
    permissions: [],
    roles: [],
    nickname: "Staff",
    jti: "jti"
  };
  next();
};

function createDemoDashboardTestApp() {
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
}

describe("POST /api/v1/dashboard/demos/manual/parse-queue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .set(testAuthHeader, "none")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(401);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 401,
      title: "Unauthorized",
      detail: "Not authenticated"
    });
    expect(String(res.body.detail)).not.toMatch(/forbidden/i);
    cleanup();
  });

  it("returns 403 for player role (not global staff)", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["player"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      status: 403,
      title: "Forbidden"
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 403 for caster role", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["caster"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(403);
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("enqueues for admin with HTTPS URL and propagates parse message contract", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 42 }]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockRunQuery.mockImplementation((q) => defaultHappyPathRunQuery(String(q)));

    const url =
      "https://cdn.example.com/very/long/path/segment/demo-file-name-goes-here.dem.zst";
    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 7,
        download_url: url,
        priority: 3
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "enqueued",
      match_game_id: 7
    });

    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    const msg = mockPublishToParseQueue.mock.calls[0][0];
    expect(msg).toMatchObject({
      match_game_id: "7",
      download_url: url,
      priority: 3,
      source: "dashboard-manual",
      reparse: false
    });
    expect(typeof msg.created_at).toBe("string");

    const auditCall = mockRunQuery.mock.calls.find(
      (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO AuditLog")
    );
    expect(auditCall).toBeDefined();
    if (!auditCall) {
      throw new Error("expected pending AuditLog INSERT");
    }
    const auditParams = manualDemoAuditLogInsertParams.parse(auditCall[1]);
    const requestData = JSON.parse(auditParams[4]);
    expect(requestData).toMatchObject({
      match_game_id: 7,
      source: "dashboard-manual",
      download_url_prefix: url.slice(0, 64),
      download_url_sha256_hex: expect.any(String)
    });
    expect(requestData.download_url_sha256_hex).toHaveLength(64);
    expect(requestData).not.toHaveProperty("download_url");
    expect(url.startsWith(requestData.download_url_prefix)).toBe(true);
    expect(requestData.download_url_prefix.length).toBeLessThanOrEqual(64);

    cleanup();
  });

  it("enqueues for helpdesk role (global staff)", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockRunQuery.mockImplementation((q) => defaultHappyPathRunQuery(String(q)));

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 2,
        download_url: "https://example.com/x.dem.zst"
      });

    expect(res.status).toBe(200);
    expect(mockPublishToParseQueue).toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 with Zod issues for non-HTTPS URL", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "http://example.com/demo.dem"
      });

    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      status: 400,
      issues: expect.any(Array)
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 when priority is out of range", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst",
        priority: 11
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 for invalid URL string", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "not-a-url"
      });

    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
    cleanup();
  });

  it("returns 404 when match game does not exist", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 999999,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      status: 404,
      title: "Not Found",
      detail: "Match game not found"
    });
    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    cleanup();
  });

  it("returns 400 and does not publish when pending audit insert fails", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockRunQuery.mockImplementation((query) => {
      const q = String(query);
      if (q.includes("INSERT INTO ManualDemoParseIdempotency")) {
        return Promise.resolve({ insertId: 100, affectedRows: 1 });
      }
      if (q.includes("INSERT INTO AuditLog")) {
        return Promise.reject(new Error("pending audit insert failed"));
      }
      return defaultHappyPathRunQuery(q);
    });

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/long-enough-path/demo.dem.zst"
      });

    expect(mockPublishToParseQueue).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 400,
      detail: "pending audit insert failed"
    });
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    cleanup();
  });

  it("returns application/problem+json when finalize step fails after RMQ publish", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockRunQuery.mockImplementation((query) => {
      const q = String(query);
      if (q.includes("INSERT INTO ManualDemoParseIdempotency")) {
        return Promise.resolve({ insertId: 100, affectedRows: 1 });
      }
      if (q.includes("INSERT INTO AuditLog")) {
        return Promise.resolve({ insertId: 200, affectedRows: 1 });
      }
      if (
        q.includes("UPDATE ManualDemoParseIdempotency") &&
        !q.includes("INSERT")
      ) {
        if (q.includes("audit_log_id")) {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
        if (q.includes("rmq_published_at")) {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
        if (q.includes("completed_at")) {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
      }
      if (q.includes("manual-demo-parse-finalize")) {
        return Promise.reject(new Error("finalize failed"));
      }
      return defaultHappyPathRunQuery(q);
    });

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    expect(mockPublishToParseQueue).toHaveBeenCalled();
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 400,
      detail: "finalize failed"
    });
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    cleanup();
  });

  it("retry after finalize failure completes without a second RMQ publish", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    type Phase = "a_fail_finalize" | "b_resume";
    let phase: Phase = "a_fail_finalize";
    mockRunQuery.mockImplementation((query) => {
      const q = String(query);
      if (
        q.includes("INSERT INTO ManualDemoParseIdempotency") &&
        phase === "b_resume"
      ) {
        return Promise.reject(
          Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY" })
        );
      }
      if (q.includes("INSERT INTO ManualDemoParseIdempotency")) {
        return Promise.resolve({ insertId: 100, affectedRows: 1 });
      }
      if (
        q.includes("SELECT id, audit_log_id, rmq_published_at, completed_at") &&
        q.includes("ManualDemoParseIdempotency") &&
        phase === "b_resume"
      ) {
        return Promise.resolve([
          {
            id: 100,
            audit_log_id: 200,
            rmq_published_at: "2020-01-01T00:00:00.000Z",
            completed_at: null
          }
        ]);
      }
      if (q.includes("INSERT INTO AuditLog") && phase === "a_fail_finalize") {
        return Promise.resolve({ insertId: 200, affectedRows: 1 });
      }
      if (q.includes("UPDATE ManualDemoParseIdempotency")) {
        if (q.includes("audit_log_id")) {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
        if (q.includes("rmq_published_at")) {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
        if (q.includes("completed_at") && phase === "b_resume") {
          return Promise.resolve({ affectedRows: 1, insertId: 0 });
        }
        if (q.includes("completed_at") && phase === "a_fail_finalize") {
          return Promise.reject(
            new Error("should not reach completed in phase a")
          );
        }
      }
      if (q.includes("manual-demo-parse-finalize")) {
        if (phase === "a_fail_finalize") {
          return Promise.reject(new Error("finalize failed"));
        }
        return Promise.resolve({ affectedRows: 1, insertId: 0 });
      }
      return defaultHappyPathRunQuery(q);
    });

    const body = {
      match_game_id: 1,
      download_url: "https://example.com/unique.dem.zst"
    };
    const res1 = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send(body);
    expect(res1.status).toBe(400);
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);

    phase = "b_resume";
    const res2 = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send(body);
    expect(res2.status).toBe(200);
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("returns 200 for idempotent second POST when enqueue already completed", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    type Phase = "first" | "second";
    let p: Phase = "first";
    mockRunQuery.mockImplementation((query) => {
      const q = String(query);
      if (q.includes("INSERT INTO ManualDemoParseIdempotency")) {
        if (p === "second") {
          return Promise.reject(
            Object.assign(new Error("dup"), { code: "ER_DUP_ENTRY" })
          );
        }
        return Promise.resolve({ insertId: 100, affectedRows: 1 });
      }
      if (
        q.includes("SELECT id, audit_log_id, rmq_published_at, completed_at") &&
        p === "second"
      ) {
        return Promise.resolve([
          {
            id: 100,
            audit_log_id: 200,
            rmq_published_at: "2020-01-01T00:00:00.000Z",
            completed_at: "2020-01-01T00:00:00.000Z"
          }
        ]);
      }
      return defaultHappyPathRunQuery(q);
    });

    const body = {
      match_game_id: 1,
      download_url: "https://example.com/idemp.dem.zst"
    };
    await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send(body);
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    p = "second";
    const res2 = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send(body);
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({ status: "enqueued", match_game_id: 1 });
    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("returns application/problem+json when RabbitMQ publish fails (after durable DB steps)", async () => {
    const { app, cleanup } = createDemoDashboardTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);
    mockGetMatchIdByGameId.mockResolvedValue([{ match_id: 1 }]);
    mockPublishToParseQueue.mockRejectedValue(new Error("amqp broke"));
    mockRunQuery.mockImplementation((q) => defaultHappyPathRunQuery(String(q)));

    const res = await request(app)
      .post("/api/v1/dashboard/demos/manual/parse-queue")
      .send({
        match_game_id: 1,
        download_url: "https://example.com/demo.dem.zst"
      });

    // Generic Error instances default to status 400 in express-error-handler
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      status: 400,
      detail: "amqp broke"
    });
    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(mockRunQuery).toHaveBeenCalled();
    expect(
      mockRunQuery.mock.calls.some(
        (c) =>
          typeof c[0] === "string" &&
          c[0].includes("INSERT INTO ManualDemoParseIdempotency")
      )
    ).toBe(true);
    expect(
      mockRunQuery.mock.calls.some(
        (c) => typeof c[0] === "string" && c[0].includes("INSERT INTO AuditLog")
      )
    ).toBe(true);
    cleanup();
  });
});
