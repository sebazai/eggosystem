import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table
      .enum("status", ["pending", "active"])
      .notNullable()
      .defaultTo("active");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("Organizations", (table) => {
    table.dropColumn("status");
  });
}
