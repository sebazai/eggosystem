import { type Organizations } from "@eggosystem/types";
import { runQuery } from "../../db/mysqlRunQuery";

export const getTeamOrganization = async (teamId: number) => {
  return runQuery<Array<Organizations | undefined>>(
    "SELECT o.* FROM Teams t JOIN Organizations o ON t.organization_id = o.id WHERE t.id = ?",
    [teamId]
  );
};
