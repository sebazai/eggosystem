import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.integer("approved_by").unsigned().nullable();
    table
      .foreign("approved_by")
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL");
    table.integer("manual_validity_check_by").unsigned().nullable();
    table.boolean("manual_validity_check_override").nullable();
    table
      .foreign("manual_validity_check_by")
      .references("id")
      .inTable("Accounts")
      .onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamRegistrations", (table) => {
    table.dropForeign("approved_by");
    table.dropColumn("approved_by");
    table.dropForeign("manual_validity_check_by");
    table.dropColumn("manual_validity_check_by");
    table.dropColumn("manual_validity_check_override");
  });
}
