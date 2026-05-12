import { type Knex } from "knex";

export const config = { transaction: false };

/**
 * Update table comments to document fantasy team total_points calculation
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE FantasyTeams COMMENT = 'Fantasy league teams. total_points is sum of ALL FantasyPointsLog entries (including removed players) for backward compatibility'`
  );

  await knex.raw(
    `ALTER TABLE FantasyTeamPlayers COMMENT = 'Players on fantasy teams. is_active tracks current roster; removed players (is_active=FALSE) still contribute to team total_points'`
  );

  await knex.raw(
    `ALTER TABLE FantasyPointsLog COMMENT = 'Detailed points history per match. Used to calculate team totals (includes both active and removed players)'`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE FantasyTeams COMMENT = 'Fantasy league teams'`);
  await knex.raw(
    `ALTER TABLE FantasyTeamPlayers COMMENT = 'Players on fantasy teams'`
  );
  await knex.raw(
    `ALTER TABLE FantasyPointsLog COMMENT = 'Detailed points history per match'`
  );
}
