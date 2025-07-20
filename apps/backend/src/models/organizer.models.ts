import { type Organizer } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getOrganizerByFaceitIdAndGameAppId = async (
  faceitId: string,
  appId: number
) => {
  const organizer = await runQuery<Array<Organizer> | undefined>(
    `SELECT o.* FROM Organizers o 
      JOIN OrganizerGames og ON o.id = og.organizer_id 
      JOIN Games g ON og.game_id = g.id 
    WHERE o.faceit_id = ?  AND g.app_id = ?`,
    [faceitId, appId]
  );
  return organizer;
};
