import type { Map } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getMaps = async () => {
  return runQuery<Map[]>("SELECT * FROM Maps");
};

const getMapIdByName = async (name: string) => {
  const query = `SELECT id FROM Maps WHERE name = ?`;
  const [map] = await runQuery<Array<{ id: number }>>(query, [
    name.toLowerCase()
  ]);
  return map?.id;
};
