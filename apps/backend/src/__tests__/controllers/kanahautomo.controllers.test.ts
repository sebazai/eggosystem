import { type Request, type Response } from "express";
import { registerForKanahautomo } from "../../controllers/kanahautomo.controllers";
import * as kanahautomoModels from "../../models/kanahautomo.models";
import * as organizationModels from "../../models/organization.models";
import type { JwtPayload } from "jsonwebtoken";
import type { Organizations, KanahautomoRegistration } from "@eggosystem/types";

// Mock the models
jest.mock("../../models/kanahautomo.models");
jest.mock("../../models/organization.models");
jest.mock("../../utils/app-logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const mockKanahautomoModels = kanahautomoModels as jest.Mocked<
  typeof kanahautomoModels
>;
const mockOrganizationModels = organizationModels as jest.Mocked<
  typeof organizationModels
>;

describe("Kanahautomo Controllers", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("registerForKanahautomo", () => {
    it("should successfully register a player for Kanahautomo", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      const mockOrg: Organizations = {
        id: 1,
        name: "Test Org",
        logo: "",
        organization_code: "TEST",
        website: "",
        country: "",
        sort_order: null
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockKanahautomoModels.getKanahautomoRegistrationsByPlayer.mockResolvedValue(
        []
      );
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue([
        { insertId: 123 }
      ]);

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(
        1
      );
      expect(
        mockKanahautomoModels.getKanahautomoRegistrationsByPlayer
      ).toHaveBeenCalledWith("76561198000000001");
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("76561198000000001", 1);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Successfully registered for Kanahautomo",
        registration_id: 123,
        organization_id: 1,
        steam_id: "76561198000000001"
      });
    });

    it("should return 401 when no auth is provided", async () => {
      // Arrange
      mockRequest = {
        body: { organization_id: 1 }
      };

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 400 when organization_id is missing", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: {}
      };

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "organization_id is required and must be a number"
      });
    });

    it("should return 400 when organization_id is not a number", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: "invalid" }
      };

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: "organization_id is required and must be a number"
      });
    });

    it("should return 404 when organization does not exist", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 999 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([]);

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(
        999
      );
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Organization not found"
      });
    });

    it("should return 409 when player is already registered", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      const mockOrg: Organizations = {
        id: 1,
        name: "Test Org",
        logo: "",
        organization_code: "TEST",
        website: "",
        country: "",
        sort_order: null
      };

      const mockRegistration: KanahautomoRegistration = {
        id: 1,
        steam_id: "76561198000000001",
        organization_id: 1,
        status: "active",
        created_at: "2025-01-27T00:00:00.000Z"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockKanahautomoModels.getKanahautomoRegistrationsByPlayer.mockResolvedValue(
        [mockRegistration]
      );

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(
        mockKanahautomoModels.getKanahautomoRegistrationsByPlayer
      ).toHaveBeenCalledWith("76561198000000001");
      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Player is already registered for Kanahautomo",
        registration: mockRegistration
      });
    });

    it("should return 500 when database error occurs", async () => {
      // Arrange
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockRejectedValue(
        new Error("Database error")
      );

      // Act
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: "Internal server error"
      });
    });
  });
});
