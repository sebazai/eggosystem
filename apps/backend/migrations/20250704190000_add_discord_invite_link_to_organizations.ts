import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.string("discord_invite_link", 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.dropColumn("discord_invite_link");
  });
}
