import { runQuery } from "../db/mysqlRunQuery";
import { NotFoundError } from "../utils/errors";

/**
 * Check if a user (by account_id) is a captain of a team
 * @param accountId - The user's account ID from JWT
 * @param teamId - The team ID to check
 * @returns True if user has captain role for the team
 */
export async function isUserTeamCaptain(
  accountId: number,
  teamId: number
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM AccountRoles ar
    JOIN Roles r ON r.id = ar.role_id
    JOIN SeasonTeamPlayers stp ON stp.steam_id = (
      SELECT steam_id FROM Accounts WHERE id = ?
    )
    WHERE ar.account_id = ?
      AND r.role_name = 'captain'
      AND stp.team_id = ?
      AND stp.season_id = (
        SELECT MAX(s.id)
        FROM Seasons s
        JOIN SeasonTeamPlayers stp2 ON stp2.season_id = s.id
        WHERE stp2.team_id = ?
      )
  `;

  const [result] = await runQuery<Array<{ count: number }>>(query, [
    accountId,
    accountId,
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
