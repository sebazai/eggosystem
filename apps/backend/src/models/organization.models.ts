import type { Organizations } from "@eggosystem/types";
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
