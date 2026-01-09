import type { Map } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getMaps = async () => {
  return runQuery<Map[]>("SELECT * FROM Maps");
};
