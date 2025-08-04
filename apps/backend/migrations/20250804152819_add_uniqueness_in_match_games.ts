import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.unique("demofile");
    table.unique(["match_id", "map_id", "map_order"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("MatchGames", (table) => {
    table.dropUnique(["demofile"]);
    table.dropUnique(["match_id", "map_id", "map_order"]);
  });
}
