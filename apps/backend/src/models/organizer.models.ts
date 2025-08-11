import { type Season, type Organizer } from "@eggosystem/types";
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

// TODO: This does not work if there are multiple seasons with different game_type_id or seasons with end_date null
export const getOrganizerFaceitActiveSeasonForApp = async (
  faceitOrganizerId: string,
  appId: number
) => {
  const query = `SELECT s.* FROM Games g
    JOIN OrganizerGames og ON g.id = og.game_id
    JOIN Organizers o ON og.organizer_id = o.id
    JOIN Seasons s ON o.id = s.organizer_id
    WHERE o.faceit_id = ? AND g.app_id = ? AND s.end_date IS NULL`;
  const [season] = await runQuery<Array<Season | undefined>>(query, [
    faceitOrganizerId,
    appId
  ]);
  return season;
};
