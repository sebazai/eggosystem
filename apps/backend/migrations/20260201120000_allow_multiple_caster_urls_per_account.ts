import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Add non-unique index first so FK on account_id still has an index after we drop unique
  await knex.schema.alterTable("AccountCasterUrls", (table) => {
    table.index(["account_id"], "accountcasterurls_account_id_index");
  });
  await knex.schema.alterTable("AccountCasterUrls", (table) => {
    table.dropUnique(["account_id"]);
    table.unique(["account_id", "stream_url"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("AccountCasterUrls", (table) => {
    table.dropUnique(["account_id", "stream_url"]);
    table.unique(["account_id"]);
  });
  await knex.schema.alterTable("AccountCasterUrls", (table) => {
    table.dropIndex(["account_id"], "accountcasterurls_account_id_index");
  });
}
