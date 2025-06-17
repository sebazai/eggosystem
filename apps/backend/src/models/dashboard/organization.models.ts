import { type Team } from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";

export const getOrganizationTeams = async (id: number) => {
  return runQuery<Team[]>("SELECT * FROM Teams WHERE organization_id = ?", [
    id
  ]);
};
