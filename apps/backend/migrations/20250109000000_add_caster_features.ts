import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("Roles").insert({
    role_name: "caster"
  });

  await knex.schema.alterTable("Reservations", (table) => {
    table
      .integer("account_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Reservations", (table) => {
    table.dropForeign("account_id");
    table.dropColumn("account_id");
  });

  await knex("Roles").where("role_name", "caster").del();
}
