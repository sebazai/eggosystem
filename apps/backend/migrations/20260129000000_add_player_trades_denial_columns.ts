import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.tinyint("trade_denied", 1).notNullable().defaultTo(0);
    table.tinyint("trade_timeout", 1).notNullable().defaultTo(0);
    table.bigInteger("denial_time").unsigned().nullable();
    table.bigInteger("trade_window").unsigned().nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("PlayerTrades", (table) => {
    table.dropColumn("trade_denied");
    table.dropColumn("trade_timeout");
    table.dropColumn("denial_time");
    table.dropColumn("trade_window");
  });
}
