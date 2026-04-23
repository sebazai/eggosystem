import request from "supertest";
import express, { type RequestHandler } from "express";
import { Router } from "express";
import {
  getPermissionsForAccountId,
  getRolesForAccountId
} from "../../../services/auth.services";
import { checkPermissions } from "../../../middlewares/auth.middleware";
import { expressErrorHandler } from "../../../middlewares/express-error-handler";
import marketingSponsorsRouter from "./marketing-sponsors.routes";
import { setupFrontendUrl } from "../../../test-utils/environment-setup";

jest.mock("../../../services/auth.services", () => ({
  getPermissionsForAccountId: jest.fn(),
  getRolesForAccountId: jest.fn()
}));

jest.mock(
  "../../../controllers/dashboard-marketing-sponsors.controllers",
  () => ({
    listDashboardMarketingSponsorsController: jest.fn((_req, res) => {
      res.json({ sponsors: [] });
    }),
    createDashboardMarketingSponsorController: jest.fn((_req, res) => {
      res.status(201).json({ id: 1 });
    }),
    patchDashboardMarketingSponsorController: jest.fn((_req, res) => {
      res.json({ ok: true });
    }),
    deleteDashboardMarketingSponsorController: jest.fn((_req, res) => {
      res.status(204).end();
    }),
    reorderDashboardMarketingSponsorsController: jest.fn((_req, res) => {
      res.json({ ok: true });
    })
  })
);

const mockGetPermissions = jest.mocked(getPermissionsForAccountId);
const mockGetRoles = jest.mocked(getRolesForAccountId);

const testAuthHeader = "x-test-auth";

const attachTestAuth: RequestHandler = (req, _res, next) => {
  if (req.get(testAuthHeader) === "none") {
    return next();
  }
  req.auth = {
    account_id: 42,
    provider: "steam",
    provider_id: "76561198000000000",
    permissions: [],
    roles: [],
    nickname: "Test",
    jti: "jti"
  };
  next();
};

function createSponsorsTestApp() {
  const cleanup = setupFrontendUrl();
  const wrapped = Router();
  wrapped.use(attachTestAuth);
  wrapped.use(
    checkPermissions({ fallbackRoles: ["admin"] }),
    marketingSponsorsRouter
  );

  const app = express();
  app.use(express.json());
  app.use("/api/v1/dashboard/sponsors", wrapped);
  app.use(expressErrorHandler);
  return { app, cleanup };
}

describe("GET /api/v1/dashboard/sponsors (admin-only mount)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/v1/dashboard/sponsors")
      .set(testAuthHeader, "none");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 401,
      title: expect.any(String)
    });
    cleanup();
  });

  it("returns 403 for helpdesk (no admin fallback match)", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app).get("/api/v1/dashboard/sponsors");

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      status: 403,
      title: expect.any(String)
    });
    cleanup();
  });

  it("allows admin and reaches list controller", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app).get("/api/v1/dashboard/sponsors");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sponsors: [] });
    cleanup();
  });
});

describe("POST /api/v1/dashboard/sponsors (admin-only mount)", () => {
  it("allows admin for create", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["admin"]);

    const res = await request(app).post("/api/v1/dashboard/sponsors").send({
      tier: "main_partner",
      display_name: "Acme"
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1 });
    cleanup();
  });

  it("returns 403 for helpdesk on POST", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app).post("/api/v1/dashboard/sponsors").send({
      tier: "main_partner",
      display_name: "Acme"
    });

    expect(res.status).toBe(403);
    cleanup();
  });
});

describe("Mutating dashboard sponsor routes (admin-only mount)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for helpdesk on PATCH", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app)
      .patch("/api/v1/dashboard/sponsors/1")
      .send({ display_name: "x" });

    expect(res.status).toBe(403);
    cleanup();
  });

  it("returns 403 for helpdesk on DELETE", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app).delete("/api/v1/dashboard/sponsors/1");

    expect(res.status).toBe(403);
    cleanup();
  });

  it("returns 403 for helpdesk on PUT reorder", async () => {
    const { app, cleanup } = createSponsorsTestApp();
    mockGetPermissions.mockResolvedValue([]);
    mockGetRoles.mockResolvedValue(["helpdesk"]);

    const res = await request(app)
      .put("/api/v1/dashboard/sponsors/reorder")
      .send({ tier: "main_partner", ordered_ids: [1, 2] });

    expect(res.status).toBe(403);
    cleanup();
  });
});
