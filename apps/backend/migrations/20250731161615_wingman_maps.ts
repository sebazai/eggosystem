import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("Maps").insert([
    {
      name: "Dogtown"
    },
    {
      name: "Brewery"
    }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex("Maps").whereIn("name", ["Dogtown", "Brewery"]).delete();
}
