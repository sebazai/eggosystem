import { type Request, type Response } from "express";
import { registerForKanahautomoWithOrganization } from "../../controllers/kanahautomo.controllers";
import * as kanahautomoModels from "../../models/kanahautomo.models";
import * as organizationModels from "../../models/organization.models";
import * as seasonModels from "../../models/season.models";
import * as dbConnection from "../../db/mysqlConnection";
import type { JwtPayload } from "jsonwebtoken";
import type {
  ActiveSeasonSignupForAppId,
  KanahautomoRegistrationRecord,
  Organizations
} from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Mock the models
jest.mock("../../models/kanahautomo.models");
jest.mock("../../models/organization.models");
jest.mock("../../models/season.models");
jest.mock("../../db/mysqlConnection");
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
const mockGetConnection = dbConnection.getConnection as jest.Mock;

const mockOrg: Organizations = {
  id: 1,
  name: "Test Org",
  logo: "",
  organization_code: "TEST",
  website: "",
  country: "",
  sort_order: null
};

function getMockConnection() {
  return {
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn()
  };
}

describe("Kanahautomo Controller Transactional Logic", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let connection: ReturnType<typeof getMockConnection>;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = { json: mockJson, status: mockStatus };
    connection = getMockConnection();
    mockGetConnection.mockResolvedValue(connection);
    jest.clearAllMocks();
  });

  it("registers and commits on success", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organization_id: 1 } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
      season_id: 15,
      platform: SeasonPlatform.Kanaliiga,
      signup_end_date: "2024-12-31",
      full_name: "Test Season"
    } as ActiveSeasonSignupForAppId);
    mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
      []
    );
    mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
    mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue([
      { insertId: 123 }
    ]);

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(1);
    expect(
      mockKanahautomoModels.registerPlayerForKanahautomo
    ).toHaveBeenCalledWith("steamid", 1, 15);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      message: expect.any(String),
      registration_id: 123,
      organization_id: 1
    });
  });

  it("returns 401 if no auth", async () => {
    mockRequest = { body: { organization_id: 1 } };
    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("throws if missing org/new_org", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: {} };
    await expect(
      registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("Either organization_id or new_organization is required");
  });

  it("throws if both org and new_org", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = {
      auth: mockAuth,
      body: { organization_id: 1, new_organization: { name: "X" } }
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

  it("throws if no active season", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organization_id: 1 } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue(undefined);
    await expect(
      registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("No active season found for CS2");
  });

  it("returns 400 if already registered", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organization_id: 1 } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
      season_id: 15,
      platform: SeasonPlatform.Kanaliiga,
      signup_end_date: "2024-12-31",
      full_name: "Test Season"
    } as ActiveSeasonSignupForAppId);
    mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
      [
        {
          id: 0,
          steam_id: "",
          season_id: 0,
          organization_id: 0,
          status: "active",
          created_at: ""
        } satisfies KanahautomoRegistrationRecord
      ]
    );
    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: expect.stringContaining("already registered")
    });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it("rolls back and throws if org does not exist", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organization_id: 999 } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
      season_id: 15,
      platform: SeasonPlatform.Kanaliiga,
      signup_end_date: "2024-12-31",
      full_name: "Test Season"
    } as ActiveSeasonSignupForAppId);
    mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
      []
    );
    mockOrganizationModels.getOrganizationById.mockResolvedValue([]);
    await expect(
      registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("Organization not found");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  it("registers with new organization and commits", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    const newOrg = {
      name: "New Org",
      organization_code: "NEW",
      website: "https://new.org"
    };
    mockRequest = { auth: mockAuth, body: { new_organization: newOrg } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
      season_id: 15,
      platform: SeasonPlatform.Kanaliiga,
      signup_end_date: "2024-12-31",
      full_name: "Test Season"
    } as ActiveSeasonSignupForAppId);
    mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
      []
    );
    mockOrganizationModels.insertOrganization.mockResolvedValue({
      insertId: 42
    });
    mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue([
      { insertId: 123 }
    ]);
    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockOrganizationModels.insertOrganization).toHaveBeenCalledWith(
      newOrg,
      expect.anything()
    );
    expect(
      mockKanahautomoModels.registerPlayerForKanahautomo
    ).toHaveBeenCalledWith("steamid", 42, 15);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(201);
  });

  it("rolls back and throws if registration fails", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organization_id: 1 } };
    mockSeasonModels.getActiveSignupSeasonForAppId.mockResolvedValue({
      season_id: 15,
      platform: SeasonPlatform.Kanaliiga,
      signup_end_date: "2024-12-31",
      full_name: "Test Season"
    } as ActiveSeasonSignupForAppId);
    mockKanahautomoModels.getKanahautomoRegistrationsByPlayerAndSeason.mockResolvedValue(
      []
    );
    mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
    mockKanahautomoModels.registerPlayerForKanahautomo.mockRejectedValue(
      new Error("fail")
    );
    await expect(
      registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("fail");
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });
});
