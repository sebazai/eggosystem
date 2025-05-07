import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.boolean("terms_and_conditions_approved").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.dropColumn("terms_and_conditions_approved");
  });
}
