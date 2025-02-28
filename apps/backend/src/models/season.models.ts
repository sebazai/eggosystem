import { Season } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasons = async () => {
  return runQuery<Season[]>("SELECT * FROM Seasons");
};
