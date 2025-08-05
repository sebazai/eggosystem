import { type Response, type Request } from "express";
import {
  getOrgs,
  getOrgById,
  getOrganizationApprovedTeamsController,
  getOrgTeamTrophiesController,
  getOrgDiscordInviteLinkController
} from "../organizations.controllers";
import {
  getOrganizations,
  getOrganizationById,
  getOrganizationApprovedTeams,
  getOrganizationTeamTrophies,
  getOrganizationDiscordInviteLink
} from "../../models/organization.models";
import {
  type RequestWithParams,
  type Organizations,
  type Team,
  type OrganizationTeamTrophies
} from "@eggosystem/types";

// Mock the models
jest.mock("../../models/organization.models");

const mockGetOrganizations = getOrganizations as jest.MockedFunction<
  typeof getOrganizations
>;
const mockGetOrganizationById = getOrganizationById as jest.MockedFunction<
  typeof getOrganizationById
>;
const mockGetOrganizationApprovedTeams =
  getOrganizationApprovedTeams as jest.MockedFunction<
    typeof getOrganizationApprovedTeams
  >;
const mockGetOrganizationTeamTrophies =
  getOrganizationTeamTrophies as jest.MockedFunction<
    typeof getOrganizationTeamTrophies
  >;
const mockGetOrganizationDiscordInviteLink =
  getOrganizationDiscordInviteLink as jest.MockedFunction<
    typeof getOrganizationDiscordInviteLink
  >;

// Test data objects
const mockOrganization: Organizations = {
  id: 123,
  name: "Test Organization",
  organization_code: "TEST",
  website: "https://test.com",
  country: "US",
  logo: "test-logo.png",
  discord_invite_link: "https://discord.gg/test",
  sort_order: 1
};

const mockOrganizations: Organizations[] = [mockOrganization];

const mockApprovedTeams: Team[] = [
  {
    id: 1,
    name: "Team A",
    team_logo: "team-a-logo.png",
    org_approved: true
  }
];

const mockTrophies: OrganizationTeamTrophies[] = [
  {
    team_id: 1,
    team_name: "Team A",
    season_id: 1,
    league_id: 1,
    season_name: "Season A",
    league_name: "League A",
    placement: 1
  }
];

const mockDiscordInviteLink = "https://discord.gg/test";

// Type definitions for test requests
type TestRequest = Request & {
  params: Record<string, string>;
  query: Record<string, string | undefined>;
};

describe("Organizations Controllers", () => {
  let mockRequest: TestRequest;
  let mockResponse: Response;
  let mockJson: jest.MockedFunction<Response["json"]>;
  let mockStatus: jest.MockedFunction<Response["status"]>;

  beforeEach(() => {
    mockRequest = {
      params: {},
      query: {}
    } as TestRequest;

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus
    } as unknown as Response;

    jest.clearAllMocks();
  });

  describe("getOrgs", () => {
    it("should return all organizations", async () => {
      mockRequest.query = { q: undefined };
      mockGetOrganizations.mockResolvedValue(mockOrganizations);

      await getOrgs(mockRequest, mockResponse as Response);

      expect(mockGetOrganizations).toHaveBeenCalledWith(undefined);
      expect(mockJson).toHaveBeenCalledWith(mockOrganizations);
    });

    it("should handle empty organizations list", async () => {
      mockRequest.query = { q: undefined };
      mockGetOrganizations.mockResolvedValue([]);

      await getOrgs(mockRequest, mockResponse as Response);

      expect(mockGetOrganizations).toHaveBeenCalledWith(undefined);
      expect(mockJson).toHaveBeenCalledWith([]);
    });

    it("should return organizations with search parameter", async () => {
      mockRequest.query = { q: "test" };
      mockGetOrganizations.mockResolvedValue(mockOrganizations);

      await getOrgs(mockRequest, mockResponse as Response);

      expect(mockGetOrganizations).toHaveBeenCalledWith("test");
      expect(mockJson).toHaveBeenCalledWith(mockOrganizations);
    });
  });

  describe("getOrgById", () => {
    it("should return organization for valid ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetOrganizationById.mockResolvedValue([mockOrganization]);

      await getOrgById(mockRequest, mockResponse as Response);

      expect(mockGetOrganizationById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockOrganization);
    });

    it("should handle invalid organization ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetOrganizationById.mockResolvedValue([]);

      await expect(
        getOrgById(mockRequest, mockResponse as Response)
      ).rejects.toThrow("Organization not found");
    });

    it("should handle negative organization ID", async () => {
      mockRequest.params = { id: "-123" };
      mockGetOrganizationById.mockResolvedValue([]);

      await expect(
        getOrgById(mockRequest, mockResponse as Response)
      ).rejects.toThrow("Organization not found");
    });

    it("should handle zero organization ID", async () => {
      mockRequest.params = { id: "0" };
      mockGetOrganizationById.mockResolvedValue([]);

      await expect(
        getOrgById(mockRequest, mockResponse as Response)
      ).rejects.toThrow("Organization not found");
    });
  });

  describe("getOrganizationApprovedTeamsController", () => {
    it("should return approved teams for valid organization ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetOrganizationApprovedTeams.mockResolvedValue(mockApprovedTeams);

      await getOrganizationApprovedTeamsController(
        mockRequest,
        mockResponse as Response
      );

      expect(mockGetOrganizationApprovedTeams).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockApprovedTeams);
    });

    it("should handle invalid organization approved teams ID", async () => {
      mockRequest.params = { id: "invalid" };

      await getOrganizationApprovedTeamsController(
        mockRequest,
        mockResponse as Response
      );

      expect(mockGetOrganizationApprovedTeams).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getOrgTeamTrophiesController", () => {
    it("should return team trophies for valid organization ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetOrganizationTeamTrophies.mockResolvedValue(mockTrophies);

      await getOrgTeamTrophiesController(
        mockRequest as RequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetOrganizationTeamTrophies).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(mockTrophies);
    });

    it("should handle invalid organization team trophies ID", async () => {
      mockRequest.params = { id: "invalid" };

      await getOrgTeamTrophiesController(
        mockRequest as RequestWithParams<{ id: string }>,
        mockResponse as Response
      );

      expect(mockGetOrganizationTeamTrophies).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getOrgDiscordInviteLinkController", () => {
    it("should return Discord invite link for valid organization ID", async () => {
      mockRequest.params = { id: "123" };
      mockGetOrganizationDiscordInviteLink.mockResolvedValue(
        mockDiscordInviteLink
      );

      await getOrgDiscordInviteLinkController(
        mockRequest,
        mockResponse as Response
      );

      expect(mockGetOrganizationDiscordInviteLink).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith({
        discord_invite_link: mockDiscordInviteLink
      });
    });

    it("should handle invalid organization Discord invite link ID", async () => {
      mockRequest.params = { id: "invalid" };

      await getOrgDiscordInviteLinkController(
        mockRequest,
        mockResponse as Response
      );

      expect(mockGetOrganizationDiscordInviteLink).toHaveBeenCalledWith(NaN);
    });
  });
});
