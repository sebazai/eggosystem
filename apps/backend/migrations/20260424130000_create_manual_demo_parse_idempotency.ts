import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ManualDemoParseIdempotency", (table) => {
    table.bigIncrements("id").primary();
    table
      .integer("account_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("Accounts")
      .onDelete("CASCADE");
    table
      .integer("match_game_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("MatchGames")
      .onDelete("CASCADE");
    table.string("url_fingerprint", 64).notNullable();
    table.bigInteger("audit_log_id").nullable();
    table.timestamp("rmq_published_at").nullable();
    table.timestamp("completed_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["account_id", "match_game_id", "url_fingerprint"], {
      indexName: "unique_manual_demo_parse_dedup"
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ManualDemoParseIdempotency");
}
