import type { KanahautomoRegistrationRecord } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const registerPlayerForKanahautomo = async (
  steamId: string,
  organizationId: number,
  seasonId: number
): Promise<{ insertId: number }[]> => {
  try {
    return await runQuery<Array<{ insertId: number }>>(
      "INSERT INTO KanahautomoRegistration (steam_id, season_id, organization_id, status) VALUES (?, ?, ?, 'active')",
      [steamId, seasonId, organizationId]
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new Error(
        "Player is already registered for Kanahautomo in this season"
      );
    }
    throw error;
  }
};

export const getKanahautomoRegistrationsByOrganization = async (
  organizationId: number,
  seasonId: number
) => {
  return runQuery<KanahautomoRegistrationRecord[]>(
    "SELECT * FROM KanahautomoRegistration WHERE organization_id = ? AND season_id = ? AND status = 'active' ORDER BY created_at ASC",
    [organizationId, seasonId]
  );
};

export const getKanahautomoRegistrationsByPlayer = async (steamId: string) => {
  return runQuery<KanahautomoRegistrationRecord[]>(
    "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? ORDER BY created_at DESC",
    [steamId]
  );
};

export const getKanahautomoRegistrationsByPlayerAndSeason = async (
  steamId: string,
  seasonId: number
) => {
  return runQuery<KanahautomoRegistrationRecord[]>(
    "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?",
    [steamId, seasonId]
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

export const getReadyToFormTeams = async (seasonId: number) => {
  return runQuery<Array<{ organization_id: number; player_count: number }>>(
    `
    SELECT organization_id, COUNT(*) as player_count
    FROM KanahautomoRegistration
    WHERE status = 'active' AND season_id = ?
    GROUP BY organization_id
    HAVING COUNT(*) >= 5
    ORDER BY player_count DESC
  `,
    [seasonId]
  );
};

export const getKanahautomoOrganizationStatusForSeason = async (
  seasonId: number
) => {
  const results = await runQuery<
    Array<{
      organization_id: number;
      organization_name: string;
      count: number;
    }>
  >(
    `SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as count
     FROM Organizations o
     JOIN KanahautomoRegistration r
       ON o.id = r.organization_id AND r.season_id = ? AND r.status = 'active'
     GROUP BY o.id, o.name
     ORDER BY o.name ASC`,
    [seasonId]
  );
  return results.map((row) => ({
    ...row,
    count: Number(row.count),
    status: row.count >= 5 ? "ready" : "waiting"
  }));
};

export const getKanahautomoRegistrationCounts = async () => {
  return runQuery<
    Array<{
      organization_id: number;
      organization_name: string;
      registration_count: number;
      has_discord_channel: boolean;
    }>
  >(
    `SELECT 
       o.id as organization_id,
       o.name as organization_name,
       COUNT(r.id) as registration_count,
       COUNT(r.id) >= 5 as has_discord_channel
     FROM Organizations o
     LEFT JOIN KanahautomoRegistration r
       ON o.id = r.organization_id AND r.status = 'active'
     GROUP BY o.id, o.name
     ORDER BY registration_count DESC, o.name ASC`
  );
};
