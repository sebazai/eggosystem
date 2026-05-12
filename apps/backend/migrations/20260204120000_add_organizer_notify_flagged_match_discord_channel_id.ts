import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table
      .string("organizer_notify_flagged_match_discord_channel_id", 255)
      .nullable();
  });
  await knex("Organizers").where("id", 1).update({
    organizer_notify_flagged_match_discord_channel_id: "694834348893012018"
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.dropColumn("organizer_notify_flagged_match_discord_channel_id");
  });
}
