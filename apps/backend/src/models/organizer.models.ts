import { type Season, type Organizer, SeasonPlatform } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { NotFoundError } from "../utils/errors";

export const getOrganizerByIdOrFail = async (id: number) => {
  const [organizer] = await runQuery<[Organizer | undefined]>(
    "SELECT * FROM Organizers WHERE id = ?",
    [id]
  );
  if (!organizer) {
    throw new NotFoundError("Organizer not found");
  }
  return organizer;
};

export const getOrganizerByFaceitIdAndGameAppId = async (
  faceitId: string,
  appId: number
) => {
  const [organizer] = await runQuery<Array<Organizer | undefined>>(
    `SELECT o.* FROM Organizers o 
      JOIN OrganizerGames og ON o.id = og.organizer_id 
      JOIN Games g ON og.game_id = g.id 
    WHERE o.faceit_id = ?  AND g.app_id = ?`,
    [faceitId, appId]
  );
  return organizer;
};

export const getOrganizerFaceitSeasonForApp = async (
  faceitOrganizerId: string,
  seasonStringLike: string,
  appId: number
) => {
  const seasonNameCondition =
    seasonStringLike.trim() !== ""
      ? " AND (s.name LIKE ? OR s.full_name LIKE ?)"
      : "";
  const query = `SELECT s.* FROM Games g
    JOIN OrganizerGames og ON g.id = og.game_id
    JOIN Organizers o ON og.organizer_id = o.id
    JOIN Seasons s ON o.id = s.organizer_id AND s.game_id = g.id
    WHERE o.faceit_id = ? AND g.app_id = ? AND s.platform = ?
    ${seasonNameCondition}
    ORDER BY s.id DESC
    LIMIT 1`;
  const params: (string | number)[] = [
    faceitOrganizerId,
    appId,
    SeasonPlatform.FACEIT
  ];
  if (seasonStringLike.trim() !== "") {
    const pattern = `%${seasonStringLike.trim()}%`;
    params.push(pattern, pattern);
  }
  const [season] = await runQuery<Array<Season | undefined>>(query, params);
  return season;
};
