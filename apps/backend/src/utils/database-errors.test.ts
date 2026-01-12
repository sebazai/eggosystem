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

    describe("Foreign key constraint errors", () => {
      it("should return null for foreign key constraint errors (not converted to ConflictError)", () => {
        const error = {
          code: "ER_NO_REFERENCED_ROW_2",
          sqlState: "23000",
          sqlMessage:
            "Cannot add or update a child row: a foreign key constraint fails"
        };

        const result = convertDatabaseErrorToConflictError(error);

        // Foreign key errors are not converted to ConflictError
        // They should be handled separately or as generic errors
        expect(result).toBeNull();
      });

      it("should return null for ER_ROW_IS_REFERENCED_2 errors", () => {
        const error = {
          code: "ER_ROW_IS_REFERENCED_2",
          sqlState: "23000",
          sqlMessage:
            "Cannot delete or update a parent row: a foreign key constraint fails"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeNull();
      });
    });

    describe("Unique constraint errors in different formats", () => {
      it("should handle ER_DUP_ENTRY with constraint name format", () => {
        const error = new Error(
          "Duplicate entry for key 'unique_season_external_platform_id'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe(
          "This external platform ID is already used for this season"
        );
      });

      it("should handle ER_DUP_ENTRY with table.column format", () => {
        const error = new Error(
          "Duplicate entry 'value' for key 'TableName.column_name'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
      });

      it("should handle ER_DUP_ENTRY with PRIMARY key constraint", () => {
        const error = new Error("Duplicate entry '123' for key 'PRIMARY'");
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("This record already exists");
      });

      it("should handle ER_DUP_ENTRY with unique index name format", () => {
        const error = new Error("Duplicate entry for key 'idx_unique_name'");
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
      });

      it("should handle ER_DUP_ENTRY with composite key format", () => {
        const error = new Error(
          "Duplicate entry '123-456' for key 'composite_key_name'"
        );
        (error as { code?: string }).code = "ER_DUP_ENTRY";

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
      });
    });

    describe("Trigger error edge cases", () => {
      it("should handle trigger error with empty sqlMessage", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage: "",
          message: "Trigger error message"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("Trigger error message");
      });

      it("should handle trigger error with only message property", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          message: "Custom trigger error"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("Custom trigger error");
      });

      it("should handle trigger error with both sqlMessage and message (prefers sqlMessage)", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000",
          sqlMessage: "SQL message from trigger",
          message: "Regular message"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("SQL message from trigger");
      });

      it("should handle trigger error with no message properties", () => {
        const error = {
          code: "SOME_CODE",
          sqlState: "45000"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("Database error occurred");
      });

      it("should handle trigger errors for different scenarios", () => {
        const triggerScenarios = [
          {
            sqlMessage: "Player cannot be added: maximum roster size reached",
            expected: "Player cannot be added: maximum roster size reached"
          },
          {
            sqlMessage: "Season registration is closed",
            expected: "Season registration is closed"
          },
          {
            sqlMessage: "Invalid team composition for this season",
            expected: "Invalid team composition for this season"
          }
        ];

        for (const scenario of triggerScenarios) {
          const error = {
            code: "SOME_CODE",
            sqlState: "45000",
            sqlMessage: scenario.sqlMessage
          };

          const result = convertDatabaseErrorToConflictError(error);

          expect(result).toBeInstanceOf(ConflictError);
          expect(result?.status).toBe(409);
          expect(result?.message).toBe(scenario.expected);
        }
      });
    });

    describe("Error format variations", () => {
      it("should handle error object without Error instance", () => {
        const error = {
          code: "ER_DUP_ENTRY",
          message: "Duplicate entry for key 'Teams.name'"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("A team with this name already exists");
      });

      it("should handle error with sqlState but no code", () => {
        const error = {
          sqlState: "45000",
          sqlMessage: "Trigger error message"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
        expect(result?.message).toBe("Trigger error message");
      });

      it("should handle error with code but no sqlState", () => {
        const error = {
          code: "ER_DUP_ENTRY",
          message: "Duplicate entry for key 'Teams.name'"
        };

        const result = convertDatabaseErrorToConflictError(error);

        expect(result).toBeInstanceOf(ConflictError);
        expect(result?.status).toBe(409);
      });
    });
  });
});
