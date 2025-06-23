import { type Request, type Response } from "express";
import { registerForKanahautomoWithOrganization } from "../../controllers/kanahautomo.controllers";
import * as kanahautomoModels from "../../models/kanahautomo.models";
import * as organizationModels from "../../models/organization.models";
import * as dbConnection from "../../db/mysqlConnection";
import type { JwtPayload } from "jsonwebtoken";
import type { Organizations } from "@eggosystem/types";

// Mock the models
jest.mock("../../models/kanahautomo.models");
jest.mock("../../models/organization.models");
jest.mock("../../db/mysqlConnection");

const mockKanahautomoModels = kanahautomoModels as jest.Mocked<
  typeof kanahautomoModels
>;
const mockOrganizationModels = organizationModels as jest.Mocked<
  typeof organizationModels
>;
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

const mockGameTypes = {
  cs: true,
  csWingman: false,
  pubgDuo: true,
  pubgSquad: false,
  rocketLeague: false,
  dota: false
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

  it("registers with gameTypes and commits on success", async () => {
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
      body: {
        organizationId: 1,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };
    mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
    mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue({
      insertId: 123
    });
    mockKanahautomoModels.insertKanahautomoGameTypes.mockResolvedValue();

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(connection.beginTransaction).toHaveBeenCalled();
    expect(mockOrganizationModels.getOrganizationById).toHaveBeenCalledWith(1);
    expect(
      mockKanahautomoModels.registerPlayerForKanahautomo
    ).toHaveBeenCalledWith("steamid", 1, true, connection);
    expect(
      mockKanahautomoModels.insertKanahautomoGameTypes
    ).toHaveBeenCalledWith(123, mockGameTypes, connection);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(201);
    expect(mockJson).toHaveBeenCalledWith({
      message: expect.any(String),
      registration_id: 123,
      organization_id: 1
    });
  });

  it("throws if gameTypes is missing", async () => {
    const mockAuth: JwtPayload = {
      account_id: 1,
      provider_id: "steamid",
      permissions: [],
      roles: [],
      nickname: "TestUser",
      provider: "steam"
    };
    mockRequest = { auth: mockAuth, body: { organizationId: 1 } };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          gameTypes: ["Required"]
        })
      })
    });
  });

  it("throws if no game types are selected", async () => {
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
      body: {
        organizationId: 1,
        gameTypes: {
          cs: false,
          csWingman: false,
          pubgDuo: false,
          pubgSquad: false,
          rocketLeague: false,
          dota: false
        },
        acceptedTerms: true
      }
    };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          gameTypes: ["Please select at least one game type"]
        })
      })
    });
  });

  it("registers with new organization and gameTypes", async () => {
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
    mockRequest = {
      auth: mockAuth,
      body: {
        organizationId: -1,
        newOrganization: newOrg,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };

    mockOrganizationModels.insertOrganization.mockResolvedValue({
      insertId: 42
    });
    mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue({
      insertId: 123
    });
    mockKanahautomoModels.insertKanahautomoGameTypes.mockResolvedValue();

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
    ).toHaveBeenCalledWith("steamid", 42, true, connection);
    expect(
      mockKanahautomoModels.insertKanahautomoGameTypes
    ).toHaveBeenCalledWith(123, mockGameTypes, connection);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(201);
  });

  it("rolls back if gameTypes insertion fails", async () => {
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
      body: {
        organizationId: 1,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };
    mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
    mockKanahautomoModels.registerPlayerForKanahautomo.mockResolvedValue({
      insertId: 123
    });
    mockKanahautomoModels.insertKanahautomoGameTypes.mockRejectedValue(
      new Error("Game types insertion failed")
    );

    await expect(
      registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      )
    ).rejects.toThrow("Game types insertion failed");

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
  });

  it("returns 401 if no auth", async () => {
    mockRequest = { body: { organizationId: 1, gameTypes: mockGameTypes } };
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
    mockRequest = { auth: mockAuth, body: { gameTypes: mockGameTypes } };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          acceptedTerms: ["Required"]
        })
      })
    });
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
      body: {
        organizationId: 1,
        newOrganization: {
          name: "X",
          organization_code: "X",
          website: "https://x.com"
        },
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          newOrganization: [
            "Organization name must be at least 2 characters",
            "Business ID must be at least 2 characters"
          ]
        })
      })
    });
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
    mockRequest = {
      auth: mockAuth,
      body: {
        organizationId: 1,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };
    mockOrganizationModels.getOrganizationById.mockResolvedValue([mockOrg]);
    mockKanahautomoModels.registerPlayerForKanahautomo.mockRejectedValue(
      new Error("Duplicate entry")
    );

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: expect.stringContaining("already registered")
    });
    expect(connection.beginTransaction).toHaveBeenCalled();
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
    mockRequest = {
      auth: mockAuth,
      body: {
        organizationId: 999,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };
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

  it("rolls back and throws if registration fails", async () => {
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
      body: {
        organizationId: 1,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };
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

  // Additional validation tests from the duplicate file
  it("throws if terms not accepted", async () => {
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
      body: {
        organizationId: 1,
        gameTypes: mockGameTypes,
        acceptedTerms: false
      }
    };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          acceptedTerms: ["You must accept the terms and conditions"]
        })
      })
    });
  });

  it("throws if organization ID is invalid (0)", async () => {
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
      body: {
        organizationId: 0,
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          organizationId: [
            "Please select an existing organization or create a new one."
          ]
        })
      })
    });
  });

  it("throws if new organization data is invalid", async () => {
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
      body: {
        organizationId: -1,
        newOrganization: {
          name: "T", // Too short
          organization_code: "1", // Too short
          website: "invalid-url" // Invalid URL
        },
        gameTypes: mockGameTypes,
        acceptedTerms: true
      }
    };

    await registerForKanahautomoWithOrganization(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      message: "Invalid registration data",
      errors: expect.objectContaining({
        fieldErrors: expect.objectContaining({
          newOrganization: [
            "Organization name must be at least 2 characters",
            "Business ID must be at least 2 characters",
            "Please enter a valid website URL"
          ]
        })
      })
    });
  });
});

