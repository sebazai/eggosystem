import type { Organizations, Team } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getOrganizations = async (searchParams?: string) => {
  if (!searchParams) {
    return runQuery<Organizations[]>("SELECT * FROM Organizations");
  }
  return runQuery<Organizations[]>(
    "SELECT * FROM Organizations WHERE name LIKE ?",
    [`%${searchParams}%`]
  );
};

export const getOrganizationById = async (id: string) => {
  return runQuery<Organizations[]>("SELECT * FROM Organizations WHERE id = ?", [
    id
  ]);
};

export const getOrganizationTeams = async (id: string) => {
  return runQuery<Team[]>("SELECT * FROM Teams WHERE organization_id = ?", [
    id
  ]);
};
