import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.string("rulebook_url", 500).nullable();
    table.string("discord_link", 500).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.dropColumn("rulebook_url");
    table.dropColumn("discord_link");
  });
}
