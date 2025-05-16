import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("Roles").insert({
    role_name: "helpdesk"
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DELETE FROM Roles WHERE role_name = ?", ["helpdesk"]);
}
