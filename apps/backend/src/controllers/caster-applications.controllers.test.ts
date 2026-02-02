import type { Response, NextFunction } from "express";
import {
  submitCasterApplicationController,
  getMyCasterApplicationsController,
  getOrganizersWithCasterApplicationsController,
  getPendingCountController,
  getAllCasterApplicationsController
} from "./caster-applications.controllers";
import * as casterApplicationsModels from "../models/caster-applications.models";
import * as organizerModels from "../models/organizer.models";
import * as accountModels from "../models/account.models";
import * as discordModels from "../models/discord.models";
import * as accountRolesModels from "../models/account-roles.models";

jest.mock("../models/caster-applications.models");
jest.mock("../models/organizer.models");
jest.mock("../models/account.models");
jest.mock("../models/discord.models");
jest.mock("../models/account-roles.models");
jest.mock("../services/discord-organizer.services", () => ({
  notifyNewCasterApplicationInDiscord: jest.fn().mockResolvedValue(undefined)
}));

const mockCreateCasterApplication =
  casterApplicationsModels.createCasterApplication as jest.MockedFunction<
    typeof casterApplicationsModels.createCasterApplication
  >;
const mockGetCasterApplicationByAccountAndOrganizer =
  casterApplicationsModels.getCasterApplicationByAccountAndOrganizer as jest.MockedFunction<
    typeof casterApplicationsModels.getCasterApplicationByAccountAndOrganizer
  >;
const mockReopenCasterApplicationForReApproval =
  casterApplicationsModels.reopenCasterApplicationForReApproval as jest.MockedFunction<
    typeof casterApplicationsModels.reopenCasterApplicationForReApproval
  >;
const mockGetCasterApplicationsByAccountId =
  casterApplicationsModels.getCasterApplicationsByAccountId as jest.MockedFunction<
    typeof casterApplicationsModels.getCasterApplicationsByAccountId
  >;
const mockGetOrganizersWithCasterApplications =
  casterApplicationsModels.getOrganizersWithCasterApplications as jest.MockedFunction<
    typeof casterApplicationsModels.getOrganizersWithCasterApplications
  >;
const mockGetAllCasterApplications =
  casterApplicationsModels.getAllCasterApplications as jest.MockedFunction<
    typeof casterApplicationsModels.getAllCasterApplications
  >;
const mockGetPendingApplicationsCount =
  casterApplicationsModels.getPendingApplicationsCount as jest.MockedFunction<
    typeof casterApplicationsModels.getPendingApplicationsCount
  >;
const mockGetOrganizerByIdOrFail =
  organizerModels.getOrganizerByIdOrFail as jest.MockedFunction<
    typeof organizerModels.getOrganizerByIdOrFail
  >;
const mockGetAccountById = accountModels.getAccountById as jest.MockedFunction<
  typeof accountModels.getAccountById
>;
const mockHasSteamLinked = accountModels.hasSteamLinked as jest.MockedFunction<
  typeof accountModels.hasSteamLinked
>;
const mockGetDiscordInfoByAccountId =
  discordModels.getDiscordInfoByAccountId as jest.MockedFunction<
    typeof discordModels.getDiscordInfoByAccountId
  >;
const mockUserHasRole = accountRolesModels.userHasRole as jest.MockedFunction<
  typeof accountRolesModels.userHasRole
>;

