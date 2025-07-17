import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.string("calculus", 100).nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonPlayerRanks", (table) => {
    table.dropColumn("calculus");
  });
}
