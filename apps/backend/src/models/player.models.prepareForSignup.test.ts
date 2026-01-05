import { preparePlayerForSignup } from "./player.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";

// Mock dependencies
jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

function getMockConnection() {
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined)
  };
}

describe("preparePlayerForSignup", () => {
  const testSteamId = "76561198012345678";
  let mockConnection: ReturnType<typeof getMockConnection>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = getMockConnection();
    mockGetConnection.mockResolvedValue(
      mockConnection as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    // Reset mockRunQuery to ensure it returns arrays by default for SELECT queries
    mockRunQuery.mockReset();
  });

  describe("when player does not exist", () => {
    it("should create new account, SteamPlayers, and LinkedAccounts", async () => {
      // Mock: Player doesn't exist
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock: Insert Account
      mockRunQuery.mockResolvedValueOnce({
        insertId: 123
      } as unknown as Awaited<ReturnType<typeof runQuery>>);

      // Mock: Insert SteamPlayers
      mockRunQuery.mockResolvedValueOnce({
        insertId: 1
      } as unknown as Awaited<ReturnType<typeof runQuery>>);

      // Mock: Insert LinkedAccounts
      mockRunQuery.mockResolvedValueOnce({
        insertId: 1
      } as unknown as Awaited<ReturnType<typeof runQuery>>);

      const result = await preparePlayerForSignup(testSteamId);

      expect(result).toEqual({
        account_id: 123,
        steam_id: testSteamId,
        changes_made: true
      });

      // Verify transaction flow
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();

      // Verify queries
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM SteamPlayers WHERE steam_id = ?",
        [testSteamId],
        mockConnection
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO Accounts (full_name, work_email, work_email_verified, is_work_email_personal_email) VALUES (?, ?, ?, ?)",
        [
          `Fake Name ${testSteamId.slice(-4)}`,
          `fake_${testSteamId.slice(-8)}@example.com`,
          true,
          false
        ],
        mockConnection
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO SteamPlayers (steam_id, nickname, account_id) VALUES (?, ?, ?)",
        [testSteamId, `Player_${testSteamId.slice(-8)}`, 123],
        mockConnection
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO LinkedAccounts (account_id, provider_id, provider) VALUES (?, ?, ?)",
        [123, testSteamId, "steam"],
        mockConnection
      );
    });
  });

  describe("when player exists", () => {
    describe("with valid account data", () => {
      it("should not update if account already has valid data with null is_work_email_personal_email", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "valid@example.com",
          work_email_verified: 1, // Already verified
          is_work_email_personal_email: null // null should be treated as 0 (not personal)
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // No UPDATE queries should be called since everything is already valid
        // (null is_work_email_personal_email is treated as 0, so no change needed)

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: false
        });

        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.rollback).not.toHaveBeenCalled();

        // Verify no UPDATE queries were called
        const updateCalls = mockRunQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" &&
            (call[0].includes("UPDATE Accounts") ||
              call[0].includes("UPDATE SteamPlayers"))
        );
        expect(updateCalls.length).toBe(0);
      });

      it("should not update if account already has valid data with string is_work_email_personal_email", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "valid@example.com",
          work_email_verified: 1, // Already verified
          is_work_email_personal_email: "0" // String "0" from database (like PHPMyAdmin export)
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // No UPDATE queries should be called since everything is already valid
        // (string "0" should be normalized to number 0, so no change needed)

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: false
        });

        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.rollback).not.toHaveBeenCalled();

        // Verify no UPDATE queries were called
        const updateCalls = mockRunQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" &&
            (call[0].includes("UPDATE Accounts") ||
              call[0].includes("UPDATE SteamPlayers"))
        );
        expect(updateCalls.length).toBe(0);
      });

      it("should not update if account already has valid data", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "valid@example.com",
          work_email_verified: 1, // Already verified
          is_work_email_personal_email: 0
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // No UPDATE queries should be called since everything is already valid

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: false
        });

        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.rollback).not.toHaveBeenCalled();

        // Verify no UPDATE queries were called
        const updateCalls = mockRunQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" &&
            (call[0].includes("UPDATE Accounts") ||
              call[0].includes("UPDATE SteamPlayers"))
        );
        expect(updateCalls.length).toBe(0);
      });
    });

    describe("with missing or invalid account data", () => {
      it("should update account with fake data if full_name is missing", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: null,
          work_email: "valid@example.com",
          work_email_verified: 1, // Email is verified, so it should be kept
          is_work_email_personal_email: 0
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // Mock: Update SteamPlayers (if nickname changes) - this won't be called since nickname matches
        // Mock: Update Account
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: true
        });

        expect(mockConnection.commit).toHaveBeenCalled();

        // Verify fake full_name is used (check the UPDATE Accounts call)
        const updateCalls = mockRunQuery.mock.calls.filter((call) =>
          call[0]?.includes("UPDATE Accounts")
        );
        expect(updateCalls.length).toBeGreaterThan(0);
        const updateCall = updateCalls[0];
        expect(updateCall[1]).toContain(`Fake Name ${testSteamId.slice(-4)}`);
        expect(updateCall[1]).toContain("valid@example.com");
      });

      it("should update account with fake email if work_email is invalid", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: null,
          is_work_email_personal_email: 0
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // Mock: Update Account
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: true
        });

        // Verify fake email is used (check the UPDATE Accounts call)
        const updateCalls = mockRunQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" && call[0].includes("UPDATE Accounts")
        );
        expect(updateCalls.length).toBeGreaterThan(0);
        const updateCall = updateCalls[0];
        expect(Array.isArray(updateCall[1])).toBe(true);
        expect(updateCall[1]).toContain("Valid Full Name");
        expect(updateCall[1]).toContain(
          `fake_${testSteamId.slice(-8)}@example.com`
        );
      });

      it("should update account with fake email if is_work_email_personal_email is 1", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "personal@example.com",
          is_work_email_personal_email: 1
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // Mock: Update Account
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: true
        });

        // Verify fake email is used when personal email flag is set
        const updateCalls = mockRunQuery.mock.calls.filter((call) =>
          call[0]?.includes("UPDATE Accounts")
        );
        expect(updateCalls.length).toBeGreaterThan(0);
        const updateCall = updateCalls[0];
        expect(updateCall[1]).toContain("Valid Full Name");
        expect(updateCall[1]).toContain(
          `fake_${testSteamId.slice(-8)}@example.com`
        );
      });

      it("should update nickname if missing", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: null,
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "valid@example.com",
          work_email_verified: 1, // Email is verified
          is_work_email_personal_email: 0
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // Mock: Update SteamPlayers nickname
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        // Mock: Update Account
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: true
        });

        // Verify nickname is updated
        const nicknameUpdateCalls = mockRunQuery.mock.calls.filter((call) =>
          call[0]?.includes("UPDATE SteamPlayers")
        );
        expect(nicknameUpdateCalls.length).toBeGreaterThan(0);
        const nicknameCall = nicknameUpdateCalls[0];
        expect(nicknameCall[1]).toContain(`Player_${testSteamId.slice(-8)}`);
        expect(nicknameCall[1]).toContain(testSteamId);
      });

      it("should replace unverified email with fake email and clear token/expiry even if email format is valid", async () => {
        const existingPlayer = {
          steam_id: testSteamId,
          nickname: "ExistingPlayer",
          account_id: 456
        };

        const existingAccount = {
          id: 456,
          full_name: "Valid Full Name",
          work_email: "unverified@example.com",
          work_email_verified: 0, // NOT verified
          is_work_email_personal_email: 0
          // Assume work_email_token and work_email_token_expires_at are set in DB
        };

        // Mock: Player exists
        mockRunQuery.mockResolvedValueOnce([existingPlayer]);

        // Mock: Get account
        mockRunQuery.mockResolvedValueOnce([existingAccount]);

        // Mock: Update Account
        mockRunQuery.mockResolvedValueOnce({
          affectedRows: 1
        } as unknown as Awaited<ReturnType<typeof runQuery>>);

        const result = await preparePlayerForSignup(testSteamId);

        expect(result).toEqual({
          account_id: 456,
          steam_id: testSteamId,
          changes_made: true
        });

        expect(mockConnection.commit).toHaveBeenCalled();

        // Verify the UPDATE Accounts call sets:
        // 1. fake email (because email is not verified)
        // 2. work_email_verified to true
        // 3. work_email_token to null
        // 4. work_email_token_expires_at to null
        const updateCalls = mockRunQuery.mock.calls.filter(
          (call) =>
            typeof call[0] === "string" && call[0].includes("UPDATE Accounts")
        );
        expect(updateCalls.length).toBeGreaterThan(0);
        const updateCall = updateCalls[0];
        expect(Array.isArray(updateCall[1])).toBe(true);

        // Check parameters: [fullName, workEmail, work_email_verified, is_work_email_personal_email, work_email_token, work_email_token_expires_at, accountId]
        expect(updateCall[1]).toEqual([
          "Valid Full Name",
          `fake_${testSteamId.slice(-8)}@example.com`, // Fake email because unverified
          true, // work_email_verified set to true
          false, // is_work_email_personal_email
          null, // work_email_token cleared
          null, // work_email_token_expires_at cleared
          456 // account ID
        ]);
      });
    });

    it("should throw error if account not found", async () => {
      const existingPlayer = {
        steam_id: testSteamId,
        nickname: "ExistingPlayer",
        account_id: 456
      };

      // Mock: Player exists
      mockRunQuery.mockResolvedValueOnce([existingPlayer]);

      // Mock: Account not found (empty array - this means no account found)
      mockRunQuery.mockResolvedValueOnce([]);

      await expect(preparePlayerForSignup(testSteamId)).rejects.toThrow(
        `Account not found for steam_id ${testSteamId}`
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should rollback transaction on error", async () => {
      const dbError = new Error("Database error");

      // Mock: Player doesn't exist
      mockRunQuery.mockResolvedValueOnce([]);

      // Mock: Insert Account fails
      mockRunQuery.mockRejectedValueOnce(dbError);

      await expect(preparePlayerForSignup(testSteamId)).rejects.toThrow(
        dbError
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});
