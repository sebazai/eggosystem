import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("PlayerStats", (table) => {
    table.dropColumn("team");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table("PlayerStats", (table) => {
    table.integer("team").defaultTo(null);
  });
}
