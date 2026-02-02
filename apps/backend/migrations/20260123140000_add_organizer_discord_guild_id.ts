import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.string("discord_guild_id", 255).nullable();
  });
  await knex("Organizers")
    .where("id", 1)
    .update({ discord_guild_id: "468873146787954689" });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.dropColumn("discord_guild_id");
  });
}
