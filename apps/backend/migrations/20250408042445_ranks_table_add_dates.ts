import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("SeasonPlayerRanks", function (table) {
    table.renameColumn("kukko_date", "rank_updated_at");
    table
      .timestamp("hours_updated_at")
      .nullable()
      .defaultTo(knex.raw("'1970-01-01 10:00:00'"));
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("SeasonPlayerRanks", function (table) {
    table.renameColumn("rank_updated_at", "kukko_date");
    table.dropColumn("hours_updated_at");
  });
}
