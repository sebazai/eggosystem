import type {
  InsertOrganization,
  Organizations,
  Team
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { cleanWWWUrl } from "../utils/urlSanitize";
import type { PoolConnection } from "mysql2/promise";
import { buildInsertQueryParts } from "../db/utils";

export const getOrganizations = async (searchParams?: string) => {
  if (!searchParams) {
    return runQuery<Organizations[]>(
      "SELECT * FROM Organizations ORDER BY sort_order DESC, name ASC"
    );
  }
  return runQuery<Organizations[]>(
    "SELECT * FROM Organizations WHERE name LIKE ? ORDER BY sort_order DESC, name ASC",
    [`%${searchParams}%`]
  );
};

export const getOrganizationById = async (id: number) => {
  return runQuery<Organizations[]>("SELECT * FROM Organizations WHERE id = ?", [
    id
  ]);
};

export const getOrganizationTeams = async (id: number) => {
  return runQuery<Team[]>("SELECT * FROM Teams WHERE organization_id = ?", [
    id
  ]);
};

export const insertOrganization = async (
  organization: InsertOrganization,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts({
    ...organization,
    website: cleanWWWUrl(organization.website)
  });
  return runQuery<{ insertId: number }>(
    `INSERT INTO Organizations (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};
