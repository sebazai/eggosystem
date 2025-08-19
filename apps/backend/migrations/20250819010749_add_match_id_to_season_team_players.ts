import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.integer("match_id").unsigned().nullable();
    table
      .foreign("match_id")
      .references("id")
      .inTable("Matches")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.dropForeign("match_id");
    table.dropColumn("match_id");
  });
}
