import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Email format validation
  await knex.raw(`
    ALTER TABLE Accounts 
    ADD CONSTRAINT check_work_email_format 
    CHECK (
      work_email IS NULL OR 
      work_email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$'
    )
  `);

  // 2. Season date validations
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
  await knex.raw(`
    ALTER TABLE FantasyTeamPlayers
    ADD CONSTRAINT check_points_breakdown
    CHECK (
      points_earned = individual_points + team_points + role_points
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE Accounts DROP CONSTRAINT check_work_email_format`
  );
  await knex.raw(`ALTER TABLE Seasons DROP CONSTRAINT check_season_date_order`);
  await knex.raw(`ALTER TABLE Seasons DROP CONSTRAINT check_signup_dates`);
  await knex.raw(
    `ALTER TABLE FantasyTeams DROP CONSTRAINT check_budget_non_negative`
  );
  await knex.raw(
    `ALTER TABLE PlayerStats DROP CONSTRAINT check_kills_non_negative`
  );
  await knex.raw(
    `ALTER TABLE PlayerStats DROP CONSTRAINT check_adr_reasonable`
  );
  await knex.raw(
    `ALTER TABLE FantasyTeamPlayers DROP CONSTRAINT check_points_breakdown`
  );
}
