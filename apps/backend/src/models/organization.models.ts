import type { Organizations } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getOrganizations = async () => {
  return runQuery<Organizations[]>("SELECT * FROM Organizations");
};
