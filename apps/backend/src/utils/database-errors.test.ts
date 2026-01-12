import {
  isErDupEntry,
  convertDatabaseErrorToConflictError
} from "./database-errors";
import { ConflictError } from "./errors";

describe("Database Errors", () => {
  describe("isErDupEntry", () => {
    it("should return true for ER_DUP_ENTRY error", () => {
      const error = new Error("Duplicate entry");
      (error as { code?: string }).code = "ER_DUP_ENTRY";

      expect(isErDupEntry(error)).toBe(true);
    });

    it("should return false for non-ER_DUP_ENTRY error", () => {
      const error = new Error("Some other error");
      (error as { code?: string }).code = "ER_SOME_OTHER_ERROR";

      expect(isErDupEntry(error)).toBe(false);
    });

    it("should return false for error without code", () => {
      const error = new Error("Some error");

      expect(isErDupEntry(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isErDupEntry(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isErDupEntry(undefined)).toBe(false);
    });

    it("should return false for non-object types", () => {
      expect(isErDupEntry("string")).toBe(false);
      expect(isErDupEntry(123)).toBe(false);
      expect(isErDupEntry(true)).toBe(false);
    });

    it("should return false for object without code property", () => {
      const error = { message: "Some error" };

      expect(isErDupEntry(error)).toBe(false);
    });
  });

  describe("convertDatabaseErrorToConflictError", () => {
    describe("ER_DUP_ENTRY errors", () => {
      it("should convert ER_DUP_ENTRY to ConflictError with user-friendly message for KanahautomoRegistrations", () => {
        const error = new Error(
          "Duplicate entry '123-456' for key 'KanahautomoRegistrations.steam_id'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "You are already registered for this organization"
        );
      });

      it("should convert ER_DUP_ENTRY to ConflictError for SeasonPlayerApprovals", () => {
        const error = new Error(
          "Duplicate entry for key 'SeasonPlayerApprovals.unique_steam_id_season_id'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "Player is already approved for this season"
        );
      });

      it("should convert ER_DUP_ENTRY to ConflictError for Teams", () => {
        const error = new Error(
          "Duplicate entry 'TeamName' for key 'Teams.name'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("A team with this name already exists");
      });

      it("should convert ER_DUP_ENTRY to ConflictError for Accounts", () => {
        const error = new Error(
          "Duplicate entry 'test@example.com' for key 'Accounts.email'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "An account with this email already exists"
        );
      });

      it("should convert ER_DUP_ENTRY to ConflictError with constraint name matching", () => {
        const error = new Error(
          "Duplicate entry for key 'unique_steam_id_organization_id'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "You are already registered for this organization"
        );
      });

      it("should convert ER_DUP_ENTRY to ConflictError with fallback message for unknown table", () => {
        const error = new Error(
          "Duplicate entry for key 'UnknownTable.unknown_key'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("This record already exists");
      });

      it("should use sqlMessage if available", () => {
        const error = {
          code: "ER_DUP_ENTRY",
          sqlMessage: "Duplicate entry for key 'Teams.name'",
          message: "Some other message"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("A team with this name already exists");
      });

      it("should use message if sqlMessage is not available", () => {
        const error = {
          code: "ER_DUP_ENTRY",
          message: "Duplicate entry for key 'Teams.name'"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("A team with this name already exists");
      });
    });

    describe("SQLSTATE 45000 trigger errors", () => {
      it("should convert SQLSTATE 45000 to ConflictError with trigger message", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage: "Team 123 is already registered for season 456"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "Team 123 is already registered for season 456"
        );
      });

      it("should use message if sqlMessage is not available for trigger error", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          message:
            "Player 123 is already registered as primary for team 456 in season 789"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "Player 123 is already registered as primary for team 456 in season 789"
        );
      });

      it("should handle external platform ID trigger error", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage:
            'FACEIT Platform ID "abc123" is already used for season 1.'
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          'FACEIT Platform ID "abc123" is already used for season 1.'
        );
      });
    });

    describe("Non-database errors", () => {
      it("should return null for regular Error", () => {
        const error = new Error("Some regular error");

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeNull();
      });

      it("should return null for error without database properties", () => {
        const error = { message: "Some error" };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeNull();
      });

      it("should return null for null", () => {
        const result = convertDatabaseErrorToConflictError(null);

        expect(result).toBeNull();
      });

      it("should return null for undefined", () => {
        const result = convertDatabaseErrorToConflictError(undefined);

        expect(result).toBeNull();
      });

      it("should return null for non-object types", () => {
        expect(convertDatabaseErrorToConflictError("string")).toBeNull();
        expect(convertDatabaseErrorToConflictError(123)).toBeNull();
        expect(convertDatabaseErrorToConflictError(true)).toBeNull();
      });

      it("should return null for database error that is not ER_DUP_ENTRY or SQLSTATE 45000", () => {
        const error = {
          code: "ER_SOME_OTHER_ERROR",
          sqlState: "42000",
          sqlMessage: "Some database error"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeNull();
      });
    });
  });
});
