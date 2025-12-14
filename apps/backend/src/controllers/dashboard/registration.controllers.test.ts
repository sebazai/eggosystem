import request from "supertest";
import express from "express";
import { bulkApproveTeamRegistrationsController } from "./registration.controllers";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import * as registrationModels from "../../models/dashboard/registration.models";
import * as seasonModels from "../../models/season.models";
import {
  SeasonPlatform,
  type ActiveSignupOrSeasonForAppId
} from "@eggosystem/types";

// Mock the models
jest.mock("../../models/dashboard/registration.models");
jest.mock("../../models/season.models");

const mockRegistrationModels = registrationModels as jest.Mocked<
  typeof registrationModels
>;
const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;

describe("Registration Controllers", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.auth = {
        account_id: 1,
        provider_id: "12345678901234567",
        permissions: [],
        roles: [],
        nickname: "testuser",
        provider: "steam"
      };
      next();
    });

    app.post("/bulk-approve", bulkApproveTeamRegistrationsController);
    app.use(expressErrorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkApproveTeamRegistrationsController", () => {
    it("should approve teams successfully", async () => {
      // Mock the active season
      const mockActiveSeason: ActiveSignupOrSeasonForAppId = {
        season_id: 1,
        platform: SeasonPlatform.Kanaliiga,
        signup_start_date: "2024-01-01",
        signup_end_date: "2024-12-31",
        start_date: "2025-01-01",
        end_date: "2025-03-31",
        full_name: "Test Season"
      };
      mockSeasonModels.getActiveSignupOrActiveSeasonForAppId.mockResolvedValue(
        mockActiveSeason
      );

      // Mock the bulk approval function
      mockRegistrationModels.bulkApproveTeamRegistrations.mockResolvedValue({
        success: true,
        updatedCount: 2,
        teams: []
      });

      const response = await request(app)
        .post("/bulk-approve")
        .send({ teamIds: [1, 2] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        updatedCount: 2,
        teams: []
      });
    });

    it("should return 401 when no auth user", async () => {
      // Create app without auth middleware for this test
      const appWithoutAuth = express();
      appWithoutAuth.use(express.json());
      appWithoutAuth.post(
        "/bulk-approve",
        bulkApproveTeamRegistrationsController
      );
      appWithoutAuth.use(expressErrorHandler);

      const response = await request(appWithoutAuth)
        .post("/bulk-approve")
        .send({ teamIds: [1, 2] });

      expect(response.status).toBe(401);
    });

    it("should return 400 when teamIds is not an array", async () => {
      const response = await request(app)
        .post("/bulk-approve")
        .send({ teamIds: "not-an-array" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "teamIds array is required and must not be empty"
      );
    });

    it("should return 400 when teamIds array is empty", async () => {
      const response = await request(app)
        .post("/bulk-approve")
        .send({ teamIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "teamIds array is required and must not be empty"
      );
    });

    it("should throw error when no active season", async () => {
      mockSeasonModels.getActiveSignupOrActiveSeasonForAppId.mockResolvedValue(
        undefined
      );

      const response = await request(app)
        .post("/bulk-approve")
        .send({ teamIds: [1, 2] });

      expect(response.status).toBe(400);
    });
  });
});
