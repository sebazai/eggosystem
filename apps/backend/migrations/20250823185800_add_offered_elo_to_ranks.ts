import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("SeasonPlayerRanks", function (table) {
    table
      .integer("offered_elo")
      .nullable()
      .comment("Original offered ELO value before stabilization");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("SeasonPlayerRanks", function (table) {
    table.dropColumn("offered_elo");
  });
}
