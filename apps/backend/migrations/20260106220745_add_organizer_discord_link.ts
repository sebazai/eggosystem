import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.string("discord_link").nullable();
  });
  await knex.raw(`
    UPDATE Organizers
    SET discord_link = 'https://discord.gg/UFetjhv' WHERE name = 'Kanaliiga'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.dropColumn("discord_link");
  });
}
