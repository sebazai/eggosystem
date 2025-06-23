import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const registerPlayerForKanahautomo = async (
  steamId: string,
  organizationId: number,
  acceptedTerms: boolean = false,
  connection?: PoolConnection
) => {
  try {
    return await runQuery<{ insertId: number }>(
      "INSERT INTO KanahautomoRegistration (steam_id, organization_id, accepted_terms) VALUES (?, ?, ?)",
      [steamId, organizationId, acceptedTerms],
      connection
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      throw new Error(
        "Player is already registered for Kanahautomo in this organization"
      );
    }
    throw error;
  }
};

export const getKanahautomoOrganizationStatus = async () => {
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
       ON o.id = r.organization_id AND r.accepted_terms = true
     GROUP BY o.id, o.name
     ORDER BY o.name ASC`,
    []
  );
  return results;
};
