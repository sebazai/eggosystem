import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // If player_name "" in Players table set to null
  await knex("Players").where("player_name", "").update({ player_name: null });
  await knex("Players").where("email", "").update({ email: null });
  await knex("Players").where("work_email", "").update({ work_email: null });
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
