import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Email format validation
  // First, clean up any invalid email formats by setting them to NULL
  await knex.raw(`
    UPDATE Accounts 
    SET work_email = NULL 
    WHERE work_email IS NOT NULL 
    AND work_email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$'
  `);

  // Now add the constraint
  await knex.raw(`
    ALTER TABLE Accounts 
    ADD CONSTRAINT check_work_email_format 
    CHECK (
      work_email IS NULL OR 
      work_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$'
    )
  `);

  // 2. Season date validations
  // Clean up any invalid date orders first
  await knex.raw(`
    UPDATE Seasons
    SET end_date = NULL
    WHERE start_date IS NOT NULL 
    AND end_date IS NOT NULL 
    AND start_date > end_date
  `);

  await knex.raw(`
    UPDATE Seasons
    SET signup_end_date = NULL
    WHERE signup_start_date IS NOT NULL 
    AND signup_end_date IS NOT NULL 
    AND signup_start_date >= signup_end_date
  `);

  await knex.raw(`
    ALTER TABLE Seasons
    ADD CONSTRAINT check_season_date_order
    CHECK (
      start_date IS NULL OR 
      end_date IS NULL OR 
      start_date <= end_date
    )
  `);

  await knex.raw(`
    ALTER TABLE Seasons
    ADD CONSTRAINT check_signup_dates
    CHECK (
      signup_start_date IS NULL OR 
      signup_end_date IS NULL OR 
      signup_start_date < signup_end_date
    )
  `);

  // 4. Fantasy budget validation
  // Clean up any negative budgets first
  await knex.raw(`
    UPDATE FantasyTeams
    SET budget_remaining = 0
    WHERE budget_remaining < 0
  `);

  await knex.raw(`
    ALTER TABLE FantasyTeams
    ADD CONSTRAINT check_budget_non_negative
    CHECK (budget_remaining >= 0)
  `);

  // 5. Player stats reasonableness
  await knex.raw(`
    ALTER TABLE PlayerStats
    ADD CONSTRAINT check_kills_non_negative
    CHECK (kills >= 0 AND deaths >= 0 AND assists >= 0)
  `);

  await knex.raw(`
    ALTER TABLE PlayerStats
    ADD CONSTRAINT check_adr_reasonable
    CHECK (adr >= 0 AND adr <= 500)
  `);

  // 6. Fantasy points consistency
  // Clean up any inconsistent point breakdowns first
  await knex.raw(`
    UPDATE FantasyTeamPlayers
    SET points_earned = individual_points + team_points + role_points
    WHERE points_earned != individual_points + team_points + role_points
  `);

  await knex.raw(`
    ALTER TABLE FantasyTeamPlayers
    ADD CONSTRAINT check_points_breakdown
    CHECK (
      points_earned = individual_points + team_points + role_points
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Helper to drop constraint safely (ignores errors if constraint doesn't exist)
  const dropConstraint = async (table: string, constraint: string) => {
    try {
      await knex.raw(`ALTER TABLE ${table} DROP CONSTRAINT ${constraint}`);
    } catch {
      // Constraint may not exist, which is fine for rollback
    }
  };

  await dropConstraint("Accounts", "check_work_email_format");
  await dropConstraint("Seasons", "check_season_date_order");
  await dropConstraint("Seasons", "check_signup_dates");
  await dropConstraint("FantasyTeams", "check_budget_non_negative");
  await dropConstraint("PlayerStats", "check_kills_non_negative");
  await dropConstraint("PlayerStats", "check_adr_reasonable");
  await dropConstraint("FantasyTeamPlayers", "check_points_breakdown");
}
