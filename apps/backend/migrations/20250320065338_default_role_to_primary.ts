import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 4	role	enum('primary', 'substitute')	utf8mb4_general_ci		No	None
  // SeasonTeamPlayers enum should default to 'primary'
  await knex.schema.alterTable("SeasonTeamPlayers", (table) => {
    table.enum("role", ["primary", "substitute"]).defaultTo("primary").alter();
  });
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
