import { runQuery } from "../../db/mysqlRunQuery";
import {
  updateUserDiscordId,
  linkDiscordAccount,
  getDiscordIdByAccountId
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

    it("should not update existing Discord link for same account", async () => {
      const accountId = 123;
      const discordUserId = "456789";

      // Mock existing link for the same account
      mockRunQuery.mockResolvedValueOnce([{ account_id: accountId }]);

      await linkDiscordAccount(accountId, discordUserId);

      // Should only call the SELECT query, no INSERT or UPDATE
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );

      // Should not call INSERT or UPDATE since link already exists for this account
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });

    it("should throw error when Discord account is linked to different account", async () => {
      const accountId = 123;
      const discordUserId = "456789";

      // Mock existing link for a different account
      mockRunQuery.mockResolvedValueOnce([{ account_id: 999 }]);

      await expect(
        linkDiscordAccount(accountId, discordUserId)
      ).rejects.toThrow("Discord account already linked to another account");

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );
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
});
