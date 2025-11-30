import { runQuery } from "../db/mysqlRunQuery";
import { NotFoundError } from "../utils/errors";

/**
 * Check if a user (by steam_id) is a captain or co-captain of a team
 * @param steamId - The user's Steam ID
 * @param teamId - The team ID to check
 * @returns True if user is captain or co-captain
 */
export async function isUserTeamCaptain(
  steamId: string,
  teamId: number
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM SeasonTeamPlayers stp
    WHERE stp.steam_id = ?
      AND stp.team_id = ?
      AND (stp.is_captain = 1 OR stp.is_co_captain = 1)
      AND stp.season_id = (
        SELECT MAX(s.id)
        FROM Seasons s
        JOIN SeasonTeamPlayers stp2 ON stp2.season_id = s.id
        WHERE stp2.team_id = ?
      )
  `;

  const [result] = await runQuery<Array<{ count: number }>>(query, [
    steamId,
    teamId,
    teamId
  ]);

  return (result?.count ?? 0) > 0;
}

/**
 * Update team logo phash in the database
 * @param teamId - The team ID to update
 * @param phash - The phash value to set
 * @throws NotFoundError if team doesn't exist
 */
export async function updateTeamLogoPhash(
  teamId: number,
  phash: string
): Promise<void> {
  // Verify team exists
  const [team] = await runQuery<Array<{ id: number }>>(
    "SELECT id FROM Teams WHERE id = ?",
    [teamId]
  );

  if (!team) {
    throw new NotFoundError(`Team with ID ${teamId} not found`);
  }

  // Update team logo phash
  await runQuery("UPDATE Teams SET team_logo = ? WHERE id = ?", [
    phash,
    teamId
  ]);
}

/**
 * Update team name in the database
 * @param teamId - The team ID to update
 * @param name - The new team name
 * @throws NotFoundError if team doesn't exist
 */
export async function updateTeamName(
  teamId: number,
  name: string
): Promise<void> {
  // Verify team exists
  const [team] = await runQuery<Array<{ id: number }>>(
    "SELECT id FROM Teams WHERE id = ?",
    [teamId]
  );

  if (!team) {
    throw new NotFoundError(`Team with ID ${teamId} not found`);
  }

  // Update team name
  await runQuery("UPDATE Teams SET name = ? WHERE id = ?", [name, teamId]);
}
