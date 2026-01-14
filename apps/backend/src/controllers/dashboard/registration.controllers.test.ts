import request from "supertest";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  bulkApproveTeamRegistrationsController,
  addSignupForSeasonAdminController
} from "./registration.controllers";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import * as registrationModels from "../../models/dashboard/registration.models";
import * as seasonModels from "../../models/season.models";
import * as seasonTeamRegistrationModels from "../../models/season-team-registration.models";
import * as seasonTeamRegistrationServices from "../../services/season-team-registration.services";
import {
  SeasonPlatform,
  type SeasonDetails,
  createMockSeasonDetails,
  createMockSignupFormValues
} from "@eggosystem/types";

// Mock the models and services
jest.mock("../../models/dashboard/registration.models");
jest.mock("../../models/season.models");
jest.mock("../../models/season-team-registration.models");
jest.mock("../../services/season-team-registration.services");

const mockRegistrationModels = registrationModels as jest.Mocked<
  typeof registrationModels
>;
const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;
const mockSeasonTeamRegistrationModels =
  seasonTeamRegistrationModels as jest.Mocked<
    typeof seasonTeamRegistrationModels
  >;
const mockSeasonTeamRegistrationServices =
  seasonTeamRegistrationServices as jest.Mocked<
    typeof seasonTeamRegistrationServices
  >;

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

    app.post(
      "/season/:season_id/bulk-approve",
      bulkApproveTeamRegistrationsController
    );
    app.use(expressErrorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkApproveTeamRegistrationsController", () => {
    it("should approve teams successfully", async () => {
      // Mock the bulk approval function
      mockRegistrationModels.bulkApproveTeamRegistrations.mockResolvedValue({
        success: true,
        updatedCount: 2,
        teams: []
      });

      const response = await request(app)
        .post("/season/1/bulk-approve")
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
        "/season/:season_id/bulk-approve",
        bulkApproveTeamRegistrationsController
      );
      appWithoutAuth.use(expressErrorHandler);

      const response = await request(appWithoutAuth)
        .post("/season/1/bulk-approve")
        .send({ teamIds: [1, 2] });

      expect(response.status).toBe(401);
    });

    it("should return 400 when teamIds is not an array", async () => {
      const response = await request(app)
        .post("/season/1/bulk-approve")
        .send({ teamIds: "not-an-array" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "teamIds array is required and must not be empty"
      );
    });

    it("should return 400 when teamIds array is empty", async () => {
      const response = await request(app)
        .post("/season/1/bulk-approve")
        .send({ teamIds: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "teamIds array is required and must not be empty"
      );
    });

    it("should return 400 when season_id is invalid", async () => {
      const response = await request(app)
        .post("/season/0/bulk-approve")
        .send({ teamIds: [1, 2] });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe("Bad Request");
      expect(response.body.detail).toBe("Valid season_id is required");
    });
  });

  describe("addSignupForSeasonAdminController", () => {
    let adminApp: express.Application;

    beforeEach(() => {
      adminApp = express();
      adminApp.use(express.json());

      // Mock authentication middleware
      adminApp.use((req, res, next) => {
        req.auth = {
          account_id: 1,
          provider_id: "12345678901234567",
          permissions: [],
          roles: ["admin"],
          nickname: "adminuser",
          provider: "steam"
        };
        next();
      });

      adminApp.post(
        "/season/:season_id/signup",
        addSignupForSeasonAdminController
      );
      adminApp.use(expressErrorHandler);
    });

    it("should allow admin to add signup for closed season", async () => {
      const mockSeason = createMockSeasonDetails({
        signup_end_date: "2024-01-31T23:59:59Z"
      });

      const teamExternalId = uuidv4();
      const mockFormData = createMockSignupFormValues({
        teamExternalId
      });

      mockSeasonTeamRegistrationServices.getValidSeasonBypassDates.mockResolvedValue(
        mockSeason
      );
      mockSeasonTeamRegistrationServices.checkExternalId.mockResolvedValue();
      mockSeasonTeamRegistrationModels.addSignupForSeason.mockResolvedValue({
        team_id: 1,
        organization_id: 1
      });

      const response = await request(adminApp)
        .post("/season/1/signup")
        .send(mockFormData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        team_id: 1,
        organization_id: 1
      });
      expect(
        mockSeasonTeamRegistrationServices.getValidSeasonBypassDates
      ).toHaveBeenCalledWith(1);
      expect(
        mockSeasonTeamRegistrationServices.checkExternalId
      ).toHaveBeenCalledWith(SeasonPlatform.FACEIT, teamExternalId);
      expect(
        mockSeasonTeamRegistrationModels.addSignupForSeason
      ).toHaveBeenCalledWith(mockSeason, mockFormData);
    });

    it("should return 404 when season does not exist", async () => {
      // Use the real getValidSeasonBypassDates implementation, but mock getSeasonDetailsById to return undefined
      // This will cause getValidSeasonBypassDates to naturally throw NotFoundError
      const realGetValidSeasonBypassDates = jest.requireActual<
        typeof seasonTeamRegistrationServices
      >(
        "../../services/season-team-registration.services"
      ).getValidSeasonBypassDates;
      mockSeasonTeamRegistrationServices.getValidSeasonBypassDates.mockImplementation(
        realGetValidSeasonBypassDates
      );
      mockSeasonModels.getSeasonDetailsById.mockResolvedValue(undefined);

      const mockFormData = createMockSignupFormValues({
        teamExternalId: uuidv4()
      });

      const response = await request(adminApp)
        .post("/season/999/signup")
        .send(mockFormData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "Season not found",
        instance: "/season/999/signup"
      });
    });

    it("should validate form data using signupFormSchema", async () => {
      const mockSeason: SeasonDetails = createMockSeasonDetails();

      mockSeasonTeamRegistrationServices.getValidSeasonBypassDates.mockResolvedValue(
        mockSeason
      );

      // Send invalid data (missing required fields)
      const response = await request(adminApp)
        .post("/season/1/signup")
        .send({ organizationId: 1 });

      expect(response.status).toBe(400);
    });
  });
});
