import { type Knex } from "knex";

export const config = { transaction: false };

/**
 * Migration to fix fantasy team total_points calculation
 *
 * PROBLEM:
 * - When players are substituted, the old FantasyTeamPlayers row is marked as is_active = FALSE
 * - The FantasyTeams.total_points was only calculated from active players
 * - This caused points earned by removed players to disappear from team totals
 * - Additionally, points were being counted based on when they were calculated (created_at)
 *   instead of when the match was actually played (match.start_timestamp)
 *
 * SOLUTION:
 * - Recalculate total_points for all teams from ALL FantasyPointsLog entries
 * - Only count points where the match was played while the player was on the team
 *   (match.start_timestamp between player's added_at and removed_at)
 * - This ensures backward compatibility for existing teams with substitutions
 */
export async function up(knex: Knex): Promise<void> {
  console.warn(
    "Recalculating fantasy team total points from FantasyPointsLog with match date filtering..."
  );

  // Update all team totals by summing points where matches were played during team membership
  await knex.raw(`
    UPDATE FantasyTeams ft
    SET total_points = COALESCE((
      SELECT SUM(
        CASE 
          WHEN m.start_timestamp >= ftp.added_at 
           AND (ftp.removed_at IS NULL OR m.start_timestamp <= ftp.removed_at)
          THEN fpl.points_earned 
          ELSE 0 
        END
      )
      FROM FantasyPointsLog fpl
      INNER JOIN FantasyTeamPlayers ftp ON ftp.id = fpl.fantasy_team_player_id
      INNER JOIN MatchGames mg ON mg.id = fpl.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      WHERE ftp.fantasy_team_id = ft.id
    ), 0)
  `);

  const [result] = await knex.raw("SELECT COUNT(*) as count FROM FantasyTeams");
  console.warn(
    `Updated total_points for ${result[0]?.count || 0} fantasy teams (using match dates for proper point attribution)`
  );
}

export async function down(_knex: Knex): Promise<void> {
  // No down migration - the corrected totals are accurate
  // Rolling back would restore incorrect totals
  console.warn(
    "No down migration - fantasy team totals remain correctly calculated"
  );
}
