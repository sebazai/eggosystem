import type { Season } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasons = async () => {
  return runQuery<Season[]>("SELECT * FROM Seasons");
};

export const getSeasonById = async (id: string) => {
  return runQuery<Season[]>("SELECT * FROM Seasons WHERE id = ?", [id]);
};
