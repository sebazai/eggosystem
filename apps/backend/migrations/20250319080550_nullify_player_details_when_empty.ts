import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // If full_name "" in SteamPlayers table set to null
  await knex("SteamPlayers").where("full_name", "").update({ full_name: null });
  await knex("SteamPlayers").where("email", "").update({ email: null });
  await knex("SteamPlayers")
    .where("work_email", "")
    .update({ work_email: null });
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
