import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.string("discord_caster_applications_channel_id", 255).nullable();
    table.string("discord_caster_channel_id", 255).nullable();
  });
  await knex("Organizers").where("id", 1).update({
    discord_caster_applications_channel_id: "694834348893012018",
    discord_caster_channel_id: "612902579235586068"
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.dropColumn("discord_caster_applications_channel_id");
    table.dropColumn("discord_caster_channel_id");
  });
}
