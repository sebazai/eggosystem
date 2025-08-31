import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("CasterUrls", function (table) {
    table.increments("id").primary().unsigned();
    table
      .integer("account_id")
      .unsigned()
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE")
      .notNullable();
    table.string("default_stream_url", 255).notNullable();
    table.timestamps(true, true);

    // Unique constraint - one default URL per account
    table.unique(["account_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("CasterUrls");
}