import request from "supertest";
import express from "express";
import kanahautomoRoutes from "../../routes/v1/kanahautomo.routes";
import { expressErrorHandler } from "../../middlewares/express-error-handler";

// Mock the database query function
jest.mock("../../db/mysqlRunQuery");

// Mock the models
jest.mock("../../models/kanahautomo.models");

describe("Kanahautomo Organization Status Integration Tests", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use("/api/v1/kanahautomo", kanahautomoRoutes);
    app.use(expressErrorHandler);
  });

  describe("GET /api/v1/kanahautomo/organization-status", () => {
    it("should return organization status without authentication", async () => {
      // Mock successful organization status lookup
      const mockGetKanahautomoOrganizationStatus =
        kanahautomoModels.getKanahautomoOrganizationStatus as jest.MockedFunction<
          typeof kanahautomoModels.getKanahautomoOrganizationStatus
        >;

      mockGetKanahautomoOrganizationStatus.mockResolvedValue([
        {
          organization_id: 1,
          organization_name: "Test Organization",
          count: 5
        }
      ] as never);

      const response = await request(app)
        .get("/api/v1/kanahautomo/organization-status")
        .expect(200);

      expect(response.body).toHaveProperty("organizations");
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(response.body.organizations[0]).toHaveProperty(
        "organization_id",
        1
      );
      expect(response.body.organizations[0]).toHaveProperty(
        "organization_name",
        "Test Organization"
      );
      expect(response.body.organizations[0]).toHaveProperty("count", 5);
    });

    it("should handle empty organization status", async () => {
      const mockGetKanahautomoOrganizationStatus =
        kanahautomoModels.getKanahautomoOrganizationStatus as jest.MockedFunction<
          typeof kanahautomoModels.getKanahautomoOrganizationStatus
        >;

      mockGetKanahautomoOrganizationStatus.mockResolvedValue([] as never);

      const response = await request(app)
        .get("/api/v1/kanahautomo/organization-status")
        .expect(200);

      expect(response.body).toHaveProperty("organizations");
      expect(Array.isArray(response.body.organizations)).toBe(true);
      expect(response.body.organizations).toHaveLength(0);
    });
  });
});
