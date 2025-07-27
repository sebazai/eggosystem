import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Set all current matches rows to status finished
  await knex("Matches").update({ status: "FINISHED" });
}

export async function down(knex: Knex): Promise<void> {
  // Set all current matches rows to status finished
  await knex("Matches").update({ status: null });
}
