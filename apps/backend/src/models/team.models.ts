import { Team } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getTeams = async () => {
  return runQuery<Omit<Team, "email">[]>(
    "SELECT id, organization_id, name, team_logo FROM Teams"
  );
};
