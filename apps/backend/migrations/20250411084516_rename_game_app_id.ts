import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Games", (table) => {
    table.renameColumn("steam_app_id", "app_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Games", (table) => {
    table.renameColumn("app_id", "steam_app_id"); // Rollback
  });
}
