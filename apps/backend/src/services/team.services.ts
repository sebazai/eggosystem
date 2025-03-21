import { runQuery } from "../db/mysqlRunQuery";

// Check that team is part of organization
export const isTeamPartOfOrganization = async (
  teamId: number,
  organizationId: number
) => {
  const results = await runQuery<{ id: number }[]>(
    "SELECT id FROM Teams WHERE id = ? AND organization_id = ?",
    [teamId, organizationId]
  );
  return results.length > 0;
};
