import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Ensure that Organization table column `logo` default is nologo.svg
  await knex.schema.alterTable("Organizations", (table) => {
    table.string("website").notNullable().alter();
    table.string("organization_code").notNullable().alter();
    table.string("logo").defaultTo("nologo.svg").notNullable().alter();
    table.string("country").defaultTo("Finland").notNullable().alter();
  });
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
