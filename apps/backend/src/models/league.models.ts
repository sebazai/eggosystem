import { League } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getLeagues = async () => {
  return runQuery<League[]>("SELECT * FROM Leagues");
};
