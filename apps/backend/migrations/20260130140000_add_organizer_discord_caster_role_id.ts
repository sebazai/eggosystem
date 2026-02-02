import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.string("discord_caster_role_id", 255).nullable();
  });
  await knex("Organizers").where("id", 1).update({
    discord_caster_role_id: "1171115460239036557"
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizers", (table) => {
    table.dropColumn("discord_caster_role_id");
  });
}
