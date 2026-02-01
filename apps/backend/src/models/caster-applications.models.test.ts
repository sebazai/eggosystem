import {
  createCasterApplication,
  getCasterApplicationByAccountAndOrganizer,
  getCasterApplicationsByAccountId,
  getAllCasterApplications,
  approveCasterApplication,
  rejectCasterApplication,
  reopenCasterApplicationForReApproval,
  getPendingApplicationsCount,
  getOrganizersWithCasterApplications,
  getCasterApplicationById
} from "./caster-applications.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { setRoleForAccount } from "./account-roles.models";
import type { PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./account-roles.models");

const mockRunQuery = runQuery as jest.Mock;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockSetRoleForAccount = setRoleForAccount as jest.MockedFunction<
  typeof setRoleForAccount
>;

const mockConnection: Partial<PoolConnection> = {
  release: jest.fn(),
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined)
};

describe("caster-applications models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);
  });

  describe("createCasterApplication", () => {
    it("should create a new application when none exists", async () => {
      mockRunQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([
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
        ]);

      const result = await createCasterApplication(
        1,
        10,
        "https://twitch.tv/foo",
        true
      );

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("SELECT id, approved_at, rejected_at"),
        [10, 1],
        expect.anything()
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("INSERT INTO CasterApplications"),
        [1, 10, "https://twitch.tv/foo", true],
        expect.anything()
      );
      expect(result.id).toBe(1);
      expect(result.caster_url).toBe("https://twitch.tv/foo");
    });

    it("should re-apply when existing application is rejected", async () => {
      mockRunQuery
        .mockResolvedValueOnce([
          { id: 5, approved_at: null, rejected_at: "2024-01-01T00:00:00.000Z" }
        ])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([
          {
            id: 5,
            organizer_id: 1,
            account_id: 10,
            caster_url: "https://twitch.tv/new",
            approved_terms_and_conditions: true,
            approved_by: null,
            approved_at: null,
            rejected_by: null,
            rejected_at: null,
            rejection_reason: null,
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-01T00:00:00.000Z"
          }
        ]);

      const result = await createCasterApplication(
        1,
        10,
        "https://twitch.tv/new",
        true
      );

      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE CasterApplications"),
        ["https://twitch.tv/new", true, 5],
        expect.anything()
      );
      expect(result.id).toBe(5);
      expect(result.rejected_at).toBeNull();
    });

    it("should throw when application already pending", async () => {
      mockRunQuery.mockResolvedValueOnce([
        { id: 3, approved_at: null, rejected_at: null }
      ]);

      await expect(
        createCasterApplication(1, 10, "https://twitch.tv/foo", true)
      ).rejects.toThrow("Application already pending");
    });

    it("should throw when application already approved", async () => {
      mockRunQuery.mockResolvedValueOnce([
        { id: 3, approved_at: "2024-01-01T00:00:00.000Z", rejected_at: null }
      ]);

      await expect(
        createCasterApplication(1, 10, "https://twitch.tv/foo", true)
      ).rejects.toThrow("Application already approved");
    });
  });

  describe("reopenCasterApplicationForReApproval", () => {
    it("should reopen approved application and return updated row", async () => {
      const existing = {
        id: 5,
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
      };
      const updated = {
        ...existing,
        approved_by: null,
        approved_at: null,
        caster_url: "https://twitch.tv/new",
        approved_terms_and_conditions: true
      };
      mockRunQuery
        .mockResolvedValueOnce([existing])
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([updated]);

      const result = await reopenCasterApplicationForReApproval(
        5,
        "https://twitch.tv/new",
        true
      );

      expect(result).toEqual(updated);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE CasterApplications"),
        ["https://twitch.tv/new", true, 5],
        expect.anything()
      );
    });

    it("should throw when application not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(
        reopenCasterApplicationForReApproval(99, "https://twitch.tv/foo", true)
      ).rejects.toThrow("Application not found");
    });

    it("should throw when application is not approved", async () => {
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 5,
          approved_at: null,
          rejected_at: null
        }
      ]);

      await expect(
        reopenCasterApplicationForReApproval(5, "https://twitch.tv/foo", true)
      ).rejects.toThrow("Application is not approved");
    });
  });

  describe("getCasterApplicationByAccountAndOrganizer", () => {
    it("should return application when found", async () => {
      const row = {
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
      };
      mockRunQuery.mockResolvedValueOnce([row]);

      const result = await getCasterApplicationByAccountAndOrganizer(10, 1);

      expect(result).toEqual(row);
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM CasterApplications WHERE account_id = ? AND organizer_id = ?",
        [10, 1],
        undefined
      );
    });

    it("should return null when not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterApplicationByAccountAndOrganizer(10, 1);

      expect(result).toBeNull();
    });
  });

  describe("getCasterApplicationsByAccountId", () => {
    it("should return all applications for account", async () => {
      const rows = [
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
      mockRunQuery.mockResolvedValueOnce(rows);

      const result = await getCasterApplicationsByAccountId(10);

      expect(result).toEqual(rows);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("account_id = ?"),
        [10],
        undefined
      );
    });

    it("should return empty array when none", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterApplicationsByAccountId(10);

      expect(result).toEqual([]);
    });
  });

  describe("getAllCasterApplications", () => {
    it("should return applications with organizer filter", async () => {
      const rows = [
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
      mockRunQuery.mockResolvedValueOnce(rows);

      const result = await getAllCasterApplications(1);

      expect(result).toEqual(rows);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("ca.organizer_id = ?"),
        [1],
        undefined
      );
    });

    it("should return all applications when no filter", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getAllCasterApplications();

      expect(result).toEqual([]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY ca.created_at DESC"),
        [],
        undefined
      );
    });
  });

  describe("approveCasterApplication", () => {
    it("should approve and set role", async () => {
      const app = {
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
      };
      const updated = {
        ...app,
        approved_by: 2,
        approved_at: "2024-01-02T00:00:00.000Z"
      };
      mockRunQuery
        .mockResolvedValueOnce([app])
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce([updated]);
      mockSetRoleForAccount.mockResolvedValue(undefined);

      const result = await approveCasterApplication(1, 2);

      expect(mockSetRoleForAccount).toHaveBeenCalledWith(
        "caster",
        10,
        expect.anything()
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE CasterApplications SET approved_by"),
        [2, 1],
        expect.anything()
      );
      expect(result.approved_by).toBe(2);
      expect(result.approved_at).not.toBeNull();
    });

    it("should throw when application not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(approveCasterApplication(999, 2)).rejects.toThrow(
        "Application not found"
      );
    });

    it("should throw when already approved", async () => {
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          organizer_id: 1,
          account_id: 10,
          approved_at: "2024-01-01T00:00:00.000Z",
          rejected_at: null
        }
      ]);

      await expect(approveCasterApplication(1, 2)).rejects.toThrow(
        "Application already approved"
      );
    });

    it("should throw when rejected", async () => {
      mockRunQuery.mockResolvedValueOnce([
        {
          id: 1,
          organizer_id: 1,
          account_id: 10,
          approved_at: null,
          rejected_at: "2024-01-01T00:00:00.000Z"
        }
      ]);

      await expect(approveCasterApplication(1, 2)).rejects.toThrow(
        "Cannot approve a rejected application"
      );
    });
  });

  describe("rejectCasterApplication", () => {
    it("should reject with reason", async () => {
      const app = {
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
      };
      const updated = {
        ...app,
        rejected_by: 2,
        rejected_at: "2024-01-02T00:00:00.000Z",
        rejection_reason: "Incomplete info"
      };
      mockRunQuery
        .mockResolvedValueOnce([app])
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce([updated]);

      const result = await rejectCasterApplication(1, 2, "Incomplete info");

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("rejected_by"),
        [2, "Incomplete info", 1],
        undefined
      );
      expect(result.rejected_by).toBe(2);
      expect(result.rejection_reason).toBe("Incomplete info");
    });

    it("should throw when application not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(rejectCasterApplication(999, 2, "Reason")).rejects.toThrow(
        "Application not found"
      );
    });
  });

  describe("getPendingApplicationsCount", () => {
    it("should return count without filter", async () => {
      mockRunQuery.mockResolvedValueOnce([{ cnt: 3 }]);

      const result = await getPendingApplicationsCount();

      expect(result).toBe(3);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("approved_at IS NULL AND rejected_at IS NULL"),
        [],
        undefined
      );
    });

    it("should return count with organizer filter", async () => {
      mockRunQuery.mockResolvedValueOnce([{ cnt: 1 }]);

      const result = await getPendingApplicationsCount(1);

      expect(result).toBe(1);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("organizer_id = ?"),
        [1],
        undefined
      );
    });
  });

  describe("getOrganizersWithCasterApplications", () => {
    it("should return organizers with discord_guild_id", async () => {
      const rows = [
        {
          id: 1,
          name: "Kanaliiga",
          discord_guild_id: "468873146787954689",
          discord_caster_channel_id: "612902579235586068"
        }
      ];
      mockRunQuery.mockResolvedValueOnce(rows);

      const result = await getOrganizersWithCasterApplications();

      expect(result).toEqual(rows);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("discord_guild_id IS NOT NULL"),
        [],
        undefined
      );
    });
  });

  describe("getCasterApplicationById", () => {
    it("should return application when found", async () => {
      const row = {
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
      };
      mockRunQuery.mockResolvedValueOnce([row]);

      const result = await getCasterApplicationById(1);

      expect(result).toEqual(row);
    });

    it("should return null when not found", async () => {
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getCasterApplicationById(999);

      expect(result).toBeNull();
    });
  });
});
