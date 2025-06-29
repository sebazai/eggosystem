import { runQuery } from "../../db/mysqlRunQuery";
import {
  updateUserDiscordId,
  linkDiscordAccount,
  getAccountByDiscordId,
  getDiscordIdByAccountId,
  unlinkDiscordAccount
} from "../../models/discord.models";

// Mock the database connection
jest.mock("../../db/mysqlRunQuery");

describe("Discord Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("updateUserDiscordId", () => {
    it("should create LinkedAccounts entry if not exists", async () => {
      const accountId = 123;
      const discordUserId = "456789";

      mockRunQuery.mockResolvedValue([]);

      await updateUserDiscordId(accountId, discordUserId);

      // Check that LinkedAccounts was queried and updated
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO LinkedAccounts"),
        [accountId, discordUserId],
        undefined
      );
    });
  });

  describe("linkDiscordAccount", () => {
    it("should create new Discord link when none exists", async () => {
      const accountId = 123;
      const discordUserId = "456789";

      mockRunQuery.mockResolvedValueOnce([]); // No existing link
      mockRunQuery.mockResolvedValueOnce([]); // Insert result

      await linkDiscordAccount(accountId, discordUserId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO LinkedAccounts"),
        [accountId, discordUserId],
        undefined
      );
    });

    it("should update existing Discord link", async () => {
      const accountId = 123;
      const discordUserId = "456789";

      mockRunQuery.mockResolvedValueOnce([{ account_id: 999 }]); // Existing link
      mockRunQuery.mockResolvedValueOnce([]); // Update result

      await linkDiscordAccount(accountId, discordUserId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE LinkedAccounts SET account_id = ?"),
        [accountId, discordUserId],
        undefined
      );
    });
  });

  describe("getAccountByDiscordId", () => {
    it("should return account ID when Discord link exists", async () => {
      const discordUserId = "456789";
      const expectedAccountId = 123;

      mockRunQuery.mockResolvedValueOnce([{ account_id: expectedAccountId }]);

      const result = await getAccountByDiscordId(discordUserId);

      expect(result).toBe(expectedAccountId);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );
    });

    it("should return null when Discord link does not exist", async () => {
      const discordUserId = "456789";

      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getAccountByDiscordId(discordUserId);

      expect(result).toBeNull();
    });
  });

  describe("getDiscordIdByAccountId", () => {
    it("should return Discord user ID when link exists", async () => {
      const accountId = 123;
      const expectedDiscordUserId = "456789";

      mockRunQuery.mockResolvedValueOnce([
        { provider_id: expectedDiscordUserId }
      ]);

      const result = await getDiscordIdByAccountId(accountId);

      expect(result).toBe(expectedDiscordUserId);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT provider_id FROM LinkedAccounts"),
        [accountId],
        undefined
      );
    });

    it("should return null when Discord link does not exist", async () => {
      const accountId = 123;

      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getDiscordIdByAccountId(accountId);

      expect(result).toBeNull();
    });
  });

  describe("unlinkDiscordAccount", () => {
    it("should remove Discord link from LinkedAccounts", async () => {
      const accountId = 123;

      mockRunQuery.mockResolvedValue([]);

      await unlinkDiscordAccount(accountId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM LinkedAccounts"),
        [accountId],
        undefined
      );
    });
  });
});
