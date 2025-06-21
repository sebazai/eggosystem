import { type Request, type Response } from "express";
import {
  registerForKanahautomo,
  getKanahautomoOrganizationStatus,
  getKanahautomoRegistrationCounts,
  registerForKanahautomoWithOrganization
} from "../../controllers/kanahautomo.controllers";
import type { JwtPayload } from "jsonwebtoken";
import type { Organizations } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

// Only mock runQuery, not the models
jest.mock("../../db/mysqlRunQuery", () => ({
  runQuery: jest.fn()
}));

// Mock the logger
jest.mock("../../utils/app-logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Import the mocked runQuery after mocking
import { runQuery } from "../../db/mysqlRunQuery";
const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

const mockOrg: Organizations = {
  id: 1,
  name: "Test Org",
  logo: "",
  organization_code: "TEST",
  website: "",
  country: "",
  sort_order: null
};

describe("Kanahautomo SQL Query Verification", () => {
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

  describe("SQL Query Verification", () => {
    it("should verify correct SQL queries and parameters for registration flow", async () => {
      mockRunQuery.mockImplementation(
        (query: string, _params: unknown[] = []) => {
          if (query.includes("SELECT * FROM Organizations WHERE id = ?")) {
            return Promise.resolve([[mockOrg]]);
          }
          if (
            query.includes(
              "SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name"
            )
          ) {
            return Promise.resolve([
              [
                {
                  season_id: 15,
                  platform: SeasonPlatform.Kanaliiga,
                  signup_end_date: "2024-12-31",
                  full_name: "Test Season 2024"
                }
              ]
            ]);
          }
          if (
            query.includes(
              "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?"
            )
          ) {
            return Promise.resolve([[undefined]]);
          }
          if (query.includes("INSERT INTO KanahautomoRegistration")) {
            return Promise.resolve([[{ insertId: 123 }]]);
          }
          return Promise.resolve([[undefined]]);
        }
      );

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

      // Call the controller directly to trigger model calls
      await registerForKanahautomo(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify the SQL queries and parameters
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM Organizations WHERE id = ?",
        [1]
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name"
        ),
        [730]
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?",
        ["76561198000000001", 15]
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO KanahautomoRegistration (steam_id, season_id, organization_id, status) VALUES (?, ?, ?, 'active')",
        ["76561198000000001", 15, 1]
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it("should verify correct SQL queries for organization status", async () => {
      mockRunQuery.mockImplementation(
        (query: string, _params: unknown[] = []) => {
          if (
            query.includes(
              "SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name"
            )
          ) {
            return Promise.resolve([
              [
                {
                  season_id: 42,
                  platform: SeasonPlatform.Kanaliiga,
                  signup_end_date: "2024-12-31",
                  full_name: "Test Season 2024"
                }
              ]
            ]);
          }
          if (
            query.includes(
              "SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as count"
            )
          ) {
            return Promise.resolve([
              [
                { organization_id: 1, organization_name: "Org 1", count: 5 },
                { organization_id: 2, organization_name: "Org 2", count: 2 }
              ]
            ]);
          }
          return Promise.resolve([[undefined]]);
        }
      );

      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;

      await getKanahautomoOrganizationStatus(req, res);

      // Verify the SQL queries and parameters
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name"
        ),
        [730]
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as count"
        ),
        [42]
      );

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

    it("should verify correct SQL queries for registration counts", async () => {
      mockRunQuery.mockImplementation(
        (query: string, _params: unknown[] = []) => {
          if (
            query.includes(
              "SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as registration_count"
            )
          ) {
            return Promise.resolve([
              [
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
              ]
            ]);
          }
          return Promise.resolve([[undefined]]);
        }
      );

      const req = {} as Request;
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as unknown as Response;

      await getKanahautomoRegistrationCounts(req, res);

      // Verify the SQL query (no parameters for this query)
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as registration_count"
        ),
        []
      );

      expect(res.json).toHaveBeenCalledWith([
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
      ]);
    });

    it("should verify transaction handling for new organization registration", async () => {
      mockRunQuery.mockImplementation(
        (query: string, _params: unknown[] = []) => {
          if (query === "START TRANSACTION") {
            return Promise.resolve([[undefined]]);
          }
          if (query === "COMMIT") {
            return Promise.resolve([[undefined]]);
          }
          if (query === "ROLLBACK") {
            return Promise.resolve([[undefined]]);
          }
          if (query.includes("INSERT INTO Organizations")) {
            return Promise.resolve([[{ insertId: 999 }]]);
          }
          if (
            query.includes(
              "SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name"
            )
          ) {
            return Promise.resolve([
              [
                {
                  season_id: 15,
                  platform: SeasonPlatform.Kanaliiga,
                  signup_end_date: "2024-12-31",
                  full_name: "Test Season 2024"
                }
              ]
            ]);
          }
          if (
            query.includes(
              "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?"
            )
          ) {
            return Promise.resolve([[undefined]]);
          }
          if (query.includes("INSERT INTO KanahautomoRegistration")) {
            return Promise.resolve([[{ insertId: 123 }]]);
          }
          return Promise.resolve([[undefined]]);
        }
      );

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
        body: { new_organization: newOrgData }
      };

      await registerForKanahautomoWithOrganization(
        mockRequest as Request,
        mockResponse as Response
      );

      // Verify transaction flow
      expect(mockRunQuery).toHaveBeenCalledWith("START TRANSACTION", []);
      expect(mockRunQuery).toHaveBeenCalledWith("COMMIT", []);
      expect(mockRunQuery).not.toHaveBeenCalledWith("ROLLBACK", []);

      // Verify organization creation
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Organizations"),
        expect.arrayContaining([
          newOrgData.name,
          newOrgData.organization_code,
          newOrgData.website
        ])
      );

      // Verify registration
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO KanahautomoRegistration (steam_id, season_id, organization_id, status) VALUES (?, ?, ?, 'active')",
        ["steam123", 15, 999]
      );

      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });
});
