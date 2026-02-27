import { runQuery } from "../db/mysqlRunQuery";
import {
  getAuthUserBySteamId,
  createAccountForSteam,
  updateSteamLinkedAccountUsername
} from "./auth.models";

describe("Auth Models", () => {
  const TEST_ACCOUNT_ID = 99980;
  const TEST_STEAM_ID = "76561198000099980";
  const TEST_NICKNAME = "AuthModelTestPlayer";

  // Clean up helper to ensure no leftover test data
  const cleanup = async () => {
    await runQuery("DELETE FROM LinkedAccounts WHERE provider_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id = ?", [
      TEST_STEAM_ID
    ]);
    await runQuery("DELETE FROM Accounts WHERE id = ?", [TEST_ACCOUNT_ID]);
    // Also clean up any accounts created by createAccountForSteam
    await runQuery("DELETE FROM LinkedAccounts WHERE provider_id IN (?, ?)", [
      "76561198000099981",
      "76561198000099982"
    ]);
    await runQuery("DELETE FROM SteamPlayers WHERE steam_id IN (?, ?)", [
      "76561198000099981",
      "76561198000099982"
    ]);
    // Clean up accounts created during tests (by looking up via LinkedAccounts)
    const createdAccounts = await runQuery<Array<{ account_id: number }>>(
      "SELECT account_id FROM LinkedAccounts WHERE provider_id IN (?, ?)",
      ["76561198000099981", "76561198000099982"]
    );
    for (const acc of createdAccounts) {
      await runQuery("DELETE FROM LinkedAccounts WHERE account_id = ?", [
        acc.account_id
      ]);
      await runQuery("DELETE FROM SteamPlayers WHERE account_id = ?", [
        acc.account_id
      ]);
      await runQuery("DELETE FROM Accounts WHERE id = ?", [acc.account_id]);
    }
  };

  beforeEach(async () => {
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
  });

  describe("getAuthUserBySteamId", () => {
    it("should return user when steam_id exists", async () => {
      // Setup: create Account, SteamPlayer, LinkedAccount
      await runQuery("INSERT INTO Accounts (id, full_name) VALUES (?, ?)", [
        TEST_ACCOUNT_ID,
        "Auth Test User"
      ]);
      await runQuery(
        "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (?, ?, ?)",
        [TEST_STEAM_ID, TEST_NICKNAME, TEST_ACCOUNT_ID]
      );
      await runQuery(
        "INSERT INTO LinkedAccounts (account_id, provider, provider_id) VALUES (?, 'steam', ?)",
        [TEST_ACCOUNT_ID, TEST_STEAM_ID]
      );

      const result = await getAuthUserBySteamId(TEST_STEAM_ID);

      expect(result).not.toBeNull();
      expect(result!.account_id).toBe(TEST_ACCOUNT_ID);
      expect(result!.steam_id).toBe(TEST_STEAM_ID);
      expect(result!.nickname).toBe(TEST_NICKNAME);
      expect(result!.provider).toBe("steam");
    });

    it("should return null when steam_id does not exist", async () => {
      const result = await getAuthUserBySteamId("76561198000000000");

      expect(result).toBeNull();
    });
  });

  describe("createAccountForSteam", () => {
    it("should create Account, SteamPlayer, and LinkedAccount", async () => {
      const steamId = "76561198000099981";

      const result = await createAccountForSteam({
        steamId,
        steamDisplayName: "NewTestPlayer",
        steamRealname: "New Test"
      });

      expect(result.provider_id).toBe(steamId);
      expect(typeof result.account_id).toBe("number");

      // Verify data was inserted
      const [account] = await runQuery<
        Array<{ id: number; full_name: string }>
      >("SELECT id, full_name FROM Accounts WHERE id = ?", [result.account_id]);
      expect(account!.full_name).toBe("New Test");

      const [steamPlayer] = await runQuery<
        Array<{ steam_id: string; nickname: string }>
      >("SELECT steam_id, nickname FROM SteamPlayers WHERE steam_id = ?", [
        steamId
      ]);
      expect(steamPlayer!.nickname).toBe("NewTestPlayer");

      const [linkedAccount] = await runQuery<
        Array<{
          account_id: number;
          provider: string;
          provider_username: string;
        }>
      >(
        "SELECT account_id, provider, provider_username FROM LinkedAccounts WHERE provider_id = ?",
        [steamId]
      );
      expect(linkedAccount!.account_id).toBe(result.account_id);
      expect(linkedAccount!.provider).toBe("steam");
      expect(linkedAccount!.provider_username).toBe("NewTestPlayer");
    });

    it("should use steamDisplayName as full_name when steamRealname is not provided", async () => {
      const steamId = "76561198000099982";

      const result = await createAccountForSteam({
        steamId,
        steamDisplayName: "DisplayNameOnly"
      });

      const [account] = await runQuery<Array<{ full_name: string }>>(
        "SELECT full_name FROM Accounts WHERE id = ?",
        [result.account_id]
      );
      expect(account!.full_name).toBe("DisplayNameOnly");
    });
  });

  describe("updateSteamLinkedAccountUsername", () => {
    it("should update the provider_username in LinkedAccounts", async () => {
      // Setup
      await runQuery("INSERT INTO Accounts (id, full_name) VALUES (?, ?)", [
        TEST_ACCOUNT_ID,
        "Update Test User"
      ]);
      await runQuery(
        "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (?, ?, ?)",
        [TEST_STEAM_ID, TEST_NICKNAME, TEST_ACCOUNT_ID]
      );
      await runQuery(
        "INSERT INTO LinkedAccounts (account_id, provider, provider_id, provider_username) VALUES (?, 'steam', ?, ?)",
        [TEST_ACCOUNT_ID, TEST_STEAM_ID, "OldName"]
      );

      await updateSteamLinkedAccountUsername(TEST_STEAM_ID, "NewName");

      const [updated] = await runQuery<Array<{ provider_username: string }>>(
        "SELECT provider_username FROM LinkedAccounts WHERE provider_id = ? AND provider = 'steam'",
        [TEST_STEAM_ID]
      );
      expect(updated!.provider_username).toBe("NewName");
    });

    it("should not throw when steam_id does not exist", async () => {
      // Should execute without error even if no rows match
      await expect(
        updateSteamLinkedAccountUsername("76561198000000000", "SomeName")
      ).resolves.toBeUndefined();
    });
  });
});
