import { type Knex } from "knex";

export const config = { transaction: false };

export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable("KillLogs", "PlayerKillLogs");
  await knex.raw(
    `ALTER TABLE PlayerKillLogs COMMENT = 'Player kill events per match game'`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE PlayerKillLogs COMMENT = ''`);
  await knex.schema.renameTable("PlayerKillLogs", "KillLogs");
}
