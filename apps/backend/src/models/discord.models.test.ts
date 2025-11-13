import { runQuery } from "../db/mysqlRunQuery";
import {
  updateUserDiscordId,
  linkDiscordAccount,
  getDiscordIdByAccountId,
  getDiscordUsernameByAccountId,
  getDiscordInfoByAccountId
} from "./discord.models";

// Mock the database connection
jest.mock("../db/mysqlRunQuery");

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
        [accountId, discordUserId, null],
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
        [accountId, discordUserId, null],
        undefined
      );
    });

    it("should not update existing Discord link for same account when no username provided", async () => {
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

    it("should update username when existing Discord link exists and username provided", async () => {
      const accountId = 123;
      const discordUserId = "456789";
      const discordUsername = "testuser";

      // Mock existing link for the same account
      mockRunQuery.mockResolvedValueOnce([{ account_id: accountId }]);
      mockRunQuery.mockResolvedValueOnce([]); // UPDATE result

      await linkDiscordAccount(accountId, discordUserId, discordUsername);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT account_id FROM LinkedAccounts"),
        [discordUserId],
        undefined
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE LinkedAccounts"),
        [discordUsername, discordUserId, accountId],
        undefined
      );
    });

    it("should create new Discord link with username", async () => {
      const accountId = 123;
      const discordUserId = "456789";
      const discordUsername = "testuser";

      mockRunQuery.mockResolvedValueOnce([]); // No existing link
      mockRunQuery.mockResolvedValueOnce([]); // Insert result

      await linkDiscordAccount(accountId, discordUserId, discordUsername);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO LinkedAccounts"),
        [accountId, discordUserId, discordUsername],
        undefined
      );
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

  describe("getDiscordUsernameByAccountId", () => {
    it("should return Discord username when link exists", async () => {
      const accountId = 123;
      const expectedDiscordUsername = "testuser";

      mockRunQuery.mockResolvedValueOnce([
        { provider_username: expectedDiscordUsername }
      ]);

      const result = await getDiscordUsernameByAccountId(accountId);

      expect(result).toBe(expectedDiscordUsername);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT provider_username FROM LinkedAccounts"),
        [accountId],
        undefined
      );
    });

    it("should return null when Discord link does not exist", async () => {
      const accountId = 123;

      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getDiscordUsernameByAccountId(accountId);

      expect(result).toBeNull();
    });
  });

  describe("getDiscordInfoByAccountId", () => {
    it("should return Discord ID and username when link exists", async () => {
      const accountId = 123;
      const expectedDiscordId = "456789";
      const expectedDiscordUsername = "testuser";

      mockRunQuery.mockResolvedValueOnce([
        {
          provider_id: expectedDiscordId,
          provider_username: expectedDiscordUsername
        }
      ]);

      const result = await getDiscordInfoByAccountId(accountId);

      expect(result).toEqual({
        discordId: expectedDiscordId,
        discordUsername: expectedDiscordUsername
      });
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT provider_id, provider_username"),
        [accountId],
        undefined
      );
    });

    it("should return null when Discord link does not exist", async () => {
      const accountId = 123;

      mockRunQuery.mockResolvedValueOnce([]);

      const result = await getDiscordInfoByAccountId(accountId);

      expect(result).toBeNull();
    });
  });
});
