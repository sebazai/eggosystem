import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("Seasons")
    .where({ id: 17 })
    .update({ rulebook_url: "https://wiki.kanaliiga.fi/CS2/rulebook" });
}

export async function down(knex: Knex): Promise<void> {
  await knex("Seasons").where({ id: 17 }).update({ rulebook_url: null });
}
