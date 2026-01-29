import { ConflictError } from "./errors";

/**
 * Type guard to check if an error is a MariaDB/MySQL database error
 */
interface DatabaseError {
  code?: string;
  sqlState?: string;
  sqlMessage?: string;
  message?: string;
}

function isDatabaseError(err: unknown): err is DatabaseError {
  return (
    typeof err === "object" &&
    err !== null &&
    ("code" in err || "sqlState" in err || "sqlMessage" in err)
  );
}

/**
 * Checks if an error is a duplicate entry error (ER_DUP_ENTRY)
 */
function isDuplicateEntryError(err: unknown): boolean {
  if (!isDatabaseError(err)) {
    return false;
  }
  return err.code === "ER_DUP_ENTRY";
}

/**
 * Utility function to check if an error is ER_DUP_ENTRY
 * Useful for race condition handling and other cases where you need to check for duplicates
 * @param err - The error to check
 * @returns true if the error is ER_DUP_ENTRY, false otherwise
 */
export function isErDupEntry(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

/**
 * Checks if an error is a trigger error (SQLSTATE 45000)
 * These are custom errors raised by database triggers
 */
function isTriggerError(err: unknown): boolean {
  if (!isDatabaseError(err)) {
    return false;
  }
  return err.sqlState === "45000";
}

/**
 * Extracts the error message from a database error
 */
function getErrorMessage(err: DatabaseError): string {
  return err.sqlMessage || err.message || "Database error occurred";
}

/**
 * Maps database table/constraint names to user-friendly error messages
 */
function getUserFriendlyMessage(
  errorMessage: string,
  tableName?: string
): string {
  // Trigger errors (SQLSTATE 45000) usually have user-friendly messages already
  if (
    errorMessage.includes("is already registered") ||
    errorMessage.includes("is already used") ||
    errorMessage.includes("already exists")
  ) {
    return errorMessage;
  }

  // Try to extract table name from error message if not provided
  if (!tableName) {
    const tableMatch = errorMessage.match(/for key '.*?\.(.*?)'/);
    if (tableMatch) {
      tableName = tableMatch[1];
    }
  }

  // Map specific tables/constraints to user-friendly messages
  const messageMap: Record<string, string> = {
    KanahautomoRegistrations:
      "You are already registered for this organization",
    SeasonPlayerApprovals: "Player is already approved for this season",
    SeasonTeamRegistrations: "Team is already registered for this season",
    MatchGames: "This match game already exists",
    PlayerStats: "Player statistics for this game already exist",
    TeamGameScores: "Team scores for this game already exist",
    PlayerTrades: "This trade record already exists",
    KillLogs: "This kill log entry already exists",
    PlayerClutches: "This clutch record already exists",
    PlayerRoundImpacts: "This round impact record already exists",
    FantasyPlayerValues: "Fantasy player values already exist for this season",
    FantasyPlayerHistory:
      "Fantasy player history already exists for this match",
    FantasyPointsLog: "Fantasy points for this match have already been logged",
    GlobalPlayerPoints: "Global player points already exist",
    Accounts: "An account with this email already exists",
    Teams: "A team with this name already exists",
    Organizations: "An organization with this name or code already exists",
    Organizers: "An organizer with this FaceIT ID already exists",
    LinkedAccounts: "This account is already linked",
    Roles: "A role with this name already exists",
    Permissions: "A permission with this name already exists",
    PublicEmailDomains: "This email domain is already registered",
    Trophies: "A trophy with this name already exists",
    SeasonLeagueExternalIds:
      "This external ID is already used for this season and league",
    CasterUrls: "Caster URL already exists for this account",
    UserPolicyAcceptances: "Policy acceptance already recorded",
    NewsletterUnsubscribeTokens: "Unsubscribe token already exists",
    SteamPlayers: "A player with this FaceIT ID already exists"
  };

  // Try to find a match in the message map
  if (tableName) {
    for (const [key, message] of Object.entries(messageMap)) {
      if (tableName.includes(key) || errorMessage.includes(key)) {
        return message;
      }
    }
  }

  // Try to extract constraint name from error message
  const constraintMatch = errorMessage.match(/for key '(.*?)'/);
  if (constraintMatch) {
    const constraintName = constraintMatch[1];
    // Check for common constraint patterns
    if (constraintName.includes("unique_season_external_platform_id")) {
      return "This external platform ID is already used for this season";
    }
    if (constraintName.includes("unique_steam_id_season_id")) {
      return "Player is already approved for this season";
    }
    if (constraintName.includes("unique_steam_id_organization_id")) {
      return "You are already registered for this organization";
    }
  }

  // Fallback to generic message
  return "This record already exists";
}

/**
 * Converts a database duplicate entry or trigger error to a ConflictError
 * with a user-friendly message formatted for RFC 7807
 */
export function convertDatabaseErrorToConflictError(
  err: unknown
): ConflictError | null {
  if (!isDatabaseError(err)) {
    return null;
  }

  // Check for duplicate entry errors
  if (isDuplicateEntryError(err)) {
    const errorMessage = getErrorMessage(err);
    const userFriendlyMessage = getUserFriendlyMessage(errorMessage);
    return new ConflictError(userFriendlyMessage);
  }

  // Check for trigger errors (SQLSTATE 45000)
  // These usually have user-friendly messages already
  if (isTriggerError(err)) {
    const errorMessage = getErrorMessage(err);
    return new ConflictError(errorMessage);
  }

  return null;
}
