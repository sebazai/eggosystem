import type { Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE Seasons
    MODIFY COLUMN platform ENUM('kanaliiga', 'esportal', 'faceit', 'popflash', 'krafton')
    NOT NULL DEFAULT 'kanaliiga'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `UPDATE Seasons SET platform = 'kanaliiga' WHERE platform = 'krafton'`
  );
  await knex.raw(`
    ALTER TABLE Seasons
    MODIFY COLUMN platform ENUM('kanaliiga', 'esportal', 'faceit', 'popflash')
    NOT NULL DEFAULT 'kanaliiga'
  `);
}
