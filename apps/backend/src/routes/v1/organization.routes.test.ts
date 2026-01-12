// Set environment variables before importing modules that depend on them
process.env.FRONTEND_URL = "http://localhost:3000";

import request from "supertest";
import type express from "express";
import { createExpressTestApp, setupEnvironment } from "../../test-utils";
import organizationRouter from "./organization.routes";
import * as organizationsControllers from "../../controllers/organizations.controllers";

// Mock controllers
jest.mock("../../controllers/organizations.controllers");

const mockGetOrgs = organizationsControllers.getOrgs as jest.MockedFunction<
  typeof organizationsControllers.getOrgs
>;
const mockGetOrgById =
  organizationsControllers.getOrgById as jest.MockedFunction<
    typeof organizationsControllers.getOrgById
  >;
const mockGetOrgTeamTrophiesController =
  organizationsControllers.getOrgTeamTrophiesController as jest.MockedFunction<
    typeof organizationsControllers.getOrgTeamTrophiesController
  >;
const mockGetOrganizationApprovedTeamsController =
  organizationsControllers.getOrganizationApprovedTeamsController as jest.MockedFunction<
    typeof organizationsControllers.getOrganizationApprovedTeamsController
  >;
const mockGetOrgDiscordInviteLinkController =
  organizationsControllers.getOrgDiscordInviteLinkController as jest.MockedFunction<
    typeof organizationsControllers.getOrgDiscordInviteLinkController
  >;

describe("Organization Routes Integration Tests", () => {
  let app: express.Application;
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = setupEnvironment({
      FRONTEND_URL: "http://localhost:3000"
    });

    const { app: testApp } = createExpressTestApp(
      organizationRouter,
      "/api/v1/organizations"
    );
    app = testApp;

    jest.clearAllMocks();

    // Setup default mocks
    mockGetOrgs.mockImplementation(async (req, res) => {
      res.status(200).json({ organizations: [] });
    });
    mockGetOrgById.mockImplementation(async (req, res) => {
      res.status(200).json({ id: req.params.id });
    });
    mockGetOrgTeamTrophiesController.mockImplementation(async (req, res) => {
      res.status(200).json({ trophies: [] });
    });
    mockGetOrganizationApprovedTeamsController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ teams: [] });
      }
    );
    mockGetOrgDiscordInviteLinkController.mockImplementation(
      async (req, res) => {
        res.status(200).json({ inviteLink: "https://discord.gg/test" });
      }
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe("GET /", () => {
    it("should return organizations list without authentication", async () => {
      const res = await request(app).get("/api/v1/organizations");

      expect(res.status).toBe(200);
      expect(mockGetOrgs).toHaveBeenCalled();
      expect(res.body).toHaveProperty("organizations");
    });

    it("should handle errors properly", async () => {
      mockGetOrgs.mockImplementation(async () => {
        throw new Error("Database error");
      });

      const res = await request(app).get("/api/v1/organizations");

      // Generic errors default to 400 status in error handler
      expect(res.status).toBe(400);
      expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });

  describe("GET /:id", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get("/api/v1/organizations/invalid");

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return organization by id with valid numeric param", async () => {
      const res = await request(app).get("/api/v1/organizations/123");

      expect(res.status).toBe(200);
      expect(mockGetOrgById).toHaveBeenCalled();
      expect(res.body.id).toBe("123");
    });

    it("should not require authentication", async () => {
      const res = await request(app).get("/api/v1/organizations/123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /:id/trophies", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/organizations/invalid/trophies"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return organization trophies without authentication", async () => {
      const res = await request(app).get("/api/v1/organizations/123/trophies");

      expect(res.status).toBe(200);
      expect(mockGetOrgTeamTrophiesController).toHaveBeenCalled();
    });
  });

  describe("GET /:id/teams", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get("/api/v1/organizations/invalid/teams");

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should return organization teams without authentication", async () => {
      const res = await request(app).get("/api/v1/organizations/123/teams");

      expect(res.status).toBe(200);
      expect(mockGetOrganizationApprovedTeamsController).toHaveBeenCalled();
    });
  });

  describe("GET /:id/discord-invite-link", () => {
    it("should validate numeric params", async () => {
      const res = await request(app).get(
        "/api/v1/organizations/invalid/discord-invite-link"
      );

      expect(res.status).toBe(400);
      expect(res.body.detail).toContain("Invalid numeric param");
    });

    it("should require authentication", async () => {
      const res = await request(app).get(
        "/api/v1/organizations/123/discord-invite-link"
      );

      expect(res.status).toBe(401);
    });

    it("should return discord invite link when authenticated", async () => {
      const res = await request(app)
        .get("/api/v1/organizations/123/discord-invite-link")
        .set("Authorization", "Bearer valid_token");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("inviteLink");
      expect(mockGetOrgDiscordInviteLinkController).toHaveBeenCalled();
    });
  });
});
