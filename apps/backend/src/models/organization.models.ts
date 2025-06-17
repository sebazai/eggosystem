import type {
  InsertOrganization,
  Organizations,
  OrganizationTeamTrophies,
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

export const getOrganizationApprovedTeams = async (id: number) => {
  return runQuery<Team[]>(
    "SELECT * FROM Teams WHERE organization_id = ? AND org_approved = ?",
    [id, 1]
  );
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

export const getOrganizationTeamTrophies = async (organizationId: number) => {
  const query = `
    SELECT
      t.id AS team_id,
      t.name AS team_name,
      s.id AS season_id,
      l.id AS league_id,
      s.full_name AS season_name,
      l.name AS league_name,
      slt.placement
    FROM Teams t
    JOIN Organizations o ON o.id = t.organization_id
    JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
    JOIN Seasons s ON s.id = slt.season_id
    JOIN Leagues l ON l.id = slt.league_id
    WHERE o.id = ?
      AND slt.placement IS NOT NULL
    ORDER BY s.id DESC;
  `;
  return runQuery<Array<OrganizationTeamTrophies>>(query, [organizationId]);
};
