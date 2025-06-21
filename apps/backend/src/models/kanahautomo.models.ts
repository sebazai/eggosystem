import type { KanahautomoRegistration } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const registerPlayerForKanahautomo = async (
  steamId: string,
  organizationId: number
): Promise<{ insertId: number }[]> => {
  try {
    return await runQuery<Array<{ insertId: number }>>(
      "INSERT INTO KanahautomoRegistration (steam_id, organization_id, status) VALUES (?, ?, 'active')",
      [steamId, organizationId]
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new Error("Player is already registered for Kanahautomo");
    }
    throw error;
  }
};

export const getKanahautomoRegistrationsByOrganization = async (
  organizationId: number
) => {
  return runQuery<KanahautomoRegistration[]>(
    "SELECT * FROM KanahautomoRegistration WHERE organization_id = ? AND status = 'active' ORDER BY created_at ASC",
    [organizationId]
  );
};

export const getKanahautomoRegistrationsByPlayer = async (steamId: string) => {
  return runQuery<KanahautomoRegistration[]>(
    "SELECT * FROM KanahautomoRegistration WHERE steam_id = ?",
    [steamId]
  );
};

export const updateKanahautomoRegistrationStatus = async (
  registrationId: number,
  status: "active" | "team_formed"
) => {
  return runQuery<{ affectedRows: number }>(
    "UPDATE KanahautomoRegistration SET status = ? WHERE id = ?",
    [status, registrationId]
  );
};

export const getReadyToFormTeams = async () => {
  return runQuery<Array<{ organization_id: number; player_count: number }>>(`
    SELECT organization_id, COUNT(*) as player_count
    FROM KanahautomoRegistration
    WHERE status = 'active'
    GROUP BY organization_id
    HAVING COUNT(*) >= 5
    ORDER BY player_count DESC
  `);
};
