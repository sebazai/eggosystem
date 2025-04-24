import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("SeasonTeamRegistrations", (table) => {
    table.dropColumn("defects");
    table.dropColumn("ticket");
    table.dropColumn("notification_sent");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table("SeasonTeamRegistrations", (table) => {
    table.boolean("notification_sent").notNullable().defaultTo(false);
    table.string("ticket", 50);
    table.boolean("approved").notNullable().defaultTo(false);
  });
}