function mockRes() {
  const res = {} as Partial<Response>;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function nextFn() {
  return jest.fn() as NextFunction;
}

describe("caster-applications controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitCasterApplicationController", () => {
    it("should return 201 and create application when valid", async () => {
      mockGetOrganizerByIdOrFail.mockResolvedValue({
        id: 1,
        name: "Kanaliiga",
        discord_guild_id: "468873146787954689"
      } as Awaited<ReturnType<typeof organizerModels.getOrganizerByIdOrFail>>);
      mockGetAccountById.mockResolvedValue({
        work_email_verified: true,
        work_email: "user@example.com"
      } as Awaited<ReturnType<typeof accountModels.getAccountById>>);
      mockGetDiscordInfoByAccountId.mockResolvedValue({
        discordId: "123",
        discordUsername: "user#123"
      } as Awaited<ReturnType<typeof discordModels.getDiscordInfoByAccountId>>);
      mockHasSteamLinked.mockResolvedValue(true);
      mockUserHasRole.mockResolvedValue(false);
      mockGetCasterApplicationByAccountAndOrganizer.mockResolvedValue(null);
      mockCreateCasterApplication.mockResolvedValue({
        id: 1,
        organizer_id: 1,
        account_id: 10,
        caster_url: "https://twitch.tv/foo",
        approved_terms_and_conditions: true,
        approved_by: null,
        approved_at: null,
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z"
      });

      const req = {
        auth: { account_id: 10 },
        params: { organizer_id: "1" },
        body: {
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true
        }
      };
      const res = mockRes();
      const next = nextFn();

      await submitCasterApplicationController(req as never, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Application submitted",
          application: expect.objectContaining({ id: 1, status: "pending" })
        })
      );
      expect(mockCreateCasterApplication).toHaveBeenCalledWith(
        1,
        10,
        "https://twitch.tv/foo",
        true
      );
    });

    it("should reopen application and return 200 when approved but user has no caster role", async () => {
      mockGetOrganizerByIdOrFail.mockResolvedValue({
        id: 1,
        name: "Kanaliiga",
        discord_guild_id: "468873146787954689"
      } as Awaited<ReturnType<typeof organizerModels.getOrganizerByIdOrFail>>);
      mockGetAccountById.mockResolvedValue({
        work_email_verified: true,
        work_email: "user@example.com"
      } as Awaited<ReturnType<typeof accountModels.getAccountById>>);
      mockGetDiscordInfoByAccountId.mockResolvedValue({
        discordId: "123",
        discordUsername: "user#123"
      } as Awaited<ReturnType<typeof discordModels.getDiscordInfoByAccountId>>);
      mockHasSteamLinked.mockResolvedValue(true);
      mockUserHasRole.mockResolvedValue(false);
      mockGetCasterApplicationByAccountAndOrganizer.mockResolvedValue({
        id: 3,
        organizer_id: 1,
        account_id: 10,
        caster_url: "https://twitch.tv/old",
        approved_terms_and_conditions: true,
        approved_by: 1,
        approved_at: "2024-01-01T00:00:00.000Z",
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z"
      });
      mockReopenCasterApplicationForReApproval.mockResolvedValue({
        id: 3,
        organizer_id: 1,
        account_id: 10,
        caster_url: "https://twitch.tv/foo",
        approved_terms_and_conditions: true,
        approved_by: null,
        approved_at: null,
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z"
      });

      const req = {
        auth: { account_id: 10 },
        params: { organizer_id: "1" },
        body: {
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true
        }
      };
      const res = mockRes();
      const next = nextFn();

      await submitCasterApplicationController(req as never, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Application reopened for re-approval",
          application: expect.objectContaining({ id: 3, status: "pending" })
        })
      );
      expect(mockReopenCasterApplicationForReApproval).toHaveBeenCalledWith(
        3,
        "https://twitch.tv/foo",
        true
      );
      expect(mockCreateCasterApplication).not.toHaveBeenCalled();
    });

    it("should call next(BadRequestError) when body invalid", async () => {
      const req = {
        auth: { account_id: 10 },
        params: { organizer_id: "1" },
        body: { caster_url: "not-a-url", approved_terms_and_conditions: true }
      };
      const res = mockRes();
      const next = nextFn();

      await submitCasterApplicationController(req as never, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockCreateCasterApplication).not.toHaveBeenCalled();
    });

    it("should call next(BadRequestError) when email not verified", async () => {
      mockGetOrganizerByIdOrFail.mockResolvedValue({
        id: 1,
        name: "Kanaliiga",
        discord_guild_id: "468873146787954689"
      } as Awaited<ReturnType<typeof organizerModels.getOrganizerByIdOrFail>>);
      mockGetAccountById.mockResolvedValue({
        work_email_verified: false,
        work_email: "user@example.com"
      } as Awaited<ReturnType<typeof accountModels.getAccountById>>);

      const req = {
        auth: { account_id: 10 },
        params: { organizer_id: "1" },
        body: {
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true
        }
      };
      const res = mockRes();
      const next = nextFn();

      await submitCasterApplicationController(req as never, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockCreateCasterApplication).not.toHaveBeenCalled();
    });

    it("should call next(BadRequestError) when Steam not linked", async () => {
      mockGetOrganizerByIdOrFail.mockResolvedValue({
        id: 1,
        name: "Kanaliiga",
        discord_guild_id: "468873146787954689"
      } as Awaited<ReturnType<typeof organizerModels.getOrganizerByIdOrFail>>);
      mockGetAccountById.mockResolvedValue({
        work_email_verified: true,
        work_email: "user@example.com"
      } as Awaited<ReturnType<typeof accountModels.getAccountById>>);
      mockGetDiscordInfoByAccountId.mockResolvedValue({
        discordId: "123",
        discordUsername: "user#123"
      } as Awaited<ReturnType<typeof discordModels.getDiscordInfoByAccountId>>);
      mockHasSteamLinked.mockResolvedValue(false);

      const req = {
        auth: { account_id: 10 },
        params: { organizer_id: "1" },
        body: {
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true
        }
      };
      const res = mockRes();
      const next = nextFn();

      await submitCasterApplicationController(req as never, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockCreateCasterApplication).not.toHaveBeenCalled();
    });
  });

  describe("getMyCasterApplicationsController", () => {
    it("should return applications for account", async () => {
      const applications = [
        {
          id: 1,
          organizer_id: 1,
          account_id: 10,
          caster_url: "https://twitch.tv/foo",
          approved_terms_and_conditions: true,
          approved_by: null,
          approved_at: null,
          rejected_by: null,
          rejected_at: null,
          rejection_reason: null,
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z"
        }
      ];
      mockGetCasterApplicationsByAccountId.mockResolvedValue(applications);

      const req = { auth: { account_id: 10 }, query: {} };
      const res = mockRes();
      const next = nextFn();

      await getMyCasterApplicationsController(req as never, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ applications });
    });
  });

  describe("getOrganizersWithCasterApplicationsController", () => {
    it("should return organizers", async () => {
      const organizers = [
        {
          id: 1,
          name: "Kanaliiga",
          discord_guild_id: "468873146787954689",
          discord_caster_channel_id: "612902579235586068"
        }
      ];
      mockGetOrganizersWithCasterApplications.mockResolvedValue(organizers);

      const req = {};
      const res = mockRes();
      const next = nextFn();

      await getOrganizersWithCasterApplicationsController(
        req as never,
        res,
        next
      );

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ organizers });
    });
  });

  describe("getPendingCountController", () => {
    it("should return pending count", async () => {
      mockGetPendingApplicationsCount.mockResolvedValue(3);

      const req = { query: {} };
      const res = mockRes();
      const next = nextFn();

      await getPendingCountController(req as never, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
    });
  });

  describe("getAllCasterApplicationsController", () => {
    it("should return applications list", async () => {
      const applications = [
        {
          id: 1,
          organizer_id: 1,
          account_id: 10,
          organizer_name: "Kanaliiga",
          discord_username: "user#123",
          steam_id: "76561198000000000",
          nickname: "Player"
        }
      ];
      mockGetAllCasterApplications.mockResolvedValue(applications as never);

      const req = { query: {} };
      const res = mockRes();
      const next = nextFn();

      await getAllCasterApplicationsController(req as never, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ applications });
    });
  });
});
