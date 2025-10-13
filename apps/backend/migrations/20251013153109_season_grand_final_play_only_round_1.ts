import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.boolean("grand_final_round_one_only").defaultTo(false);
  });
  // Set season 16 grand_final_round_one_only to true
  await knex("Seasons")
    .where("id", 16)
    .update({ grand_final_round_one_only: true });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Seasons", (table) => {
    table.dropColumn("grand_final_round_one_only");
  });
}
