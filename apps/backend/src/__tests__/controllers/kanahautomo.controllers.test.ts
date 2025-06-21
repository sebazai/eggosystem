import { type Request, type Response } from "express";
import {
  registerForKanahautomo,
  getKanahautomoOrganizationStatus,
  getKanahautomoRegistrationCounts,
  registerForKanahautomoWithOrganization
} from "../../controllers/kanahautomo.controllers";
import * as kanahautomoModels from "../../models/kanahautomo.models";
import * as organizationModels from "../../models/organization.models";
import * as seasonModels from "../../models/season.models";
import type { JwtPayload } from "jsonwebtoken";
import type {
  ActiveSeasonSignupForAppId,
  Organizations
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Mock the models
jest.mock("../../models/kanahautomo.models");
jest.mock("../../models/organization.models");
jest.mock("../../models/season.models");
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
const mockSeasonModels = seasonModels as jest.Mocked<typeof seasonModels>;

const mockOrg: Organizations = {
  id: 1,
  name: "Test Org",
  logo: "",
  organization_code: "TEST",
  website: "",
  country: "",
  sort_order: null
};

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

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };
      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);
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
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("76561198000000001", 1, 15);
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

      // Act & Assert
      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Valid organization_id is required");
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

      // Act & Assert
      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Valid organization_id is required");
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

    it("should return 400 when no active season is found", async () => {
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

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue(
        undefined
      );

      // Act & Assert
      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("No active season found for CS2");
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

      // Act & Assert
      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Database error");
    });

    it("should return 400 when player is already registered for the same season", async () => {
      // Mock successful first registration
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValueOnce([
        { insertId: 1 }
      ]);

      // Mock duplicate registration error with code 'ER_DUP_ENTRY'
      const dupError = new Error("Duplicate entry") as Error & { code: string };
      dupError.code = "ER_DUP_ENTRY";
      mockKanahautomoModels.registerPlayerForKanahautomo.mockRejectedValueOnce(
        dupError
      );

      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);

      // First registration should succeed
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(
        1
      );
      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("steam123", 1, 15);
      expect(mockStatus).toHaveBeenCalledWith(201);

      // Reset mock for second call
      mockStatus.mockClear();
      mockJson.mockClear();

      // Second registration should fail
      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Duplicate entry");
    });

    it("should allow registration for different seasons", async () => {
      // Mock successful registrations for different seasons
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValueOnce([
        { insertId: 1 }
      ]);
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValueOnce([
        { insertId: 2 }
      ]);

      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);

      // First registration for season 1
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(
        1
      );
      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("steam123", 1, 15);
      expect(mockStatus).toHaveBeenCalledWith(201);

      // Reset mock for second call
      mockStatus.mockClear();
      mockJson.mockClear();

      // Second registration for season 2 should also succeed
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it("should return 400 when organization_id is missing", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: {}
      };

      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Valid organization_id is required");
    });

    it("should return 400 when organization_id is not a number", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: "invalid" }
      };

      await expect(
        registerForKanahautomo(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Valid organization_id is required");
    });
  });

  describe("getKanahautomoOrganizationStatus", () => {
    it("should return organization status for the current season", async () => {
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 42,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      });
      mockKanahautomoModels.getKanahautomoOrganizationStatusForSeason.mockResolvedValue(
        [
          {
            organization_id: 1,
            organization_name: "Org 1",
            count: 5,
            status: "ready"
          },
          {
            organization_id: 2,
            organization_name: "Org 2",
            count: 2,
            status: "waiting"
          }
        ]
      );
      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;
      await getKanahautomoOrganizationStatus(req, res);
      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.getKanahautomoOrganizationStatusForSeason
      ).toHaveBeenCalledWith(42);
      expect(res.json).toHaveBeenCalledWith({
        season_id: 42,
        organizations: [
          {
            organization_id: 1,
            organization_name: "Org 1",
            count: 5,
            status: "ready"
          },
          {
            organization_id: 2,
            organization_name: "Org 2",
            count: 2,
            status: "waiting"
          }
        ]
      });
    });

    it("should return 404 if no active season found", async () => {
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue(
        undefined
      );
      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;
      await getKanahautomoOrganizationStatus(req, res);
      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "No active season found for CS2"
      });
    });
  });

  describe("getKanahautomoRegistrationCounts", () => {
    it("should return registration counts for all organizations", async () => {
      const mockCounts = [
        {
          organization_id: 1,
          organization_name: "Test Org 1",
          registration_count: 3,
          has_discord_channel: false
        },
        {
          organization_id: 2,
          organization_name: "Test Org 2",
          registration_count: 5,
          has_discord_channel: true
        }
      ];

      (
        kanahautomoModels.getKanahautomoRegistrationCounts as jest.Mock
      ).mockResolvedValue(mockCounts);

      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;

      await getKanahautomoRegistrationCounts(req, res);

      expect(
        kanahautomoModels.getKanahautomoRegistrationCounts
      ).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith(mockCounts);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (
        kanahautomoModels.getKanahautomoRegistrationCounts as jest.Mock
      ).mockRejectedValue(error);

      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;

      await expect(getKanahautomoRegistrationCounts(req, res)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("registerForKanahautomoWithOrganization", () => {
    it("should successfully register with existing organization", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: { organization_id: 1 }
      };

      mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);
      mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
        []
      );
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue([
        { insertId: 123 }
      ]);

      await registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(
        1
      );
      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason
      ).toHaveBeenCalledWith("steam123", 15);
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("steam123", 1, 15);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Successfully registered for Kanahautomo",
        registration_id: 123,
        organization_id: 1
      });
    });

    it("should successfully register with new organization creation", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      const newOrgData = {
        name: "New Org",
        organization_code: "NEW",
        website: "https://neworg.com"
      };

      mockRequest = {
        auth: mockAuth,
        body: {
          new_organization: newOrgData
        }
      };

      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);
      mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
        []
      );
      mockOrganizationModels.insertOrganization.mockResolvedValue({
        insertId: 999
      });
      mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue([
        { insertId: 123 }
      ]);

      await registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(
        mockSeasonModels.getActiveSignupSeasonForAppId
      ).toHaveBeenCalledWith(730);
      expect(
        mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason
      ).toHaveBeenCalledWith("steam123", 15);
      expect(mockOrganizationModels.insertOrganization).toHaveBeenCalledWith(
        newOrgData
      );
      expect(
        mockKanahautomoModels.registerPlayerForKanahautomo
      ).toHaveBeenCalledWith("steam123", 999, 15);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Successfully registered for Kanahautomo",
        registration_id: 123,
        organization_id: 999
      });
    });

    it("should return 400 when neither organization_id nor new_organization is provided", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: {}
      };

      await expect(
        registerForKanahautomoWithOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(
        "Either organization_id or new_organization is required"
      );
    });

    it("should return 400 when both organization_id and new_organization are provided", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
        permissions: [],
        roles: [],
        nickname: "TestUser",
        provider: "steam"
      };

      mockRequest = {
        auth: mockAuth,
        body: {
          organization_id: 1,
          new_organization: {
            name: "New Org",
            organization_code: "NEW",
            website: "https://neworg.com"
          }
        }
      };

      await expect(
        registerForKanahautomoWithOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(
        "Cannot provide both organization_id and new_organization"
      );
    });

    it("should return 404 when existing organization is not found", async () => {
      const mockAuth: JwtPayload = {
        account_id: 1,
        provider_id: "steam123",
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
      mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
        season_id: 15,
        platform: SeasonPlatform.Kanaliiga,
        signup_end_date: "2024-12-31",
        full_name: "Test Season 2024"
      } satisfies ActiveSeasonSignupForAppId);
      mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
        []
      );

      await expect(
        registerForKanahautomoWithOrganization(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow("Organization not found");
    });
  });
});
