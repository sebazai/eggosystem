import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Rename default_stream_url to stream_url
  await knex.schema.alterTable("AccountCasterUrls", function (table) {
    table.renameColumn("default_stream_url", "stream_url");
    // Add default boolean column to AccountCasterUrls
    table.boolean("is_default").defaultTo(false).notNullable();
  });
  // Set default to true for all existing records
  await knex.raw("UPDATE AccountCasterUrls SET is_default = true");
}

export async function down(knex: Knex): Promise<void> {
  // Rename stream_url to default_stream_url
  await knex.schema.alterTable("AccountCasterUrls", function (table) {
    table.renameColumn("stream_url", "default_stream_url");
    // Drop default boolean column
    table.dropColumn("is_default");
  });
}
