import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Set cs_hours to null for all rows where cs_hours is -1
  await knex("SeasonPlayerRanks")
    .where("cs_hours", -1)
    .update({ cs_hours: null });
  // Set cs_hours to default null instaed of -1
  await knex.raw(`
    ALTER TABLE SeasonPlayerRanks
    MODIFY COLUMN cs_hours INT NULL DEFAULT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Set cs_hours to -1 for all rows where cs_hours is null
  await knex("SeasonPlayerRanks")
    .where("cs_hours", null)
    .update({ cs_hours: -1 });
  // Set cs_hours to default -1 instead of null
  await knex.raw(`
    ALTER TABLE SeasonPlayerRanks
    MODIFY COLUMN cs_hours INT NOT NULL DEFAULT -1;
  `);
}
