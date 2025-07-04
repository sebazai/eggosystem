import { type Stage } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getAllStages = async (): Promise<Stage[]> => {
  return runQuery<Stage[]>("SELECT id, name FROM Stages");
};
