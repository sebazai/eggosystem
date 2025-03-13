import type { Organizations } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getOrganizations = async (searchParams: string) => {
  return runQuery<Organizations[]>(
    "SELECT * FROM Organizations WHERE name LIKE ?",
    [`%${searchParams}%`]
  );
};
